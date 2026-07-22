import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";

/** 운영 모니터링 - 패널티 경고 현황: 경고 받은 강사/사유/날짜/조치 상태. */
export function PenaltyWarningPanel() {
  const { penalties, instructors } = useAppData();
  const navigate = useNavigate();
  const recent = penalties.slice(0, 5);

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-warning" />
          패널티 경고 현황
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => navigate("/admin/instructors")}>
          전체보기
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">경고 이력이 없습니다.</p>
        ) : (
          recent.map((penalty) => {
            const instructor = instructors.find((i) => i.id === penalty.instructorId);
            return (
              <div key={penalty.id} className="rounded-lg border border-warning/30 bg-warning/5 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{instructor?.name ?? "-"}</span>
                  <Badge variant="secondary" className="text-[10px]">조치 완료</Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{penalty.violationType} · {penalty.description}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDateKR(penalty.createdAt)}</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
