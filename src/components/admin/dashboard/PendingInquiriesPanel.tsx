import { useNavigate } from "react-router-dom";
import { MessageCircleWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";

/** 실시간 운영 - 문의 대기: 답변 대기 문의, 긴급 문의(분쟁/신고 유형). */
export function PendingInquiriesPanel() {
  const { supportTickets } = useAppData();
  const navigate = useNavigate();
  const pending = supportTickets.filter((t) => t.status === "접수" || t.status === "검토중");
  const urgent = pending.filter((t) => t.type === "dispute" || t.type === "report");

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <MessageCircleWarning className="h-4 w-4 text-primary" />
          문의 대기
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => navigate("/admin/support")}>
          전체보기
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">답변 대기 문의</span>
          <span className="text-sm font-bold text-foreground">{pending.length}건</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-destructive/10 px-3 py-2">
          <span className="text-xs text-destructive">긴급 문의 (분쟁·신고)</span>
          <Badge variant="destructive" className="text-[10px]">{urgent.length}건</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
