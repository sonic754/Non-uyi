import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';

async function fixture(handler, options = {}) {
  const server = createServer({ key: 'test-key', model: 'gemini-2.5-flash', fetcher: handler, ...options });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise(resolve => server.close(resolve)) };
}
const post = (base, message, extra = {}) => fetch(`${base}/api/analyze`, { method:'POST', headers: {'Content-Type':'application/json',Origin:base,...extra}, body:JSON.stringify({message}) });
const valid = {category:'complaint',language:'uz',items:null,address:null,time:null,reply:'Do not send'};

test('proxy sends only validated message to fixed Gemini endpoint and suppresses complaint draft', async () => {
  let called = false;
  const app = await fixture(async (url, options) => {
    called = true;
    assert.match(url, /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.5-flash:generateContent$/);
    assert.equal(options.headers['x-goog-api-key'], 'test-key');
    assert.match(JSON.stringify(options.body), /complaint/i);
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(valid)}]}}]}),{status:200});
  });
  try {
    const response = await post(app.base, 'Kuryer kechikdi, 2 non kerak');
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(), {result:{...valid,reply:null}});
    assert.equal(called,true);
  } finally { await app.close(); }
});

test('invalid message, origin and oversized body are rejected before provider', async () => {
  let calls = 0;
  const app = await fixture(async () => { calls++; throw Error('should not run'); });
  try {
    assert.equal((await post(app.base,'')).status,400);
    assert.equal((await post(app.base,'x'.repeat(4001))).status,400);
    assert.equal((await post(app.base,'ok',{Origin:'https://evil.example'})).status,403);
    assert.equal((await fetch(`${app.base}/api/analyze`,{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(20000)})).status,413);
    assert.equal(calls,0);
  } finally { await app.close(); }
});

test('provider 429, empty candidates, invalid JSON and timeouts return safe retryable errors', async () => {
  for (const [handler, status] of [
    [async () => new Response('{}',{status:429}),429],
    [async () => new Response('{}',{status:200}),502],
    [async () => new Response(JSON.stringify({candidates:[{content:{parts:[{text:'bad'}]}}]}),{status:200}),502],
    [async () => { throw new DOMException('Aborted','AbortError'); },504]
  ]) {
    const app = await fixture(handler);
    try {
      const res = await post(app.base,'salom');
      assert.equal(res.status,status);
      const body = await res.json();
      assert.equal(body.retryable,true);
      assert.equal(typeof body.error,'string');
      assert.doesNotMatch(JSON.stringify(body),/test-key/);
    } finally { await app.close(); }
  }
});

test('missing key fails closed; static files do not expose private paths', async () => {
  const app = await fixture(async () => { throw Error('should not run'); },{key:''});
  try {
    assert.equal((await post(app.base,'salom')).status,503);
    assert.equal((await fetch(`${app.base}/.env`)).status,404);
    assert.equal((await fetch(`${app.base}/../TASK.md`)).status,404);
    const home = await fetch(app.base);
    assert.equal(home.status,200);
    assert.match(await home.text(),/Non Uyi/);
  } finally { await app.close(); }
});