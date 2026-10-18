/* Startup Garage — sahifa interaktivligi */
(() => {
  'use strict';
  const SG = window.SG;

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

  /* kun vaqti: har daqiqada tekshiriladi (?time=night bilan qo'lda sinash mumkin) */
  if (!/[?&]time=/.test(location.search)) {
    setInterval(() => {
      const h = new Date().getHours();
      document.documentElement.dataset.time = h >= 7 && h < 17 ? 'day' : (h >= 17 && h < 20) || (h >= 5 && h < 7) ? 'evening' : 'night';
    }, 60000);
  }

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

  /* yo'l xaritasi */
  const route = document.getElementById('route');
  const alt = ['0 m', '1 200 m', '2 400 m', '3 600 m', '4 800 m'];
  route.innerHTML = SG.stages.map((s, i) => `
    <li class="route__item reveal" style="--d:${i * 0.06}s">
      <span class="route__n">0${i + 1}</span>
      <span class="route__alt">${alt[i]}</span>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
      <ul>${s.help.map((h) => `<li>${h}</li>`).join('')}</ul>
      <div class="route__bar"><span style="width:${(i + 1) * 20}%"></span></div>
    </li>`).join('');

  /* portfolio */
  document.getElementById('peers').innerHTML = SG.portfolio
    .map(([n, t]) => `<a class="peer" href="https://startupgarage.uz/uz/portfolio" target="_blank" rel="noopener">${n}<small>${t}</small></a>`).join('');

  /* FAQ */
  document.getElementById('faqList').innerHTML = SG.faq.map(([q, a], i) => `
    <details class="faq__item reveal"${i === 0 ? ' open' : ''}>
      <summary>${q}<span class="faq__plus" aria-hidden="true"></span></summary>
      <p>${a}</p>
    </details>`).join('');

  /* reveal */
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  document.getElementById('year').textContent = new Date().getFullYear();
})();
