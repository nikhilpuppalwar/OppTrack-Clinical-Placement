const STATUS_LABELS = {
  not_applied: 'Not Applied', applied: 'Applied', oa: 'OA / Test',
  interview: 'Interview', hr: 'HR Round', offer: 'Offer', rejected: 'Rejected',
};

export default function StatusPill({ status }) {
  return (
    <span className={`pill pill-${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
