# Startup Garage — landing

Scroll qilganda kanatli yo‘l bo‘ylab startaplar cho‘qqiga ko‘tariladigan landing sahifa.
Build yo‘q: oddiy HTML + CSS + ES-modullar.

## Ishga tushirish

```bash
npm run dev          # = python3 -m http.server 5180
```

So‘ng `http://localhost:5180`. Fayllarni `file://` orqali ochmang — ES-modullar va rasmlar yuklanmaydi.

## Kun vaqti

Tashrif buyuruvchining mahalliy soati bo‘yicha (`js/daytime.js`):

| Faza | Soat | Ko‘rinish |
|---|---|---|
| `night` | 20:00–05:00 | tungi ko‘k, yulduzlar, neon yozuv to‘liq |
| `dawn` | 05:00–06:00 | rassvet: binafsha → pushti, yulduzlar so‘nmoqda, neon xira |
| `sunrise` | 06:00–07:00 | quyosh chiqishi: och ko‘k → oltin |
| `day` | 07:00–17:00 | asl rasm |
| `evening` | 17:00–20:00 | quyosh botishi: apelsin → siren |

Dev rejimi (URL parametri):

- `?time=night` (yoki `dawn`, `sunrise`, `day`, `evening`) — fazani qotirish
- `?time=5` — soatni qotirish (0–23)
- `?time=lapse` yoki `?time=lapse:2` — taymlaps: fazalar ketma-ket almashadi (default 4 s), pastki chapda joriy faza belgisi

## Tuzilma

```
index.html            sahifa; barcha matnli kontent shu yerda (SEO, JS'siz ham ko'rinadi)
css/
  tokens.css          :root o'zgaruvchilar (ranglar, radius, gutter)
  base.css            reset, tipografika, tugmalar, chip, reveal
  nav.css             yuqori menyu
  stage.css           sahna: canvas, hero/summit, karta, yorliqlar
  sections.css        sahnadan keyingi seksiyalar: about … footer
  theme-time.css      kun vaqti (day / evening / night) — DOM qatlamlari
js/
  daytime.js          <head> da, blokirovchi: soat → html[data-time]. Chegaralar faqat shu yerda
  data.js             sahna ma'lumotlari: bosqichlarning kanatdagi o'rni (t), kabinalar
  main.js             menyu, reveal, yil
  scene/
    index.js          kirish nuqtasi: resize, skroll, rAF sikli, boot
    config.js         fon rasmidan o'lchangan hamma narsa: kanat tugunlari, sprite metrikasi, neon yozuv, tint ranglari
    math.js           clamp/lerp/smooth/ease, kanat yo'li (buildPath, pointAt)
    state.js          umumiy holat: S (skroll, vaqt), cam, imgs, theme
    dom.js            sahna DOM havolalari
    entities.js       kabinalar, bosqich belgilari, unicorn yorlig'i + ularning DOM elementlari
    assets.js         rasmlarni yuklash (1536 → 4K), kabina nuri, tuman spriti
    camera.js         skroll → kamera (x, y, masshtab), outro
    render.js         canvas qatlamlari: fon, kanat, kabinalar, tuman, kun vaqti tint, neon yozuv
    physics.js        kabinalar mayatnigi
    overlay.js        DOM qatlami: yorliqlar, karta, hero/summit matni
assets/               fonlar (scene-1536 / scene-4k), spritelar, sign-neon.png, logo, favicon
```

## Kadr qanday chiziladi

`scene/index.js` → `frame()`: skrollni silliqlash → `physics` → `updateCamera` → `render` (canvas) → `updateLabels / updateCard / updateCopy` (DOM).
Hamma narsa sahna koordinatalarida (1536×1024) chiziladi; kamera — bitta `setTransform`.

Canvas qatlamlari tartibi (`render.js`): fon → osmon → unicorn → orqa tuman → kanatlar → kabinalar → old tuman → **kun vaqti tint (multiply)** → **neon yozuv (lighter)** → pastki oqlik. Oqlik tintdan keyin — sahna doim oq bilan tugaydi, keyingi seksiyaga chok yo‘q.

## Kontentni o‘zgartirish

- **Bosqich matnlari** — `index.html` dagi `#route` ro‘yxati. Sahnadagi karta ham shu ro‘yxatdan o‘qiydi (`data-peers-label`, `data-peers` — kartadagi «Bu bosqichda: …» qatori). Tartib `js/data.js` dagi `stages` bilan bir xil bo‘lishi shart.
- **Kabinalardagi startaplar** — `js/data.js` → `cabins`.
- **Portfolio, FAQ** — `index.html`.
- **Kun vaqti chegaralari** — `js/daytime.js`.

## Fon rasmi almashtirilsa

`js/scene/config.js` qayta o‘lchanadi: kanat tugunlari (`UP_NODES` / `DOWN_NODES`), `UNI`, `SIGN`, `WHITE_TOP`.
`assets/sign-neon.png` — bino peshtoqidagi yozuvning yorug‘lik maskasi, fon rasmidan kesib olingan; yangi fon uchun qayta yasaladi.

## Favicon

`assets/favicon.svg` — Startup Garage logotipidagi belgi (`Logo SG main.svg` dan). PNG variantlari: `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`.
