import { useNavigate } from 'react-router-dom';
import { KeyRound, Sparkles, Mail, Settings, X } from 'lucide-react';

export default function MissingKeyModal({ isOpen, onClose, keyType = 'AI', title, message }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isAi = keyType === 'AI';
  const modalTitle = title || (isAi ? 'AI API Key Required' : 'Email Credentials Required');
  const modalMessage = message || (isAi 
    ? 'To use AI Smart Paste and automatic email parsing, you need to add your LLM API Key (Groq, OpenAI, Gemini, etc.) in Settings.'
    : 'To send test emails or automated deadline reminders, please configure your SMTP Email & App Password in Settings.'
  );

  const handleGoToSettings = () => {
    onClose();
    navigate('/settings');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(11, 31, 58, 0.45)',
      backdropFilter: 'blur(4px)',
      padding: 16,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: '#FFFFFF',
        border: '1px solid #E5EAF0',
        borderTop: '4px solid #18B7A0',
        borderRadius: 14,
        padding: 28,
        boxShadow: '0 20px 40px rgba(11, 31, 58, 0.15)',
        position: 'relative',
        color: '#172033',
        fontFamily: 'inherit',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'transparent',
            border: 'none',
            color: '#667085',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#172033'}
          onMouseLeave={e => e.currentTarget.style.color = '#667085'}
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: '#E8F8F5',
          border: '1px solid #A3E5D9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
          color: '#087F71',
        }}>
          {isAi ? <Sparkles size={24} /> : <Mail size={24} />}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          margin: '0 0 8px 0',
          color: '#0B1F3A',
          letterSpacing: '-0.01em',
        }}>
          {modalTitle}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: 14,
          color: '#667085',
          lineHeight: 1.5,
          margin: '0 0 20px 0',
        }}>
          {modalMessage}
        </p>

        {/* Key Info Banner */}
        <div style={{
          background: '#F8FAFD',
          border: '1px solid #E5EAF0',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: '#667085',
        }}>
          <KeyRound size={16} color="#18B7A0" style={{ flexShrink: 0 }} />
          <span>Your keys are stored securely per account and used exclusively for your requests.</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              background: '#FFFFFF',
              border: '1px solid #E5EAF0',
              color: '#667085',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGoToSettings}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              background: '#0B1F3A',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(11, 31, 58, 0.1)',
              transition: 'all 0.15s ease',
            }}
          >
            <Settings size={14} /> Configure in Settings
          </button>
        </div>
      </div>
    </div>
  );
}
