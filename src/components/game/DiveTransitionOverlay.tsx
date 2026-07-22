import { useEffect, useRef } from "react";
import { drawWaveLayer } from "@/lib/game/waves";

interface DiveTransitionOverlayProps {
  onComplete: () => void;
}

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 560;
const DURATION_MS = 1500;

const WAVE_LAYERS = [
  { baseY: CANVAS_HEIGHT * 0.62, amplitude: 14, frequency: 0.018, phaseSpeed: 1.1, color: "rgba(16, 185, 145, 0.35)" },
  { baseY: CANVAS_HEIGHT * 0.72, amplitude: 20, frequency: 0.013, phaseSpeed: 0.75, color: "rgba(13, 148, 136, 0.45)" },
  { baseY: CANVAS_HEIGHT * 0.84, amplitude: 26, frequency: 0.009, phaseSpeed: 0.5, color: "rgba(6, 95, 90, 0.65)" },
];

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Plays a 1.5s camera-plunge sequence: the wave surface tilts downward and
 * fades out while the deep-sea HUD/canvas fades in underneath.
 */
export function DiveTransitionOverlay({ onComplete }: DiveTransitionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    const startTime = performance.now();

    const render = (ts: number) => {
      const elapsed = ts - startTime;
      const rawT = Math.min(1, elapsed / DURATION_MS);
      const t = easeInOutCubic(rawT);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      // Camera tilts downward and plunges beneath the wave layers, fading out.
      const tiltDeg = t * 35;
      const plungeY = t * height * 0.9;
      const scale = 1 + t * 0.4;
      ctx.globalAlpha = Math.max(0, 1 - t * 1.15);
      ctx.translate(width / 2, height / 2);
      ctx.rotate((tiltDeg * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2 + plungeY);

      const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.62);
      skyGradient.addColorStop(0, "#0b3d4a");
      skyGradient.addColorStop(1, "#0f5e63");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);

      WAVE_LAYERS.forEach((layer) => {
        drawWaveLayer(ctx, width, height, layer, elapsed / 1000);
      });
      ctx.restore();

      if (rawT >= 1) {
        onComplete();
        return;
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 mx-auto flex w-full max-w-[360px] items-center justify-center overflow-hidden rounded-lg">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="h-full w-full" />
    </div>
  );
}
