import { ReviewModerationQueue, AllReviewsAdminPanel } from "@/components/admin/ReviewModerationQueue";
import { SupportTicketQueue } from "@/components/admin/SupportTicketQueue";

/** 모바일 폭에 맞춘 카드형 신고 목록 — 기존 데스크톱 표 대신 사용한다. */
export function ReportsLog() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">회원 신고 접수 내역</h3>
        <p className="text-xs text-muted-foreground">
          문의관리와 동일하게 신고자 이름/연락처/ID/접수일시가 함께 표시됩니다.
        </p>
        <SupportTicketQueue types={["report"]} emptyMessage="접수된 신고가 없습니다." />
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
