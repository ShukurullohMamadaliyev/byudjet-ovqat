# 🍲 Arzon Ovqat Toshkent (Telegram Mini App & Web App)

Toshkent shahri bo'ylab talabalar va hamyonbop tushlik qilmoqchi bo'lganlar uchun **216+ eng arzon va sifatli ovqatlanish joylari** (Osh, Tushlik kombo, Fast food, Somsa, Suyuq ovqatlar, Kechki ovqat) xaritasi va Telegram Mini App (TMA) tizimi.

- 🤖 **Telegram Bot:** [@ovqat_byudjet_bot](https://t.me/ovqat_byudjet_bot)
- 🌐 **Veb-ilova & TMA (Vercel):** [https://byudjet-ovqat.vercel.app](https://byudjet-ovqat.vercel.app)
- 🌐 **Zaxira (GitHub Pages):** [https://shukurullohmamadaliyev.github.io/byudjet-ovqat/](https://shukurullohmamadaliyev.github.io/byudjet-ovqat/)

---

## 🚀 Asosiy Imkoniyatlar

1. **📲 PWA & Smartfonga Ilova Sifatida O'rnatish:**
   - **Android / Chrome:** 1 bosishda o'rnatish (PWA Web App).
   - **iPhone (iOS Safari):** «Ulashish» (Share ⬆️) -> «Ekran "Domoy"ga» (Add to Home Screen ➕) orqali alohida mobil ilovaga aylanadi.
   - Maxsus brend ikonkasi (Subyektiv / Nma Gap podkasti mezboni rasmi bilan).

2. **⚡ Tezkor Qidiruv va 7 ta Toifa:**
   - Hamma taomlar, Osh, Tushlik (kombo), Fast food, Somsa, Suyuq ovqatlar, Kechki ovqat.
   - Narxlar: **15 000 – 44 000 so'm**.
   - Tumanlar (Toshkentning 12 ta tumani) va narx chegarasi (`≤ 20k`, `≤ 25k`, `≤ 30k`) filtrlari.

3. **📍 «Menga yaqinlari» (Near Me) & Geolocation:**
   - Brauzer va Telegram Geolocation API.
   - **Haversine formulasi** orqali aniq masofa (`350 m`, `1.2 km`) va yetib borish vaqti (`🚶 ~5 daq`).
   - Toshkentning talabalar markazlari bo'yicha tezkor presetlar (*Talabalar shaharchasi, TATU, Chilonzor metro, Chorsu, Buyuk Ipak Yo'li, Sergeli yarmarka*).

4. **🗺️ Interaktiv Xarita (Leaflet Map):**
   - Ro'yxat yoki Xarita ko'rinishi.
   - 216 ta joy xaritada narx yorliqlari bilan ko'rsatiladi.

5. **📋 Pastdan Chiquvchi Bottom Sheet Modal:**
   - Taom tarkibi va grammi.
   - Boshqa arzon menyular va **Interaktiv Tushlik Hisoblagichi (Kalkulyator)**.
   - Yandex Maps, Yandex Navigator (`yandexnavi://`) va Google Maps marshrutlari.
   - Qo'ng'iroq qilish tugmasi (`tel:`).

6. **🤖 Telegram Bot Integratsiyasi (@ovqat_byudjet_bot):**
   - WebApp MenuButton to'g'ridan-to'g'ri `https://byudjet-ovqat.vercel.app` ga ulangan.
   - Telegram Theme (Dark/Light), Haptic Feedback, MainButton va BackButton.
   - Botga GPS yuborilganda eng yaqin 5 ta joyni qaytarish.
   - `/start`, `/near`, `/top`, `/categories`, `/districts`, `/help` komandalari.

---

## 🛠️ O'rnatish va Ishga Tushirish

### 1. Bog'liqliklarni o'rnatish
```bash
npm install
```

### 2. Frontendni ishga tushirish (Vite Dev Server)
```bash
npm run dev
```

### 3. SASS o'zgarishlarini kuzatish
```bash
npm run sass:watch
```

### 4. Telegram Botni ishga tushirish
`.env` faylida bot tokeni ko'rsatilganligiga ishonch hosil qiling va:
```bash
npm run bot
```

---

## 📁 Loyiha Strukturasi

```text
├── index.html            # Asosiy HTML5 markup
├── package.json          # Skriptlar va paketlar
├── scss/                 # SASS (BEM) arxitekturasi
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _base.scss
│   ├── _layout.scss
│   ├── _components.scss
│   ├── _modal.scss
│   └── main.scss
├── css/
│   └── main.css          # Kompilyatsiya qilingan CSS
├── data/
│   └── places.js         # Toshkent bo'ylab 216 ta joy bazasi
├── js/
│   ├── app.js            # Asosiy interaktiv mantiq
│   └── utils/
│       ├── geo.js        # Geolocation va Haversine masofa
│       └── telegram.js   # Telegram WebApp SDK
└── bot/
    └── index.js          # Telegram Bot serveri (@ovqat_byudjet_bot)
```
