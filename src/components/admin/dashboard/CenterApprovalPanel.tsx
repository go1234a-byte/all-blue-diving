import { useNavigate } from "react-router-dom";
import { Building2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateKR } from "@/lib/dates";

/** 운영 모니터링 - 센터 승인 요청: 센터명/국가/신청일/승인/반려. */
export function CenterApprovalPanel() {
  const { centers } = useAppData();
  const navigate = useNavigate();
  const recent = [...centers].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);

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
        {recent.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">등록된 센터가 없습니다.</p>
        ) : (
          recent.map((center) => (
            <div key={center.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{center.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {center.country ?? "-"} · {formatDateKR(center.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge variant="default" className="gap-1 text-[10px]">
                  <Check className="h-3 w-3" />
                  승인됨
                </Badge>
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled aria-label="반려">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
