import { useCallback, useEffect, useRef, useState } from "react";
import {
  spawnEntity,
  resetEntityIdCounter,
  getDifficultyModifier,
  getSpawnInterval,
  TRACK_WIDTH,
  PIXELS_PER_METER,
  type GameEntity,
} from "@/lib/game/spawner";
import type { GameAudioEngine } from "@/lib/game/audio";

export { TRACK_WIDTH, PIXELS_PER_METER };

const DIVER_WIDTH = 28;
const DIVER_HEIGHT = 32;
const MOVE_SPEED = 230; // px/sec lateral
const DESCENT_SPEED_BASE = 95; // px/sec world scroll at the surface
const AIR_MAX = 100;
const AIR_BASE_DRAIN_PER_SEC = 4.2;
const AIR_TANK_REFILL = 26;
const FEVER_DURATION = 5; // seconds
const FEVER_DESCENT_MULTIPLIER = 1.8;
const FEVER_WARNING_THRESHOLD = 1.0;
const FEVER_TICK_POINTS = [0.9, 0.6, 0.3];
const CONTINUE_SAFE_DURATION = 3; // seconds
const SPAWN_AHEAD_DISTANCE = 560;
const ENTITY_CLEANUP_BEHIND = 400;

// Rainbow Fever intro cinematic timeline (ms from the moment the clam is grabbed)
const FEVER_INTRO_ECLIPSE_1_END = 150;
const FEVER_INTRO_FLASH_1_END = 200;
const FEVER_INTRO_ECLIPSE_2_END = 350;
const FEVER_INTRO_FLASH_2_END = 400;

export type FeverIntroStage = "eclipse" | "flash" | null;

export interface Bubble {
  id: number;
  x: number;
  worldY: number;
  createdAt: number;
  color: string;
}

export interface DiverState {
  x: number;
  worldY: number;
  facing: 1 | -1;
  /** live input direction this frame, used to drive the ±15° banking tilt */
  moveInput: 1 | 0 | -1;
  currentFrame: 0 | 1;
  air: number;
  depth: number;
  score: number;
  invulnerable: boolean;
}

export type GameStatus = "idle" | "playing" | "gameover";
export type GameOverReason = "collision" | "air";

export interface GameOverInfo {
  reason: GameOverReason;
  hazardType?: string;
  message: string;
}

const HAZARD_MESSAGES: Record<string, string> = {
  shark: "상어와 충돌하여 다이빙이 중단되었습니다!",
  fish: "물고기 떼와 충돌하여 다이빙이 중단되었습니다!",
  anchor: "닻에 부딪혀 다이빙이 중단되었습니다!",
  coralWall: "산호 벽에 부딪혀 다이빙이 중단되었습니다!",
  coralReef: "산호초에 부딪혀 다이빙이 중단되었습니다!",
  seaweed: "해초에 걸려 다이빙이 중단되었습니다!",
  jellyfish: "해파리에 쏘여 다이빙이 중단되었습니다!",
  shipwreck: "난파선 잔해와 충돌하여 다이빙이 중단되었습니다!",
};

const AIR_OUT_MESSAGE = "제한 시간 초과! 공기가 고갈되어 비상 상승했습니다!";

const createInitialDiver = (): DiverState => ({
  x: TRACK_WIDTH / 2,
  worldY: 0,
  facing: 1,
  moveInput: 0,
  currentFrame: 0,
  air: AIR_MAX,
  depth: 0,
  score: 0,
  invulnerable: false,
});

function aabbOverlap(
  ax: number,
  aWorldY: number,
  aw: number,
  ah: number,
  bx: number,
  bWorldY: number,
  bw: number,
  bh: number,
): boolean {
  const xOverlap = Math.abs(ax - bx) < (aw + bw) / 2;
  const yOverlap = Math.abs(aWorldY - bWorldY) < (ah + bh) / 2;
  return xOverlap && yOverlap;
}

