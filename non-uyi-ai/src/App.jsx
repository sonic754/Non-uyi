import { useEffect, useRef, useState } from 'react';
import MessageInput from './components/MessageInput.jsx';
import OrdersTable from './components/OrdersTable.jsx';
import Dashboard from './components/Dashboard.jsx';
import analyzeMessageService from './services/analyzeMessage.js';
import { analyzeDemoMessage, trainingMessages } from './data/trainingMessages.js';
import { categories, languages, filterMessages, getStats, getErrorMessage, MAX_MESSAGE_LENGTH, requestAnalysis } from './logic/messages.js';
import './App.css';

export default function App({ analyzeMessage = analyzeMessageService, initialDemoMode = true, timeoutMs = 60000 }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(initialDemoMode);
  const [category, setCategory] = useState('all');
  const [language, setLanguage] = useState('all');
  const [query, setQuery] = useState('');
  const activeRequest = useRef(null);

  useEffect(() => () => activeRequest.current?.abort('unmount'), []);

  async function handleSubmit() {
    if (activeRequest.current) return;
    const messageText = text.trim();
    if (!messageText) { setError('Xabar matnini kiriting.'); return; }
    if (messageText.length > MAX_MESSAGE_LENGTH) { setError(`Xabar ${MAX_MESSAGE_LENGTH} belgidan oshmasligi kerak.`); return; }
    const controller = new AbortController();
    activeRequest.current = controller;
    setIsLoading(true);
    setError('');
    try {
      const result = await requestAnalysis(demoMode ? analyzeDemoMessage : analyzeMessage, messageText, { controller, timeoutMs });
      if (controller.signal.aborted) return;
      const record = { ...result, id: crypto.randomUUID(), text: messageText, source: demoMode ? 'demo' : 'api' };
      setMessages((previous) => [record, ...previous]);
      setText('');
    } catch (cause) {
      if (controller.signal.reason !== 'unmount') setError(getErrorMessage(cause));
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
      if (controller.signal.reason !== 'unmount') setIsLoading(false);
    }
  }

  const visible = filterMessages(messages, { category, language, query });
  const stats = getStats(messages);

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
      <MessageInput value={text} onChange={(value) => { setText(value); setError(''); }} onSubmit={handleSubmit} isLoading={isLoading} error={error} />
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
    <OrdersTable orders={visible.filter((message) => message.category === 'order')} />
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
