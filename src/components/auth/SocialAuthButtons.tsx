import { Apple, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * SNS 간편 로그인 버튼.
 * 카카오는 실연동 완료 — Supabase 대시보드(Authentication > Providers > Kakao)에
 * REST API 키/시크릿을 등록해야 실제로 동작한다(등록 전까지는 Supabase가 에러를
 * 돌려주고 아래 catch에서 안내 토스트를 띄운다). 최초 로그인 시 profiles row가 없으면
 * RootLayout이 /complete-profile로 보내 추가 정보를 받는다.
 * 네이버/Apple: TODO — 네이버는 Supabase 기본 지원 provider가 아니라 별도 커스텀 OAuth
 * 구현이 필요하고, Apple은 Kakao와 동일한 방식(provider: "apple")으로 붙이면 된다.
 */
export function SocialAuthButtons() {
  const { toast } = useToast();

  const handleUnavailable = (provider: "naver" | "apple") => {
    const labels = { naver: "네이버", apple: "Apple" };
    toast({
      title: `${labels[provider]} 간편 로그인은 준비 중입니다`,
      description: "이메일/비밀번호로 회원가입 후 이용해주세요.",
    });
  };

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
        onClick={() => handleUnavailable("naver")}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white opacity-60 transition-opacity hover:opacity-80",
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
        onClick={() => handleUnavailable("apple")}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold opacity-60 transition-opacity hover:opacity-80",
          "border-foreground/20 bg-foreground text-background",
        )}
      >
        <Apple className="h-4 w-4 fill-background" />
        Apple로 계속하기
      </button>
    </div>
  );
}
