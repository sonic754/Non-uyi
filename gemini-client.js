import { CLASSIFICATION_SCHEMA, buildClassificationPrompt, parseClassificationResponse } from './ai-prompt.js';

/** Node/server only: never ship the API key in a browser bundle. */
export async function classifyWithGemini(message, {
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  fetchImpl = fetch,
} = {}) {
  if (!apiKey) throw new Error('Задайте GEMINI_API_KEY локально');
  if (!/^[a-zA-Z0-9.-]+$/.test(model)) throw new Error('Некорректное имя модели');
  let response;
  try {
    response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildClassificationPrompt(message) }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseJsonSchema: CLASSIFICATION_SCHEMA,
        },
      }),
    });
  } catch {
    throw new Error('Gemini: ошибка сети или превышено время ожидания');
  }
  if (!response.ok) {
    // Do not echo provider error payloads, headers, URLs or credentials.
    const error = new Error(`Gemini API: HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  let data;
  try { data = await response.json(); } catch {
    throw new Error('Gemini: некорректный ответ API');
  }
  const text = data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '').join('');
  if (!text) throw new Error('Gemini не вернул текст классификации');
  return parseClassificationResponse(text);
}
