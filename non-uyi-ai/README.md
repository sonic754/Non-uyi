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

Ikkinchi terminalda loyiha ildizidan `npm start` ishga tushiring.
Server kalitni lokal `.env` orqali oladi. Vite `/api` so‘rovlarini
`http://127.0.0.1:3000` serveriga uzatadi. Asosiy sahifa API rejimida ochiladi.

```sh
npm test
npm run test:logic
npm run build
```

## Hozirgi imkoniyatlar

- Xabar yuborish, loading holati va takroriy parallel yuborishni bloklash.
- Bir nechta xabar: har bir yangi qator alohida xabar, bir yuborishda 20 tagacha. Har biri 4000 belgigacha.
- Paketda xato bo‘lsa qolgan xabarlar tahlil qilinadi, muvaffaqiyatli natijalar saqlanadi; faqat xato xabarlar qayta yuborish uchun qoladi.
- Filtrlangan buyurtmalarni CSV sifatida yuklab olish, UTF-8 BOM va formula injection himoyasi bilan.
- Kategoriya, til va matn/mahsulot/manzil bo‘yicha birgalikdagi filtrlar.
- Barcha muvaffaqiyatli xabarlar uchun statistika; filtrlar statistikani o‘zgartirmaydi.
- Filtrlangan buyurtmalar jadvali, natijalar va tavsiya etilgan javoblar.
- Shikoyatlar qizil rangda, avtomatik javobsiz. Hech qanday javob mijozga yuborilmaydi.
- API ruxsati, limit, server, tarmoq va JSON formati xatolari. Serverda 45 soniya, UI da 60 soniya kutish chegarasi.
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

Haqiqiy API `src/services/analyzeMessage.js` orqali serverga ulangan:

```js
export default async function analyzeMessage(message, { signal } = {}) {
  // POST /api/analyze, signal fetch ga uzatiladi.
  // Serverning product maydoni React uchun name ga aylantiriladi.
}
```

`App` ushbu funksiyani import qiladi. Asosiy sahifa API rejimida boshlanadi.
**Demo rejimi** belgisini yoqsangiz, namunaviy javoblar ishlaydi.
API xatosida demo javobiga yashirincha o‘tilmaydi. Test yoki boshqa integratsiya uchun
`<App analyzeMessage={yourService} initialDemoMode={false} />` ishlaydi.

## Taklif etilgan yagona JSON shartnomasi

Server Behruzning olti maydonli JSON formatini tekshiradi; adapter uni quyidagi React formatiga moslaydi.
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

API serveri Gemini orqali to‘liq tahlilni qaytaradi. Bu yerda 20 namunaga
asoslangan UI testlari model aniqligi bo‘yicha yashirin test hisoblanmaydi.

Texnik ma’lumotlar: [React useState](https://react.dev/reference/react/useState),
[Vite](https://vite.dev/guide/), [Vitest](https://vitest.dev/guide/).
