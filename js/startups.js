/* Rezidentlar: /startups/ ro'yxatida qidiruv va filtrlar (kartalar HTML'da — JS'siz ham ko'rinadi) */
import './page.js';

const list = document.getElementById('stList');
if (list) {
  const cards = [...list.children];
  const q = document.getElementById('stQ');
  const sel = { sphere: document.getElementById('stSphere'), stage: document.getElementById('stStage'), region: document.getElementById('stRegion') };
  const count = document.getElementById('stCount');
  const empty = document.getElementById('stEmpty');
  const norm = (s) => s.toLocaleLowerCase().replace(/[‘’ʻʼ`']/g, "'").trim();

  const apply = () => {
    const words = norm(q.value).split(/\s+/).filter(Boolean);
    const sphere = sel.sphere.value, stage = sel.stage.value, region = sel.region.value;
    let n = 0;
    for (const c of cards) {
      const hay = norm(c.dataset.q || '');
      const ok = words.every((w) => hay.includes(w))
        && (!sphere || (c.dataset.sphere || '').split('|').includes(sphere))
        && (!stage || c.dataset.stage === stage)
        && (!region || c.dataset.region === region);
      c.hidden = !ok;
      if (ok) n++;
    }
    count.textContent = n;
    empty.hidden = n > 0;
    list.hidden = n === 0;
  };

  q.addEventListener('input', apply);
  Object.values(sel).forEach((s) => s.addEventListener('change', apply));
  document.getElementById('stReset').addEventListener('click', () => {
    q.value = '';
    Object.values(sel).forEach((s) => { s.value = ''; });
    apply();
    q.focus();
  });
  if (q.value || Object.values(sel).some((s) => s.value)) apply(); // brauzer qaytganda tiklagan qiymatlar
}
