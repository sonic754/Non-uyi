const fields = ['category', 'language', 'items', 'address', 'time', 'reply'];
const drafts = {
  order: {
    uz: 'So‘rovingizni egaga yetkazamiz.',
    ru: 'Здравствуйте! Передадим ваш запрос владельцу для уточнения.',
    mixed: 'So‘rovingizni egaga yetkazamiz. Передадим ваш запрос владельцу.'
  },
  question: {
    uz: 'Assalomu alaykum! Bu ma’lumotni egadan aniqlashtirib, sizga xabar beramiz.',
    ru: 'Здравствуйте! Уточним эту информацию у владельца и ответим вам.',
    mixed: 'Bu ma’lumotni egadan aniqlashtiramiz. Уточним у владельца и ответим вам.'
  }
};
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const optionalText = value => value === null || (typeof value === 'string' && value.trim().length > 0 && value.length <= 2000);

export function parseAnalysis(text) {
  if (typeof text !== 'string') throw new Error('Model javobi matn emas.');
  const source = text.trim();
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(source);
  let data;
  try { data = JSON.parse(match ? match[1] : source); }
  catch { throw new Error('Model JSON qaytarmadi. Qayta urinib ko‘ring.'); }
  if (!exact(data, fields) || !['order','question','complaint','spam'].includes(data.category) || !['ru','uz','mixed',null].includes(data.language) || !optionalText(data.address) || !optionalText(data.time) || !optionalText(data.reply)) {
    throw new Error('Model ma’lumotlari kerakli sxemaga mos emas.');
  }
  if (data.items !== null && (!Array.isArray(data.items) || (data.category === 'order' && !data.items.length) || data.items.length > 30 || !data.items.every(item => exact(item, ['product','quantity']) && typeof item.product === 'string' && item.product.trim().length > 0 && item.product.length <= 200 && (item.quantity === null || (Number.isSafeInteger(item.quantity) && item.quantity > 0))))) {
    throw new Error('Mahsulot yoki miqdor noto‘g‘ri.');
  }
  if (data.category === 'complaint' || data.category === 'spam') return { category:data.category, language:data.language, items:null, address:null, time:null, reply:null };
  if (data.category === 'question' && (data.items !== null || data.address !== null || data.time !== null)) throw new Error('Question data must not contain order fields.');
  if (!data.reply && data.language !== null) throw new Error('Order and question analyses require a reply draft.');
  if (data.category === 'question') return {category:'question',language:data.language,items:null,address:null,time:null,reply:data.reply};
  return {category:'order', language:data.language, items:data.items, address:data.address, time:data.time, reply:data.reply};
}

export function splitMessages(text) {
  return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s\uFEFF\u200B]*[=+@\-\t\r]/u.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function ordersCSV(records) {
  const rows = [['Xabar','Til','Mahsulotlar','Manzil','Vaqt','Javob qoralamasi']];
  for (const record of records.filter(r => r.result?.category === 'order')) {
    const r = record.result;
    rows.push([record.message, r.language, r.items?.map(i => `${i.product} × ${i.quantity}`).join('; ') ?? '', r.address, r.time, r.reply]);
  }
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function summarize(records) {
  const counts = {order:0,question:0,complaint:0,spam:0};
  for (const record of records) if (record.status === 'done' && Object.hasOwn(counts,record.result?.category)) counts[record.result.category]++;
  return counts;
}

export function filteredRecords(records, category, query) {
  const needle = query.trim().toLocaleLowerCase();
  return records.filter(record => (category === 'all' || (record.status === 'done' && record.result?.category === category)) && (record.message ?? '').toLocaleLowerCase().includes(needle));
}

export function restoreRecords(raw) {
  try {
    const records = JSON.parse(raw);
    if (!Array.isArray(records)) return [];
    return records.slice(0,500).filter(record => {
      if (!record || record.status !== 'done' || typeof record.id !== 'string' || typeof record.message !== 'string' || record.message.length > 4000 || !record.message.trim()) return false;
      try { return JSON.stringify(parseAnalysis(JSON.stringify(record.result))) === JSON.stringify(record.result); }
      catch { return false; }
    }).map(record => ({id:record.id,message:record.message,status:'done',result:record.result}));
  } catch { return []; }
}
