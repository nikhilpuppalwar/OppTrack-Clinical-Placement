import { Clock } from 'lucide-react';

export default function DeadlineBadge({ deadline }) {
  if (!deadline) return <span style={{ color: 'var(--text3)', fontSize: 13 }}>No deadline</span>;
  const diff = new Date(deadline) - new Date();
  const hours = diff / (1000 * 60 * 60);
  const days = hours / 24;

  let badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };

  let label = '';

  if (diff < 0) {
    badgeStyle = {
      ...badgeStyle,
      background: '#F1F5F9',
      color: '#64748B',
      border: '1px solid #CBD5E1',
    };
    label = 'Passed';
  } else if (hours < 24) {
    badgeStyle = {
      ...badgeStyle,
      background: '#FEF2F2',
      color: '#B91C1C',
      border: '1px solid rgba(239, 68, 68, 0.35)',
    };
    label = `${Math.ceil(hours)}h left`;
  } else if (days < 3) {
    badgeStyle = {
      ...badgeStyle,
      background: '#FFFBEB',
      color: '#B45309',
      border: '1px solid rgba(245, 158, 11, 0.35)',
    };
    label = `${Math.ceil(days)}d left`;
  } else {
    badgeStyle = {
      ...badgeStyle,
      background: '#EFF6FF',
      color: '#1D4ED8',
      border: '1px solid rgba(59, 130, 246, 0.3)',
    };
    label = `${Math.ceil(days)}d left`;
  }

  const formatted = new Date(deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <span style={badgeStyle}>
      <Clock size={12} />
      {formatted} · {label}
    </span>
  );
}
