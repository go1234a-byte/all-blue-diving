#!/usr/bin/env python3
"""
addBooking()의 payout/invoice 클라이언트 직접 insert를 서버 RPC 호출로 교체

배경: fix_settlement_silent_skip_on_booking.py로 "정산 블록 자체가 스킵되던 문제"는
고쳤지만, 라이브로 다시 예약을 넣어보니 그 블록 안의 실제 DB insert가 둘 다 실패하고
있었음(콘솔에서 정확한 에러 확인):
  - payouts insert: 42501 RLS 위반 (다이버 세션에 쓰기 권한 없음)
  - invoices insert: 23505 중복 키 (다이버는 invoices를 못 읽어서 매번 카운트가 0으로
    나와 같은 번호를 다시 만들려다 충돌)

근본 원인은 "정산 생성이 다이버 브라우저 권한으로 실행된다"는 구조적 문제라서,
fix_settlement_creation_via_rpc.sql로 만든 SECURITY DEFINER RPC
public.create_booking_settlement(p_booking_id uuid)를 호출하는 방식으로 바꾼다.
이 RPC는 서버 권한으로 실행되어 RLS를 우회하고, 금액도 클라이언트가 보낸 값이 아니라
bookings 테이블에서 직접 읽어서 계산하므로 더 안전하다.

이 패치는 정확한 OLD 문자열을 하드코딩하는 대신, "시작 마커"와 "끝 마커" 두 개를
파일에서 찾아 그 사이 블록 전체(settlement 계산 + payouts insert + invoices insert
+ 각각의 에러 핸들링)를 RPC 호출 한 줄로 교체한다. (해당 블록이 3000자 넘는 긴
블록이라 통째로 손으로 옮겨적는 것보다 안전함.)

대상 파일: src/contexts/AppDataContext.tsx

사용법: fix_settlement_silent_skip_on_booking.py를 먼저 적용한 뒤, 리포지토리
루트에서 실행
    python3 fix_settlement_creation_use_rpc.py
"""
import pathlib
import sys

TARGET_FILE = pathlib.Path("src/contexts/AppDataContext.tsx")

START_MARKER = "const settlement = computeSettlement(input.basePrice, input.optionsCost);"
END_MARKER = "// 트랜잭션이 확정되는 즉시"

NEW_BLOCK = '''const { error: settlementError } = await supabase.rpc("create_booking_settlement", {
        p_booking_id: booking.id,
      });
      if (settlementError) {
        console.error("[addBooking] 정산(payout/invoice) 생성 RPC 실패 (예약은 정상 처리됨):", settlementError);
      }

      '''

MARKER_ALREADY_APPLIED = 'supabase.rpc("create_booking_settlement"'


def main():
    if not TARGET_FILE.exists():
        print(f"ERROR: {TARGET_FILE} 를 찾을 수 없습니다. 리포지토리 루트에서 실행하세요.")
        sys.exit(1)

    text = TARGET_FILE.read_text(encoding="utf-8")

    if MARKER_ALREADY_APPLIED in text:
        print(f"SKIP: {TARGET_FILE} 은 이미 패치되어 있습니다.")
        sys.exit(0)

    start_count = text.count(START_MARKER)
    if start_count == 0:
        print(f"ERROR: 시작 마커를 찾지 못했습니다 (파일이 변경되었을 수 있음): {START_MARKER!r}")
        print("fix_settlement_silent_skip_on_booking.py 를 먼저 적용했는지 확인하세요.")
        sys.exit(1)
    if start_count > 1:
        print(f"ERROR: 시작 마커가 {start_count}번 발견되어 안전하게 패치할 수 없습니다. 수동 확인이 필요합니다.")
        sys.exit(1)

    start_idx = text.index(START_MARKER)

    end_idx = text.find(END_MARKER, start_idx)
    if end_idx == -1:
        print(f"ERROR: 시작 마커 이후에서 끝 마커를 찾지 못했습니다: {END_MARKER!r}")
        sys.exit(1)

    removed_len = end_idx - start_idx
    if removed_len > 6000 or removed_len < 500:
        print(f"ERROR: 두 마커 사이 길이가 예상 범위를 벗어났습니다 ({removed_len}자). "
              f"파일이 크게 변경되었을 수 있어 안전하게 패치할 수 없습니다.")
        sys.exit(1)

    old_block = text[start_idx:end_idx]
    print(f"확인: 마커 사이 {removed_len}자 블록을 교체합니다 (미리보기 첫 120자):")
    print("  " + old_block[:120].replace("\n", "\\n"))

    new_text = text[:start_idx] + NEW_BLOCK + text[end_idx:]
    TARGET_FILE.write_text(new_text, encoding="utf-8")
    print(f"\nOK: {TARGET_FILE} 패치됨 (payout/invoice 생성을 create_booking_settlement RPC 호출로 교체)")
    print("확인용 diff: git diff -- " + str(TARGET_FILE))


if __name__ == "__main__":
    main()
