/* Rasmlarni yuklash va tayyorlash */
import { ASSETS } from './config.js';
import { imgs, S } from './state.js';

export function loadImg(src) {
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

// Kabina nuri — brend rangiga bo'yaladi
function tintGlow(im) {
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(122, 128, 255)'; g.fillRect(0, 0, c.width, c.height);
  return c;
}

// Tuman — protsedural sprite (deterministik seed)
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

/* Birinchi kadr uchun zarur rasmlar → onReady; qolganlari fonda yuklanib, kelganda onUpdate */
export function loadAll(onReady, onUpdate) {
  imgs.mist = makeMist();
  return Promise.all([loadImg(ASSETS.bg), loadImg(ASSETS.body), loadImg(ASSETS.grip), loadImg(ASSETS.glow)])
    .then(([bg, body, grip, glow]) => {
      imgs.bg = bg; imgs.body = body; imgs.grip = grip; imgs.glow = tintGlow(glow);
      onReady();
      const later = (key, src, after) => loadImg(src).then((im) => { imgs[key] = im; if (after) after(); onUpdate(); }).catch(() => {});
      // 4K fon — faqat katta ekranlarda, fon rejimida almashtiriladi
      if (Math.max(S.vw, S.vh) * S.dpr > 1600) later('bg', ASSETS.bg4k, () => { S.bgHiReady = true; });
      later('sign', ASSETS.sign);
      later('sky', ASSETS.sky);
      later('uni', ASSETS.uni);
    });
}
