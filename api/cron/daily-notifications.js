// Vercel Cron (하루 1회): 시간 기준 알림 생성 → 미발송 재발송.
import { dispatchOne, MAX_ATTEMPTS } from "../_lib/dispatchNotification.js";

const RETRY_WINDOW_MS = 24 * 60 * 60 * 1000;
const RETRY_LIMIT = 50;

export async function runDaily({ deps, cronSecret, authHeader }) {
  if (!deps.supabaseUrl || !deps.serviceKey || !cronSecret) {
    return { status: 200, body: { skipped: "not_configured" } };
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return { status: 401, body: { error: "unauthorized" } };
  }
  const rpc = await deps.fetch(`${deps.supabaseUrl}/rest/v1/rpc/tour_generate_daily_alerts`, {
    method: "POST",
    headers: {
      apikey: deps.serviceKey,
      Authorization: `Bearer ${deps.serviceKey}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  // 마이그레이션 미적용이면 함수가 없어 404가 온다 → 조용히 건너뜀
  if (rpc.status === 404) return { status: 200, body: { skipped: "not_configured" } };
  if (!rpc.ok) return { status: 500, body: { error: `알림 생성 실패: ${rpc.status}` } };
  const generated = await rpc.json();

  // 재발송: 실제 실패 건만 (not_configured 제외), 오래된 순, 최대 50건
  const since = new Date(deps.now() - RETRY_WINDOW_MS).toISOString();
  const query = [
    "push_sent_at=is.null",
    `push_attempts=lt.${MAX_ATTEMPTS}`,
    "or=(push_error.is.null,push_error.neq.not_configured)",
    `created_at=gte.${since}`,
    "order=created_at.asc",
    "select=id",
    `limit=${RETRY_LIMIT}`,
  ].join("&");
  const listRes = await deps.fetch(`${deps.supabaseUrl}/rest/v1/tour_diver_notifications?${query}`, {
    headers: { apikey: deps.serviceKey, Authorization: `Bearer ${deps.serviceKey}` },
  });
  if (!listRes.ok) return { status: 500, body: { error: `재발송 대상 조회 실패: ${listRes.status}` } };
  const pending = await listRes.json();

  const results = [];
  for (const row of pending) results.push(await dispatchOne(deps, row.id));
  return { status: 200, body: { generated, retried: results.length, results } };
}

export default async function handler(req, res) {
  const deps = {
    supabaseUrl: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    fetch: globalThis.fetch,
    now: () => Date.now(),
  };
  const out = await runDaily({
    deps,
    cronSecret: process.env.CRON_SECRET,
    authHeader: req.headers.authorization,
  });
  res.status(out.status).json(out.body);
}
