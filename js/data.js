/* Startup Garage — sahna ma'lumotlari.
   Matnli kontent (bosqich tavsiflari, portfolio, FAQ) index.html da — SEO va JS'siz ko'rinish uchun.
   Bu yerda faqat sahnaga kerak bo'lgan narsa: kanatdagi o'rinlar va kabinalar. */

// Bosqich belgilari. t — yuqoriga ketuvchi kanatdagi o'rni (0 = pastki stansiya, 1 = cho'qqi).
// Tartib index.html dagi #route ro'yxati bilan bir xil — karta matni o'sha yerdan o'qiladi.
export const stages = [
  { t: 0.0, short: 'G‘oya' },
  { t: 0.24, short: 'MVP' },
  { t: 0.46, short: 'Market fit' },
  { t: 0.66, short: 'O‘sish' },
  { t: 0.85, short: 'Investitsiya' }
];

// Kabinalar: hero (k=0) — "Sizning startapingiz". ahead — oldinda (yuqorida), behind — orqada.
//   ahead  — hero kadrda (boshlanish) ko'rinadi: pastdan yuqoriga G'oya → MVP → Market fit → O'sish → Investitsiya
//   behind — final kadrda (cho'qqi) ko'rinadi: yuqoridan pastga O'sish → Market fit → MVP → G'oya → stansiya
export const cabins = {
  hero: { name: 'Sizning startapingiz', tag: 'Startup Garage bilan' },
  ahead: [
    { name: 'Echo', tag: 'EdTech · G‘oya' },
    { name: 'Zingo', tag: 'EdTech · MVP' },
    { name: 'Kolingo', tag: 'EdTech · O‘sish' },
    { name: 'Magicbot', tag: 'E-commerce · O‘sish' },
    { name: 'Mohirdev', tag: '$750K investitsiya' }
  ],
  behind: [
    { name: 'Darstop', tag: 'EdTech · O‘sish' },
    { name: 'Braille Recognition', tag: 'AI · O‘sish' },
    { name: 'Karmon AI', tag: 'AI · MVP' },
    { name: 'MedFinder', tag: 'MedTech · G‘oya' },
    { name: 'Navbatdagi rezident', tag: 'Ariza qabul qilinmoqda' }
  ]
};
