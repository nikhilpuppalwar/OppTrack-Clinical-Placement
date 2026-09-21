import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import logoImg from '../assets/logo.png';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, Shield, Loader2, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [debugUrl, setDebugUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    setDebugUrl('');
    try {
      const res = await authAPI.forgotPassword({ email: email.trim() });
      setSubmitted(true);
      toast.success(res.data.message || 'Reset link sent to your email!');
      if (res.data.debugResetUrl) {
        setDebugUrl(res.data.debugResetUrl);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset email. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F7F9FC',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        color: '#0B1F3A',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Ambient Top Glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1000px',
          height: '380px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(24, 183, 160, 0.12) 0%, rgba(11, 31, 58, 0.04) 50%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top Navigation */}
      <header
        style={{
          padding: '18px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
          borderBottom: '1px solid rgba(229, 234, 240, 0.6)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src={logoImg} alt="OppTrack Logo" style={{ height: 26, width: 'auto' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.3px' }}>
              OppTrack
            </span>
            <span style={{ height: 12, width: 1, background: '#CBD5E1' }} />
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              Password Recovery
            </span>
          </div>
        </Link>

        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: '#3B5E97',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #E5EAF0',
            background: '#FFFFFF',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Sign In</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 460,
            background: '#FFFFFF',
            borderRadius: 18,
            border: '1px solid #E5EAF0',
            boxShadow: '0 20px 45px -10px rgba(11, 31, 58, 0.08), 0 1px 3px rgba(0,0,0,0.02)',
            padding: '36px 32px',
          }}
        >
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: '#E8F8F5', color: '#087F71', fontSize: 11.5, fontWeight: 700, marginBottom: 20 }}>
            <KeyRound size={13} />
            <span>ACCOUNT SECURITY</span>
          </div>

          {!submitted ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.5px', margin: '0 0 10px' }}>
                Forgot your password?
              </h1>
              <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 28px' }}>
                Enter the email address registered with your OppTrack account. We'll send you an encrypted link to safely choose a new password.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0B1F3A', marginBottom: 8 }}>
                    College or Personal Email
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="student@college.edu or personal@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        height: 44,
                        paddingLeft: 38,
                        paddingRight: 14,
                        background: '#F8FAFD',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        fontSize: 13.5,
                        color: '#0B1F3A',
                        outline: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: 44,
                    background: '#0B1F3A',
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
                    boxShadow: '0 4px 14px rgba(11, 31, 58, 0.25)',
                    transition: 'all 0.15s ease',
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#E8F8F5',
                  color: '#18B7A0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0B1F3A', margin: '0 0 10px' }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
                We've dispatched password recovery instructions to:
                <br />
                <strong style={{ color: '#0B1F3A', wordBreak: 'break-all' }}>{email}</strong>
              </p>

              <div
                style={{
                  background: '#F8FAFD',
                  borderRadius: 10,
                  border: '1px solid #E5EAF0',
                  padding: '14px 16px',
                  fontSize: 12.5,
                  color: '#64748B',
                  textAlign: 'left',
                  lineHeight: 1.5,
                  marginBottom: 24,
                }}
              >
                <strong>💡 Didn't see the email?</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  <li>Check your spam or junk circular folder.</li>
                  <li>The reset link is active for <strong>60 minutes</strong>.</li>
                </ul>
              </div>

              {debugUrl && (
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#087F71', marginBottom: 6 }}>
                    DEVELOPMENT RESET LINK:
                  </div>
                  <a
                    href={debugUrl}
                    style={{
                      display: 'block',
                      background: '#E8F8F5',
                      color: '#087F71',
                      border: '1px solid #A3E5D9',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 11.5,
                      textDecoration: 'none',
                      wordBreak: 'break-all',
                    }}
                  >
                    Open Password Reset Link →
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    height: 40,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#3B5E97',
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
                    background: '#0B1F3A',
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

          {/* Security footnote */}
          <div
            style={{
              marginTop: 28,
              paddingTop: 18,
              borderTop: '1px solid #E5EAF0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 11.5,
              color: '#64748B',
            }}
          >
            <Shield size={14} color="#18B7A0" />
            <span>256-bit encrypted authentication</span>
          </div>
        </div>
      </main>
    </div>
  );
}
