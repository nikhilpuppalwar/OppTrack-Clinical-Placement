import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CopyableField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    toast.success('Copied!', { duration: 1500 });
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="form-group">
      {label && <div className="form-label">{label}</div>}
      <div className="copyable-field">
        <span className="copyable-value">{value || <span style={{ color: 'var(--text3)' }}>—</span>}</span>
        <button className="copy-btn" onClick={handleCopy} title="Copy to clipboard">
          {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
