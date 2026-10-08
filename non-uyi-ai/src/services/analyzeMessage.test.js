import { afterEach, expect, it, vi } from 'vitest';
import analyzeMessage from './analyzeMessage.js';

afterEach(() => vi.unstubAllGlobals());
const result = { category:'order', language:'ru', items:[{product:'самса',quantity:10}], address:'Тестовый адрес', time:'завтра 09:00', reply:'Передадим ваш запрос оператору.' };

it('adapts the server product schema and forwards the abort signal', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok:true, json:async () => ({result}) });
  vi.stubGlobal('fetch', fetchMock);
  const {signal} = new AbortController();
  expect(await analyzeMessage('10 самсы', {signal})).toEqual({...result,items:[{name:'самса',quantity:10}]});
  expect(fetchMock).toHaveBeenCalledWith('/api/analyze', expect.objectContaining({signal,body:JSON.stringify({message:'10 самсы'})}));
});

it('keeps missing quantity and maps unknown language without inventing data', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true,json:async () => ({result:{...result,language:null,items:[{product:'самса',quantity:null}]}})}));
  expect(await analyzeMessage('самса')).toMatchObject({language:'unknown',items:[{name:'самса',quantity:null}]});
});

it.each([{}, {result:{...result,items:'wrong'}}, {result:{...result,category:'invalid'}}])('rejects malformed successful server responses (%j)', async (body) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true,json:async () => body}));
  await expect(analyzeMessage('тест')).rejects.toMatchObject({code:'INVALID_RESPONSE'});
});

it('suppresses complaint replies at the UI boundary', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true,json:async () => ({result:{...result,category:'complaint',items:null}})}));
  expect(await analyzeMessage('жалоба')).toMatchObject({category:'complaint',reply:null});
});

it('retains HTTP error status without displaying upstream diagnostics', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:false,status:429}));
  await expect(analyzeMessage('тест')).rejects.toMatchObject({status:429});
});
