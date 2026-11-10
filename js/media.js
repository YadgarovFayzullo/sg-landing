/* Media sahifasi: mavzu bo'yicha filtr */
import './page.js';

const chips = [...document.querySelectorAll('.mchip')], cards = [...document.querySelectorAll('.mc')];
chips.forEach((chip) => chip.addEventListener('click', () => {
  chips.forEach((c) => c.classList.toggle('is-on', c === chip));
  const f = chip.dataset.f;
  cards.forEach((c) => { c.hidden = f !== 'all' && c.dataset.topic !== f; });
}));
