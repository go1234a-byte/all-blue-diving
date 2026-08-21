import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CANCELLATION_POLICY_LINES, CANCELLATION_POLICY_NOTE } from "@/lib/refund";
import { BUSINESS_INFO } from "@/lib/businessInfo";

const EFFECTIVE_DATE = "2026-08-08";

/**
 * 취소·환불 규정 — 이용약관 제12조(취소 및 환불)에서 안내하는 세부 규정 페이지.
 * PG(결제대행사) 가맹점 심사 기준(청약철회 예외 근거, 환불수단·처리기간 명시, 부분취소,
 * 결제오류 정정 등)을 반영해 스카이스캐너/트립닷컴류 여행 플랫폼의 취소·환불 페이지 구성을
 * 참고해 보강했다. 잔여일수 기준 환불율(lib/refund.ts의 CANCELLATION_POLICY_LINES — 결제
 * 화면에도 동일하게 노출되는 단일 소스)은 이 파일에서 직접 작성하지 않고 항상 거기서 가져와
 * 표시해 두 곳이 어긋나지 않게 한다.
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
              취소·환불은 예약 상품 상세페이지에 고지된 조건과 아래 4항의 잔여일수 기준을 기본으로
              처리하며, 「전자상거래 등에서의 소비자보호에 관한 법률」 등 법령상 소비자 보호규정이
              적용되는 경우 해당 규정을 우선합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">2. 청약철회</h2>
            <p>
              회원은 결제 완료일로부터 7일 이내에 「전자상거래 등에서의 소비자보호에 관한 법률」
              제17조에 따라 청약철회(단순 변심 취소)를 할 수 있습니다. 다만 같은 법 제17조제2항
              단서 및 동법 시행령에 따라, 여행 개시일이 임박하여 청약철회를 인정할 경우 회사 또는
              강사(센터) 회원에게 회복할 수 없는 중대한 피해가 예상되는 경우에는 청약철회가 제한될
              수 있으며, 이 경우 4항의 잔여일수 기준 환불율이 적용됩니다. 재화 등의 내용이 표시·광고
              내용과 다르거나 계약내용과 다르게 이행된 경우에는 그 사실을 안 날 또는 알 수 있었던
              날부터 30일 이내에 청약철회를 할 수 있습니다. 만 19세 미만의 미성년자 회원이
              법정대리인의 동의 없이 결제한 경우, 본인 또는 법정대리인은 「민법」 제5조에 따라
              해당 계약을 취소할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">3. 취소신청 방법</h2>
            <p>
              회원은 서비스 내 "내 예약" 화면에서 직접 취소를 신청할 수 있으며, 신청 즉시 아래 4항의
              기준에 따라 환불 예정 금액이 안내됩니다. 앱 이용이 어려운 경우 고객센터
              ({BUSINESS_INFO.email})를 통해서도 취소를 신청할 수 있습니다.
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <h2 className="mb-2 text-base font-semibold">4. 잔여일수 기준 환불율 (기본 정책)</h2>
            <p className="mb-3 text-muted-foreground">
              별도 정책을 정하지 않은 일반 예약에는 아래 기준이 적용되며, 결제 화면에도 동일한
              기준이 안내됩니다. 환불율은 플랫폼 이용료를 포함해 실제로 결제한 총액을 기준으로
              동일하게 산정합니다(투어 요금과 플랫폼 이용료를 구분하여 별도 처리하지 않습니다).
            </p>
            <ul className="space-y-1">
              {CANCELLATION_POLICY_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{CANCELLATION_POLICY_NOTE}</p>
            <p className="mt-3 rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
              예시) 결제금액 300,000원인 투어를 출발 20일 전에 취소한 경우 → "출발 15일 전까지" 구간에
              해당하므로 50%인 150,000원이 환불됩니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">5. 예약 인원 일부 취소</h2>
            <p>
              앱 내 취소 신청은 예약 건 전체를 기준으로 처리됩니다. 한 예약에 포함된 인원 중 일부만
              취소를 원하는 경우 서비스 내 '문의하기' 또는 고객센터({BUSINESS_INFO.email})로
              요청해주시면, 해당 인원 수에 해당하는 결제금액을 기준으로 4항의 환불율을 적용하여
              처리해드립니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">6. 환불 방법 및 처리기간</h2>
            <p>
              환불은 원칙적으로 결제에 사용한 결제수단(신용카드, 간편결제 등)으로 동일하게 처리하며,
              현금으로 환불하지 않습니다. 회사는 취소 신청이 접수되면 지체 없이(늦어도 3영업일 이내)
              환불 절차를 개시하며, 실제 환급이 반영되는 시점은 카드사·결제대행사(PG)의 처리절차에
              따라 영업일 기준 3~7일 정도 소요될 수 있습니다. 회사의 귀책사유로 환불이 지연되는 경우
              「전자상거래 등에서의 소비자보호에 관한 법률」 제18조제5항에 따라 지연기간에 대해
              「전자상거래 등에서의 소비자보호에 관한 법률 시행령」이 정하는 지연배상금(이자)을
              함께 지급합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">7. 공급자(강사·센터) 취소</h2>
            <p>
              기상, 해상상태, 안전상 이유, 최소인원 미달 등 공급자 사유로 취소되는 경우 상품별 정책과
              관련 법령에 따라 전액 환불 또는 일정변경을 진행합니다. 이 경우 4항의 잔여일수 기준과
              무관하게 결제금액 전액을 환불합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">8. 불가항력</h2>
            <p>
              천재지변, 정부의 여행제한 및 해상상황 등 통제하기 어려운 사유는 상품별 정책과 관련 법령에
              따라 처리합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">9. 노쇼·지각</h2>
            <p>
              노쇼 또는 지각에 대한 환불 여부는 상품별 정책에 따르며, 상품 상세페이지에서 사전
              고지합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">10. 결제 오류 및 이중결제</h2>
            <p>
              시스템 오류, 네트워크 장애 등으로 동일한 예약 건에 대해 결제가 중복으로 이루어진 경우,
              회사는 이를 확인하는 즉시 중복 결제된 금액 전액을 결제수단으로 환불합니다. 결제
              오류를 발견한 경우 고객센터로 문의해주시면 신속히 확인 후 처리합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">11. 정산과 환불</h2>
            <p>
              투어 종료 및 환불 가능기간 종료 후 강사(센터) 정산을 확정합니다. 정산 전 환불은 해당
              금액을 정산에 반영하며, 정산 후 환불은 계약에 따른 회수 또는 차감 절차를 적용할 수
              있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">12. 문의 및 이의제기</h2>
            <p>
              취소·환불과 관련하여 문의나 이의가 있는 경우 서비스 내 '문의하기' 또는 고객센터
              ({BUSINESS_INFO.email}, {BUSINESS_INFO.phone})로 접수해주시면 접수일로부터 3영업일
              이내에 처리 결과를 안내합니다.
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <p>이 취소·환불 규정은 {EFFECTIVE_DATE}부터 시행합니다.</p>
          </section>

          <section className="border-t border-border pt-6 text-muted-foreground">
            <p>상호: {BUSINESS_INFO.companyName}</p>
            <p>대표자: {BUSINESS_INFO.ceoName}</p>
            <p>사업자등록번호: {BUSINESS_INFO.businessNumber}</p>
            <p>통신판매업신고번호: {BUSINESS_INFO.mailOrderNumber}</p>
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
