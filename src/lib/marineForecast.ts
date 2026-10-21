/**
 * 바다 예보 — Open-Meteo Marine API(파고·주기·수온) + Forecast API(바람·날씨).
 *
 * 라이선스 주의: Open-Meteo 무료 API는 "비상업적 이용"만 허용된다. 올블루는 상업 서비스이므로
 * 운영 도메인(allbluedive.com)에서는 유료 플랜의 API 키(VITE_OPEN_METEO_API_KEY)가 있어야만 켜진다.
 * 키가 있으면 customer-* 전용 도메인 + apikey 파라미터로 호출한다.
 * 키가 없으면 프리뷰·로컬 개발(평가 용도)에서만 무료 엔드포인트로 동작한다.
 * 데이터 출처 표기(Open-Meteo, CC BY 4.0)는 카드에 항상 노출한다.
 */
const API_KEY = import.meta.env.VITE_OPEN_METEO_API_KEY as string | undefined;
const PRODUCTION_HOSTS = ["allbluedive.com", "www.allbluedive.com"];

export function isMarineForecastEnabled(): boolean {
  if (API_KEY) return true;
  if (typeof window === "undefined") return false;
  return !PRODUCTION_HOSTS.includes(window.location.hostname);
}

function endpoint(host: "marine-api" | "api", path: string, params: Record<string, string>): string {
  const base = API_KEY ? `https://customer-${host}.open-meteo.com` : `https://${host}.open-meteo.com`;
  const q = new URLSearchParams(params);
  if (API_KEY) q.set("apikey", API_KEY);
  return `${base}${path}?${q.toString()}`;
}

export interface MarineDay {
  date: string; // YYYY-MM-DD (현지)
  waveMaxM: number | null;
  wavePeriodS: number | null;
  seaTempC: number | null;
  windMaxMs: number | null;
  gustMaxMs: number | null;
  rainProb: number | null;
  weatherCode: number | null;
}

const CACHE_PREFIX = "allblue-marine:";
const CACHE_MS = 3 * 60 * 60 * 1000;

export async function fetchMarineForecast(lat: number, lng: number): Promise<MarineDay[]> {
  const key = `${CACHE_PREFIX}${lat.toFixed(2)},${lng.toFixed(2)}`;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const cached = JSON.parse(raw) as { at: number; days: MarineDay[] };
      if (Date.now() - cached.at < CACHE_MS) return cached.days;
    }
  } catch {
    /* 저장소를 못 쓰면 그냥 새로 받는다 */
  }

  const common = { latitude: String(lat), longitude: String(lng), timezone: "auto", forecast_days: "8" };
  const [marineRes, weatherRes] = await Promise.all([
    fetch(endpoint("marine-api", "/v1/marine", { ...common, daily: "wave_height_max,wave_period_max", hourly: "sea_surface_temperature" })),
    fetch(
      endpoint("api", "/v1/forecast", {
        ...common,
        daily: "wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max,weather_code",
        wind_speed_unit: "ms",
      }),
    ),
  ]);
  if (!marineRes.ok) throw new Error(`marine ${marineRes.status}`);
  const marine = await marineRes.json();
  const weather = weatherRes.ok ? await weatherRes.json() : null;

  // 시간별 수온 → 날짜별 평균
  const sstByDay = new Map<string, number[]>();
  const hTimes: string[] = marine.hourly?.time ?? [];
  const hSst: (number | null)[] = marine.hourly?.sea_surface_temperature ?? [];
  hTimes.forEach((t, i) => {
    const v = hSst[i];
    if (v == null) return;
    const d = t.slice(0, 10);
    sstByDay.set(d, [...(sstByDay.get(d) ?? []), v]);
  });

  const dates: string[] = marine.daily?.time ?? [];
  const wIdx = new Map<string, number>((weather?.daily?.time ?? []).map((d: string, i: number) => [d, i]));
  const days: MarineDay[] = dates.map((date, i) => {
    const wi = wIdx.get(date);
    const sst = sstByDay.get(date);
    return {
      date,
      waveMaxM: marine.daily?.wave_height_max?.[i] ?? null,
      wavePeriodS: marine.daily?.wave_period_max?.[i] ?? null,
      seaTempC: sst?.length ? sst.reduce((a, b) => a + b, 0) / sst.length : null,
      windMaxMs: wi != null ? weather.daily.wind_speed_10m_max?.[wi] ?? null : null,
      gustMaxMs: wi != null ? weather.daily.wind_gusts_10m_max?.[wi] ?? null : null,
      rainProb: wi != null ? weather.daily.precipitation_probability_max?.[wi] ?? null : null,
      weatherCode: wi != null ? weather.daily.weather_code?.[wi] ?? null : null,
    };
  });

  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), days }));
  } catch {
    /* ignore */
  }
  return days;
}

/** 다이버가 바로 읽을 수 있는 한 줄 판단. 모델 예보라 "참고"용으로만 쓴다. */
export function seaCondition(d: MarineDay): { label: string; tone: "good" | "ok" | "rough" } {
  const wave = d.waveMaxM ?? 0;
  const wind = d.windMaxMs ?? 0;
  if (wave >= 1.5 || wind >= 10) return { label: "거침 · 보트 운항 변경 가능", tone: "rough" };
  if (wave >= 0.8 || wind >= 7) return { label: "보통 · 수면 약간 거침", tone: "ok" };
  return { label: "잔잔", tone: "good" };
}

export function weatherEmoji(code: number | null): string {
  if (code == null) return "";
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67 || (code >= 80 && code <= 82)) return "🌧️";
  if (code >= 95) return "⛈️";
  return "🌥️";
}
