import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyWithGemini } from './gemini-client.js';

test('Gemini request uses header authentication and validates JSON response', async () => {
  const result = await classifyWithGemini('5ta somsa kerak', {
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      assert.equal(url.includes('test-key'), false);
      assert.equal(options.headers['x-goog-api-key'], 'test-key');
      const body = JSON.parse(options.body);
      assert.equal(body.generationConfig.responseMimeType, 'application/json');
      assert.equal(body.generationConfig.responseJsonSchema.additionalProperties, false);
      return { ok: true, json: async () => ({ candidates: [{ content: {
        parts: [{ text: '{"category":"order","language":"uz"}' }],
      } }] }) };
    },
  });
  assert.deepEqual(result, { category: 'order', language: 'uz' });
});

test('API failures never echo provider content or credentials', async () => {
  await assert.rejects(classifyWithGemini('тест', {
    apiKey: 'test-key',
    fetchImpl: async () => ({ ok: false, status: 429 }),
  }), /HTTP 429/);
  await assert.rejects(classifyWithGemini('тест', {
    apiKey: 'test-key',
    fetchImpl: async () => { throw new Error('secret diagnostic test-key'); },
  }), /ошибка сети/);
});

test('Blocked, empty and malformed model responses become recoverable errors', async () => {
  for (const data of [{}, { candidates: [] }, { candidates: [{ content: {
    parts: [{ text: 'not json' }],
  } }] }]) {
    await assert.rejects(classifyWithGemini('тест', {
      apiKey: 'test-key', fetchImpl: async () => ({ ok: true, json: async () => data }),
    }));
  }
});
