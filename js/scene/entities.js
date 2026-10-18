/* Sahna ob'ektlari: kabinalar, bosqich belgilari, unicorn yorlig'i — va ularning DOM yorliqlari */
import { stages, cabins } from '../data.js';
import { labelsEl, routeEl } from './dom.js';

/* ---------- Kabinalar ---------- */
export const front = [];
front.push({ k: 0, hero: true, ...cabins.hero });
cabins.ahead.forEach((c, i) => front.push({ k: i + 1, ...c }));
cabins.behind.forEach((c, i) => front.push({ k: -(i + 1), ...c }));
front.forEach((c, i) => {
  c.omega = 2 * Math.PI * (0.52 + ((i * 37) % 11) / 11 * 0.14);  // har biriga o'z chastotasi
  c.phase = i * 1.7;
  c.th = 0; c.om = 0;                                             // mayatnik: burchak, burchak tezligi
  const el = document.createElement('div');
  el.className = 'lbl cab-tag' + (c.hero ? ' cab-tag--hero' : '');
  el.innerHTML = `<div class="cab-tag__in"><span class="cab-tag__name">${c.name}</span><span class="cab-tag__meta">${c.tag}</span></div>`;
  el.style.opacity = '0';
  labelsEl.appendChild(el);
  c.el = el; c.lx = -1e4; c.ly = -1e4; c.lo = -1; c.w = 0; c.dx = 0;
});

/* ---------- Bosqich belgilari (milestones) ---------- */
export const milestones = stages.map((s, i) => {
  const el = document.createElement('div');
  el.className = 'lbl ms';
  el.innerHTML = `<div class="ms__in"><span class="ms__pill"><em>0${i + 1}</em>${s.short}</span><span class="ms__stem"></span><span class="ms__dot"></span></div>`;
  labelsEl.appendChild(el);
  return { t: Math.max(s.t, 0.05) + (i === 0 ? 0 : 0.012), el, pill: el.querySelector('.ms__pill'), done: null, lx: -1e4, ly: -1e4, lo: -1, stem: -1, w: 0, dx: 0 };
});

/* ---------- Bosqich matnlari — #route (index.html) dan o'qiladi: kontent bitta joyda ---------- */
export const stageContent = [...routeEl.querySelectorAll('.route__item')].map((li) => ({
  title: li.querySelector('h3').textContent,
  desc: li.querySelector('p').textContent,
  helpHtml: li.querySelector('ul').innerHTML,
  peersLabel: li.dataset.peersLabel || 'Bu bosqichda',
  peers: li.dataset.peers || ''
}));

/* ---------- Unicorn yorlig'i ---------- */
export const uni = { el: document.createElement('div'), lx: -1e4, ly: -1e4, lo: -1, w: 0, dx: 0 };
uni.el.className = 'lbl uni';
uni.el.innerHTML = '<div class="uni__in"><svg class="uni__spark" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0c.5 4.2 1.8 6.6 8 8-6.2 1.4-7.5 3.8-8 8-.5-4.2-1.8-6.6-8-8 6.2-1.4 7.5-3.8 8-8Z"/></svg><span class="uni__t">Unicorn</span><span class="uni__v">$1B+</span></div>';
uni.el.style.opacity = '0';
labelsEl.appendChild(uni.el);
