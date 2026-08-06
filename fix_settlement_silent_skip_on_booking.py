#!/usr/bin/env python3
"""
예약 시 정산(payout/invoice) 생성 및 강사 알림 발송이 조용히 스킵되는 버그 수정

발견 경위: QA 체크리스트 예약 카테고리 라이브 테스트 중 실제로 5명 단체예약(17,600,000원)을
결제까지 완료한 뒤 관리자 계정으로 DB를 직접 조회해보니, bookings 테이블에는 예약이 정상
저장됐지만 payouts/invoices 테이블에는 아무 레코드도 생성되지 않았음(강사가 정산을 못 받는
상태). 같은 세션에서 만든 1인 예약은 invoice는 생성됐지만 payout은 역시 생성 안 됨.

원인: src/contexts/AppDataContext.tsx의 addBooking() 함수 안에서, 정원 체크에 쓰인
`targetTour = tours.find(...)`와는 별개로, 정산/알림 블록 직전에 `tour = tours.find(...)`를
**한 번 더** 호출하고 있었음. 두 번째 호출이 (원인 불명 - 정원을 꽉 채우는 예약처럼 투어
상태가 막 바뀌는 타이밍과 관련된 것으로 추정) 방금 찾았던 투어를 다시 찾지 못하면
`if (tour) { ... }` 블록 전체(정산 생성 + 강사 실시간 알림)가 에러 없이 조용히 스킵된다.

수정: 정산 블록에서 별도로 다시 조회(tours.find)하지 않고, 이미 이 함수 앞부분에서 조회에
성공한 targetTour를 그대로 재사용한다. 정원 체크 시점에 targetTour가 없으면(투어 자체가
로컬 상태에 없음) 애초에 정원 체크 자체도 스킵되므로, targetTour 값의 일관성을 정산 블록까지
그대로 유지하는 것이 안전하다.

대상 파일: src/contexts/AppDataContext.tsx

사용법: 리포지토리 루트에서 실행
    python3 fix_settlement_silent_skip_on_booking.py
"""
import pathlib
import sys

TARGET_FILE = pathlib.Path("src/contexts/AppDataContext.tsx")

OLD = '''    const tour = tours.find((t) => t.id === input.tourId);
    if (tour) {'''

NEW = '''    // targetTour(이 함수 앞부분 정원 체크에서 이미 조회에 성공한 투어)를 그대로
    // 재사용한다. 여기서 tours.find()를 다시 호출하면 드물게(정확한 원인은 미상이나,
    // 정원을 꽉 채우는 예약처럼 투어 상태가 막 바뀌는 타이밍과 관련된 것으로 추정)
    // 방금 찾았던 투어를 다시 찾지 못해 정산(payout/invoice) 생성과 강사 실시간 알림
    // 발송이 통째로 에러 없이 조용히 스킵되는 문제가 실사용 중 확인됨
    // (QA 라이브 테스트: 5인 단체예약 17,600,000원 결제 후 payouts/invoices 미생성 확인).
    const tour = targetTour;
    if (tour) {'''


def main():
    if not TARGET_FILE.exists():
        print(f"ERROR: {TARGET_FILE} 를 찾을 수 없습니다. 리포지토리 루트에서 실행하세요.")
        sys.exit(1)

    text = TARGET_FILE.read_text(encoding="utf-8")

    if NEW in text:
        print(f"SKIP: {TARGET_FILE} 은 이미 패치되어 있습니다.")
        sys.exit(0)

    count = text.count(OLD)
    if count == 0:
        print(f"ERROR: {TARGET_FILE} 에서 다음 텍스트를 찾지 못했습니다 (파일이 변경되었을 수 있음):\n{OLD!r}")
        sys.exit(1)
    if count > 1:
        print(f"ERROR: 앵커 텍스트가 {count}번 발견되어 안전하게 패치할 수 없습니다. 수동 확인이 필요합니다.")
        sys.exit(1)

    text = text.replace(OLD, NEW, 1)
    TARGET_FILE.write_text(text, encoding="utf-8")
    print(f"OK: {TARGET_FILE} 패치됨 (예약 시 정산/강사알림 조용히 스킵되는 버그 수정)")
    print("\n확인용 diff: git diff -- " + str(TARGET_FILE))


if __name__ == "__main__":
    main()
