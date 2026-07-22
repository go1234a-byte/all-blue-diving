// Infinite Dive — depth-based background color interpolation (bright ocean blue -> midnight black)

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mix(a: RGB, b: RGB, t: number): string {
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  return `rgb(${r}, ${g}, ${bl})`;
}

const SHALLOW = hexToRgb("#0066cc");
const MIDSTREAM = hexToRgb("#003366");
const ABYSSAL = hexToRgb("#001122");

/**
 * Score/depth-driven background color. Smoothly fades across the three zone
 * bands so the trench darkens gradually rather than snapping between colors.
 */
export function getDepthBackground(depthMeters: number): string {
  if (depthMeters <= 100) {
    const t = depthMeters / 100;
    return mix(SHALLOW, MIDSTREAM, t);
  }
  if (depthMeters <= 300) {
    const t = (depthMeters - 100) / 200;
    return mix(MIDSTREAM, ABYSSAL, t);
  }
  return mix(ABYSSAL, ABYSSAL, 0);
}
