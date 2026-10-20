import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';
import logoImg from '../assets/logo.png';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirm: false, email: false, token: false });
  const [errors, setErrors] = useState({ password: '', confirm: '', form: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const qEmail = searchParams.get('email');
    const qToken = searchParams.get('token');
    if (qEmail) setEmail(qEmail);
    if (qToken) setToken(qToken);
  }, [searchParams]);

  // Password rules validation
  const passwordRules = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: SPECIAL_CHAR_REGEX.test(newPassword),
    };
  }, [newPassword]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const { minLength, hasUpper, hasLower, hasNumber, hasSpecial } = passwordRules;
    const score = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (newPassword.length === 0) return { label: 'Empty', level: 0, color: 'var(--border)' };
    if (score <= 2) return { label: 'Weak', level: 1, color: '#EF4444' };
    if (score === 3 || score === 4) return { label: 'Fair', level: 2, color: '#F59E0B' };
    if (score === 5 && newPassword.length < 12) return { label: 'Good', level: 3, color: '#10B981' };
    return { label: 'Strong', level: 4, color: '#059669' };
  }, [passwordRules, newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, form: 'Email address is required.' }));
      return;
    }
    if (!token.trim()) {
      setErrors((prev) => ({ ...prev, form: 'Security reset token is missing or invalid.' }));
      return;
    }

    const { minLength, hasUpper, hasLower, hasNumber, hasSpecial } = passwordRules;
    if (!minLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setTouched({ password: true, confirm: true, email: true, token: true });
      setErrors((prev) => ({ ...prev, password: 'Password does not meet all security requirements.' }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setTouched({ password: true, confirm: true, email: true, token: true });
      setErrors((prev) => ({ ...prev, confirm: 'Passwords do not match.' }));
      return;
    }

    setLoading(true);
    setErrors({ password: '', confirm: '', form: '' });

    try {
      await authAPI.resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword,
      });

      setSuccess(true);
      toast.success('Your password has been updated.');
    } catch (err) {
      let msg = "We couldn't reset your password right now. The link may have expired.";
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setErrors((prev) => ({ ...prev, form: msg }));
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
                Create New Password
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
              <span>Sign In</span>
            </Link>
          </div>
        </header>
      </div>

      {/* ── MAIN CONTAINER ── */}
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
            maxWidth: 460,
            background: 'var(--surface)',
            borderRadius: 14,
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            padding: '36px 32px',
          }}
        >
          {!success ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                  Create a new password
                </h1>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Choose a secure password for your OppTrack account.
                </p>
              </div>

              {/* Error Banner */}
              {errors.form && (
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
                  <span>{errors.form}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Email Address (Prefilled or editable) */}
                <div>
                  <label htmlFor="reset-email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Email address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 14px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Reset Token Input if not in URL */}
                {(!searchParams.get('token') || !token) && (
                  <div>
                    <label htmlFor="reset-token" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                      Reset Security Token
                    </label>
                    <input
                      id="reset-token"
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your reset token here"
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 14px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                )}

                {/* New Password Field */}
                <div>
                  <label htmlFor="new-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    New password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: touched.password && errors.password ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      id="new-password"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, password: '', form: '' }));
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                      style={{
                        width: '100%',
                        height: 42,
                        paddingLeft: 38,
                        paddingRight: 42,
                        background: 'var(--surface)',
                        border: `1px solid ${touched.password && errors.password ? 'var(--danger)' : 'var(--border)'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: 8,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Password strength:</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, height: 4 }}>
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            style={{
                              height: 4,
                              borderRadius: 2,
                              background: passwordStrength.level >= step ? passwordStrength.color : 'var(--border)',
                              transition: 'background-color 0.2s ease',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements Checklist */}
                  <div
                    style={{
                      background: 'var(--card-subtle)',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      padding: '10px 12px',
                      marginTop: 8,
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                      Password must contain:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: passwordRules.minLength ? '#10B981' : 'var(--text-muted)' }}>
                        {passwordRules.minLength ? <CheckCircle2 size={13} color="#10B981" /> : <span style={{ width: 13, textAlign: 'center', fontSize: 11 }}>•</span>}
                        <span>At least 8 characters</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: passwordRules.hasUpper ? '#10B981' : 'var(--text-muted)' }}>
                        {passwordRules.hasUpper ? <CheckCircle2 size={13} color="#10B981" /> : <span style={{ width: 13, textAlign: 'center', fontSize: 11 }}>•</span>}
                        <span>One uppercase letter</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: passwordRules.hasLower ? '#10B981' : 'var(--text-muted)' }}>
                        {passwordRules.hasLower ? <CheckCircle2 size={13} color="#10B981" /> : <span style={{ width: 13, textAlign: 'center', fontSize: 11 }}>•</span>}
                        <span>One lowercase letter</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: passwordRules.hasNumber ? '#10B981' : 'var(--text-muted)' }}>
                        {passwordRules.hasNumber ? <CheckCircle2 size={13} color="#10B981" /> : <span style={{ width: 13, textAlign: 'center', fontSize: 11 }}>•</span>}
                        <span>One number</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: passwordRules.hasSpecial ? '#10B981' : 'var(--text-muted)' }}>
                        {passwordRules.hasSpecial ? <CheckCircle2 size={13} color="#10B981" /> : <span style={{ width: 13, textAlign: 'center', fontSize: 11 }}>•</span>}
                        <span>One special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirm-new-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Confirm new password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: touched.confirm && errors.confirm ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      id="confirm-new-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfirmPassword(val);
                        if (val && val !== newPassword) {
                          setErrors((prev) => ({ ...prev, confirm: 'Passwords do not match.' }));
                        } else {
                          setErrors((prev) => ({ ...prev, confirm: '' }));
                        }
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
                      style={{
                        width: '100%',
                        height: 42,
                        paddingLeft: 38,
                        paddingRight: 42,
                        background: 'var(--surface)',
                        border: `1px solid ${touched.confirm && errors.confirm ? 'var(--danger)' : 'var(--border)'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      style={{
                        position: 'absolute',
                        right: 8,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {touched.confirm && errors.confirm && (
                    <p role="alert" style={{ fontSize: 12, color: 'var(--danger)', margin: '4px 0 0' }}>
                      {errors.confirm}
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
                    marginTop: 6,
                    opacity: loading ? 0.8 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{loading ? 'Updating password...' : 'Update Password'}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
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
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={28} />
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                Your password has been updated.
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
                You can now sign in to your OppTrack workspace using your new password.
              </p>

              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  height: 44,
                  background: 'var(--primary-brand)',
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
                  boxShadow: '0 2px 10px var(--primary-brand-glow)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Sign in</span>
                <ArrowRight size={16} />
              </button>
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
