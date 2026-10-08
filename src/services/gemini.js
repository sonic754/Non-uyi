const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 30_000;

function getApiUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
}

function getGeminiError(status) {
  const messages = {
    400: "Gemini отклонил запрос. Проверь prompt и формат данных.",
    401: "Неверный API-ключ Gemini.",
    403: "Доступ к Gemini API запрещён. Проверь ключ и разрешения.",
    429: "Превышен лимит запросов Gemini API. Повтори позже.",
    500: "Ошибка сервера Gemini. Повтори запрос позже.",
    503: "Gemini временно недоступен. Повтори запрос позже."
  };

  return messages[status] || `Ошибка Gemini API: ${status}`;
}

/**
 * Sends a prompt to Gemini and returns the model's text response.
 * JSON parsing is intentionally handled by parser.js, not by this service.
 */
export async function askAI(prompt) {
  if (!API_KEY) {
    throw new Error(
      "Не найден VITE_GEMINI_API_KEY. Добавь ключ в локальный файл .env.local."
    );
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Нельзя отправить пустой prompt в Gemini.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(getGeminiError(response.status));
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Gemini вернул некорректный ответ сервера.");
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      const finishReason = data?.candidates?.[0]?.finishReason;
      throw new Error(
        finishReason
          ? `Gemini не вернул текст. Причина: ${finishReason}.`
          : "Gemini вернул пустой или неполный ответ."
      );
    }

    return text;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Gemini не ответил за 30 секунд. Проверь интернет и повтори.");
    }

    if (error instanceof TypeError) {
      throw new Error("Не удалось подключиться к Gemini. Проверь интернет.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

