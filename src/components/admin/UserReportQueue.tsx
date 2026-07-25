import { useSearchParams } from "react-router-dom";
import { Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateTimeKR } from "@/lib/dates";

/**
 * 관리자 대시보드 "최근 알림"의 "신고 접수" 항목은 reports 테이블(회원이 다른 회원/강사를
 * 신고한 내역, targetType/violationType/description)을 소스로 사용하는데, 기존에는 이 데이터가
 * 어디에도 실제로 렌더링되지 않고 대시보드 요약 카드에만 축약 표시되었다.
 * 이 컴포넌트가 그 신고 원문(사유 설명 포함)을 실제로 보여주고, 처리 완료 처리도 할 수 있게 한다.
 */
export function UserReportQueue() {
  const { reports, resolveReport } = useAppData();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const sorted = [...reports].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  if (sorted.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">접수된 신고가 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map((report) => (
        <div
          key={report.id}
          className={`space-y-2 rounded-xl border p-3 ${
            report.id === highlightId ? "border-primary bg-secondary/60" : "border-border bg-card"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-destructive" />
              <span className="text-sm font-medium text-foreground">{report.violationType}</span>
              <Badge variant="outline" className="text-[10px]">
                {report.targetType === "instructor" ? "강사" : "다이버"} · {report.targetName}
              </Badge>
            </div>
            <Badge variant={report.status === "pending" ? "secondary" : "default"} className="shrink-0 text-[10px]">
              {report.status === "pending" ? "처리 대기" : "처리 완료"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{report.description}</p>
          <p className="text-[11px] text-muted-foreground">접수일시: {formatDateTimeKR(report.createdAt)}</p>
          {report.status === "pending" && (
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => resolveReport(report.id)}>
              처리 완료로 변경
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
