#!/usr/bin/env python3
"""
QA #39 후속: 관리자 화면(강사 관리)의 남은 오래된 안내 문구 수정

배경: 라이브에서 "경고 부여" 버튼을 눌러보니, 확인 대화상자에 여전히
"경고 2회 누적 시 자동으로 영구정지됩니다" 라는 문구가 떠 있었다. 이건
이전 패치들(fix_penalty_feature_restriction.py, v2)이 건드리지 않은 별도 위치 —
src/pages/admin/AdminInstructorsPage.tsx 안의 "경고 부여" 확인 대화상자 문구와,
경고 부여 후 뜨는 토스트 메시지다. 둘 다 PERMANENT_BAN_THRESHOLD(=2) 상수를
기준으로 "영구정지"를 언급하는데, 실제로는:
  - "경고 부여" 버튼(경고 누적, setInstructorPenalty)은 더 이상 자동 정지를
    하지 않는다 (앞 패치에서 제거함). 5회 누적 시 신규 투어 생성만 제한된다.
  - "영구정지" 버튼(handlePermanentBan)은 별개의 실제로 동작하는 기능으로,
    profiles.status를 suspended로 바꾸고 강사의 예정된 투어까지 정지 처리한다.
    이건 그대로 둔다 — 정상 동작하는 기능이라 건드리지 않음.

그래서 "경고 부여" 쪽 문구만 새 정책(5회 누적 시 기능 제한)에 맞게 고치고,
"영구정지" 버튼과 헷갈리지 않도록 새 상수 FEATURE_RESTRICTION_THRESHOLD(=5)를
따로 둔다. PERMANENT_BAN_THRESHOLD는 "영구정지" 버튼 로직에 계속 쓰이므로
건드리지 않는다.

대상 파일: src/pages/admin/AdminInstructorsPage.tsx

사용법: 리포지토리 루트에서 실행
    python3 fix_penalty_admin_ui_messages.py
"""
import pathlib
import sys

TARGET_FILE = pathlib.Path("src/pages/admin/AdminInstructorsPage.tsx")

# 이 문자열이 있으면 이미 패치된 것으로 간주 (이 스크립트에서만 새로 등장하는 고유 이름)
DONE_MARKER = "FEATURE_RESTRICTION_THRESHOLD"

REPLACEMENTS: list[tuple[str, str]] = [
    (
        "/** 2회 경고 누적 시 자동으로 영구정지 처리한다 (setInstructorPenalty 내부 로직과 동일 기준). */\n"
        "const PERMANENT_BAN_THRESHOLD = 2;",
        "/** '영구정지' 버튼으로 즉시 계정을 정지할 때 함께 기록되는 경고 횟수 값 (기록용, 실제 정지는\n"
        " * profiles.status 변경 + 투어 정지로 처리됨). */\n"
        "const PERMANENT_BAN_THRESHOLD = 2;\n"
        "\n"
        "/** 경고 누적이 이 값 이상이면 신규 투어 생성 기능이 제한된다 (InstructorConsole.tsx와 동일\n"
        " * 기준). 계정 자체는 정지되지 않는다 — 즉시 정지하려면 '영구정지' 버튼을 사용한다. */\n"
        "const FEATURE_RESTRICTION_THRESHOLD = 5;",
    ),
    (
        "if (next >= PERMANENT_BAN_THRESHOLD) {",
        "if (next >= FEATURE_RESTRICTION_THRESHOLD) {",
    ),
    (
        "— 영구정지 처리되었습니다.`,",
        "— 신규 투어 생성 기능이 제한됩니다.`,",
    ),
    (
        "경고 {PERMANENT_BAN_THRESHOLD}회 누적 시 자동으로 영구정지됩니다. 현재 누적 경고:",
        "경고 {FEATURE_RESTRICTION_THRESHOLD}회 누적 시 신규 투어 생성 기능이 제한됩니다 (계정 정지는 아닙니다). 현재 누적 경고:",
    ),
]


def main():
    if not TARGET_FILE.exists():
        print(f"ERROR: {TARGET_FILE} 를 찾을 수 없습니다. 리포지토리 루트에서 실행하세요.")
        sys.exit(1)

    text = TARGET_FILE.read_text(encoding="utf-8")

    if DONE_MARKER in text:
        print(f"SKIP: {TARGET_FILE} 은 이미 패치되어 있습니다.")
        sys.exit(0)

    for old, new in REPLACEMENTS:
        if old not in text:
            print(f"ERROR: {TARGET_FILE} 에서 다음 텍스트를 찾지 못했습니다 (파일이 변경되었을 수 있음):\n{old!r}")
            sys.exit(1)
        text = text.replace(old, new, 1)

    if DONE_MARKER not in text:
        print("ERROR: 치환 후에도 완료 마커가 보이지 않습니다. 수동 확인 필요.")
        sys.exit(1)

    TARGET_FILE.write_text(text, encoding="utf-8")
    print(f"OK: {TARGET_FILE} 패치됨 (경고 부여 대화상자/토스트 문구를 새 정책에 맞게 수정)")
    print("\n확인용 diff: git diff -- " + str(TARGET_FILE))


if __name__ == "__main__":
    main()
