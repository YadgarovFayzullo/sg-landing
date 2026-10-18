/* Kun vaqti: html[data-time="night|dawn|sunrise|day|evening"].
   Blokirovchi (classic) skript — <head> da, CSS dan oldin: sahifa chizilishidan oldin
   atribut o'rnatiladi, kunduzgi tema "miltillamaydi". Soat chegaralari faqat shu yerda.

   Dev rejimi (URL):
     ?time=night | dawn | sunrise | day | evening   — fazani qotirish
     ?time=5                                        — soatni qotirish (0–23)
     ?time=lapse  yoki  ?time=lapse:3               — taymlaps: har N soniyada keyingi faza (default 6s) */
(function () {
  var PHASES = ['night', 'dawn', 'sunrise', 'day', 'evening'];
  var q = (location.search.match(/[?&]time=([^&]+)/) || [])[1] || '';
  var html = document.documentElement;

  function phase(h) {
    if (h >= 5 && h < 6) return 'dawn';       // rassvet — osmon binafsha-pushti, yulduzlar so'nmoqda
    if (h >= 6 && h < 7) return 'sunrise';    // quyosh chiqishi — oltin-pushti yorug'lik
    if (h >= 7 && h < 17) return 'day';
    if (h >= 17 && h < 20) return 'evening';  // quyosh botishi
    return 'night';
  }
  function set(p) { html.dataset.time = p; if (badge) badge.textContent = '⏱ ' + p; }

  var badge = null;
  function showBadge() {
    badge = document.createElement('div');
    badge.className = 'dev-time';
    badge.textContent = '⏱ ' + html.dataset.time;
    document.body.appendChild(badge);
  }

  if (/^lapse/.test(q)) {
    // taymlaps: fazalar ketma-ket, yumshoq o'tishlar ko'rinadi
    var sec = +(q.split(':')[1]) || 6, i = 0;   // o'tish ~2.4s (THEME_FADE) — faza kamida shuncha turishi kerak
    set(PHASES[0]);
    document.addEventListener('DOMContentLoaded', showBadge);
    setInterval(function () { i = (i + 1) % PHASES.length; set(PHASES[i]); }, sec * 1000);
  } else if (/^\d{1,2}$/.test(q)) {
    set(phase(+q));
    document.addEventListener('DOMContentLoaded', showBadge);
  } else if (PHASES.indexOf(q) >= 0) {
    set(q);
  } else {
    set(phase(new Date().getHours()));
    setInterval(function () { set(phase(new Date().getHours())); }, 60000);
  }
})();
