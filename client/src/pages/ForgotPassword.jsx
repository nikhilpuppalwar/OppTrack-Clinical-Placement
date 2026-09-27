import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import logoImg from '../assets/logo.png';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [debugUrl, setDebugUrl] = useState('');

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
      // In accordance with account enumeration protection, show friendly generic or error
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
        background: '#F8FAFC',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          height: 60,
          borderBottom: '1px solid #E2E8F0',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
        }}
      >
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={logoImg} alt="OppTrack Logo" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>OppTrack</span>
            <span style={{ color: '#CBD5E1', fontSize: 13, userSelect: 'none' }}>|</span>
            <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>Reset Password</span>
          </Link>

          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: '#0F172A',
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              transition: 'background-color 0.15s ease',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
            padding: '36px 32px',
          }}
        >
          {!submitted ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                  Reset your password
                </h1>
                <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
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
                    background: '#FEF2F2',
                    border: '1px solid #FEE2E2',
                    color: '#B91C1C',
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
                    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}
                  >
                    Email address
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 12,
                        color: touched && error ? '#EF4444' : '#94A3B8',
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
                        background: '#FFFFFF',
                        border: `1px solid ${touched && error ? '#EF4444' : '#CBD5E1'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#0F172A',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {touched && error && (
                    <p role="alert" style={{ fontSize: 12, color: '#DC2626', margin: '4px 0 0' }}>
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
                    background: '#2563EB',
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
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    opacity: loading ? 0.8 : 1,
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
                  background: '#F0FDF4',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <CheckCircle2 size={28} />
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
                Check your email
              </h2>
              <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
                If an account exists for <strong>{email}</strong>, you'll receive password reset instructions shortly.
              </p>

              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  padding: '12px 14px',
                  fontSize: 12.5,
                  color: '#64748B',
                  lineHeight: 1.5,
                  marginBottom: 20,
                }}
              >
                Please check your inbox as well as your spam folder. The reset link is valid for 60 minutes.
              </div>

              {debugUrl && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0D9488', marginBottom: 4 }}>
                    Development Reset Link:
                  </div>
                  <a
                    href={debugUrl}
                    style={{
                      display: 'block',
                      background: '#F0FDFA',
                      color: '#0F766E',
                      border: '1px solid #CCFBF1',
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
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    height: 40,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
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
                    background: '#2563EB',
                    color: '#FFFFFF',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
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
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 11.5,
              color: '#64748B',
            }}
          >
            <ShieldCheck size={14} color="#0D9488" />
            <span>Secure authentication • Passwords hashed with bcrypt</span>
          </div>
        </div>
      </main>
    </div>
  );
}
