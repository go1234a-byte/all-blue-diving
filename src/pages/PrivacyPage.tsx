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
              {BUSINESS_INFO.companyName}(이하 "회사")는 "{BUSINESS_INFO.serviceName}" 서비스(이하 "서비스")
              제공을 위하여 아래와 같이 이용자의 개인정보를 수집·이용합니다. 회사는 「개인정보 보호법」,
              「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">1. 수집하는 개인정보의 항목 및 수집 목적</h2>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li><span className="font-medium">회원 기본 정보(직접 입력)</span> — 이메일, 비밀번호, 이름, 성별,
                생년월일, 휴대전화번호: 회원 식별 및 본인 확인, 부정이용 방지</li>
              <li><span className="font-medium">소셜 로그인 연동</span> — 카카오·네이버·구글 계정 연동 시 각
                제공자로부터 이메일, 닉네임, 프로필 사진, 고유 식별자를 전달받습니다: 간편 로그인 및 회원 식별</li>
              <li><span className="font-medium">다이버 회원 추가 정보</span> — 다이빙 자격(C-카드) 발급기관·등급·인증
                사진, 응급연락처, 보험 정보, 흡연·코골이 등 동행 선호 정보(선택): 투어 참여 자격 확인 및 원활한
                동행 매칭</li>
              <li><span className="font-medium">강사(센터) 회원 추가 정보</span> — 자격증·경력·소속 정보, 사업자등록정보(해당
                시), 정산 계좌정보(은행명·예금주·계좌번호·통장 사본), 서약서 서명: 강사 자격 확인 및 정산금 지급,
                관계 법령에 따른 세무 처리</li>
              <li><span className="font-medium">결제 정보</span> — 예약자명, 연락처, 결제 수단, 결제 승인 번호,
                결제 금액 및 일시. 카드번호 전체 등 민감한 결제 정보는 결제대행사(PG)가 직접 처리하며 회사는
                이를 저장하지 않습니다: 투어 예약·결제 처리 및 환불, 분쟁 해결</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">2. 서비스 이용 중 자동으로 수집되는 정보</h2>
            <p className="mb-2">웹 및 모바일 앱 이용 과정에서 아래 정보가 자동으로 생성·수집될 수 있습니다.</p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li><span className="font-medium">기기 정보</span> — OS 종류·버전, 기기 모델명, 앱 버전, 푸시
                알림 토큰: 푸시 알림 발송, 서비스 호환성 확보</li>
              <li><span className="font-medium">접속 정보</span> — IP 주소, 접속 일시, 서비스 이용 기록, 부정이용
                기록: 서비스 보안·부정이용 방지, 법령 준수</li>
              <li><span className="font-medium">쿠키·로컬스토리지</span> — 세션 토큰, 로그인 상태 유지 정보,
                기기 내 임시 저장 정보(찜 목록 등): 로그인 상태 유지 및 서비스 편의 제공</li>
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">
              ※ 이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 로그인 등 일부 서비스
              이용이 제한될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">3. 개인정보의 제3자 제공</h2>
            <p>
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가 사전에 동의한
              경우, 투어 예약 확정을 위해 필요한 최소한의 예약자 정보(이름, 연락처)를 해당 투어의 강사(센터)
              회원에게 제공하는 경우, 법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라
              수사기관의 요구가 있는 경우는 예외로 합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">4. 개인정보의 보유 및 이용 기간</h2>
            <p className="mb-2">
              회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
              다만 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 아래 기간 동안 보관합니다.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>계약 또는 청약철회 등에 관한 기록: 5년(전자상거래법)</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년(전자상거래법)</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년(전자상거래법)</li>
              <li>표시·광고에 관한 기록: 6개월(전자상거래법)</li>
              <li>강사(센터) 회원 정산·세무 관련 증빙서류: 5년(국세기본법)</li>
              <li>서비스 방문(접속) 기록: 3개월(통신비밀보호법)</li>
            </ol>
            <p className="mt-2">
              회사는 1년 이상 서비스를 이용(로그인 기준)하지 않은 회원의 개인정보를 파기하거나 별도 분리
              보관할 수 있으며, 이 경우 처리 예정일 30일 전 가입 시 등록한 연락처로 사전에 통지합니다.
              이용자는 통지 기간 내 서비스에 로그인함으로써 파기를 방지할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">5. 개인정보의 파기</h2>
            <p>
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 그
              날로부터 5일 이내에 지체 없이 파기합니다. 전자적 파일 형태의 정보는 복구가 불가능한 기술적
              방법(완전 삭제·덮어쓰기)으로 삭제하며, 종이 문서는 분쇄하거나 소각합니다. 다이빙 자격 인증
              사진 등 심사 목적의 첨부 서류는 심사(승인) 완료 즉시 파기함을 원칙으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">6. 개인정보 처리 위탁</h2>
            <p className="mb-2">
              회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리업무를 외부에 위탁하고 있으며,
              위탁계약 시 개인정보가 안전하게 관리될 수 있도록 관계 법령에 따라 필요한 사항을 규정합니다.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>결제대행사(PG): 투어 예약 결제 처리 및 정산</li>
              <li>Supabase, Inc.(미국): 데이터베이스 저장 및 회원 인증 — 전체 회원 정보, 서비스 이용 기록</li>
              <li>Vercel, Inc.(미국): 웹 서버 호스팅 및 CDN — 서비스 이용 시 전송되는 정보(IP, 쿠키 등)</li>
              <li>Resend, Inc.(미국): 이메일 발송 서비스 — 이메일 주소, 이메일 내용</li>
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">
              ※ 국외 수탁자로의 이전은 서비스 운영에 필수적인 인프라(데이터베이스, 호스팅, 이메일 발송)이며,
              위탁 일시 및 방법은 서비스 이용 시점에 네트워크를 통해 수시로 이루어집니다. 보유기간은 본 방침에서
              정한 보관기간과 동일합니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">7. 개인정보의 안전성 확보조치</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>비밀번호 등 주요 정보의 암호화 저장 및 전송구간 암호화(TLS)</li>
              <li>개인정보에 대한 접근 권한을 최소 인원으로 제한하는 접근 통제</li>
              <li>개인정보 처리시스템에 대한 접속 기록 보관 및 위·변조 방지 조치</li>
              <li>해킹 등에 대비한 보안 프로그램의 설치 및 주기적 갱신</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">8. 정보주체의 권리·의무 및 행사방법</h2>
            <p>
              이용자(또는 법정대리인)는 개인정보 주체로서 언제든지 개인정보 열람, 정정, 삭제, 처리정지
              요구 및 수집·이용 동의 철회(회원탈퇴)를 할 수 있습니다. 권리 행사는 서비스 내 마이페이지 또는
              고객센터({BUSINESS_INFO.email})를 통해 요청할 수 있으며, 회사는 이에 대해 지체 없이 조치합니다.
              다만 법령에 의해 보존이 의무화된 정보(결제 기록, 세무 관련 기록 등)는 보존 기간 내 삭제가
              제한될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">9. 개인정보 보호책임자</h2>
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
            <h2 className="mb-2 text-base font-semibold">10. 개인정보처리방침의 변경</h2>
            <p>
              회사는 개인정보처리방침을 개정하는 경우 최소 7일 전에 서비스 내 공지사항을 통하여 고지합니다.
              다만 수집하는 개인정보 항목 변경, 이용 목적 변경, 제3자 제공 추가 등 이용자 권리에 중대한
              영향을 미치는 변경의 경우에는 최소 30일 전에 공지하며, 별도의 동의가 필요한 경우 동의를 받습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">11. 개인정보에 관한 민원서비스</h2>
            <p className="mb-2">
              이용자는 개인정보 침해로 인한 신고·상담이 필요한 경우 아래 기관에 문의할 수 있습니다.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>개인정보 침해신고센터: 118(국번없이) · privacy.kisa.or.kr</li>
              <li>개인정보 분쟁조정위원회: 1833-6972 · www.kopico.go.kr</li>
              <li>대검찰청 사이버수사과: 1301(국번없이) · www.spo.go.kr</li>
              <li>경찰청 사이버범죄 신고시스템: 182(국번없이) · ecrm.cyber.go.kr</li>
            </ol>
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
