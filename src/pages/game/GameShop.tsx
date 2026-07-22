import { Lock, Check } from "lucide-react";
import { useGamePlayer } from "@/contexts/GamePlayerContext";
import { SPRITES } from "@/lib/game/sprites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkinDef {
  id: string;
  name: string;
  sprite: string;
  description: string;
}

const SKINS: SkinDef[] = [
  {
    id: "default",
    name: "기본 다이버",
    sprite: SPRITES.diverDefault,
    description: "누구나 사용할 수 있는 기본 스킨입니다.",
  },
  {
    id: "skin_legendary_diver",
    name: "전설의 다이버",
    sprite: SPRITES.diverLegendary,
    description: "황금빛 왕관과 오라를 두른 전설의 스킨입니다.",
  },
];

const GameShop = () => {
  const { player, equipSkin } = useGamePlayer();

  const owned = player?.inventory ?? [];
  const equipped = player?.equipped_skin ?? "default";

  return (
    <div className="flex-1 space-y-4 px-4 py-4">
      <div className="text-center">
        <h1 className="text-sm font-bold tracking-wide text-primary">캐릭터 보관함</h1>
        <p className="text-[10px] text-muted-foreground">다이버 스킨 컬렉션</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SKINS.map((skin) => {
          const isOwned = skin.id === "default" || owned.includes(skin.id);
          const isEquipped = equipped === skin.id;
          const isLegendary = skin.id !== "default";

          return (
            <div
              key={skin.id}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border bg-card p-3 text-center",
                isLegendary ? "border-game-gold/50" : "border-border",
              )}
            >
              <div className="relative flex h-20 w-20 items-center justify-center rounded-md bg-secondary">
                <img
                  src={skin.sprite}
                  alt={skin.name}
                  crossOrigin="anonymous"
                  className={cn("h-14 w-14 object-contain", !isOwned && "opacity-30 grayscale")}
                  style={{ imageRendering: "pixelated" }}
                />
                {!isOwned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              <p className="text-xs font-semibold text-foreground">{skin.name}</p>
              <p className="text-[10px] leading-snug text-muted-foreground">{skin.description}</p>

              {isOwned ? (
                isEquipped ? (
                  <Button size="sm" variant="secondary" disabled className="w-full gap-1 text-[11px]">
                    <Check className="h-3.5 w-3.5" />
                    장착 중
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full text-[11px]"
                    onClick={() => equipSkin(skin.id)}
                  >
                    장착하기
                  </Button>
                )
              ) : (
                <div className="w-full space-y-1">
                  <Button size="sm" variant="outline" disabled className="w-full text-[10px] leading-tight">
                    구매 불가
                  </Button>
                  <p className="text-[9px] leading-tight text-game-gold">
                    획득 불가: 실시간 전 세계 랭킹 1위 달성 시 즉시 자동 해금됩니다.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameShop;
