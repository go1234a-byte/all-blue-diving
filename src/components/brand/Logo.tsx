import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  tone?: "default" | "inverted";
  className?: string;
}

/** 고래 꼬리(Fluke) 심벌 — "컨셉 5. Whale Tail" 리브랜딩 시안을 따른 아트워크. */
const TAIL_PATH =
  "M60 90 C59 78 56 68 50 60 C44 51 33 46 22 42 C14 39 12 33 16 27 C29 27 42 33 50 43 " +
  "C55 49 58 54 60 59 C62 54 65 49 70 43 C78 33 91 27 104 27 C108 33 106 39 98 42 " +
  "C87 46 76 51 70 60 C64 68 61 78 60 90 Z";

/** 꼬리 아래 파도 3줄 — 시안과 동일하게 겹치는 리본 형태(단순 선이 아님)로 채운다. */
const WAVE_PATHS = [
  "M18 94 C28 88 38 88 48 94 C58 100 68 100 78 94 C88 88 98 88 108 94 L108 102 " +
    "C98 96 88 96 78 102 C68 108 58 108 48 102 C38 96 28 96 18 102 Z",
  "M15 101 C25 95 35 95 45 101 C55 107 65 107 75 101 C85 95 95 95 105 101 L105 108 " +
    "C95 102 85 102 75 108 C65 114 55 114 45 108 C35 102 25 102 15 108 Z",
  "M13 107 C23 101 33 101 43 107 C53 113 63 113 73 107 C83 101 93 101 103 107 L103 113 " +
    "C93 107 83 107 73 113 C63 119 53 119 43 113 C33 107 23 107 13 113 Z",
];

/**
 * ALL BLUE 심벌 — 흰 배경(둥근 정사각형) 위의 고래 꼬리 심벌, 그 아래 파도 3줄.
 * 이 심벌은 앱 아이콘 / 헤더 / 스플래시에서 항상 동일하게 사용한다.
 */
export function LogoMark({ size = 32, tone = "default", className }: LogoMarkProps) {
  const isInverted = tone === "inverted";
  const gradFrom = isInverted ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))";
  const gradTo = isInverted ? "hsl(var(--accent-foreground))" : "hsl(var(--primary-glow))";
  // 기본(흰 배경) 톤: 배경과 구분되도록 파도마다 실제 색을 다르게 준다(흰 배경 위 흰 선은
  // 보이지 않았던 기존 버그 수정). 반전(어두운 배경) 톤: 밝은 단색을 투명도로만 층을 준다.
  const waveColors = isInverted
    ? ["hsl(var(--primary-foreground))", "hsl(var(--primary-foreground))", "hsl(var(--primary-foreground))"]
    : ["hsl(var(--primary))", "hsl(var(--primary-glow))", "hsl(var(--accent))"];
  const waveOpacities = isInverted ? [0.95, 0.65, 0.4] : [0.95, 0.85, 0.85];
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
        <linearGradient id={gradId} x1="16" y1="27" x2="104" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={gradFrom} />
          <stop offset="100%" stopColor={gradTo} />
        </linearGradient>
      </defs>

      {!isInverted && <rect x="0" y="0" width="120" height="120" rx="28" fill="white" />}

      {WAVE_PATHS.map((d, i) => (
        <path key={i} d={d} fill={waveColors[i]} opacity={waveOpacities[i]} />
      ))}

      <path d={TAIL_PATH} fill={`url(#${gradId})`} />
    </svg>
  );
}

/** 배경 워터마크용 — 흰 배지 없이 심벌 아트워크만, currentColor로 채운다(부모의 text 색 상속). */
export function LogoWatermark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      {WAVE_PATHS.map((d, i) => (
        <path key={i} d={d} fill="currentColor" opacity={0.9 - i * 0.15} />
      ))}
      <path d={TAIL_PATH} fill="currentColor" />
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
