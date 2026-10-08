export const categories = {
  order: 'Buyurtma', question: 'Savol', complaint: 'Shikoyat', spam: 'Spam',
};
export const languages = { uz: 'O‘zbekcha', ru: 'Ruscha', mixed: 'Aralash', unknown: 'Aniqlanmagan' };
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_BATCH_SIZE = 20;

export function splitBatch(text) {
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

export function createOrdersCSV(messages) {
  const cell = value => {
    let text = String(value ?? '');
    if (/^[\s\uFEFF\u200B]*[=+@\-\t\r]/u.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const rows = [['Xabar', 'Til', 'Mahsulotlar', 'Manzil', 'Vaqt', 'Javob qoralamasi']];
  for (const message of messages.filter(item => item.category === 'order')) {
    rows.push([message.text, message.language, message.items?.map(item => `${item.name} × ${item.quantity ?? '—'}`).join('; '), message.address, message.time, message.reply]);
  }
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

const invalidResult = () => Object.assign(new Error('API javobi kutilgan formatda emas.'), { code: 'INVALID_RESPONSE' });
const optionalText = (value) => {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw invalidResult();
  return value.trim() || null;
};

// Validates the agreed service output, without extracting or classifying raw text.
export function normalizeResult(raw) {
  if (!raw || typeof raw !== 'object' || !Object.hasOwn(categories, raw.category)) throw invalidResult();
  const language = raw.language ?? 'unknown';
  if (!Object.hasOwn(languages, language)) throw invalidResult();
  let items = null;
  if (raw.items != null) {
    if (!Array.isArray(raw.items)) throw invalidResult();
    items = raw.items.map((item) => {
      if (!item || typeof item !== 'object') throw invalidResult();
      const name = optionalText(item.name);
      const quantity = item.quantity ?? null;
      if (!name || (quantity !== null && (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0))) throw invalidResult();
      return { name, quantity };
    });
    if (!items.length) items = null;
  }
  return {
    category: raw.category, language, items,
    address: optionalText(raw.address), time: optionalText(raw.time),
    // Complaints must always go to a human, even if the API supplies a reply.
    reply: raw.category === 'complaint' || raw.category === 'spam' ? null : optionalText(raw.reply),
  };
}

export function filterMessages(messages, { category = 'all', language = 'all', query = '' }) {
  const needle = query.trim().toLocaleLowerCase();
  return messages.filter((message) =>
    (category === 'all' || message.category === category) &&
    (language === 'all' || message.language === language) &&
    (!needle || [message.text, message.address, ...(message.items ?? []).map((item) => item.name)]
      .filter(Boolean).join(' ').toLocaleLowerCase().includes(needle)),
  );
}

export function getStats(messages) {
  return messages.reduce((stats, message) => {
    stats[message.category] += 1;
    stats.total += 1;
    return stats;
  }, { total: 0, order: 0, question: 0, complaint: 0, spam: 0 });
}

export function getErrorMessage(error) {
  if (error?.code === 'NOT_CONFIGURED') return 'Gemini API hali ulanmagan. Demo rejimidan foydalaning.';
  if (error?.code === 'DEMO_ONLY') return 'Demo rejimida ro‘yxatdagi 20 ta namunadan birini tanlang.';
  if (error?.code === 'INVALID_RESPONSE' || error instanceof SyntaxError) return 'API javobi kutilgan formatda emas. Qayta urinib ko‘ring.';
  if (error?.code === 'TIMEOUT' || error?.name === 'AbortError') return 'Javob kutish vaqti tugadi. Qayta urinib ko‘ring.';
  const status = Number(error?.status ?? error?.response?.status);
  if (status === 401 || status === 403) return 'API kaliti yoki ruxsatini tekshiring.';
  if (status === 429) return 'API so‘rovlari limiti tugadi. Birozdan keyin qayta urinib ko‘ring.';
  if (status >= 500) return 'AI xizmati vaqtincha ishlamayapti. Keyinroq qayta urinib ko‘ring.';
  if (error instanceof TypeError) return 'Xizmatga ulanib bo‘lmadi. Internet aloqasini tekshiring.';
  return 'Xabarni qayta ishlashda xato yuz berdi. Qayta urinib ko‘ring.';
}

export async function requestAnalysis(service, text, { controller, timeoutMs = 30000 }) {
  const { signal } = controller;
  let onAbort;
  const aborted = new Promise((_, reject) => {
    onAbort = () => reject(Object.assign(new Error('Request aborted'), {
      code: signal.reason === 'timeout' ? 'TIMEOUT' : 'ABORTED', name: 'AbortError',
    }));
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    const output = await Promise.race([
      aborted,
      Promise.resolve().then(() => {
        signal.throwIfAborted();
        return service(text, { signal });
      }),
    ]);
    return normalizeResult(output);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
}
