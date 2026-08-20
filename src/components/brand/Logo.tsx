import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  tone?: "default" | "inverted";
  className?: string;
}

/**
 * ALL BLUE 심벌 — 실제 디자인 원본(고래 꼬리 + 파도)을 그대로 쓴다(손으로 그린 근사 벡터가
 * 아님). 흰 배경(둥근 정사각형) 위에 올려서, 헤더 배경이 다크 테마로 짙어져도 마크의
 * 원래 색이 그대로 유지되고 대비도 확보된다. 이 심벌은 헤더/사이드바/로그인 화면 등
 * 인앱에서 항상 동일하게 쓰인다(앱 아이콘/스플래시는 별도 이미지 자산 사용).
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[23%] bg-white", className)}
      style={{ width: size, height: size }}
    >
      <img src="/logo-mark.png" alt="" className="h-[85%] w-[85%] object-contain" aria-hidden="true" />
    </span>
  );
}

/** 배경 워터마크용 — 흰 배지 없이 심벌 아트워크만, 원본 이미지 그대로(투명 배경). */
export function LogoWatermark({ className }: { className?: string }) {
  return <img src="/logo-mark.png" alt="" className={className} aria-hidden="true" />;
}

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  /**
   * default: 밝은 배경 위 — 파란 워드마크 (라이트 테마 일반 화면, 관리자 사이드바 등)
   * inverted: 항상 어두운 배경 위 — 흰 워드마크로 고정 (스플래시처럼 테마와 무관하게 항상
   *   어두운 화면에서만 쓰이는 곳)
   * header: 상단 헤더 전용 — 헤더 배경(gradient-ocean)이 라이트/다크 테마에 따라 밝거나
   *   어두워지므로, 워드마크 색도 text-foreground로 테마에 맞춰 자동 전환된다.
   */
  tone?: "default" | "inverted" | "header";
  className?: string;
}

const SIZE_PRESETS = {
  sm: { mark: 28, word: "text-base", tagline: "text-[10px]" },
  md: { mark: 40, word: "text-2xl", tagline: "text-xs" },
  lg: { mark: 56, word: "text-4xl md:text-5xl", tagline: "text-sm md:text-base" },
} as const;

/**
 * ALL BLUE 완성형 로고 lockup — 왼쪽 심벌 + 오른쪽 "ALL BLUE" 워드마크,
 * 그 아래 "모든 바다가 만나는 곳" 태그라인(옵션).
 */
export function Logo({ size = "sm", showTagline = false, tone = "default", className }: LogoProps) {
  const preset = SIZE_PRESETS[size];
  // 심벌(핀 아이콘)은 흰 배지 위에 파란 핀이 올라가는 "default" 스타일이 라이트/다크 헤더
  // 모두에서 자연스럽게 보이므로, header 톤에서도 심벌 자체는 default를 그대로 쓴다.
  const markTone = tone === "inverted" ? "inverted" : "default";
  const wordColor =
    tone === "inverted" ? "text-primary-foreground" : tone === "header" ? "text-foreground" : "text-primary";
  const taglineColor =
    tone === "inverted"
      ? "text-primary-foreground/75"
      : tone === "header"
        ? "text-foreground/70"
        : "text-muted-foreground";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={preset.mark} tone={markTone} />
      <div className="flex flex-col leading-tight">
        <span className={cn("font-bold tracking-tight", preset.word, wordColor)}>ALL BLUE</span>
        {showTagline && (
          <span className={cn("font-medium tracking-tight", preset.tagline, taglineColor)}>
            모든 바다가 만나는 곳
          </span>
        )}
      </div>
    </div>
  );
}
