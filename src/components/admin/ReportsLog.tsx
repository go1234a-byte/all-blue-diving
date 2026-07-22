import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReviewModerationQueue, AllReviewsAdminPanel } from "@/components/admin/ReviewModerationQueue";
import { useAppData } from "@/contexts/AppDataContext";

/** 모바일 폭에 맞춘 카드형 신고 목록 — 기존 데스크톱 표 대신 사용한다. */
export function ReportsLog() {
  const { reports, resolveReport } = useAppData();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {reports.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">접수된 신고가 없습니다.</p>
        )}
        {reports.map((report) => (
          <div key={report.id} className="space-y-1.5 rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {report.targetName}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({report.targetType === "instructor" ? "강사" : "다이버"})
                </span>
              </p>
              <Badge variant={report.status === "pending" ? "secondary" : "default"} className="shrink-0 text-[10px]">
                {report.status === "pending" ? "처리 대기" : "처리 완료"}
              </Badge>
            </div>
            <Badge variant="outline" className="text-[10px]">{report.violationType}</Badge>
            <p className="text-xs text-muted-foreground">{report.description}</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              disabled={report.status === "resolved"}
              onClick={() => resolveReport(report.id)}
            >
              처리 완료 표시
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">신고된 후기 관리</h3>
        <ReviewModerationQueue />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">전체 후기 관리</h3>
        <p className="text-xs text-muted-foreground">
          후기를 클릭하면 상세 내용을 확인하고 삭제할 수 있습니다. (관리자만 가능)
        </p>
        <AllReviewsAdminPanel />
      </div>
    </div>
  );
}
