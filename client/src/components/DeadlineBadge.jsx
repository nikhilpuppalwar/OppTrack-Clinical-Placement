import { Clock } from 'lucide-react';

export default function DeadlineBadge({ deadline }) {
  if (!deadline) return <span style={{ color: 'var(--text3)', fontSize: 13 }}>No deadline</span>;
  const diff = new Date(deadline) - new Date();
  const hours = diff / (1000 * 60 * 60);
  const days = hours / 24;

  let cls = 'deadline-normal', label = '';
  if (diff < 0) { cls = 'deadline-past'; label = 'Passed'; }
  else if (hours < 24) { cls = 'deadline-urgent'; label = `${Math.ceil(hours)}h left`; }
  else if (days < 3) { cls = 'deadline-soon'; label = `${Math.ceil(days)}d left`; }
  else { label = `${Math.ceil(days)}d left`; }

  const formatted = new Date(deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <span className={`deadline-badge ${cls}`}>
      <Clock size={11} />
      {formatted} · {label}
    </span>
  );
}
