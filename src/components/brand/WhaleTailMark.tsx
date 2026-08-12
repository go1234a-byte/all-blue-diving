import { cn } from "@/lib/utils";

interface WhaleTailMarkProps {
  size?: number;
  tone?: "default" | "inverted";
  className?: string;
}

/** 고래 꼬리(Fluke) 실루엣 — 두 갈래 지느러미가 가운데에서 완만하게 갈라지는 형태. */
const TAIL_PATH =
  "M60 92 C55 70 40 58 24 48 C10 40 4 26 12 12 C28 16 42 30 52 48 C55 54 58 60 60 66 " +
  "C62 60 65 54 68 48 C78 30 92 16 108 12 C116 26 110 40 96 48 C80 58 65 70 60 92 Z";

/**
 * 컨셉 5 "Whale Tail" 리브랜딩 심벌 — 고래 꼬리가 파도 위로 솟아오르는 모습.
 * 기존 LogoMark(위치 핀 심벌)와 동일한 tone/size API를 따르되, 현재는 첫 구동
 * 스플래시 화면에서만 사용한다(다른 곳의 기존 핀 심벌은 그대로 유지).
 */
export function WhaleTailMark({ size = 96, tone = "default", className }: WhaleTailMarkProps) {
  const isInverted = tone === "inverted";
  const gradFrom = isInverted ? "hsl(var(--primary-foreground))" : "hsl(var(--primary))";
  const gradTo = isInverted ? "hsl(var(--accent-foreground))" : "hsl(var(--primary-glow))";
  const waveStroke = isInverted ? "hsl(var(--accent))" : "hsl(var(--primary-foreground))";
  const gradId = `whale-tail-gradient-${tone}`;

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

      <path d={TAIL_PATH} fill={`url(#${gradId})`} />

      {/* 꼬리 아래로 흐르는 파도 두 줄 */}
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
