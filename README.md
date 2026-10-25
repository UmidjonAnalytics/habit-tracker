# 📱 Mening Odatlarim (Habit Tracker PWA + Google Sheets)

Telefoningiz uchun zamonaviy, tezkor va qulay Habit Tracking ilovasi. Barcha natijalar real vaqtda **Google Sheets** jadvalingizda to'planadi, hisob-kitob qilinadi va tahlil qilinadi.

---

## 🌟 Imkoniyatlar
1. **Har kunlik Check-in:** 
   - Oddiy odatlar (Masalan: *Ertalabki badantarbiya, Kechki sayr*) — birgina bosish bilan bajariladi.
2. **Raqamli o'lchovli odatlar:**
   - Suv ichish (litr), kitob o'qish (sahifa), yugurish (km), dasturlash (daqiqa).
   - Qulay tezkor qo'shish tugmalari (`+0.25 L`, `+0.5 L`, `+5 bet` va h.k.).
3. **Avtomatik Streak (🔥 Olov tizimi):**
   - Ketma-ket necha kun odatni bajarganingiz hisoblanadi.
4. **Haftalik va oylik tahlil & foizlar:**
   - Haftalik grafik va har bir odatning bajarilish darajasi (%).
5. **Google Sheets bilan ikki tomonlama bog'lanish:**
   - Har bir check-in Google Sheets varag'iga yoziladi.
   - Oflayn ishlaydi: internet bo'lmaganda ma'lumot saqlanadi, internet paydo bo'lganda avtomatik jadvalga yuboriladi.
6. **Eslatmalar (Reminders):**
   - Belgilangan vaqtda (masalan, soat 21:00 da) odatlarni eslatuvchi xabarnoma.
7. **PWA (Progressive Web App):**
   - Android va iPhone telefonlarda to'liq ekranda, xuddi App Store/Play Market'dan yuklangandek ishlaydi.

---

## 🚀 1-QADAM: Google Sheets va Apps Script'ni sozlash (3 daqiqa)

1. Brauzeringizda yangi jadval oching: [sheets.new](https://sheets.new)
2. Jadvalga nom bering (masalan: `Mening Odatlarim`).
3. Yuqori menyudan: **Kengaytmalar (Extensions) ➔ Apps Script** bo'limiga kiring.
4. Ochilgan muharrirdagi mavjud kodni o'chirib, o'rniga loyihadagi `google-apps-script.js` faylidagi barcha kodni nusxalab qo'ying (`Ctrl+A`, `Ctrl+V`).
5. Yuqoridagi **Saqlash (Save / 💾)** belgisini bosing.
6. Yuqori o'ng burchakdagi ko'k **Deploy (O'rnatish) ➔ New deployment (Yangi o'rnatish)** tugmasini bosing:
   - **Select type (Tishli g'ildirakcha)** ➔ **Web app** ni tanlang.
   - **Description:** `Habit Tracker API`
   - **Execute as:** `Me (mening nomimdan)`
   - **Who has access:** `Anyone (Hamma)` *(Bu juda muhim, aks holda telefondan kirishda xatolik beradi)*.
7. **Deploy** tugmasini bosing va so'ralsa Google hisobingiz orqali ruxsatlarni tasdiqlang (**Advanced ➔ Go to ... (unsafe)** ➔ **Allow**).
8. Chiqqan **Web app URL** manzilini nusxalab oling (U quyidagicha ko'rinishda bo'ladi: `https://script.google.com/macros/s/AKfycbx.../exec`).

> ✅ **Natija:** Google Sheets avtomatik ravishda `Habits` va `Logs` varaqalarini yaratadi va har bir belgilangan odatni sanasi, vaqti va qiymati bilan saqlab boradi!

---

## 📲 2-QADAM: Ilovani Telefonga o'rnatish

Ilovani internetga joylashtirish va telefonda ochishning eng oson usullari:

### A Variant: Bepul GitHub Pages yoki Vercel / Netlify orqali (Eng tavsiya etiladigani)
1. Ushbu loyiha papkasini (`index.html`, `app.js`, `manifest.json`, `sw.js`, `icons`) [GitHub](https://github.com) ga yuklang va **GitHub Pages** ni yoqing.
2. Yoki bepul [Netlify Drop](https://app.netlify.com/drop) ga papkani sudrab tashlang (darhol sizga `https://sizning-sayt.netlify.app` beradi).

### B Variant: Mahalliy kompyuteringiz orqali darhol sinab ko'rish
Kompyuteringizda terminalda quyidagi buyruqni bering:
```bash
npx serve .
# yoki
python -m http.server 8080
```
So'ngra bir xil Wi-Fi tarmog'idagi telefoningizdan kompyuter IP manzilini kiriting (masalan: `http://192.168.1.10:8080`).

### 📱 Telefonda "Bosh ekranga qo'shish":
- **Android (Google Chrome):**
  - Saytni oching ➔ Yuqoridagi uch nuqta (⋮) ➔ **"Ilovani o'rnatish"** yoki **"Bosh ekranga qo'shish" (Add to Home screen)** ni bosing.
- **iPhone (Apple Safari):**
  - Saytni oching ➔ Pastdagi **"Ulashish" (Share / ⬆️)** tugmasini bosing ➔ Pastga tushib **"Bosh ekranga qo'shish" (Add to Home Screen / ➕)** ni bosing.

Ilova telefoningiz ishchi stolida alohida chiroyli ilova ko'rinishida paydo bo'ladi!

---

## ⚙️ 3-QADAM: Google Sheets URL'ni ulash

1. Telefonda ilovani oching.
2. Pastki menyudan **"Sozlamalar"** (Settings ⚙️) bo'limiga kiring.
3. 1-qadamda olgan **Web App URL** manzilingizni joylashtiring.
4. **"Saqlash va Ulanish"** tugmasini bosing.
5. **"Tekshirish"** tugmasini bosib, `✓ Aloqa a'lo darajada!` xabarini ko'ring.

Endi har safar telefonda biron odatni bajarganingizda (masalan, suv ichganingizda yoki sport qilganingizda) u avtomatik ravishda Google Sheets jadvalingizga yoziladi!
