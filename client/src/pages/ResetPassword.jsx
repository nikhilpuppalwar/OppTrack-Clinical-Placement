import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';
import logoImg from '../assets/logo.png';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Shield, Loader2, KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const qEmail = searchParams.get('email');
    const qToken = searchParams.get('token');
    if (qEmail) setEmail(qEmail);
    if (qToken) setToken(qToken);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please provide your account email.');
      return;
    }
    if (!token.trim()) {
      toast.error('Reset token is missing or invalid.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword: password,
      });

      setSuccess(true);
      toast.success(res.data.message || 'Password reset successful!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed. The link may have expired.';
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

      {/* Header */}
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
              Reset Password
            </span>
          </div>
        </Link>

        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#3B5E97',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #E5EAF0',
            background: '#FFFFFF',
          }}
        >
          Sign In
        </Link>
      </header>

      {/* Main Container */}
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: '#E8F8F5', color: '#087F71', fontSize: 11.5, fontWeight: 700, marginBottom: 20 }}>
            <KeyRound size={13} />
            <span>SECURE CREDENTIAL RESET</span>
          </div>

          {!success ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.5px', margin: '0 0 10px' }}>
                Set a new password
              </h1>
              <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 26px' }}>
                Create a strong, unique password to protect your placement applications and personal profile vault.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Email (hidden or auto-filled) */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0B1F3A', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 14px',
                      background: '#F8FAFD',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      fontSize: 13.5,
                      color: '#0B1F3A',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Token (if not present in URL) */}
                {(!searchParams.get('token') || !token) && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0B1F3A', marginBottom: 6 }}>
                      Reset Security Token
                    </label>
                    <input
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your reset token from email"
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 14px',
                        background: '#F8FAFD',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        fontSize: 13,
                        color: '#0B1F3A',
                        outline: 'none',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0B1F3A', marginBottom: 6 }}>
                    New Password (min. 6 characters)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: '#94A3B8', pointerEvents: 'none', display: 'flex' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        height: 44,
                        paddingLeft: 38,
                        paddingRight: 40,
                        background: '#F8FAFD',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        fontSize: 13.5,
                        color: '#0B1F3A',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      style={{ position: 'absolute', right: 10, background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0B1F3A', marginBottom: 6 }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: '#94A3B8', pointerEvents: 'none', display: 'flex' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        height: 44,
                        paddingLeft: 38,
                        paddingRight: 40,
                        background: '#F8FAFD',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        fontSize: 13.5,
                        color: '#0B1F3A',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((s) => !s)}
                      style={{ position: 'absolute', right: 10, background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                    >
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: 44,
                    marginTop: 8,
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
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save New Password</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
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
                Password Updated!
              </h2>
              <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
                Your account password has been safely updated. You can now log into your OppTrack workspace.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  height: 44,
                  background: '#18B7A0',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(24, 183, 160, 0.35)',
                }}
              >
                <span>Sign In Now</span>
                <ArrowRight size={16} />
              </button>
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
            <span>256-bit encrypted credential management</span>
          </div>
        </div>
      </main>
    </div>
  );
}
