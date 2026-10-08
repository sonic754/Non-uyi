import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAnalysis, ordersCSV, splitMessages, summarize, filteredRecords, restoreRecords } from '../public/core.js';

test('fenced JSON is parsed into exact order schema', () => {
  assert.deepEqual(parseAnalysis('```json\n{"category":"order","language":"uz","items":[{"product":"patir","quantity":5}],"address":null,"time":null,"reply":"So‘rovingizni egaga yetkazamiz."}\n```'), {
    category: 'order', language: 'uz', items: [{ product: 'patir', quantity: 5 }], address: null, time: null, reply: 'So‘rovingizni egaga yetkazamiz.'
  });
});
test('complaint suppresses draft and escalates, even if model supplies one', () => {
  assert.deepEqual(parseAnalysis(JSON.stringify({category:'complaint',language:'mixed',items:[],address:null,time:null,reply:'hello'})), {category:'complaint',language:'mixed',items:null,address:null,time:null,reply:null});
});
test('malformed, extra fields, negative quantities and invalid types reject', () => {
  for (const value of ['oops', '{}', JSON.stringify({category:'order',language:'ru',items:[{product:'x',quantity:-1}],address:null,time:null,reply:null}), JSON.stringify({category:'spam',language:'ru',items:null,address:null,time:null,reply:null,other:2}), JSON.stringify({category:'question',language:1,items:null,address:null,time:null,reply:null})]) {
    assert.throws(() => parseAnalysis(value));
  }
});
test('CSV quotes data and neutralizes spreadsheet formulas', () => {
  const csv = ordersCSV([{message:'=HYPERLINK("bad")', result:{category:'order',language:'ru',items:[{product:'+cmd',quantity:1}],address:'@ref',time:'-1+2',reply:null}}]);
  assert.match(csv, /'\+cmd/);
  assert.match(csv, /'@ref/);
  assert.match(csv, /'=HYPERLINK/);
  assert.match(csv, /'\-1\+2/);
  assert.match(csv, /""bad""/);
});
test('batch trims blank lines and preserves one message per line', () => {
  assert.deepEqual(splitMessages(' a \n\n b \r\n'), ['a','b']);
});

test('counters do not count failed or pending rows as spam', () => {
  assert.deepEqual(summarize([{status:'error'},{status:'pending'},{status:'done',result:{category:'complaint'}},{status:'done',result:{category:'order'}}]), {order:1,question:0,complaint:1,spam:0});
});
test('search and category filter keep only matching completed records', () => {
  const rows = [{message:'Patir 2',status:'done',result:{category:'order'}},{message:'Samса',status:'error'},{message:'non',status:'done',result:{category:'question'}}];
  assert.deepEqual(filteredRecords(rows,'order','patir'),[rows[0]]);
  assert.deepEqual(filteredRecords(rows,'all','sam'),[rows[1]]);
});
test('persisted rows are validated and never resurrect bad schema or pending rows', () => {
  const rows = [{id:'abc',message:'salom',status:'done',result:{category:'spam',language:'uz',items:null,address:null,time:null,reply:null}}, {id:'bad',message:'hey',status:'pending',result:null},{id:'x',message:'abc',status:'done',result:{category:'order'}}];
  assert.deepEqual(restoreRecords(JSON.stringify(rows)),[rows[0]]);
  assert.deepEqual(restoreRecords('<invalid>'),[]);
});
