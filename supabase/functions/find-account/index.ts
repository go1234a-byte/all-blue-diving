// ALL BLUE — 아이디(이메일) 찾기.
//
// 로그인 화면에서 세션 없이 호출된다. 이름 + 휴대폰 번호로 profiles를 조회해
// 일치하는 계정의 이메일을 마스킹해서 돌려준다.
//
// 배포: verify_jwt = false (로그인 전 호출).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const digits = (s: string) => s.replace(/\D/g, "");

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}${"*".repeat(Math.max(3, local.length - head.length))}@${domain}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, phone } = await req.json();
    if (!name?.trim() || !phone?.trim()) {
      return json({ results: [] }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id, role, name, phone")
      .eq("name", name.trim());
    if (error) {
      console.error("[find-account] profiles 조회 실패:", error);
      return json({ results: [] }, 500);
    }

    const target = digits(phone);
    const matches = (profiles ?? []).filter((p) => p.phone && digits(p.phone) === target);

    const results: { role: string; maskedEmail: string }[] = [];
    for (const m of matches) {
      const { data: u } = await admin.auth.admin.getUserById(m.id);
      const email = u?.user?.email;
      if (email) results.push({ role: m.role ?? "diver", maskedEmail: maskEmail(email) });
    }

    return json({ results });
  } catch (err) {
    console.error("[find-account] 처리 중 에러:", err);
    return json({ results: [], error: err instanceof Error ? err.message : "unknown error" }, 500);
  }
});
