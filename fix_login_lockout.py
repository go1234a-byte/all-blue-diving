#!/usr/bin/env python3
"""
QA #29 대응: 로그인 실패 다회 시도 시 잠금/제한 정책 추가 (프론트엔드 쓰로틀링)

배경: Auth.tsx에는 로그인 실패 횟수를 세거나 잠그는 로직이 전혀 없었음
(코드리뷰로 확인, QA 체크리스트 #29 Fail 처리됨).

이 패치는 이메일별로 localStorage에 실패 횟수를 기록해서, 5회 연속 실패 시
15분간 로그인 시도를 막고 안내 메시지를 보여준다.

** 중요 한계 **
이건 UX 레벨의 최소 방어선이다. localStorage를 지우거나 시크릿 모드를 쓰면
우회 가능하고, 우리 프론트엔드를 거치지 않고 Supabase Auth API를 직접
두드리는 공격자에게는 아무 효과가 없다. 진짜 방어선은 Supabase 프로젝트
대시보드의 Authentication > Rate Limits / CAPTCHA 설정이며, 이건 코드가
아니라 대시보드에서 별도로 켜야 한다.

대상 파일:
  1. src/lib/loginThrottle.ts (신규 생성)
  2. src/pages/Auth.tsx (수정)

사용법: 리포지토리 루트에서 실행
    python3 fix_login_lockout.py
"""
import pathlib
import sys

THROTTLE_FILE = pathlib.Path("src/lib/loginThrottle.ts")
AUTH_FILE = pathlib.Path("src/pages/Auth.tsx")

THROTTLE_FILE_CONTENT = '''const STORAGE_PREFIX = "ab_login_attempts_";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15분

interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}

function storageKey(email: string): string {
  return STORAGE_PREFIX + email.trim().toLowerCase();
}

function readRecord(email: string): AttemptRecord {
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (!raw) return { count: 0, lockedUntil: null };
    const parsed = JSON.parse(raw) as AttemptRecord;
    return { count: parsed.count ?? 0, lockedUntil: parsed.lockedUntil ?? null };
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function writeRecord(email: string, record: AttemptRecord): void {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(record));
  } catch {
    // localStorage를 쓸 수 없는 환경이면 그냥 무시 (fail open)
  }
}

/** 현재 잠금 상태면 남은 시간(ms)을, 아니면 0을 반환한다. */
export function getLoginLockoutRemainingMs(email: string): number {
  if (!email) return 0;
  const record = readRecord(email);
  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    return record.lockedUntil - Date.now();
  }
  return 0;
}

/**
 * 로그인 실패를 1회 기록한다. MAX_ATTEMPTS에 도달하면 잠금을 걸고
 * 남은 잠금 시간(ms)을 반환한다. 아직 잠금이 아니면 0을 반환한다.
 */
export function recordFailedLoginAttempt(email: string): number {
  if (!email) return 0;
  const now = Date.now();
  const record = readRecord(email);
  if (record.lockedUntil && record.lockedUntil > now) {
    return record.lockedUntil - now;
  }
  const count = record.count + 1;
  if (count >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_MS;
    writeRecord(email, { count, lockedUntil });
    return LOCKOUT_MS;
  }
  writeRecord(email, { count, lockedUntil: null });
  return 0;
}

/** 로그인 성공 시 호출해서 실패 기록을 초기화한다. */
export function clearLoginAttempts(email: string): void {
  if (!email) return;
  try {
    localStorage.removeItem(storageKey(email));
  } catch {
    // ignore
  }
}
'''

AUTH_OLD = (
    '    if (!email || !password) {\n'
    '      toast({ title: "이메일과 비밀번호를 입력해주세요", variant: "destructive" });\n'
    '      return;\n'
    '    }\n'
    '    setSubmitting(true);\n'
    '    try {\n'
    '      const { error } = await supabase.auth.signInWithPassword({ email, password });\n'
    '      if (error) {\n'
    '        toast({ title: "로그인에 실패했습니다", description: error.message, variant: "destructive" });\n'
    '        return;\n'
    '      }\n'
    '      toast({ title: "로그인되었습니다!" });\n'
    '      onSuccess();\n'
    '    } finally {\n'
    '      setSubmitting(false);\n'
    '    }\n'
    '  };\n'
)

