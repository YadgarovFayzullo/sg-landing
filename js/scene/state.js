/* Sahnaning umumiy holati — modullar o'rtasida bitta ob'ekt orqali bo'lishiladi.
   Hech bir modul o'zining "yashirin" nusxasini saqlamaydi. */
import { UP_NODES, DOWN_NODES, TINT } from './config.js';
import { buildPath } from './math.js';

export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const UP = buildPath(UP_NODES);
export const DOWN = buildPath(DOWN_NODES);

export const S = {
  vw: 0, vh: 0, dpr: 1,
  pTarget: 0, p: 0,            // skroll (nishon / silliqlangan), 0..1
  tHero: 0,                    // hero kabinaning kanatdagi o'rni
  tPrev: 0, vPrev: 0, accel: 0,
  time: 0, last: performance.now(),
  running: false, inView: true, snapped: false,
  bgHiReady: false
};

// Kamera: sahna px → ekran: screen = (scene - cam.{x,y}) * cam.s
export const cam = { x: 0, y: 0, s: 1, wideX: 0, wideY: 0, shift: 0 };

// pointAt uchun qayta ishlatiladigan bufer
export const P = { x: 0, y: 0, size: 0, ang: 0 };

export const imgs = { bg: null, body: null, grip: null, glow: null, sky: null, uni: null, sign: null, mist: null };

// Kun vaqti: har faza uchun joriy daraja (0..1) — render.js silliq o'tkazadi; nishon — html[data-time]
export const PHASES = Object.keys(TINT);
export const theme = Object.fromEntries(PHASES.map((k) => [k, 0]));
export function themePhase() { return document.documentElement.dataset.time; }
