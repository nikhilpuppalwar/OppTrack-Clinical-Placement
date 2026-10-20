import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import logoImg from '../assets/logo.png';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [debugUrl, setDebugUrl] = useState('');

  const { toggleTheme, isDark } = useTheme();

  const validateEmail = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Email address is required.';
    if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address.';
    return '';
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const emailErr = validateEmail(email);
    if (emailErr) {
      setTouched(true);
      setError(emailErr);
      return;
    }

    setLoading(true);
    setError('');
    setDebugUrl('');

    try {
      const clientUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const res = await authAPI.forgotPassword({ email: email.trim(), clientUrl });
      setSubmitted(true);
      if (res.data?.debugResetUrl) {
        setDebugUrl(res.data.debugResetUrl);
      }
    } catch (err) {
      let msg = "We couldn't connect to the server. Check your connection and try again.";
      if (err.response?.status === 429) {
        msg = 'Too many attempts. Please wait a few minutes before trying again.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── TOP FLOATING NAVIGATION BAR (VESSA DOCK) ── */}
      <div style={{ position: 'sticky', top: 14, zIndex: 100, padding: '0 20px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <header className="vessa-topbar">
          <Link to="/" className="vessa-brand">
            <div className="vessa-brand-logo" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 3 }}>
              <img src={logoImg} alt="OppTrack Logo" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 8 }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                OppTrack
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                Account Recovery
              </div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--card-subtle)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <Link
              to="/login"
              className="vessa-pill-tab"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </header>
      </div>

      {/* ── MAIN BODY ── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px 60px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: 'var(--surface)',
            borderRadius: 14,
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            padding: '36px 32px',
          }}
        >
          {!submitted ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                  Reset your password
                </h1>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Enter your email address and we'll send reset instructions if an account exists.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div
                  role="alert"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--danger)',
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label
                    htmlFor="forgot-email"
                    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
                  >
                    Email address
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 12,
                        color: touched && error ? 'var(--danger)' : 'var(--text-muted)',
                        display: 'flex',
                        pointerEvents: 'none',
                      }}
                    >
                      <Mail size={16} />
                    </span>
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      onBlur={handleBlur}
                      aria-invalid={touched && !!error}
                      style={{
                        width: '100%',
                        height: 44,
                        paddingLeft: 38,
                        paddingRight: 12,
                        background: 'var(--surface)',
                        border: `1px solid ${touched && error ? 'var(--danger)' : 'var(--border)'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      }}
                    />
                  </div>
                  {touched && error && (
                    <p role="alert" style={{ fontSize: 12, color: 'var(--danger)', margin: '4px 0 0' }}>
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: 44,
                    background: 'var(--primary-brand)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 2px 10px var(--primary-brand-glow)',
                    opacity: loading ? 0.8 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{loading ? 'Sending reset link...' : 'Send Reset Link'}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            </>
          ) : (
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <CheckCircle2 size={28} />
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                Check your email
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
                If an account exists for <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>, you'll receive password reset instructions shortly.
              </p>

              <div
                style={{
                  background: 'var(--card-subtle)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  padding: '12px 14px',
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 20,
                }}
              >
                Please check your inbox as well as your spam folder. The reset link is valid for 60 minutes.
              </div>

              {debugUrl && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--teal-text)', marginBottom: 4 }}>
                    Development Reset Link:
                  </div>
                  <a
                    href={debugUrl}
                    style={{
                      display: 'block',
                      background: 'var(--teal-light)',
                      color: 'var(--teal-text)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      fontSize: 12,
                      textDecoration: 'none',
                      wordBreak: 'break-all',
                    }}
                  >
                    Open Password Reset URL →
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    height: 40,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  Send to a different email
                </button>

                <Link
                  to="/login"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    height: 40,
                    background: 'var(--primary-brand)',
                    color: '#FFFFFF',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 2px 10px var(--primary-brand-glow)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          )}

          {/* Security Footnote */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 11.5,
              color: 'var(--text-secondary)',
            }}
          >
            <ShieldCheck size={14} color="var(--primary-brand)" />
            <span>Secure authentication • Passwords hashed with bcrypt</span>
          </div>
        </div>
      </main>
    </div>
  );
}