AUTH_NEW = (
    '    if (!email || !password) {\n'
    '      toast({ title: "이메일과 비밀번호를 입력해주세요", variant: "destructive" });\n'
    '      return;\n'
    '    }\n'
    '    const lockoutMs = getLoginLockoutRemainingMs(email);\n'
    '    if (lockoutMs > 0) {\n'
    '      const minutes = Math.max(1, Math.ceil(lockoutMs / 60000));\n'
    '      toast({\n'
    '        title: "로그인 시도가 너무 많습니다",\n'
    '        description: `보안을 위해 약 ${minutes}분 후 다시 시도해주세요.`,\n'
    '        variant: "destructive",\n'
    '      });\n'
    '      return;\n'
    '    }\n'
    '    setSubmitting(true);\n'
    '    try {\n'
    '      const { error } = await supabase.auth.signInWithPassword({ email, password });\n'
    '      if (error) {\n'
    '        const remainingMs = recordFailedLoginAttempt(email);\n'
    '        if (remainingMs > 0) {\n'
    '          const minutes = Math.max(1, Math.ceil(remainingMs / 60000));\n'
    '          toast({\n'
    '            title: "로그인 시도가 너무 많습니다",\n'
    '            description: `보안을 위해 약 ${minutes}분 후 다시 시도해주세요.`,\n'
    '            variant: "destructive",\n'
    '          });\n'
    '        } else {\n'
    '          toast({ title: "로그인에 실패했습니다", description: error.message, variant: "destructive" });\n'
    '        }\n'
    '        return;\n'
    '      }\n'
    '      clearLoginAttempts(email);\n'
    '      toast({ title: "로그인되었습니다!" });\n'
    '      onSuccess();\n'
    '    } finally {\n'
    '      setSubmitting(false);\n'
    '    }\n'
    '  };\n'
)

IMPORT_OLD = 'import { supabase } from "@/integrations/supabase/client";\n'
IMPORT_NEW = (
    'import { supabase } from "@/integrations/supabase/client";\n'
    'import { getLoginLockoutRemainingMs, recordFailedLoginAttempt, clearLoginAttempts } from "@/lib/loginThrottle";\n'
)


def main():
    if not AUTH_FILE.exists():
        print(f"ERROR: {AUTH_FILE} 를 찾을 수 없습니다. 리포지토리 루트에서 실행하세요.")
        sys.exit(1)

    # 1. 신규 유틸 파일 생성
    THROTTLE_FILE.parent.mkdir(parents=True, exist_ok=True)
    if THROTTLE_FILE.exists():
        print(f"SKIP: {THROTTLE_FILE} 이미 존재함 (덮어쓰지 않음). 내용이 다르면 수동 확인 필요.")
    else:
        THROTTLE_FILE.write_text(THROTTLE_FILE_CONTENT, encoding="utf-8")
        print(f"OK: {THROTTLE_FILE} 생성됨")

    # 2. Auth.tsx 패치
    text = AUTH_FILE.read_text(encoding="utf-8")

    if AUTH_NEW in text:
        print(f"SKIP: {AUTH_FILE} 은 이미 패치되어 있습니다.")
        sys.exit(0)

    if IMPORT_OLD not in text:
        print(f"ERROR: {AUTH_FILE} 에서 import 대상 텍스트를 찾지 못했습니다. 파일이 변경되었을 수 있습니다.")
        sys.exit(1)
    if AUTH_OLD not in text:
        print(f"ERROR: {AUTH_FILE} 에서 handleSubmit 대상 텍스트를 찾지 못했습니다. 파일이 변경되었을 수 있습니다.")
        sys.exit(1)

    text = text.replace(IMPORT_OLD, IMPORT_NEW, 1)
    text = text.replace(AUTH_OLD, AUTH_NEW, 1)
    AUTH_FILE.write_text(text, encoding="utf-8")
    print(f"OK: {AUTH_FILE} 패치됨 (로그인 5회 실패 시 15분 잠금)")
    print("\n완료. 다음 명령으로 diff 확인: git diff -- " + str(THROTTLE_FILE) + " " + str(AUTH_FILE))


if __name__ == "__main__":
    main()
