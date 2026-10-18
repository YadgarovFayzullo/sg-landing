/* =========================================================
   Startup Garage — kanatli yo'l sahnasi (kirish nuqtasi)
   Scroll-driven canvas: fon (4K), kanat, kabinalar, mayatnik
   fizikasi, tuman, kun vaqti. Har kadr qurilma piksellarida
   (DPR ≤ 2, ≤ 4096px) chiziladi → 4K/60fps.
   Kadr tartibi: input → physics → camera → render → overlay.
   ========================================================= */
import { T_START, T_END } from './config.js';
import { clamp, lerp, easeJourney } from './math.js';
import { S, REDUCED } from './state.js';
import { stage, journey, canvas, ctx } from './dom.js';
import { loadAll } from './assets.js';
import { updateCamera } from './camera.js';
import { render } from './render.js';
import { physics } from './physics.js';
import { measureLabels, resetLabels, updateLabels, updateCard, updateCopy, setCard } from './overlay.js';

function resize() {
  S.vw = stage.clientWidth; S.vh = stage.clientHeight;
  S.dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (S.vw * S.dpr > 4096) S.dpr = 4096 / S.vw;           // 4K chegarasi
  const cw = Math.round(S.vw * S.dpr), ch = Math.round(S.vh * S.dpr);
  // iOS manzil qatori skrollda resize yuboradi — o'lcham o'zgarmasa canvas qayta yaratilmaydi
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw; canvas.height = ch;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';   // 'high' harakatda CPU bicubic → ~25fps; 'medium' = GPU mipmap → 60fps
  }
  measureLabels(); readScroll(); kick();
}

function readScroll() {
  const top = journey.offsetTop, h = journey.offsetHeight - S.vh;
  const raw = (window.scrollY - top) / Math.max(h, 1);
  S.pTarget = clamp(raw);
  // sahna chiqib ketmoqda — yakuniy holatga darhol (tez skrollda ham pastki chegara oq bo'ladi)
  if (raw >= 1 && S.p < 1) { S.p = 1; S.snapped = true; }
}

function frame(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - S.last) / 1000));
  S.last = now; S.time += dt;

  // scroll silliqlash (eksponensial, kadr chastotasidan mustaqil)
  const k = REDUCED ? 30 : 7.2;
  S.p += (S.pTarget - S.p) * (1 - Math.exp(-dt * k));
  if (Math.abs(S.pTarget - S.p) < 1e-5) S.p = S.pTarget;

  S.tHero = lerp(T_START, T_END, easeJourney(clamp((S.p - 0.045) / (0.9 - 0.045))));
  if (S.snapped) { S.tPrev = S.tHero; S.vPrev = 0; S.accel = 0; S.snapped = false; }   // sakrashda tebranish bo'lmasin
  const v = (S.tHero - S.tPrev) / dt;
  const aRaw = (v - S.vPrev) / dt;
  S.accel += (clamp(aRaw, -40, 40) - S.accel) * (1 - Math.exp(-dt * 18));
  S.tPrev = S.tHero; S.vPrev = v;

  physics(dt);
  updateCamera();
  render();
  updateLabels();
  updateCard();
  updateCopy();

  if (S.running) requestAnimationFrame(frame);
}

function kick() {
  if (!S.running && S.inView) { S.running = true; S.last = performance.now(); requestAnimationFrame(frame); }
}

new IntersectionObserver((ents) => {
  S.inView = ents[0].isIntersecting;
  if (S.inView) kick(); else S.running = false;
}, { rootMargin: '100px' }).observe(stage);

window.addEventListener('scroll', () => { readScroll(); kick(); }, { passive: true });
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { S.last = performance.now(); kick(); } });

/* ---------- Boot ---------- */
resize();
setCard(0);
setTimeout(() => stage.classList.add('is-booted'), 30);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureLabels(); resetLabels(); kick(); });
loadAll(() => { stage.classList.add('is-ready'); kick(); }, kick);

window.__sgScene = { get p() { return S.p; }, get tHero() { return S.tHero; }, get hiRes() { return S.bgHiReady; } };
