/**
 * 현지 통화 ↔ 원화 환산.
 * 환율: ExchangeRate-API 오픈 엔드포인트(open.er-api.com) — 키 없이 상업적 이용 가능, 하루 1회 갱신,
 * 출처 표기("Rates By Exchange Rate API") 필수. 과호출 시 429가 나므로 브라우저에 12시간 캐시한다.
 */
export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

const CURRENCIES: Record<string, CurrencyInfo> = {
  PHP: { code: "PHP", name: "필리핀 페소", symbol: "₱" },
  IDR: { code: "IDR", name: "인도네시아 루피아", symbol: "Rp" },
  THB: { code: "THB", name: "태국 바트", symbol: "฿" },
  MYR: { code: "MYR", name: "말레이시아 링깃", symbol: "RM" },
  JPY: { code: "JPY", name: "일본 엔", symbol: "¥" },
  USD: { code: "USD", name: "미국 달러", symbol: "$" },
  MXN: { code: "MXN", name: "멕시코 페소", symbol: "MX$" },
  EGP: { code: "EGP", name: "이집트 파운드", symbol: "E£" },
  MVR: { code: "MVR", name: "몰디브 루피야", symbol: "Rf" },
  TWD: { code: "TWD", name: "대만 달러", symbol: "NT$" },
  VND: { code: "VND", name: "베트남 동", symbol: "₫" },
  AUD: { code: "AUD", name: "호주 달러", symbol: "A$" },
  FJD: { code: "FJD", name: "피지 달러", symbol: "FJ$" },
  EUR: { code: "EUR", name: "유로", symbol: "€" },
};

/** 다이빙 현장에서 실제로 많이 쓰는 통화 기준. 팔라우·몰디브 리조트는 미국 달러가 사실상 기본. */
const COUNTRY_CURRENCY: Record<string, string> = {
  필리핀: "PHP",
  인도네시아: "IDR",
  태국: "THB",
  말레이시아: "MYR",
  일본: "JPY",
  팔라우: "USD",
  몰디브: "USD",
  멕시코: "MXN",
  이집트: "EGP",
  대만: "TWD",
  베트남: "VND",
  호주: "AUD",
  피지: "FJD",
  몰타: "EUR",
  포르투갈: "EUR",
  미국: "USD",
  사이판: "USD",
  괌: "USD",
};

export function currencyForCountry(country: string): CurrencyInfo | null {
  const code = COUNTRY_CURRENCY[country?.trim()];
  return code ? CURRENCIES[code] ?? null : null;
}

/** 표에 없는 나라도 정산 화면에서 직접 고를 수 있게 전체 목록을 준다. */
export const SELECTABLE_CURRENCIES = Object.values(CURRENCIES);

const CACHE_KEY = "allblue-krw-rates";
const CACHE_MS = 12 * 60 * 60 * 1000;

export interface KrwRates {
  /** 1 KRW = rates[code] 외화 */
  rates: Record<string, number>;
  updatedAt: string;
}

let inflight: Promise<KrwRates> | null = null;

export function fetchKrwRates(): Promise<KrwRates> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const c = JSON.parse(raw) as KrwRates & { at: number };
      if (Date.now() - c.at < CACHE_MS) return Promise.resolve(c);
    }
  } catch {
    /* ignore */
  }
  if (inflight) return inflight;
  inflight = fetch("https://open.er-api.com/v6/latest/KRW")
    .then((r) => {
      if (!r.ok) throw new Error(`rates ${r.status}`);
      return r.json();
    })
    .then((j: { result: string; rates: Record<string, number>; time_last_update_utc: string }) => {
      if (j.result !== "success") throw new Error("rates failed");
      const value: KrwRates = { rates: j.rates, updatedAt: j.time_last_update_utc };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ...value, at: Date.now() }));
      } catch {
        /* ignore */
      }
      return value;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** 외화 금액 → 원 */
export function toKrw(amount: number, code: string, r: KrwRates): number | null {
  const rate = r.rates[code];
  return rate ? amount / rate : null;
}

/** 원 → 외화 금액 */
export function fromKrw(krw: number, code: string, r: KrwRates): number | null {
  const rate = r.rates[code];
  return rate ? krw * rate : null;
}

export function formatForeign(amount: number, c: CurrencyInfo): string {
  const digits = ["IDR", "VND", "JPY"].includes(c.code) ? 0 : amount >= 100 ? 0 : 2;
  return `${c.symbol}${amount.toLocaleString("ko-KR", { maximumFractionDigits: digits })}`;
}
