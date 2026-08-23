// ALL BLUE — 특정 프로필(강사/다이버)에게 트랜잭션 이메일(예약 확정/취소 등)을 보낸다.
//
// Resend(https://resend.com)를 사용한다. RESEND_API_KEY가 없으면 조용히 스킵하고 200을
// 반환한다 — 클라이언트(src/lib/email.ts의 sendEmailToProfile)는 이 경우를 정상 상태로
// 취급해 콘솔 경고만 남기고 넘어가도록 작성되어 있다.
//
// 설정 방법:
//   1. resend.com 가입 후 API 키 발급 → Supabase 시크릿 "RESEND_API_KEY"로 등록.
//   2. (선택) Resend에서 발신 도메인(allbluedive.com 등)을 인증하면 RESEND_FROM 시크릿을
//      "ALL BLUE <notify@allbluedive.com>" 같은 형식으로 등록 — 미설정 시 Resend 샌드박스
//      발신 주소(onboarding@resend.dev)를 쓰는데, 이건 Resend 계정 소유자 본인 이메일로만
//      발송 가능하다(도메인 인증 전 임시용).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailBody {
  profileId?: string;
  // 중재방 대화록을 임의 주소(변호사·보험사 등 시스템에 가입되지 않은 수신자)로 보내는
  // 용도. profileId 조회 없이 to를 직접 쓰되, 호출자가 해당 강사 본인이거나 관리자인지
  // instructorId로 검증한다 — 아니면 이 엔드포인트가 임의 발신 릴레이로 악용될 수 있다.
  to?: string;
  instructorId?: string;
  subject: string;
  body: string;
}

function renderHtml(subject: string, body: string): string {
  const safeBody = body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  return `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <p style="font-size: 13px; color: #1565C0; font-weight: 700; margin: 0 0 16px;">ALL BLUE</p>
    <h1 style="font-size: 18px; margin: 0 0 16px;">${subject}</h1>
    <p style="font-size: 14px; line-height: 1.6; color: #333;">${safeBody}</p>
    <p style="font-size: 11px; color: #999; margin-top: 32px;">본 메일은 ALL BLUE에서 발생한 활동에 대한 자동 안내입니다.</p>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, to, instructorId, subject, body }: SendEmailBody = await req.json();
    if ((!profileId && !to) || !subject || !body) {
      return new Response(JSON.stringify({ error: "profileId 또는 to, 그리고 subject/body는 필수입니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.warn("[send-email] RESEND_API_KEY 미설정 — 발송 스킵 (설정 전이라면 정상)");
      return new Response(JSON.stringify({ skipped: true, reason: "email not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const from = Deno.env.get("RESEND_FROM") ?? "ALL BLUE <onboarding@resend.dev>";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let recipient: string;
    if (to) {
      // 임의 주소 발송 모드 — 호출자가 해당 강사 본인이거나 관리자인지, 호출자의 JWT로
      // 직접 검증한다(서비스 롤로 바로 신뢰하지 않음).
      if (!instructorId) {
        return new Response(JSON.stringify({ error: "to를 쓸 때는 instructorId가 필수입니다." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const authHeader = req.headers.get("Authorization") ?? "";
      const supabaseAsCaller = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } },
      );
      const [adminResult, ownsResult] = await Promise.all([
        supabaseAsCaller.rpc("is_admin"),
        supabaseAsCaller.rpc("owns_instructor", { p_instructor_id: instructorId }),
      ]);
      if (!adminResult.data && !ownsResult.data) {
        return new Response(
          JSON.stringify({
            error: "이 강사의 대화록을 발송할 권한이 없습니다.",
            debug: {
              hasAuthHeader: !!authHeader,
              authHeaderPrefix: authHeader.slice(0, 20),
              adminError: adminResult.error,
              ownsError: ownsResult.error,
              adminData: adminResult.data,
              ownsData: ownsResult.data,
            },
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      recipient = to;
    } else {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileId!);
      if (userError || !userData?.user?.email) {
        console.warn("[send-email] 이메일 조회 실패:", userError?.message ?? "no email on user");
        return new Response(JSON.stringify({ skipped: true, reason: "no email for profile" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      recipient = userData.user.email;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: recipient,
        subject,
        html: renderHtml(subject, body),
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[send-email] Resend 발송 실패:", res.status, errText);
      return new Response(JSON.stringify({ error: `Resend 발송 실패: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-email] 처리 중 에러:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
