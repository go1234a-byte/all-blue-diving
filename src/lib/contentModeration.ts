// 사용자 생성 콘텐츠(채팅·후기 등) 1차 필터.
// App Store Guideline 1.2: UGC 앱은 부적절한 콘텐츠를 걸러내는 수단을 갖춰야 한다.
// 완벽한 필터는 불가능하므로 명백한 욕설/모욕/성적 표현을 차단하고, 그 외는 신고/차단으로 처리한다.

const BANNED_PATTERNS: RegExp[] = [
  // 한국어 욕설/모욕 (변형 포함)
  /씨\s*발|시\s*발|씨\s*팔|시\s*팔|ㅅㅂ|ㅆㅂ/i,
  /병\s*신|븅\s*신|ㅂㅅ/i,
  /지\s*랄|ㅈㄹ/i,
  /좆|좇|ㅈ같|존나\s*(?:씨|시)/i,
  /개\s*새\s*끼|새\s*끼|ㅅㄲ|개\s*자\s*식/i,
  /니\s*(?:애|에)\s*미|느\s*금\s*마|엠\s*창/i,
  /썅|쌍\s*놈|쌍\s*년/i,
  /꺼\s*져|닥\s*쳐/i,
  // 성적 표현
  /섹\s*스|야\s*동|자\s*위|보\s*지|자\s*지|섹\s*트/i,
  // 영어 욕설
  /\bf+u+c+k+/i,
  /\bs+h+i+t+/i,
  /\bb+i+t+c+h+/i,
  /\ba+s+s+h+o+l+e+/i,
  /\bc+u+n+t+/i,
  /\bd+i+c+k+h+e+a+d+/i,
  /\bn+i+g+g+(?:e+r+|a+)/i,
];

/** 명백히 부적절한 표현이 포함돼 있으면 true. */
export function containsObjectionable(text: string): boolean {
  if (!text) return false;
  const normalized = text.replace(/[\s._\-*]+/g, (m) => m).toLowerCase();
  return BANNED_PATTERNS.some((re) => re.test(text) || re.test(normalized));
}

export const OBJECTIONABLE_BLOCKED_MESSAGE =
  "부적절한 표현이 포함되어 있어 전송할 수 없습니다. 상호 존중하는 표현을 사용해주세요.";
