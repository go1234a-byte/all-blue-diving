/* 다녀올게 — 아바타가 대신 다녀오는 여행 */
(() => {
  const { build, find, progress, position, leg, fmt, toMin } = window.Timeline;
  const W = window.Weather;
  const LS = { trip: 'dny.trip.v1', sim: 'dny.sim.v1', key: 'dny.gmapsKey' };
  const SPEEDS = [
    { v: 1, label: '실제 속도' },
    { v: 60, label: '1초 = 1분' },
    { v: 600, label: '1초 = 10분' },
    { v: 3600, label: '1초 = 1시간' }
  ];
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가 환경 */ } }
  };
  const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  const pick = (arr, key) => arr[hash(key) % arr.length];

  let trip, segs = [], wx = null;
  let sim = { minute: 0, speed: 600, paused: false, realtime: false, lastTs: Date.now(), started: false };
  let tab = 'plan';
  let activeDay = 0;
  let planMap = null, liveMap = null, mapsReady = false;
  let editing = null; // { day, id } 또는 { hotel: true }
  let pickMode = false;
  let mapDay = -1;
  let diaryCache = {};

  /* ---------------- 여행 데이터 ---------------- */
  function todayPlus(tz, n) { return W.addDays(W.todayIn(tz), n); }

  function fromPreset(key, keep = {}) {
    const p = JSON.parse(JSON.stringify(window.PRESETS[key]));
    return normalize({
      preset: key,
      city: p.city, country: p.country, lat: p.lat, lng: p.lng, timezone: p.timezone,
      nights: p.nights, airport: p.airport, hotel: p.hotel,
      days: p.days,
      startDate: keep.startDate || todayPlus(p.timezone, 7),
      avatarName: keep.avatarName || '나무',
      avatarColor: keep.avatarColor || window.AVATAR_COLORS[0],
      arriveTime: '11:00', dayStart: '09:00', flightMin: 120
    });
  }

  function normalize(t) {
    t.days = t.days || [];
    while (t.days.length < t.nights + 1) t.days.push([]);
    if (t.days.length > t.nights + 1) {
      const extra = t.days.splice(t.nights + 1).flat();
      t.days[t.nights].push(...extra);
    }
    t.days.forEach(d => d.forEach(s => { s.id = s.id || uid(); s.stay = Number(s.stay) || 30; s.wait = Number(s.wait) || 0; }));
    return t;
  }

  function saveTrip() { store.set(LS.trip, trip); }
  function saveSim() { sim.lastTs = Date.now(); store.set(LS.sim, sim); }

  function rebuild() {
    segs = build(trip);
    diaryCache = {};
    prefetchRoutes();
    saveTrip();
  }

  const dayYmd = d => W.addDays(trip.startDate, d);
  function dayLabel(d) {
    const ymd = dayYmd(d);
    const dt = new Date(ymd + 'T00:00:00Z');
    return `${Number(ymd.slice(5, 7))}월 ${Number(ymd.slice(8, 10))}일 (${WEEK[dt.getUTCDay()]})`;
  }
  const lengthLabel = n => `${n}박 ${n + 1}일`;

  function wxAt(minute) {
    if (!wx || !isFinite(minute)) return null;
    const d = Math.floor(minute / 1440);
    const hour = Math.floor((((minute % 1440) + 1440) % 1440) / 60);
    return W.at(wx, dayYmd(d), hour);
  }

  function nowMinute() {
    const tz = trip.timezone;
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(p => [p.type, p.value]));
    const days = W.diffDays(trip.startDate, W.todayIn(tz));
    return days * 1440 + Number(parts.hour) * 60 + Number(parts.minute) + Number(parts.second) / 60;
  }

  /* ---------------- 문구 ---------------- */
  function remark(w) {
    if (!w) return '';
    const d = W.describe(w.code);
    if (d.cat === 'storm') return '천둥까지 쳐서 좀 무서웠어.';
    if (d.cat === 'rain' || d.cat === 'drizzle') return '비가 와서 우산 쓰고 다녔어.';
    if (d.cat === 'snow') return '눈이 내려서 길이 하얘.';
    if (d.cat === 'fog') return '안개가 껴서 앞이 뿌옇게 보여.';
    if (w.temp >= 29) return `${Math.round(w.temp)}도라니, 너무 더워!`;
    if (w.temp <= 5) return `${Math.round(w.temp)}도… 손이 꽁꽁 얼었어.`;
    if (d.cat === 'clear') return '하늘이 맑아서 기분 좋아.';
    return '하늘은 좀 흐렸어.';
  }

  function placeName(seg) { return (seg.place || seg.to || {}).name || ''; }

  function status(seg, minute) {
    const p = progress(seg, minute);
    const left = isFinite(seg.end) ? Math.max(0, Math.ceil(seg.end - minute)) : 0;
    const name = placeName(seg);
    const nm = trip.avatarName || '아바타';
    switch (seg.type) {
      case 'before': {
        const d = Math.ceil((seg.end - minute) / 1440);
        return { title: `출발 준비 중`, line: d > 1 ? `여행까지 ${d}일 남았어. 짐 싸는 중!` : `${fmt(seg.end)} 인천에서 출발해요` };
      }
      case 'flight': return { title: `${trip.city}(으)로 날아가는 중`, line: `도착까지 ${left}분` };
      case 'arrive': return { title: `${name} 도착`, line: `입국 심사 받는 중 · ${left}분 남음` };
      case 'move': return {
        title: seg.mode === 'walk' ? `${name}까지 걸어가는 중` : `전철 타고 ${name}(으)로 가는 중`,
        line: `${seg.km.toFixed(1)}km · 도착까지 ${left}분`
      };
      case 'wander': return { title: `${name} 근처 자유 시간`, line: `${fmt(seg.end)}에 들어갈 예정이라 동네 구경 중` };
      case 'queue': {
        const n = Math.max(1, Math.round(seg.place.wait / 4));
        const ahead = Math.max(0, Math.ceil(n * (1 - p)) - 1);
        return { title: `${name} 앞에서 줄 서는 중`, line: ahead > 0 ? `앞에 ${ahead}명 · 예상 ${left}분` : `곧 들어가요!` };
      }
      case 'activity': {
        const verb = { food: '먹는 중', cafe: '커피 마시는 중', sight: '구경하는 중', shop: '쇼핑하는 중' }[seg.kind] || '즐기는 중';
        return { title: `${name}에서 ${verb}`, line: `${left}분 더 있을 거야` };
      }
      case 'sleep': {
        const next = segs[seg.idx + 1];
        return { title: `${nm}는 숙소에서 쉬는 중`, line: next ? `내일 ${fmt(next.start)}에 다시 출발` : '' };
      }
      case 'depart': return { title: `${name}에서 귀국편 기다리는 중`, line: `탑승까지 ${left}분` };
      case 'flightHome': return { title: '집으로 돌아가는 중', line: `도착까지 ${left}분` };
      case 'done': return { title: '여행 끝! 다녀왔어', line: '여행 일기에서 사진과 기록을 확인해 봐' };
      default: return { title: '', line: '' };
    }
  }

  function diaryText(seg) {
    const w = wxAt(seg.start + 1);
    const name = placeName(seg);
    const k = name + seg.idx;
    switch (seg.type) {
      case 'flight': return `${trip.city}행 비행기 탔어! 창밖 구름이 솜사탕 같아.`;
      case 'arrive': return `${name} 도착. 지금 ${trip.city}는 ${w ? Math.round(w.temp) + '°C, ' + W.describe(w.code).label : '날씨 확인 중'}. 입국 심사 줄 서는 중.`;
      case 'move': return `${name}까지 전철로 ${Math.round(seg.end - seg.start)}분. 창밖 구경하면서 가는 중. ${remark(w)}`;
      case 'wander': return `${name}에 ${fmt(seg.end)}에 들어가려고 근처를 ${Math.round(seg.end - seg.start)}분 동안 어슬렁거렸어. ${pick(['골목 구경이 재밌다.', '편의점에서 간식도 샀어.', '작은 신사를 하나 발견했어.'], k)}`;
      case 'queue': return `${name} 도착! 벌써 ${Math.max(1, Math.round(seg.place.wait / 4))}명이 줄 서 있었어. ${Math.round(seg.end - seg.start)}분 기다렸어. ${remark(w)}`;
      case 'activity': {
        const note = seg.place.note ? `${seg.place.note}, ` : '';
        if (seg.kind === 'food') return `${name}에서 먹었어. ${note}${pick(['진짜 맛있다…', '줄 설 만했어!', '다음에 꼭 같이 오자.', '한 그릇 더 먹고 싶었어.'], k)}`;
        if (seg.kind === 'cafe') return `${name}에서 커피 한 잔. ${remark(w)}`;
        if (seg.kind === 'shop') return `${name}에서 쇼핑. ${pick(['양손이 무거워졌어.', '기념품 잔뜩 샀어.', '구경만 하려다 결국 샀어.'], k)}`;
        return `${name} 구경! ${pick(['사진 엄청 찍었어.', '생각보다 훨씬 멋있어.', '사람이 많았지만 볼 만했어.'], k)} ${remark(w)}`;
      }
      case 'sleep': {
        const tomorrow = segs.find(s => s.day === seg.day + 1 && s.type === 'activity');
        return `오늘 하루 끝. ${fmt(seg.start)}에 숙소 도착.${tomorrow ? ` 내일은 ${placeName(tomorrow)}부터 가자!` : ''}`;
      }
      case 'depart': return `벌써 마지막 날… ${name}에서 귀국편 기다리는 중.`;
      case 'flightHome': return '집으로 출발! 다음엔 진짜로 같이 오자.';
      case 'done': return `${lengthLabel(trip.nights)} 여행 끝. 다녀왔어 :)`;
      default: return '';
    }
  }

  function sceneKind(seg) {
    if (seg.type === 'move') return seg.mode === 'walk' ? 'walk' : 'train';
    if (seg.type === 'activity') return seg.kind;
    return seg.type;
  }

  /* ---------------- 일정 화면 ---------------- */
  function renderSetup() {
    $('#preset').value = trip.preset || 'custom';
    $('#citySearchRow').hidden = trip.preset !== 'custom';
    $('#cityName').textContent = `${trip.city}${trip.country ? ', ' + trip.country : ''}`;
    $('#startDate').value = trip.startDate;
    $('#startDate').min = W.todayIn(trip.timezone);
    $('#tripLen').value = String(trip.nights);
    $('#avatarName').value = trip.avatarName || '';
    $('#hotelName').textContent = trip.hotel?.name || '숙소를 정해 주세요';
    $('#avatarColors').innerHTML = window.AVATAR_COLORS.map(c =>
      `<button type="button" class="swatch${c === trip.avatarColor ? ' on' : ''}" data-color="${c}" style="--c:${c}" aria-label="아바타 색 ${c}"></button>`).join('');
    drawAvatarPreview();
  }

  function drawAvatarPreview() {
    const cv = $('#avatarPreview');
    const dpr = window.devicePixelRatio || 1;
    cv.width = 72 * dpr; cv.height = 96 * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 72, 96);
    window.Scene.drawAvatar(ctx, 36, 92, 0.95, { color: trip.avatarColor, pose: 'stand', t: 0 });
  }

  function renderWeatherStrip() {
    const el = $('#weatherStrip');
    if (!wx) { el.innerHTML = '<p class="muted">날씨 불러오는 중…</p>'; return; }
    const days = Array.from({ length: trip.nights + 1 }, (_, d) => {
      const dd = W.daily(wx, dayYmd(d));
      if (!dd) return `<div class="wx-day"><span class="wx-date">${dayLabel(d)}</span><span class="muted">자료 없음</span></div>`;
      const wet = dd.pop != null ? `강수확률 ${dd.pop}%` : dd.rain > 0 ? `비 ${dd.rain}mm` : '비 없음';
      return `<div class="wx-day">
        <span class="wx-date">${d + 1}일차 · ${dayLabel(d)}</span>
        <span class="wx-icon" aria-hidden="true">${dd.icon}</span>
        <span class="wx-temp"><b>${dd.max}°</b> / ${dd.min}°</span>
        <span class="wx-desc">${dd.label} · ${wet}</span>
      </div>`;
    }).join('');
    el.innerHTML = `<div class="wx-days">${days}</div><p class="wx-note"><span class="tag tag-${wx.source}">${{ forecast: '예보', archive: '관측', lastyear: '작년 기록', estimate: '추정' }[wx.source]}</span> ${esc(wx.note)} · Open-Meteo</p>`;
  }

  function renderDays() {
    const city = trip.city;
    const html = trip.days.map((stops, d) => {
      const daySegs = segs.filter(s => s.day === d);
      const startPlace = d === 0 ? (trip.airport || trip.hotel) : trip.hotel;
      const dd = wx ? W.daily(wx, dayYmd(d)) : null;
      let prev = startPlace;
      const items = stops.map((s, i) => {
        const l = leg(prev, s);
        prev = s;
        const arriveSeg = daySegs.find(x => x.stopId === s.id);
        const t = arriveSeg ? fmt(arriveSeg.start) : '--:--';
        const legHtml = l.min > 0 ? `<li class="leg"><span>${l.mode === 'walk' ? '도보' : '전철'} 약 ${l.min}분 · ${l.km.toFixed(1)}km</span>
          <a href="${window.TripMap.gmapsDir(i === 0 ? startPlace : stops[i - 1], s, l.mode)}" target="_blank" rel="noopener">구글 길찾기</a></li>` : '';
        const ty = window.STOP_TYPES[s.type] || window.STOP_TYPES.sight;
        const meta = [`${s.stay}분 머무름`, s.wait ? `줄 ${s.wait}분` : '', s.at ? `${s.at} 입장` : ''].filter(Boolean).join(' · ');
        return `${legHtml}<li class="stop" data-day="${d}" data-id="${s.id}">
          <span class="stop-time">${t}</span>
          <span class="stop-ico" aria-hidden="true">${ty.icon}</span>
          <div class="stop-info"><b>${esc(s.name)}</b><small>${ty.label} · ${meta}${s.note ? ' · ' + esc(s.note) : ''}</small></div>
          <div class="stop-actions">
            <a class="gm" href="${window.TripMap.gmapsSearch(s.name, city)}" target="_blank" rel="noopener" title="구글 지도에서 보기">지도</a>
            <button type="button" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="위로">↑</button>
            <button type="button" data-act="down" ${i === stops.length - 1 ? 'disabled' : ''} aria-label="아래로">↓</button>
            <button type="button" data-act="edit">수정</button>
            <button type="button" data-act="del" aria-label="삭제">×</button>
          </div>
        </li>`;
      }).join('');
      const endSeg = daySegs.find(x => x.type === 'sleep' || x.type === 'depart' || x.type === 'done');
      const endLabel = endSeg ? (endSeg.type === 'depart' ? `${fmt(endSeg.start)} 공항 도착 → 귀국` : `${fmt(endSeg.start)} 숙소 도착`) : '';
      return `<section class="day card${d === activeDay ? ' active' : ''}" data-day="${d}">
        <header class="day-head">
          <button type="button" class="day-title" data-act="focus" data-day="${d}">
            <span class="day-num">${d + 1}일차</span> <span>${dayLabel(d)}</span>
          </button>
          ${dd ? `<span class="day-wx" title="${dd.label}">${dd.icon} ${dd.max}°/${dd.min}°</span>` : ''}
        </header>
        <ol class="stops">
          <li class="edge">${d === 0 && trip.airport ? `${fmt(toMin(trip.arriveTime))} ${esc(trip.airport.name)} 도착` : `${trip.dayStart} ${esc(trip.hotel.name)}에서 출발`}</li>
          ${items || '<li class="empty">아직 갈 곳이 없어요. 가고 싶은 가게나 장소를 추가해 보세요.</li>'}
          ${endLabel ? `<li class="edge">${endLabel}</li>` : ''}
        </ol>
        <button type="button" class="add-stop" data-act="add" data-day="${d}">+ 장소 추가</button>
      </section>`;
    }).join('');
    $('#days').innerHTML = html;
  }

  function renderPlan() {
    renderSetup();
    renderWeatherStrip();
    renderDays();
    updatePlanMap();
  }

  function dayPlaces(d) {
    const stops = trip.days[d] || [];
    const places = [{ ...trip.hotel, type: 'hotel', label: '숙' }];
    if (trip.airport && (d === 0 || d === trip.nights)) places.push({ ...trip.airport, type: 'airport', label: '✈' });
    stops.forEach((s, i) => places.push({ ...s, label: String(i + 1) }));
    return places;
  }

  function dayLines(d, withFlight) {
    return segs.filter(s => s.day === d && (s.type === 'move' || (withFlight && (s.type === 'flight' || s.type === 'flightHome')))).map(s => {
      const mode = s.type === 'move' ? s.mode : 'flight';
      return { mode, coords: window.Routes.cached(s.from, s.to, mode) || [[s.from.lng, s.from.lat], [s.to.lng, s.to.lat]] };
    });
  }

  let routeTimer = null;
  let prefetchRun = 0;
  function prefetchRoutes() {
    const run = ++prefetchRun;
    const walks = segs.filter(s => s.type === 'move' && s.mode === 'walk' && !window.Routes.cached(s.from, s.to, 'walk'));
    let i = 0;
    const next = () => {
      if (run !== prefetchRun || i >= walks.length) return;
      const s = walks[i++];
      window.Routes.get(s.from, s.to, 'walk').then(() => {
        clearTimeout(routeTimer);
        routeTimer = setTimeout(refreshRoutes, 300);
        setTimeout(next, 250);
      });
    };
    next();
  }

  function refreshRoutes() {
    if (!mapsReady) return;
    planMap.map.setRoutes(dayLines(activeDay, false));
    if (mapDay >= 0) liveMap.map.setRoutes(dayLines(mapDay, true));
  }

  function updatePlanMap() {
    if (!planMap || !mapsReady) return;
    const places = dayPlaces(activeDay);
    planMap.map.setPlaces(places);
    planMap.map.setRoutes(dayLines(activeDay, false));
    const near = places.filter(p => p.type !== 'airport');
    planMap.map.fit(near.length ? near : places);
  }

  /* ---------------- 장소 추가/수정 ---------------- */
  function openStopDialog(opts) {
    editing = opts;
    const dlg = $('#stopDialog');
    const s = opts.hotel ? { ...trip.hotel, type: 'hotel' } : opts.id ? trip.days[opts.day].find(x => x.id === opts.id) : opts.draft || { name: '', type: 'food', stay: 40, wait: 0 };
    $('#stopDialogTitle').textContent = opts.hotel ? '숙소 정하기' : opts.id ? '장소 수정' : `${opts.day + 1}일차에 장소 추가`;
    $('#stopName').value = s.name || '';
    $('#stopType').value = s.type === 'hotel' ? 'sight' : s.type || 'food';
    $('#stopStay').value = s.stay ?? 40;
    $('#stopWait').value = s.wait ?? 0;
    $('#stopAt').value = s.at || '';
    $('#stopNote').value = s.note || '';
    $('#stopCoords').dataset.lat = s.lat ?? '';
    $('#stopCoords').dataset.lng = s.lng ?? '';
    $('#stopCoords').textContent = isFinite(s.lat) && s.lat !== '' && s.lat != null ? `위치: ${Number(s.lat).toFixed(4)}, ${Number(s.lng).toFixed(4)}` : '위치를 검색하거나 지도에서 찍어 주세요';
    $('#stopResults').innerHTML = '';
    $$('.stop-only').forEach(el => (el.hidden = !!opts.hotel));
    $('#stopError').textContent = '';
    if (!dlg.open) dlg.showModal();
    $('#stopName').focus();
  }

  function readStopForm() {
    const lat = parseFloat($('#stopCoords').dataset.lat);
    const lng = parseFloat($('#stopCoords').dataset.lng);
    return {
      name: $('#stopName').value.trim(),
      type: $('#stopType').value,
      stay: Math.max(10, Number($('#stopStay').value) || 30),
      wait: Math.max(0, Number($('#stopWait').value) || 0),
      at: $('#stopAt').value || '',
      note: $('#stopNote').value.trim(),
      lat, lng
    };
  }

  function saveStop() {
    const f = readStopForm();
    if (!f.name) { $('#stopError').textContent = '장소 이름을 적어 주세요.'; return; }
    if (!isFinite(f.lat) || !isFinite(f.lng)) { $('#stopError').textContent = '위치가 없어요. 검색 결과를 고르거나 지도에서 찍어 주세요.'; return; }
    if (editing.hotel) {
      trip.hotel = { name: f.name, lat: f.lat, lng: f.lng };
    } else if (editing.id) {
      const s = trip.days[editing.day].find(x => x.id === editing.id);
      Object.assign(s, f);
      if (!f.at) delete s.at;
    } else {
      const s = { id: uid(), ...f };
      if (!f.at) delete s.at;
      trip.days[editing.day].push(s);
    }
    $('#stopDialog').close();
    rebuild();
    renderPlan();
    toast(editing.hotel ? '숙소를 바꿨어요' : '일정에 넣었어요');
  }

  async function searchPlace() {
    const q = $('#stopName').value.trim();
    const out = $('#stopResults');
    if (!q) { out.innerHTML = '<li class="muted">검색할 이름을 적어 주세요.</li>'; return; }
    out.innerHTML = '<li class="muted">찾는 중…</li>';
    const vb = [trip.lng - 0.6, trip.lat + 0.6, trip.lng + 0.6, trip.lat - 0.6].join(',');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=ko&viewbox=${vb}&q=${encodeURIComponent(q)}`);
      const list = await res.json();
      if (!list.length) {
        out.innerHTML = `<li class="muted">못 찾았어요. 영어나 일본어 이름으로 다시 찾거나, <a href="${window.TripMap.gmapsSearch(q, trip.city)}" target="_blank" rel="noopener">구글 지도에서 확인</a>한 뒤 지도에서 위치를 찍어 주세요.</li>`;
        return;
      }
      out.innerHTML = list.map((r, i) => `<li><button type="button" data-i="${i}"><b>${esc(r.name || r.display_name.split(',')[0])}</b><small>${esc(r.display_name)}</small></button></li>`).join('');
      out.onclick = e => {
        const b = e.target.closest('button[data-i]');
        if (!b) return;
        const r = list[Number(b.dataset.i)];
        $('#stopCoords').dataset.lat = r.lat;
        $('#stopCoords').dataset.lng = r.lon;
        $('#stopCoords').textContent = `위치: ${Number(r.lat).toFixed(4)}, ${Number(r.lon).toFixed(4)}`;
        if (r.name) $('#stopName').value = r.name;
        const cat = `${r.category}:${r.type}`;
        if (/restaurant|fast_food|food_court|bar|pub/.test(cat)) $('#stopType').value = 'food';
        else if (/cafe/.test(cat)) $('#stopType').value = 'cafe';
        else if (/^shop/.test(cat)) $('#stopType').value = 'shop';
        else if (/tourism|historic|leisure/.test(cat)) $('#stopType').value = 'sight';
        out.innerHTML = '';
      };
    } catch {
      out.innerHTML = '<li class="muted">검색 서버에 연결하지 못했어요. 지도에서 위치를 직접 찍어 주세요.</li>';
    }
  }

  function startPick() {
    const draft = readStopForm();
    const prev = editing;
    $('#stopDialog').close();
    pickMode = { prev, draft };
    $('#pickBanner').hidden = false;
    if (tab !== 'plan') switchTab('plan');
  }

  function onPlanMapClick(pos) {
    if (!pickMode) return;
    const { prev, draft } = pickMode;
    pickMode = false;
    $('#pickBanner').hidden = true;
    const d = { ...draft, lat: pos.lat, lng: pos.lng };
    if (prev.hotel) {
      openStopDialog({ hotel: true });
    } else if (prev.id) {
      openStopDialog({ day: prev.day, id: prev.id });
    } else {
      openStopDialog({ day: prev.day, draft: d });
    }
    $('#stopName').value = d.name;
    $('#stopType').value = d.type;
    $('#stopStay').value = d.stay;
    $('#stopWait').value = d.wait;
    $('#stopAt').value = d.at;
    $('#stopNote').value = d.note;
    $('#stopCoords').dataset.lat = pos.lat;
    $('#stopCoords').dataset.lng = pos.lng;
    $('#stopCoords').textContent = `위치: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)} (지도에서 찍음)`;
  }

  async function searchCity() {
    const q = $('#citySearch').value.trim();
    const out = $('#cityResults');
    if (!q) return;
    out.innerHTML = '<li class="muted">찾는 중…</li>';
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=ko`);
      const data = await res.json();
      const list = data.results || [];
      if (!list.length) { out.innerHTML = '<li class="muted">도시를 못 찾았어요. 영어 이름으로도 찾아 보세요.</li>'; return; }
      out.innerHTML = list.map((r, i) => `<li><button type="button" data-i="${i}"><b>${esc(r.name)}</b><small>${esc([r.admin1, r.country].filter(Boolean).join(', '))}</small></button></li>`).join('');
      out.onclick = e => {
        const b = e.target.closest('button[data-i]');
        if (!b) return;
        const r = list[Number(b.dataset.i)];
        trip = normalize({
          preset: 'custom', city: r.name, country: r.country || '', lat: r.latitude, lng: r.longitude, timezone: r.timezone || 'UTC',
          nights: trip.nights, airport: null,
          hotel: { name: `${r.name} 시내 숙소`, lat: r.latitude, lng: r.longitude },
          days: [], startDate: trip.startDate, avatarName: trip.avatarName, avatarColor: trip.avatarColor,
          arriveTime: '11:00', dayStart: '09:00', flightMin: 150
        });
        out.innerHTML = '';
        $('#citySearch').value = '';
        afterTripChange(true);
        toast(`${r.name}(으)로 정했어요. 숙소 위치를 먼저 정해 주세요.`);
      };
    } catch {
      out.innerHTML = '<li class="muted">도시 검색 서버에 연결하지 못했어요.</li>';
    }
  }

  async function afterTripChange(reloadWeather) {
    activeDay = Math.min(activeDay, trip.nights);
    rebuild();
    renderPlan();
    if (reloadWeather) {
      wx = null;
      renderWeatherStrip();
      wx = await W.load(trip);
      renderPlan();
    }
    mapDay = -1;
  }

  /* ---------------- 대신 여행 화면 ---------------- */
  const canvas = $('#scene');
  const ctx = canvas.getContext('2d');
  const wxCanvas = $('#wxOverlay');
  const wxCtx = wxCanvas.getContext('2d');
  let cw = 0, ch = 0, ow = 0, oh = 0;

  function sizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r2 = wxCanvas.getBoundingClientRect();
    ow = r2.width; oh = r2.height;
    wxCanvas.width = Math.round(ow);
    wxCanvas.height = Math.round(oh);
  }

  function firstMinute() { return segs[1] ? segs[1].start : 0; }
  function lastMinute() { const d = segs.find(s => s.type === 'done'); return d ? d.start + 30 : 1e9; }

  function startTrip() {
    sim = { minute: firstMinute(), speed: 60, paused: false, realtime: false, lastTs: Date.now(), started: true };
    saveSim();
    setFollow(true);
    switchTab('live');
    toast(`${trip.avatarName || '아바타'} 출발! 인천공항에서 비행기 타는 중`);
  }

  function stepSim(dtSec) {
    if (sim.realtime) {
      sim.minute = nowMinute();
    } else if (!sim.paused) {
      sim.minute += (dtSec * sim.speed) / 60;
      const end = lastMinute();
      if (sim.minute >= end) { sim.minute = end; sim.paused = true; }
    }
  }

  function sceneState(seg, minute, t) {
    const hour = (((minute % 1440) + 1440) % 1440) / 60;
    return {
      kind: sceneKind(seg),
      hour,
      wx: wxAt(minute) || { code: 1, temp: 15 },
      p: progress(seg, minute),
      t,
      color: trip.avatarColor,
      place: placeName(seg),
      queue: seg.place?.wait ? Math.max(1, Math.round(seg.place.wait / 4)) : 0
    };
  }

  /* 아바타 위치: 이동 중이면 실제 길 위, 줄 설 때는 가게 앞 줄 끝 */
  const QUEUE_GAP = 3.2; // m
  function prevPointOf(seg) {
    for (let i = seg.idx - 1; i >= 0; i--) if (segs[i].from) return segs[i].from;
    return null;
  }
  function queueDir(seg) {
    const prev = prevPointOf(seg);
    return prev ? window.Routes.bearing(seg.place, prev) : 200;
  }
  function queueAhead(seg, minute) {
    const n = Math.max(1, Math.round(seg.place.wait / 4));
    return Math.max(0, Math.ceil(n * (1 - progress(seg, minute))) - 1);
  }
  function avatarPos(seg, minute) {
    const p = progress(seg, minute);
    if (seg.from && seg.to) {
      const mode = seg.type === 'move' ? seg.mode : 'flight';
      const coords = window.Routes.cached(seg.from, seg.to, mode) || [[seg.from.lng, seg.from.lat], [seg.to.lng, seg.to.lat]];
      return window.Routes.along(coords, p);
    }
    const pl = seg.place;
    if (!pl) return null;
    if (seg.type === 'queue') {
      const dir = queueDir(seg);
      const o = window.Routes.offset(pl, dir, QUEUE_GAP * (queueAhead(seg, minute) + 1));
      return { ...o, bearing: (dir + 180) % 360 };
    }
    if (seg.type === 'wander') {
      const ang = (minute * 4) % 360;
      const o = window.Routes.offset(pl, ang, 45);
      return { ...o, bearing: (ang + 90) % 360 };
    }
    // 핀을 가리지 않게 장소 바로 옆(약 9m)에 서 있기
    return { ...window.Routes.offset(pl, 120, 9), bearing: null };
  }

  /* 아바타 마커 */
  let avatar = null;
  let crowd = { key: '', items: [] };
  let follow = true, camKind = '', camUntil = 0, camBearing = 0, lastSky = 0;

  function makeAvatar() {
    const el = document.createElement('div');
    el.className = 'avatar-mk';
    el.style.zIndex = '10';
    el.innerHTML = '<div class="avatar-bubble"></div><canvas width="192" height="300"></canvas><span class="avatar-shadow"></span>';
    const cv = el.querySelector('canvas');
    return { el, cv, c: cv.getContext('2d'), bubble: el.querySelector('.avatar-bubble'), marker: null };
  }

  function drawSprite(seg, st, screenHeading) {
    const c = avatar.c;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, 192, 300);
    c.setTransform(3, 0, 0, 3, 0, 0);
    const kind = st.kind;
    const base = { color: st.color, t: st.t, scarf: (st.wx?.temp ?? 15) <= 7 };
    const cat = W.describe(st.wx?.code ?? 0).cat;
    const wet = ['rain', 'drizzle', 'storm', 'snow'].includes(cat);
    const umb = wet ? (cat === 'snow' ? '#e0533d' : '#2d6cdf') : false;
    if (kind === 'flight' || kind === 'flightHome') {
      c.save();
      c.translate(32, 62);
      c.rotate((screenHeading * Math.PI) / 180);
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#2b3a55';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(0, -24); c.quadraticCurveTo(4, -18, 4, -6); c.lineTo(22, 4); c.lineTo(22, 9); c.lineTo(4, 4); c.lineTo(3, 16); c.lineTo(9, 21); c.lineTo(9, 24); c.lineTo(0, 21);
      c.lineTo(-9, 24); c.lineTo(-9, 21); c.lineTo(-3, 16); c.lineTo(-4, 4); c.lineTo(-22, 9); c.lineTo(-22, 4); c.lineTo(-4, -6); c.quadraticCurveTo(-4, -18, 0, -24);
      c.fill(); c.stroke();
      c.fillStyle = st.color;
      c.fillRect(-2, -6, 4, 18);
      c.restore();
      return;
    }
    if (kind === 'train') {
      c.fillStyle = '#e9edf2';
      c.strokeStyle = '#2b3a55'; c.lineWidth = 1.5;
      c.beginPath(); c.roundRect(4, 46, 56, 34, 8); c.fill(); c.stroke();
      c.fillStyle = st.color; c.fillRect(4, 70, 56, 5);
      c.fillStyle = '#9ec5ea';
      for (let i = 0; i < 3; i++) { c.beginPath(); c.roundRect(8 + i * 17, 52, 14, 13, 3); c.fill(); }
      c.save();
      c.beginPath(); c.rect(25, 52, 14, 13); c.clip();
      window.Scene.drawAvatar(c, 32, 92, 0.38, { ...base, pose: 'stand' });
      c.restore();
      c.fillStyle = '#2b3a55';
      c.beginPath(); c.arc(16, 82, 3, 0, Math.PI * 2); c.arc(48, 82, 3, 0, Math.PI * 2); c.fill();
      return;
    }
    const flip = Math.sin((screenHeading * Math.PI) / 180) < -0.2;
    c.save();
    if (flip) { c.translate(64, 0); c.scale(-1, 1); }
    const o = { ...base, pose: 'stand' };
    if (kind === 'walk' || kind === 'wander' || kind === 'shop') {
      o.pose = 'walk';
      o.phase = st.t / (kind === 'walk' ? 140 : 260);
      o.umbrella = umb;
      if (kind === 'shop') o.bags = 1 + Math.floor(st.p * 3);
    } else if (kind === 'queue') {
      o.umbrella = umb;
    } else if (kind === 'food') {
      o.pose = 'eat'; o.phase = st.t / 380;
    } else if (kind === 'sight') {
      if (st.t % 4000 > 2200) o.pose = 'camera';
      else o.umbrella = umb;
    } else if (kind === 'arrive' || kind === 'depart' || kind === 'before') {
      o.suitcase = true;
    } else if (kind === 'sleep' || kind === 'done') {
      o.sleep = true;
    }
    window.Scene.drawAvatar(c, 30, 96, 0.6, o);
    c.restore();
    if (kind === 'sleep' || kind === 'done') {
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#2b3a55'; c.lineWidth = 0.8;
      c.font = '700 11px sans-serif';
      const k = (st.t / 1500) % 1;
      c.globalAlpha = 1 - k;
      c.strokeText('Z', 44 + k * 8, 40 - k * 16); c.fillText('Z', 44 + k * 8, 40 - k * 16);
      c.globalAlpha = 1;
    }
  }

  function personEl(seed) {
    const el = document.createElement('div');
    el.className = 'person-mk';
    const cv = document.createElement('canvas');
    cv.width = 120; cv.height = 210;
    const c = cv.getContext('2d');
    c.scale(3, 3);
    const colors = ['#6b7a99', '#b4675a', '#4f8a72', '#c79a3f', '#7f5fa8', '#3e4a5c', '#9b6b52', '#5a7fa8'];
    window.Scene.drawPerson(c, 20, 68, 0.5, colors[seed % colors.length], 100 + seed, 0);
    el.appendChild(cv);
    return el;
  }

  function updateCrowd(seg, minute) {
    const want = seg.type === 'queue' ? Math.min(10, queueAhead(seg, minute)) : 0;
    const key = seg.type === 'queue' ? `${seg.idx}:${want}` : '';
    if (crowd.key === key) return;
    crowd.items.forEach(i => i.remove());
    crowd = { key, items: [] };
    if (!want || !liveMap) return;
    const dir = queueDir(seg);
    for (let i = 0; i < want; i++) {
      const pos = window.Routes.offset(seg.place, dir, QUEUE_GAP * (i + 1));
      crowd.items.push(liveMap.map.addMarker(personEl(i), pos));
    }
  }

  function cameraFor(kind) {
    switch (kind) {
      case 'walk': return { zoom: 18.2, pitch: 62, orbit: 0 };
      case 'wander': return { zoom: 17.6, pitch: 60, orbit: 0 };
      case 'shop': return { zoom: 18, pitch: 62, orbit: 3 };
      case 'queue': return { zoom: 19, pitch: 66, orbit: 2.5 };
      case 'food': case 'cafe': case 'sight': return { zoom: 18.4, pitch: 64, orbit: 4 };
      case 'train': return { zoom: 14.8, pitch: 50, orbit: 0 };
      case 'flight': case 'flightHome': return { zoom: 5.4, pitch: 20, orbit: 0 };
      case 'arrive': case 'depart': return { zoom: 16, pitch: 55, orbit: 3 };
      default: return { zoom: 16.8, pitch: 55, orbit: 1.5 };
    }
  }

  function updateMap(seg, minute, now, dt, st) {
    if (!liveMap || !mapsReady) return;
    const day = Math.max(0, Math.min(trip.nights, Math.floor(minute / 1440)));
    if (day !== mapDay) {
      mapDay = day;
      liveMap.map.setPlaces(dayPlaces(day));
      liveMap.map.setRoutes(dayLines(day, true));
    }
    const pos = avatarPos(seg, minute);
    if (!pos) return;
    if (!avatar) {
      avatar = makeAvatar();
      avatar.marker = liveMap.map.addMarker(avatar.el, pos);
    }
    avatar.marker.set(pos);
    const mapBearing = liveMap.map.getBearing();
    const heading = pos.bearing != null ? pos.bearing - mapBearing : 90;
    drawSprite(seg, st, heading);
    updateCrowd(seg, minute);

    if (!follow) return;
    const kind = st.kind;
    const cam = cameraFor(kind);
    if (kind !== camKind) {
      camKind = kind;
      camBearing = pos.bearing != null && cam.orbit === 0 ? pos.bearing : mapBearing;
      liveMap.map.camera({ center: pos, zoom: cam.zoom, pitch: cam.pitch, bearing: camBearing }, 1400);
      camUntil = now + 1500;
      return;
    }
    if (now < camUntil) return;
    if (cam.orbit) camBearing = (camBearing + cam.orbit * dt) % 360;
    else if (pos.bearing != null) {
      const diff = ((pos.bearing - camBearing + 540) % 360) - 180;
      camBearing = (camBearing + diff * Math.min(1, dt * 1.5) + 360) % 360;
    }
    liveMap.map.camera({ center: pos, bearing: camBearing });
  }

  function setFollow(on) {
    follow = on;
    $('#followBtn').hidden = on;
    if (on) camKind = '';
  }

  let lastDom = 0;
  function renderLiveDom(seg, now) {
    const m = sim.minute;
    const day = Math.floor(m / 1440);
    const inTrip = day >= 0 && day <= trip.nights;
    const w = wxAt(m);
    $('#hudDay').textContent = inTrip ? `${day + 1}일차 · ${dayLabel(day)}` : day < 0 ? '출발 전' : '여행 후';
    $('#hudTime').textContent = `현지 ${fmt(m)}`;
    if (w) {
      const d = W.describe(w.code);
      $('#hudWx').textContent = `${d.icon} ${Math.round(w.temp)}° ${d.label}${w.pop != null ? ` · 비 ${w.pop}%` : ''}`;
    } else {
      $('#hudWx').textContent = '날씨 정보 없음';
    }
    const st = status(seg, m);
    $('#statusTitle').textContent = st.title;
    $('#statusLine').textContent = st.line;
    $('#wxSourceLive').textContent = wx ? `날씨: ${wx.note}` : '';

    // 링크
    const pos = position(seg, m);
    const links = [];
    if (seg.type === 'move') {
      links.push(`<a href="${window.TripMap.gmapsDir(seg.from, seg.to, seg.mode)}" target="_blank" rel="noopener">이 길 구글 지도로 보기</a>`);
    }
    const pl = seg.place || seg.to;
    if (pl && seg.type !== 'before' && seg.type !== 'done' && seg.type !== 'flight' && seg.type !== 'flightHome') {
      links.push(`<a href="${window.TripMap.gmapsSearch(pl.name, trip.city)}" target="_blank" rel="noopener">${esc(pl.name)} 구글 지도</a>`);
      links.push(`<a href="${window.TripMap.streetView(pos || pl)}" target="_blank" rel="noopener">스트리트 뷰로 둘러보기</a>`);
    }
    $('#nowLinks').innerHTML = links.join('');

    // 컨트롤
    $$('[data-speed]').forEach(b => b.classList.toggle('on', !sim.realtime && Number(b.dataset.speed) === sim.speed));
    $('#pauseBtn').textContent = sim.paused ? '계속' : '멈춤';
    $('#pauseBtn').disabled = sim.realtime;
    $('#realtimeBtn').classList.toggle('on', sim.realtime);
    $('#realtimeBtn').setAttribute('aria-pressed', String(sim.realtime));

    renderDayBar(day, m);
    renderToday(day, seg);

    // 말풍선
    if (avatar) {
      let txt = st.title;
      if (seg.type === 'queue') txt = st.line.startsWith('앞에') ? `줄 서는 중 · ${st.line.split(' · ')[0]}` : '곧 들어가요!';
      else if (seg.type === 'activity') txt = { food: '🍜 냠냠 먹는 중', cafe: '☕ 커피 한 잔', sight: '📷 구경 중', shop: '🛍️ 쇼핑 중' }[seg.kind] || st.title;
      else if (seg.type === 'move') txt = seg.mode === 'walk' ? `🚶 ${placeName(seg)}까지 ${Math.max(0, Math.ceil(seg.end - m))}분` : `🚃 ${placeName(seg)}행`;
      else if (seg.type === 'sleep') txt = '💤 숙소에서 쉬는 중';
      else if (seg.type === 'wander') txt = '👀 동네 구경 중';
      avatar.bubble.textContent = txt;
    }
    if (mapsReady && now - lastSky > 5000) {
      lastSky = now;
      const [top, hor] = window.Scene.sky(sceneState(seg, m, 0));
      liveMap.map.setSky(top, hor);
    }
  }

  const SEG_COLORS = { move: 'var(--c-move)', queue: 'var(--stamp)', activity: 'var(--accent)', wander: 'var(--c-wander)', sleep: 'var(--c-sleep)', arrive: 'var(--c-air)', depart: 'var(--c-air)', flight: 'var(--c-air)', flightHome: 'var(--c-air)' };
  function renderDayBar(day, m) {
    const bar = $('#dayBar');
    const d = Math.max(0, Math.min(trip.nights, day));
    const from = d * 1440 + 360, to = d * 1440 + 1440;
    const key = `${d}|${segs.length}|${trip.startDate}`;
    if (bar.dataset.key !== key) {
      bar.dataset.key = key;
      bar.dataset.from = from;
      bar.innerHTML = segs.filter(s => s.end > from && s.start < to && isFinite(s.start)).map(s => {
        const a = Math.max(s.start, from), b = Math.min(isFinite(s.end) ? s.end : to, to);
        return `<span class="blk" style="left:${((a - from) / 1080) * 100}%;width:${((b - a) / 1080) * 100}%;background:${SEG_COLORS[s.type] || 'var(--line)'}" title="${fmt(s.start)} ${esc(status(s, s.start).title)}"></span>`;
      }).join('') + '<span class="now" id="dayNow"></span>' +
        ['06', '09', '12', '15', '18', '21', '24'].map((h, i) => `<span class="tick" style="left:${(i * 3 / 18) * 100}%">${h}</span>`).join('');
    }
    const pct = Math.max(0, Math.min(1, (m - from) / 1080)) * 100;
    $('#dayNow').style.left = pct + '%';
  }

  function renderToday(day, seg) {
    const d = Math.max(0, Math.min(trip.nights, day));
    const key = `${d}|${seg.idx}`;
    const el = $('#todayList');
    if (el.dataset.key === key) return;
    el.dataset.key = key;
    $('#todayTitle').textContent = `${d + 1}일차 일정`;
    el.innerHTML = (trip.days[d] || []).map(s => {
      const ss = segs.filter(x => x.stopId === s.id);
      const first = ss[0], last = ss[ss.length - 1];
      let state = 'next';
      if (first && sim.minute >= last.end) state = 'done';
      else if (first && sim.minute >= first.start) state = 'now';
      const ty = window.STOP_TYPES[s.type] || window.STOP_TYPES.sight;
      return `<li class="${state}"><span class="t">${first ? fmt(first.start) : ''}</span><span aria-hidden="true">${ty.icon}</span><span class="n">${esc(s.name)}</span><span class="s">${{ done: '다녀옴', now: '지금 여기', next: '' }[state]}</span></li>`;
    }).join('') || '<li class="muted">이 날은 일정이 비어 있어요</li>';
  }

  let lastFrame = performance.now();
  function loop(now) {
    const dt = Math.min(1, (now - lastFrame) / 1000);
    lastFrame = now;
    if (tab === 'live') {
      stepSim(dt);
      const seg = find(segs, sim.minute);
      const st = sceneState(seg, sim.minute, now);
      if (cw > 0 && !$('#insetBox').hidden) window.Scene.render(ctx, cw, ch, st);
      if (ow > 0) window.Scene.overlay(wxCtx, ow, oh, st);
      updateMap(seg, sim.minute, now, dt, st);
      if (now - lastDom > 250) {
        lastDom = now;
        renderLiveDom(seg, now);
      }
    }
    requestAnimationFrame(loop);
  }

  setInterval(() => { if (sim.started) saveSim(); }, 2000);

  /* ---------------- 여행 일기 ---------------- */
  const DIARY_TYPES = new Set(['flight', 'arrive', 'wander', 'queue', 'activity', 'sleep', 'depart', 'flightHome', 'done']);
  function renderDiary() {
    const el = $('#diary');
    const passed = segs.filter(s => isFinite(s.start) && s.start <= sim.minute && (DIARY_TYPES.has(s.type) || (s.type === 'move' && s.mode === 'train' && s.end - s.start >= 40)));
    if (!sim.started || !passed.length) {
      el.innerHTML = `<div class="card empty-diary"><h2>아직 일기가 없어요</h2><p>일정을 짜고 아바타를 출발시키면, 아바타가 들른 곳마다 사진과 일기를 남겨요.</p><button type="button" class="primary" data-go="plan">일정 짜러 가기</button></div>`;
      return;
    }
    const byDay = {};
    passed.forEach(s => (byDay[s.day] = byDay[s.day] || []).push(s));
    el.innerHTML = Object.keys(byDay).map(d => `
      <section class="diary-day">
        <h2><span class="day-num">${Number(d) + 1}일차</span> ${dayLabel(Number(d))}</h2>
        <ol>${byDay[d].map(s => {
          const w = wxAt(s.start + 1);
          const wd = w ? W.describe(w.code) : null;
          return `<li class="entry">
            <canvas class="photo" data-idx="${s.idx}" width="320" height="180" aria-label="${esc(placeName(s))} 사진"></canvas>
            <div class="entry-body">
              <p class="entry-meta"><span class="mono">${fmt(s.start)}</span>${wd ? ` · ${wd.icon} ${Math.round(w.temp)}°` : ''}${s.place && s.type !== 'sleep' ? ` · <a href="${window.TripMap.gmapsSearch(s.place.name, trip.city)}" target="_blank" rel="noopener">${esc(s.place.name)}</a>` : ''}</p>
              <p>${esc(diaryText(s))}</p>
            </div>
          </li>`;
        }).join('')}</ol>
      </section>`).reverse().join('');
    // 사진 그리기
    $$('#diary canvas.photo').forEach(cv => {
      const s = segs[Number(cv.dataset.idx)];
      const c = cv.getContext('2d');
      const mid = s.type === 'done' ? s.start : s.start + (Math.min(s.end, sim.minute) - s.start) * 0.5;
      window.Scene.render(c, 320, 180, sceneState(s, mid, 1800 + s.idx * 997));
    });
  }

  /* ---------------- 탭, 토스트 ---------------- */
  function switchTab(next) {
    tab = next;
    $$('.tab').forEach(b => { const on = b.dataset.tab === next; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    $$('.panel').forEach(p => (p.hidden = p.id !== 'panel-' + next));
    if (next === 'live') {
      if (!sim.started) {
        sim.minute = firstMinute();
        sim.started = true;
      }
      requestAnimationFrame(() => { sizeCanvas(); liveMap?.map.resize(); mapDay = -1; camKind = ''; $('#todayList').dataset.key = ''; });
    }
    if (next === 'plan') requestAnimationFrame(() => { planMap?.map.resize(); updatePlanMap(); });
    if (next === 'diary') renderDiary();
    try { history.replaceState(null, '', '#' + next); } catch { /* file:// 등 */ }
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 3200);
  }

  /* ---------------- 이벤트 ---------------- */
  function bind() {
    $$('.tab').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
    document.addEventListener('click', e => {
      const go = e.target.closest('[data-go]');
      if (go) switchTab(go.dataset.go);
    });

    $('#preset').addEventListener('change', e => {
      const v = e.target.value;
      if (v === 'custom') {
        trip.preset = 'custom';
        $('#citySearchRow').hidden = false;
        $('#citySearch').focus();
        return;
      }
      if (!confirm(`'${window.PRESETS[v].label}' 일정으로 바꿀까요? 지금 일정은 사라져요.`)) { e.target.value = trip.preset; return; }
      trip = fromPreset(v, trip);
      activeDay = 0;
      afterTripChange(true);
    });
    $('#citySearchBtn').addEventListener('click', searchCity);
    $('#citySearch').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); searchCity(); } });

    $('#startDate').addEventListener('change', e => {
      if (!e.target.value) return;
      trip.startDate = e.target.value;
      sim.started = false;
      afterTripChange(true);
    });
    $('#tripLen').addEventListener('change', e => {
      trip.nights = Number(e.target.value);
      normalize(trip);
      afterTripChange(true);
    });
    $('#avatarName').addEventListener('input', e => { trip.avatarName = e.target.value.trim(); saveTrip(); });
    $('#avatarColors').addEventListener('click', e => {
      const b = e.target.closest('[data-color]');
      if (!b) return;
      trip.avatarColor = b.dataset.color;
      saveTrip();
      renderSetup();
    });
    $('#hotelBtn').addEventListener('click', () => openStopDialog({ hotel: true }));

    $('#days').addEventListener('click', e => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'add') { activeDay = Number(b.dataset.day); openStopDialog({ day: activeDay }); return; }
      if (act === 'focus') { activeDay = Number(b.dataset.day); renderDays(); updatePlanMap(); return; }
      const li = b.closest('.stop');
      const d = Number(li.dataset.day), id = li.dataset.id;
      const list = trip.days[d];
      const i = list.findIndex(s => s.id === id);
      if (act === 'edit') { activeDay = d; openStopDialog({ day: d, id }); return; }
      if (act === 'del') { list.splice(i, 1); toast('일정에서 뺐어요'); }
      if (act === 'up' && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
      if (act === 'down' && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
      activeDay = d;
      rebuild();
      renderDays();
      updatePlanMap();
    });

    $('#stopSearchBtn').addEventListener('click', searchPlace);
    $('#stopName').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); searchPlace(); } });
    $('#pickOnMap').addEventListener('click', startPick);
    $('#stopSave').addEventListener('click', saveStop);
    $('#stopCancel').addEventListener('click', () => $('#stopDialog').close());
    $('#pickCancel').addEventListener('click', () => { pickMode = false; $('#pickBanner').hidden = true; });

    $('#goLive').addEventListener('click', startTrip);

    $('#speeds').innerHTML = SPEEDS.map(s => `<button type="button" data-speed="${s.v}">${s.label}</button>`).join('');
    $('#speeds').addEventListener('click', e => {
      const b = e.target.closest('[data-speed]');
      if (!b) return;
      sim.speed = Number(b.dataset.speed);
      sim.realtime = false;
      sim.paused = false;
      saveSim();
    });
    $('#pauseBtn').addEventListener('click', () => { sim.paused = !sim.paused; saveSim(); });
    $('#realtimeBtn').addEventListener('click', () => {
      sim.realtime = !sim.realtime;
      if (sim.realtime) {
        const m = nowMinute();
        if (m < firstMinute()) toast(`여행은 ${dayLabel(0)}에 시작해요. 그때까지 아바타는 출발 준비 중이에요.`);
        else if (m > lastMinute()) toast('여행 날짜가 이미 지났어요. 빨리 보기로 돌려 볼 수 있어요.');
        else toast('지금 현지 시각에 맞춰 아바타가 움직여요');
      } else {
        sim.paused = false;
      }
      saveSim();
    });
    $('#skipBtn').addEventListener('click', () => {
      sim.realtime = false;
      const cur = find(segs, sim.minute);
      const next = segs.slice(cur.idx + 1).find(s => s.type === 'queue' || s.type === 'activity' || s.type === 'depart' || s.type === 'done');
      if (next) sim.minute = next.start + 0.01;
      sim.paused = false;
      saveSim();
    });
    $('#restartBtn').addEventListener('click', () => {
      sim.minute = firstMinute();
      sim.realtime = false;
      sim.paused = false;
      saveSim();
      toast('처음부터 다시 출발!');
    });
    $('#dayBar').addEventListener('click', e => {
      const r = e.currentTarget.getBoundingClientRect();
      const k = (e.clientX - r.left) / r.width;
      sim.realtime = false;
      sim.minute = Number(e.currentTarget.dataset.from) + k * 1080;
      saveSim();
    });

    $('#settingsBtn').addEventListener('click', () => {
      $('#gmapsKey').value = store.get(LS.key) || '';
      $('#settingsDialog').showModal();
    });
    $('#settingsSave').addEventListener('click', () => {
      store.set(LS.key, $('#gmapsKey').value.trim());
      location.reload();
    });
    $('#settingsCancel').addEventListener('click', () => $('#settingsDialog').close());
    $('#resetAll').addEventListener('click', () => {
      if (!confirm('일정과 여행 기록을 모두 지우고 처음 상태로 돌릴까요?')) return;
      try { localStorage.removeItem(LS.trip); localStorage.removeItem(LS.sim); } catch { /* */ }
      location.reload();
    });

    window.addEventListener('resize', () => { if (tab === 'live') sizeCanvas(); });
    $('#followBtn').addEventListener('click', () => setFollow(true));
    $('#satBtn').addEventListener('click', () => {
      const on = $('#satBtn').getAttribute('aria-pressed') !== 'true';
      $('#satBtn').setAttribute('aria-pressed', String(on));
      $('#satBtn').textContent = on ? '일반 지도' : '위성 사진';
      liveMap?.map.setSatellite(on);
    });
    $('#insetBtn').addEventListener('click', () => {
      const box = $('#insetBox');
      box.hidden = !box.hidden;
      $('#insetBtn').setAttribute('aria-pressed', String(!box.hidden));
      if (!box.hidden) requestAnimationFrame(sizeCanvas);
    });
  }

  /* ---------------- 시작 ---------------- */
  async function init() {
    const saved = store.get(LS.trip);
    trip = saved && saved.days ? normalize(saved) : fromPreset('osaka');
    const s = store.get(LS.sim);
    let awayMin = 0;
    if (s) {
      sim = { ...sim, ...s };
      if (sim.started && !sim.paused && !sim.realtime) {
        const away = (Date.now() - (s.lastTs || Date.now())) / 1000;
        if (away > 30) {
          const before = sim.minute;
          sim.minute += (away * sim.speed) / 60;
          awayMin = sim.minute - before;
        }
      }
    }
    rebuild();
    if (sim.started) sim.minute = Math.min(sim.minute, lastMinute());
    bind();
    renderPlan();
    const initial = (location.hash || '').slice(1);
    switchTab(['plan', 'live', 'diary'].includes(initial) ? initial : sim.started ? 'live' : 'plan');
    if (awayMin > 5) toast(`자리를 비운 사이 아바타가 ${awayMin >= 60 ? Math.round(awayMin / 60) + '시간' : Math.round(awayMin) + '분'} 동안 여행했어요`);
    requestAnimationFrame(loop);

    W.load(trip).then(w => { wx = w; renderPlan(); });
    const key = store.get(LS.key);
    const center = { lat: trip.hotel?.lat ?? trip.lat, lng: trip.hotel?.lng ?? trip.lng };
    planMap = await window.TripMap.create($('#planMap'), { googleKey: key, center, zoom: 13 });
    planMap.map.onClick(onPlanMapClick);
    liveMap = await window.TripMap.create($('#liveMap'), { googleKey: key, center, zoom: 16, pitch: 60 });
    liveMap.map.onUserMove(() => setFollow(false));
    $('#mapProvider').textContent = planMap.provider === 'google' ? 'Google 지도' : planMap.provider === 'osm' ? '지도 © OpenStreetMap · OpenFreeMap. 설정에서 Google 지도 키를 넣으면 구글 지도로 바뀌어요.' : '';
    await Promise.all([planMap.map.ready, liveMap.map.ready]);
    mapsReady = true;
    updatePlanMap();
    mapDay = -1;
    camKind = '';
    refreshRoutes();
  }

  init();
})();
