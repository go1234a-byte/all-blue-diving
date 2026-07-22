import { Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface HUDProps {
  depth: number;
  air: number;
  bestDepth: number;
  hearts: number;
  isLegendary: boolean;
  feverActive: boolean;
  feverRemaining: number;
  feverWarning: boolean;
}

const MAX_HEARTS = 5;
const FEVER_DURATION = 5;

export function HUD({
  depth,
  air,
  bestDepth,
  hearts,
  isLegendary,
  feverActive,
  feverRemaining,
  feverWarning,
}: HUDProps) {
  const airCritical = air <= 25;

  return (
    <div className="space-y-2 px-4 pt-4">
      <div className="flex items-center justify-between text-[11px]">
        <span
          id="game-score-display"
          className={cn(
            "font-bold tracking-wide",
            isLegendary
              ? "bg-gradient-to-r from-game-gold via-yellow-200 to-game-gold bg-clip-text text-transparent"
              : "text-foreground",
          )}
        >
          수심 {depth}m
        </span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: MAX_HEARTS }, (_, i) => (
            <Heart
              key={i}
              className={cn(
                "h-3.5 w-3.5",
                i < hearts ? "fill-game-coral text-game-coral" : "fill-transparent text-muted-foreground/40",
              )}
            />
          ))}
        </div>
        <span className="text-muted-foreground">최고 기록 {bestDepth}m</span>
      </div>

      <div className="h-4 w-full overflow-hidden rounded-full border border-border/40 bg-card/40 backdrop-blur-sm">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-150 ease-linear",
            airCritical && !feverActive ? "animate-pulse" : "",
            feverActive ? "bg-gradient-to-r from-pink-400 via-yellow-300 to-cyan-400" : "",
          )}
          style={
            feverActive
              ? { width: "100%" }
              : { width: `${Math.max(0, Math.min(100, air))}%`, backgroundColor: "hsl(var(--game-coral))" }
          }
        />
      </div>
      <p className="text-right text-[10px] text-muted-foreground">
        {feverActive ? "무적 상태 — 공기 소모 정지" : `공기 잔량 ${Math.round(air)}%`}
      </p>

      {feverActive && (
        <div className="space-y-1 rounded-md border border-pink-400/40 bg-pink-500/10 px-2 py-1.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-semibold text-pink-300">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              무지개 피버
            </span>
            <span className={cn(feverWarning && "animate-pulse text-destructive")}>
              {feverRemaining.toFixed(1)}s
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-pink-950/40">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-100 linear",
                feverWarning ? "bg-destructive" : "bg-gradient-to-r from-pink-400 via-yellow-300 to-cyan-400",
              )}
              style={{ width: `${(feverRemaining / FEVER_DURATION) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
