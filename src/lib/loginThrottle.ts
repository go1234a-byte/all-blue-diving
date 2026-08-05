const STORAGE_PREFIX = "ab_login_attempts_";
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
