(() => {
  const $ = (selector) => document.querySelector(selector);
  const form = $('#analyze-form');
  const input = $('#message-input');
  const list = $('#message-list');
  const resultsKey = 'non-uyi.messages.v1';
  const labels = { order: 'Buyurtma', question: 'Savol', complaint: 'Shikoyat', spam: 'Spam' };
  const samples = {
    order: 'Assalomu alaykum, ertaga ertalab 2 ta patir va 1 ta tandir non kerak. Yetkazib berasizlarmi?',
    question: 'Salom, bugun qaysi vaqtagacha ishlaysizlar va patir narxi qancha?',
    complaint: 'Kecha buyurtmam kechikib keldi, nonlar ham sovuq edi. Pulimni qaytaring.'
  };
  let rows = readRows();

  function readRows() {
    try {
      const parsed = JSON.parse(localStorage.getItem(resultsKey) || '[]');
      return Array.isArray(parsed) ? parsed.filter((row) => row && typeof row.message === 'string' && row.analysis && typeof row.analysis === 'object').slice(0, 100) : [];
    } catch { return []; }
  }
  function categoryOf(a) { return String(a.category || a.type || 'question').toLowerCase(); }
  function render() {
    const query = $('#search-input').value.trim().toLocaleLowerCase();
    const filter = $('#filter-select').value;
    const visible = rows.filter((row) => {
      const category = categoryOf(row.analysis);
      return (filter === 'all' || category === filter) && (!query || row.message.toLocaleLowerCase().includes(query));
    });
    $('#stat-total').textContent = String(rows.length);
    $('#stat-orders').textContent = String(rows.filter((r) => categoryOf(r.analysis) === 'order').length);
    $('#stat-questions').textContent = String(rows.filter((r) => categoryOf(r.analysis) === 'question').length);
    $('#stat-review').textContent = String(rows.filter((r) => ['complaint', 'spam'].includes(categoryOf(r.analysis))).length);
    list.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement('div'); empty.className = 'empty-state';
      const icon = document.createElement('span'); icon.className = 'empty-icon'; icon.textContent = '✉';
      const title = document.createElement('strong'); title.textContent = rows.length ? 'Mos xabar topilmadi' : 'Hozircha xabar yo‘q';
      const note = document.createElement('span'); note.textContent = rows.length ? 'Qidiruv yoki filtrni o‘zgartirib ko‘ring.' : 'O‘ngdagi oynaga xabar kiriting yoki namuna tanlang.';
      empty.append(icon, title, note); list.append(empty); return;
    }
    visible.forEach((row) => {
      const article = document.createElement('article'); article.className = 'message-row'; article.tabIndex = 0;
      const message = document.createElement('span'); message.className = 'message-text'; message.textContent = row.message;
      const badge = document.createElement('span'); badge.className = `category-badge ${categoryOf(row.analysis)}`; badge.textContent = labels[categoryOf(row.analysis)] || 'Ko‘rib chiqish';
      const meta = document.createElement('span'); meta.className = 'message-meta'; meta.textContent = row.createdAt ? new Date(row.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '';
      article.append(message, badge, meta); article.addEventListener('click', () => showResult(row.analysis));
      article.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showResult(row.analysis); } });
      list.append(article);
    });
  }
  function showResult(a) {
    const category = categoryOf(a);
    $('#result-card').hidden = false; $('#error-card').hidden = true;
    $('#result-title').textContent = category === 'complaint' ? 'Operator ko‘rigi kerak' : 'Xabar tahlil qilindi';
    const badge = $('#result-badge'); badge.className = `category-badge ${category}`; badge.textContent = labels[category] || 'Ko‘rib chiqish';
    const details = $('#result-details'); details.replaceChildren();
    const fields = [
      ['Til', a.language || a.lang || 'Aniqlanmadi'],
      ['Ishonch', typeof a.confidence === 'number' ? `${Math.round(a.confidence * (a.confidence <= 1 ? 100 : 1))}%` : '—'],
      ['Buyurtma', formatOrder(a.order || a.extracted_order || a.extractedOrder)],
      ['Ustuvorlik', a.priority || a.urgency || (category === 'complaint' ? 'Yuqori' : 'Oddiy')]
    ];
    fields.forEach(([label, value]) => { const item = document.createElement('div'); item.className = 'detail-item'; const name = document.createElement('span'); name.textContent = label; const val = document.createElement('span'); val.textContent = value; item.append(name, val); details.append(item); });
    const complaint = category === 'complaint' || category === 'spam' || a.reply === null || a.escalate === true || a.requires_human === true;
    $('#reply-block').hidden = complaint;
    $('#manual-alert').hidden = !complaint;
    $('#reply-text').textContent = typeof a.reply === 'string' ? a.reply : '';
    $('#copy-button').textContent = 'Nusxalash';
  }
  function formatOrder(order) {
    if (!order || typeof order !== 'object') return 'Aniqlanmadi';
    return Object.entries(order).filter(([, value]) => value !== null && value !== '' && value !== undefined).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : value}`).join(' · ') || 'Aniqlanmadi';
  }
  input.addEventListener('input', () => { $('#char-count').textContent = `${input.value.length} / 4000`; });
  document.querySelectorAll('[data-sample]').forEach((button) => button.addEventListener('click', () => { input.value = samples[button.dataset.sample]; input.dispatchEvent(new Event('input')); input.focus(); }));
  $('#search-input').addEventListener('input', render); $('#filter-select').addEventListener('change', render);
  $('#clear-button').addEventListener('click', () => { rows = []; localStorage.removeItem(resultsKey); $('#result-card').hidden = true; render(); });
  $('#copy-button').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#reply-text').textContent); $('#copy-button').textContent = 'Nusxalandi'; } catch { $('#copy-button').textContent = 'Nusxalab bo‘lmadi'; } });
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); const message = input.value.trim(); if (!message) return;
    const button = $('#analyze-button'); const error = $('#error-card'); error.hidden = true; $('#result-card').hidden = true; button.disabled = true; button.textContent = 'Tahlil qilinmoqda…';
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || body.error || 'Xabarni tahlil qilib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.');
      const analysis = body.analysis || body.result || body;
      const row = { message, analysis, createdAt: new Date().toISOString() };
      rows.unshift(row); rows = rows.slice(0, 100);
      try { localStorage.setItem(resultsKey, JSON.stringify(rows)); } catch { /* Keep this session usable when storage is unavailable. */ }
      showResult(analysis); render();
    } catch (err) { error.textContent = err.message; error.hidden = false; }
    finally { button.disabled = false; button.innerHTML = '<span>✦</span> Xabarni tahlil qilish <span class="button-arrow">→</span>'; }
  });
  $('#today-label').textContent = new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium' }).format(new Date());
  render();
})();
