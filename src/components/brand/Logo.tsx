import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  tone?: "default" | "inverted";
  className?: string;
}

/** 위치(Pin) 심벌 외곽선 — 앱 아이콘/스플래시와 100% 동일한 심벌을 사용한다. */
const PIN_PATH = "M20 3C12.27 3 6 9.27 6 17c0 11.5 14 24 14 24s14-12.5 14-24c0-7.73-6.27-14-14-14z";

/**
 * ALL BLUE 심벌 — 흰 배경 위의 파란색 위치(Pin) 심벌, 내부는 파도처럼 흐르는
 * 블루 그라데이션. 이 심벌은 앱 아이콘 / 헤더 / 스플래시 컷아웃에서 항상 동일하게 사용한다.
 */
export function LogoMark({ size = 32, tone = "default", className }: LogoMarkProps) {
  const isInverted = tone === "inverted";
  const gradFrom = isInverted ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))";
  const gradTo = isInverted ? "hsl(var(--primary-foreground))" : "hsl(var(--primary-glow))";
  const waveStroke = isInverted ? "hsl(var(--primary))" : "hsl(var(--primary-foreground))";
  const gradId = `pin-gradient-${tone}`;
  const clipId = `pin-clip-${tone}`;

  return (
    <svg
      width={size}
      height={(size * 44) / 40}
      viewBox="0 0 40 44"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="6" y1="3" x2="34" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={gradFrom} />
          <stop offset="100%" stopColor={gradTo} />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={PIN_PATH} />
        </clipPath>
      </defs>

      {!isInverted && <rect x="0" y="1" width="40" height="42" rx="12" fill="white" />}

      <path d={PIN_PATH} fill={`url(#${gradId})`} />

      {/* 파도 라인: 핀 내부에만 보이도록 클립 */}
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M2 22c2.6-2.4 5.2-2.4 7.8 0s5.2 2.4 7.8 0 5.2-2.4 7.8 0 5.2 2.4 7.8 0"
          stroke={waveStroke}
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
        <path
          d="M2 27c2.6-2.4 5.2-2.4 7.8 0s5.2 2.4 7.8 0 5.2-2.4 7.8 0 5.2 2.4 7.8 0"
          stroke={waveStroke}
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </g>
    </svg>
  );
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
