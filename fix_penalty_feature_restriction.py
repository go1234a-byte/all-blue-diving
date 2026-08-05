#!/usr/bin/env python3
"""
QA #39 대응: 강사 패널티(경고) 누적 시 실제 제재 적용

배경 (조사 결과):
  AppDataContext.tsx의 setInstructorPenalty() 안에 이미
  "경고 2회 이상이면 profiles.status를 suspended로 바꾼다" 라는 코드가
  있었지만, 앱 어디에도 status==="suspended"를 검사해서 뭔가를 막는 로직이
  없어서 완전히 죽은 코드였다 (DB엔 기록되지만 실제로는 로그인/기능 모두
  평소처럼 됨). 이건 QA #29 논의 때 정한 방향(경고 5회 누적 시 "기능만 제한",
  로그인/계정 자체는 막지 않음)과 임계치·방식이 둘 다 달라서 사용자 확인 후
  아래와 같이 정리하기로 함:

    1. AppDataContext.tsx: 2회 자동 영구정지(suspended) 코드 제거
    2. InstructorConsole.tsx: 경고 5회 이상이면 "신규 투어 생성" 탭만 제한
       (기존 예약/정산/채팅 등 다른 기능은 그대로 이용 가능, 로그인도 막지 않음)

대상 파일:
  1. src/contexts/AppDataContext.tsx (수정)
  2. src/pages/InstructorConsole.tsx (수정)

사용법: 리포지토리 루트에서 실행
    python3 fix_penalty_feature_restriction.py
"""
import pathlib
import sys

APP_DATA_CONTEXT_FILE = pathlib.Path("src/contexts/AppDataContext.tsx")
INSTRUCTOR_CONSOLE_FILE = pathlib.Path("src/pages/InstructorConsole.tsx")

# --- AppDataContext.tsx 패치 ---
CONTEXT_COMMENT_OLD = (
    "   * 관리자 — 강사에게 경고를 주거나(+1) 경고를 해제한다(0으로 초기화).\n"
    "   * 누적 경고가 2회 이상이 되면 연결된 계정(profiles)을 자동으로 영구정지 처리한다.\n"
    "   */"
)
CONTEXT_COMMENT_NEW = (
    "   * 관리자 — 강사에게 경고를 주거나(+1) 경고를 해제한다(0으로 초기화).\n"
    "   * 누적 경고가 5회 이상이 되면 신규 투어 생성 기능이 제한된다 (InstructorConsole.tsx에서 처리).\n"
    "   * 계정 정지/로그인 차단은 하지 않는다 — QA #39 대응 시 2회 자동 영구정지 로직은 제거함.\n"
    "   */"
)

CONTEXT_SUSPEND_BLOCK_OLD = (
    "\n\n"
    "    if (penaltyCount >= 2) {\n"
    "      const instructor = instructors.find((i) => i.id === instructorId);\n"
    "      if (instructor?.profileId) {\n"
    "        await setProfileStatus(instructor.profileId, \"suspended\");\n"
    "      }\n"
    "    }\n"
    "  };"
)
CONTEXT_SUSPEND_BLOCK_NEW = "\n  };"

# --- InstructorConsole.tsx 패치 ---
CONSOLE_VARS_OLD = (
    '  const { currentInstructorId } = useRole();\n'
    '  const { getInstructorById } = useAppData();\n'
    '  const isVerifiedInstructor = getInstructorById(currentInstructorId)?.verified === true;\n'
    '\n'
    '  return ('
)
CONSOLE_VARS_NEW = (
    '  const { currentInstructorId } = useRole();\n'
    '  const { getInstructorById } = useAppData();\n'
    '  const isVerifiedInstructor = getInstructorById(currentInstructorId)?.verified === true;\n'
    '  const instructorPenaltyCount = getInstructorById(currentInstructorId)?.penaltyCount ?? 0;\n'
    '  const isTourCreationRestricted = instructorPenaltyCount >= 5;\n'
    '\n'
    '  return ('
)

CONSOLE_CREATE_TAB_OLD = (
    '          <TabsContent value="create" className="pt-4">\n'
    '            <TourCreateForm instructorId={currentInstructorId} onCreated={() => setTab("dashboard")} />\n'
    '          </TabsContent>'
)
CONSOLE_CREATE_TAB_NEW = (
    '          <TabsContent value="create" className="pt-4">\n'
    '            {isTourCreationRestricted ? (\n'
    '              <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">\n'
    '                <p className="font-medium">신규 투어 생성이 제한되었습니다.</p>\n'
    '                <p className="mt-1 text-xs text-red-700">\n'
    '                  누적 경고 {instructorPenaltyCount}회로 신규 투어 생성 기능이 제한되었습니다. 기존 예약·정산·채팅 등\n'
    '                  다른 기능은 계속 이용하실 수 있습니다. 이의가 있으시면 고객센터로 문의해주세요.\n'
    '                </p>\n'
    '              </div>\n'
    '            ) : (\n'
    '              <TourCreateForm instructorId={currentInstructorId} onCreated={() => setTab("dashboard")} />\n'
    '            )}\n'
    '          </TabsContent>'
)


def patch_file(path: pathlib.Path, replacements: list[tuple[str, str]], label: str) -> bool:
    if not path.exists():
        print(f"ERROR: {path} 를 찾을 수 없습니다. 리포지토리 루트에서 실행하세요.")
        return False

    text = path.read_text(encoding="utf-8")
    already_done = all(new in text for _old, new in replacements)
    if already_done:
        print(f"SKIP: {path} 은 이미 패치되어 있습니다. ({label})")
        return True

    for old, new in replacements:
        if new in text:
            continue
        if old not in text:
            print(f"ERROR: {path} 에서 다음 텍스트를 찾지 못했습니다 (파일이 변경되었을 수 있음):\n{old!r}")
            return False
        text = text.replace(old, new, 1)

    path.write_text(text, encoding="utf-8")
    print(f"OK: {path} 패치됨 ({label})")
    return True


def main():
    ok = True
    ok &= patch_file(
        APP_DATA_CONTEXT_FILE,
        [(CONTEXT_COMMENT_OLD, CONTEXT_COMMENT_NEW), (CONTEXT_SUSPEND_BLOCK_OLD, CONTEXT_SUSPEND_BLOCK_NEW)],
        "2회 자동 영구정지 죽은 코드 제거",
    )
    ok &= patch_file(
        INSTRUCTOR_CONSOLE_FILE,
        [(CONSOLE_VARS_OLD, CONSOLE_VARS_NEW), (CONSOLE_CREATE_TAB_OLD, CONSOLE_CREATE_TAB_NEW)],
        "경고 5회 이상 시 신규 투어 생성 제한",
    )

    if not ok:
        sys.exit(1)

    print("\n완료. 확인용 diff:")
    print("  git diff -- " + str(APP_DATA_CONTEXT_FILE) + " " + str(INSTRUCTOR_CONSOLE_FILE))


if __name__ == "__main__":
    main()
