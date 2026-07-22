import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Skull, AlertTriangle, RotateCcw, Gem, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GameOverInfo } from "@/hooks/useDiveGame";
import type { SettleResult } from "@/contexts/GamePlayerContext";
import { useGamePlayer } from "@/contexts/GamePlayerContext";
import { RankCrownBanner } from "@/components/game/RankCrownBanner";
import { ContinuePaymentModal } from "@/components/game/ContinuePaymentModal";

interface GameOverModalProps {
  open: boolean;
  info: GameOverInfo | null;
  depth: number;
  onReplay: () => void;
  onContinueInPlace: () => void;
}

function estimatePoints(depth: number): number {
  let bonus = 0;
  if (depth >= 300) bonus = 2000;
  else if (depth >= 100) bonus = 500;
  return depth * 10 + bonus;
}

export function GameOverModal({ open, info, depth, onReplay, onContinueInPlace }: GameOverModalProps) {
  const { settleRun, consumeHeart, player } = useGamePlayer();
  const [settling, setSettling] = useState(false);
  const [result, setResult] = useState<SettleResult | null>(null);
  const [showCrownBanner, setShowCrownBanner] = useState(false);
  const [heartsAfterLoss, setHeartsAfterLoss] = useState<number | null>(null);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const settledRef = useRef(false);
  const heartConsumedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      settledRef.current = false;
      heartConsumedRef.current = false;
      setResult(null);
      setShowCrownBanner(false);
      setHeartsAfterLoss(null);
      setShowContinueModal(false);
      return;
    }
    if (!heartConsumedRef.current) {
      heartConsumedRef.current = true;
      consumeHeart().then(setHeartsAfterLoss);
    }
  }, [open, consumeHeart]);

  const handleClaim = async () => {
    if (settledRef.current) return;
    settledRef.current = true;
    setSettling(true);
    const settled = await settleRun(depth);
    setSettling(false);
    if (settled) {
      setResult(settled);
      if (settled.becameRank1) {
        setShowCrownBanner(true);
        confetti({
          particleCount: 180,
          spread: 100,
          origin: { y: 0.4 },
          colors: ["#FFD700", "#FFF3B0", "#FFA500"],
        });
      } else if (settled.isNewRecord) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#FF6B6B", "#22D3EE", "#FFFFFF"],
        });
      }
    }
  };

  const handleReplayClick = () => {
    const hearts = heartsAfterLoss ?? player?.hearts_remaining ?? 0;
    if (hearts <= 0) {
      setShowContinueModal(true);
      return;
    }
    onReplay();
  };

  if (showCrownBanner) {
    return <RankCrownBanner onClose={() => setShowCrownBanner(false)} />;
  }

  const isAirOut = info?.reason === "air";

  return (
    <>
      <Dialog open={open && !showContinueModal}>
        <DialogContent
          className="game-theme text-center sm:max-w-sm"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
              {isAirOut ? (
                <AlertTriangle className="h-8 w-8 text-destructive" />
              ) : (
                <Skull className="h-8 w-8 text-destructive" />
              )}
            </div>
            <DialogTitle className="text-center text-base">
              {info?.message ?? "다이빙이 중단되었습니다."}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>도달 수심: {depth}m</p>
            {!result && <p>예상 획득 포인트: {estimatePoints(depth).toLocaleString()}P</p>}
            {heartsAfterLoss !== null && (
              <div className="flex items-center justify-center gap-1 pt-1">
                <Heart className="h-3.5 w-3.5 fill-game-coral text-game-coral" />
                <span className="text-xs">남은 하트 {heartsAfterLoss}개</span>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-1 rounded-lg border border-primary/30 bg-secondary/50 p-3 text-sm">
              <div className="flex items-center justify-center gap-1.5 font-semibold text-primary">
                <Gem className="h-4 w-4" />
                {result.earnedPoints.toLocaleString()}P 획득
              </div>
              <p className="text-xs text-muted-foreground">누적 포인트 {result.totalPoints.toLocaleString()}P</p>
              {result.isNewRecord && <p className="text-xs font-semibold text-game-coral">신기록 달성!</p>}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            {!result ? (
              <Button onClick={handleClaim} disabled={settling} className="w-full">
                {settling ? "정산 중..." : "포인트 수령 후 종료"}
              </Button>
            ) : (
              <Button onClick={handleReplayClick} variant="secondary" className="w-full gap-2">
                <RotateCcw className="h-4 w-4" />
                다시 도전하기
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ContinuePaymentModal
        open={showContinueModal}
        onClose={() => setShowContinueModal(false)}
        onContinue={() => {
          setShowContinueModal(false);
          onContinueInPlace();
        }}
      />
    </>
  );
}
