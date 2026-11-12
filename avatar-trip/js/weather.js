/* 날씨: Open-Meteo (API 키 필요 없음)
 * - 여행 날짜가 16일 안이면 실제 예보
 * - 이미 지난 날짜면 실제 관측 기록
 * - 더 먼 미래면 작년 같은 날짜의 실제 날씨를 참고값으로 사용
 * - 서버에 연결하지 못하면 위도·계절로 추정
 */
window.Weather = (() => {
  const DESC = [
    [[0], '맑음', '☀️', 'clear'],
    [[1, 2], '구름 조금', '🌤️', 'clear'],
    [[3], '흐림', '☁️', 'cloudy'],
    [[45, 48], '안개', '🌫️', 'fog'],
    [[51, 53, 55, 56, 57], '이슬비', '🌦️', 'drizzle'],
    [[61, 63, 65, 66, 67, 80, 81, 82], '비', '🌧️', 'rain'],
    [[71, 73, 75, 77, 85, 86], '눈', '🌨️', 'snow'],
    [[95, 96, 99], '뇌우', '⛈️', 'storm']
  ];

  function describe(code) {
    for (const [codes, label, icon, cat] of DESC) if (codes.includes(code)) return { label, icon, cat };
    return { label: '맑음', icon: '☀️', cat: 'clear' };
  }

  const addDays = (ymd, n) => {
    const d = new Date(ymd + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const diffDays = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  const todayIn = tz => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const shiftYear = (ymd, n) => (Number(ymd.slice(0, 4)) + n) + ymd.slice(4);

  async function getJSON(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function toHourly(data, yearShift) {
    const map = {};
    const h = data.hourly;
    for (let i = 0; i < h.time.length; i++) {
      const t = h.temperature_2m[i];
      if (t == null) continue;
      let key = h.time[i];
      if (yearShift) key = shiftYear(key.slice(0, 10), yearShift) + key.slice(10);
      map[key] = {
        temp: t,
        code: h.weather_code[i] ?? 0,
        pop: h.precipitation_probability ? h.precipitation_probability[i] : null,
        rain: h.precipitation ? h.precipitation[i] : null
      };
    }
    return map;
  }

  function estimate(trip, nDays) {
    const lat = Math.abs(trip.lat);
    const north = trip.lat >= 0;
    const mean = 30 - 0.4 * lat;
    const amp = 0.32 * lat;
    const map = {};
    for (let d = 0; d < nDays; d++) {
      const ymd = addDays(trip.startDate, d);
      const month = Number(ymd.slice(5, 7)) + Number(ymd.slice(8, 10)) / 31;
      const season = Math.cos(((month - 1.5) / 12) * 2 * Math.PI) * (north ? 1 : -1);
      const dayMean = mean - amp * season * 0.5;
      const seed = (Number(ymd.replace(/-/g, '')) * 9301 + 49297) % 233280 / 233280;
      const code = seed < 0.55 ? 1 : seed < 0.82 ? 3 : dayMean < 2 ? 71 : 61;
      for (let hr = 0; hr < 24; hr++) {
        const temp = dayMean + 4 * Math.sin(((hr - 9) / 24) * 2 * Math.PI);
        map[`${ymd}T${String(hr).padStart(2, '0')}:00`] = { temp: Math.round(temp * 10) / 10, code, pop: null, rain: null };
      }
    }
    return map;
  }

  async function load(trip) {
    const nDays = trip.nights + 1;
    const start = trip.startDate;
    const end = addDays(start, nDays - 1);
    const today = todayIn(trip.timezone);
    const fromToday = diffDays(today, start);
    const endFromToday = diffDays(today, end);
    const base = `latitude=${trip.lat}&longitude=${trip.lng}&timezone=${encodeURIComponent(trip.timezone)}`;

    try {
      if (endFromToday <= 15 && fromToday >= -60) {
        const data = await getJSON(`https://api.open-meteo.com/v1/forecast?${base}&start_date=${start}&end_date=${end}&hourly=temperature_2m,weather_code,precipitation_probability`);
        return { source: 'forecast', note: '실제 일기예보', hourly: toHourly(data, 0) };
      }
      if (endFromToday < -3) {
        const data = await getJSON(`https://archive-api.open-meteo.com/v1/archive?${base}&start_date=${start}&end_date=${end}&hourly=temperature_2m,weather_code,precipitation`);
        return { source: 'archive', note: '그날 실제 관측 기록', hourly: toHourly(data, 0) };
      }
      const data = await getJSON(`https://archive-api.open-meteo.com/v1/archive?${base}&start_date=${shiftYear(start, -1)}&end_date=${shiftYear(end, -1)}&hourly=temperature_2m,weather_code,precipitation`);
      return {
        source: 'lastyear',
        note: `예보는 16일 앞까지만 나와서, 작년 같은 날 실제 날씨를 보여줘요 (D-${fromToday})`,
        hourly: toHourly(data, 1)
      };
    } catch (err) {
      console.warn('weather load failed', err);
      return { source: 'estimate', note: '날씨 서버에 연결하지 못해 계절 평균으로 추정했어요', hourly: estimate(trip, nDays) };
    }
  }

  function at(wx, ymd, hour) {
    if (!wx) return null;
    const key = `${ymd}T${String(hour).padStart(2, '0')}:00`;
    return wx.hourly[key] || null;
  }

  function daily(wx, ymd) {
    let max = -99, min = 99, pop = null, rain = 0, worst = 0;
    const rank = c => (c >= 95 ? 7 : c >= 71 && c <= 86 && !(c >= 80 && c <= 82) ? 6 : c >= 61 ? 5 : c >= 51 ? 4 : c >= 45 ? 2 : c === 3 ? 3 : 1);
    let found = false;
    for (let h = 0; h < 24; h++) {
      const w = at(wx, ymd, h);
      if (!w) continue;
      found = true;
      max = Math.max(max, w.temp);
      min = Math.min(min, w.temp);
      if (w.pop != null) pop = Math.max(pop ?? 0, w.pop);
      if (w.rain != null) rain += w.rain;
      if (h >= 8 && h <= 21 && rank(w.code) > rank(worst)) worst = w.code;
    }
    if (!found) return null;
    return { max: Math.round(max), min: Math.round(min), pop, rain: Math.round(rain * 10) / 10, code: worst, ...describe(worst) };
  }

  return { load, at, daily, describe, addDays, diffDays, todayIn };
})();
