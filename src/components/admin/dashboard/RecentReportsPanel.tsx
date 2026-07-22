import { useNavigate } from "react-router-dom";
import { Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";

/** 실시간 운영 - 신고 접수: 신고 유형/대상/접수 시간/처리 상태. */
export function RecentReportsPanel() {
  const { reports } = useAppData();
  const navigate = useNavigate();
  const recent = [...reports].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Flag className="h-4 w-4 text-destructive" />
          신고 접수
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => navigate("/admin/reports")}>
          전체보기
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">접수된 신고가 없습니다.</p>
        ) : (
          recent.map((report) => (
            <div key={report.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {report.violationType} · {report.targetName}
                </p>
                <p className="text-[11px] text-muted-foreground">{formatDateKR(report.createdAt)}</p>
              </div>
              <Badge variant={report.status === "pending" ? "secondary" : "default"} className="shrink-0 text-[10px]">
                {report.status === "pending" ? "처리 대기" : "처리 완료"}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
