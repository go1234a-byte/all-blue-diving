#!/usr/bin/env python3
"""
예약 취소 시 payout/invoice 클라이언트 직접 update를 서버 RPC 호출로 교체

배경: 취소/환불 QA 라이브 테스트 중 실제 예약을 취소했더니, bookings 테이블은
정확히 취소 처리(status="cancelled", refund_rate=1, refund_amount=2695000)됐지만
payouts.status는 "scheduled"로 그대로 남아있고 invoices.refund_amount도 0 그대로였음.

원인: cancelBooking()과 resolveCancellationReview() 둘 다 다이버/관리자 세션
권한으로 직접
    supabase.from("payouts").update({ status: "cancelled" })...
를 호출하는데 이 결과(에러)를 전혀 확인하지 않아서, RLS에 막혀 조용히 실패해도
아무 것도 알 수 없었음(정산 생성 버그 때와 동일한 패턴). invoices.refund_amount는
애초에 어느 취소 경로에서도 갱신하는 코드가 없었음.

수정: fix_cancel_settlement_via_rpc.sql로 만든 SECURITY DEFINER RPC
public.cancel_booking_settlement(p_booking_id uuid, p_refund_amount numeric)를
cancelBooking()과 resolveCancellationReview() 양쪽에서 호출하도록 교체한다.
이 RPC는 서버 권한으로 payouts.status를 cancelled로 바꾸고(이미 released된 건은
제외) invoices.refund_amount도 함께 반영한다.

대상 파일: src/contexts/AppDataContext.tsx

사용법: fix_cancel_settlement_via_rpc.sql을 먼저 Supabase에 적용한 뒤, 리포지토리
루트에서 실행
    python3 fix_cancel_settlement_use_rpc.py
"""
import pathlib
import sys

TARGET_FILE = pathlib.Path("src/contexts/AppDataContext.tsx")

# --- 자리 1: cancelBooking() (다이버 본인 취소) ---
OLD_1 = '''    );
    await supabase.from("payouts").update({ status: "cancelled" }).eq("booking_id", bookingId).neq("status", "released");
    void fetchTourConfirmedCounts();

    return { refundRate, refundAmount };'''

NEW_1 = '''    );
    const { error: cancelSettlementError } = await supabase.rpc("cancel_booking_settlement", {
      p_booking_id: bookingId,
      p_refund_amount: refundAmount,
    });
    if (cancelSettlementError) {
      console.error(
        "[cancelBooking] 정산(payout/invoice) 취소 반영 RPC 실패 (예약 취소는 정상 처리됨):",
        cancelSettlementError,
      );
    }
    void fetchTourConfirmedCounts();

    return { refundRate, refundAmount };'''

# --- 자리 2: resolveCancellationReview() (관리자 강제 환불 승인) ---
OLD_2 = '''      );
      await supabase.from("payouts").update({ status: "cancelled" }).eq("booking_id", bookingId).neq("status", "released");
      void fetchTourConfirmedCounts();

      // 관리자가 [강제 환불 승인]을 실행하는 즉시 담당 강사에게 고위험 페널티 알림을 발행한다.'''

NEW_2 = '''      );
      const { error: cancelSettlementError } = await supabase.rpc("cancel_booking_settlement", {
        p_booking_id: bookingId,
        p_refund_amount: booking?.totalPaid ?? 0,
      });
      if (cancelSettlementError) {
        console.error(
          "[resolveCancellationReview] 정산(payout/invoice) 취소 반영 RPC 실패 (강제 환불은 정상 처리됨):",
          cancelSettlementError,
        );
      }
      void fetchTourConfirmedCounts();

      // 관리자가 [강제 환불 승인]을 실행하는 즉시 담당 강사에게 고위험 페널티 알림을 발행한다.'''

MARKER_ALREADY_APPLIED = 'supabase.rpc("cancel_booking_settlement"'


def apply_one(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count == 0:
        print(f"ERROR: {label} 자리를 찾지 못했습니다 (파일이 변경되었을 수 있음).")
        sys.exit(1)
    if count > 1:
        print(f"ERROR: {label} 자리가 {count}번 발견되어 안전하게 패치할 수 없습니다. 수동 확인이 필요합니다.")
        sys.exit(1)
    return text.replace(old, new, 1)


def main():
    if not TARGET_FILE.exists():
        print(f"ERROR: {TARGET_FILE} 를 찾을 수 없습니다. 리포지토리 루트에서 실행하세요.")
        sys.exit(1)

    text = TARGET_FILE.read_text(encoding="utf-8")

    if MARKER_ALREADY_APPLIED in text:
        print(f"SKIP: {TARGET_FILE} 은 이미 패치되어 있습니다.")
        sys.exit(0)

    text = apply_one(text, OLD_1, NEW_1, "cancelBooking()")
    text = apply_one(text, OLD_2, NEW_2, "resolveCancellationReview()")

    TARGET_FILE.write_text(text, encoding="utf-8")
    print(f"OK: {TARGET_FILE} 패치됨 (예약 취소 시 payout/invoice 반영을 cancel_booking_settlement RPC 호출로 교체)")
    print("확인용 diff: git diff -- " + str(TARGET_FILE))


if __name__ == "__main__":
    main()
