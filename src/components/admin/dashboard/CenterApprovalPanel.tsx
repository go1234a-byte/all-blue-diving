import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateKR } from "@/lib/dates";

/**
 * 운영 모니터링 - 센터 승인 요청: 실제로 승인 대기(status === "pending") 중인 센터만 노출한다.
 * 예전에는 상태 개념 자체가 없어서 모든 센터에 "승인됨" 배지를 하드코딩하고 반려 버튼은
 * 항상 비활성화되어 있었다 — 승인 워크플로우가 있는 것처럼 보이지만 실제로는 가짜였다.
 * 반려는 사유 입력이 필요해 이 위젯에서 바로 처리하지 않고 /admin/centers로 이동시킨다.
 */
export function CenterApprovalPanel() {
  const { centers, setCenterStatus } = useAppData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const pending = [...centers]
    .filter((c) => c.status === "pending")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  const handleApprove = async (centerId: string, name: string) => {
    setApprovingId(centerId);
    try {
      await setCenterStatus(centerId, "approved");
      toast({ title: `"${name}" 센터를 승인했습니다.` });
    } catch (err) {
      toast({ title: "승인 실패", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Building2 className="h-4 w-4 text-primary" />
          센터 승인 요청
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => navigate("/admin/centers")}>
          전체보기
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">승인 대기 중인 센터가 없습니다.</p>
        ) : (
          pending.map((center) => (
            <div key={center.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{center.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {center.country ?? "-"} · {formatDateKR(center.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-success"
                  aria-label="승인"
                  disabled={approvingId === center.id}
                  onClick={() => handleApprove(center.id, center.name)}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive"
                  aria-label="반려"
                  onClick={() => navigate("/admin/centers")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
