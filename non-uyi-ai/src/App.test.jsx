import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { trainingMessages } from './data/trainingMessages.js';
import { categories } from './logic/messages.js';

async function submit(user, text) {
  await user.type(screen.getByLabelText('Mijoz xabari'), text);
  await user.click(screen.getByRole('button', { name: 'Xabarni tahlil qilish' }));
}

describe('20 ta o‘zbekcha, ruscha va aralash xabar — UI integratsiyasi', () => {
  it.each(trainingMessages)('$id. $text', async ({ text, result }) => {
    const user = userEvent.setup();
    const service = vi.fn().mockResolvedValue(result);
    render(<App analyzeMessage={service} initialDemoMode={false} />);
    await submit(user, text);
    const card = await screen.findByRole('article', { name: `${categories[result.category]} natijasi` });
    expect(within(card).getByText(text)).toBeInTheDocument();
    expect(service).toHaveBeenCalledWith(text, { signal: expect.any(AbortSignal) });
    expect(screen.getByTestId('stat-total')).toHaveTextContent('1');
    expect(screen.getByTestId(`stat-${result.category}`)).toHaveTextContent('1');
    expect(screen.getByLabelText('Mijoz xabari')).toHaveValue('');
    if (result.reply) expect(within(card).getByText(result.reply)).toBeInTheDocument();
    if (result.category === 'complaint') {
      expect(card).toHaveClass('complaint');
      expect(within(card).getByText(/Operator aralashuvi kerak/)).toBeInTheDocument();
      expect(within(card).queryByText('Tavsiya etilgan javob')).not.toBeInTheDocument();
    }
    if (result.category === 'order') {
      const table = screen.getByRole('table');
      expect(within(table).getByText(text)).toBeInTheDocument();
      if (result.address) expect(within(table).getByText(result.address)).toBeInTheDocument();
    } else expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

it('combines category, language and search filters without changing total statistics', async () => {
  const user = userEvent.setup();
  const samples = [trainingMessages[0], trainingMessages[1], trainingMessages[10]];
  const service = vi.fn(async (text) => samples.find((item) => item.text === text).result);
  render(<App analyzeMessage={service} initialDemoMode={false} />);
  for (const sample of samples) await submit(user, sample.text);
  expect(await screen.findAllByRole('article')).toHaveLength(3);
  await user.selectOptions(screen.getByLabelText('Kategoriya'), 'order');
  expect(screen.getAllByRole('article')).toHaveLength(2);
  await user.selectOptions(screen.getByLabelText('Til'), 'uz');
  await user.type(screen.getByRole('searchbox'), 'CHILONZOR');
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByRole('table')).toHaveTextContent('Chilonzor 12');
  expect(screen.getByTestId('stat-total')).toHaveTextContent('3');
  expect(screen.getByTestId('stat-order')).toHaveTextContent('2');
  await user.type(screen.getByRole('searchbox'), ' topilmaydi');
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Filtrlarni tozalash' }));
  expect(screen.getAllByRole('article')).toHaveLength(3);
});

it('blocks duplicate submissions while pending and preserves an existing result after an API failure', async () => {
  const user = userEvent.setup();
  let resolve;
  const service = vi.fn().mockImplementationOnce(() => new Promise((done) => { resolve = done; }))
    .mockRejectedValueOnce({ status: 429 }).mockResolvedValue(trainingMessages[1].result);
  render(<App analyzeMessage={service} initialDemoMode={false} />);
  await submit(user, trainingMessages[0].text);
  expect(screen.getByRole('button', { name: 'Tahlil qilinmoqda…' })).toBeDisabled();
  expect(screen.getByLabelText('Mijoz xabari')).toBeDisabled();
  fireEvent.submit(screen.getByLabelText('Mijoz xabari').closest('form'));
  expect(service).toHaveBeenCalledTimes(1);
  await act(async () => resolve(trainingMessages[0].result));
  await submit(user, trainingMessages[1].text);
  expect(await screen.findByRole('alert')).toHaveTextContent('limiti');
  expect(screen.getByLabelText('Mijoz xabari')).toHaveValue(trainingMessages[1].text);
  expect(screen.getByTestId('stat-total')).toHaveTextContent('1');
  await user.click(screen.getByRole('button', { name: 'Xabarni tahlil qilish' }));
  await waitFor(() => expect(screen.getByTestId('stat-total')).toHaveTextContent('2'));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it.each([
  [{ status: 401 }, 'API kaliti'],
  [{ status: 403 }, 'API kaliti'],
  [{ status: 429 }, 'limiti'],
  [{ status: 503 }, 'vaqtincha'],
  [new TypeError('Failed to fetch'), 'Internet'],
  [new SyntaxError('Bad JSON'), 'formatda emas'],
  [new Error('private API key must not be displayed'), 'xato yuz berdi'],
])('shows a useful error and retains input (%j)', async (error, expected) => {
  const user = userEvent.setup();
  render(<App analyzeMessage={vi.fn().mockRejectedValue(error)} initialDemoMode={false} />);
  await submit(user, 'Salom');
  expect(await screen.findByRole('alert')).toHaveTextContent(expected);
  expect(screen.getByLabelText('Mijoz xabari')).toHaveValue('Salom');
  expect(screen.getByTestId('stat-total')).toHaveTextContent('0');
  expect(screen.getByRole('button', { name: 'Xabarni tahlil qilish' })).toBeEnabled();
});

it('rejects malformed responses and never adds them to history', async () => {
  const user = userEvent.setup();
  render(<App analyzeMessage={vi.fn().mockResolvedValue({ category: 'other' })} initialDemoMode={false} />);
  await submit(user, 'Salom');
  expect(await screen.findByRole('alert')).toHaveTextContent('formatda emas');
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
});

it('suppresses a complaint reply even if the service returns it', async () => {
  const user = userEvent.setup();
  render(<App analyzeMessage={vi.fn().mockResolvedValue({ category: 'complaint', language: 'uz', reply: 'Yuborilmasin' })} initialDemoMode={false} />);
  await submit(user, 'Non kuygan');
  expect(await screen.findByRole('article')).toHaveTextContent('Avtomatik javob berilmaydi');
  expect(screen.queryByText('Yuborilmasin')).not.toBeInTheDocument();
});

it('does not send empty or whitespace-only messages', () => {
  const service = vi.fn();
  render(<App analyzeMessage={service} initialDemoMode={false} />);
  fireEvent.change(screen.getByLabelText('Mijoz xabari'), { target: { value: '   ' } });
  fireEvent.submit(screen.getByLabelText('Mijoz xabari').closest('form'));
  expect(service).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent('Xabar matnini kiriting');
});

it('uses a labelled demo fixture without calling the API', async () => {
  const user = userEvent.setup();
  const service = vi.fn();
  render(<App analyzeMessage={service} />);
  await user.selectOptions(screen.getByLabelText('Sinov xabari'), '1');
  await user.click(screen.getByRole('button', { name: 'Xabarni tahlil qilish' }));
  expect(await screen.findByRole('article')).toHaveTextContent('Demo');
  expect(service).not.toHaveBeenCalled();
});

it('reports a server error from the connected API adapter', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
  vi.stubGlobal('fetch', fetchMock);
  try {
    render(<App initialDemoMode={false} />);
    await submit(user, 'Salom');
    expect(await screen.findByRole('alert')).toHaveTextContent('vaqtincha');
    expect(fetchMock).toHaveBeenCalledWith('/api/analyze', expect.objectContaining({ method: 'POST', body: JSON.stringify({ message: 'Salom' }) }));
  } finally { vi.unstubAllGlobals(); }
});

it('times out, permits retry and ignores a late response from the old request', async () => {
  vi.useFakeTimers();
  try {
    let finishOldRequest;
    const service = vi.fn().mockImplementationOnce(() => new Promise((resolve) => { finishOldRequest = resolve; }))
      .mockResolvedValue(trainingMessages[0].result);
    render(<App analyzeMessage={service} initialDemoMode={false} timeoutMs={100} />);
    fireEvent.change(screen.getByLabelText('Mijoz xabari'), { target: { value: '2 ta non' } });
    fireEvent.submit(screen.getByLabelText('Mijoz xabari').closest('form'));
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(screen.getByRole('alert')).toHaveTextContent('vaqti tugadi');
    expect(service.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => { fireEvent.submit(screen.getByLabelText('Mijoz xabari').closest('form')); });
    await act(async () => { finishOldRequest(trainingMessages[1].result); });
    expect(screen.getByTestId('stat-total')).toHaveTextContent('1');
    expect(screen.getAllByRole('article')).toHaveLength(1);
  } finally { vi.useRealTimers(); }
});

it('aborts a pending API request when the component unmounts', async () => {
  const service = vi.fn(() => new Promise(() => {}));
  const { unmount } = render(<App analyzeMessage={service} initialDemoMode={false} />);
  fireEvent.change(screen.getByLabelText('Mijoz xabari'), { target: { value: 'Salom' } });
  await act(async () => { fireEvent.submit(screen.getByLabelText('Mijoz xabari').closest('form')); });
  const signal = service.mock.calls[0][1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => {});
});
