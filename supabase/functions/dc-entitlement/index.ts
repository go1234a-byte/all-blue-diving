// ALL BLUE — DiveComputer 허용 판정.
//
// DiveComputer 앱이 투어앱 계정(이메일·비밀번호)으로 로그인한 뒤 호출한다.
// 응답: { entitled: boolean, validUntil: "yyyy-MM-dd" | null, reason }
//   - validUntil null + entitled true = 평생 허용 (관리자)
//   - 허용 판정은 여기서만 한다. 클라이언트는 값을 믿을 뿐 스스로 정하지 않는다.
//
// 허용 순서
//   1. ADMIN_EMAILS에 있는 메일                       → 평생 (reason: "admin")
//   2. app_metadata.dc_until >= 오늘(KST)            → 그 날짜까지 (reason: "grant")
//   3. 취소되지 않은 확정 예약(confirmed)의 투어 기간 → 시작 2일 전 ~ 종료 2일 후 (reason: "booking")
//
// app_metadata.dc_until은 관리자만 Supabase 대시보드(Authentication > Users)에서 설정한다.
// 예: { "dc_until": "2026-10-14" } (1주), "2026-11-07" (1개월), "2027-10-07" (1년).
//
// 배포: verify_jwt = false (함수 안에서 전달된 토큰을 직접 검증한다). delete-account와 같은 방식.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAY_MS = 86_400_000;
const BOOKING_PAD_DAYS = 2;

/** 평생 허용되는 관리자 메일. 빈 칸은 나중에 메일을 넣을 자리다 (빈 문자열은 무시). */
const ADMIN_EMAILS: string[] = [
  "go1234a@gmail.com",
  "",
  "",
  "",
];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** 오늘 날짜를 KST 기준 "yyyy-MM-dd"로. */
function todayKst(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
}

/** "yyyy-MM-dd" + n일 (UTC 기준 날짜 연산, 날짜만 다룬다). */
function addDays(day: string, n: number): string {
  const t = Date.parse(day + "T00:00:00Z") + n * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ error: "인증 토큰이 없습니다." }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: "세션이 유효하지 않습니다." }, 401);
    const user = userData.user;
    const today = todayKst();

    // 1. 관리자 메일 → 평생
    const mail = (user.email ?? "").trim().toLowerCase();
    const adminMails = ADMIN_EMAILS.map((m) => m.trim().toLowerCase()).filter((m) => m !== "");
    if (mail && adminMails.includes(mail)) {
      return json({ entitled: true, validUntil: null, reason: "admin" });
    }

    // 2. 관리자가 지정한 기간
    const dcUntil = (user.app_metadata as Record<string, unknown> | undefined)?.dc_until;
    if (typeof dcUntil === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dcUntil) && dcUntil >= today) {
      return json({ entitled: true, validUntil: dcUntil, reason: "grant" });
    }

    // 3. 확정 예약의 투어 기간 (시작 2일 전 ~ 종료 2일 후)
    const { data: bookings, error: bookingErr } = await admin
      .from("bookings")
      .select("status, tours(start_date, end_date, cancelled_at)")
      .eq("diver_id", user.id)
      .eq("status", "confirmed");
    if (bookingErr) return json({ error: "예약을 확인하지 못했어요." }, 500);

    let validUntil: string | null = null;
    for (const row of bookings ?? []) {
      const tour = (row as { tours?: { start_date: string; end_date: string; cancelled_at: string | null } | null }).tours;
      if (!tour || tour.cancelled_at) continue;
      const from = addDays(tour.start_date, -BOOKING_PAD_DAYS);
      const to = addDays(tour.end_date, BOOKING_PAD_DAYS);
      if (today >= from && today <= to && (!validUntil || to > validUntil)) validUntil = to;
    }
    if (validUntil) return json({ entitled: true, validUntil, reason: "booking" });

    return json({ entitled: false, validUntil: null, reason: "none" });
  } catch (e) {
    console.error("[dc-entitlement]", e);
    return json({ error: "허용 여부를 확인하지 못했어요." }, 500);
  }
});
