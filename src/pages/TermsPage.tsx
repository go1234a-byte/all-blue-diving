import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BUSINESS_INFO } from "@/lib/businessInfo";

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
            <h2 className="mb-2 text-base font-semibold">제2조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
              <li>회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
              <li>회사가 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 적용일자 최소 15일 전(회원에게
                불리한 변경의 경우 30일 전)부터 서비스 내 공지합니다.</li>
              <li>회사가 개정약관을 공지하면서 공지일로부터 개정약관 시행일 7일 후까지 거부 의사를 표시하지
                않으면 승인한 것으로 간주한다는 뜻을 명확히 공지하였음에도 회원이 명시적으로 거부의사를
                표명하지 않은 경우 회원이 개정약관에 동의한 것으로 봅니다. 회원은 개정약관에 동의하지 않을
                경우 이용계약을 해지할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제3조 (약관 외 준칙)</h2>
            <p>
              이 약관에 규정되지 않은 사항에 대해서는 관계 법령 또는 회사가 정한 서비스의 세부 이용지침
              등에 따릅니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제4조 (용어의 정의)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>"서비스"란 회사가 운영하는 웹사이트 및 관련 애플리케이션을 통해 제공하는 다이빙 투어
                정보 제공, 예약, 결제 중개 등 일체의 서비스를 의미합니다.</li>
              <li>"회원"이란 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 서비스를
                이용하는 자를 말하며, "다이버 회원"과 "강사(센터) 회원"으로 구분됩니다.</li>
              <li>"강사(센터) 회원"이란 서비스를 통해 다이빙 투어 상품을 등록·판매하는 강사 또는
                다이빙 센터를 말합니다.</li>
              <li>"투어"란 강사(센터) 회원이 서비스에 등록한 다이빙 관련 상품 및 프로그램을 말합니다.</li>
              <li>"결제대행사(PG)"란 회사와 계약을 체결하여 서비스 내 결제 처리를 대행하는 전자지급결제대행업체를 말합니다.</li>
              <li>"계정"이란 회원의 서비스 이용을 위해 회사가 정한 로그인 정책에 따라 부여·관리되는
                식별 정보 일체를 말합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제5조 (계약의 성립 및 회원가입)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>이용자는 회원가입 화면에서 계정 정보 등 회사가 정한 사항을 입력하고 이 약관에
                동의함으로써 회원가입을 신청하며, 회사의 승낙으로 이용계약이 체결됩니다.</li>
              <li>회사는 다음 각 호에 해당하는 신청에 대해서는 승낙을 하지 않거나 사후에 이용계약을
                해지할 수 있습니다.
                <ol className="mt-1 list-[lower-alpha] space-y-1 pl-5">
                  <li>타인의 명의를 이용하거나 허위 정보를 기재한 경우</li>
                  <li>이전에 이용계약이 해지된 이력이 있는 등 회사가 정한 재가입 제한 사유에 해당하는 경우</li>
                  <li>강사(센터) 회원의 경우 자격증·보험 등 회사가 요구하는 인증 서류를 제출하지
                    않거나 심사에 통과하지 못한 경우</li>
                  <li>필수 입력사항을 기재하지 않은 경우</li>
                  <li>만 14세 미만으로서 법정대리인의 동의를 받지 않은 경우</li>
                  <li>기타 회원의 귀책사유로 승낙이 곤란하거나 관계 법령 및 회사가 정한 기준을
                    위반한 경우</li>
                </ol>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제6조 (서비스의 제공, 변경 및 중단)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>회사는 다이빙 투어 정보 제공, 예약 및 결제 중개, 강사(센터)와 다이버 간 채팅,
                리뷰 등의 서비스를 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.</li>
              <li>회사는 서비스의 내용, 운영상·기술상의 필요에 따라 제공하는 서비스의 전부 또는
                일부를 변경할 수 있으며, 변경 시 사전에 공지합니다.</li>
              <li>회사는 설비의 유지·보수를 위한 정기 또는 임시 점검, 정전, 설비의 장애 또는 이용량의
                폭주, 회사와 제3자 간 계약의 종료, 정부의 명령·규제 또는 정책의 변경, 천재지변 등
                불가항력적 사유가 있는 경우 서비스의 전부 또는 일부를 제한하거나 중지할 수 있으며,
                이 경우 사전에 공지함을 원칙으로 하되 예측할 수 없는 부득이한 사유가 있는 경우 사후에
                통지할 수 있습니다.</li>
              <li>회사는 강사(센터) 회원이 등록한 투어 정보의 중개자이며, 투어의 실제 진행 주체는
                해당 강사(센터) 회원입니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제7조 (계정 관리)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>계정에 관한 관리책임은 회원 본인에게 있으며, 이를 제3자가 이용하도록 허락해서는 안 됩니다.</li>
              <li>비밀번호 등 계정 정보는 회원 본인이 직접 관리하며, 계정의 도용이나 부정사용을 인지한
                경우 서비스 내 '문의하기'를 통해 즉시 회사에 알려야 합니다.</li>
              <li>회원은 계정 설정 화면 등을 통해 언제든지 본인의 정보를 열람하고 수정할 수 있습니다.
                다만 서비스 관리를 위해 필요한 일부 정보는 수정이 제한되거나 별도의 본인확인 절차가
                필요할 수 있습니다.</li>
              <li>회원이 계정 정보를 사실과 다르게 기재하거나 수정하지 않아 발생한 불이익에 대해
                회사는 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제8조 (회원의 의무)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>회원은 관계 법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 회사가 공지한
                주의사항을 준수하여야 하며, 다음 각 호의 행위를 해서는 안 됩니다.
                <ol className="mt-1 list-[lower-alpha] space-y-1 pl-5">
                  <li>회원가입 신청 또는 정보 변경 시 허위내용을 등록하거나, 타인의 계정을 도용·부정사용하는 행위</li>
                  <li>회사, 다른 회원 또는 제3자를 기망하여 이익을 취하거나 명예를 훼손하는 행위</li>
                  <li>음란물을 게재하거나 음란사이트를 링크하는 행위</li>
                  <li>회사 또는 제3자의 저작권 등 지식재산권을 침해하는 행위</li>
                  <li>공공질서 및 미풍양속에 위반되는 내용을 유포하는 행위</li>
                  <li>컴퓨터 바이러스, 악성코드 등을 유포·등록하는 행위</li>
                  <li>서비스의 운영을 고의로 방해하거나, 광고성 정보·스팸을 전송하는 행위</li>
                  <li>회사의 동의 없이 서비스를 이용하여 영업활동을 하거나 서비스를 복제·수정·배포·양도하는 행위</li>
                  <li>다른 회원의 개인정보를 동의 없이 수집·저장·공개하는 행위</li>
                  <li>기타 관계 법령에 위배되거나 부당한 행위</li>
                </ol>
              </li>
              <li>강사(센터) 회원은 다이빙 강습·투어 진행에 필요한 자격, 보험, 안전 장비 등을
                관계 법령에 따라 갖추어야 하며, 투어 정보를 사실과 다르게 등록해서는 안 됩니다.</li>
              <li>회원의 이용권한은 회원 본인에게만 귀속되며, 이를 양도, 증여하거나 담보로 제공할 수 없습니다.</li>
              <li>회사는 회원이 관계 법령 또는 이 약관을 위반한 것으로 판단되는 경우 이를 조사할 수 있으며,
                조사 결과 위반 사실이 확인되면 서비스 이용 제한, 재가입 제한 등의 조치를 취할 수 있습니다.
                이용 제한 조치에 이의가 있는 회원은 고객센터를 통해 이의를 제기할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제9조 (개인정보의 보호)</h2>
            <p>
              회사는 관계 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력하며, 개인정보의
              수집·이용·제공 등에 관한 자세한 사항은{" "}
              <Link to="/privacy" className="text-primary underline underline-offset-2">
                개인정보처리방침
              </Link>
              에 따릅니다. 회원의 개인정보는 동의한 목적과 범위 내에서만 이용되며, 관계 법령에 근거가
              있거나 회원의 별도 동의가 없는 한 제3자에게 제공되지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제10조 (회원에 대한 통지)</h2>
            <p>
              회사는 회원과의 원활한 의견 교환을 소중하게 생각하며, 회원은 서비스 내 '문의하기' 등을
              통해 회사에 의견이나 불만을 제기할 수 있습니다. 회사가 회원에게 통지를 하는 경우 회원이
              등록한 이메일, 알림, 서비스 내 공지 등의 방법으로 할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제11조 (예약 및 결제)</h2>
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
            <h2 className="mb-2 text-base font-semibold">제12조 (취소 및 환불)</h2>
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
            <h2 className="mb-2 text-base font-semibold">제13조 (이용계약의 해지)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>회원은 언제든지 서비스 내 절차를 통해 이용계약 해지(회원탈퇴)를 신청할 수 있으며,
                회사는 관계 법령이 정하는 바에 따라 신속히 이를 처리합니다.</li>
              <li>회사는 회원이 관계 법령상 요구되는 기간 동안 서비스를 이용하지 않는 경우 회원에게
                사전 통지 후 회원정보를 파기하거나 분리 보관할 수 있으며, 서비스 제공에 필요한 필수
                정보가 부족한 경우 이용계약을 해지할 수 있습니다.</li>
              <li>이용계약이 해지되면 관계 법령 및 개인정보처리방침에 따라 보관해야 하는 정보를
                제외한 회원의 계정 정보는 삭제됩니다. 회원이 등록한 게시물의 처리는 관련 서비스
                약관을 따릅니다.</li>
              <li>이용계약이 해지된 이후에도 회원은 다시 이용계약 체결을 신청할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제14조 (손해배상 및 면책)</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>회사는 무료로 제공되는 서비스와 관련하여 관련 법령에 특별한 규정이 없는 한
                회원에게 발생한 손해에 대해 책임을 지지 않습니다.</li>
              <li>회사는 강사(센터) 회원이 제공하는 투어 내용, 안전관리 등 실제 서비스 이행에 대해
                직접적인 책임을 지지 않으며, 이는 해당 강사(센터) 회원에게 있습니다. 다만 회사는
                관계 법령이 정하는 중개자로서의 책임을 다합니다.</li>
              <li>회사의 고의 또는 과실 없이 발생한 다음 각 호의 손해에 대해서는 책임을 지지 않습니다.
                <ol className="mt-1 list-[lower-alpha] space-y-1 pl-5">
                  <li>천재지변, 기상 악화 등 불가항력으로 인한 손해</li>
                  <li>회원의 귀책사유로 인한 서비스 이용 장애</li>
                  <li>회원이 서비스를 이용하며 얻은 정보로 인한 개인적 손해</li>
                  <li>제3자가 불법적으로 서비스에 접속하거나 이를 이용함으로써 발생하는 손해</li>
                  <li>기타 회사의 고의 또는 과실이 없는 사유로 발생한 손해</li>
                </ol>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제15조 (분쟁의 해결 및 준거법)</h2>
            <p>
              회사는 회원으로부터 제출되는 불만사항 및 의견을 우선적으로 처리하며, 신속한 처리가
              곤란한 경우 그 사유와 처리일정을 통보합니다. 이 약관과 관련하여 회사와 회원 간 발생한
              분쟁은 대한민국 법령에 따라 성실히 협의하여 해결하는 것을 원칙으로 하며, 협의가 이루어지지
              않을 경우 「민사소송법」상의 관할법원에 소를 제기할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제16조 (플랫폼 수수료 및 정산)</h2>
            <p>
              플랫폼의 기본 중개수수료는 예약금액의 10%이며, 강사(센터) 회원의 정산금액은 결제금액에서
              플랫폼 수수료, 환불액 및 계약상 조정금액을 반영하여 산정합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제17조 (세금 및 증빙)</h2>
            <p>
              강사(센터) 회원의 사업자 유형 및 관련 세법에 따라 세금 처리 및 증빙 발급 방식이 달라질 수
              있습니다. 사업자 미등록 프리랜서 등에게는 관계 법령에 따라 원천징수가 적용될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">제18조 (금지행위)</h2>
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
