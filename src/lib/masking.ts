// 이름 마스킹 규칙
// 2자: 김* / 3자: 홍*동 / 4자: 황**수 / 5자 이상: 첫글자 + * + 끝글자
export function maskName(name: string): string {
  const trimmed = name.trim();
  const len = trimmed.length;
  if (len <= 1) return trimmed;
  if (len === 2) return `${trimmed[0]}*`;
  if (len === 3) return `${trimmed[0]}*${trimmed[2]}`;
  // 4자 이상: 첫글자 + (길이-2)개의 * + 끝글자
  const middleStars = "*".repeat(len - 2);
  return `${trimmed[0]}${middleStars}${trimmed[len - 1]}`;
}
