import { MAX_MESSAGE_LENGTH } from '../logic/messages.js';

// Temporary UI; Kamron can replace markup while retaining these props.
export default function MessageInput({ value, onChange, onSubmit, isLoading, error, batchMode = false, maxLength = MAX_MESSAGE_LENGTH }) {
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} aria-busy={isLoading}>
    <label htmlFor="message">Mijoz xabari</label>
    <textarea id="message" value={value} onChange={(event) => onChange(event.target.value)}
      disabled={isLoading} maxLength={maxLength} rows={5}
      placeholder="Xabarni shu yerga yozing…" aria-describedby={error ? 'message-error' : undefined} />
    <div className="form-footer"><small>{value.length} / {maxLength}</small>
      <button type="submit" disabled={isLoading || !value.trim()}>{isLoading ? 'Tahlil qilinmoqda…' : batchMode ? 'Xabarlarni tahlil qilish' : 'Xabarni tahlil qilish'}</button>
    </div>
    {isLoading && <p role="status">AI javobi kutilmoqda…</p>}
    {error && <p id="message-error" className="error" role="alert">{error}</p>}
  </form>;
}
