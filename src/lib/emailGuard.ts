// 가입 폼의 이메일 입력을 막는다. mailer_autoconfirm이 켜져 있어 가입이 확인 메일 없이 즉시
// 승인되므로(의도적 설정 — SMTP 미구성), 형식이 뻔히 틀렸거나 1회용 메일인 것만이라도 코드에서 거른다.
// 실제 메일 소유 확인은 아니다 — 그건 프로젝트의 "Confirm email" 설정이 해야 할 일.

// RFC 전체를 흉내 내지 않는다: local@domain.tld, 공백 없음, 도메인에 점 하나 이상.
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 흔히 쓰이는 1회용/임시 메일 서비스 도메인. 새 서비스가 나오면 추가한다.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.info",
  "temp-mail.org",
  "tempmail.com",
  "yopmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "moakt.com",
]);

/** 가입을 막아야 하면 안내 문구를, 통과하면 null을 돌려준다. */
export function emailSignupIssue(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!EMAIL_FORMAT.test(email)) return "이메일 형식을 확인해주세요";
  const domain = email.split("@")[1] ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) return "1회용 메일 주소는 가입에 쓸 수 없어요";
  return null;
}
