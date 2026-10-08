// Dependency-free fallback for environments that cannot spawn Vitest workers.
import assert from 'node:assert/strict';
import { trainingMessages, analyzeDemoMessage } from '../src/data/trainingMessages.js';
import { normalizeResult, getStats, filterMessages, getErrorMessage, requestAnalysis } from '../src/logic/messages.js';

const records = [];
for (const sample of trainingMessages) {
  const result = await requestAnalysis(analyzeDemoMessage, sample.text, { controller: new AbortController() });
  assert.deepEqual(result, sample.result, `Fixture ${sample.id}`);
  records.push({ id: sample.id, text: sample.text, ...result });
}
assert.equal(records.length, 20);
assert.deepEqual(getStats(records), { total: 20, order: 5, question: 5, complaint: 5, spam: 5 });
assert.deepEqual(filterMessages(records, { category: 'order', language: 'mixed', query: 'АЛАЙСКИЙ' }).map(({ id }) => id), [3]);
assert.equal(normalizeResult({ category: 'complaint', reply: 'hidden' }).reply, null);
assert.deepEqual(normalizeResult({ category: 'order' }), {
  category: 'order', language: 'unknown', items: null, address: null, time: null, reply: null,
});
for (const value of [null, { category: 'invalid' }, { category: 'order', items: [{ name: 'non', quantity: -1 }] }]) {
  assert.throws(() => normalizeResult(value));
}
for (const [status, expected] of [[401, 'kaliti'], [403, 'kaliti'], [429, 'limiti'], [503, 'vaqtincha']]) {
  assert.ok(getErrorMessage({ status }).includes(expected));
}
assert.ok(getErrorMessage(new TypeError()).includes('Internet'));
assert.ok(getErrorMessage(new SyntaxError()).includes('formatda emas'));
const timeout = new AbortController();
await assert.rejects(requestAnalysis(() => new Promise(() => {}), 'test', { controller: timeout, timeoutMs: 5 }), { code: 'TIMEOUT' });
assert.equal(timeout.signal.aborted, true);
await assert.rejects(analyzeDemoMessage('other'), { code: 'DEMO_ONLY' });
console.log('PASS: 20 fixtures, combined filters, statistics, null values, complaint suppression, invalid responses, API errors, timeout and demo boundary.');
console.log('This check does not render React or call Gemini. Run npm test for React integration tests.');
