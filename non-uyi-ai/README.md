# Non Uyi — Bahodirning qismi

React + Vite loyihasi. Bahodirning `useState`, komponentlarni ulash, natijalarni
ko‘rsatish, filtrlash va xatolarni boshqarish vazifalari tayyor.

## Ishga tushirish

Node.js 22.12+ (yoki 24) bilan:

```sh
cd non-uyi-ai
npm install
npm run dev
```

```sh
npm test
npm run test:logic
npm run build
```

## Hozirgi imkoniyatlar

- Xabar yuborish, loading holati va takroriy parallel yuborishni bloklash.
- Kategoriya, til va matn/mahsulot/manzil bo‘yicha birgalikdagi filtrlar.
- Barcha muvaffaqiyatli xabarlar uchun statistika; filtrlar statistikani o‘zgartirmaydi.
- Filtrlangan buyurtmalar jadvali, natijalar va tavsiya etilgan javoblar.
- Shikoyatlar qizil rangda, avtomatik javobsiz. Hech qanday javob mijozga yuborilmaydi.
- API ruxsati, limit, server, tarmoq, JSON formati va 30 soniyalik timeout xatolari.
- Xatoda yozilgan matn va oldingi natijalar saqlanadi; qayta urinish mumkin.
- Bekor qilingan eski so‘rov natijasi tarixga qo‘shilmaydi.
- Tarix faqat xotirada: sahifa yangilansa, tozalanadi.

## Demo va haqiqiy API

Dastlab faqat `claude.md` mavjud edi. Kamron komponentlari va Sardor/Behruz
xizmatlari hali berilmagani uchun sodda vaqtinchalik UI va alohida demo qo‘shildi.
`src/components/` va `App.css` fayllarini Kamron o‘z dizayni bilan almashtirishi mumkin.

Demo rejimida ro‘yxatdagi 20 xabar uchun oldindan yozilgan javoblar ishlatiladi.
Bu AI klassifikatsiyasi emas. Boshqa matn demo rejimida tushunarli xato beradi.
Demo belgisi har bir natijada saqlanadi, API natijalari bilan adashmaydi.

Haqiqiy API uchun `src/services/analyzeMessage.js` ichidagi funksiyani almashtiring:

```js
export default async function analyzeMessage(message, { signal } = {}) {
  // Sardorning Gemini chaqiruvi + Firdavs prompti + Behruz parseri.
  // signal ni fetch/SDK ga uzating; tayyor obyektni return qiling.
}
```

`App` ushbu funksiyani allaqachon import qiladi. Kod ulangach, interfeysda
**Demo rejimi** belgisini o‘chiring. Hozir API rejimi "hali ulanmagan" xatosini
ko‘rsatadi; demo javobiga yashirincha o‘tmaydi. Test yoki boshqa integratsiya uchun
`<App analyzeMessage={yourService} initialDemoMode={false} />` ishlaydi.

## Taklif etilgan yagona JSON shartnomasi

Bu formatni jamoa bilan kelishish kerak. Boshqa format tanlansa, adapterda moslang.
Funksiya JSON matni emas, quyidagi JavaScript obyektini qaytarsin:

```json
{
  "category": "order",
  "language": "uz",
  "items": [{ "name": "patir non", "quantity": 2 }],
  "address": "Chilonzor 12",
  "time": "bugun 18:00",
  "reply": "Buyurtma ma’lumotlari olindi. Operator tasdiqlaydi."
}
```

- `category`: `order | question | complaint | spam`, majburiy.
- `language`: `uz | ru | mixed | unknown`; yo‘q bo‘lsa `unknown`.
- `items`: mahsulotlar massivi yoki `null`; `name` bo‘sh bo‘lmagan matn,
  `quantity` musbat son yoki `null`.
- `address`, `time`, `reply`: matn yoki `null`. Yetishmagan qiymatlar `null` qilinadi.
- Shikoyat va spam javoblari UI chegarasida ham `null` qilinadi.
- HTTP xatosini `throw Object.assign(new Error('...'), { status: 429 })` shaklida
  uzating; tarmoq xatosini yashirmang. Xom xato matni foydalanuvchiga chiqarilmaydi.
- API kalitini GitHub’ga joylamang; haqiqiy foydalanishda server orqali chaqiring.

## Kamron komponentlari uchun props

| Komponent | Props |
| --- | --- |
| `MessageInput` | `value`, `onChange(text)`, `onSubmit()`, `isLoading`, `error` |
| `Dashboard` | `stats: { total, order, question, complaint, spam }` |
| `OrdersTable` | `orders`: filtrlangan buyurtmalar, yuqoridagi format + `id`, `text`, `source` |

## Sinov chegarasi

`src/data/trainingMessages.js`: 20 ta qo‘lda belgilangan namuna (har kategoriyadan
5 ta), o‘zbekcha, ruscha va aralash matnlar. Testlar ushbu namunaviy xizmat
javoblarining React interfeysiga to‘g‘ri ulanishini tekshiradi. Qo‘shimcha testlar
filtrlar, jami statistika, API xatolari, retry, timeout, kechikkan javob,
unmount, bo‘sh xabar, null maydonlar va noto‘g‘ri JSON tuzilishini tekshiradi.

`npm run test:logic` yordamchi jarayon ochmasdan 20 namuna, filtrlar, statistika,
xato formatlari va timeoutni tekshiradi. Bu React integratsiya testlarini almashtirmaydi.

**Gemini bilan jonli sinov o‘tkazilmagan**: API kodi va kalit mavjud emas.
20 namuna bo‘yicha haqiqiy model aniqligini tekshirish Sardorning xizmati
ulangandan keyin alohida bajariladi.

Texnik ma’lumotlar: [React useState](https://react.dev/reference/react/useState),
[Vite](https://vite.dev/guide/), [Vitest](https://vitest.dev/guide/).
