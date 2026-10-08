import { normalizeResult } from '../logic/messages.js';

export default async function analyzeMessage(message, { signal } = {}) {
  const response = await fetch('/api/analyze', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }), signal,
  });
  if (!response.ok) throw Object.assign(new Error('Analysis API failed'), { status: response.status });
  try {
    const { result } = await response.json();
    return normalizeResult({
      ...result, language: result.language ?? 'unknown',
      items: result.items === null ? null : result.items.map(({ product, quantity }) => ({ name: product, quantity })),
    });
  } catch {
    throw Object.assign(new Error('Invalid analysis response'), { code: 'INVALID_RESPONSE' });
  }
}
