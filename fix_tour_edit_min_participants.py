#!/usr/bin/env python3
"""
투어 "수정" 화면에도 최소 인원 검증 추가 (fix_qa_signup_password_and_tour_capacity.py 후속)

배경: 직전 패치에서 TourCreateForm.tsx(투어 생성)에 "최소 인원 <= 0" /
"최소 인원 > 최대 인원" 검증을 추가했는데, 라이브로 재테스트해보니 투어
"수정" 화면(TourEditPage → TourEditForm.tsx)은 완전히 별도의 컴포넌트
(handleSubmit도 따로 있음, TourCreateForm.tsx를 재사용하지 않음)라서
직전 패치가 전혀 적용되지 않은 상태였다. 실제로 최소인원=99, 최대인원=6인
상태로 "저장하기"를 눌러도 아무 차단 없이 그대로 저장됨을 라이브에서 확인함.

이 파일은 TourCreateForm.tsx와 동일한 두 검증(최소인원 <=0, 최소인원 >
최대인원)을 TourEditForm.tsx의 기존 "최대인원 <= 0" 체크 바로 뒤에 추가한다.
단, 이 체크들은 기존 코드와 동일하게 `if (!hasActiveBooking) { ... }` 블록
안에 넣는다 — 이미 확정 예약이 있는 투어는 정원 입력란 자체가
disabled 처리되어 있고, 제출 시에도 폼 값을 무시하고 기존 tour.maxParticipants
/ tour.minParticipants를 그대로 재전송하도록 설계되어 있어서, 그 경우까지
새 검증에 걸리게 하면 안 되기 때문 (기존 패턴을 그대로 따름).

대상 파일: src/components/instructor/TourEditForm.tsx

사용법: 리포지토리 루트에서 실행
    python3 fix_tour_edit_min_participants.py
"""
import pathlib
import sys

TARGET_FILE = pathlib.Path("src/components/instructor/TourEditForm.tsx")

OLD = '''      if (Number(maxParticipants) <= 0) {
        toast({ title: "모집 정원은 1명 이상이어야 합니다", variant: "destructive" });
        return;
      }
    }
    if (centerMode === "existing" && !selectedCenterId) {'''

NEW = '''      if (Number(maxParticipants) <= 0) {
        toast({ title: "모집 정원은 1명 이상이어야 합니다", variant: "destructive" });
        return;
      }
      if (Number(minParticipants) <= 0) {
        toast({ title: "최소 인원은 1명 이상이어야 합니다", variant: "destructive" });
        return;
      }
      if (Number(minParticipants) > Number(maxParticipants)) {
        toast({ title: "최소 인원은 최대 인원보다 클 수 없습니다", variant: "destructive" });
        return;
      }
    }
    if (centerMode === "existing" && !selectedCenterId) {'''


def main():
    if not TARGET_FILE.exists():
        print(f"ERROR: {TARGET_FILE} 를 찾을 수 없습니다. 리포지토리 루트에서 실행하세요.")
        sys.exit(1)

    text = TARGET_FILE.read_text(encoding="utf-8")

    if NEW in text:
        print(f"SKIP: {TARGET_FILE} 은 이미 패치되어 있습니다.")
        sys.exit(0)

    if OLD not in text:
        print(f"ERROR: {TARGET_FILE} 에서 다음 텍스트를 찾지 못했습니다 (파일이 변경되었을 수 있음):\n{OLD!r}")
        sys.exit(1)

    text = text.replace(OLD, NEW, 1)
    TARGET_FILE.write_text(text, encoding="utf-8")
    print(f"OK: {TARGET_FILE} 패치됨 (투어 수정 화면에도 최소 인원 검증 추가)")
    print("\n확인용 diff: git diff -- " + str(TARGET_FILE))


if __name__ == "__main__":
    main()
