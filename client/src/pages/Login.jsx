import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '', form: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const validateEmail = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Email address is required.';
    if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address.';
    return '';
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') {
      const err = validateEmail(form.email);
      setErrors((prev) => ({ ...prev, email: err }));
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', form: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const emailErr = validateEmail(form.email);
    const pwErr = !form.password ? 'Password is required.' : '';

    if (emailErr || pwErr) {
      setTouched({ email: true, password: true });
      setErrors({ email: emailErr, password: pwErr, form: '' });
      return;
    }

    setLoading(true);
    setErrors({ email: '', password: '', form: '' });

    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back to OppTrack!');
      navigate('/');
    } catch (err) {
      let message = 'Email or password is incorrect.';
      if (!err.response) {
        message = "We couldn't connect to the server. Check your connection and try again.";
      } else if (err.response.status === 429) {
        message = 'Too many attempts. Please wait a few minutes before trying again.';
      } else if (err.response.status >= 500) {
        message = "We couldn't sign you in right now. Please try again shortly.";
      } else if (err.response.data?.message) {
        message = err.response.data.message;
      }
      setErrors((prev) => ({ ...prev, form: message }));
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      
      {/* ── TOP NAVIGATION ── */}
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
            <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>Placement Tracking Console</span>
          </Link>

          <Link
            to="/register"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#2563EB',
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: 6,
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              transition: 'background-color 0.15s ease',
            }}
          >
            Create an account →
          </Link>
        </div>
      </header>

      {/* ── MAIN 2-COLUMN AUTH LAYOUT ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px 60px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 36,
            alignItems: 'center',
          }}
        >
          {/* LEFT: AUTHENTICATION FORM */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 460,
                margin: '0 auto',
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                padding: '36px 32px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Session Expired Notice */}
              {sessionExpired && (
                <div
                  role="alert"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    color: '#92400E',
                    fontSize: 13,
                    marginBottom: 20,
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Session expired.</strong>
                    <div style={{ fontSize: 12.5, marginTop: 2 }}>Your session has expired. Please sign in again.</div>
                  </div>
                </div>
              )}

              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                  Welcome back
                </h1>
                <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  Sign in to manage your placement applications, deadlines, and Profile Vault.
                </p>
              </div>

              {/* Form Global Error Banner */}
              {errors.form && (
                <div
                  role="alert"
                  aria-live="polite"
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
                    marginBottom: 18,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}
                  >
                    Email address
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 12,
                        color: errors.email && touched.email ? '#EF4444' : '#94A3B8',
                        display: 'flex',
                        pointerEvents: 'none',
                      }}
                    >
                      <Mail size={16} />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="student@example.com"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      aria-invalid={touched.email && !!errors.email}
                      aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                      style={{
                        width: '100%',
                        height: 44,
                        paddingLeft: 38,
                        paddingRight: 12,
                        background: '#FFFFFF',
                        border: `1px solid ${touched.email && errors.email ? '#EF4444' : '#CBD5E1'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#0F172A',
                        outline: 'none',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      }}
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p id="email-error" role="alert" style={{ fontSize: 12, color: '#DC2626', margin: '5px 0 0' }}>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label
                      htmlFor="password"
                      style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      style={{ fontSize: 12, color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 12,
                        color: errors.password && touched.password ? '#EF4444' : '#94A3B8',
                        display: 'flex',
                        pointerEvents: 'none',
                      }}
                    >
                      <Lock size={16} />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••••••"
                      value={form.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      aria-invalid={touched.password && !!errors.password}
                      aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
                      style={{
                        width: '100%',
                        height: 44,
                        paddingLeft: 38,
                        paddingRight: 42,
                        background: '#FFFFFF',
                        border: `1px solid ${touched.password && errors.password ? '#EF4444' : '#CBD5E1'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#0F172A',
                        outline: 'none',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: 8,
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p id="password-error" role="alert" style={{ fontSize: 12, color: '#DC2626', margin: '5px 0 0' }}>
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Submit Action */}
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
                    transition: 'background-color 0.15s ease',
                    marginTop: 4,
                    opacity: loading ? 0.8 : 1,
                  }}
                >
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              {/* Factual Security Footnote */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: 11.5,
                    color: '#64748B',
                    fontWeight: 500,
                  }}
                >
                  <ShieldCheck size={14} color="#0D9488" />
                  <span>Secure authentication • Passwords hashed with bcrypt</span>
                </div>
              </div>

              {/* Footer Switch to Register */}
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #F1F5F9', textAlign: 'center', fontSize: 13, color: '#64748B' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
                  Create an account
                </Link>
              </div>

            </div>
          </div>

          {/* RIGHT: REFINED PRODUCT CONTEXT / WORKSPACE PREVIEW */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                background: '#0F172A',
                borderRadius: 14,
                padding: '36px 32px',
                color: '#FFFFFF',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 480,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 10px',
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.1)',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: '#93C5FD',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8' }} />
                    Workspace Preview
                  </div>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>Student Portal</span>
                </div>

                <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                  Placement Opportunity Tracker
                </h2>
                <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Organize drives, maintain verified academics in your Profile Vault, and auto-complete company forms via the Chrome extension.
                </p>

                {/* Real UI Telemetry Preview */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 8,
                    padding: 16,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} color="#60A5FA" /> Active Deadlines
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#1E293B', color: '#93C5FD' }}>
                      2 upcoming
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 6,
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#F8FAFC' }}>Software Engineer Assessment</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>Google Forms Application</div>
                      </div>
                      <span style={{ fontSize: 11, color: '#FCD34D', fontWeight: 600 }}>Next 48 hrs</span>
                    </div>

                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 6,
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#F8FAFC' }}>Technical Interview Round</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>Calendar Synced</div>
                      </div>
                      <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 600 }}>Scheduled</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Info */}
              <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
                Need access or technical assistance? Contact your campus placement coordinator.
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
