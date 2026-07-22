import { useEffect, useState } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGameIdentity } from "@/contexts/GameIdentityContext";
import { useGamePlayer } from "@/contexts/GamePlayerContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface LeaderboardRow {
  uid: string;
  nickname: string;
  max_depth: number;
  current_points: number;
}

const RANK_STYLES: Record<number, { icon: typeof Trophy; color: string }> = {
  1: { icon: Trophy, color: "text-game-gold" },
  2: { icon: Medal, color: "text-slate-300" },
  3: { icon: Award, color: "text-amber-600" },
};

const GameLeaderboard = () => {
  const { uid } = useGameIdentity();
  const { player } = useGamePlayer();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchTop = async () => {
      const { data } = await supabase
        .from("game_players")
        .select("uid, nickname, max_depth, current_points")
        .order("max_depth", { ascending: false })
        .limit(10);
      if (active) {
        setRows(data ?? []);
        setLoading(false);
      }
    };
    fetchTop();
    return () => {
      active = false;
    };
  }, []);

  const isCurrentUserInTop10 = rows.some((row) => row.uid === uid);

  return (
    <div className="flex-1 space-y-4 px-4 py-4">
      <div className="text-center">
        <h1 className="text-sm font-bold tracking-wide text-primary">실시간 다이빙 랭킹</h1>
        <p className="text-[10px] text-muted-foreground">TOP 10 다이버</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center text-[11px]">순위</TableHead>
              <TableHead className="text-[11px]">다이버</TableHead>
              <TableHead className="text-right text-[11px]">최대 수심</TableHead>
              <TableHead className="text-right text-[11px]">총 포인트</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                  불러오는 중...
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                  아직 기록이 없습니다. 첫 다이빙을 시작해보세요!
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, index) => {
              const rank = index + 1;
              const rankStyle = RANK_STYLES[rank];
              const RankIcon = rankStyle?.icon;
              const isMe = row.uid === uid;
              return (
                <TableRow key={row.uid} className={cn(isMe && "bg-primary/10")}>
                  <TableCell className="text-center">
                    {RankIcon ? (
                      <RankIcon className={cn("mx-auto h-4 w-4", rankStyle.color)} />
                    ) : (
                      <span className="text-xs text-muted-foreground">{rank}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {row.nickname}
                    {isMe && <span className="ml-1 text-[10px] text-primary">(나)</span>}
                  </TableCell>
                  <TableCell className="text-right text-xs text-foreground">{row.max_depth}m</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {row.current_points.toLocaleString()}P
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {player && !isCurrentUserInTop10 && (
        <div className="rounded-lg border-2 border-game-coral bg-card p-3">
          <p className="mb-2 text-[10px] font-semibold text-game-coral">내 기록</p>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{player.nickname}</span>
            <span className="text-foreground">{player.max_depth}m</span>
            <span className="text-muted-foreground">{player.current_points.toLocaleString()}P</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameLeaderboard;
