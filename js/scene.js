/* =========================================================
   Startup Garage — kanatli yo'l sahnasi
   Scroll-driven canvas renderer: fon (4K), kanat, kabinalar,
   mayatnik fizikasi, tuman qatlamlari. Har kadr qurilma
   piksellarida (DPR ≤ 2, ≤ 4096px) chiziladi → 4K/60fps.
   ========================================================= */
(() => {
  'use strict';

  const SG = window.SG;
  const IMG_W = 1536, IMG_H = 1024;           // sahna koordinatalari (manba rasm o'lchami)
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Geometriya (generatsiya qilingan fotodan o'lchangan, px) ----------
     [x, y, size] — size: shu nuqtadagi kabina balandligi (ilgakdan tagigacha) */
  const UP_NODES = [                // old (yaqin) kanat — yuqoriga
    [548, 662.5, 128],              // pastki stansiya
    [1013, 381, 74],                // 1-minora
    [1188, 279.5, 62],              // 2-minora
    [1316, 207, 52],                // 3-minora
    [1372, 170, 44],                // 4-minora
    [1421, 166, 42]                 // cho'qqi stansiyasi
  ];
  const DOWN_NODES = [              // orqa kanat — pastga
    [513, 648, 118],
    [1000, 372.5, 69],
    [1188, 264, 58],
    [1300, 200.3, 49],
    [1365, 162, 41],
    [1420, 160, 39]
  ];

  // Kabina sprite metrikasi (cabin-body.png / cabin-grip.png, yarim masshtab px)
  const SPR = { h: 601, gripC: { x: 337, y: 45 }, pivot: { x: 340, y: 90 }, glowPad: 40 };

  // Foto tepasidagi osmon kengaytmasi (sky-top.webp): kamera cho'qqida yuqoriga chiqa oladi
  const SKY_EXT = 180, SKY_OVER = 28;
  // Unicorn-bulut: cho'qqi tepasidagi osmonda (sahna koordinatalari), shox uchi — sprite px
  const UNI = { cx: 1385, cy: 22, w: 236, sw: 960, sh: 633, hornX: 16, hornY: 16.7 };

  const GAP = 0.185;                 // kabinalar orasidagi masofa (kanat uzunligi ulushi)
  const T_START = 0.0, T_END = 0.962;

  /* ---------- helpers ---------- */
  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const easeInOut = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const easeJourney = (x) => lerp(x, easeInOut(x), 0.55);   // yumshoq start/finish, o'rtada bir tekis

  function buildPath(nodes) {
    const spans = []; let total = 0;
    for (let i = 0; i < nodes.length - 1; i++) {
      const [x0, y0, s0] = nodes[i], [x1, y1, s1] = nodes[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      const w = len / ((s0 + s1) / 2);              // perspektivaga normallashgan "dunyo" uzunligi
      spans.push({ x0, y0, s0, x1, y1, s1, w, ang: Math.atan2(y1 - y0, x1 - x0) });
      total += w;
    }
    let acc = 0;
    for (const s of spans) { s.a = acc / total; acc += s.w; s.b = acc / total; }
    return spans;
  }
  const UP = buildPath(UP_NODES);
  const DOWN = buildPath(DOWN_NODES);

  // Perspektivaga to'g'ri interpolyatsiya: z = 1/size bo'yicha
  function pointAt(spans, t, out) {
    let i = 0;
    if (t >= 1) i = spans.length - 1;
    else if (t > 0) while (i < spans.length - 1 && t > spans[i].b) i++;
    const s = spans[i];
    const u = (t - s.a) / (s.b - s.a);
    const z0 = 1 / s.s0, z1 = 1 / s.s1;
    const wa = z0 * (1 - u), wb = z1 * u, W = wa + wb;
    out.x = (s.x0 * wa + s.x1 * wb) / W;
    out.y = (s.y0 * wa + s.y1 * wb) / W;
    out.size = 1 / W;
    // minoralar atrofida burchakni silliq o'tkazish
    let ang = s.ang;
    const B = 0.1;
    if (u < B && i > 0) ang = lerp(spans[i - 1].ang, s.ang, 0.5 + 0.5 * (u / B));
    else if (u > 1 - B && i < spans.length - 1) ang = lerp(s.ang, spans[i + 1].ang, 0.5 * ((u - (1 - B)) / B));
    out.ang = ang;
    return out;
  }

  /* ---------- DOM ---------- */
  const stage = document.getElementById('stage');
  const journey = document.getElementById('journey');
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const signCv = document.getElementById('signGlow'), sctx = signCv.getContext('2d');
  const SIGN = { x: 179, y: 679, w: 252, h: 147, img: null, k: 0 };   // neon yozuv (sign-neon.png) — bino peshtoqi, sahna px
  const timeLevel = () => ({ night: 1, evening: 0.3 }[document.documentElement.dataset.time] || 0);
  const labelsEl = document.getElementById('labels');
  const heroCopy = document.getElementById('heroCopy');
  const summitCopy = document.getElementById('summitCopy');
  const scrollHint = document.getElementById('scrollHint');
  const caption = stage.querySelector('.stage__caption');
  const shade = stage.querySelector('.stage__shade');
  const card = {
    root: document.getElementById('stageCard'),
    step: document.getElementById('cardStep'),
    bars: [...document.querySelectorAll('#cardProgress i')],
    body: document.getElementById('cardBody'),
    title: document.getElementById('cardTitle'),
    desc: document.getElementById('cardDesc'),
    list: document.getElementById('cardList'),
    peers: document.getElementById('cardPeers')
  };

  /* ---------- Kabinalar ---------- */
  const front = [];
  front.push({ k: 0, name: 'Sizning startapingiz', tag: 'Startup Garage bilan', hero: true });
  SG.cabins.ahead.forEach((c, i) => front.push({ k: i + 1, ...c }));
  SG.cabins.behind.forEach((c, i) => front.push({ k: -(i + 1), ...c }));
  front.forEach((c, i) => {
    c.omega = 2 * Math.PI * (0.52 + ((i * 37) % 11) / 11 * 0.14);  // har biriga o'z chastotasi
    c.phase = i * 1.7;
    c.th = 0; c.om = 0;
    const el = document.createElement('div');
    el.className = 'lbl cab-tag' + (c.hero ? ' cab-tag--hero' : '');
    el.innerHTML = `<div class="cab-tag__in"><span class="cab-tag__name">${c.name}</span><span class="cab-tag__meta">${c.tag}</span></div>`;
    el.style.opacity = '0';
    labelsEl.appendChild(el);
    c.el = el; c.lx = -1e4; c.ly = -1e4; c.lo = -1; c.w = 0; c.dx = 0;
  });

  /* ---------- Bosqich belgilari (milestones) ---------- */
  const milestones = SG.stages.map((s, i) => {
    const el = document.createElement('div');
    el.className = 'lbl ms';
    el.innerHTML = `<div class="ms__in"><span class="ms__pill"><em>0${i + 1}</em>${s.short}</span><span class="ms__stem"></span><span class="ms__dot"></span></div>`;
    labelsEl.appendChild(el);
    return { t: Math.max(s.t, 0.05) + (i === 0 ? 0 : 0.012), el, pill: el.querySelector('.ms__pill'), done: null, lx: -1e4, ly: -1e4, lo: -1, stem: -1, w: 0, dx: 0 };
  });

  /* ---------- Unicorn yorlig'i ---------- */
  const uniEl = document.createElement('div');
  uniEl.className = 'lbl uni';
  uniEl.innerHTML = '<div class="uni__in"><svg class="uni__spark" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0c.5 4.2 1.8 6.6 8 8-6.2 1.4-7.5 3.8-8 8-.5-4.2-1.8-6.6-8-8 6.2-1.4 7.5-3.8 8-8Z"/></svg><span class="uni__t">Unicorn</span><span class="uni__v">$1B+</span></div>';
  uniEl.style.opacity = '0';
  labelsEl.appendChild(uniEl);
  let uniLx = -1e4, uniLy = -1e4, uniLo = -1, uniW = 0, uniDx = 0;

  /* ---------- Rasmlar ---------- */
  const imgs = { bg: null, body: null, grip: null, glow: null, sky: null, uni: null };
  let bgHiReady = false;
  function loadImg(src) {
    return new Promise((res, rej) => {
      const im = new Image(); im.decoding = 'async'; im.src = src;
      im.onload = () => {
        // decode() fon tabida osilib qolishi mumkin — 900ms dan keyin baribir davom etamiz
        const d = im.decode ? Promise.race([im.decode().catch(() => {}), new Promise((r) => setTimeout(r, 900))]) : Promise.resolve();
        d.then(() => res(im));
      };
      im.onerror = rej;
    });
  }
  function tintGlow(im) {
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(122, 128, 255)'; g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  /* ---------- Tuman (procedural sprite) ---------- */
  function makeMist() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 384;
    const g = c.getContext('2d');
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 34; i++) {
      const x = 120 + rnd() * 784, y = 150 + rnd() * 110, r = 50 + rnd() * 120;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.32)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    return c;
  }
  const mist = makeMist();
  // [x, y, width, alpha, drift px/s, parallax]
  const MIST_BACK = [[160, 520, 760, 0.55, 3.2, 1], [760, 470, 620, 0.42, -2.4, 1], [1180, 880, 820, 0.5, 2.0, 1]];
  const MIST_FRONT = [[-160, 905, 1100, 0.55, 5.5, 1.22], [980, 960, 1150, 0.5, -4.5, 1.28]];

  /* ---------- Holat ---------- */
  let vw = 0, vh = 0, dpr = 1;
  let pTarget = 0, p = 0;
  let tHero = 0, tPrev = 0, vPrev = 0, accel = 0;
  let time = 0, last = performance.now();
  let running = false, inView = true;
  let stageIdx = -1;
  const P = { x: 0, y: 0, size: 0, ang: 0 };
  const cam = { x: 0, y: 0, s: 1, wideX: 0, wideY: 0 };

  function resize() {
    vw = stage.clientWidth; vh = stage.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (vw * dpr > 4096) dpr = 4096 / vw;           // 4K chegarasi
    const cw = Math.round(vw * dpr), ch = Math.round(vh * dpr);
    // iOS manzil qatori skrollda resize yuboradi — o'lcham o'zgarmasa canvas qayta yaratilmaydi
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw; canvas.height = ch; signCv.width = cw; signCv.height = ch;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';   // 'high' harakatda CPU bicubic → ~25fps; 'medium' = GPU mipmap → 60fps
    }
    measureLabels(); readScroll(); kick();
  }

  // Yorliqlar kengligi (ekran chetiga chiqib ketmasligi uchun) — bir marta o'lchanadi
  function c_resetLabels() { for (const c of front) c.lx = -1e4; for (const m of milestones) m.lx = -1e4; uniLx = -1e4; kick(); }
  function measureLabels() {
    for (const c of front) c.w = c.el.firstElementChild.offsetWidth;
    for (const m of milestones) m.w = m.pill.offsetWidth;
    uniW = uniEl.firstElementChild.offsetWidth;
  }
  // nuqta markazli yorliqni ekran ichida ushlab turish uchun siljish (px)
  function edgeShift(cx, w, pad = 10) {
    const l = cx - w / 2, r = cx + w / 2;
    if (l < pad) return pad - l;
    if (r > vw - pad) return vw - pad - r;
    return 0;
  }

  let snapped = false;
  function readScroll() {
    const top = journey.offsetTop, h = journey.offsetHeight - vh;
    const raw = (window.scrollY - top) / Math.max(h, 1);
    pTarget = clamp(raw);
    // sahna chiqib ketmoqda — yakuniy holatga darhol (tez skrollda ham pastki chegara oq bo'ladi)
    if (raw >= 1 && p < 1) { p = 1; snapped = true; }
  }

  /* ---------- Kamera ---------- */
  function updateCamera() {
    const narrow = vw / vh < 0.95;
    const base = Math.max(vw / IMG_W, vh / IMG_H);
    pointAt(UP, tHero, P);
    const fx = P.x + P.size * 0.06, fy = P.y + P.size * 0.55;
    const follow = narrow ? 1 : smooth(0.0, 0.2, p);
    const zoom = narrow ? 1 + 0.12 * smooth(0.05, 0.3, p) * (1 - smooth(0.85, 1, p))
                        : 1 + 0.55 * follow - 0.22 * smooth(0.72, 0.97, p);   // cho'qqida biroz orqaga

    const s = base * zoom;
    const viewW = vw / s, viewH = vh / s;
    const ax = narrow ? lerp(0.76, 0.5, smooth(0.03, 0.15, p)) : lerp(0.42, 0.58, smooth(0.03, 0.16, p)), ay = narrow ? 0.36 : 0.44;
    const wideX = (IMG_W - viewW) * 0.5, wideY = (IMG_H - viewH) * 0.34;
    let x = lerp(wideX, fx - ax * viewW, follow);
    let y = lerp(wideY, fy - ay * viewH, follow);
    const x1 = clamp(x, 0, IMG_W - viewW), y1 = clamp(y, imgs.sky ? -SKY_EXT : 0, IMG_H - viewH);
    cam.wideX = clamp(wideX, 0, IMG_W - viewW); cam.wideY = clamp(wideY, 0, IMG_H - viewH);

    // Outro: cho'qqidan keyin kamera butun yo'l bo'ylab pastga — Startup Garage binosiga qaytadi.
    // Rasm tagi (bino ostidagi oqlik) ekran pastiga keladi → sahna oq rang bilan tugaydi.
    const o = outro();
    if (o <= 0) { cam.x = x1; cam.y = y1; cam.s = s; cam.shift = 0; return; }
    const s2 = base, w2 = vw / s2, h2 = vh / s2;
    const x2 = narrow ? clamp(300 - w2 * 0.5, 0, IMG_W - w2) : clamp((IMG_W - w2) * 0.5, 0, IMG_W - w2);
    const y2 = IMG_H + 4 - h2;
    const cx = lerp(x1 + viewW / 2, x2 + w2 / 2, o), cy = lerp(y1 + viewH / 2, y2 + h2 / 2, o);
    const sc = lerp(s, s2, o);
    cam.s = sc;
    cam.x = clamp(cx - vw / (2 * sc), 0, IMG_W - vw / sc);
    cam.y = cy - vh / (2 * sc);                       // pastga — rasm chegarasidan o'tishi mumkin (u yer oq)
    cam.shift = (cam.y - y1) * sc;                    // kontent ekranda qancha yuqoriga surildi
  }
  function outro() { return easeInOut(smooth(0.948, 1, p)); }

  /* ---------- Chizish ---------- */
  function drawCable(spans, alpha) {
    ctx.strokeStyle = `rgba(44, 48, 58, ${alpha})`;
    ctx.lineCap = 'round';
    for (const sp of spans) {
      const N = 6;
      for (let i = 0; i < N; i++) {
        const a = sp.a + (sp.b - sp.a) * (i / N), b = sp.a + (sp.b - sp.a) * ((i + 1) / N);
        pointAt(spans, a + 1e-6, P); const x0 = P.x, y0 = P.y, s0 = P.size;
        pointAt(spans, b - 1e-6, P);
        ctx.lineWidth = ((s0 + P.size) / 2) * 0.0155;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(P.x, P.y); ctx.stroke();
      }
    }
  }

  // Kabina: (x,y) — ilgak markazi kanatda, size — balandlik (sahna px)
  function drawCabin(x, y, size, ang, swing, alpha, glow) {
    const k = size / SPR.h;
    const gx = SPR.gripC.x, gy = SPR.gripC.y, px = SPR.pivot.x, py = SPR.pivot.y;
    // pivot (osma tirgak tepasi) — ilgak kanat burchagi bo'yicha aylangan
    const dx = (px - gx) * k, dy = (py - gy) * k;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const pvx = x + dx * ca - dy * sa, pvy = y + dx * sa + dy * ca;
    ctx.globalAlpha = alpha;
    // korpus
    ctx.save();
    ctx.translate(pvx, pvy); ctx.rotate(swing);
    if (glow > 0) {
      ctx.globalAlpha = alpha * glow;
      const gp = SPR.glowPad;
      ctx.drawImage(imgs.glow, (-px - gp) * k, (-py - gp) * k, imgs.glow.width * k, imgs.glow.height * k);
      ctx.globalAlpha = alpha;
    }
    ctx.drawImage(imgs.body, -px * k, -py * k, imgs.body.width * k, imgs.body.height * k);
    ctx.restore();
    // ilgak (kanat burchagida)
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang * 0.85);
    ctx.drawImage(imgs.grip, -gx * k, -gy * k, imgs.grip.width * k, imgs.grip.height * k);
    ctx.restore();
    ctx.globalAlpha = 1;
    // pastki markaz (label uchun), sahna koordinatalarida
    const L = (SPR.h - py) * k;
    return { bx: pvx - Math.sin(swing) * L, by: pvy + Math.cos(swing) * L };
  }

  function drawMist(list, layerAlpha) {
    for (const [x, y, w, a, drift, pf] of list) {
      const h = w * (mist.height / mist.width);
      // parallaks: yaqin qatlam kamerani tezroq "quvadi"
      const ox = (cam.x - cam.wideX) * (pf - 1), oy = (cam.y - cam.wideY) * (pf - 1);
      let mx = x + (REDUCED ? 0 : (time * drift) % 260) - ox;
      ctx.globalAlpha = a * layerAlpha;
      ctx.drawImage(mist, mx, y - h * 0.5 - oy, w * pf, h * pf);
    }
    ctx.globalAlpha = 1;
  }

  // Cho'qqiga yetganda — yumshoq signal halqalari
  function beacon(x, y, size, a) {
    const arrive = smooth(0.9, 0.97, p) * a;
    if (arrive < 0.01) return;
    const cx = x, cy = y + size * 0.62;
    ctx.lineWidth = size * 0.022;
    for (let n = 0; n < 2; n++) {
      const ph = ((time * 0.55) + n * 0.5) % 1;
      ctx.strokeStyle = `rgba(122, 128, 255, ${(0.55 * (1 - ph) * arrive).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(cx, cy, size * (0.55 + 0.9 * ph), 0, Math.PI * 2); ctx.stroke();
    }
  }

  // Bino tagidan (y≈905) rasm chetigacha (y=1024) oqqa singish. Egri: smoothstep(t)^1.5 —
  // boshlanishi sezilmaydi, oxiri toza oqqa yumshoq qo'nadi. Rasm koordinatalarida → har doim bino ostida.
  const WHITE_TOP = 905;
  const WHITE_STOPS = [0, .005, .034, .1, .209, .354, .522, .694, .848, .958, 1];
  function groundWhite() {
    const k = smooth(0.8, 0.95, p);
    if (k <= 0) return;
    const g = ctx.createLinearGradient(0, WHITE_TOP, 0, IMG_H);
    WHITE_STOPS.forEach((a, i) => g.addColorStop(i / 10, `rgba(255,255,255,${(a * k).toFixed(3)})`));
    ctx.fillStyle = g;
    ctx.fillRect(-20, WHITE_TOP, IMG_W + 40, IMG_H - WHITE_TOP + 1);
  }

  // Unicorn: doim bilinar-bilinmas; kabina cho'qqiga yetganda yorqinlashadi, shox uchida yaltirash
  const uniHorn = { x: 0, y: 0 };
  function arrive() { return smooth(0.85, 0.92, p); }
  function drawUnicorn() {
    if (!imgs.uni) return;
    const a = arrive();
    const w = UNI.w * (1 + (REDUCED ? 0 : 0.012 * Math.sin(time * 0.13))), h = w * UNI.sh / UNI.sw;
    const x = UNI.cx - w / 2 + (REDUCED ? 0 : Math.sin(time * 0.07) * 4);
    const y = UNI.cy - h / 2 + (REDUCED ? 0 : Math.sin(time * 0.11) * 1.2);
    ctx.globalAlpha = 0.2 + 0.38 * a;                     // bilinar-bilinmas → yetib kelganda biroz aniqroq
    ctx.drawImage(imgs.uni, x, y, w, h);
    ctx.globalAlpha = 1;
    uniHorn.x = x + UNI.hornX * w / UNI.sw; uniHorn.y = y + UNI.hornY * h / UNI.sh;
    if (a > 0.01) glint(uniHorn.x, uniHorn.y, a);
  }
  function glint(x, y, a) {
    const pulse = REDUCED ? 1 : 0.65 + 0.35 * Math.sin(time * 2.2);
    const r = 9 * (0.85 + 0.15 * pulse);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${(0.9 * a * pulse).toFixed(3)})`);
    g.addColorStop(0.35, `rgba(222,226,255,${(0.42 * a * pulse).toFixed(3)})`);
    g.addColorStop(1, 'rgba(210,216,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    const L = 12 * pulse;                                  // 4 nurli yulduzcha
    ctx.strokeStyle = `rgba(255,255,255,${(0.7 * a * pulse).toFixed(3)})`; ctx.lineWidth = 0.55; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L * 0.8); ctx.lineTo(x, y + L * 0.8); ctx.stroke();
  }

  function cabinAlpha(t) {
    return smooth(-0.035, 0.012, t) * (1 - smooth(0.968, 0.995, t));
  }

  // Tunda bino peshtoqi yozuvi neon bo'lib yonadi (tint qatlami ustida, o'z canvasida)
  function drawSign() {
    SIGN.k += (timeLevel() - SIGN.k) * 0.04;
    const on = SIGN.img && SIGN.k > 0.01;
    if (!on) { if (SIGN.dirty) { sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, signCv.width, signCv.height); SIGN.dirty = false; } return; }
    const s = cam.s * dpr;
    const hum = REDUCED ? 1 : 0.94 + 0.06 * Math.sin(time * 3.1) + (Math.sin(time * 0.9) > 0.985 ? -0.3 : 0);
    sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, signCv.width, signCv.height);
    sctx.setTransform(s, 0, 0, s, -cam.x * s, -cam.y * s);
    sctx.globalAlpha = clamp(SIGN.k * hum); sctx.drawImage(SIGN.img, SIGN.x, SIGN.y, SIGN.w, SIGN.h);
    sctx.globalCompositeOperation = 'lighter'; sctx.globalAlpha = clamp(SIGN.k * hum * 0.55);
    sctx.drawImage(SIGN.img, SIGN.x, SIGN.y, SIGN.w, SIGN.h); sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 1;
    SIGN.dirty = true;
  }

  const drawList = [];
  function render() {
    drawSign();
    const s = cam.s * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);   // rasmdan tashqari — oq
    ctx.setTransform(s, 0, 0, s, -cam.x * s, -cam.y * s);
    if (imgs.bg) ctx.drawImage(imgs.bg, 0, 0, IMG_W, IMG_H);
    if (imgs.sky) ctx.drawImage(imgs.sky, 0, -SKY_EXT, IMG_W, SKY_EXT + SKY_OVER);
    drawUnicorn();

    drawMist(MIST_BACK, 1);
    groundWhite();
    if (!imgs.body) return;

    // --- orqa kanat (faqat chiziq — rasmdagi kanatni tiniqlashtiradi)
    drawCable(DOWN, 0.55);

    // --- old kanat
    drawCable(UP, 0.7);
    drawList.length = 0;
    for (const c of front) {
      const t = tHero + c.k * GAP;
      c.t = t;
      if (t < -0.04 || t > 1.03) { c.vis = false; continue; }
      c.vis = true;
      pointAt(UP, t, P);
      drawList.push({ c, t, x: P.x, y: P.y, size: P.size, ang: P.ang });
    }
    drawList.sort((a, b) => b.t - a.t);
    for (const d of drawList) {
      const a = cabinAlpha(d.t);
      const glow = d.c.hero ? 0.75 + 0.25 * Math.sin(time * 2.4) : 0;
      const b = drawCabin(d.x, d.y, d.size, d.ang, d.c.th, a, glow);
      d.c.bx = b.bx; d.c.by = b.by; d.c.size = d.size; d.c.alpha = a;
      if (d.c.hero) beacon(d.x, d.y, d.size, a);
    }

    drawMist(MIST_FRONT, 1 - 0.4 * smooth(0.0, 0.25, p));
  }

  /* ---------- Fizika (mayatnik) ---------- */
  function physics(dt) {
    if (REDUCED) return;
    const zeta = 0.11, K = 9.5;
    const sub = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / sub;
    for (let n = 0; n < sub; n++) {
      for (const c of front) {
        const wind = 0.010 * Math.sin(time * 1.25 + c.phase) + 0.005 * Math.sin(time * 2.9 + c.phase * 1.3);
        const f = -c.omega * c.omega * (c.th - wind) - 2 * zeta * c.omega * c.om + K * accel;
        c.om += f * h; c.th += c.om * h;
        c.th = clamp(c.th, -0.22, 0.22);
      }
    }
  }

  /* ---------- Overlay (DOM) ---------- */
  function toScreen(x, y) { return [(x - cam.x) * cam.s, (y - cam.y) * cam.s]; }

  function updateLabels() {
    const narrow = vw < 640;
    for (const c of front) {
      let o = 0, sx = c.lx, sy = c.ly;
      if (c.vis && c.alpha > 0.01) {
        [sx, sy] = toScreen(c.bx, c.by);
        const px = c.size * cam.s;                       // ekrandagi kabina balandligi
        o = c.alpha * (c.hero ? 1 : smooth(46, 62, px));
        if (narrow && !c.hero) o = 0;
        o *= smooth(96, 130, sy - px * 0.9) * (1 - smooth(vh - 70, vh - 30, sy));
        if (sx < -120 || sx > vw + 120) o = 0;
        sy += 6;
      }
      if (Math.abs(sx - c.lx) > 0.05 || Math.abs(sy - c.ly) > 0.05) {
        c.el.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0)`;
        c.lx = sx; c.ly = sy;
        const dx = Math.round(edgeShift(sx, c.w));
        if (dx !== c.dx) { c.el.style.setProperty('--dx', dx + 'px'); c.dx = dx; }
      }
      const oq = Math.round(o * 100) / 100;
      if (oq !== c.lo) { c.el.style.opacity = oq; c.lo = oq; }
    }
    for (const m of milestones) {
      pointAt(UP, m.t, P);
      const [sx, sy] = toScreen(P.x, P.y);
      const stem = Math.round(clamp(P.size * cam.s * 0.42, 22, 64));
      let o = smooth(118, 150, sy - stem - 34) * (1 - smooth(vh - 90, vh - 40, sy));
      if (sx < -6 || sx > vw + 6) o = 0;                     // tayoqcha ekrandan chiqsa — yashiriladi
      o *= smooth(0.0, 0.03, p + 0.03);
      if (stem !== m.stem) { m.el.style.setProperty('--stem', stem + 'px'); m.stem = stem; }
      if (Math.abs(sx - m.lx) > 0.05 || Math.abs(sy - m.ly) > 0.05) {
        m.el.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0)`;
        m.lx = sx; m.ly = sy;
        const dx = Math.round(edgeShift(sx, m.w));          // faqat yorliq siljiydi, tayoqcha kanatda qoladi
        if (dx !== m.dx) { m.el.style.setProperty('--dx', dx + 'px'); m.dx = dx; }
      }
      const oq = Math.round(o * 100) / 100;
      if (oq !== m.lo) { m.el.style.opacity = oq; m.lo = oq; }
      const done = tHero >= m.t - 0.006;
      if (done !== m.done) { m.el.classList.toggle('is-done', done); m.done = done; }
    }
    if (imgs.uni) {
      const [sx, sy] = toScreen(UNI.cx - UNI.w * 0.39, UNI.cy - 6);
      let o = smooth(0.875, 0.935, p) * smooth(96, 124, sy) * (1 - smooth(vh - 90, vh - 40, sy));
      if (Math.abs(sx - uniLx) > 0.05 || Math.abs(sy - uniLy) > 0.05) {
        uniEl.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0)`;
        uniLx = sx; uniLy = sy;
        const dx = Math.round(edgeShift(sx - uniW / 2, uniW));   // o'ngga tekislangan yorliq
        if (dx !== uniDx) { uniEl.style.setProperty('--dx', dx + 'px'); uniDx = dx; }
      }
      const oq = Math.round(o * 100) / 100;
      if (oq !== uniLo) { uniEl.style.opacity = oq; uniLo = oq; }
    }
  }

  function setCard(i) {
    const s = SG.stages[i];
    card.step.textContent = `Bosqich 0${i + 1} / 0${SG.stages.length}`;
    card.title.textContent = s.title;
    card.desc.textContent = s.desc;
    card.list.innerHTML = s.help.map((h) => `<li>${h}</li>`).join('');
    card.peers.innerHTML = `${s.peersLabel || 'Bu bosqichda'}: <b>${s.peers.join(', ')}</b>`;
  }
  let swapTimer = 0;
  function updateCard() {
    const st = SG.stages;
    let i = 0;
    for (let n = 0; n < st.length; n++) if (tHero >= st[n].t - 0.004) i = n;
    if (i !== stageIdx) {
      const first = stageIdx < 0;
      stageIdx = i;
      if (first) setCard(i);
      else {
        clearTimeout(swapTimer);
        card.body.classList.add('is-swap');
        swapTimer = setTimeout(() => { setCard(stageIdx); card.body.classList.remove('is-swap'); }, 220);
      }
    }
    card.bars.forEach((b, n) => {
      const a = st[n].t, z = n + 1 < st.length ? st[n + 1].t : T_END;
      const f = clamp((tHero - a) / (z - a));
      const fq = Math.round(f * 1000) / 1000;
      if (b._f !== fq) { b.style.setProperty('--f', fq); b._f = fq; }
    });
  }

  let lastHero = -1, lastSummit = -1, lastSummitY = 0, lastShade = -1, lastHint = -1, lastCard = -1, cardLeft = null;
  function updateCopy() {
    const h = 1 - smooth(0.0, 0.075, p);
    if (Math.abs(h - lastHero) > 0.001) {
      heroCopy.style.opacity = h.toFixed(3);
      heroCopy.style.transform = `translate3d(0, ${(-48 * (1 - h)).toFixed(2)}px, 0)`;
      heroCopy.style.visibility = h < 0.01 ? 'hidden' : 'visible';
      lastHero = h;
    }
    const o = outro();
    const smIn = smooth(0.885, 0.925, p);
    const sm = smIn * (1 - smooth(0.15, 0.6, o));
    const smY = 36 * (1 - smIn) - (vw > 960 ? (cam.shift || 0) : 0);
    if (Math.abs(sm - lastSummit) > 0.001 || Math.abs(smY - lastSummitY) > 0.1) {
      lastSummitY = smY;
      summitCopy.style.opacity = sm.toFixed(3);
      summitCopy.style.transform = `translate3d(0, ${smY.toFixed(2)}px, 0)`;
      summitCopy.classList.toggle('is-on', sm > 0.01);
      summitCopy.setAttribute('aria-hidden', sm > 0.5 ? 'false' : 'true');
      lastSummit = sm;
    }
    // tepadagi oqartiruvchi soya: desktop'da cho'qqi matni tepada (soya qaytadi); telefonda matn pastki kartada — soya kerak emas
    const summitTop = vw > 960 || vh <= 520;
    const sh = 1 - 0.7 * smooth(0.03, 0.12, p) + (summitTop ? 0.7 * smooth(0.86, 0.95, p) : 0) - 0.7 * smooth(0.25, 0.75, o);
    if (Math.abs(sh - lastShade) > 0.002) { shade.style.setProperty('--shade', sh.toFixed(3)); lastShade = sh; }
    // karta: boshida o'ngda (hero), sayohat davomida chapda — kabina doim ko'rinib turadi
    const narrow = vw <= 960;
    const left = !narrow && p > 0.07;
    if (left !== cardLeft) { card.root.classList.toggle('card--left', left); cardLeft = left; }
    const cv = narrow ? smooth(0.04, 0.09, p) * (1 - smooth(0.88, 0.92, p))
      : (p <= 0.07 ? 1 - smooth(0.035, 0.065, p) : smooth(0.075, 0.115, p) * (1 - smooth(0.865, 0.9, p)));
    if (Math.abs(cv - lastCard) > 0.001) {
      card.root.style.opacity = cv.toFixed(3);
      card.root.style.transform = `translate3d(0, ${(24 * (1 - cv)).toFixed(2)}px, 0)`;
      card.root.style.visibility = cv < 0.01 ? 'hidden' : 'visible';
      lastCard = cv;
    }
    const hi = 1 - smooth(0.005, 0.04, p);
    if (Math.abs(hi - lastHint) > 0.01) {
      scrollHint.style.opacity = hi.toFixed(2); caption.style.opacity = hi.toFixed(2);
      shade.style.setProperty('--vig', hi.toFixed(2)); lastHint = hi;   // hint bilan bir xil diapazon — qotib qolmaydi
    }
  }

  /* ---------- Asosiy sikl ---------- */
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now; time += dt;

    // scroll silliqlash (eksponensial, kadr chastotasidan mustaqil)
    const k = REDUCED ? 30 : 7.2;
    p += (pTarget - p) * (1 - Math.exp(-dt * k));
    if (Math.abs(pTarget - p) < 1e-5) p = pTarget;

    tHero = lerp(T_START, T_END, easeJourney(clamp((p - 0.045) / (0.9 - 0.045))));
    if (snapped) { tPrev = tHero; vPrev = 0; accel = 0; snapped = false; }   // sakrashda tebranish bo'lmasin
    const v = (tHero - tPrev) / dt;
    const aRaw = (v - vPrev) / dt;
    accel += (clamp(aRaw, -40, 40) - accel) * (1 - Math.exp(-dt * 18));
    tPrev = tHero; vPrev = v;

    physics(dt);
    updateCamera();
    render();
    updateLabels();
    updateCard();
    updateCopy();

    if (running) requestAnimationFrame(frame);
  }

  function kick() {
    if (!running && inView) { running = true; last = performance.now(); requestAnimationFrame(frame); }
  }

  new IntersectionObserver((ents) => {
    inView = ents[0].isIntersecting;
    if (inView) kick(); else running = false;
  }, { rootMargin: '100px' }).observe(stage);

  window.addEventListener('scroll', () => { readScroll(); kick(); }, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { last = performance.now(); kick(); } });


  /* ---------- Yuklash ---------- */
  resize();
  setCard(0); stageIdx = 0;
  setTimeout(() => stage.classList.add('is-booted'), 30);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureLabels(); c_resetLabels(); });
  Promise.all([
    loadImg('assets/scene-1536.webp'),
    loadImg('assets/cabin-body.png'),
    loadImg('assets/cabin-grip.png'),
    loadImg('assets/cabin-glow.png')
  ]).then(([bg, body, grip, glow]) => {
    imgs.bg = bg; imgs.body = body; imgs.grip = grip; imgs.glow = tintGlow(glow);
    stage.classList.add('is-ready');
    kick();
    // 4K fon — fon rejimida yuklanadi va almashtiriladi
    const big = Math.max(vw, vh) * dpr > 1600;
    if (big) loadImg('assets/scene-4k.webp').then((hi) => { imgs.bg = hi; bgHiReady = true; kick(); }).catch(() => {});
    loadImg('assets/sign-neon.png').then((im) => { SIGN.img = im; kick(); }).catch(() => {});
    loadImg('assets/sky-top.webp').then((im) => { imgs.sky = im; kick(); }).catch(() => {});
    loadImg('assets/unicorn-cloud.webp').then((im) => { imgs.uni = im; kick(); }).catch(() => {});
  });

  window.__sgScene = { get p() { return p; }, get tHero() { return tHero; }, get hiRes() { return bgHiReady; } };
})();
