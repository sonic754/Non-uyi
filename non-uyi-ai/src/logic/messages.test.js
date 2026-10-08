import { describe, expect, it } from 'vitest';
import { filterMessages, getStats, normalizeResult } from './messages.js';
import { analyzeDemoMessage, trainingMessages } from '../data/trainingMessages.js';

describe('API output contract', () => {
  it('keeps missing order fields null instead of inventing data', () => {
    expect(normalizeResult({ category: 'order' })).toEqual({
      category: 'order', language: 'unknown', items: null, address: null, time: null, reply: null,
    });
    expect(normalizeResult({ category: 'order', items: [{ name: 'non' }] }).items[0].quantity).toBeNull();
  });
  it.each([
    null, 'JSON string', { category: 'toString' }, { category: 'unknown' },
    { category: 'order', language: 'en' }, { category: 'order', address: {} },
    { category: 'order', items: {} }, { category: 'order', items: [null] },
    { category: 'order', items: [{ name: 'non', quantity: -1 }] },
    { category: 'order', items: [{ name: 'non', quantity: 0 }] },
    { category: 'order', items: [{ name: 'non', quantity: '2' }] },
    { category: 'order', items: [{ name: 'non', quantity: Infinity }] },
  ])('rejects invalid output: %j', (value) => {
    expect(() => normalizeResult(value)).toThrow('API javobi');
  });
  it('handles all fixture categories and combined filters', () => {
    const records = trainingMessages.map(({ id, text, result }) => ({ id, text, ...normalizeResult(result) }));
    expect(records).toHaveLength(20);
    expect(getStats(records)).toEqual({ total: 20, order: 5, question: 5, complaint: 5, spam: 5 });
    expect(filterMessages(records, { category: 'order', language: 'mixed', query: 'АЛАЙСКИЙ' }).map(({ id }) => id)).toEqual([3]);
  });
  it('does not pretend to classify arbitrary demo text', async () => {
    await expect(analyzeDemoMessage('Boshqa xabar')).rejects.toMatchObject({ code: 'DEMO_ONLY' });
  });
});
