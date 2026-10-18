/* Kamera: skroll p va hero kabina o'rnidan cam.{x,y,s} */
import { IMG_W, IMG_H, SKY_EXT } from './config.js';
import { clamp, lerp, smooth, easeInOut, pointAt } from './math.js';
import { S, cam, P, imgs, UP } from './state.js';

// Cho'qqidan keyingi "outro" darajasi (0..1)
export function outro() { return easeInOut(smooth(0.948, 1, S.p)); }

export function updateCamera() {
  const { vw, vh, p, tHero } = S;
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
  const x = lerp(wideX, fx - ax * viewW, follow);
  const y = lerp(wideY, fy - ay * viewH, follow);
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
