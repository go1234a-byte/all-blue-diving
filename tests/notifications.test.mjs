import { test } from "node:test";
import assert from "node:assert/strict";
import { dispatchOne, MAX_ATTEMPTS, CLAIM_TTL_MS } from "../api/_lib/dispatchNotification.js";
import { handleDispatch } from "../api/notifications/dispatch.js";
import { runDaily } from "../api/cron/daily-notifications.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

// PostgREST 조건(id·push_sent_at·push_attempts·or 선점 조건)을 흉내 낸 가짜 저장소
function makeFake({ rows, sendPush, rpcStatus = 200 }) {
  const calls = { sendPush: 0 };
  let clock = 1_800_000_000_000;
  const deps = {
    supabaseUrl: "https://fake.supabase.test",
    serviceKey: "service-key",
    now: () => clock,
    fetch: async (url, init = {}) => {
      const u = new URL(url);
      const method = init.method ?? "GET";
      if (u.pathname.startsWith("/rest/v1/rpc/")) {
        return rpcStatus === 200 ? json(0) : json({ code: "PGRST202", message: "not found" }, rpcStatus);
      }
      if (u.pathname.startsWith("/functions/v1/send-push")) {
        calls.sendPush += 1;
        const r = await sendPush(JSON.parse(init.body));
        return json(r.body, r.status);
      }
      if (u.pathname === "/rest/v1/tour_diver_notifications") {
        if (method === "PATCH") {
          const sp = u.searchParams;
          const matched = rows.filter((r) => {
            const id = sp.get("id")?.replace("eq.", "");
            if (id && r.id !== id) return false;
            if (sp.get("push_sent_at") === "is.null" && r.push_sent_at != null) return false;
            const lt = sp.get("push_attempts")?.match(/^lt\.(\d+)$/);
            if (lt && (r.push_attempts ?? 0) >= Number(lt[1])) return false;
            const or = sp.get("or");
            if (or) {
              const iso = or.match(/push_claimed_at\.lt\.(.+)\)$/)?.[1];
              const free = r.push_claimed_at == null || (iso && new Date(r.push_claimed_at) < new Date(iso));
              if (!free) return false;
            }
            return true;
          });
          for (const r of matched) Object.assign(r, JSON.parse(init.body));
          const wantRows = init.headers?.Prefer === "return=representation";
          return json(wantRows ? matched.map((r) => ({ ...r })) : []);
        }
        const id = u.searchParams.get("id")?.replace("eq.", "");
        return json(rows.filter((r) => r.id === id).map((r) => ({ ...r })));
      }
      throw new Error(`예상하지 못한 요청: ${method} ${url}`);
    },
  };
  return { deps, calls, advance: (ms) => { clock += ms; } };
}

const sentOk = { status: 200, body: { fcm: { attempted: true, sent: 1, total: 1 }, webPush: { attempted: false, sent: 0, total: 0 } } };
const notConfigured = { status: 200, body: { fcm: { attempted: false, sent: 0, total: 0 }, webPush: { attempted: false, sent: 0, total: 0 } } };
const serverError = { status: 500, body: { error: "boom" } };
const baseRow = () => ({ id: "n1", diver_id: "d1", title: "t", body: "b", url: "/x", push_sent_at: null, push_claimed_at: null, push_attempts: 0, push_error: null });

test("웹훅: 시크릿 불일치면 401, 발송하지 않음", async () => {
  const fake = makeFake({ rows: [baseRow()], sendPush: async () => sentOk });
  const out = await handleDispatch({ headers: { "x-notify-secret": "wrong" }, body: { record: { id: "n1" } }, deps: fake.deps, secret: "right" });
  assert.equal(out.status, 401);
  assert.equal(fake.calls.sendPush, 0);
});

test("웹훅: 시크릿이 맞으면 id로 DB를 다시 읽어 발송", async () => {
  const rows = [baseRow()];
  const fake = makeFake({ rows, sendPush: async () => sentOk });
  const out = await handleDispatch({ headers: { "x-notify-secret": "right" }, body: { record: { id: "n1", title: "조작됨" } }, deps: fake.deps, secret: "right" });
  assert.equal(out.status, 200);
  assert.equal(out.body.status, "sent");
  assert.equal(rows[0].title, "t", "payload의 내용이 아니라 DB 값으로 발송해야 함");
  assert.notEqual(rows[0].push_sent_at, null);
});

test("선점 경쟁: 동시에 두 번 호출해도 발송은 한 번", async () => {
  const rows = [baseRow()];
  const fake = makeFake({ rows, sendPush: async () => sentOk });
  const [a, b] = await Promise.all([dispatchOne(fake.deps, "n1"), dispatchOne(fake.deps, "n1")]);
  assert.equal(fake.calls.sendPush, 1);
  assert.deepEqual([a.status, b.status].sort(), ["sent", "skipped"]);
});

test("설정 미비: 실제 발송 없이 200이면 not_configured로 기록, push_sent_at은 비움", async () => {
  const rows = [baseRow()];
  const fake = makeFake({ rows, sendPush: async () => notConfigured });
  const out = await dispatchOne(fake.deps, "n1");
  assert.equal(out.status, "not_configured");
  assert.equal(rows[0].push_error, "not_configured");
  assert.equal(rows[0].push_sent_at, null);
  assert.equal(rows[0].push_attempts, 0, "설정 미비는 실패 횟수로 세지 않음");
});

test("3회 실패 후 중단: 네 번째 시도는 선점되지 않고 send-push를 부르지 않음", async () => {
  const rows = [baseRow()];
  const fake = makeFake({ rows, sendPush: async () => serverError });
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const r = await dispatchOne(fake.deps, "n1");
    assert.equal(r.status, "failed");
    fake.advance(CLAIM_TTL_MS + 1000);
  }
  assert.equal(rows[0].push_attempts, MAX_ATTEMPTS);
  assert.equal(rows[0].push_claimed_at, null);
  const after = await dispatchOne(fake.deps, "n1");
  assert.equal(after.status, "skipped");
  assert.equal(fake.calls.sendPush, MAX_ATTEMPTS);
});

test("Cron: 시크릿 불일치면 401", async () => {
  const fake = makeFake({ rows: [], sendPush: async () => sentOk });
  const out = await runDaily({ deps: fake.deps, cronSecret: "c", authHeader: "Bearer nope" });
  assert.equal(out.status, 401);
});

test("설정 미지정 또는 마이그레이션 미적용이면 500이 아니라 200 skipped", async () => {
  const noEnv = makeFake({ rows: [baseRow()], sendPush: async () => sentOk });
  const noEnvDeps = { ...noEnv.deps, supabaseUrl: "", serviceKey: "" };
  const webhook = await handleDispatch({ headers: { "x-notify-secret": "s" }, body: { record: { id: "n1" } }, deps: noEnvDeps, secret: "" });
  assert.deepEqual([webhook.status, webhook.body], [200, { skipped: "not_configured" }]);
  const cron = await runDaily({ deps: noEnvDeps, cronSecret: "", authHeader: "Bearer x" });
  assert.deepEqual([cron.status, cron.body], [200, { skipped: "not_configured" }]);
  assert.equal(noEnv.calls.sendPush, 0);

  const noRpc = makeFake({ rows: [], sendPush: async () => sentOk, rpcStatus: 404 });
  const res = await runDaily({ deps: noRpc.deps, cronSecret: "c", authHeader: "Bearer c" });
  assert.deepEqual([res.status, res.body], [200, { skipped: "not_configured" }]);
});