function getFeverIntroStage(elapsedMs: number): FeverIntroStage {
  if (elapsedMs < FEVER_INTRO_ECLIPSE_1_END) return "eclipse";
  if (elapsedMs < FEVER_INTRO_FLASH_1_END) return "flash";
  if (elapsedMs < FEVER_INTRO_ECLIPSE_2_END) return "eclipse";
  if (elapsedMs < FEVER_INTRO_FLASH_2_END) return "flash";
  return null;
}

export function useDiveGame(isLegendary: boolean, audio: GameAudioEngine | null, bestDepthAtStart: number) {
  const [diver, setDiver] = useState<DiverState>(createInitialDiver);
  const [entities, setEntities] = useState<GameEntity[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [gameOverInfo, setGameOverInfo] = useState<GameOverInfo | null>(null);
  const [feverActive, setFeverActive] = useState(false);
  const [feverRemaining, setFeverRemaining] = useState(0);
  const [newRecordFlash, setNewRecordFlash] = useState(false);
  const [feverIntroStage, setFeverIntroStage] = useState<FeverIntroStage>(null);

  const diverRef = useRef(diver);
  diverRef.current = diver;
  const entitiesRef = useRef(entities);
  entitiesRef.current = entities;
  const statusRef = useRef(status);
  statusRef.current = status;
  const bubbleIdRef = useRef(0);
  const rafRef = useRef<number>();
  const lastTsRef = useRef<number | null>(null);
  const moveDirRef = useRef<0 | 1 | -1>(0);
  const spawnTimerRef = useRef(0);
  const frameTimerRef = useRef(0);
  const feverActiveRef = useRef(false);
  const feverRemainingRef = useRef(0);
  const firedTicksRef = useRef<Set<number>>(new Set());
  const safeUntilRef = useRef(0);
  const bestDepthAtRunStartRef = useRef(bestDepthAtStart);
  const newRecordFiredRef = useRef(false);
  const feverIntroStartRef = useRef<number | null>(null);

  const endGame = useCallback(
    (info: GameOverInfo) => {
      if (statusRef.current === "gameover") return;
      statusRef.current = "gameover";
      setStatus("gameover");
      setGameOverInfo(info);
      audio?.stopFeverLoop();
      audio?.playCrash();
    },
    [audio],
  );

  const spawnBubbles = useCallback(
    (x: number, worldY: number) => {
      const color = isLegendary ? "#FFD700" : feverActiveRef.current ? "#FF6FD8" : "#FFFFFF";
      const newBubbles: Bubble[] = Array.from({ length: 3 }, (_, i) => ({
        id: ++bubbleIdRef.current,
        x: x + (Math.random() - 0.5) * 14,
        worldY: worldY + (Math.random() - 0.5) * 10,
        createdAt: Date.now() + i,
        color,
      }));
      setBubbles((prev) => [...prev.slice(-30), ...newBubbles]);
    },
    [isLegendary],
  );

  // Main real-time physics/spawn/collision loop
  useEffect(() => {
    const loop = (ts: number) => {
      if (statusRef.current !== "playing") {
        lastTsRef.current = null;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (lastTsRef.current === null) {
        lastTsRef.current = ts;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;
      const now = Date.now();

      // --- Rainbow Fever cinematic intro: freeze the world for 0.4s while the
      // eclipse/lightning-strobe sequence plays out, then burst into fever. ---
      if (feverIntroStartRef.current !== null) {
        const elapsedMs = ts - feverIntroStartRef.current;
        const stage = getFeverIntroStage(elapsedMs);
        setFeverIntroStage(stage);

        if (elapsedMs >= FEVER_INTRO_FLASH_2_END) {
          // Stage 3: Fever Burst
          feverIntroStartRef.current = null;
          setFeverIntroStage(null);
          feverActiveRef.current = true;
          feverRemainingRef.current = FEVER_DURATION;
          firedTicksRef.current.clear();
          setFeverActive(true);
          setFeverRemaining(FEVER_DURATION);
          audio?.unduckAmbient();
          audio?.startFeverLoop();
        }

        rafRef.current = requestAnimationFrame(loop);
        return; // hazard rendering/spawning/collision fully halted during the cinematic
      }

      const prev = diverRef.current;

      // --- Fever countdown ---
      let fever = feverActiveRef.current;
      let feverLeft = feverRemainingRef.current;
      if (fever) {
        feverLeft = Math.max(0, feverLeft - dt);
        feverRemainingRef.current = feverLeft;

        if (feverLeft <= FEVER_WARNING_THRESHOLD) {
          const tempoScale = 1 + (FEVER_WARNING_THRESHOLD - feverLeft) * 1.6;
          audio?.setFeverTempoScale(tempoScale);
          FEVER_TICK_POINTS.forEach((point) => {
            if (feverLeft <= point && !firedTicksRef.current.has(point)) {
              firedTicksRef.current.add(point);
              audio?.playTick();
            }
          });
        }

        if (feverLeft <= 0) {
          fever = false;
          feverActiveRef.current = false;
          audio?.stopFeverLoop();
          firedTicksRef.current.clear();
          setFeverActive(false);
        }
        setFeverRemaining(feverLeft);
      }

      const modifier = getDifficultyModifier(prev.depth);
      const descentSpeed = DESCENT_SPEED_BASE * (fever ? FEVER_DESCENT_MULTIPLIER : 1);
      const nextWorldY = prev.worldY + descentSpeed * dt;
      const nextDepth = nextWorldY / PIXELS_PER_METER;
      const nextScore = Math.floor(nextDepth);

      const nextX = Math.max(
        DIVER_WIDTH / 2,
        Math.min(TRACK_WIDTH - DIVER_WIDTH / 2, prev.x + moveDirRef.current * MOVE_SPEED * dt),
      );

      const airDrain = fever ? 0 : AIR_BASE_DRAIN_PER_SEC * modifier * dt;

      // --- Animation frame toggle while moving ---
      frameTimerRef.current += dt;
      let nextFrame = prev.currentFrame;
      if (moveDirRef.current !== 0 && frameTimerRef.current > 0.15) {
        frameTimerRef.current = 0;
        nextFrame = prev.currentFrame === 0 ? 1 : 0;
        spawnBubbles(prev.x, prev.worldY);
      }

      const isSafe = fever || now < safeUntilRef.current;

      // --- Spawner ---
      spawnTimerRef.current += dt * 1000;
      let nextEntities = entitiesRef.current;
      const interval = getSpawnInterval(prev.depth);
      if (spawnTimerRef.current >= interval) {
        spawnTimerRef.current = 0;
        const spawned = spawnEntity(prev.depth, nextWorldY + SPAWN_AHEAD_DISTANCE);
        nextEntities = [...nextEntities, spawned];
      }

      // Move entities laterally (sharks/fish) and bounce off track edges
      nextEntities = nextEntities
        .map((e) => {
          if (e.vx === 0) return e;
          let nx = e.x + e.vx * dt;
          let nvx = e.vx;
          const half = e.width / 2;
          if (nx < half) {
            nx = half;
            nvx = Math.abs(nvx);
          } else if (nx > TRACK_WIDTH - half) {
            nx = TRACK_WIDTH - half;
            nvx = -Math.abs(nvx);
          }
          return { ...e, x: nx, vx: nvx };
        })
        .filter((e) => e.worldY > nextWorldY - ENTITY_CLEANUP_BEHIND);

      // --- Collision / pickup detection ---
      let airGain = 0;
      let triggeredFeverIntro = false;
      const survivors: GameEntity[] = [];
      for (const entity of nextEntities) {
        const overlapping = aabbOverlap(
          nextX,
          nextWorldY,
          DIVER_WIDTH,
          DIVER_HEIGHT,
          entity.x,
          entity.worldY,
          entity.width,
          entity.height,
        );

        if (!overlapping) {
          survivors.push(entity);
          continue;
        }

        if (entity.isItem) {
          if (entity.type === "airTank") {
            airGain += AIR_TANK_REFILL;
            audio?.playItemPickup();
          } else if (entity.type === "rainbowClam" && feverIntroStartRef.current === null) {
            // Kick off the 0.4s eclipse/lightning-strobe cinematic; fever itself
            // activates once the sequence completes (see the branch above).
            audio?.playItemPickup();
            audio?.duckAmbient();
            feverIntroStartRef.current = ts;
            triggeredFeverIntro = true;
          }
          // items are consumed, not kept
          continue;
        }

        // hazard
        if (isSafe) {
          // invulnerable — pass straight through, hazard disappears (dodged)
          continue;
        }

        endGame({
          reason: "collision",
          hazardType: entity.type,
          message: HAZARD_MESSAGES[entity.type] ?? "장애물과 충돌하여 다이빙이 중단되었습니다!",
        });
        rafRef.current = requestAnimationFrame(loop);
        return; // stop processing this frame entirely, but keep the loop alive for future resets
      }

      const nextAir = Math.min(AIR_MAX, Math.max(0, prev.air - airDrain + airGain));

      if (nextAir <= 0) {
        endGame({ reason: "air", message: AIR_OUT_MESSAGE });
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // --- New record detection (fires exactly once per session) ---
      if (!newRecordFiredRef.current && nextDepth > bestDepthAtRunStartRef.current) {
        newRecordFiredRef.current = true;
        audio?.playNewRecordFanfare();
        setNewRecordFlash(true);
        setTimeout(() => setNewRecordFlash(false), 1500);
      }

      setEntities(survivors);
      setDiver({
        x: nextX,
        worldY: nextWorldY,
        facing: moveDirRef.current !== 0 ? (moveDirRef.current as 1 | -1) : prev.facing,
        moveInput: moveDirRef.current,
        currentFrame: nextFrame,
        air: nextAir,
        depth: nextDepth,
        score: nextScore,
        invulnerable: isSafe,
      });

      if (triggeredFeverIntro) {
        setFeverIntroStage("eclipse");
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audio, endGame, spawnBubbles]);

  // Bubble particle lifecycle cleanup
  useEffect(() => {
    if (bubbles.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setBubbles((prev) => prev.filter((b) => now - b.createdAt < 700));
    }, 750);
    return () => clearTimeout(timer);
  }, [bubbles]);

  const startMove = useCallback((dir: 1 | -1) => {
    moveDirRef.current = dir;
  }, []);

  const stopMove = useCallback((dir: 1 | -1) => {
    if (moveDirRef.current === dir) moveDirRef.current = 0;
  }, []);

  /** Starts (or restarts) a fresh run — used both for the very first launch and for replays. */
  const reset = useCallback(() => {
    resetEntityIdCounter();
    statusRef.current = "playing";
    lastTsRef.current = null;
    moveDirRef.current = 0;
    spawnTimerRef.current = 0;
    frameTimerRef.current = 0;
    feverActiveRef.current = false;
    feverRemainingRef.current = 0;
    firedTicksRef.current.clear();
    safeUntilRef.current = 0;
    newRecordFiredRef.current = false;
    feverIntroStartRef.current = null;
    bestDepthAtRunStartRef.current = bestDepthAtStart;
    setDiver(createInitialDiver());
    setEntities([]);
    setBubbles([]);
    setGameOverInfo(null);
    setFeverActive(false);
    setFeverRemaining(0);
    setFeverIntroStage(null);
    setNewRecordFlash(false);
    setStatus("playing");
  }, [bestDepthAtStart]);

  /** Freemium continue: keep current depth/score, refill air fully, grant a brief safety window. */
  const continueInPlace = useCallback(() => {
    statusRef.current = "playing";
    lastTsRef.current = null;
    moveDirRef.current = 0;
    safeUntilRef.current = Date.now() + CONTINUE_SAFE_DURATION * 1000;
    setEntities([]);
    setGameOverInfo(null);
    setDiver((prev) => ({ ...prev, air: AIR_MAX, invulnerable: true }));
    setStatus("playing");
  }, []);

  return {
    diver,
    entities,
    bubbles,
    status,
    gameOverInfo,
    feverActive,
    feverRemaining,
    feverWarning: feverActive && feverRemaining <= FEVER_WARNING_THRESHOLD,
    feverIntroStage,
    newRecordFlash,
    startMove,
    stopMove,
    reset,
    continueInPlace,
  };
}
