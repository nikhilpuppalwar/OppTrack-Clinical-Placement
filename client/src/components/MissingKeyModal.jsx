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
        maxWidth: 480,
        background: '#FFFFFF',
        border: '1px solid #E5EAF0',
        borderTop: '4px solid #18B7A0',
        borderRadius: 14,
        padding: 26,
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
          width: 46,
          height: 46,
          borderRadius: 10,
          background: '#E8F8F5',
          border: '1px solid #A3E5D9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
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
          fontSize: 13.5,
          color: '#667085',
          lineHeight: 1.5,
          margin: '0 0 16px 0',
        }}>
          {modalMessage}
        </p>

        {/* Direct API Key Entry Form for AI */}
        {isAi && (
          <form onSubmit={handleQuickSaveKey} style={{ marginBottom: 18, background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 10, padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0B1F3A', marginBottom: 6 }}>
                Select AI Provider
              </label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value)}
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: 6,
                  padding: '7px 10px',
                  fontSize: 13,
                  color: '#1F2937',
                  outline: 'none',
                }}
              >
                <option value="groq">Groq (Recommended — Ultra Fast & Free)</option>
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="deepseek">DeepSeek</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0B1F3A', marginBottom: 6 }}>
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
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    padding: '8px 36px 8px 10px',
                    fontSize: 13,
                    color: '#1F2937',
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
                    color: '#9CA3AF',
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
                background: '#10B981',
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
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
              }}
            >
              <Check size={16} /> {saving ? 'Saving Key…' : 'Save API Key & Continue'}
            </button>
          </form>
        )}

        {/* Key Info Banner */}
        <div style={{
          background: '#F8FAFD',
          border: '1px solid #E5EAF0',
          borderRadius: 8,
          padding: '9px 12px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 11.5,
          color: '#667085',
        }}>
          <KeyRound size={15} color="#18B7A0" style={{ flexShrink: 0 }} />
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
              background: '#FFFFFF',
              border: '1px solid #E5EAF0',
              color: '#667085',
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
              background: '#0B1F3A',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: '0 2px 4px rgba(11, 31, 58, 0.1)',
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
