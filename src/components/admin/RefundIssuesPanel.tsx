import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDateKR } from "@/lib/dates";
import { formatKRW } from "@/lib/pricing";
import { kickRefunds } from "@/lib/payment";

interface RefundRow {
  id: string;
  booking_id: string;
  amount: number;
  status: "pending" | "processing" | "failed";
  attempts: number;
  last_error: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<RefundRow["status"], string> = { pending: "대기", processing: "처리 중", failed: "실패" };

/**
 * 환불이 아직 끝나지 않은 건(대기·처리 중·실패)을 보여준다. 취소가 확정되면 환불 요청이 자동으로 쌓이고 서버가 토스
 * 결제 취소를 실행하는데, 토스 오류 등으로 막힌 건은 여기 남는다 — 돈을 돌려줘야 하는 건이라 방치되면 안 된다.
 * 처음 시도 직후(2분 이내)의 대기·처리 중은 정상이라 숨긴다.
 */
export function RefundIssuesPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState<RefundRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("refund_requests" as never)
      .select("id,booking_id,amount,status,attempts,last_error,created_at")
      .neq("status", "done")
      .order("created_at", { ascending: false })
      .limit(50);
    const cutoff = Date.now() - 2 * 60 * 1000;
    setRows(((data as RefundRow[] | null) ?? []).filter((r) => r.status === "failed" || new Date(r.created_at).getTime() < cutoff));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const retry = async (id: string) => {
    setBusy(id);
    try {
      const { error } = await supabase.rpc("retry_refund_request" as never, { p_id: id } as never);
      if (error) throw new Error(error.message);
      kickRefunds();
      toast({ title: "환불을 다시 시도합니다", description: "잠시 후 이 목록을 새로고침해 결과를 확인하세요." });
      window.setTimeout(() => void load(), 4000);
    } catch (err) {
      toast({ title: "재시도하지 못했습니다", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
        <AlertTriangle className="h-4 w-4" />
        환불 미완료 ({rows.length}건)
      </div>
      {rows.map((r) => (
        <Card key={r.id} className="border-destructive/40">
          <CardContent className="flex items-center justify-between gap-2 p-3">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-sm font-semibold text-foreground">{formatKRW(r.amount)} 환불</p>
              <p className="text-xs text-muted-foreground">
                예약 {r.booking_id.slice(0, 8)} · {formatDateKR(r.created_at)} · 시도 {r.attempts}회
              </p>
              {r.last_error && <p className="line-clamp-2 text-xs text-destructive">{r.last_error}</p>}
            </div>
            <Badge variant="secondary" className="shrink-0 text-[10px]">{STATUS_LABEL[r.status]}</Badge>
            {r.status === "failed" && (
              <Button size="sm" variant="outline" className="shrink-0 gap-1 text-xs" disabled={busy === r.id} onClick={() => void retry(r.id)}>
                <RotateCw className="h-3.5 w-3.5" />
                {busy === r.id ? "재시도 중..." : "환불 재시도"}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
