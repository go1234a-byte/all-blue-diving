import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID as string | undefined;
const NAVER_STATE_STORAGE_KEY = "allblue-naver-oauth-state";

/**
 * SNS 간편 로그인 버튼. 카카오/구글은 Supabase가 기본 지원하는 provider라 signInWithOAuth로
 * 바로 붙는다 — Supabase 대시보드(Authentication > Providers)에 각 앱 키/시크릿을 등록해야
 * 실제로 동작한다(등록 전까지는 Supabase가 에러를 돌려주고 아래 catch에서 안내 토스트를 띄운다).
 * 네이버는 Supabase 기본 지원 provider가 아니라서, 네이버 인가 화면으로 직접 보낸 뒤
 * /naver-callback 페이지 + naver-oauth-exchange Edge Function을 거쳐 세션을 만드는 커스텀
 * OAuth 브릿지를 쓴다(NaverCallback.tsx 참고). VITE_NAVER_CLIENT_ID가 없으면 버튼이
 * 비활성화된 안내만 보여준다.
 * 최초 로그인 시 profiles row가 없으면 RootLayout이 /complete-profile로 보내 추가 정보를 받는다.
 */
export function SocialAuthButtons() {
  const { toast } = useToast();

  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast({
        title: "카카오 로그인에 실패했습니다",
        description: error.message,
        variant: "destructive",
      });
    }
    // 성공 시 카카오 로그인 화면으로 브라우저가 이동한다(리다이렉트) — 별도 처리 불필요.
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast({
        title: "Google 로그인에 실패했습니다",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNaverLogin = () => {
    if (!NAVER_CLIENT_ID) {
      toast({
        title: "네이버 간편 로그인은 준비 중입니다",
        description: "이메일/비밀번호로 회원가입 후 이용해주세요.",
      });
      return;
    }
    const state = crypto.randomUUID();
    window.sessionStorage.setItem(NAVER_STATE_STORAGE_KEY, state);
    const redirectUri = `${window.location.origin}/naver-callback`;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: NAVER_CLIENT_ID,
      redirect_uri: redirectUri,
      state,
    });
    window.location.href = `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs font-medium text-muted-foreground">간편 회원가입 / 로그인</p>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleKakaoLogin}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80",
          "bg-[#FEE500] text-[#191919]",
        )}
      >
        <MessageCircle className="h-4 w-4 fill-[#191919]" />
        카카오로 계속하기
      </button>

      <button
        type="button"
        onClick={handleNaverLogin}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-80",
          "bg-[#03C75A]",
        )}
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white text-[10px] font-black leading-none text-[#03C75A]">
          N
        </span>
        네이버로 계속하기
      </button>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-opacity hover:opacity-80",
          "border-input bg-background text-foreground",
        )}
      >
        <svg viewBox="0 0 18 18" className="h-4 w-4">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
          <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
        </svg>
        Google로 계속하기
      </button>
    </div>
  );
}
