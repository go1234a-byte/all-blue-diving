import { Apple, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * SNS 간편 로그인 버튼.
 * TODO: 실연동 필요 — 카카오/네이버/Apple OAuth Provider 키 발급 후
 * `supabase.auth.signInWithOAuth({ provider: "kakao" | ... })`로 교체하세요.
 * 현재는 실제 계정 없이 임의로 로그인 상태를 만들 수 없어 준비 중 안내만 표시합니다.
 */
export function SocialAuthButtons() {
  const { toast } = useToast();

  const handleUnavailable = (provider: "kakao" | "naver" | "apple") => {
    const labels = { kakao: "카카오", naver: "네이버", apple: "Apple" };
    toast({
      title: `${labels[provider]} 간편 로그인은 준비 중입니다`,
      description: "이메일/비밀번호로 회원가입 후 이용해주세요.",
    });
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs font-medium text-muted-foreground">간편 회원가입 / 로그인 (준비 중)</p>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={() => handleUnavailable("kakao")}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold opacity-60 transition-opacity hover:opacity-80",
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
