#!/usr/bin/env python3
"""
QA 체크리스트(회원가입/투어생성) 라이브 테스트에서 발견한 버그 2건 수정

버그 1 (id 2, 회원가입 - 비밀번호 최소 길이):
  DiverSignupForm.tsx / InstructorSignupForm.tsx 둘 다 비밀번호 입력창
  placeholder는 "8자 이상 입력해주세요"라고 안내하지만, 실제로는 클라이언트단
  사전 검증이 전혀 없어서 3자리 비밀번호도 그대로 Supabase Auth API로 전송됨.
  Supabase가 6자 미만만 거부하기 때문에("Password should be at least 6
  characters.") 6~7자 비밀번호는 안내와 다르게 통과되고, 그마저도 실패 시
  번역 안 된 영어 원문 에러가 그대로 노출됨.
  수정: 두 폼 모두 제출/다음단계 이동 전에 password.length < 8 체크를 추가해서
  안내 문구와 실제 정책을 일치시키고, 한글 에러 메시지로 즉시 안내함.

버그 2 (id 45, 투어생성 - 최소 인원 미검증):
  TourCreateForm.tsx에 "최대 인원(maxParticipants) <= 0"은 막는 코드가
  있었지만, "최소 인원(minParticipants)"에는 대응하는 검증이 전혀 없었음.
  0/음수 최소 인원은 물론, 최소 인원이 최대 인원보다 큰 경우(예: 최대 2,
  최소 10)도 그대로 등록이 시도됨.
  수정: 최대 인원 검증 바로 뒤에 (a) 최소 인원 <= 0 차단, (b) 최소 인원 >
  최대 인원 차단을 추가.

대상 파일:
  1. src/components/auth/DiverSignupForm.tsx
  2. src/components/auth/InstructorSignupForm.tsx
  3. src/components/instructor/TourCreateForm.tsx

사용법: 리포지토리 루트에서 실행
    python3 fix_qa_signup_password_and_tour_capacity.py
"""
import pathlib
import sys

DIVER_FILE = pathlib.Path("src/components/auth/DiverSignupForm.tsx")
INSTRUCTOR_FILE = pathlib.Path("src/components/auth/InstructorSignupForm.tsx")
TOUR_FILE = pathlib.Path("src/components/instructor/TourCreateForm.tsx")

PASSWORD_CHECK_BLOCK = '''    if (password.length < 8) {
      toast({
        title: "비밀번호는 8자 이상이어야 합니다",
        description: "영문, 숫자 등을 조합해 8자 이상으로 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
'''

# --- 1) DiverSignupForm.tsx ---
DIVER_OLD = '''    if (!email || !password || !name || !phone) {
      toast({ title: "필수 항목을 입력해주세요", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {'''
DIVER_NEW = (
    '''    if (!email || !password || !name || !phone) {
      toast({ title: "필수 항목을 입력해주세요", variant: "destructive" });
      return;
    }
'''
    + PASSWORD_CHECK_BLOCK
    + '''    if (password !== confirmPassword) {'''
)

# --- 2) InstructorSignupForm.tsx ---
# 여기는 canGoNext() 안, "다음" 이동 전 case 1 검증 로직에 추가 (return; 대신 return false;)
INSTRUCTOR_PASSWORD_CHECK_BLOCK = '''        if (password.length < 8) {
          toast({
            title: "비밀번호는 8자 이상이어야 합니다",
            description: "영문, 숫자 등을 조합해 8자 이상으로 입력해주세요.",
            variant: "destructive",
          });
          return false;
        }
'''
INSTRUCTOR_OLD = '''        if (!name || !phone || !email || !password || idFiles.length === 0) {
          toast({
            title: "필수 항목을 입력해주세요",
            description: "이메일/비밀번호/이름/연락처/신분증 사본은 필수입니다.",
            variant: "destructive",
          });
          return false;
        }
        if (password !== confirmPassword) {'''
INSTRUCTOR_NEW = (
    '''        if (!name || !phone || !email || !password || idFiles.length === 0) {
          toast({
            title: "필수 항목을 입력해주세요",
            description: "이메일/비밀번호/이름/연락처/신분증 사본은 필수입니다.",
            variant: "destructive",
          });
          return false;
        }
'''
    + INSTRUCTOR_PASSWORD_CHECK_BLOCK
    + '''        if (password !== confirmPassword) {'''
)

# --- 3) TourCreateForm.tsx ---
TOUR_OLD = '''    if (Number(maxParticipants) <= 0) {
      toast({ title: "모집 정원은 1명 이상이어야 합니다", variant: "destructive" });
      return;
    }
    if (centerMode === "existing" && !selectedCenterId) {'''
TOUR_NEW = '''    if (Number(maxParticipants) <= 0) {
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
    if (centerMode === "existing" && !selectedCenterId) {'''


def patch_file(path: pathlib.Path, old: str, new: str, label: str) -> bool:
    if not path.exists():
        print(f"ERROR: {path} 를 찾을 수 없습니다. 리포지토리 루트에서 실행하세요.")
        return False

    text = path.read_text(encoding="utf-8")

    if new in text:
        print(f"SKIP: {path} 은 이미 패치되어 있습니다. ({label})")
        return True

    if old not in text:
        print(f"ERROR: {path} 에서 다음 텍스트를 찾지 못했습니다 (파일이 변경되었을 수 있음):\n{old!r}")
        return False

    text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")
    print(f"OK: {path} 패치됨 ({label})")
    return True


def main():
    ok = True
    ok &= patch_file(DIVER_FILE, DIVER_OLD, DIVER_NEW, "다이버 가입: 비밀번호 8자 미만 사전 차단")
    ok &= patch_file(INSTRUCTOR_FILE, INSTRUCTOR_OLD, INSTRUCTOR_NEW, "강사 가입: 비밀번호 8자 미만 사전 차단")
    ok &= patch_file(TOUR_FILE, TOUR_OLD, TOUR_NEW, "투어 생성: 최소 인원 0 이하 / 최대 인원 초과 차단")

    if not ok:
        sys.exit(1)

    print("\n완료. 확인용 diff:")
    print("  git diff -- " + str(DIVER_FILE))
    print("  git diff -- " + str(INSTRUCTOR_FILE))
    print("  git diff -- " + str(TOUR_FILE))


if __name__ == "__main__":
    main()
