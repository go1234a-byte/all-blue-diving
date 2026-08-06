#!/usr/bin/env python3
"""
정산·회계 시스템 Phase 2 후속: Invoice ID 채번 로직

배경: fix_settlement_accounting_schema.sql(Phase 1)에서 invoices 테이블을
만들었고, AdminAccountingCenter(Phase 2)가 이 테이블을 집계해서 보여주지만,
지금까지는 예약이 생성돼도 invoices 레코드가 전혀 만들어지지 않아서 회계
대시보드가 항상 0으로만 보였다.

이 패치는 AppDataContext.tsx의 addBooking() 안, payouts 레코드를 만드는
바로 다음 지점에 invoices 레코드를 함께 생성하는 코드를 추가한다.
(예약 생성과 정산(payout) 레코드 생성이 이미 같은 함수 안에서 한 번에
일어나고 있어서, 그 지점이 자연스러운 후킹 포인트임 — 별도의 "결제 확정"
단계가 없는 이 앱의 실제 흐름과 일치.)

Invoice ID 포맷: INV-{YYYYMM}-{그 달 순번, 6자리}. 순번은 해당 월의 기존
invoices 개수를 세어 +1 하는 방식이라 극히 드물게 동시 예약이 겹치면 PK
충돌이 날 수 있는데, 그 경우에도 payouts insert 실패와 동일한 방침으로
예약 자체는 막지 않고 콘솔에만 에러를 남긴다 (회계 리포트에서만 그 건이
누락되고, 예약/정산 플로우는 정상 진행됨).

금액 필드는 Phase 1 설계대로:
  gmv_amount        = input.totalPaid       (회원이 실제 결제한 총액)
  platform_fee_amount = input.platformFee   (플랫폼 수수료, 회원이 추가 부담)
  instructor_amount = input.basePrice + input.optionsCost (강사 지급액, 전액)

대상 파일: src/contexts/AppDataContext.tsx

사용법: 리포지토리 루트에서 실행
    python3 fix_invoice_generation.py
"""
import pathlib
import sys

TARGET_FILE = pathlib.Path("src/contexts/AppDataContext.tsx")

ANCHOR_OLD = "      setPayouts((prev) => [payout, ...prev]);\n"

INVOICE_BLOCK = '''      // Invoice ID 채번 (INV-{YYYYMM}-{그 달 순번}). GMV/수수료/강사지급액을 예약 확정
      // 시점 스냅샷으로 invoices 테이블에 남긴다 — 실패해도 payouts insert 실패 처리와
      // 동일하게 예약 자체는 막지 않는다 (회계 리포트에서만 누락되고, 예약/정산은 정상 진행).
      try {
        const invoiceNow = new Date();
        const invoicePeriod = `${invoiceNow.getFullYear()}-${String(invoiceNow.getMonth() + 1).padStart(2, "0")}-01`;
        const { count: invoiceCountThisMonth } = await supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("period", invoicePeriod);
        const invoiceSeq = (invoiceCountThisMonth ?? 0) + 1;
        const invoiceId = `INV-${invoiceNow.getFullYear()}${String(invoiceNow.getMonth() + 1).padStart(2, "0")}-${String(invoiceSeq).padStart(6, "0")}`;
        const { error: invoiceError } = await supabase.from("invoices").insert({
          id: invoiceId,
          booking_id: booking.id,
          payout_id: payoutError ? null : payout.id,
          gmv_amount: input.totalPaid,
          platform_fee_amount: input.platformFee,
          instructor_amount: input.basePrice + input.optionsCost,
          refund_amount: 0,
          period: invoicePeriod,
        });
        if (invoiceError) {
          console.error("[addBooking] invoices insert 실패 (예약은 정상 처리됨):", invoiceError);
        }
      } catch (invoiceCatchError) {
        console.error("[addBooking] invoice 채번 중 예외 (예약은 정상 처리됨):", invoiceCatchError);
      }
'''

ANCHOR_NEW = ANCHOR_OLD + "\n" + INVOICE_BLOCK

DONE_MARKER = "invoiceCountThisMonth"


def main():
    if not TARGET_FILE.exists():
        print(f"ERROR: {TARGET_FILE} 를 찾을 수 없습니다. 리포지토리 루트에서 실행하세요.")
        sys.exit(1)

    text = TARGET_FILE.read_text(encoding="utf-8")

    if DONE_MARKER in text:
        print(f"SKIP: {TARGET_FILE} 은 이미 패치되어 있습니다.")
        sys.exit(0)

    if ANCHOR_OLD not in text:
        print(f"ERROR: {TARGET_FILE} 에서 다음 텍스트를 찾지 못했습니다 (파일이 변경되었을 수 있음):\n{ANCHOR_OLD!r}")
        sys.exit(1)

    text = text.replace(ANCHOR_OLD, ANCHOR_NEW, 1)

    if DONE_MARKER not in text:
        print("ERROR: 치환 후에도 완료 마커가 보이지 않습니다. 수동 확인 필요.")
        sys.exit(1)

    TARGET_FILE.write_text(text, encoding="utf-8")
    print(f"OK: {TARGET_FILE} 패치됨 (addBooking()에 invoice 채번 로직 추가)")
    print("\n확인용 diff: git diff -- " + str(TARGET_FILE))


if __name__ == "__main__":
    main()
