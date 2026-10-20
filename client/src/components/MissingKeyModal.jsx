import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Sparkles, Mail, Settings, X, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../api';

export default function MissingKeyModal({ isOpen, onClose, keyType = 'AI', title, message, onSaved }) {
  const navigate = useNavigate();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [provider, setProvider] = useState('groq');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const isAi = keyType === 'AI';
  const modalTitle = title || (isAi ? 'AI API Key Required' : 'Email Credentials Required');
  const modalMessage = message || (isAi 
    ? 'To extract details automatically from Gmail and job emails, please enter your LLM API Key (Groq, Gemini, OpenAI, etc.).'
    : 'To send test emails or automated deadline reminders, please configure your SMTP Email & App Password in Settings.'
  );

  const handleQuickSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      return toast.error('Please enter a valid API key');
    }
    setSaving(true);
    try {
      await settingsAPI.update({
        llmApiKey: apiKeyInput.trim(),
        llmProvider: provider,
      });
      toast.success('API Key saved successfully!');
      if (onSaved) onSaved(apiKeyInput.trim());
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleGoToSettings = () => {
    onClose();
    navigate('/settings');
  };

  return (
    <div
      className="modal-backdrop-motion"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(11, 17, 32, 0.6)',
        backdropFilter: 'blur(6px)',
        padding: 16,
      }}
    >
      <div
        className="modal-card-motion"
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderTop: '4px solid var(--primary-brand)',
          borderRadius: 14,
          padding: 26,
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div style={{
          width: 46,
          height: 46,
          borderRadius: 10,
          background: 'var(--brand-light)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          color: 'var(--primary-brand)',
        }}>
          {isAi ? <Sparkles size={24} /> : <Mail size={24} />}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          margin: '0 0 8px 0',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          {modalTitle}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: 13.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          margin: '0 0 16px 0',
        }}>
          {modalMessage}
        </p>

        {/* Direct API Key Entry Form for AI */}
        {isAi && (
          <form onSubmit={handleQuickSaveKey} style={{ marginBottom: 18, background: 'var(--card-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Select AI Provider
              </label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '7px 10px',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                <option value="groq" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Groq (Recommended — Ultra Fast & Free)</option>
                <option value="gemini" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Google Gemini</option>
                <option value="openai" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>OpenAI (ChatGPT)</option>
                <option value="deepseek" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>DeepSeek</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                Enter API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="gsk_... or AIzaSy... or sk-..."
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 36px 8px 10px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !apiKeyInput.trim()}
              style={{
                width: '100%',
                background: 'var(--primary-brand)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: 700,
                cursor: saving || !apiKeyInput.trim() ? 'not-allowed' : 'pointer',
                opacity: saving || !apiKeyInput.trim() ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: 'var(--shadow-plum)',
              }}
            >
              <Check size={16} /> {saving ? 'Saving Key…' : 'Save API Key & Continue'}
            </button>
          </form>
        )}

        {/* Key Info Banner */}
        <div style={{
          background: 'var(--card-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '9px 12px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 11.5,
          color: 'var(--text-secondary)',
        }}>
          <KeyRound size={15} color="var(--primary-brand)" style={{ flexShrink: 0 }} />
          <span>Your key is stored securely in your private account and used exclusively for your AI requests.</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleGoToSettings}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--primary-brand)',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: 'var(--shadow-plum)',
              transition: 'all 0.15s ease',
            }}
          >
            <Settings size={14} /> Full Settings Page
          </button>
        </div>
      </div>
    </div>
  );
}
