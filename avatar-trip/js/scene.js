/* 아바타 장면 그리기 (Canvas 2D)
 * render(ctx, W, H, st)
 *   st.kind   : flight | arrive | walk | train | wander | queue | food | cafe | sight | shop | sleep | depart | home | before
 *   st.hour   : 현지 시각 (소수, 예: 13.5)
 *   st.wx     : { temp, code }
 *   st.p      : 현재 단계 진행률 0~1
 *   st.t      : 애니메이션 시간(ms)
 *   st.color  : 아바타 색
 *   st.place  : 장소 이름
 *   st.queue  : 줄 선 사람 수(처음 기준)
 */
window.Scene = (() => {
  const TAU = Math.PI * 2;

  function hex(c) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    const r = A.map((v, i) => Math.round(v + (B[i] - v) * t));
    return '#' + r.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  function rng(seed) {
    let s = (Math.imul(seed + 1, 2654435761) >>> 0) % 2147483647;
    if (s <= 0) s += 2147483646;
    s = (s * 16807) % 2147483647;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return Math.abs(h);
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const wxCat = code => window.Weather.describe(code ?? 0).cat;

  /* ---------- 하늘 ---------- */
  const SKY = [
    [0, '#0b1430', '#1c2a52'],
    [4.5, '#101b3d', '#2b3463'],
    [5.8, '#3b4f8f', '#f2a37a'],
    [7, '#6fb3ea', '#cfe7f7'],
    [12, '#5aa9ea', '#d7eefb'],
    [16, '#6aaee6', '#e7eef3'],
    [17.6, '#5867a8', '#f39a6b'],
    [18.6, '#2a3270', '#c4677a'],
    [19.6, '#121b42', '#2f3768'],
    [24, '#0b1430', '#1c2a52']
  ];
  function skyAt(hour) {
    for (let i = 0; i < SKY.length - 1; i++) {
      const [h0, t0, b0] = SKY[i], [h1, t1, b1] = SKY[i + 1];
      if (hour >= h0 && hour <= h1) {
        const k = (hour - h0) / (h1 - h0);
        return [mix(t0, t1, k), mix(b0, b1, k)];
      }
    }
    return [SKY[0][1], SKY[0][2]];
  }
  const nightness = h => (h < 5 || h > 19.5 ? 1 : h < 6.5 ? (6.5 - h) / 1.5 : h > 18 ? (h - 18) / 1.5 : 0);

  function gloomOf(cat) {
    return { clear: 0, cloudy: 0.45, fog: 0.55, drizzle: 0.5, rain: 0.62, snow: 0.5, storm: 0.75 }[cat] ?? 0;
  }

  function drawSky(ctx, W, H, st) {
    const cat = wxCat(st.wx?.code);
    const g = gloomOf(cat);
    let [top, bot] = skyAt(st.hour);
    const grey = nightness(st.hour) > 0.5 ? '#2a2f3a' : '#9aa3ad';
    top = mix(top, grey, g * 0.8);
    bot = mix(bot, grey, g * 0.8);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const night = nightness(st.hour);
    if (night > 0.3 && g < 0.5) {
      const r = rng(7);
      ctx.fillStyle = `rgba(255,255,255,${0.7 * night})`;
      for (let i = 0; i < 60; i++) {
        const tw = 0.5 + 0.5 * Math.sin(st.t / 600 + i);
        ctx.globalAlpha = night * tw;
        ctx.fillRect(r() * W, r() * H * 0.55, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
    }
    // 해 / 달
    if (g < 0.6) {
      const day = st.hour >= 6 && st.hour <= 18.5;
      const k = day ? (st.hour - 6) / 12.5 : ((st.hour + 24 - 18.5) % 24) / 11.5;
      const x = W * (0.1 + 0.8 * k);
      const y = H * (0.6 - 0.48 * Math.sin(Math.PI * k));
      ctx.save();
      ctx.globalAlpha = 1 - g;
      if (day) {
        const sg = ctx.createRadialGradient(x, y, 4, x, y, H * 0.16);
        sg.addColorStop(0, 'rgba(255,240,200,0.9)');
        sg.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(x, y, H * 0.16, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffe8a3';
        ctx.beginPath(); ctx.arc(x, y, H * 0.045, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = '#f4f1de';
        ctx.beginPath(); ctx.arc(x, y, H * 0.035, 0, TAU); ctx.fill();
        ctx.fillStyle = top;
        ctx.beginPath(); ctx.arc(x + H * 0.015, y - H * 0.01, H * 0.03, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    drawClouds(ctx, W, H, st, cat);
  }

  function drawClouds(ctx, W, H, st, cat) {
    const count = { clear: 3, cloudy: 9, fog: 6, drizzle: 9, rain: 11, snow: 10, storm: 12 }[cat] ?? 3;
    const dark = { clear: 0, cloudy: 0.25, fog: 0.15, drizzle: 0.35, rain: 0.5, snow: 0.2, storm: 0.7 }[cat] ?? 0;
    const night = nightness(st.hour);
    const base = mix(mix('#ffffff', '#5d6673', dark), '#2b3245', night * 0.8);
    const r = rng(42);
    for (let i = 0; i < count; i++) {
      const speed = 4 + r() * 8;
      const w = W * (0.12 + r() * 0.18);
      const x = ((r() * W * 1.4 + (st.t / 1000) * speed) % (W * 1.4)) - W * 0.2;
      const y = H * (0.06 + r() * 0.32);
      ctx.fillStyle = base;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.5, w * 0.16, 0, 0, TAU);
      ctx.ellipse(x - w * 0.18, y - w * 0.07, w * 0.22, w * 0.15, 0, 0, TAU);
      ctx.ellipse(x + w * 0.14, y - w * 0.1, w * 0.2, w * 0.17, 0, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- 날씨 효과 ---------- */
  function drawPrecip(ctx, W, H, st, box) {
    const cat = wxCat(st.wx?.code);
    const [bx, by, bw, bh] = box || [0, 0, W, H];
    ctx.save();
    ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
    if (cat === 'rain' || cat === 'drizzle' || cat === 'storm') {
      const n = cat === 'drizzle' ? 60 : cat === 'storm' ? 200 : 140;
      ctx.strokeStyle = 'rgba(200,220,255,0.55)';
      ctx.lineWidth = 1.2;
      const r = rng(3);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const sp = 0.6 + r() * 0.5;
        const x = bx + ((r() * bw + st.t * 0.05 * sp) % bw);
        const y = by + ((r() * bh + st.t * 0.6 * sp) % bh);
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3, y + 12);
      }
      ctx.stroke();
      if (cat === 'storm' && Math.sin(st.t / 900) > 0.985) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(bx, by, bw, bh);
      }
    } else if (cat === 'snow') {
      const r = rng(5);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 120; i++) {
        const sp = 0.4 + r() * 0.6;
        const x = bx + ((r() * bw + Math.sin(st.t / 1000 + i) * 14) % bw);
        const y = by + ((r() * bh + st.t * 0.05 * sp) % bh);
        ctx.beginPath(); ctx.arc(x, y, 1.2 + sp * 1.6, 0, TAU); ctx.fill();
      }
    } else if (cat === 'fog') {
      const fg = ctx.createLinearGradient(0, by, 0, by + bh);
      fg.addColorStop(0, 'rgba(225,230,235,0.15)');
      fg.addColorStop(1, 'rgba(225,230,235,0.6)');
      ctx.fillStyle = fg;
      ctx.fillRect(bx, by, bw, bh);
    }
    ctx.restore();
  }

  /* ---------- 거리 ---------- */
  function drawCity(ctx, W, H, st, layer, scroll) {
    const night = nightness(st.hour);
    const g = gloomOf(wxCat(st.wx?.code));
    const ground = H * 0.8;
    const tile = W * 1.2;
    const off = ((scroll % tile) + tile) % tile;
    const color = layer === 0 ? mix(mix('#9fb0c4', '#24304a', night), '#7b8592', g * 0.4) : mix(mix('#5d6f88', '#18213a', night), '#555e6b', g * 0.4);
    for (let rep = -1; rep <= 1; rep++) {
      const r = rng(layer === 0 ? 11 : 23);
      let x = rep * tile - off;
      while (x < rep * tile - off + tile) {
        const w = W * (0.06 + r() * (layer === 0 ? 0.08 : 0.1));
        const h = H * (layer === 0 ? 0.25 + r() * 0.3 : 0.14 + r() * 0.24);
        if (x + w > 0 && x < W) {
          ctx.fillStyle = color;
          ctx.fillRect(x, ground - h, w + 1, h);
          if (layer === 1) {
            // 창문
            const wr = rng(Math.floor(x * 7 + 3));
            for (let wy = ground - h + 8; wy < ground - 12; wy += 12) {
              for (let wx = x + 6; wx < x + w - 6; wx += 10) {
                const lit = wr() < 0.15 + night * 0.5;
                ctx.fillStyle = lit && night > 0.2 ? 'rgba(255,214,140,0.85)' : 'rgba(255,255,255,0.12)';
                ctx.fillRect(wx, wy, 4, 6);
              }
            }
          }
        }
        x += w + W * 0.01;
      }
    }
  }

  function drawStreet(ctx, W, H, st, scroll) {
    const night = nightness(st.hour);
    const cat = wxCat(st.wx?.code);
    const wet = ['rain', 'drizzle', 'storm'].includes(cat);
    const snow = cat === 'snow';
    const ground = H * 0.8;
    ctx.fillStyle = snow ? mix('#e9eef3', '#8790a0', night) : mix(wet ? '#4b5463' : '#8b939c', '#2a3040', night);
    ctx.fillRect(0, ground, W, H - ground);
    ctx.fillStyle = mix('#c9ced3', '#4a5262', night);
    ctx.fillRect(0, ground, W, H * 0.025);
    // 보도블록 줄
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    const step = W * 0.08;
    const off = ((scroll % step) + step) % step;
    ctx.beginPath();
    for (let x = -off; x < W; x += step) {
      ctx.moveTo(x, ground + H * 0.03);
      ctx.lineTo(x - W * 0.03, H);
    }
    ctx.stroke();
    // 가로등
    const lstep = W * 0.55;
    const loff = ((scroll * 1.0) % lstep + lstep) % lstep;
    for (let x = -loff + W * 0.2; x < W + 20; x += lstep) {
      ctx.fillStyle = mix('#3d4656', '#1a1f2b', night);
      ctx.fillRect(x, ground - H * 0.38, 4, H * 0.38);
      ctx.fillRect(x - 10, ground - H * 0.38, 24, 4);
      if (night > 0.2) {
        const lg = ctx.createRadialGradient(x + 2, ground - H * 0.36, 2, x + 2, ground - H * 0.36, H * 0.25);
        lg.addColorStop(0, `rgba(255,220,150,${0.55 * night})`);
        lg.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.arc(x + 2, ground - H * 0.36, H * 0.25, 0, TAU); ctx.fill();
      }
    }
    if (wet) {
      ctx.fillStyle = 'rgba(160,190,230,0.12)';
      ctx.fillRect(0, ground + H * 0.03, W, H);
    }
  }

  /* ---------- 사람 ---------- */
  function drawAvatar(ctx, x, y, s, o = {}) {
    const color = o.color || '#e0533d';
    const ph = o.phase || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const skin = '#f6d3b5';
    const hair = '#2a2230';
    const pants = '#2f3a4d';

    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(0, 1, 18, 4, 0, 0, TAU); ctx.fill();

    // 다리
    ctx.strokeStyle = pants;
    ctx.lineWidth = 7;
    if (o.pose === 'walk') {
      const a = Math.sin(ph) * 0.5;
      ctx.beginPath(); ctx.moveTo(-4, -24); ctx.lineTo(-4 + Math.sin(a) * 22, -24 + Math.cos(a) * 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, -24); ctx.lineTo(4 - Math.sin(a) * 22, -24 + Math.cos(a) * 22); ctx.stroke();
    } else if (o.pose === 'sit') {
      ctx.beginPath(); ctx.moveTo(-4, -24); ctx.lineTo(14, -24); ctx.lineTo(14, -4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, -24); ctx.lineTo(20, -24); ctx.lineTo(20, -4); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-5, -24); ctx.lineTo(-5, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, -24); ctx.lineTo(5, -2); ctx.stroke();
    }
    // 신발
    ctx.fillStyle = '#1b1d22';
    if (o.pose !== 'sit') {
      ctx.beginPath(); ctx.ellipse(o.pose === 'walk' ? -4 + Math.sin(Math.sin(ph) * 0.5) * 22 + 2 : -4, -1, 5, 3, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(o.pose === 'walk' ? 4 - Math.sin(Math.sin(ph) * 0.5) * 22 + 2 : 6, -1, 5, 3, 0, 0, TAU); ctx.fill();
    }

    // 가방(백팩)
    ctx.fillStyle = mix(color, '#000000', 0.35);
    rrect(ctx, -19, -50, 9, 22, 3); ctx.fill();

    // 몸통
    ctx.fillStyle = color;
    rrect(ctx, -13, -54, 26, 32, 9); ctx.fill();

    // 팔
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    const bob = o.pose === 'walk' ? Math.sin(ph) * 0.6 : 0;
    if (o.pose === 'camera') {
      ctx.beginPath(); ctx.moveTo(-8, -48); ctx.lineTo(4, -60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, -48); ctx.lineTo(16, -60); ctx.stroke();
      ctx.fillStyle = '#23262d';
      rrect(ctx, 6, -70, 18, 12, 2); ctx.fill();
      ctx.fillStyle = '#9fc6ff';
      ctx.beginPath(); ctx.arc(20, -64, 3, 0, TAU); ctx.fill();
    } else if (o.pose === 'eat') {
      const lift = (Math.sin(ph) + 1) / 2;
      ctx.beginPath(); ctx.moveTo(8, -48); ctx.lineTo(18, -38 - lift * 14); ctx.stroke();
      ctx.strokeStyle = '#b5874f';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(17, -38 - lift * 14); ctx.lineTo(28 - lift * 14, -52 - lift * 8); ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(-8, -48); ctx.lineTo(-2, -32); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-9, -48); ctx.lineTo(-9 - Math.sin(bob) * 10, -30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, -48); ctx.lineTo(9 + Math.sin(bob) * 10, -30); ctx.stroke();
    }
    // 쇼핑백
    if (o.bags) {
      const colors = ['#f2c14e', '#e86a92', '#5fb49c', '#7d8cd8'];
      for (let i = 0; i < o.bags; i++) {
        ctx.fillStyle = colors[i % 4];
        rrect(ctx, 6 + i * 6, -32, 12, 14, 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(12 + i * 6, -32, 4, Math.PI, 0); ctx.stroke();
      }
    }
    // 캐리어
    if (o.suitcase) {
      ctx.fillStyle = '#4f6d8f';
      rrect(ctx, 18, -30, 18, 28, 4); ctx.fill();
      ctx.strokeStyle = '#2b3d52';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(22, -30); ctx.lineTo(22, -40); ctx.lineTo(32, -40); ctx.lineTo(32, -30); ctx.stroke();
    }

    // 머리
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, -68, 15, 0, TAU); ctx.fill();
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.arc(0, -70, 15.5, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-6, -78, 10, 6, -0.3, 0, TAU); ctx.fill();
    // 얼굴
    ctx.fillStyle = '#1b1b22';
    if (o.sleep) {
      ctx.strokeStyle = '#1b1b22'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(-1, -67, 2.5, 0.1, Math.PI - 0.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(8, -67, 2.5, 0.1, Math.PI - 0.1); ctx.stroke();
    } else {
      const blink = Math.sin((o.t || 0) / 280 + x) > 0.97;
      if (blink) {
        ctx.fillRect(-3, -67, 4, 1.4); ctx.fillRect(6, -67, 4, 1.4);
      } else {
        ctx.beginPath(); ctx.arc(-1, -67, 2, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -67, 2, 0, TAU); ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(240,120,120,0.45)';
    ctx.beginPath(); ctx.arc(-5, -62, 3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(12, -62, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7a3b3b'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(4, -61, 3, 0.2, Math.PI - 0.2); ctx.stroke();

    // 우산
    if (o.umbrella) {
      ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(10, -40); ctx.lineTo(6, -108); ctx.stroke();
      ctx.fillStyle = o.umbrella === true ? '#2d6cdf' : o.umbrella;
      ctx.beginPath(); ctx.arc(6, -104, 36, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.moveTo(6, -104); ctx.lineTo(-30, -104); ctx.arc(6, -104, 36, Math.PI, Math.PI * 1.33); ctx.closePath(); ctx.fill();
    }
    // 목도리 (추울 때)
    if (o.scarf) {
      ctx.fillStyle = '#d9d4c3';
      rrect(ctx, -12, -56, 24, 6, 3); ctx.fill();
      rrect(ctx, 4, -54, 6, 14, 3); ctx.fill();
    }
    ctx.restore();
  }

  function drawPerson(ctx, x, y, s, color, seed, t) {
    const r = rng(seed);
    const hairs = ['#2a2230', '#5b3a29', '#1d1d1d', '#8a6a4a', '#c9c3bb'];
    ctx.save();
    ctx.translate(x, y + Math.sin(t / 700 + seed) * 0.6);
    ctx.scale(s, s);
    ctx.strokeStyle = '#3a4152'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4, -24); ctx.lineTo(-4, -2); ctx.moveTo(4, -24); ctx.lineTo(4, -2); ctx.stroke();
    ctx.fillStyle = color;
    rrect(ctx, -12, -52, 24, 30, 8); ctx.fill();
    ctx.fillStyle = '#efcfb2';
    ctx.beginPath(); ctx.arc(0, -64, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = hairs[Math.floor(r() * hairs.length)];
    ctx.beginPath(); ctx.arc(0, -66, 12.5, Math.PI, 0); ctx.fill();
    if (r() < 0.4) { // 휴대폰 보는 사람
      ctx.fillStyle = '#20232a';
      rrect(ctx, -10, -50, 6, 9, 1); ctx.fill();
    }
    ctx.restore();
  }

  function bubble(ctx, x, y, text, W) {
    ctx.save();
    ctx.font = `600 ${Math.max(12, W * 0.018)}px "Noto Sans KR", sans-serif`;
    const w = ctx.measureText(text).width + 18;
    const h = Math.max(24, W * 0.034);
    const bx = Math.min(Math.max(8, x - w / 2), W - w - 8);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    rrect(ctx, bx, y - h, w, h, h / 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 6, y - 1); ctx.lineTo(x + 6, y - 1); ctx.lineTo(x, y + 7); ctx.fill();
    ctx.fillStyle = '#16233a';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + 9, y - h / 2);
    ctx.restore();
  }

  function signBoard(ctx, x, y, w, h, text, bg, fg) {
    ctx.fillStyle = bg;
    rrect(ctx, x, y, w, h, 4); ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = h * 0.5;
    ctx.font = `700 ${size}px "Noto Sans KR", sans-serif`;
    while (ctx.measureText(text).width > w - 12 && size > 8) {
      size -= 1;
      ctx.font = `700 ${size}px "Noto Sans KR", sans-serif`;
    }
    ctx.fillText(text, x + w / 2, y + h / 2 + 1);
    ctx.textAlign = 'left';
  }

  /* ---------- 가게 앞 ---------- */
  function shopFront(ctx, W, H, st, x0, w) {
    const ground = H * 0.8;
    const night = nightness(st.hour);
    const seed = hashStr(st.place || '');
    const r = rng(seed);
    const wall = ['#7a4b33', '#3e4a5c', '#8c2f2f', '#5b5144', '#2f4f4a'][Math.floor(r() * 5)];
    const top = ground - H * 0.62;
    ctx.fillStyle = mix(wall, '#111522', night * 0.5);
    ctx.fillRect(x0, top, w, ground - top);
    // 차양
    ctx.fillStyle = mix('#1f2c44', '#0d121d', night * 0.4);
    ctx.fillRect(x0 - 10, top + H * 0.13, w + 20, H * 0.05);
    // 간판
    signBoard(ctx, x0 + w * 0.08, top + H * 0.02, w * 0.84, H * 0.09, st.place || '가게', '#f6efe1', '#2a1c14');
    // 가게 창 (불빛)
    const winTop = top + H * 0.22;
    ctx.fillStyle = night > 0.2 ? '#ffd58a' : '#f3e2bf';
    ctx.fillRect(x0 + w * 0.08, winTop, w * 0.84, ground - winTop);
    // 노렌(천 가림막)
    const doorX = x0 + w * 0.08;
    const nw = w * 0.84;
    const panels = 4;
    for (let i = 0; i < panels; i++) {
      const sway = Math.sin(st.t / 900 + i) * 2;
      ctx.fillStyle = '#1e2d4f';
      ctx.beginPath();
      ctx.moveTo(doorX + (nw / panels) * i + 1, winTop);
      ctx.lineTo(doorX + (nw / panels) * (i + 1) - 1, winTop);
      ctx.lineTo(doorX + (nw / panels) * (i + 1) - 1 + sway, winTop + H * 0.17);
      ctx.lineTo(doorX + (nw / panels) * i + 1 + sway, winTop + H * 0.17);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.arc(doorX + (nw / panels) * (i + 0.5) + sway, winTop + H * 0.09, H * 0.02, 0, TAU); ctx.fill();
    }
    // 등불
    const lx = x0 - 4;
    ctx.fillStyle = '#d8402f';
    ctx.beginPath(); ctx.ellipse(lx, top + H * 0.26, H * 0.025, H * 0.04, 0, 0, TAU); ctx.fill();
    if (night > 0.2) {
      const lg = ctx.createRadialGradient(lx, top + H * 0.26, 2, lx, top + H * 0.26, H * 0.12);
      lg.addColorStop(0, `rgba(255,120,80,${0.5 * night})`);
      lg.addColorStop(1, 'rgba(255,120,80,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(lx, top + H * 0.26, H * 0.12, 0, TAU); ctx.fill();
    }
    return doorX;
  }

  /* ---------- 랜드마크 ---------- */
  function landmarkKind(name = '') {
    if (/이나리|신사|신궁|타이샤|진자|torii/i.test(name)) return 'torii';
    if (/타워|트리|하루카스|츠텐카쿠|공중정원|스카이|전망/.test(name)) return 'tower';
    if (/성$|성\s|castle/i.test(name)) return 'castle';
    if (/데라|센소지|사원|절|temple|지$/i.test(name)) return 'temple';
    if (/팀랩|미술관|뮤지엄|museum/i.test(name)) return 'lights';
    if (/교차로|거리|요코초|기온|글리코|시장|상점가/.test(name)) return 'street';
    return 'park';
  }

  function drawLandmark(ctx, W, H, st, kind) {
    const ground = H * 0.8;
    const night = nightness(st.hour);
    const cx = W * 0.64;
    if (kind === 'torii') {
      const red = mix('#d8432c', '#5a1e18', night * 0.6);
      for (let i = 4; i >= 0; i--) {
        const s = 1 - i * 0.14;
        const x = cx + i * W * 0.04;
        const w = W * 0.3 * s, h = H * 0.55 * s;
        ctx.fillStyle = mix(red, '#9aa3ad', i * 0.08);
        ctx.fillRect(x - w / 2 + w * 0.1, ground - h, w * 0.07, h);
        ctx.fillRect(x + w / 2 - w * 0.17, ground - h, w * 0.07, h);
        ctx.fillRect(x - w / 2, ground - h - h * 0.06, w, h * 0.07);
        ctx.fillRect(x - w / 2 + w * 0.06, ground - h + h * 0.1, w * 0.88, h * 0.05);
        ctx.fillStyle = '#1d1d22';
        ctx.fillRect(x - w / 2 - 4, ground - h - h * 0.1, w + 8, h * 0.05);
      }
    } else if (kind === 'tower') {
      const c = mix('#e25a3a', '#30395c', night * 0.5);
      const h = H * 0.72, w = W * 0.13;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, ground); ctx.lineTo(cx - w * 0.08, ground - h); ctx.lineTo(cx + w * 0.08, ground - h); ctx.lineTo(cx + w / 2, ground);
      ctx.lineTo(cx + w * 0.3, ground); ctx.lineTo(cx, ground - h * 0.45); ctx.lineTo(cx - w * 0.3, ground);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = mix('#f1f3f5', '#3b4568', night * 0.6);
      ctx.fillRect(cx - w * 0.22, ground - h * 0.42, w * 0.44, h * 0.06);
      ctx.fillRect(cx - w * 0.14, ground - h * 0.72, w * 0.28, h * 0.05);
      ctx.fillStyle = c;
      ctx.fillRect(cx - 2, ground - h - H * 0.08, 4, H * 0.08);
      if (night > 0.3) {
        ctx.fillStyle = `rgba(255,170,90,${0.25 * night})`;
        ctx.beginPath(); ctx.arc(cx, ground - h * 0.5, h * 0.55, 0, TAU); ctx.fill();
      }
    } else if (kind === 'castle') {
      const wall = mix('#f2f0ea', '#4a5470', night * 0.6);
      const roof = mix('#3f6f6a', '#1e2c3a', night * 0.5);
      ctx.fillStyle = mix('#7d7a72', '#2b2f3b', night * 0.6);
      ctx.beginPath(); ctx.moveTo(cx - W * 0.2, ground); ctx.lineTo(cx - W * 0.16, ground - H * 0.14); ctx.lineTo(cx + W * 0.16, ground - H * 0.14); ctx.lineTo(cx + W * 0.2, ground); ctx.fill();
      let y = ground - H * 0.14;
      for (let i = 0; i < 4; i++) {
        const w = W * (0.26 - i * 0.05), h = H * 0.09;
        ctx.fillStyle = wall; ctx.fillRect(cx - w / 2 + 6, y - h, w - 12, h);
        ctx.fillStyle = roof;
        ctx.beginPath(); ctx.moveTo(cx - w / 2 - 8, y - h + 4); ctx.lineTo(cx, y - h - H * 0.06); ctx.lineTo(cx + w / 2 + 8, y - h + 4); ctx.fill();
        ctx.fillStyle = '#d9b44a'; ctx.fillRect(cx - 3, y - h - H * 0.065, 6, 4);
        y -= h + H * 0.03;
      }
    } else if (kind === 'temple') {
      const roof = mix('#3b3b44', '#15161c', night * 0.5);
      const wood = mix('#b2442d', '#4a1c16', night * 0.5);
      ctx.fillStyle = wood;
      ctx.fillRect(cx - W * 0.14, ground - H * 0.24, W * 0.28, H * 0.24);
      ctx.fillStyle = roof;
      ctx.beginPath(); ctx.moveTo(cx - W * 0.22, ground - H * 0.22); ctx.quadraticCurveTo(cx, ground - H * 0.42, cx + W * 0.22, ground - H * 0.22); ctx.lineTo(cx + W * 0.15, ground - H * 0.3); ctx.lineTo(cx - W * 0.15, ground - H * 0.3); ctx.fill();
      // 탑
      const px = cx + W * 0.24;
      for (let i = 0; i < 5; i++) {
        const y = ground - H * 0.1 - i * H * 0.1;
        ctx.fillStyle = wood; ctx.fillRect(px - W * 0.025, y - H * 0.06, W * 0.05, H * 0.06);
        ctx.fillStyle = roof; ctx.fillRect(px - W * (0.06 - i * 0.006), y - H * 0.075, W * (0.12 - i * 0.012), H * 0.02);
      }
      ctx.fillStyle = '#d8402f';
      ctx.beginPath(); ctx.ellipse(cx, ground - H * 0.13, H * 0.05, H * 0.07, 0, 0, TAU); ctx.fill();
    } else if (kind === 'lights') {
      ctx.fillStyle = '#0d0f1d';
      ctx.fillRect(W * 0.3, 0, W * 0.7, ground);
      for (let i = 0; i < 40; i++) {
        const r = rng(i + 3);
        const x = W * 0.32 + r() * W * 0.66, y = r() * ground;
        const hue = (st.t / 40 + i * 25) % 360;
        const rad = 10 + r() * 30;
        const g = ctx.createRadialGradient(x, y, 1, x, y, rad);
        g.addColorStop(0, `hsla(${hue},90%,70%,0.9)`);
        g.addColorStop(1, `hsla(${hue},90%,60%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      }
    } else if (kind === 'street') {
      const r = rng(hashStr(st.place || 's'));
      const cols = ['#e86a5a', '#f2c14e', '#5fb49c', '#7d8cd8', '#e86a92'];
      for (let i = 0; i < 5; i++) {
        const x = W * (0.38 + i * 0.13);
        const h = H * (0.35 + r() * 0.2);
        ctx.fillStyle = mix('#5a6478', '#1d2236', night * 0.7);
        ctx.fillRect(x, ground - h, W * 0.12, h);
        const c = cols[i % cols.length];
        ctx.fillStyle = night > 0.3 ? c : mix(c, '#ffffff', 0.2);
        ctx.fillRect(x + W * 0.015, ground - h + H * 0.04, W * 0.09, H * 0.12);
        if (night > 0.3) {
          ctx.fillStyle = `rgba(255,255,255,${0.08 + 0.05 * Math.sin(st.t / 300 + i)})`;
          ctx.fillRect(x, ground - h, W * 0.12, h);
        }
      }
    } else {
      // 공원: 나무
      for (let i = 0; i < 6; i++) {
        const x = W * (0.4 + i * 0.11);
        const s = 0.8 + ((i * 37) % 10) / 20;
        ctx.fillStyle = '#5b4636';
        ctx.fillRect(x - 3, ground - H * 0.16 * s, 6, H * 0.16 * s);
        ctx.fillStyle = mix('#5c9a5a', '#1f3328', night * 0.6);
        ctx.beginPath(); ctx.arc(x, ground - H * 0.22 * s, H * 0.09 * s, 0, TAU); ctx.fill();
      }
    }
  }

  /* ---------- 장면별 ---------- */
  function outfit(st) {
    const cat = wxCat(st.wx?.code);
    return {
      color: st.color,
      t: st.t,
      umbrella: ['rain', 'drizzle', 'storm'].includes(cat) ? '#2d6cdf' : cat === 'snow' ? '#e0533d' : false,
      scarf: (st.wx?.temp ?? 15) <= 7
    };
  }

  function sceneWalk(ctx, W, H, st, slow) {
    const speed = slow ? 0.02 : 0.06;
    const scroll = st.t * speed;
    drawSky(ctx, W, H, st);
    drawCity(ctx, W, H, st, 0, scroll * 0.25);
    drawCity(ctx, W, H, st, 1, scroll * 0.5);
    drawStreet(ctx, W, H, st, scroll);
    const s = H / 300;
    drawAvatar(ctx, W * 0.42, H * 0.9, s, { ...outfit(st), pose: 'walk', phase: st.t / (slow ? 260 : 150) });
    drawPrecip(ctx, W, H, st);
  }

  function sceneTrain(ctx, W, H, st) {
    const night = nightness(st.hour);
    ctx.fillStyle = mix('#dfe4e8', '#6c7480', night * 0.3);
    ctx.fillRect(0, 0, W, H);
    // 창문
    const wx0 = W * 0.08, wy0 = H * 0.12, ww = W * 0.84, wh = H * 0.44;
    ctx.save();
    rrect(ctx, wx0, wy0, ww, wh, 14); ctx.clip();
    ctx.translate(wx0, wy0 - H * 0.2);
    const sub = { ...st };
    drawSky(ctx, ww, wh * 1.6, sub);
    drawCity(ctx, ww, wh * 1.6, sub, 0, st.t * 0.25);
    drawCity(ctx, ww, wh * 1.6, sub, 1, st.t * 0.6);
    ctx.restore();
    drawPrecip(ctx, W, H, st, [wx0, wy0, ww, wh]);
    ctx.strokeStyle = '#9aa4ae'; ctx.lineWidth = 8;
    rrect(ctx, wx0, wy0, ww, wh, 14); ctx.stroke();
    ctx.fillStyle = '#9aa4ae';
    for (let i = 1; i < 3; i++) ctx.fillRect(wx0 + (ww / 3) * i - 4, wy0, 8, wh);
    // 손잡이
    for (let i = 0; i < 6; i++) {
      const x = W * (0.12 + i * 0.15);
      const sw = Math.sin(st.t / 500 + i * 0.4) * 4;
      ctx.strokeStyle = '#c7ccd2'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + sw, H * 0.08); ctx.stroke();
      ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x + sw, H * 0.1, H * 0.02, 0, TAU); ctx.stroke();
    }
    // 좌석
    ctx.fillStyle = '#2f6b8a';
    rrect(ctx, W * 0.05, H * 0.68, W * 0.9, H * 0.12, 10); ctx.fill();
    ctx.fillStyle = '#285a75';
    rrect(ctx, W * 0.05, H * 0.6, W * 0.9, H * 0.1, 10); ctx.fill();
    ctx.fillStyle = mix('#b8bfc6', '#5a6270', night * 0.3);
    ctx.fillRect(0, H * 0.8, W, H * 0.2);
    const s = H / 300;
    const shake = Math.sin(st.t / 90) * 0.6;
    drawPerson(ctx, W * 0.22, H * 0.78 + shake, s * 0.95, '#8a8f99', 11, st.t);
    drawAvatar(ctx, W * 0.45, H * 0.8 + shake, s, { ...outfit(st), umbrella: false, pose: 'sit' });
    drawPerson(ctx, W * 0.72, H * 0.78 + shake, s * 0.95, '#c76d5a', 29, st.t);
  }

  function sceneFlight(ctx, W, H, st) {
    const night = nightness(st.hour);
    ctx.fillStyle = mix('#eef0f2', '#3f4552', night * 0.5);
    ctx.fillRect(0, 0, W, H);
    const cx = W * 0.6, cy = H * 0.42, rx = W * 0.2, ry = H * 0.3;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.clip();
    const sub = { ...st, wx: { code: 0, temp: st.wx?.temp } };
    drawSky(ctx, W, H, sub);
    // 구름 바다
    ctx.fillStyle = mix('#ffffff', '#4a5470', night);
    for (let i = 0; i < 14; i++) {
      const x = ((i * W * 0.1 - st.t * 0.03) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2;
      ctx.beginPath(); ctx.ellipse(x, cy + ry * 0.55 + (i % 3) * 8, W * 0.08, H * 0.05, 0, 0, TAU); ctx.fill();
    }
    // 날개
    ctx.fillStyle = mix('#d3d8de', '#5b6273', night);
    ctx.beginPath(); ctx.moveTo(cx - rx, cy + ry * 0.25); ctx.lineTo(cx + rx * 0.6, cy + ry * 0.05); ctx.lineTo(cx + rx * 0.7, cy + ry * 0.12); ctx.lineTo(cx - rx, cy + ry * 0.45); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = mix('#c4c9cf', '#2b303c', night * 0.5); ctx.lineWidth = 14;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx + 6, ry + 6, 0, 0, TAU); ctx.stroke();
    // 좌석
    ctx.fillStyle = '#2c3e66';
    rrect(ctx, W * 0.06, H * 0.38, W * 0.2, H * 0.5, 18); ctx.fill();
    const s = H / 300;
    drawAvatar(ctx, W * 0.17, H * 0.92, s, { ...outfit(st), umbrella: false, pose: 'sit' });
    ctx.fillStyle = mix('#cfd4d9', '#4a505d', night * 0.5);
    ctx.fillRect(0, H * 0.88, W, H * 0.12);
  }

  function sceneQueue(ctx, W, H, st) {
    drawSky(ctx, W, H, st);
    drawCity(ctx, W, H, st, 0, 120);
    drawStreet(ctx, W, H, st, 0);
    const door = shopFront(ctx, W, H, st, W * 0.68, W * 0.3);
    const s = H / 300;
    const total = Math.max(1, st.queue || 6);
    const ahead = Math.max(0, Math.ceil(total * (1 - st.p)) - 1);
    const gap = 30 * s;
    const ground = H * 0.9;
    const colors = ['#6b7a99', '#b4675a', '#4f8a72', '#c79a3f', '#7f5fa8', '#3e4a5c', '#9b6b52'];
    const shown = Math.min(ahead, Math.floor((door - W * 0.12) / gap) - 1);
    for (let i = 0; i < shown; i++) {
      drawPerson(ctx, door - gap * (i + 0.6), ground, s * 0.95, colors[i % colors.length], 100 + i, st.t);
    }
    const ax = door - gap * (shown + 0.6) - 4 * s;
    drawAvatar(ctx, ax, ground, s, { ...outfit(st), pose: 'stand' });
    drawPrecip(ctx, W, H, st);
    bubble(ctx, ax, ground - 120 * s, ahead > 0 ? `앞에 ${ahead}명` : '이제 내 차례!', W);
  }

  function sceneEat(ctx, W, H, st, cafe) {
    const night = nightness(st.hour);
    ctx.fillStyle = cafe ? mix('#e8dccb', '#5a4c3e', night * 0.4) : mix('#c99a63', '#5b3f25', night * 0.35);
    ctx.fillRect(0, 0, W, H);
    // 창
    const box = [W * 0.6, H * 0.08, W * 0.34, H * 0.4];
    ctx.save();
    ctx.beginPath(); ctx.rect(...box); ctx.clip();
    ctx.translate(box[0], box[1]);
    drawSky(ctx, box[2], box[3] * 1.3, st);
    drawCity(ctx, box[2], box[3] * 1.3, st, 1, 40);
    ctx.restore();
    drawPrecip(ctx, W, H, st, box);
    ctx.strokeStyle = '#4a321e'; ctx.lineWidth = 6;
    ctx.strokeRect(...box);
    ctx.fillStyle = '#4a321e';
    ctx.fillRect(box[0] + box[2] / 2 - 3, box[1], 6, box[3]);
    // 메뉴판
    if (!cafe) {
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = '#f6efe1';
        ctx.fillRect(W * (0.05 + i * 0.075), H * 0.08, W * 0.055, H * 0.3);
        ctx.fillStyle = '#2a1c14';
        for (let j = 0; j < 4; j++) ctx.fillRect(W * (0.068 + i * 0.075), H * (0.12 + j * 0.06), W * 0.02, H * 0.03);
      }
    } else {
      ctx.fillStyle = '#5f7a5a';
      ctx.beginPath(); ctx.arc(W * 0.15, H * 0.3, H * 0.1, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6b4b34';
      ctx.fillRect(W * 0.13, H * 0.36, W * 0.04, H * 0.12);
    }
    signBoard(ctx, W * 0.08, H * 0.42, W * 0.44, H * 0.08, st.place || '', '#2a1c14', '#f6efe1');
    // 사람 + 카운터
    const s = H / 300;
    drawAvatar(ctx, W * 0.38, H * 0.74 + 30 * s, s * 1.05, { ...outfit(st), umbrella: false, pose: cafe ? 'stand' : 'eat', phase: st.t / 380 });
    ctx.fillStyle = cafe ? '#8b6a4c' : '#e2c597';
    ctx.fillRect(0, H * 0.74, W, H * 0.06);
    ctx.fillStyle = cafe ? '#6c513a' : '#a6784a';
    ctx.fillRect(0, H * 0.8, W, H * 0.2);
    // 음식
    const fx = W * 0.47, fy = H * 0.74;
    if (cafe) {
      ctx.fillStyle = '#f4f1ea';
      rrect(ctx, fx - 14 * s, fy - 22 * s, 28 * s, 22 * s, 4 * s); ctx.fill();
      ctx.strokeStyle = '#f4f1ea'; ctx.lineWidth = 4 * s;
      ctx.beginPath(); ctx.arc(fx + 16 * s, fy - 12 * s, 6 * s, -1.2, 1.2); ctx.stroke();
      ctx.fillStyle = '#5a3a24';
      ctx.fillRect(fx - 11 * s, fy - 20 * s, 22 * s, 4 * s);
    } else {
      const left = Math.max(0.15, 1 - st.p);
      ctx.fillStyle = '#2b2b33';
      ctx.beginPath(); ctx.ellipse(fx, fy - 12 * s, 30 * s, 6 * s, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(fx - 30 * s, fy - 12 * s); ctx.quadraticCurveTo(fx, fy + 18 * s, fx + 30 * s, fy - 12 * s); ctx.fill();
      ctx.fillStyle = '#e9b86a';
      ctx.beginPath(); ctx.ellipse(fx, fy - 12 * s, 26 * s, 4.5 * s * left + 0.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c3423a';
      ctx.beginPath(); ctx.arc(fx - 10 * s, fy - 13 * s, 3 * s * left, 0, TAU); ctx.fill();
    }
    // 김
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2 * s;
    for (let i = 0; i < 3; i++) {
      const off = (st.t / 30 + i * 20) % 50;
      ctx.globalAlpha = 1 - off / 50;
      ctx.beginPath();
      ctx.moveTo(fx - 12 * s + i * 12 * s, fy - 24 * s - off * s * 0.6);
      ctx.quadraticCurveTo(fx - 6 * s + i * 12 * s, fy - 32 * s - off * s * 0.6, fx - 12 * s + i * 12 * s, fy - 40 * s - off * s * 0.6);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function sceneSight(ctx, W, H, st) {
    drawSky(ctx, W, H, st);
    drawCity(ctx, W, H, st, 0, 300);
    const kind = landmarkKind(st.place);
    drawLandmark(ctx, W, H, st, kind);
    drawStreet(ctx, W, H, st, 0);
    const s = H / 300;
    const cycle = (st.t % 4000) / 4000;
    const shooting = cycle > 0.55;
    const o = outfit(st);
    drawAvatar(ctx, W * 0.24, H * 0.9, s, { ...o, umbrella: shooting ? false : o.umbrella, pose: shooting ? 'camera' : 'stand' });
    drawPrecip(ctx, W, H, st);
    if (cycle > 0.8 && cycle < 0.84) {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function sceneShop(ctx, W, H, st) {
    const scroll = st.t * 0.015;
    drawSky(ctx, W, H, st);
    drawCity(ctx, W, H, st, 0, scroll * 0.3);
    // 상점가 지붕(아케이드)
    const night = nightness(st.hour);
    const ground = H * 0.8;
    const r = rng(hashStr(st.place || 'shop'));
    const cols = ['#e86a5a', '#f2c14e', '#5fb49c', '#7d8cd8', '#e86a92', '#f08b4f'];
    const tile = W * 0.22;
    const off = ((scroll % tile) + tile) % tile;
    const colorsArr = Array.from({ length: 12 }, () => cols[Math.floor(r() * cols.length)]);
    for (let i = -1; i < 7; i++) {
      const x = i * tile - off;
      const idx = ((i + Math.floor(scroll / tile)) % 12 + 12) % 12;
      ctx.fillStyle = mix('#f1ece4', '#3a3f52', night * 0.6);
      ctx.fillRect(x + 4, ground - H * 0.42, tile - 8, H * 0.42);
      ctx.fillStyle = colorsArr[idx];
      ctx.fillRect(x + 4, ground - H * 0.42, tile - 8, H * 0.08);
      ctx.fillStyle = night > 0.3 ? '#ffe2a8' : mix('#d9e7f0', '#ffffff', 0.3);
      ctx.fillRect(x + 12, ground - H * 0.3, tile - 24, H * 0.24);
      ctx.fillStyle = colorsArr[(idx + 3) % 12];
      for (let k = 0; k < 3; k++) ctx.fillRect(x + 18 + k * (tile - 36) / 3, ground - H * 0.14, (tile - 50) / 3, H * 0.08);
    }
    ctx.fillStyle = mix('#c8ccd1', '#2b3040', night * 0.6);
    ctx.fillRect(0, ground - H * 0.52, W, H * 0.05);
    drawStreet(ctx, W, H, st, scroll);
    const s = H / 300;
    const bags = 1 + Math.floor(st.p * 3);
    drawPerson(ctx, W * 0.75, H * 0.9, s * 0.95, '#6b7a99', 7, st.t);
    drawAvatar(ctx, W * 0.42, H * 0.9, s, { ...outfit(st), umbrella: false, pose: 'walk', phase: st.t / 300, bags });
  }

  function sceneSleep(ctx, W, H, st) {
    ctx.fillStyle = '#1d2238';
    ctx.fillRect(0, 0, W, H);
    const box = [W * 0.58, H * 0.1, W * 0.32, H * 0.42];
    ctx.save();
    ctx.beginPath(); ctx.rect(...box); ctx.clip();
    ctx.translate(box[0], box[1]);
    drawSky(ctx, box[2], box[3] * 1.4, st);
    drawCity(ctx, box[2], box[3] * 1.4, st, 1, 80);
    ctx.restore();
    drawPrecip(ctx, W, H, st, box);
    ctx.strokeStyle = '#3a4060'; ctx.lineWidth = 6; ctx.strokeRect(...box);
    // 커튼
    ctx.fillStyle = '#4b3f6b';
    ctx.fillRect(box[0] - W * 0.04, box[1] - 6, W * 0.05, box[3] + 20);
    ctx.fillRect(box[0] + box[2] - W * 0.01, box[1] - 6, W * 0.05, box[3] + 20);
    // 침대
    const bx = W * 0.08, by = H * 0.58;
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(bx, by - H * 0.18, W * 0.04, H * 0.38);
    ctx.fillStyle = '#e9e5f3';
    rrect(ctx, bx, by, W * 0.55, H * 0.14, 10); ctx.fill();
    ctx.fillStyle = '#ffffff';
    rrect(ctx, bx + W * 0.04, by - H * 0.06, W * 0.12, H * 0.08, 12); ctx.fill();
    // 얼굴
    const s = H / 300;
    ctx.save();
    ctx.translate(bx + W * 0.1, by - H * 0.03);
    ctx.scale(s, s);
    ctx.fillStyle = '#f6d3b5';
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a2230';
    ctx.beginPath(); ctx.arc(-3, -2, 15.5, Math.PI * 0.6, Math.PI * 1.5); ctx.fill();
    ctx.strokeStyle = '#1b1b22'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(3, 1, 2.5, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.beginPath(); ctx.arc(10, 1, 2.5, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.restore();
    // 이불
    ctx.fillStyle = st.color;
    const breathe = Math.sin(st.t / 900) * 3;
    rrect(ctx, bx + W * 0.15, by - H * 0.05 - breathe, W * 0.4, H * 0.12 + breathe, 14); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(bx + W * 0.15, by - H * 0.01, W * 0.4, 4);
    // 캐리어
    ctx.fillStyle = '#4f6d8f';
    rrect(ctx, W * 0.72, H * 0.6, W * 0.08, H * 0.2, 6); ctx.fill();
    // 바닥
    ctx.fillStyle = '#2a2f48';
    ctx.fillRect(0, H * 0.8, W, H * 0.2);
    // Zzz
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 3; i++) {
      const k = ((st.t / 1800 + i / 3) % 1);
      ctx.globalAlpha = 1 - k;
      ctx.font = `700 ${(14 + i * 4) * s}px "Noto Sans KR", sans-serif`;
      ctx.fillText('Z', bx + W * 0.18 + k * W * 0.08, by - H * 0.1 - k * H * 0.22);
    }
    ctx.globalAlpha = 1;
    // 스탠드
    const lampOn = st.hour >= 21 && st.hour < 23;
    if (lampOn) {
      const lg = ctx.createRadialGradient(W * 0.68, H * 0.5, 2, W * 0.68, H * 0.5, H * 0.3);
      lg.addColorStop(0, 'rgba(255,210,140,0.5)');
      lg.addColorStop(1, 'rgba(255,210,140,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function sceneAirport(ctx, W, H, st) {
    const night = nightness(st.hour);
    ctx.fillStyle = mix('#e9edf1', '#384055', night * 0.5);
    ctx.fillRect(0, 0, W, H);
    // 큰 창
    const box = [W * 0.04, H * 0.06, W * 0.92, H * 0.56];
    ctx.save();
    ctx.beginPath(); ctx.rect(...box); ctx.clip();
    ctx.translate(box[0], box[1]);
    drawSky(ctx, box[2], box[3] * 1.3, st);
    ctx.restore();
    drawPrecip(ctx, W, H, st, box);
    // 비행기
    const px = W * 0.55, py = H * 0.5;
    ctx.fillStyle = '#f3f5f7';
    rrect(ctx, px - W * 0.25, py - H * 0.05, W * 0.5, H * 0.1, H * 0.05); ctx.fill();
    ctx.fillStyle = '#d8dde3';
    ctx.beginPath(); ctx.moveTo(px - W * 0.2, py - H * 0.03); ctx.lineTo(px - W * 0.26, py - H * 0.18); ctx.lineTo(px - W * 0.16, py - H * 0.03); ctx.fill();
    ctx.fillStyle = st.color;
    ctx.fillRect(px - W * 0.2, py - H * 0.005, W * 0.42, H * 0.012);
    ctx.fillStyle = '#5b6a80';
    for (let i = 0; i < 12; i++) ctx.fillRect(px - W * 0.15 + i * W * 0.028, py - H * 0.025, W * 0.012, H * 0.016);
    for (let i = 1; i < 5; i++) ctx.fillRect(box[0] + (box[2] / 5) * i - 2, box[1], 4, box[3]);
    // 안내판
    ctx.fillStyle = '#1b1f2a';
    rrect(ctx, W * 0.62, H * 0.66, W * 0.32, H * 0.12, 6); ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.font = `700 ${H * 0.045}px "IBM Plex Mono", monospace`;
    ctx.fillText(st.kind === 'arrive' ? 'ARRIVAL' : 'DEPARTURE', W * 0.64, H * 0.735);
    ctx.fillStyle = mix('#c9cfd6', '#2b3142', night * 0.5);
    ctx.fillRect(0, H * 0.8, W, H * 0.2);
    const s = H / 300;
    drawAvatar(ctx, W * 0.3, H * 0.92, s, { ...outfit(st), umbrella: false, pose: 'stand', suitcase: true });
  }

  function render(ctx, W, H, st) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    switch (st.kind) {
      case 'flight':
      case 'flightHome':
        sceneFlight(ctx, W, H, st); break;
      case 'arrive':
      case 'depart':
      case 'before':
        sceneAirport(ctx, W, H, st); break;
      case 'train': sceneTrain(ctx, W, H, st); break;
      case 'walk': sceneWalk(ctx, W, H, st, false); break;
      case 'wander': sceneWalk(ctx, W, H, st, true); break;
      case 'queue': sceneQueue(ctx, W, H, st); break;
      case 'food': sceneEat(ctx, W, H, st, false); break;
      case 'cafe': sceneEat(ctx, W, H, st, true); break;
      case 'sight': sceneSight(ctx, W, H, st); break;
      case 'shop': sceneShop(ctx, W, H, st); break;
      case 'sleep':
      case 'done':
        sceneSleep(ctx, W, H, st); break;
      default: sceneWalk(ctx, W, H, st, true);
    }
    ctx.restore();
  }

  return { render, drawAvatar, landmarkKind };
})();
