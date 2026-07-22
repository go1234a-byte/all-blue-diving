import { useEffect, useRef } from "react";
import type { DiverState, Bubble, FeverIntroStage } from "@/hooks/useDiveGame";
import { TRACK_WIDTH } from "@/lib/game/spawner";
import type { GameEntity } from "@/lib/game/spawner";
import { getDepthBackground } from "@/lib/game/color";
import { useGameSprites } from "@/hooks/useGameSprites";
import type { SpriteKey } from "@/lib/game/sprites";

const ENTITY_SPRITE_KEY: Record<string, SpriteKey> = {
  coralReef: "coralReef",
  seaweed: "seaweed",
  anchor: "anchor",
  coralWall: "coralWall",
  shark: "shark",
  jellyfish: "jellyfish",
  shipwreck: "shipwreck",
  fish: "fish",
  airTank: "airTank",
  rainbowClam: "rainbowClam",
};

const DIVER_SIZE = 36;
const CANVAS_HEIGHT = 560;
const DIVER_SCREEN_Y_RATIO = 0.68; // diver stays fixed at 68% down the viewport
const MAX_TILT_DEG = 15;
const TILT_LERP_SPEED = 10;

const RAINBOW_COLORS = ["#ff004c", "#ff8a00", "#ffe600", "#3bff5e", "#00c3ff", "#7a4bff"];

interface GameCanvasProps {
  diver: DiverState;
  entities: GameEntity[];
  bubbles: Bubble[];
  isLegendary: boolean;
  feverActive: boolean;
  feverWarning: boolean;
  feverIntroStage: FeverIntroStage;
}

export function GameCanvas({
  diver,
  entities,
  bubbles,
  isLegendary,
  feverActive,
  feverWarning,
  feverIntroStage,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sprites = useGameSprites();
  const strobePhaseRef = useRef(0);
  const orbPhaseRef = useRef(0);
  const tiltRef = useRef(0);
  const lastFrameTsRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    const render = (ts: number) => {
      const dt = lastFrameTsRef.current === null ? 0.016 : Math.min(0.05, (ts - lastFrameTsRef.current) / 1000);
      lastFrameTsRef.current = ts;

      const width = canvas.width;
      const height = canvas.height;
      const diverScreenY = height * DIVER_SCREEN_Y_RATIO;
      const trackOffsetX = (width - TRACK_WIDTH) / 2;

      // --- Rainbow Fever cinematic intro: total eclipse / lightning strobe ---
      if (feverIntroStage) {
        ctx.save();
        ctx.fillStyle = feverIntroStage === "flash" ? "#FFFFFF" : "#000000";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        rafId = requestAnimationFrame(render);
        return;
      }

      // Background: depth-based color fade (bright ocean blue -> midnight black)
      ctx.save();
      ctx.fillStyle = getDepthBackground(diver.depth);
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Track boundary walls
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, 0, trackOffsetX, height);
      ctx.fillRect(trackOffsetX + TRACK_WIDTH, 0, width - trackOffsetX - TRACK_WIDTH, height);
      ctx.restore();

      const toScreenY = (worldY: number) => diverScreenY - (diver.worldY - worldY);

      // Entities — glowing vector silhouettes: hazards in threat red/orange, items in cyan/gold.
      entities.forEach((entity) => {
        const sx = trackOffsetX + entity.x;
        const sy = toScreenY(entity.worldY);
        if (sy < -60 || sy > height + 60) return;

        const img = sprites[ENTITY_SPRITE_KEY[entity.type]];
        const size = entity.isItem ? 26 : Math.max(entity.width, entity.height);

        ctx.save();
        ctx.translate(sx, sy);
        const flip = entity.vx < 0;
        if (flip) ctx.scale(-1, 1);

        ctx.shadowBlur = entity.isItem ? 16 : 12;
        ctx.shadowColor = entity.isItem
          ? entity.type === "rainbowClam"
            ? "#ff6fd8"
            : "#22d3ee"
          : "#ff4d4d";

        if (img) {
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
        } else {
          ctx.fillStyle = entity.isItem ? "#facc15" : "#ef4444";
          ctx.fillRect(-size / 2, -size / 2, size, size);
        }
        ctx.restore();
      });

      // Bubble particles
      const now = Date.now();
      bubbles.forEach((bubble) => {
        const age = now - bubble.createdAt;
        const t = Math.min(1, age / 700);
        const sx = trackOffsetX + bubble.x;
        const sy = toScreenY(bubble.worldY);
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t);
        ctx.fillStyle = bubble.color;
        ctx.beginPath();
        ctx.arc(sx, sy - t * 24, 2.5 + (1 - t) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Fever protective chromatic energy orb — spins around the diver while active
      if (feverActive) {
        orbPhaseRef.current += dt * 4;
        ctx.save();
        ctx.translate(trackOffsetX + diver.x, diverScreenY);
        for (let i = 0; i < 6; i++) {
          const angle = orbPhaseRef.current + (i / 6) * Math.PI * 2;
          const r = 22;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r * 0.6;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = RAINBOW_COLORS[i % RAINBOW_COLORS.length];
          ctx.shadowBlur = 10;
          ctx.shadowColor = RAINBOW_COLORS[i % RAINBOW_COLORS.length];
          ctx.fill();
        }
        ctx.restore();
      }

      // Diver sprite — fixed screen position, neon glow, banking tilt, flickers during safety windows.
      const targetTilt = diver.moveInput * MAX_TILT_DEG;
      tiltRef.current += (targetTilt - tiltRef.current) * Math.min(1, TILT_LERP_SPEED * dt);

      const diverImg = sprites[isLegendary ? "diverLegendary" : "diverDefault"];
      const bounce = diver.currentFrame === 1 ? -3 : 0;
      const flickerVisible = !diver.invulnerable || Math.floor(now / 90) % 2 === 0;
      if (flickerVisible) {
        ctx.save();
        ctx.translate(trackOffsetX + diver.x, diverScreenY + bounce);
        ctx.rotate((tiltRef.current * Math.PI) / 180);
        if (diver.facing === -1) ctx.scale(-1, 1);
        ctx.shadowBlur = isLegendary ? 22 : 16;
        ctx.shadowColor = isLegendary ? "#FFD700" : "#2dd4bf";
        if (diverImg) {
          ctx.drawImage(diverImg, -DIVER_SIZE / 2, -DIVER_SIZE / 2, DIVER_SIZE, DIVER_SIZE);
        } else {
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(-14, -14, 28, 28);
        }
        ctx.restore();
      }

      // Fever / warning viewport border strobe
      if (feverActive) {
        strobePhaseRef.current += 0.12;
        ctx.save();
        ctx.lineWidth = 8;
        if (feverWarning) {
          const pulse = (Math.sin(strobePhaseRef.current * 6) + 1) / 2;
          ctx.strokeStyle = `rgba(255, ${Math.round(40 + pulse * 40)}, ${Math.round(40 + pulse * 40)}, ${0.7 + pulse * 0.3})`;
        } else {
          const colorIndex = Math.floor(strobePhaseRef.current) % RAINBOW_COLORS.length;
          ctx.strokeStyle = RAINBOW_COLORS[colorIndex];
        }
        ctx.shadowBlur = 14;
        ctx.shadowColor = ctx.strokeStyle as string;
        ctx.strokeRect(4, 4, width - 8, height - 8);
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [diver, entities, bubbles, isLegendary, feverActive, feverWarning, feverIntroStage, sprites]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={CANVAS_HEIGHT}
      className="mx-auto block h-auto w-full max-w-[360px] rounded-lg border border-border"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
