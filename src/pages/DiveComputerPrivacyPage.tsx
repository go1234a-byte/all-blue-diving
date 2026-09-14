import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BUSINESS_INFO } from "@/lib/businessInfo";

// Separate legal document for the "Dive Computer" iOS/watchOS/Android app — a different product
// from the ALL BLUE tour-booking service PrivacyPage.tsx describes (no accounts, no payments, no
// booking data here), so it can't reuse that page's content even though it's the same operating
// company. Same company/contact fields from BUSINESS_INFO, entirely different data-practices body.
const EFFECTIVE_DATE = "2026-09-14";
const SERVICE_NAME = "Dive Computer";

const DiveComputerPrivacyPage = () => {
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

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {SERVICE_NAME} 개인정보처리방침
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">시행일: {EFFECTIVE_DATE}</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <p>
              {BUSINESS_INFO.companyName}(이하 "회사")는 iOS·watchOS·Android·Wear OS용 다이빙 컴퓨터
              애플리케이션 "{SERVICE_NAME}"(이하 "앱")을 제공합니다. 앱은 회원가입, 로그인, 결제, 예약 등
              어떠한 계정 기능도 두지 않으며, 회사의 서버로 이용자 데이터를 전송하지 않습니다. 아래는 앱이
              실제로 다루는 정보의 전부입니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">1. 수집하는 정보와 저장 위치</h2>
            <p className="mb-2">
              앱은 별도의 회원 가입이나 로그인을 요구하지 않으며, 회사가 운영하는 서버로 전송·수집하는
              개인정보가 없습니다. 아래 정보는 전부 이용자의 기기 안에만 저장됩니다.
            </p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>
                <span className="font-medium">다이빙 기록</span> — 수심, 시간, 가스, 감압 정보, 메모, 동행자
                이름, 관찰한 해양생물 등 이용자가 직접 입력하거나 앱이 다이빙 중 측정한 기록. 기기 내부
                저장소에만 저장되며 회사 서버로 전송되지 않습니다.
              </li>
              <li>
                <span className="font-medium">위치 정보(GPS)</span> — 이용자가 위치 권한을 허용한 경우,
                다이빙 입수·출수 지점의 좌표를 로그에 함께 기록하기 위해서만 사용합니다. 실시간 위치를
                추적하거나 회사가 수집하지 않으며, 전적으로 기기 내부 저장소에만 남습니다.
              </li>
              <li>
                <span className="font-medium">센서 데이터</span> — 나침반(방향 센서), Apple Watch Ultra의
                수중 센서, 배터리 잔량 등 기기·워치의 센서 값을 화면에 표시하기 위해서만 실시간으로 읽으며
                저장하지 않습니다.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">2. 기기 간 동기화(iPhone ↔ Apple Watch, Android ↔ Wear OS)</h2>
            <p>
              가스·알고리즘 설정과 다이빙 기록을 휴대폰과 워치 사이에 동기화하는 기능은 애플의
              WatchConnectivity, 구글의 Wearable Data Layer API를 사용하며, 이용자 본인이 소유·페어링한
              두 기기 사이에서만 로컬로 오갑니다. 이 과정에서 회사나 제3자의 서버를 거치지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">3. 제3자 제공 및 외부 전송</h2>
            <p>
              회사는 앱을 통해 수집·생성되는 어떠한 정보도 제3자에게 제공하거나 외부 서버로 전송하지
              않습니다. 앱은 광고 SDK, 분석 도구, 크래시 리포팅 등 외부 데이터 수집 도구를 포함하지
              않습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">4. 정보의 보유 기간 및 삭제</h2>
            <p>
              모든 정보는 이용자의 기기에만 저장되므로, 앱을 삭제(제거)하면 함께 삭제됩니다. 앱 내에서도
              다이빙 기록·동행자·위치 정보를 이용자가 직접 삭제할 수 있습니다. 회사는 별도로 이 정보를
              보관하지 않으므로 회사에 삭제를 요청할 필요가 없습니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">5. 이용자의 권리</h2>
            <p>
              모든 데이터가 기기 로컬에만 저장되는 구조이므로, 이용자는 앱의 설정 및 로그북 화면에서 언제든
              직접 열람·수정·삭제할 수 있습니다. 문의사항은 아래 연락처로 문의해 주세요.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">6. 개인정보 보호책임자</h2>
            <p>성명: {BUSINESS_INFO.officerName}</p>
            <p>직책: {BUSINESS_INFO.officerPosition}</p>
            <p>이메일: {BUSINESS_INFO.email}</p>
            <p>연락처: {BUSINESS_INFO.phone}</p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">7. 개인정보처리방침의 변경</h2>
            <p>
              이 방침을 개정하는 경우 앱의 스토어 등록 정보 또는 본 페이지를 통해 고지합니다.
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

export default DiveComputerPrivacyPage;
