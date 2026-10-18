/* Sof matematika: interpolyatsiya, easing, kanat yo'li */

export const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeInOut = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const easeJourney = (x) => lerp(x, easeInOut(x), 0.55);   // yumshoq start/finish, o'rtada bir tekis

/* Tugunlar ro'yxatidan kanat yo'li: har span uchun perspektivaga normallashgan "dunyo" uzunligi,
   a..b — yo'l bo'ylab normallashgan [0..1] oraliq */
export function buildPath(nodes) {
  const spans = []; let total = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    const [x0, y0, s0] = nodes[i], [x1, y1, s1] = nodes[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const w = len / ((s0 + s1) / 2);
    spans.push({ x0, y0, s0, x1, y1, s1, w, ang: Math.atan2(y1 - y0, x1 - x0) });
    total += w;
  }
  let acc = 0;
  for (const s of spans) { s.a = acc / total; acc += s.w; s.b = acc / total; }
  return spans;
}

/* Yo'ldagi t ∈ [0..1] nuqta: perspektivaga to'g'ri interpolyatsiya (z = 1/size bo'yicha).
   out = { x, y, size, ang } — ajratmasdan qayta ishlatiladi */
export function pointAt(spans, t, out) {
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
