/* Kabinalar mayatnigi: so'nuvchi ossillyator + shamol + skroll tezlanishi */
import { clamp } from './math.js';
import { S, REDUCED } from './state.js';
import { front } from './entities.js';

export function physics(dt) {
  if (REDUCED) return;
  const zeta = 0.11, K = 9.5;
  const sub = Math.max(1, Math.ceil(dt / (1 / 120)));   // ≥120 Hz sub-qadam — barqarorlik
  const h = dt / sub;
  for (let n = 0; n < sub; n++) {
    for (const c of front) {
      const wind = 0.010 * Math.sin(S.time * 1.25 + c.phase) + 0.005 * Math.sin(S.time * 2.9 + c.phase * 1.3);
      const f = -c.omega * c.omega * (c.th - wind) - 2 * zeta * c.omega * c.om + K * S.accel;
      c.om += f * h; c.th += c.om * h;
      c.th = clamp(c.th, -0.22, 0.22);
    }
  }
}
