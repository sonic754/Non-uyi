import { useEffect, useRef, useState } from 'react';
import MessageInput from './components/MessageInput.jsx';
import OrdersTable from './components/OrdersTable.jsx';
import Dashboard from './components/Dashboard.jsx';
import analyzeMessageService from './services/analyzeMessage.js';
import { analyzeDemoMessage, trainingMessages } from './data/trainingMessages.js';
import { categories, languages, filterMessages, getStats, getErrorMessage, MAX_MESSAGE_LENGTH, MAX_BATCH_SIZE, splitBatch, createOrdersCSV, requestAnalysis } from './logic/messages.js';
import './App.css';

export default function App({ analyzeMessage = analyzeMessageService, initialDemoMode = true, timeoutMs = 60000 }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(initialDemoMode);
  const [batchMode, setBatchMode] = useState(false);
  const [progress, setProgress] = useState(null);
  const [category, setCategory] = useState('all');
  const [language, setLanguage] = useState('all');
  const [query, setQuery] = useState('');
  const activeRequest = useRef(null);

  useEffect(() => () => activeRequest.current?.abort('unmount'), []);

  async function handleSubmit() {
    if (activeRequest.current) return;
    const messageText = text.trim();
    if (!messageText) { setError('Xabar matnini kiriting.'); return; }
    const inputMessages = batchMode ? splitBatch(messageText) : [messageText];
    if (inputMessages.length > MAX_BATCH_SIZE) { setError(`Bir martada ${MAX_BATCH_SIZE} tagacha xabar yuboring.`); return; }
    if (inputMessages.some(item => item.length > MAX_MESSAGE_LENGTH)) { setError(`Har bir xabar ${MAX_MESSAGE_LENGTH} belgidan oshmasligi kerak.`); return; }
    const batchController = new AbortController();
    activeRequest.current = batchController;
    setIsLoading(true);
    setError('');
    const failed = [];
    const failures = [];
    try {
      for (const [index, item] of inputMessages.entries()) {
        if (batchController.signal.aborted) return;
        setProgress({ current:index + 1, total:inputMessages.length });
        const controller = new AbortController();
        const abortItem = () => controller.abort(batchController.signal.reason);
        batchController.signal.addEventListener('abort', abortItem, { once:true });
        try {
          const result = await requestAnalysis(demoMode ? analyzeDemoMessage : analyzeMessage, item, { controller, timeoutMs });
          if (batchController.signal.aborted) return;
          const record = { ...result, id:crypto.randomUUID(), text:item, source:demoMode ? 'demo' : 'api' };
          setMessages(previous => [record, ...previous]);
        } catch (cause) {
          if (batchController.signal.aborted) return;
          failed.push(item);
          failures.push(`${index + 1}. ${getErrorMessage(cause)}`);
        } finally { batchController.signal.removeEventListener('abort', abortItem); }
      }
      setText(failed.join('\n'));
      if (failures.length) setError(batchMode ? `${failed.length} ta xabar qayta ishlanmadi. ${failures.join(' ')}` : failures[0].replace(/^1\. /, ''));
    } finally {
      if (activeRequest.current === batchController) activeRequest.current = null;
      if (!batchController.signal.aborted) { setIsLoading(false); setProgress(null); }
    }
  }

  const visible = filterMessages(messages, { category, language, query });
  const stats = getStats(messages);
  const visibleOrders = visible.filter(message => message.category === 'order');

  function exportOrders() {
    const url = URL.createObjectURL(new Blob([createOrdersCSV(visibleOrders)], {type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'non-uyi-orders.csv';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <main>
    <header><div><p className="eyebrow">NON UYI</p><h1>AI operator</h1><p className="muted">Mijoz xabarlari va buyurtmalar bir joyda.</p></div>
      <span className="mode-badge">{demoMode ? 'Demo rejimi' : 'API rejimi'}</span></header>
    <Dashboard stats={stats} />
    <section className="panel" aria-label="Xabarni qayta ishlash">
      <div className="section-top"><h2>Yangi xabar</h2><label className="toggle">
        <input type="checkbox" checked={demoMode} disabled={isLoading} onChange={(event) => { setDemoMode(event.target.checked); setError(''); }} />Demo rejimi
      </label></div>
      {demoMode && <div className="demo-note"><p>Bu rejim tayyor namunaviy javoblarni ko‘rsatadi. Gemini API chaqirilmaydi.</p>
        <label htmlFor="sample">Sinov xabari</label>
        <select id="sample" value="" disabled={isLoading} onChange={(event) => {
          const sample = trainingMessages.find((item) => item.id === Number(event.target.value));
          if (sample) { setText(sample.text); setError(''); }
        }}><option value="" disabled>20 ta namunadan tanlang</option>
          {trainingMessages.map((sample) => <option key={sample.id} value={sample.id}>{sample.id}. {sample.text}</option>)}
        </select>
      </div>}
      <label className="toggle batch-toggle"><input type="checkbox" checked={batchMode} disabled={isLoading} onChange={event => { setBatchMode(event.target.checked); setError(''); }} />Bir nechta xabar</label>
      {batchMode && <p className="muted batch-help">Har bir xabarni yangi qatordan yozing. Bir martada 20 tagacha, har biri 4000 belgigacha.</p>}
      <MessageInput value={text} onChange={(value) => { setText(value); setError(''); }} onSubmit={handleSubmit} isLoading={isLoading} error={error} batchMode={batchMode} maxLength={batchMode ? MAX_MESSAGE_LENGTH * MAX_BATCH_SIZE + MAX_BATCH_SIZE : MAX_MESSAGE_LENGTH} />
      {progress && batchMode && <p role="status">{progress.current} / {progress.total} ta xabar tahlil qilinmoqda</p>}
      <p className="muted"><small>Javoblar operator uchun taklif sifatida ko‘rsatiladi. Mijozga avtomatik yuborilmaydi.</small></p>
    </section>
    <section className="panel" aria-label="Filtrlar">
      <div className="filters"><label>Kategoriya<select value={category} onChange={(event) => setCategory(event.target.value)}>
        <option value="all">Barcha kategoriyalar</option>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      <label>Til<select value={language} onChange={(event) => setLanguage(event.target.value)}>
        <option value="all">Barcha tillar</option>{Object.entries(languages).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
      <label>Qidiruv<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Xabar, mahsulot yoki manzil" /></label></div>
      <div className="section-top"><p role="status">{visible.length} / {messages.length} ta xabar ko‘rsatilmoqda</p>
        <button className="secondary" onClick={() => { setCategory('all'); setLanguage('all'); setQuery(''); }}>Filtrlarni tozalash</button></div>
    </section>
    <div className="export-bar"><span className="muted">CSV: filtrlangan buyurtmalar ({visibleOrders.length})</span><button className="secondary" disabled={!visibleOrders.length} onClick={exportOrders}>CSV yuklab olish</button></div>
    <OrdersTable orders={visibleOrders} />
    <section className="panel" aria-labelledby="results-title"><h2 id="results-title">Tahlil natijalari</h2>
      {!visible.length && <p className="muted">{messages.length ? 'Filtrlarga mos xabar topilmadi.' : 'Hali xabarlar yo‘q. Birinchi xabarni tahlil qiling.'}</p>}
      <div className="results">{visible.map((message) => <article key={message.id} className={`result ${message.category}`} aria-label={`${categories[message.category]} natijasi`}>
        <div className="result-meta"><strong>{categories[message.category]}</strong><span>{languages[message.language]} · {message.source === 'demo' ? 'Demo' : 'API'}</span></div>
        <p className="message-text">{message.text}</p>
        {message.category === 'complaint' && <p className="complaint-notice">Operator aralashuvi kerak. Avtomatik javob berilmaydi.</p>}
        {message.category === 'spam' && <p className="muted">Spam sifatida belgilandi.</p>}
        {message.reply && <div className="reply"><strong>Tavsiya etilgan javob</strong><p>{message.reply}</p></div>}
      </article>)}</div>
    </section>
    <footer>Xabarlar ushbu sessiyada saqlanadi. Sahifa yangilansa, tarix tozalanadi.</footer>
  </main>;
}
