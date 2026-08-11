import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BUSINESS_INFO = {
  serviceName: "올블루(ALL BLUE)",
  companyName: "올블루",
  ceoName: "박재우",
  businessNumber: "204-31-12475",
  mailOrderNumber: "2026-부산사상구-0348호",
  address: "부산광역시 사상구 백양대로494번길 10 102호",
  email: "help@allbluedive.com",
  phone: "010-2604-5661",
};

const EFFECTIVE_DATE = "2026-08-08";

const TermsPage = () => {
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

        <h1 className="mb-2 text-2xl font-bold text-foreground">이용약관</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          시행일: {EFFECTIVE_DATE}
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="mb-2 text-base font-semibold">제1조 (목적)</h2>
            <p>
              이 약관은 {BUSINESS_INFO.companyName}(이하 "회사")가 운영하는 스쿠버다이빙·프리다이빙·리브어보드
              투어 예약 중개 플랫폼 "{BUSINESS_INFO.serviceName}"(이하 "서비스")의 이용과 관련하여 회사와
              회원 간의 권리, 의무 및 책임사항, 이용조건 및 절차 등 기본적인 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제2조 (정의)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>"서비스"란 회사가 운영하는 웹사이트 및 관련 애플리케이션을 통해 제공하는 다이빙 투어
                정보 제공, 예약, 결제 중개 등 일체의 서비스를 의미합니다.</li>
              <li>"회원"이란 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 서비스를
                이용하는 자를 말하며, "다이버 회원"과 "강사(센터) 회원"으로 구분됩니다.</li>
              <li>"강사(센터) 회원"이란 서비스를 통해 다이빙 투어 상품을 등록·판매하는 강사 또는
                다이빙 센터를 말합니다.</li>
              <li>"투어"란 강사(센터) 회원이 서비스에 등록한 다이빙 관련 상품 및 프로그램을 말합니다.</li>
              <li>"결제대행사(PG)"란 회사와 계약을 체결하여 서비스 내 결제 처리를 대행하는 전자지급결제대행업체를 말합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제3조 (약관의 게시와 개정)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면 또는 연결 화면을
                통해 게시합니다.</li>
              <li>회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」 등
                관련 법령을 위반하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
              <li>회사가 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 적용일자 최소 7일 전(회원에게
                불리한 변경의 경우 30일 전)부터 서비스 내 공지합니다.</li>
              <li>회원이 개정약관의 적용에 동의하지 않는 경우 이용계약을 해지할 수 있으며, 공지된 적용일
                이후에도 서비스를 계속 이용하는 경우 개정약관에 동의한 것으로 봅니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제4조 (회원가입)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>이용자는 회사가 정한 절차에 따라 필요 정보를 입력하고 이 약관에 동의함으로써
                회원가입을 신청합니다.</li>
              <li>회사는 다음 각 호에 해당하는 신청에 대해 승낙을 하지 않거나 사후에 이용계약을
                해지할 수 있습니다.
                <ol className="mt-1 list-[lower-alpha] space-y-1 pl-5">
                  <li>타인의 명의를 이용하거나 허위 정보를 기재한 경우</li>
                  <li>강사(센터) 회원의 경우 자격증·보험 등 회사가 요구하는 인증 서류를 제출하지
                    않거나 심사에 통과하지 못한 경우</li>
                  <li>기타 회원의 귀책사유로 승낙이 곤란한 경우</li>
                </ol>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제5조 (서비스의 제공 및 변경)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>회사는 다이빙 투어 정보 제공, 예약 및 결제 중개, 강사(센터)와 다이버 간 채팅,
                리뷰 등의 서비스를 제공합니다.</li>
              <li>회사는 서비스의 내용, 운영상·기술상의 필요에 따라 제공하는 서비스의 전부 또는
                일부를 변경할 수 있으며, 변경 시 사전에 공지합니다.</li>
              <li>회사는 강사(센터) 회원이 등록한 투어 정보의 중개자이며, 투어의 실제 진행 주체는
                해당 강사(센터) 회원입니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제6조 (서비스의 중단)</h2>
            <p>
              회사는 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 통신두절 또는 운영상 상당한
              이유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있으며, 사전 공지가 불가능한
              부득이한 경우 사후에 공지할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제7조 (회원의 의무)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>회원은 관계 법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항을
                준수하여야 하며, 기타 회사의 업무에 방해되는 행위를 하여서는 안 됩니다.</li>
              <li>강사(센터) 회원은 다이빙 강습·투어 진행에 필요한 자격, 보험, 안전 장비 등을
                관계 법령에 따라 갖추어야 하며, 투어 정보를 사실과 다르게 등록해서는 안 됩니다.</li>
              <li>회원은 계정 정보를 제3자에게 양도, 대여할 수 없습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제8조 (예약 및 결제)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>회원은 서비스 내에서 원하는 투어를 선택하여 예약을 신청하고, 회사가 제휴한
                결제대행사(PG)를 통해 대금을 결제합니다.</li>
              <li>결제 관련 정보(카드정보 등)는 결제대행사를 통해 처리되며, 회사는 이를 직접
                저장하지 않습니다.</li>
              <li>예약은 강사(센터) 회원의 확정 절차를 거쳐 최종 확정되며, 확정 전까지는
                예약이 취소될 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제9조 (취소 및 환불)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>회원은 「전자상거래 등에서의 소비자보호에 관한 법률」이 정하는 바에 따라 청약철회를
                할 수 있습니다. 다만 투어 특성상 출발(이용)일이 임박한 경우 등 관계 법령이 정하는
                예외 사유에 해당할 수 있습니다.</li>
              <li>투어별 취소·환불 기준은 각 투어 상세 페이지에 안내된 취소 규정을 따르며,
                해당 규정은 관계 법령에 반하지 않는 범위에서 강사(센터) 회원이 설정합니다.</li>
              <li>회사 또는 강사(센터) 회원의 귀책사유로 투어가 취소되는 경우 결제금액 전액을
                환불합니다.</li>
              <li>
                취소·환불에 관한 세부 원칙은{" "}
                <Link to="/refund-policy" className="text-primary underline underline-offset-2">
                  취소·환불 규정
                </Link>
                을 통해 별도로 안내합니다.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제10조 (계약해지 및 이용제한)</h2>
            <p>
              회원은 언제든지 서비스 내 절차를 통해 이용계약 해지(회원탈퇴)를 신청할 수 있습니다.
              회사는 회원이 이 약관을 위반하거나 서비스의 정상적인 운영을 방해한 경우 사전 통지 후
              이용을 제한하거나 계약을 해지할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제11조 (손해배상 및 면책)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>회사는 무료로 제공되는 서비스와 관련하여 관련 법령에 특별한 규정이 없는 한
                회원에게 발생한 손해에 대해 책임을 지지 않습니다.</li>
              <li>회사는 강사(센터) 회원이 제공하는 투어 내용, 안전관리 등 실제 서비스 이행에 대해
                직접적인 책임을 지지 않으며, 이는 해당 강사(센터) 회원에게 있습니다. 다만 회사는
                관계 법령이 정하는 중개자로서의 책임을 다합니다.</li>
              <li>천재지변, 기상 악화 등 불가항력으로 인한 투어 취소·변경에 대해서는 회사가 책임을
                지지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제12조 (분쟁해결)</h2>
            <p>
              회사는 회원으로부터 제출되는 불만사항 및 의견을 우선적으로 처리하며, 신속한 처리가
              곤란한 경우 그 사유와 처리일정을 통보합니다. 회사와 회원 간 발생한 분쟁은 상호 협의를
              통해 해결하는 것을 원칙으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제13조 (재판권 및 준거법)</h2>
            <p>
              이 약관과 관련하여 회사와 회원 간에 발생한 분쟁에 대해서는 대한민국 법을 준거법으로
              하며, 「민사소송법」상의 관할법원에 소를 제기합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제14조 (플랫폼 수수료 및 정산)</h2>
            <p>
              플랫폼의 기본 중개수수료는 예약금액의 10%이며, 강사(센터) 회원의 정산금액은 결제금액에서
              플랫폼 수수료, 환불액 및 계약상 조정금액을 반영하여 산정합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제15조 (세금 및 증빙)</h2>
            <p>
              강사(센터) 회원의 사업자 유형 및 관련 세법에 따라 세금 처리 및 증빙 발급 방식이 달라질 수
              있습니다. 사업자 미등록 프리랜서 등에게는 관계 법령에 따라 원천징수가 적용될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제16조 (금지행위)</h2>
            <p className="mb-2">회원은 다음 각 호의 행위를 해서는 안 됩니다.</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>허위 상품 등록 또는 허위 정보 게시</li>
              <li>타인의 자격 또는 계정 도용</li>
              <li>서비스를 통해 예약을 진행한 후 정당한 사유 없이 플랫폼 외부에서의 직거래를 유도하는 행위</li>
              <li>결제정보 도용 등 부정한 방법으로 서비스를 이용하는 행위</li>
              <li>다이빙 참가자 등 이용자의 안전을 위협하는 행위</li>
            </ol>
          </section>

          <section className="border-t border-border pt-6">
            <h2 className="mb-2 text-base font-semibold">부칙</h2>
            <p>이 약관은 {EFFECTIVE_DATE}부터 시행합니다.</p>
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

export default TermsPage;
