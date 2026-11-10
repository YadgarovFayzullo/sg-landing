/* Til: uz (default) / en. Matn HTML'da o'zbekcha — inglizcha tarjima js/i18n-en.js da (kalit = o'zbekcha satr).
   Til almashganda sahifa qayta yuklanadi: sahna matnlarni DOM'dan o'qiydi, shuning uchun tarjima ulardan oldin bajariladi. */
const KEY = 'sg-lang';
let lang = 'uz';
try {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'uz' || q === 'en') localStorage.setItem(KEY, q);
  lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'uz';
} catch { /* storage yopiq — default uz */ }

const mod = lang === 'en' ? await import('./i18n-en.js') : null;
const EN = mod?.EN ?? null;
export const GLOSS_EN = mod?.GLOSS_EN ?? null;
export const LANG = lang;
const norm = (s) => s.replace(/\s+/g, ' ').trim();
export const t = (s) => (EN && EN[norm(s)]) || s;

document.documentElement.lang = lang;

if (EN) {
  const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    if (skip.has(n.parentNode?.nodeName)) continue;
    const v = EN[norm(n.nodeValue)];
    if (!v) continue;
    const lead = n.nodeValue.match(/^\s*/)[0], trail = n.nodeValue.match(/\s*$/)[0];
    n.nodeValue = lead + v + trail;
  }
  for (const el of document.querySelectorAll('[alt],[aria-label],[title],[data-peers-label]')) {
    for (const a of ['alt', 'aria-label', 'title', 'data-peers-label']) {
      const v = el.getAttribute(a);
      if (v && EN[norm(v)]) el.setAttribute(a, EN[norm(v)]);
    }
  }
  document.title = t(document.title);
  for (const m of document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]')) {
    const v = m.getAttribute('content');
    if (v && EN[norm(v)]) m.setAttribute('content', EN[norm(v)]);
  }
}

/* til tugmasi */
function mount() {
  const mk = (cls) => {
    const w = document.createElement('div');
    w.className = cls; w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Language / Til');
    w.innerHTML = ['uz', 'en'].map((l) => `<button type="button" data-lang="${l}"${l === lang ? ' aria-pressed="true"' : ''}>${l.toUpperCase()}</button>`).join('');
    w.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-lang]');
      if (!b || b.dataset.lang === lang) return;
      try { localStorage.setItem(KEY, b.dataset.lang); } catch { /* ignore */ }
      const u = new URL(location.href); u.searchParams.delete('lang'); location.href = u.toString();
    });
    return w;
  };
  const cta = document.querySelector('.nav__cta');
  if (cta) cta.after(mk('lang'));
  const mm = document.getElementById('mobileMenu');
  if (mm) mm.insertBefore(mk('lang lang--m'), mm.firstChild);
}
mount();
