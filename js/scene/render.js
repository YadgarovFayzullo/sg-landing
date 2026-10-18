/* Canvas renderer. Hamma narsa sahna koordinatalarida (1536×1024) chiziladi,
   kamera — bitta setTransform. Qatlamlar tartibi render() da. */
import { IMG_W, IMG_H, SKY_EXT, SKY_OVER, SPR, UNI, SIGN, WHITE_TOP, WHITE_STOPS, MIST_BACK, MIST_FRONT, GAP, TINT, SIGN_GLOW, THEME_FADE } from './config.js';
import { clamp, smooth, pointAt } from './math.js';
import { S, cam, P, imgs, UP, DOWN, REDUCED, theme, PHASES, themePhase } from './state.js';
import { front } from './entities.js';
import { canvas, ctx } from './dom.js';

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

// Kabina: (x,y) — ilgak markazi kanatda, size — balandlik (sahna px). Qaytaradi: pastki markaz (yorliq uchun)
function drawCabin(x, y, size, ang, swing, alpha, glow) {
  const k = size / SPR.h;
  const gx = SPR.gripC.x, gy = SPR.gripC.y, px = SPR.pivot.x, py = SPR.pivot.y;
  // pivot (osma tirgak tepasi) — ilgak kanat burchagi bo'yicha aylangan
  const dx = (px - gx) * k, dy = (py - gy) * k;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const pvx = x + dx * ca - dy * sa, pvy = y + dx * sa + dy * ca;
  ctx.globalAlpha = alpha;
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
  const L = (SPR.h - py) * k;
  return { bx: pvx - Math.sin(swing) * L, by: pvy + Math.cos(swing) * L };
}

function drawMist(list, layerAlpha) {
  const mist = imgs.mist;
  for (const [x, y, w, a, drift, pf] of list) {
    const h = w * (mist.height / mist.width);
    // parallaks: yaqin qatlam kamerani tezroq "quvadi"
    const ox = (cam.x - cam.wideX) * (pf - 1), oy = (cam.y - cam.wideY) * (pf - 1);
    const mx = x + (REDUCED ? 0 : (S.time * drift) % 260) - ox;
    ctx.globalAlpha = a * layerAlpha;
    ctx.drawImage(mist, mx, y - h * 0.5 - oy, w * pf, h * pf);
  }
  ctx.globalAlpha = 1;
}

