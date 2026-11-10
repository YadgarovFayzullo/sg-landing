/* Startup Garage — sahifa interaktivligi (sahnadan tashqari): menyu, reveal, yil */

import './i18n.js';

/* nav: sahnadan keyin oq fon */
const nav = document.getElementById('nav');
const journey = document.getElementById('journey');
const onScroll = () => {
  // sahna yuqoriga chiqib keta boshlagan zahoti — menyu oq fonli
  const end = journey.offsetTop + journey.offsetHeight - window.innerHeight - 2;
  nav.classList.toggle('is-solid', window.scrollY > end);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* mobil menyu */
const burger = document.getElementById('burger');
burger.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('#mobileMenu a').forEach((a) => a.addEventListener('click', () => {
  nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
}));

/* reveal */
const io = new IntersectionObserver((ents) => {
  ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));


/* portfolio: startaplar lentasini nusxalash — cheksiz aylanish uchun (nusxa ekran o'qigichlarga ko'rinmaydi) */
const peersTrack = document.querySelector('.peers__track');
[...peersTrack.children].forEach((el) => {
  const copy = el.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.tabIndex = -1;
  peersTrack.appendChild(copy);
});

document.getElementById('year').textContent = new Date().getFullYear();

/* nav: "Kompaniya" ochiladigan menyusi (bosish / Escape) */
document.querySelectorAll('.nav__dd').forEach((dd) => {
  const b = dd.querySelector('.nav__dd-btn');
  b.addEventListener('click', () => { const o = !dd.classList.contains('is-open'); dd.classList.toggle('is-open', o); b.setAttribute('aria-expanded', String(o)); });
  document.addEventListener('click', (e) => { if (!dd.contains(e.target)) { dd.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { dd.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
});
