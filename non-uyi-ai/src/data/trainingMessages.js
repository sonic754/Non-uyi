// Hand-labelled fixtures, not AI predictions. Five examples in each category.
const fixture = (id, text, category, language, details = {}) => ({
  id, text,
  result: { category, language, items: null, address: null, time: null, reply: null, ...details },
});

export const trainingMessages = [
  fixture(1, '2 ta patir non, Chilonzor 12, bugun 18:00 ga.', 'order', 'uz', {
    items: [{ name: 'patir non', quantity: 2 }], address: 'Chilonzor 12', time: 'bugun 18:00', reply: 'Buyurtma ma’lumotlari olindi. Operator tasdiqlaydi.',
  }),
  fixture(2, 'Мне 3 лепёшки на Юнусабад 4, завтра к 09:00.', 'order', 'ru', {
    items: [{ name: 'лепёшка', quantity: 3 }], address: 'Юнусабад 4', time: 'завтра 09:00', reply: 'Данные заказа получены. Оператор подтвердит заказ.',
  }),
  fixture(3, '5 ta somsa kerak, доставка на Алайский, 13:00.', 'order', 'mixed', {
    items: [{ name: 'somsa', quantity: 5 }], address: 'Алайский', time: '13:00', reply: 'Buyurtma ma’lumotlari olindi. Operator tasdiqlaydi.',
  }),
  fixture(4, 'Ikkita non buyurtma qilmoqchiman.', 'order', 'uz', {
    items: [{ name: 'non', quantity: 2 }], reply: 'Yetkazish manzili va vaqtini yozing.',
  }),
  fixture(5, 'Хочу заказать самсу.', 'order', 'ru', {
    items: [{ name: 'самса', quantity: null }], reply: 'Уточните количество, адрес и время.',
  }),
  fixture(6, 'Soat nechada ochilasizlar?', 'question', 'uz', { reply: 'Ish vaqtini operator aniqlashtiradi.' }),
  fixture(7, 'Сколько стоит лепёшка?', 'question', 'ru', { reply: 'Актуальную цену уточнит оператор.' }),
  fixture(8, 'Доставка bormi?', 'question', 'mixed', { reply: 'Yetkazib berish shartlarini operator aniqlashtiradi.' }),
  fixture(9, 'Somsaning ichida nima bor?', 'question', 'uz', { reply: 'Mahsulot tarkibini operator aniqlashtiradi.' }),
  fixture(10, 'Можно оплатить картой?', 'question', 'ru', { reply: 'Способы оплаты уточнит оператор.' }),
  fixture(11, 'Non sovuq keldi, juda noroziman.', 'complaint', 'uz'),
  fixture(12, 'Заказ опоздал на два часа!', 'complaint', 'ru'),
  fixture(13, 'Somsa kuygan, верните деньги.', 'complaint', 'mixed'),
  fixture(14, 'Buyurtmamda ikkita non yetishmayapti.', 'complaint', 'uz'),
  fixture(15, 'Курьер грубил, прошу разобраться.', 'complaint', 'ru'),
  fixture(16, 'Bir kunda million ishlang! Havolani bosing.', 'spam', 'uz'),
  fixture(17, 'Вы выиграли приз! Пришлите номер карты.', 'spam', 'ru'),
  fixture(18, 'Крипто investitsiya, 100% foyda!', 'spam', 'mixed'),
  fixture(19, 'Reklama joylashtiramiz, kanalimizga qo‘shiling.', 'spam', 'uz'),
  fixture(20, 'Продам базу телефонных номеров.', 'spam', 'ru'),
];

export async function analyzeDemoMessage(message) {
  const match = trainingMessages.find(({ text }) => text === message.trim());
  if (!match) {
    throw Object.assign(new Error('Demo rejimida ro‘yxatdagi 20 ta namunadan birini tanlang.'), { code: 'DEMO_ONLY' });
  }
  return structuredClone(match.result);
}
