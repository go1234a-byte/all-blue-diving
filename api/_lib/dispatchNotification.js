// 알림 발송 공통 로직. 웹훅(dispatch)과 일일 Cron 재발송이 같이 쓴다.
// 원자적 선점: push_sent_at null, (push_claimed_at null 또는 10분 경과), push_attempts < 3 인 행만 PATCH로 가져간다.

export const CLAIM_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 3;

function rest(deps, path, init = {}) {
  return deps.fetch(`${deps.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: deps.serviceKey,
      Authorization: `Bearer ${deps.serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export async function loadNotification(deps, id) {
  const res = await rest(deps, `tour_diver_notifications?id=eq.${encodeURIComponent(id)}&select=*`);
  if (!res.ok) throw new Error(`알림 조회 실패: ${res.status}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

// 조건을 모두 만족하는 행만 갱신된다. 반환된 행이 있으면 이 호출이 선점에 성공한 것이다.
export async function claimNotification(deps, id) {
  const staleBefore = new Date(deps.now() - CLAIM_TTL_MS).toISOString();
  const query = [
    `id=eq.${encodeURIComponent(id)}`,
    "push_sent_at=is.null",
    `push_attempts=lt.${MAX_ATTEMPTS}`,
    `or=(push_claimed_at.is.null,push_claimed_at.lt.${staleBefore})`,
  ].join("&");
  const res = await rest(deps, `tour_diver_notifications?${query}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ push_claimed_at: new Date(deps.now()).toISOString() }),
  });
  if (!res.ok) throw new Error(`선점 실패: ${res.status}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

async function patch(deps, id, body) {
  const res = await rest(deps, `tour_diver_notifications?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`알림 상태 기록 실패: ${res.status}`);
}

// send-push 응답 해석
// - 둘 다 attempted=false: 설정 미비 → not_configured
// - attempted이지만 total=0: 등록된 기기 없음 → no_devices (발송 완료로 기록, 재발송 안 함)
// - total>0인데 sent=0: 전부 실패 → failed (재시도 대상)
export function interpretSendPush(status, json) {
  if (status < 200 || status >= 300) return { outcome: "failed", error: `send-push HTTP ${status}` };
  const parts = [json?.fcm, json?.webPush].filter((p) => p?.attempted === true);
  if (parts.length === 0) return { outcome: "not_configured" };
  const total = parts.reduce((n, p) => n + (p.total ?? 0), 0);
  const sent = parts.reduce((n, p) => n + (p.sent ?? 0), 0);
  if (total === 0) return { outcome: "no_devices" };
  if (sent === 0) return { outcome: "failed", error: "모든 기기 발송 실패" };
  return { outcome: "sent" };
}

export async function callSendPush(deps, row) {
  const res = await deps.fetch(`${deps.supabaseUrl}/functions/v1/send-push`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${deps.serviceKey}`,
      apikey: deps.serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profileId: row.diver_id, title: row.title, body: row.body, url: row.url ?? undefined }),
  });
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  return interpretSendPush(res.status, json);
}

// 한 건을 선점 → 발송 → 결과 기록. 선점에 실패하면 발송하지 않는다.
export async function dispatchOne(deps, id) {
  const row = await claimNotification(deps, id);
  if (!row) return { id, status: "skipped" };
  let result;
  try {
    result = await callSendPush(deps, row);
  } catch (err) {
    result = { outcome: "failed", error: err instanceof Error ? err.message : String(err) };
  }
  if (result.outcome === "sent" || result.outcome === "no_devices") {
    await patch(deps, id, {
      push_sent_at: new Date(deps.now()).toISOString(),
      push_claimed_at: null,
      push_error: result.outcome === "no_devices" ? "no_devices" : null,
    });
  } else if (result.outcome === "not_configured") {
    await patch(deps, id, { push_claimed_at: null, push_error: "not_configured" });
  } else {
    await patch(deps, id, {
      push_attempts: (row.push_attempts ?? 0) + 1,
      push_claimed_at: null,
      push_error: result.error,
    });
  }
  return { id, status: result.outcome };
}
