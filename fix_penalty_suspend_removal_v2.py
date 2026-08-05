#!/usr/bin/env python3
"""
fix_penalty_feature_restriction.py 후속 수정판 (v2)

이전 패치(fix_penalty_feature_restriction.py)를 실행했을 때, AppDataContext.tsx의
주석 교체는 정상 적용됐지만 "경고 2회 자동 영구정지" 코드 블록 제거는 조용히
누락됐다. 라이브에서 확인해보니 (GitHub Contents API로 커밋 02ea7b3 검사) 아래
죽은 코드가 여전히 남아있었다:

    if (penaltyCount >= 2) {
      const instructor = instructors.find((i) => i.id === instructorId);
      if (instructor?.profileId) {
        await setProfileStatus(instructor.profileId, "suspended");
      }
    }
  };

원인: 이전 스크립트의 "이미 적용됐는지" 체크가 새 텍스트("\\n  };")로 판단했는데,
이 문자열이 파일 안 다른 함수들의 끝부분과도 우연히 일치해서 실제로는 적용 안
됐는데 "이미 적용됨"으로 오판하고 건너뛴 것으로 보인다. 이번 스크립트는 그
문제를 피하기 위해 "if (penaltyCount >= 2) {" 라는, 이 블록에서만 나오는
고유한 문자열의 존재 여부로 이미 적용됐는지를 판단한다.

대상 파일: src/contexts/AppDataContext.tsx

사용법: 리포지토리 루트에서 실행
    python3 fix_penalty_suspend_removal_v2.py
"""
import pathlib
import sys

APP_DATA_CONTEXT_FILE = pathlib.Path("src/contexts/AppDataContext.tsx")

BLOCK_OLD = (
    "\n\n"
    "    if (penaltyCount >= 2) {\n"
    "      const instructor = instructors.find((i) => i.id === instructorId);\n"
    "      if (instructor?.profileId) {\n"
    "        await setProfileStatus(instructor.profileId, \"suspended\");\n"
    "      }\n"
    "    }\n"
    "  };"
)
BLOCK_NEW = "\n  };"

UNIQUE_MARKER = "if (penaltyCount >= 2) {"


def main():
    if not APP_DATA_CONTEXT_FILE.exists():
        print(f"ERROR: {APP_DATA_CONTEXT_FILE} 를 찾을 수 없습니다. 리포지토리 루트에서 실행하세요.")
        sys.exit(1)

    text = APP_DATA_CONTEXT_FILE.read_text(encoding="utf-8")

    if UNIQUE_MARKER not in text:
        print(f"SKIP: {APP_DATA_CONTEXT_FILE} 에 이미 적용되어 있습니다 (죽은 코드 없음).")
        sys.exit(0)

    if BLOCK_OLD not in text:
        print(
            f"ERROR: {APP_DATA_CONTEXT_FILE} 에서 예상한 정확한 블록을 찾지 못했습니다. "
            "파일이 추가로 변경됐을 수 있으니 수동으로 확인해주세요.\n"
            f"찾던 마커: {UNIQUE_MARKER!r}"
        )
        sys.exit(1)

    text = text.replace(BLOCK_OLD, BLOCK_NEW, 1)

    if UNIQUE_MARKER in text:
        print("ERROR: 치환 후에도 여전히 죽은 코드가 남아있습니다. 수동 확인 필요.")
        sys.exit(1)

    APP_DATA_CONTEXT_FILE.write_text(text, encoding="utf-8")
    print(f"OK: {APP_DATA_CONTEXT_FILE} 에서 2회 자동 영구정지 죽은 코드 제거 완료")
    print("\n확인용 diff: git diff -- " + str(APP_DATA_CONTEXT_FILE))


if __name__ == "__main__":
    main()
