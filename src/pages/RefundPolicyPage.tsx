import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CANCELLATION_POLICY_LINES, CANCELLATION_POLICY_NOTE } from "@/lib/refund";
import { BUSINESS_INFO } from "@/lib/businessInfo";

const EFFECTIVE_DATE = "2026-08-08";

/**
 * 취소·환불 규정 — 이용약관 제9조(취소 및 환불)에서 안내하는 세부 규정 페이지.
 * 1~7항은 법적 원칙을, 8항은 실제 서비스에 적용되는 잔여일수 기준 환불율(lib/refund.ts의
 * CANCELLATION_POLICY_LINES — 결제 화면에도 동일하게 노출되는 단일 소스)을 그대로 보여준다.
 * 두 내용이 서로 어긋나지 않도록, 숫자 기준은 이 파일에서 직접 작성하지 않고 항상
 * lib/refund.ts에서 가져와 표시한다.
 */
const RefundPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-foreground">취소·환불 규정</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          시행일: {EFFECTIVE_DATE}
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="mb-2 text-base font-semibold">1. 기본원칙</h2>
            <p>
              취소·환불은 예약 상품 상세페이지에 고지된 조건을 기준으로 처리하며, 「전자상거래 등에서의
              소비자보호에 관한 법률」 등 법령상 소비자 보호규정이 적용되는 경우 해당 규정을 우선합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">2. 취소신청</h2>
            <p>
              회원은 예약내역에서 취소를 신청할 수 있으며, 투어 출발일과 취소 시점, 상품별 정책에 따라
              환불금액이 달라질 수 있습니다. 구체적인 기준은 아래 8항을 참고해주세요.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">3. 공급자(강사·센터) 취소</h2>
            <p>
              기상, 해상상태, 안전상 이유, 최소인원 미달 등 공급자 사유로 취소되는 경우 상품별 정책과
              관련 법령에 따라 전액 환불 또는 일정변경을 진행합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">4. 불가항력</h2>
            <p>
              천재지변, 정부의 여행제한 및 해상상황 등 통제하기 어려운 사유는 상품별 정책과 관련 법령에
              따라 처리합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">5. 환불처리</h2>
            <p>
              환불은 원칙적으로 결제수단을 통해 처리하며, 결제대행사(PG)의 처리시간에 따라 실제 환급
              시점이 달라질 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">6. 정산과 환불</h2>
            <p>
              투어 종료 및 환불 가능기간 종료 후 강사(센터) 정산을 확정합니다. 정산 전 환불은 해당
              금액을 정산에 반영하며, 정산 후 환불은 계약에 따른 회수 또는 차감 절차를 적용할 수
              있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">7. 노쇼·지각</h2>
            <p>
              노쇼 또는 지각에 대한 환불 여부는 상품별 정책에 따르며, 상품 상세페이지에서 사전
              고지합니다.
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <h2 className="mb-2 text-base font-semibold">8. 잔여일수 기준 환불율 (기본 정책)</h2>
            <p className="mb-3 text-muted-foreground">
              별도 정책을 정하지 않은 일반 예약에는 아래 기준이 적용됩니다. 결제 화면에도 동일한
              기준이 안내됩니다.
            </p>
            <ul className="space-y-1">
              {CANCELLATION_POLICY_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{CANCELLATION_POLICY_NOTE}</p>
          </section>

          <section className="border-t border-border pt-6">
            <p>이 취소·환불 규정은 {EFFECTIVE_DATE}부터 시행합니다.</p>
          </section>

          <section className="border-t border-border pt-6 text-muted-foreground">
            <p>상호: {BUSINESS_INFO.companyName}</p>
            <p>대표자: {BUSINESS_INFO.ceoName}</p>
            <p>주소: {BUSINESS_INFO.address}</p>
            <p>이메일: {BUSINESS_INFO.email}</p>
            <p>고객센터: {BUSINESS_INFO.phone}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
