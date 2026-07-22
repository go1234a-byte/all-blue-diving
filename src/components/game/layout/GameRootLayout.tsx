import { Outlet } from "react-router-dom";
import { GameIdentityProvider } from "@/contexts/GameIdentityContext";
import { GamePlayerProvider } from "@/contexts/GamePlayerContext";
import { GameBottomNav } from "@/components/game/layout/GameBottomNav";

export function GameRootLayout() {
  return (
    <div className="game-theme min-h-full bg-background">
      <GameIdentityProvider>
        <GamePlayerProvider>
          <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col bg-gradient-game-chrome pb-16 shadow-game-glow">
            <Outlet />
          </div>
          <div className="mx-auto w-full max-w-[480px]">
            <GameBottomNav />
          </div>
        </GamePlayerProvider>
      </GameIdentityProvider>
    </div>
  );
}
