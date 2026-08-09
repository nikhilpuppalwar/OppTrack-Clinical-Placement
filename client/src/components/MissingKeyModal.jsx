import { useNavigate } from 'react-router-dom';
import { KeyRound, Sparkles, Mail, Settings, X } from 'lucide-react';

export default function MissingKeyModal({ isOpen, onClose, keyType = 'AI', title, message }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isAi = keyType === 'AI';
  const accentColor = isAi ? '#9A8CFF' : '#B7E34A';
  const modalTitle = title || (isAi ? 'AI API Key Required' : 'Email Credentials Required');
  const modalMessage = message || (isAi 
    ? 'To use AI Smart Paste and automatic email parsing, you need to add your LLM API Key (Groq, OpenAI, Anthropic, etc.) in Settings.'
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
      background: 'rgba(10, 12, 11, 0.82)',
      backdropFilter: 'blur(8px)',
      padding: 16,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: '#171B18',
        border: `1px solid ${accentColor}50`,
        borderTop: `4px solid ${accentColor}`,
        borderRadius: 16,
        padding: 28,
        boxShadow: `0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px ${accentColor}15`,
        position: 'relative',
        color: '#F2F3ED',
        fontFamily: 'Manrope, sans-serif',
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
            color: 'rgba(242, 243, 237, 0.4)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#F2F3ED'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(242, 243, 237, 0.4)'}
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          color: accentColor,
        }}>
          {isAi ? <Sparkles size={26} /> : <Mail size={26} />}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 20,
          fontWeight: 700,
          margin: '0 0 10px 0',
          color: '#F2F3ED',
          letterSpacing: '-0.01em',
        }}>
          {modalTitle}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: 14,
          color: 'rgba(242, 243, 237, 0.65)',
          lineHeight: 1.6,
          margin: '0 0 24px 0',
        }}>
          {modalMessage}
        </p>

        {/* Key Info Banner */}
        <div style={{
          background: '#121413',
          border: '1px solid #2A302B',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: 'rgba(242, 243, 237, 0.5)',
        }}>
          <KeyRound size={16} color={accentColor} style={{ flexShrink: 0 }} />
          <span>Your keys are stored securely per account and used exclusively for your requests.</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              background: 'transparent',
              border: '1px solid #2A302B',
              color: 'rgba(242, 243, 237, 0.7)',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGoToSettings}
            style={{
              padding: '10px 22px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              background: accentColor,
              border: 'none',
              color: '#101311',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: `0 4px 12px ${accentColor}30`,
              transition: 'transform 0.15s ease, opacity 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Settings size={15} /> Configure in Settings
          </button>
        </div>
      </div>
    </div>
  );
}
