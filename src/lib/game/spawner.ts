// DEEP DIVE — depth-scaled procedural spawner for the side-scrolling survival engine.
// Modifier = 1 + depth/120 drives spawn frequency and moving-hazard speed.

export type EntityType =
  | "coralReef"
  | "seaweed"
  | "anchor"
  | "coralWall"
  | "shark"
  | "jellyfish"
  | "shipwreck"
  | "fish"
  | "airTank"
  | "rainbowClam";

export const HAZARD_TYPES: EntityType[] = [
  "coralReef",
  "seaweed",
  "anchor",
  "coralWall",
  "shark",
  "jellyfish",
  "shipwreck",
  "fish",
];

export const ITEM_TYPES: EntityType[] = ["airTank", "rainbowClam"];

export interface GameEntity {
  id: number;
  type: EntityType;
  x: number;
  worldY: number;
  vx: number;
  width: number;
  height: number;
  isItem: boolean;
}

export const TRACK_WIDTH = 320;
export const PIXELS_PER_METER = 40;
export const BASE_SPAWN_INTERVAL_MS = 850;

function hazardPoolForDepth(depth: number): EntityType[] {
  if (depth <= 100) return ["coralReef", "seaweed", "fish"];
  if (depth <= 300) return ["anchor", "coralWall", "shark", "fish"];
  return ["jellyfish", "shipwreck", "shark", "fish"];
}

export function getDifficultyModifier(depth: number): number {
  return 1 + depth / 120;
}

export function getSpawnInterval(depth: number): number {
  return BASE_SPAWN_INTERVAL_MS / getDifficultyModifier(depth);
}

let entityIdCounter = 0;

/** Rolls whether the next spawn should be an item (rare) or a hazard, and builds it. */
export function spawnEntity(depth: number, aheadWorldY: number): GameEntity {
  const modifier = getDifficultyModifier(depth);
  const roll = Math.random();

  const x = Math.random() * (TRACK_WIDTH - 40) + 20;

  if (roll < 0.015) {
    return {
      id: ++entityIdCounter,
      type: "rainbowClam",
      x,
      worldY: aheadWorldY,
      vx: 0,
      width: 28,
      height: 28,
      isItem: true,
    };
  }

  if (roll < 0.09) {
    return {
      id: ++entityIdCounter,
      type: "airTank",
      x,
      worldY: aheadWorldY,
      vx: 0,
      width: 26,
      height: 26,
      isItem: true,
    };
  }

  const pool = hazardPoolForDepth(depth);
  const type = pool[Math.floor(Math.random() * pool.length)];
  const isMoving = type === "shark" || type === "fish";
  const baseSpeed = type === "shark" ? 40 : 60;
  const vx = isMoving ? (Math.random() > 0.5 ? 1 : -1) * baseSpeed * modifier : 0;

  return {
    id: ++entityIdCounter,
    type,
    x,
    worldY: aheadWorldY,
    vx,
    width: type === "shark" ? 36 : 30,
    height: type === "shark" ? 26 : 30,
    isItem: false,
  };
}

export function resetEntityIdCounter() {
  entityIdCounter = 0;
}
