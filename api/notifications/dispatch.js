// Supabase Database Webhook(tour_diver_notifications INSERT) 진입점.
// payload 내용은 신뢰하지 않고 id만 받아 DB에서 다시 읽어 발송한다.
import { timingSafeEqual } from "node:crypto";
import { dispatchOne, loadNotification } from "../_lib/dispatchNotification.js";

function sameSecret(given, expected) {
  if (typeof given !== "string" || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function handleDispatch({ headers, body, deps, secret }) {
  if (!secret || !deps.supabaseUrl || !deps.serviceKey) {
    return { status: 200, body: { skipped: "not_configured" } };
  }
  if (!sameSecret(headers["x-notify-secret"], secret)) {
    return { status: 401, body: { error: "unauthorized" } };
  }
  const id = body?.record?.id ?? body?.id;
  if (!id) return { status: 400, body: { error: "id가 필요합니다." } };
  const row = await loadNotification(deps, id);
  if (!row) return { status: 404, body: { error: "not found" } };
  const result = await dispatchOne(deps, row.id);
  return { status: 200, body: result };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  const deps = {
    supabaseUrl: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    fetch: globalThis.fetch,
    now: () => Date.now(),
  };
  const out = await handleDispatch({
    headers: req.headers,
    body: req.body,
    deps,
    secret: process.env.NOTIFY_WEBHOOK_SECRET,
  });
  res.status(out.status).json(out.body);
}
