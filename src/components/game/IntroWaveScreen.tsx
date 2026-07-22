import { useEffect, useRef } from "react";
import { Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { drawWaveLayer, drawMistOverlay } from "@/lib/game/waves";

interface IntroWaveScreenProps {
  onStart: () => void;
}

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 560;

const WAVE_LAYERS = [
  { baseY: CANVAS_HEIGHT * 0.62, amplitude: 14, frequency: 0.018, phaseSpeed: 1.1, color: "rgba(16, 185, 145, 0.35)" },
  { baseY: CANVAS_HEIGHT * 0.72, amplitude: 20, frequency: 0.013, phaseSpeed: 0.75, color: "rgba(13, 148, 136, 0.45)" },
  { baseY: CANVAS_HEIGHT * 0.84, amplitude: 26, frequency: 0.009, phaseSpeed: 0.5, color: "rgba(6, 95, 90, 0.65)" },
];

export function IntroWaveScreen({ onStart }: IntroWaveScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    const startTime = performance.now();

    const render = (ts: number) => {
      const time = (ts - startTime) / 1000;
      const width = canvas.width;
      const height = canvas.height;

      ctx.save();
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.62);
      skyGradient.addColorStop(0, "#0b3d4a");
      skyGradient.addColorStop(1, "#0f5e63");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      WAVE_LAYERS.forEach((layer) => {
        drawWaveLayer(ctx, width, height, layer, time);
      });

      drawMistOverlay(ctx, width, height * 0.35, height * 0.35);

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-lg border border-border">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="block h-auto w-full"
      />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex items-center gap-2">
          <Waves className="h-7 w-7 text-cyan-200" style={{ filter: "drop-shadow(0 0 10px rgba(45,212,191,0.9))" }} />
          <h1
            className="text-3xl font-black tracking-widest text-cyan-100"
            style={{ textShadow: "0 0 16px rgba(45,212,191,0.85), 0 0 30px rgba(45,212,191,0.5)" }}
          >
            DEEP DIVE
          </h1>
        </div>
        <p className="text-xs text-cyan-100/80">고요한 해수면 아래, 무한한 심연이 기다립니다</p>
        <Button
          size="lg"
          onClick={onStart}
          className="bg-cyan-400 text-cyan-950 shadow-[0_0_24px_rgba(45,212,191,0.6)] hover:bg-cyan-300"
        >
          게임 시작
        </Button>
      </div>
    </div>
  );
}
