# Startup Garage — landing

Scroll qilganda kanatli yo‘l bo‘ylab startaplar cho‘qqiga ko‘tariladigan landing sahifa.

## Ishga tushirish

```bash
python3 -m http.server 5180
```

So‘ng brauzerda `http://localhost:5180` ni oching (fayllarni `file://` orqali ochmang — rasmlar yuklanmaydi).

## Tuzilma

- `index.html` — sahifa
- `css/style.css` — dizayn (Inter, asosiy rang `#5458FF`)
- `js/data.js` — barcha matnlar: bosqichlar, kabinalardagi startaplar, portfolio, FAQ
- `js/scene.js` — canvas sahna: kamera, kanat, kabinalar, mayatnik fizikasi
- `js/main.js` — menyu, reveal animatsiyalar, ro‘yxatlar
- `assets/` — 4K fon (`scene-4k.webp`), mobil fon (`scene-1536.webp`), kabina spritelari
- `source/` — ChatGPT’da generatsiya qilingan asl rasmlar; `source/tools/sign.py` — stansiyadagi "STARTUP GARAGE" yozuvini fonga perspektiva bilan joylaydigan skript

## Kontentni o‘zgartirish

Kabinalardagi startaplar va bosqich matnlari `js/data.js` da. Bosqich belgilari kanatdagi `t` (0 — pastki stansiya, 1 — cho‘qqi) bo‘yicha joylashadi.

Kanat koordinatalari (`UP_NODES` / `DOWN_NODES` — `js/scene.js`) aynan shu fon rasmidan o‘lchangan. Fon rasmi almashtirilsa, ularni ham qayta o‘lchash kerak.
