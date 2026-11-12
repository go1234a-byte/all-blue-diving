/* 일정 → 분 단위 타임라인 (여행 첫날 현지 0시 = 0분) */
(function (root) {
  const toMin = hhmm => {
    const [h, m] = String(hhmm || '09:00').split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const fmt = min => {
    const m = ((Math.floor(min) % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };

  function km(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  /* 걷기 1.5km 이하, 그 이상은 전철 (먼 곳일수록 빠른 열차) */
  function leg(a, b) {
    const d = km(a, b);
    if (d < 0.05) return { mode: 'none', min: 0, km: d };
    if (d <= 1.5) return { mode: 'walk', min: Math.round((d * 1.3) / 4.5 * 60) + 2, km: d };
    const v = d > 20 ? 60 : d > 5 ? 32 : 22;
    return { mode: 'train', min: Math.round(8 + (d * 1.25) / v * 60), km: d };
  }

  function build(trip) {
    const segs = [];
    const nDays = trip.nights + 1;
    const flight = trip.flightMin || 120;
    const arrive = toMin(trip.arriveTime || '11:00');
    const dayStart = toMin(trip.dayStart || '09:00');
    const home = trip.airport || trip.hotel;
    const push = s => { if (s.end > s.start) segs.push(s); };

    segs.push({ type: 'before', day: 0, start: -Infinity, end: arrive - flight, place: { name: '인천공항', lat: 37.4602, lng: 126.4407 } });
    push({ type: 'flight', day: 0, start: arrive - flight, end: arrive, from: { name: '인천공항', lat: 37.4602, lng: 126.4407 }, to: home });

    let t = arrive;
    let pos = home;
    if (trip.airport) {
      push({ type: 'arrive', day: 0, start: t, end: t + 40, place: trip.airport });
      t += 40;
    }

    for (let d = 0; d < nDays; d++) {
      if (d > 0) t = Math.max(t, d * 1440 + dayStart);
      const stops = (trip.days[d] || []).filter(s => isFinite(s.lat) && isFinite(s.lng));
      for (const stop of stops) {
        const l = leg(pos, stop);
        if (l.min > 0) {
          push({ type: 'move', mode: l.mode, km: l.km, day: d, start: t, end: t + l.min, from: pos, to: stop });
          t += l.min;
        }
        if (stop.at) {
          const target = d * 1440 + toMin(stop.at);
          if (target - t > 5) {
            push({ type: 'wander', day: d, start: t, end: target, place: stop, stopId: stop.id });
            t = target;
          }
        }
        if (stop.wait > 0) {
          push({ type: 'queue', day: d, start: t, end: t + stop.wait, place: stop, stopId: stop.id });
          t += stop.wait;
        }
        push({ type: 'activity', kind: stop.type, day: d, start: t, end: t + Math.max(10, stop.stay || 30), place: stop, stopId: stop.id });
        t += Math.max(10, stop.stay || 30);
        pos = stop;
      }

      const last = d === nDays - 1;
      if (last && trip.airport) {
        const l = leg(pos, trip.airport);
        push({ type: 'move', mode: l.mode === 'none' ? 'walk' : l.mode, km: l.km, day: d, start: t, end: t + Math.max(l.min, 1), from: pos, to: trip.airport });
        t += Math.max(l.min, 1);
        push({ type: 'depart', day: d, start: t, end: t + 90, place: trip.airport });
        t += 90;
        push({ type: 'flightHome', day: d, start: t, end: t + flight, from: trip.airport, to: { name: '인천공항', lat: 37.4602, lng: 126.4407 } });
        t += flight;
        segs.push({ type: 'done', day: d, start: t, end: Infinity, place: { name: '집', lat: 37.4602, lng: 126.4407 } });
      } else {
        const l = leg(pos, trip.hotel);
        if (l.min > 0) {
          push({ type: 'move', mode: l.mode, km: l.km, day: d, start: t, end: t + l.min, from: pos, to: trip.hotel });
          t += l.min;
        }
        pos = trip.hotel;
        if (last) {
          segs.push({ type: 'done', day: d, start: t, end: Infinity, place: trip.hotel });
        } else {
          let wake = (d + 1) * 1440 + dayStart;
          if (wake - t < 360) wake = t + 360;
          push({ type: 'sleep', day: d, start: t, end: wake, place: trip.hotel });
          t = wake;
        }
      }
    }
    segs.forEach((s, i) => (s.idx = i));
    return segs;
  }

  function find(segs, minute) {
    for (let i = segs.length - 1; i >= 0; i--) if (minute >= segs[i].start) return segs[i];
    return segs[0];
  }

  function progress(seg, minute) {
    if (!isFinite(seg.start) || !isFinite(seg.end)) return 0;
    return Math.min(1, Math.max(0, (minute - seg.start) / (seg.end - seg.start)));
  }

  function position(seg, minute) {
    if (seg.from && seg.to) {
      const p = progress(seg, minute);
      return { lat: seg.from.lat + (seg.to.lat - seg.from.lat) * p, lng: seg.from.lng + (seg.to.lng - seg.from.lng) * p };
    }
    return seg.place ? { lat: seg.place.lat, lng: seg.place.lng } : null;
  }

  const api = { build, find, progress, position, leg, km, toMin, fmt };
  root.Timeline = api;
})(typeof window !== 'undefined' ? window : globalThis);
