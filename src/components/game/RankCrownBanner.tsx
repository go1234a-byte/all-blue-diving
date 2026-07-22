import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RankCrownBannerProps {
  onClose: () => void;
}

export function RankCrownBanner({ onClose }: RankCrownBannerProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 px-6 text-center">
      <Crown className="h-16 w-16 animate-crown-glow text-game-gold" />
      <h2 className="bg-gradient-to-r from-game-gold via-yellow-100 to-game-gold bg-clip-text text-xl font-bold text-transparent">
        축하합니다!
      </h2>
      <p className="text-sm text-foreground">
        실시간 세계 랭킹 1위를 정복하여
        <br />
        <span className="font-semibold text-game-gold">[전설의 다이버]</span> 스킨과 왕관이 해금되었습니다!
      </p>
      <Button onClick={onClose} className="mt-2 bg-game-gold text-black hover:bg-game-gold/90">
        확인
      </Button>
    </div>
  );
}
