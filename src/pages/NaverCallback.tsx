import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const NAVER_STATE_STORAGE_KEY = "allblue-naver-oauth-state";

/**
 * 네이버 로그인 완료 후 돌아오는 페이지. SocialAuthButtons.tsx의 handleNaverLogin이
 * 발급한 state를 sessionStorage와 대조해 CSRF를 막고, 진짜 요청이면 아래 Edge Function으로
 * code를 넘겨 매직링크 토큰을 받아 supabase.auth.verifyOtp()로 실제 세션을 만든다. 이후
 * 흐름(신규 유저 → /complete-profile)은 RootLayout의 기존 가드가 그대로 처리한다.
 */
export default function NaverCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const naverError = searchParams.get("error_description") || searchParams.get("error");
      const storedState = window.sessionStorage.getItem(NAVER_STATE_STORAGE_KEY);
      window.sessionStorage.removeItem(NAVER_STATE_STORAGE_KEY);

      if (naverError) {
        setError(naverError);
        return;
      }
      if (!code || !state || !storedState || state !== storedState) {
        setError("로그인 요청이 유효하지 않습니다. 다시 시도해주세요.");
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("naver-oauth-exchange", {
          body: { code, state, redirectUri: `${window.location.origin}/naver-callback` },
        });
        if (fnError || !data?.tokenHash) {
          throw new Error(data?.error || fnError?.message || "네이버 로그인 처리에 실패했습니다.");
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.tokenHash,
          type: "magiclink",
        });
        if (verifyError) throw verifyError;

        navigate("/", { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "네이버 로그인 처리에 실패했습니다.");
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6 text-center">
      {error ? (
        <>
          <p className="text-sm font-medium text-destructive">{error}</p>
          <button type="button" className="text-sm text-primary underline" onClick={() => navigate("/auth", { replace: true })}>
            로그인 화면으로 돌아가기
          </button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">네이버 로그인 처리 중...</p>
      )}
    </div>
  );
}
