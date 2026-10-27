/* Ichki sahifalar: mobil menyu, reveal, atama izohlari (glossary), yil */
import { GLOSSARY } from './glossary-data.js';

const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
burger.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
});

const io = new IntersectionObserver((ents) => {
  ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();

/* ---- atamalar: [data-gloss] ichidagi matn bo'lakalarida mos so'zlar bosiladigan tugmaga aylanadi ---- */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const spellings = GLOSSARY.flatMap((entry) => entry.match.map((spelling) => ({ spelling, entry })))
  .sort((a, b) => b.spelling.length - a.spelling.length);
const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${spellings.map((s) => esc(s.spelling)).join('|')})[\\p{L}\\p{N}]*`, 'giu');
const entryFor = (w) => spellings.find((s) => w.toLowerCase().startsWith(s.spelling.toLowerCase()))?.entry;

let uid = 0;
document.querySelectorAll('[data-gloss]').forEach((root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const text = node.nodeValue;
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of text.matchAll(pattern)) {
      const entry = entryFor(m[0]);
      if (!entry) continue;
      frag.append(text.slice(last, m.index));
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'term'; b.textContent = m[0];
      b.setAttribute('aria-expanded', 'false');
      b._entry = entry;
      frag.append(b);
      last = m.index + m[0].length;
    }
    if (!last) return;
    frag.append(text.slice(last));
    node.replaceWith(frag);
  });
});

let bubble = null, owner = null;
function closeBubble() {
  if (!bubble) return;
  bubble.remove(); owner.setAttribute('aria-expanded', 'false'); owner.removeAttribute('aria-controls');
  bubble = owner = null;
}
function openBubble(btn) {
  closeBubble();
  const { label, text } = btn._entry;
  const el = document.createElement('div');
  el.className = 'term-bubble'; el.id = `term-${++uid}`; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', label);
  el.innerHTML = '<p></p><p></p>';
  el.children[0].textContent = label; el.children[1].textContent = text;
  const w = Math.min(288, innerWidth - 24);
  el.style.width = `${w}px`; el.style.visibility = 'hidden';
  document.body.append(el);
  const r = btn.getBoundingClientRect(), h = el.offsetHeight, c = r.left + r.width / 2;
  const left = Math.min(Math.max(c - w / 2, 12), innerWidth - w - 12);
  const above = r.bottom + h + 14 > innerHeight && r.top > h + 14;
  el.style.left = `${left + scrollX}px`;
  el.style.top = `${(above ? r.top - h - 10 : r.bottom + 10) + scrollY}px`;
  el.style.setProperty('--arrow', `${Math.min(Math.max(c - left, 18), w - 18)}px`);
  if (above) el.setAttribute('data-above', '');
  el.style.visibility = '';
  btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-controls', el.id);
  bubble = el; owner = btn;
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest?.('.term');
  if (btn) { btn === owner ? closeBubble() : openBubble(btn); return; }
  if (bubble && !bubble.contains(e.target)) closeBubble();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && owner) { const o = owner; closeBubble(); o.focus(); } });
addEventListener('resize', closeBubble);
