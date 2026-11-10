/* Portfolio sahifasi: hisoblagich, qidiruv, kartalar paydo bo'lishi, kursor yoritgichi, lenta */
import './page.js';
import { LANG } from './i18n.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* lenta: cheksiz aylanish uchun nusxa */
document.querySelectorAll('.mq__row').forEach((row) => {
  const tr = row.firstElementChild, copy = tr.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  row.append(copy);
});

/* hisoblagichlar */
const fmt = (el, v) => { el.textContent = `${el.dataset.pre || ''}${v.toLocaleString('en-US', { minimumFractionDigits: +el.dataset.dec || 0, maximumFractionDigits: +el.dataset.dec || 0 })}${el.dataset.suf || ''}`; };
const co = new IntersectionObserver((ents) => ents.forEach((e) => {
  if (!e.isIntersecting) return;
  co.unobserve(e.target);
  const el = e.target, to = parseFloat(el.dataset.count), t0 = performance.now(), D = 1600;
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / D), k = 1 - Math.pow(1 - p, 3);
    fmt(el, to * k);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), { threshold: 0.4 });
if (!reduced) document.querySelectorAll('[data-count]').forEach((el) => { fmt(el, 0); co.observe(el); });

/* kartalar: ketma-ket paydo bo'lish + kursor yoritgichi */
const cards = [...document.querySelectorAll('.rcard')];
const ro = new IntersectionObserver((ents) => ents.forEach((e) => {
  if (!e.isIntersecting) return;
  const el = e.target; ro.unobserve(el);
  el.style.setProperty('--d', `${(cards.indexOf(el) % 5) * 0.06}s`);
  el.classList.add('is-in');
}), { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
cards.forEach((c) => {
  ro.observe(c);
  c.addEventListener('pointermove', (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`);
    c.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

/* qidiruv */
const q = document.getElementById('pfQ'), count = document.getElementById('pfCount'), empty = document.getElementById('pfEmpty');
q.addEventListener('input', () => {
  const v = q.value.trim().toLowerCase();
  let n = 0;
  cards.forEach((c) => {
    const ok = !v || c.dataset.name.includes(v);
    c.hidden = !ok;
    if (ok) { n++; c.classList.add('is-in'); }
  });
  count.textContent = n;
  empty.hidden = n > 0;
});
