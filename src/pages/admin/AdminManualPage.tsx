import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CANCELLATION_POLICY_LINES, CANCELLATION_POLICY_NOTE } from "@/lib/refund";

const INSTRUCTOR_VERIFICATION_STEPS = [
  "1. 신분증 인증",
  "2. 강사 자격증 업로드",
  "3. 보험 등록 (선택)",
  "4. 플랫폼 윤리강령 동의",
  "5. 전자 서약",
  "6. 관리자 승인",
];

const SETTLEMENT_STEPS = [
  "예약 결제 완료 시 정산 예정(scheduled) 상태로 등록",
  "분쟁/이의신청 발생 시 정산 보류(held) 처리 가능",
  "1차 정산 80% + 2차 정산 20%로 강사에게 지급",
  "지급 완료 후 정산 완료(released) 상태로 전환",
];

/** 운영 매뉴얼 — 취소/환불 정책, 강사 인증 절차, 정산 절차를 정적 가이드로 정리. */
const AdminManualPage = () => {
  return (
    <div className="space-y-4">
      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">취소 및 환불 규정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {CANCELLATION_POLICY_LINES.map((line) => (
            <p key={line} className="text-xs leading-relaxed text-muted-foreground">{line}</p>
          ))}
          <p className="pt-1 text-[11px] text-muted-foreground/80">{CANCELLATION_POLICY_NOTE}</p>
        </CardContent>
      </Card>

      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">강사 인증 절차</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {INSTRUCTOR_VERIFICATION_STEPS.map((step) => (
            <p key={step} className="text-xs text-muted-foreground">{step}</p>
          ))}
        </CardContent>
      </Card>

      <Card className="accent-top-ocean">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">정산 절차</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {SETTLEMENT_STEPS.map((step) => (
            <p key={step} className="text-xs text-muted-foreground">• {step}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManualPage;
