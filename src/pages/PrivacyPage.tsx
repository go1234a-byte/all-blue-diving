import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BUSINESS_INFO } from "@/lib/businessInfo";

const EFFECTIVE_DATE = "2026-08-08";

const PrivacyPage = () => {
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

        <h1 className="mb-2 text-2xl font-bold text-foreground">개인정보처리방침</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          시행일: {EFFECTIVE_DATE}
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <p>
              {BUSINESS_INFO.companyName}(이하 "회사")는 「개인정보보호법」 등 관계 법령을 준수하며,
              이용자의 개인정보를 안전하게 처리하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">1. 수집하는 개인정보 항목 및 수집방법</h2>
            <p className="mb-2">회사는 회원가입, 서비스 이용 과정에서 아래와 같은 개인정보를 수집합니다.</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>필수항목(다이버 회원): 이메일, 비밀번호, 이름(닉네임), 휴대전화번호</li>
              <li>필수항목(강사·센터 회원): 이메일, 비밀번호, 이름, 휴대전화번호, 자격증 정보,
                사업자등록정보(해당 시), 정산 계좌정보</li>
              <li>결제 시: 예약자명, 연락처, 결제 관련 정보(카드사·결제수단 등 결제대행사가 처리하는
                정보로, 카드번호 전체 등 민감정보는 회사가 직접 저장하지 않습니다)</li>
              <li>서비스 이용 과정에서 자동으로 생성·수집되는 정보: 접속 로그, 쿠키, 접속 IP, 서비스
                이용 기록, 기기정보</li>
              <li>수집방법: 홈페이지 회원가입 및 서비스 이용 과정에서 이용자가 직접 입력, 생성정보
                수집 툴을 통한 자동 수집</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">2. 개인정보의 수집 및 이용목적</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증</li>
              <li>투어 예약, 결제, 취소·환불 처리 및 관련 고지·안내사항 전달</li>
              <li>강사(센터) 회원 자격 확인 및 정산금 지급</li>
              <li>고객 문의·분쟁 대응 등 민원처리</li>
              <li>서비스 부정이용 방지 및 비인가 이용 방지</li>
              <li>신규 서비스 개발 및 서비스 개선을 위한 통계 분석(선택 동의 시)</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">3. 개인정보의 보유 및 이용기간</h2>
            <p className="mb-2">
              회사는 원칙적으로 개인정보 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이
              파기합니다. 다만 관계 법령에 따라 보존할 필요가 있는 경우 아래와 같이 일정 기간
              보관합니다.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>계약 또는 청약철회 등에 관한 기록: 5년(전자상거래법)</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년(전자상거래법)</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년(전자상거래법)</li>
              <li>표시·광고에 관한 기록: 6개월(전자상거래법)</li>
              <li>세법에 따른 거래에 관한 장부 및 증빙서류: 5년(국세기본법)</li>
              <li>접속에 관한 기록: 3개월(통신비밀보호법)</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">4. 개인정보의 제3자 제공</h2>
            <p>
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가 사전에
              동의한 경우이거나, 투어 예약 확정을 위해 필요한 최소한의 예약자 정보(이름, 연락처)를
              해당 투어의 강사(센터) 회원에게 제공하는 경우, 법령의 규정에 의거하거나 수사 목적으로
              법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우는 예외로 합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">5. 개인정보처리 위탁</h2>
            <p className="mb-2">
              회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리업무를 위탁하고 있으며,
              관계 법령에 따라 위탁계약 시 개인정보가 안전하게 처리될 수 있도록 필요한 사항을
              규정합니다.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>결제대행사(PG): 결제 처리 및 정산</li>
              <li>클라우드 인프라(Supabase 등): 데이터 저장 및 서비스 운영</li>
              <li>문자·알림 발송업체: 예약·서비스 관련 알림 발송</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">6. 정보주체의 권리·의무 및 행사방법</h2>
            <p>
              이용자는 언제든지 등록된 본인의 개인정보를 조회, 수정할 수 있으며 회원탈퇴를 통해
              수집·이용에 대한 동의를 철회할 수 있습니다. 개인정보 조회·수정은 서비스 내 마이페이지를
              통해, 회원탈퇴는 서비스 내 탈퇴 절차 또는 고객센터({BUSINESS_INFO.email})를 통해
              요청할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">7. 개인정보의 파기</h2>
            <p>
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
              지체 없이 해당 개인정보를 파기합니다. 전자적 파일 형태의 정보는 복구 불가능한 방법으로
              영구 삭제하며, 종이 문서는 분쇄하거나 소각합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">8. 개인정보의 안전성 확보조치</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>비밀번호 암호화 저장 및 전송구간 암호화(SSL/TLS)</li>
              <li>개인정보 접근권한의 제한 및 접근통제 시스템 운영</li>
              <li>개인정보 취급 담당자의 최소화 및 정기적인 교육</li>
              <li>해킹 등에 대비한 보안 프로그램 설치 및 갱신</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">9. 쿠키의 운영</h2>
            <p>
              회사는 이용자에게 맞춤화된 서비스 제공을 위해 쿠키를 사용할 수 있습니다. 이용자는
              웹브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며, 이 경우 서비스 이용에 일부
              제한이 있을 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">10. 개인정보 보호책임자</h2>
            <p className="mb-2">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의
              불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <p>성명: {BUSINESS_INFO.officerName}</p>
            <p>직책: {BUSINESS_INFO.officerPosition}</p>
            <p>이메일: {BUSINESS_INFO.email}</p>
            <p>연락처: {BUSINESS_INFO.phone}</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">11. 고지의 의무</h2>
            <p>
              이 개인정보처리방침의 내용 추가, 삭제 및 수정이 있을 경우 개정 최소 7일 전부터
              서비스 내 공지사항을 통해 고지합니다.
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <p>이 개인정보처리방침은 {EFFECTIVE_DATE}부터 시행합니다.</p>
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

export default PrivacyPage;