// Cho'qqiga yetganda — yumshoq signal halqalari
function beacon(x, y, size, a) {
  const arrive = smooth(0.9, 0.97, S.p) * a;
  if (arrive < 0.01) return;
  const cx = x, cy = y + size * 0.62;
  ctx.lineWidth = size * 0.022;
  for (let n = 0; n < 2; n++) {
    const ph = ((S.time * 0.55) + n * 0.5) % 1;
    ctx.strokeStyle = `rgba(122, 128, 255, ${(0.55 * (1 - ph) * arrive).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(cx, cy, size * (0.55 + 0.9 * ph), 0, Math.PI * 2); ctx.stroke();
  }
}

// Bino tagidan rasm chetigacha oqqa singish — tint qatlamidan KEYIN: sahna oq bilan tugaydi (keyingi seksiya oq)
function groundWhite() {
  const k = smooth(0.8, 0.95, S.p);
  if (k <= 0) return;
  const g = ctx.createLinearGradient(0, WHITE_TOP, 0, IMG_H);
  WHITE_STOPS.forEach((a, i) => g.addColorStop(i / 10, `rgba(255,255,255,${(a * k).toFixed(3)})`));
  ctx.fillStyle = g;
  ctx.fillRect(-20, WHITE_TOP, IMG_W + 40, IMG_H - WHITE_TOP + 1);
}

// Unicorn: doim bilinar-bilinmas; kabina cho'qqiga yetganda yorqinlashadi, shox uchida yaltirash
export function arrive() { return smooth(0.85, 0.92, S.p); }
function drawUnicorn() {
  if (!imgs.uni) return;
  const a = arrive(), t = S.time;
  const w = UNI.w * (1 + (REDUCED ? 0 : 0.012 * Math.sin(t * 0.13))), h = w * UNI.sh / UNI.sw;
  const x = UNI.cx - w / 2 + (REDUCED ? 0 : Math.sin(t * 0.07) * 4);
  const y = UNI.cy - h / 2 + (REDUCED ? 0 : Math.sin(t * 0.11) * 1.2);
  ctx.globalAlpha = 0.2 + 0.38 * a;
  ctx.drawImage(imgs.uni, x, y, w, h);
  ctx.globalAlpha = 1;
  if (a > 0.01) glint(x + UNI.hornX * w / UNI.sw, y + UNI.hornY * h / UNI.sh, a);
}
function glint(x, y, a) {
  const pulse = REDUCED ? 1 : 0.65 + 0.35 * Math.sin(S.time * 2.2);
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

/* ---------- Kun vaqti ---------- */
// Tonlar vaqt bo'yicha o'zgaradi: chiziqli progress (THEME_FADE soniya) → smoothstep = CSS ease-in-out bilan bir xil his
const themeRaw = Object.fromEntries(PHASES.map((k) => [k, 0]));
function updateTheme(dt) {
  const cur = themePhase(), step = dt / THEME_FADE;
  for (const k of PHASES) {
    const u = themeRaw[k] = clamp(themeRaw[k] + clamp((k === cur ? 1 : 0) - themeRaw[k], -step, step));
    theme[k] = u * u * (3 - 2 * u);
  }
}
// Rasm maydoni ustiga multiply gradient — faqat rasm ichida (tashqarisi oq qoladi)
function drawTint() {
  for (const key of PHASES) {
    const k = theme[key];
    if (k < 0.005) continue;
    const g = ctx.createLinearGradient(0, -SKY_EXT, 0, IMG_H);
    TINT[key].forEach((c, i, arr) => g.addColorStop(i / (arr.length - 1), c));
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = k;
    ctx.fillStyle = g;
    ctx.fillRect(0, -SKY_EXT, IMG_W, IMG_H + SKY_EXT);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}
// Bino peshtoqidagi "STARTUP GARAGE" — neon, yorqinligi fazaga qarab (SIGN_GLOW); additiv, tint ustidan
function drawSign() {
  let k = 0;
  for (const key of PHASES) k += theme[key] * (SIGN_GLOW[key] || 0);
  if (!imgs.sign || k < 0.01) return;
  const t = S.time;
  const hum = REDUCED ? 1 : 0.94 + 0.06 * Math.sin(t * 3.1) + (Math.sin(t * 0.9) > 0.985 ? -0.3 : 0);
  const a = clamp(k * hum);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a; ctx.drawImage(imgs.sign, SIGN.x, SIGN.y, SIGN.w, SIGN.h);
  ctx.globalAlpha = a * 0.55; ctx.drawImage(imgs.sign, SIGN.x, SIGN.y, SIGN.w, SIGN.h);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}

/* ---------- Kadr ---------- */
const drawList = [];
export function render(dt) {
  updateTheme(dt);
  const s = cam.s * S.dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);   // rasmdan tashqari — oq
  ctx.setTransform(s, 0, 0, s, -cam.x * s, -cam.y * s);
  if (imgs.bg) ctx.drawImage(imgs.bg, 0, 0, IMG_W, IMG_H);
  if (imgs.sky) ctx.drawImage(imgs.sky, 0, -SKY_EXT, IMG_W, SKY_EXT + SKY_OVER);
  drawUnicorn();
  drawMist(MIST_BACK, 1);

  if (imgs.body) {
    drawCable(DOWN, 0.55);                 // orqa kanat — faqat chiziq, rasmdagi kanatni tiniqlashtiradi
    drawCable(UP, 0.7);                    // old kanat
    drawList.length = 0;
    for (const c of front) {
      const t = S.tHero + c.k * GAP;
      c.t = t;
      if (t < -0.04 || t > 1.03) { c.vis = false; continue; }
      c.vis = true;
      pointAt(UP, t, P);
      drawList.push({ c, t, x: P.x, y: P.y, size: P.size, ang: P.ang });
    }
    drawList.sort((a, b) => b.t - a.t);    // uzoqdan yaqinga
    for (const d of drawList) {
      const a = cabinAlpha(d.t);
      const glow = d.c.hero ? 0.75 + 0.25 * Math.sin(S.time * 2.4) : 0;
      const b = drawCabin(d.x, d.y, d.size, d.ang, d.c.th, a, glow);
      d.c.bx = b.bx; d.c.by = b.by; d.c.size = d.size; d.c.alpha = a;
      if (d.c.hero) beacon(d.x, d.y, d.size, a);
    }
    drawMist(MIST_FRONT, 1 - 0.4 * smooth(0.0, 0.25, S.p));
  }

  drawTint();        // kun vaqti — rasm va kabinalar ustidan
  drawSign();        // neon — tint ustidan, additiv
  groundWhite();     // oxirida: pastki oqlik tintlanmaydi → keyingi oq seksiyaga chok yo'q
}
