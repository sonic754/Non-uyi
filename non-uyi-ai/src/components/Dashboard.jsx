import { categories } from '../logic/messages.js';

export default function Dashboard({ stats }) {
  return <section className="stats" aria-label="Statistika">
    {Object.entries({ total: 'Jami xabarlar', ...categories }).map(([key, label]) =>
      <div key={key} className={`stat ${key}`}><span>{label}</span><strong data-testid={`stat-${key}`}>{stats[key]}</strong></div>,
    )}
  </section>;
}
