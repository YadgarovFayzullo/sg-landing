/* Sahna konfiguratsiyasi — fon rasmidan o'lchangan hamma narsa (sahna px, 1536×1024).
   Fon rasmi almashtirilsa, shu fayl qayta o'lchanadi; kod o'zgarmaydi. */

export const IMG_W = 1536, IMG_H = 1024;

/* Kanat geometriyasi: [x, y, size] — size: shu nuqtadagi kabina balandligi (ilgakdan tagigacha) */
export const UP_NODES = [         // old (yaqin) kanat — yuqoriga
  [548, 662.5, 128],              // pastki stansiya
  [1013, 381, 74],                // 1-minora
  [1188, 279.5, 62],              // 2-minora
  [1316, 207, 52],                // 3-minora
  [1372, 170, 44],                // 4-minora
  [1421, 166, 42]                 // cho'qqi stansiyasi
];
export const DOWN_NODES = [       // orqa kanat — pastga
  [513, 648, 118],
  [1000, 372.5, 69],
  [1188, 264, 58],
  [1300, 200.3, 49],
  [1365, 162, 41],
  [1420, 160, 39]
];

// Kabina sprite metrikasi (cabin-body.png / cabin-grip.png, yarim masshtab px)
export const SPR = { h: 601, gripC: { x: 337, y: 45 }, pivot: { x: 340, y: 90 }, glowPad: 40 };

// Foto tepasidagi osmon kengaytmasi (sky-top.webp): kamera cho'qqida yuqoriga chiqa oladi
export const SKY_EXT = 180, SKY_OVER = 28;

// Unicorn-bulut: cho'qqi tepasidagi osmonda; shox uchi — sprite px
export const UNI = { cx: 1385, cy: 22, w: 236, sw: 960, sh: 633, hornX: 16, hornY: 16.7 };

// Bino peshtoqidagi "STARTUP GARAGE" neon yozuvi (sign-neon.png) — joylashuvi sahna px
export const SIGN = { x: 179, y: 679, w: 252, h: 147 };

// Bino tagidan (y≈905) rasm chetigacha (y=1024) oqqa singish egri chizig'i: smoothstep^1.5
export const WHITE_TOP = 905;
export const WHITE_STOPS = [0, .005, .034, .1, .209, .354, .522, .694, .848, .958, 1];

// Tuman qatlamlari: [x, y, width, alpha, drift px/s, parallax]
export const MIST_BACK = [[160, 520, 760, 0.55, 3.2, 1], [760, 470, 620, 0.42, -2.4, 1], [1180, 880, 820, 0.5, 2.0, 1]];
export const MIST_FRONT = [[-160, 905, 1100, 0.55, 5.5, 1.22], [980, 960, 1150, 0.5, -4.5, 1.28]];

// Sayohat parametrlari
export const GAP = 0.185;                 // kabinalar orasidagi masofa (kanat uzunligi ulushi)
export const T_START = 0.0, T_END = 0.962;

// Kun vaqti tonlari: tepadan pastga gradient, canvas ichida multiply bilan chiziladi
// (CSS .stage__shade ranglari theme-time.css da shunga mos). 'day' — tint yo'q.
export const TINT = {
  night:   ['#1A2150', '#26306E', '#3A3F86', '#3A3F86'],
  dawn:    ['#2E2F72', '#6A4F98', '#C77BA3', '#F0B08A'],   // rassvet: binafsha → pushti → iliq ufq
  sunrise: ['#AFC2F5', '#F7C1CC', '#FFC9A0', '#FFE0B8'],   // quyosh chiqishi: och ko'k → pushti → oltin
  evening: ['#FFB07A', '#FF9A8B', '#D9A0C8', '#B7A6E0']    // quyosh botishi
};
// Bino neon yozuvining yorqinligi har fazada (0..1)
export const SIGN_GLOW = { night: 1, dawn: 0.7, sunrise: 0.2, evening: 0.3 };

export const ASSETS = {
  bg: 'assets/scene-1536.webp',
  bg4k: 'assets/scene-4k.webp',
  body: 'assets/cabin-body.png',
  grip: 'assets/cabin-grip.png',
  glow: 'assets/cabin-glow.png',
  sky: 'assets/sky-top.webp',
  uni: 'assets/unicorn-cloud.webp',
  sign: 'assets/sign-neon.png'
};
