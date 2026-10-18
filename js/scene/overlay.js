/* DOM qatlami: kabina yorliqlari, bosqich belgilari, unicorn yorlig'i, karta, hero/summit matni.
   Har bir yozuv faqat qiymat o'zgarganda style'ga yoziladi (layout thrash yo'q). */
import { T_END, UNI } from './config.js';
import { clamp, smooth, pointAt } from './math.js';
import { S, cam, P, imgs, UP } from './state.js';
import { front, milestones, uni, stageContent } from './entities.js';
import { stages } from '../data.js';
import { card, heroCopy, summitCopy, scrollHint, caption, shade } from './dom.js';
import { outro } from './camera.js';

const toScreen = (x, y) => [(x - cam.x) * cam.s, (y - cam.y) * cam.s];
const q2 = (v) => Math.round(v * 100) / 100;

// nuqta markazli yorliqni ekran ichida ushlab turish uchun siljish (px)
function edgeShift(cx, w, pad = 10) {
  const l = cx - w / 2, r = cx + w / 2;
  if (l < pad) return pad - l;
  if (r > S.vw - pad) return S.vw - pad - r;
  return 0;
}

// Yorliq kengligi — bir marta o'lchanadi (shrift kelganda qayta)
export function measureLabels() {
  for (const c of front) c.w = c.el.firstElementChild.offsetWidth;
  for (const m of milestones) m.w = m.pill.offsetWidth;
  uni.w = uni.el.firstElementChild.offsetWidth;
}
export function resetLabels() {
  for (const c of front) c.lx = -1e4;
  for (const m of milestones) m.lx = -1e4;
  uni.lx = -1e4;
}

// translate3d + --dx yozuvi — uchala yorliq turi uchun umumiy
function place(o, sx, sy, dxFor) {
  if (Math.abs(sx - o.lx) > 0.05 || Math.abs(sy - o.ly) > 0.05) {
    o.el.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0)`;
    o.lx = sx; o.ly = sy;
    const dx = Math.round(dxFor(sx));
    if (dx !== o.dx) { o.el.style.setProperty('--dx', dx + 'px'); o.dx = dx; }
  }
}
function fade(o, op) {
  const oq = q2(op);
  if (oq !== o.lo) { o.el.style.opacity = oq; o.lo = oq; }
}

export function updateLabels() {
  const { vw, vh } = S;
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
    place(c, sx, sy, (x) => edgeShift(x, c.w));
    fade(c, o);
  }
  for (const m of milestones) {
    pointAt(UP, m.t, P);
    const [sx, sy] = toScreen(P.x, P.y);
    const stem = Math.round(clamp(P.size * cam.s * 0.42, 22, 64));
    let o = smooth(118, 150, sy - stem - 34) * (1 - smooth(vh - 90, vh - 40, sy));
    if (sx < -6 || sx > vw + 6) o = 0;                     // tayoqcha ekrandan chiqsa — yashiriladi
    o *= smooth(0.0, 0.03, S.p + 0.03);
    if (stem !== m.stem) { m.el.style.setProperty('--stem', stem + 'px'); m.stem = stem; }
    place(m, sx, sy, (x) => edgeShift(x, m.w));          // faqat yorliq siljiydi, tayoqcha kanatda qoladi
    fade(m, o);
    const done = S.tHero >= m.t - 0.006;
    if (done !== m.done) { m.el.classList.toggle('is-done', done); m.done = done; }
  }
  if (imgs.uni) {
    const [sx, sy] = toScreen(UNI.cx - UNI.w * 0.39, UNI.cy - 6);
    const o = smooth(0.875, 0.935, S.p) * smooth(96, 124, sy) * (1 - smooth(vh - 90, vh - 40, sy));
    place(uni, sx, sy, (x) => edgeShift(x - uni.w / 2, uni.w));   // o'ngga tekislangan yorliq
    fade(uni, o);
  }
}

/* ---------- Bosqich kartasi ---------- */
let stageIdx = -1, swapTimer = 0;
export function setCard(i) {
  const s = stageContent[i];
  card.step.textContent = `Bosqich 0${i + 1} / 0${stages.length}`;
  card.title.textContent = s.title;
  card.desc.textContent = s.desc;
  card.list.innerHTML = s.helpHtml;
  card.peers.innerHTML = `${s.peersLabel}: <b>${s.peers}</b>`;
}
export function updateCard() {
  let i = 0;
  for (let n = 0; n < stages.length; n++) if (S.tHero >= stages[n].t - 0.004) i = n;
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
    const a = stages[n].t, z = n + 1 < stages.length ? stages[n + 1].t : T_END;
    const fq = Math.round(clamp((S.tHero - a) / (z - a)) * 1000) / 1000;
    if (b._f !== fq) { b.style.setProperty('--f', fq); b._f = fq; }
  });
}

/* ---------- Hero / summit matni, soya, karta ko'rinishi ---------- */
let lastHero = -1, lastSummit = -1, lastSummitY = 0, lastShade = -1, lastHint = -1, lastCard = -1, cardLeft = null;
export function updateCopy() {
  const { vw, vh, p } = S;
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
