import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGamePlayer } from "@/contexts/GamePlayerContext";

interface ContinuePaymentModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const CONTINUE_PRICE = 500;

export function ContinuePaymentModal({ open, onClose, onContinue }: ContinuePaymentModalProps) {
  const { continueWithPayment } = useGamePlayer();
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    // 실제 PG 연동 키가 없어 결제 프로세스를 시뮬레이션합니다.
    setTimeout(async () => {
      await continueWithPayment();
      setProcessing(false);
      onContinue();
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !processing && onClose()}>
      <DialogContent className="game-theme text-center sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-game-coral/15">
            <Heart className="h-8 w-8 fill-game-coral text-game-coral" />
          </div>
          <DialogTitle className="text-center text-base">하트를 모두 소진했습니다</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {CONTINUE_PRICE.toLocaleString()}원을 결제하고 하트 1개를 충전해 다이빙을 이어가시겠습니까?
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <Button onClick={handlePay} disabled={processing} className="w-full">
            {processing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                결제 처리 중...
              </span>
            ) : (
              `${CONTINUE_PRICE.toLocaleString()}원 결제하고 이어하기`
            )}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={processing} className="w-full">
            그만하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
