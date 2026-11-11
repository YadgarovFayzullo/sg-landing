/* Startup Garage — sahna ma'lumotlari.
   Matnli kontent (bosqich tavsiflari, portfolio, FAQ) index.html da — SEO va JS'siz ko'rinish uchun.
   Bu yerda faqat sahnaga kerak bo'lgan narsa: kanatdagi o'rinlar va kabinalar. */

import { t } from './i18n.js';

// Bosqich belgilari. t — yuqoriga ketuvchi kanatdagi o'rni (0 = pastki stansiya, 1 = cho'qqi).
// Tartib index.html dagi #route ro'yxati bilan bir xil — karta matni o'sha yerdan o'qiladi.
export const stages = [
  { t: 0.0, short: t('G‘oya') },
  { t: 0.24, short: t('MVP') },
  { t: 0.46, short: t('Market fit') },
  { t: 0.66, short: t('O‘sish') },
  { t: 0.85, short: t('Investitsiya') }
];

// Kabinalar: hero (k=0) — "Sizning startapingiz". ahead — oldinda (yuqorida), behind — orqada.
//   ahead  — hero kadrda (boshlanish) ko'rinadi: pastdan yuqoriga G'oya → MVP → Market fit → O'sish → Investitsiya
//   behind — final kadrda (cho'qqi) ko'rinadi: yuqoridan pastga O'sish → Market fit → MVP → G'oya → stansiya
export const cabins = {
  hero: { name: t('Sizning startapingiz'), tag: t('Startup Garage bilan') },
  ahead: [
    { name: t('KiGo'), tag: t('Startup Garage rezidenti') },
    { name: t('Joymee'), tag: t('$150K investitsiya') },
    { name: t('Romchi'), tag: t('$50K investitsiya') },
    { name: t('Bito'), tag: t('$630K investitsiya') },
    { name: t('Darstop'), tag: t('EdTech · O‘sish') }
  ],
  behind: [
    { name: t('AliPos'), tag: t('$280K investitsiya') },
    { name: t('Karmon AI'), tag: t('AI · MVP') },
    { name: t('Inter AI'), tag: t('$58K investitsiya') },
    { name: t('MedFinder'), tag: t('MedTech · G‘oya') },
    { name: t('Navbatdagi rezident'), tag: t('Ariza qabul qilinmoqda') }
  ]
};
