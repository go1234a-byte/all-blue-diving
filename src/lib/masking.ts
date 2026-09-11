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

// 정산 계좌번호 마스킹 — 숫자 앞자리는 가리고 뒤 4자리만 보여준다. 대시(-) 등 원래 구분자는 유지.
// (예: "123-456-789012" -> "•••-•••-••9012") 숫자가 4자리 이하면 가릴 게 없어 원본 그대로 반환.
export function maskAccountNumber(raw?: string | null): string {
  if (!raw) return "-";
  const digitCount = (raw.match(/\d/g) ?? []).length;
  if (digitCount <= 4) return raw;
  let toMask = digitCount - 4;
  return raw
    .split("")
    .map((ch) => {
      if (/\d/.test(ch) && toMask > 0) {
        toMask -= 1;
        return "•";
      }
      return ch;
    })
    .join("");
}
