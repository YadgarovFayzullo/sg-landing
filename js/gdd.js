/* Grand Demo Day sahifasi: galereya lightbox (klaviatura va swipe) */
import './page.js';

const btns = [...document.querySelectorAll('.gal__b')];
const lb = document.createElement('div');
lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Foto');
lb.innerHTML = '<img alt=""><button class="lb__x" aria-label="Close">✕</button><button class="lb__p" aria-label="Prev">←</button><button class="lb__n" aria-label="Next">→</button>';
document.body.append(lb);
const img = lb.querySelector('img');
let cur = 0;
const show = (i) => { cur = (i + btns.length) % btns.length; const s = btns[cur].querySelector('img'); img.src = s.currentSrc || s.src; img.alt = s.alt; };
const open = (i) => { show(i); lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; };
const close = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; };
btns.forEach((b, i) => b.addEventListener('click', () => open(i)));
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
