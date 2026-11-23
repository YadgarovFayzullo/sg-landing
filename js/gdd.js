/* Grand Demo Day sahifasi: galereya lightbox (klaviatura va swipe) va mavsum tugmalari (bir nechta galereya bo'lsa) */
import './page.js';

let btns = [];
const lb = document.createElement('div');
lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Foto');
lb.innerHTML = '<img alt=""><button class="lb__x" aria-label="Close">✕</button><button class="lb__p" aria-label="Prev">←</button><button class="lb__n" aria-label="Next">→</button>';
document.body.append(lb);
const img = lb.querySelector('img');
let cur = 0;
const show = (i) => { cur = (i + btns.length) % btns.length; const s = btns[cur].querySelector('img'); img.src = s.currentSrc || s.src; img.alt = s.alt; };
const open = (i) => { show(i); lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; };
const close = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; };
document.querySelectorAll('.gal__b').forEach((b) => b.addEventListener('click', () => {
  btns = [...b.closest('.gal').querySelectorAll('.gal__b')];
  open(btns.indexOf(b));
}));
const tabs = [...document.querySelectorAll('.gal-tabs [data-gal]')];
tabs.forEach((t) => t.addEventListener('click', () => {
  tabs.forEach((x) => { const on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); });
  document.querySelectorAll('.gal-set').forEach((s) => { s.hidden = s.dataset.gal !== t.dataset.gal; });
}));
lb.querySelector('.lb__x').addEventListener('click', close);
lb.querySelector('.lb__p').addEventListener('click', () => show(cur - 1));
lb.querySelector('.lb__n').addEventListener('click', () => show(cur + 1));
lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('is-open')) return;
  if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1);
});
let x0 = null;
lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', (e) => { if (x0 === null) return; const d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); x0 = null; });

// old links to a season's table (/grand-demo-day#mavsum-3) → the season's own page (/grand-demo-day/3-mavsum/)
const old = /^#mavsum-(\d+)$/.exec(location.hash);
if (old) location.replace(location.pathname.replace(/\/?$/, '/') + old[1] + '-mavsum/');
