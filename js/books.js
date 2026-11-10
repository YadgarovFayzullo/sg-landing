/* Kitoblar sahifasi: muqovalarning kursor bo'yicha engashishi */
import './page.js';

if (!matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.bk__img').forEach((box) => {
    const img = box.querySelector('img');
    box.addEventListener('pointermove', (e) => {
      const r = box.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      img.style.setProperty('--ry', `${(x * 16).toFixed(1)}deg`);
      img.style.setProperty('--rx', `${(-y * 12).toFixed(1)}deg`);
    });
    box.addEventListener('pointerleave', () => { img.style.setProperty('--ry', '0deg'); img.style.setProperty('--rx', '0deg'); });
  });
}
