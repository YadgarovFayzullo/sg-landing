/* Startup Garage — kontent (manba: startupgarage.uz) */
window.SG = {
  // Kanat bo'ylab bosqichlar. t — yuqoriga ketuvchi kanatdagi o'rni (0 = pastki stansiya, 1 = cho'qqi)
  // peersLabel — kartadagi "Bu bosqichda: ..." qatorining sarlavhasi (faqat saytdagi haqiqiy bosqichlar)
  stages: [
    {
      t: 0.0, short: 'G‘oya', title: 'G‘oya',
      desc: 'Muammoni aniq belgilaymiz, bozorni tahlil qilamiz va g‘oyani real mijozlar bilan sinab ko‘ramiz.',
      help: ['G‘oyani validatsiya qilish', 'Bozor va raqobat tahlili', 'Biznes modelni shakllantirish'],
      peersLabel: 'Bu bosqichda', peers: ['Echo', 'MedFinder']
    },
    {
      t: 0.24, short: 'MVP', title: 'MVP',
      desc: 'Eng kerakli funksiyalar bilan mahsulotni tez ishga tushiramiz va birinchi foydalanuvchilarni topamiz.',
      help: ['MVP’ni loyihalash va yaratish', 'Birinchi foydalanuvchilarni jalb qilish', 'Mahsulot metrikalari'],
      peersLabel: 'Bu bosqichda', peers: ['Zingo', 'Karmon AI', 'Edu Tizim']
    },
    {
      t: 0.46, short: 'Market fit', title: 'Market fit',
      desc: 'Mijozlar pul to‘lashga tayyor bo‘lgan qiymatni topamiz — narx va unit-ekonomikani sozlaymiz.',
      help: ['Market fitni o‘lchash', 'Narx va unit-ekonomika', 'Mentorlik sessiyalari'],
      peersLabel: 'Bu bosqichdan o‘tganlar', peers: ['Braille Recognition', 'Xaridor', 'Dasyor']
    },
    {
      t: 0.66, short: 'O‘sish', title: 'O‘sish',
      desc: 'Marketing va sotuv tizimini quramiz, jamoani kengaytirib o‘sishni tezlashtiramiz.',
      help: ['O‘sish strategiyasi', 'Marketing va sotuv tizimi', 'Jamoani kengaytirish'],
      peersLabel: 'Bu bosqichda', peers: ['Magicbot', 'Kolingo', 'Darstop']
    },
    {
      t: 0.85, short: 'Investitsiya', title: 'Investitsiya',
      desc: 'Pitch tayyorlaymiz, investorlar bilan uchrashuvlar tashkil qilamiz va xalqaro bozorga chiqishga yordam beramiz.',
      help: ['Pitch-deck va Demo Day', 'Investorlar bilan uchrashuvlar', 'Xalqaro bozorga chiqish'],
      peersLabel: 'Investitsiya olganlar', peers: ['Pulse EV', 'Mohirdev', 'Ish.uz']
    }
  ],

  // Kabinalar: 0-indeks — "Sizning startapingiz". Musbat — oldinda (yuqorida), manfiy — orqada.
  // Tartib bosqich bo'yicha: har bir kabina asosiy kadrda o'zi turgan zonaga mos keladi.
  //   ahead  — hero kadrda (boshlanish) ko'rinadi: pastdan yuqoriga G'oya → MVP → Market fit → O'sish → Investitsiya
  //   behind — final kadrda (cho'qqi) ko'rinadi: yuqoridan pastga O'sish → Market fit → MVP → G'oya → stansiya
  cabins: {
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
  },

  portfolio: [
    ['Zingo', 'EdTech · MVP'], ['Edu Tizim', 'EdTech · MVP'], ['Karmon AI', 'AI · MVP'], ['Magicbot', 'E-commerce · Growth'],
    ['1pos', 'RetailTech · Scale'], ['1clinic', 'MedTech · Scale'], ['Braille Recognition', 'AI · Growth'], ['Kolingo', 'AI, EdTech · Growth'],
    ['Darstop', 'EdTech · Growth'], ['Udemere', 'EdTech · Growth'], ['Wisdom', 'EdTech · Growth'], ['Xaridor', 'RetailTech · Growth'],
    ['C-Control', 'PropTech · Growth'], ['Karly', 'Service · Growth'], ['Dasyor', 'E-commerce · Growth'], ['NoteX', 'AI · MVP'],
    ['Secura', 'FinTech · MVP'], ['MediCard', 'MedTech · MVP'], ['Dialix AI', 'AI · MVP'], ['Obuna24', 'SaaS · MVP']
  ],

  faq: [
    ['Startup Garage nima?', 'Startup Garage — startaplarning o‘sishini tezlashtirish uchun zarur vositalar, bilim va qo‘llab-quvvatlash bilan ta’minlaydigan intensiv, loyiha asosidagi dastur. Stenford Universitetining mashhur Startup Garage dasturidan ilhomlangan.'],
    ['Startup Garage’ga kimlar murojaat qilishi mumkin?', 'Tadbirkorlikka ishtiyoqi bo‘lgan va innovatsion biznes g‘oyaga ega bo‘lgan har qanday shaxs. Biz barcha sohalardan va Markaziy Osiyodan kelgan tadbirkorlarni qabul qilamiz.'],
    ['Dastur qancha davom etadi?', 'Rezidentlik dasturi 18 oy davomida startapingizni barqaror biznesga aylantirishga qaratilgan. Bootcamp dasturi startap yo‘lining barcha bosqichlarini — ideatsiyadan bozorga chiqishgacha qamrab oladi.'],
    ['Dasturda qanday mavzular qamrab olinadi?', 'Startap asoslari, mahsulot rivojlanishi, mahsulotni ishga tushirish, moliya va mablag‘ yig‘ish, marketing va savdo, operatsiyalar va boshqaruv.'],
    ['Qo‘shilish uchun to‘lov bormi?', 'Ha, dasturga qo‘shilish uchun to‘lov mavjud. Biroq va’da beruvchi tadbirkorlarni qo‘llab-quvvatlash uchun turli moliyalashtirish imkoniyatlari va stipendiyalar taklif qilamiz.'],
    ['Tanlash jarayoni qanday?', 'Dastlabki ariza ko‘rib chiqiladi, so‘ngra qisqa ro‘yxatga kirgan nomzodlar bilan suhbat o‘tkaziladi. Biznes g‘oya, tadbirkorlik salohiyati va dasturga tayyorlik baholanadi.'],
    ['Jamoa sifatida murojaat qilish mumkinmi?', 'Ha, individual ravishda yoki jamoa sifatida murojaat qilishingiz mumkin. Jamoa bo‘lsangiz, arizada barcha a’zolar haqidagi ma’lumotlarni kiriting.'],
    ['Dastur tugagandan so‘ng nima bo‘ladi?', 'Ishtirokchilar o‘z bizneslarini potensial investorlarga taqdim etish imkoniyatiga ega bo‘ladi. Bitiruvchilarga doimiy qo‘llab-quvvatlash va resurslar taklif qilinadi.']
  ]
};
