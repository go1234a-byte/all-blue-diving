// DEEP DIVE — sine-wave rendering helpers for the misty sea-surface intro screen.

export interface WaveLayerConfig {
  baseY: number;
  amplitude: number;
  frequency: number;
  phaseSpeed: number;
  color: string;
}

/**
 * Draws one translucent rolling wave layer as a filled path using a continuous
 * sine formula. `time` is in seconds; `phaseSpeed` controls horizontal drift.
 */
export function drawWaveLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: WaveLayerConfig,
  time: number,
) {
  const { baseY, amplitude, frequency, phaseSpeed, color } = config;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, baseY);

  const step = 8;
  for (let x = 0; x <= width; x += step) {
    const y = baseY + Math.sin(x * frequency + time * phaseSpeed) * amplitude;
    ctx.lineTo(x, y);
  }

  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Soft atmospheric mist overlay fading from translucent white to transparent. */
export function drawMistOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, mistHeight: number) {
  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, 0, mistHeight);
  gradient.addColorStop(0, "rgba(255,255,255,0.15)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, mistHeight);
  ctx.restore();
}
