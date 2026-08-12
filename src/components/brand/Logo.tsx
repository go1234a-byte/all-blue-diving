import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  tone?: "default" | "inverted";
  className?: string;
}

/** 고래 꼬리(Fluke) 심벌 — "컨셉 5. Whale Tail" 리브랜딩 아트워크. WhaleTailMark와 동일한 경로. */
const TAIL_PATH =
  "M60 92 C55 70 40 58 24 48 C10 40 4 26 12 12 C28 16 42 30 52 48 C55 54 58 60 60 66 " +
  "C62 60 65 54 68 48 C78 30 92 16 108 12 C116 26 110 40 96 48 C80 58 65 70 60 92 Z";

/**
 * ALL BLUE 심벌 — 흰 배경(둥근 정사각형) 위의 고래 꼬리 심벌, 그 아래 파도 두 줄.
 * 이 심벌은 앱 아이콘 / 헤더 / 스플래시에서 항상 동일하게 사용한다.
 */
export function LogoMark({ size = 32, tone = "default", className }: LogoMarkProps) {
  const isInverted = tone === "inverted";
  const gradFrom = isInverted ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))";
  const gradTo = isInverted ? "hsl(var(--accent-foreground))" : "hsl(var(--primary-glow))";
  const waveStroke = isInverted ? "hsl(var(--accent))" : "hsl(var(--primary-foreground))";
  const gradId = `tail-gradient-${tone}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="12" y1="12" x2="108" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={gradFrom} />
          <stop offset="100%" stopColor={gradTo} />
        </linearGradient>
      </defs>

      {!isInverted && <rect x="0" y="0" width="120" height="120" rx="28" fill="white" />}

      <path d={TAIL_PATH} fill={`url(#${gradId})`} />

      <path
        d="M8 100c6.4-5 12.8-5 19.2 0s12.8 5 19.2 0 12.8-5 19.2 0 12.8 5 19.2 0 12.8-5 19.2 0"
        stroke={waveStroke}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M8 108.5c6.4-5 12.8-5 19.2 0s12.8 5 19.2 0 12.8-5 19.2 0 12.8 5 19.2 0 12.8-5 19.2 0"
        stroke={waveStroke}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
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
