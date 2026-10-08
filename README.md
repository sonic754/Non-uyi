# Non Uyi — общая ветка master

Объединены ветки `Sardor`, `Boxodir`, `Behruz` и проверенный модуль Фирдавса.
История участников сохранена merge-коммитами.

- `non-uyi-ai/`: React-интерфейс, состояние, фильтры и тесты Бахoдира.
- `src/services/gemini.js`: исходный Gemini-сервис Сардора.
- `ai-prompt.js`: промпт и контракт Фирдавса; также экспортирован через
  `non-uyi-ai/src/services/prompt.js` по структуре задания.
- `gemini-client.js`: серверный клиент для проверки промпта без передачи ключа браузеру.

## Проверка Фирдавса

Из корня репозитория: `npm test`, `npm run evaluate:smoke`, `npm run evaluate`.
Ключ хранится только в локальном `.env`; пример настройки — `.env.example`.
На 2026-10-08 результат живого прогона: **29/29** для категории и языка
на модели `gemini-3.1-flash-lite`. Скрытый набор не проверен.

## React-приложение

```sh
cd non-uyi-ai
npm ci
npm test
npm run build
npm run dev
```

В отдельном терминале из корня репозитория запустите `npm start`.
Vite перенаправляет `/api/analyze` на сервер `127.0.0.1:3000`.
React запускается в API-режиме; деморежим можно включить вручную.
Для готовой React-сборки: `npm run build --prefix non-uyi-ai`, затем `npm start`.
Откройте http://127.0.0.1:3000. Без сборки сервер показывает исходный dashboard Бехруза.
Сервер использует классификацию Фирдавса, правила извлечения Бехруза и его JSON-парсер.
`product` преобразуется в `name` на границе React; неизвестный язык — в `unknown`.

Подробности промпта и подключения: [FIRDAVS.md](FIRDAVS.md).

Дополнения: пакет до 20 сообщений (одно сообщение на строку), повтор только
неудачных сообщений, CSV-экспорт отфильтрованных заказов. Поиск, фильтры и
мобильная вёрстка включены. Полная проверка задания описана в [CHECKS.md](CHECKS.md).
Живой полный анализ: `npm run evaluate:analysis`; повтор только неудачных:
`npm run evaluate:analysis -- --retry-failed`. Отчёт не содержит исходных
сообщений, адресов и черновиков и исключён из Git.
# Non Uyi operator assistant

Small, privacy-conscious web app for reviewing bakery messages. It classifies Uzbek, Russian and mixed-language messages, extracts order details as validated JSON, and prepares a same-language reply draft for an operator to review. Complaints and spam are escalated without a reply.

## Run locally

Requires Node.js 22 or newer. Copy `.env.example` to `.env` and add a Gemini API key on the server machine. Keep `.env` private; it is ignored by Git and the browser never receives the key.

```powershell
Copy-Item .env.example .env
# Set GEMINI_API_KEY in .env
npm start
```

Open http://127.0.0.1:3000. The server calls Gemini from the backend, limits request size, validates the model's exact response schema, rejects cross-origin requests, and returns safe errors. The dashboard stores reviewed message history in the current browser only.

## Checks

```powershell
npm test
npm run check
```

## Privacy and review

Do not enter payment card details or unnecessary personal information. AI drafts are suggestions; an operator must review them before sending. Complaint and spam messages never receive automated reply drafts.
