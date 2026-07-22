import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGameIdentity } from "@/contexts/GameIdentityContext";

export interface GamePlayerRow {
  uid: string;
  nickname: string;
  current_points: number;
  max_depth: number;
  equipped_skin: string;
  inventory: string[];
  hearts_remaining: number;
}

export interface SettleResult {
  earnedPoints: number;
  totalPoints: number;
  isNewRecord: boolean;
  maxDepth: number;
  becameRank1: boolean;
}

interface GamePlayerContextValue {
  player: GamePlayerRow | null;
  loading: boolean;
  isLegendary: boolean;
  refresh: () => Promise<void>;
  settleRun: (depth: number) => Promise<SettleResult | null>;
  equipSkin: (skin: string) => Promise<void>;
  consumeHeart: () => Promise<number>;
  continueWithPayment: () => Promise<number>;
}

const GamePlayerContext = createContext<GamePlayerContextValue | undefined>(undefined);

export function GamePlayerProvider({ children }: { children: ReactNode }) {
  const { uid, nickname } = useGameIdentity();
  const [player, setPlayer] = useState<GamePlayerRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("game_players")
      .select("uid, nickname, current_points, max_depth, equipped_skin, inventory, hearts_remaining")
      .eq("uid", uid)
      .maybeSingle();
    setPlayer(data ?? null);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const settleRun = useCallback(
    async (depth: number): Promise<SettleResult | null> => {
      const { data, error } = await supabase.rpc("settle_dive_score", {
        p_uid: uid,
        p_nickname: nickname,
        p_depth: depth,
      });
      if (error || !data) {
        console.error("settle_dive_score failed", error);
        return null;
      }
      await refresh();
      return data as unknown as SettleResult;
    },
    [uid, nickname, refresh],
  );

  const equipSkin = useCallback(
    async (skin: string) => {
      const { error } = await supabase.rpc("set_equipped_skin", { p_uid: uid, p_skin: skin });
      if (!error) await refresh();
    },
    [uid, refresh],
  );

  const consumeHeart = useCallback(async (): Promise<number> => {
    const { data, error } = await supabase.rpc("consume_game_heart", { p_uid: uid });
    if (error) {
      console.error("consume_game_heart failed", error);
      return player?.hearts_remaining ?? 0;
    }
    await refresh();
    return data as unknown as number;
  }, [uid, refresh, player?.hearts_remaining]);

  const continueWithPayment = useCallback(async (): Promise<number> => {
    const { data, error } = await supabase.rpc("grant_continue_heart", { p_uid: uid });
    if (error) {
      console.error("grant_continue_heart failed", error);
      return player?.hearts_remaining ?? 0;
    }
    await refresh();
    return data as unknown as number;
  }, [uid, refresh, player?.hearts_remaining]);

  const isLegendary = player?.equipped_skin === "skin_legendary_diver";

  const value = useMemo(
    () => ({
      player,
      loading,
      isLegendary,
      refresh,
      settleRun,
      equipSkin,
      consumeHeart,
      continueWithPayment,
    }),
    [player, loading, isLegendary, refresh, settleRun, equipSkin, consumeHeart, continueWithPayment],
  );

  return <GamePlayerContext.Provider value={value}>{children}</GamePlayerContext.Provider>;
}

export function useGamePlayer(): GamePlayerContextValue {
  const ctx = useContext(GamePlayerContext);
  if (!ctx) throw new Error("useGamePlayer must be used within GamePlayerProvider");
  return ctx;
}
