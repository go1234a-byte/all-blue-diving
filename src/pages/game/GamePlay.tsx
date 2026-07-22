import { useCallback, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useDiveGame } from "@/hooks/useDiveGame";
import { useGameAudio } from "@/hooks/useGameAudio";
import { useGamePlayer } from "@/contexts/GamePlayerContext";
import { HUD } from "@/components/game/HUD";
import { GameCanvas } from "@/components/game/GameCanvas";
import { Controls } from "@/components/game/Controls";
import { GameOverModal } from "@/components/game/GameOverModal";
import { NicknameDialog } from "@/components/game/NicknameDialog";
import { NewRecordBanner } from "@/components/game/NewRecordBanner";
import { IntroWaveScreen } from "@/components/game/IntroWaveScreen";
import { DiveTransitionOverlay } from "@/components/game/DiveTransitionOverlay";

// When the game is already running inside its own tab/window, hide the
// "open in new tab" link to avoid nesting duplicate instances.
const isPopupInstance = typeof window !== "undefined" && window.name === "infinite-dive-game";
const gameUrl = typeof window !== "undefined" ? `${window.location.origin}/game` : "/game";

type ScreenPhase = "intro" | "transition" | "playing";

const GamePlay = () => {
  const { player, isLegendary } = useGamePlayer();
  const audio = useGameAudio();
  const bestDepthAtMount = useRef(player?.max_depth ?? 0).current;
  const {
    diver,
    entities,
    bubbles,
    status,
    gameOverInfo,
    feverActive,
    feverRemaining,
    feverWarning,
    feverIntroStage,
    newRecordFlash,
    startMove,
    stopMove,
    reset,
    continueInPlace,
  } = useDiveGame(isLegendary, audio, bestDepthAtMount);
  const [runKey, setRunKey] = useState(0);
  const [phase, setPhase] = useState<ScreenPhase>("intro");

  const handleReplay = useCallback(() => {
    reset();
    setRunKey((k) => k + 1);
  }, [reset]);

  const handleStartGame = useCallback(() => {
    audio?.unlock();
    setPhase("transition");
  }, [audio]);

  const handleTransitionComplete = useCallback(() => {
    setPhase("playing");
    reset();
  }, [reset]);

  const handleMoveStart = useCallback(
    (dir: 1 | -1) => {
      audio?.unlock();
      startMove(dir);
    },
    [audio, startMove],
  );

  if (phase === "intro") {
    return (
      <div className="flex flex-1 flex-col px-4 py-3">
        <IntroWaveScreen onStart={handleStartGame} />
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <NicknameDialog />
      <NewRecordBanner active={newRecordFlash} />

      <div className="relative px-4 pt-3 text-center">
        <h1 className="text-sm font-bold tracking-wide text-primary">DEEP DIVE</h1>
        <p className="text-[10px] text-muted-foreground">딥 다이브 서바이벌</p>
        {!isPopupInstance && (
          <a
            href={gameUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-4 top-3 flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 text-[10px] text-secondary-foreground transition-colors hover:bg-secondary/80"
            title="새 탭에서 게임 열기"
          >
            <ExternalLink className="h-3 w-3" />
            새창
          </a>
        )}
      </div>

      <HUD
        depth={Math.floor(diver.depth)}
        air={diver.air}
        bestDepth={player?.max_depth ?? 0}
        hearts={player?.hearts_remaining ?? 5}
        isLegendary={isLegendary}
        feverActive={feverActive}
        feverRemaining={feverRemaining}
        feverWarning={feverWarning}
      />

      <div className="relative flex-1 px-4 py-3">
        <GameCanvas
          key={runKey}
          diver={diver}
          entities={entities}
          bubbles={bubbles}
          isLegendary={isLegendary}
          feverActive={feverActive}
          feverWarning={feverWarning}
          feverIntroStage={feverIntroStage}
        />
        {phase === "transition" && <DiveTransitionOverlay onComplete={handleTransitionComplete} />}
      </div>

      <Controls onMoveStart={handleMoveStart} onMoveEnd={stopMove} disabled={status !== "playing"} />

      <GameOverModal
        open={status === "gameover"}
        info={gameOverInfo}
        depth={Math.floor(diver.depth)}
        onReplay={handleReplay}
        onContinueInPlace={continueInPlace}
      />
    </div>
  );
};

export default GamePlay;
