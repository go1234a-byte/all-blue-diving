/* 실제 길 경로
 * 걷기: FOSSGIS OSRM 도보 경로 (routing.openstreetmap.de, 키 필요 없음)
 * 전철: 출발-도착 직선 (역 사이 이동이라 가볍게 표시)
 * 비행기: 대권 항로 곡선
 * 받은 경로는 브라우저에 저장해서 다시 요청하지 않음
 */
window.Routes = (() => {
  const LS_KEY = 'dny.routes.v1';
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { cache = {}; }
  const pending = {};
  const save = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(cache)); } catch { /* 저장 불가 */ } };
  const r5 = n => Math.round(n * 1e5) / 1e5;
  const key = (a, b, mode) => `${mode}:${r5(a.lng)},${r5(a.lat)};${r5(b.lng)},${r5(b.lat)}`;

  function straight(a, b, n = 24) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push([a.lng + (b.lng - a.lng) * (i / n), a.lat + (b.lat - a.lat) * (i / n)]);
    return out;
  }

  function greatCircle(a, b, n = 80) {
    const rad = Math.PI / 180;
    const [φ1, λ1, φ2, λ2] = [a.lat * rad, a.lng * rad, b.lat * rad, b.lng * rad];
    const d = 2 * Math.asin(Math.sqrt(Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2));
    if (d === 0) return [[a.lng, a.lat], [b.lng, b.lat]];
    const out = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
      const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
      const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
      const z = A * Math.sin(φ1) + B * Math.sin(φ2);
      out.push([Math.atan2(y, x) / rad, Math.atan2(z, Math.sqrt(x * x + y * y)) / rad]);
    }
    return out;
  }

  function cached(a, b, mode) {
    if (mode === 'flight') return greatCircle(a, b);
    if (mode !== 'walk') return straight(a, b);
    return cache[key(a, b, mode)] || null;
  }

  async function get(a, b, mode) {
    const c = cached(a, b, mode);
    if (c) return c;
    const k = key(a, b, mode);
    if (pending[k]) return pending[k];
    pending[k] = (async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        const data = await res.json();
        const coords = data.routes?.[0]?.geometry?.coordinates;
        if (!coords || coords.length < 2) throw new Error('no route');
        const full = [[a.lng, a.lat], ...coords, [b.lng, b.lat]];
        cache[k] = full.map(([x, y]) => [r5(x), r5(y)]);
        save();
        return cache[k];
      } catch {
        return straight(a, b);
      } finally {
        delete pending[k];
      }
    })();
    return pending[k];
  }

  /* 경로 위 비율(0~1) 위치와 진행 방향 */
  const lens = new WeakMap();
  function meters(p, q) {
    const rad = Math.PI / 180;
    const x = (q[0] - p[0]) * rad * Math.cos(((p[1] + q[1]) / 2) * rad);
    const y = (q[1] - p[1]) * rad;
    return Math.sqrt(x * x + y * y) * 6371000;
  }
  function bearing(p, q) {
    const rad = Math.PI / 180;
    const y = Math.sin((q[0] - p[0]) * rad) * Math.cos(q[1] * rad);
    const x = Math.cos(p[1] * rad) * Math.sin(q[1] * rad) - Math.sin(p[1] * rad) * Math.cos(q[1] * rad) * Math.cos((q[0] - p[0]) * rad);
    return (Math.atan2(y, x) / rad + 360) % 360;
  }
  function along(coords, frac) {
    let cum = lens.get(coords);
    if (!cum) {
      cum = [0];
      for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + meters(coords[i - 1], coords[i]));
      lens.set(coords, cum);
    }
    const total = cum[cum.length - 1];
    const target = Math.max(0, Math.min(1, frac)) * total;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < target) i++;
    const seg = cum[i] - cum[i - 1] || 1;
    const k = (target - cum[i - 1]) / seg;
    const p = coords[i - 1], q = coords[i];
    return { lng: p[0] + (q[0] - p[0]) * k, lat: p[1] + (q[1] - p[1]) * k, bearing: bearing(p, q) };
  }

  /* 기준점에서 방향(도)·거리(m)만큼 떨어진 점 */
  function offset(pt, deg, m) {
    const rad = Math.PI / 180;
    return {
      lat: pt.lat + (m * Math.cos(deg * rad)) / 111320,
      lng: pt.lng + (m * Math.sin(deg * rad)) / (111320 * Math.cos(pt.lat * rad))
    };
  }

  return { get, cached, along, offset, bearing: (a, b) => bearing([a.lng, a.lat], [b.lng, b.lat]) };
})();
