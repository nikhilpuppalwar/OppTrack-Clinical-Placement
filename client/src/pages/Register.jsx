import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, XCircle, Building2, GraduationCap, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

const BRANCH_OPTIONS = [
  'CS', 'IT', 'CS AI-ML', 'CS AI-DS', 'ENTC', 'Mechanical', 'Civil', 'Other'
];

const BATCH_OPTIONS = ['2026', '2027', '2025', '2028', '2029'];

const COLLEGE_OPTIONS = [
  'PCCOE, Pune',
  'PCCOE&R, Pune',
  'COEP Tech, Pune',
  'PICT, Pune',
  'VIT, Pune',
  'VIIT, Pune',
  'NMIET, Pune',
  'NCER, Pune',
  'PCU, Pune',
  'Other'
];

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    collegeName: 'PCCOE, Pune',
    branch: 'CS',
    batch: '2026',
    agreeTerms: false,
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: '',
    form: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password rules validation
  const passwordRules = useMemo(() => {
    const pw = form.password;
    return {
      minLength: pw.length >= 8,
      hasUpper: /[A-Z]/.test(pw),
      hasLower: /[a-z]/.test(pw),
      hasNumber: /[0-9]/.test(pw),
      hasSpecial: SPECIAL_CHAR_REGEX.test(pw),
    };
  }, [form.password]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const { minLength, hasUpper, hasLower, hasNumber, hasSpecial } = passwordRules;
    const score = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (form.password.length === 0) return { label: 'Empty', level: 0, color: '#CBD5E1' };
    if (score <= 2) return { label: 'Weak', level: 1, color: '#EF4444' };
    if (score === 3 || score === 4) return { label: 'Fair', level: 2, color: '#F59E0B' };
    if (score === 5 && form.password.length < 12) return { label: 'Good', level: 3, color: '#10B981' };
    return { label: 'Strong', level: 4, color: '#059669' };
  }, [passwordRules, form.password]);

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required.';
        return '';
      case 'email':
        if (!value.trim()) return 'Email address is required.';
        if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address.';
        return '';
      case 'password': {
        const { minLength, hasUpper, hasLower, hasNumber, hasSpecial } = passwordRules;
        if (!minLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
          return 'Password does not meet all requirements.';
        }
        return '';
      }
      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (value !== form.password) return 'Passwords do not match.';
        return '';
      case 'agreeTerms':
        if (!value) return 'You must agree to the Terms & Conditions and Privacy Policy.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', form: '' }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validate all fields
    const newErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
      confirmPassword: validateField('confirmPassword', form.confirmPassword),
      agreeTerms: validateField('agreeTerms', form.agreeTerms),
      form: '',
    };

    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({ name: '', email: '', password: '', confirmPassword: '', agreeTerms: '', form: '' });

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        collegeName: form.collegeName,
        branch: form.branch,
        batch: form.batch,
      });

      toast.success('OppTrack account created successfully!');
      navigate('/');
    } catch (err) {
      let message = 'An account may already exist with this email. Try signing in or resetting your password.';
      if (!err.response) {
        message = "We couldn't connect to the server. Check your connection and try again.";
      } else if (err.response.status === 429) {
        message = 'Too many attempts. Please wait a few minutes before trying again.';
      } else if (err.response.status >= 500) {
        message = "We couldn't create your account right now. Please try again shortly.";
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
      
      {/* ── TOP BAR ── */}
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
            to="/login"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#0F172A',
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: 6,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
            }}
          >
            Already registered? Sign In
          </Link>
        </div>
      </header>

      {/* ── MAIN 2-COLUMN SIGNUP LAYOUT ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 20px 60px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 36,
            alignItems: 'start',
          }}
        >
          {/* LEFT: REGISTRATION FORM */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 480,
                margin: '0 auto',
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                padding: '36px 32px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                  Create your OppTrack account
                </h1>
                <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  Set up your account and start organizing your placement journey.
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

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Full Name */}
                <div>
                  <label htmlFor="reg-name" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                    Full name
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: touched.name && errors.name ? '#EF4444' : '#94A3B8', display: 'flex', pointerEvents: 'none' }}>
                      <User size={16} />
                    </span>
                    <input
                      id="reg-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="Rahul Sharma"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      aria-invalid={touched.name && !!errors.name}
                      aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
                      style={{
                        width: '100%',
                        height: 42,
                        paddingLeft: 38,
                        paddingRight: 12,
                        background: '#FFFFFF',
                        border: `1px solid ${touched.name && errors.name ? '#EF4444' : '#CBD5E1'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#0F172A',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {touched.name && errors.name && (
                    <p id="name-error" role="alert" style={{ fontSize: 12, color: '#DC2626', margin: '4px 0 0' }}>
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="reg-email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                    Email address
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: touched.email && errors.email ? '#EF4444' : '#94A3B8', display: 'flex', pointerEvents: 'none' }}>
                      <Mail size={16} />
                    </span>
                    <input
                      id="reg-email"
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
                        height: 42,
                        paddingLeft: 38,
                        paddingRight: 12,
                        background: '#FFFFFF',
                        border: `1px solid ${touched.email && errors.email ? '#EF4444' : '#CBD5E1'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#0F172A',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p id="email-error" role="alert" style={{ fontSize: 12, color: '#DC2626', margin: '4px 0 0' }}>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="reg-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: touched.password && errors.password ? '#EF4444' : '#94A3B8', display: 'flex', pointerEvents: 'none' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Create a strong password"
                      value={form.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      aria-invalid={touched.password && !!errors.password}
                      style={{
                        width: '100%',
                        height: 42,
                        paddingLeft: 38,
                        paddingRight: 42,
                        background: '#FFFFFF',
                        border: `1px solid ${touched.password && errors.password ? '#EF4444' : '#CBD5E1'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#0F172A',
                        outline: 'none',
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
                        color: '#64748B',
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

                  {/* Password Strength Indicator */}
                  {form.password.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#64748B' }}>Password strength:</span>
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
                              background: passwordStrength.level >= step ? passwordStrength.color : '#E2E8F0',
                              transition: 'background-color 0.2s ease',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Password Requirements Checklist */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      borderRadius: 6,
                      border: '1px solid #E2E8F0',
                      padding: '10px 12px',
                      marginTop: 8,
                      fontSize: 12,
                      color: '#475569',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                      Password must contain:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: passwordRules.minLength ? '#16A34A' : '#64748B' }}>
                        {passwordRules.minLength ? <CheckCircle2 size={13} color="#16A34A" /> : <span style={{ width: 13, textAlign: 'center', fontSize: 11 }}>•</span>}
                        <span>At least 8 characters</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: passwordRules.hasUpper ? '#16A34A' : '#64748B' }}>
                        {passwordRules.hasUpper ? <CheckCircle2 size={13} color="#16A34A" /> : <span style={{ width: 13, textAlign: 'center', fontSize: 11 }}>•</span>}
                        <span>One uppercase letter</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: passwordRules.hasLower ? '#16A34A' : '#64748B' }}>
                        {passwordRules.hasLower ? <CheckCircle2 size={13} color="#16A34A" /> : <span style={{ width: 13, textAlign: 'center', fontSize: 11 }}>•</span>}
                        <span>One lowercase letter</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: passwordRules.hasNumber ? '#16A34A' : '#64748B' }}>
                        {passwordRules.hasNumber ? <CheckCircle2 size={13} color="#16A34A" /> : <span style={{ width: 13, textAlign: 'center', fontSize: 11 }}>•</span>}
                        <span>One number</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: passwordRules.hasSpecial ? '#16A34A' : '#64748B' }}>
                        {passwordRules.hasSpecial ? <CheckCircle2 size={13} color="#16A34A" /> : <span style={{ width: 13, textAlign: 'center', fontSize: 11 }}>•</span>}
                        <span>One special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="reg-confirm-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                    Confirm password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: touched.confirmPassword && errors.confirmPassword ? '#EF4444' : '#94A3B8', display: 'flex', pointerEvents: 'none' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      id="reg-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Re-enter your password"
                      value={form.confirmPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => ({ ...prev, confirmPassword: val }));
                        if (val && val !== form.password) {
                          setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
                        } else {
                          setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                        }
                      }}
                      onBlur={() => handleBlur('confirmPassword')}
                      aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
                      style={{
                        width: '100%',
                        height: 42,
                        paddingLeft: 38,
                        paddingRight: 42,
                        background: '#FFFFFF',
                        border: `1px solid ${touched.confirmPassword && errors.confirmPassword ? '#EF4444' : '#CBD5E1'}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#0F172A',
                        outline: 'none',
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
                        color: '#64748B',
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
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p role="alert" style={{ fontSize: 12, color: '#DC2626', margin: '4px 0 0' }}>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* College / Institute Selection */}
                <div>
                  <label htmlFor="reg-college" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                    College / Institute
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: '#94A3B8', display: 'flex', pointerEvents: 'none' }}>
                      <Building2 size={16} />
                    </span>
                    <select
                      id="reg-college"
                      value={form.collegeName}
                      onChange={(e) => handleChange('collegeName', e.target.value)}
                      style={{
                        width: '100%',
                        height: 42,
                        paddingLeft: 38,
                        paddingRight: 12,
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        fontSize: 13.5,
                        color: '#0F172A',
                        outline: 'none',
                      }}
                    >
                      {COLLEGE_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Branch & Batch */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label htmlFor="reg-branch" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0F172A', marginBottom: 5 }}>
                      Branch / Dept
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: 10, color: '#94A3B8', display: 'flex', pointerEvents: 'none' }}>
                        <GraduationCap size={15} />
                      </span>
                      <select
                        id="reg-branch"
                        value={form.branch}
                        onChange={(e) => handleChange('branch', e.target.value)}
                        style={{
                          width: '100%',
                          height: 40,
                          paddingLeft: 34,
                          paddingRight: 10,
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: 8,
                          fontSize: 13,
                          color: '#0F172A',
                          outline: 'none',
                        }}
                      >
                        {BRANCH_OPTIONS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-batch" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0F172A', marginBottom: 5 }}>
                      Graduation Year
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: 10, color: '#94A3B8', display: 'flex', pointerEvents: 'none' }}>
                        <Calendar size={15} />
                      </span>
                      <select
                        id="reg-batch"
                        value={form.batch}
                        onChange={(e) => handleChange('batch', e.target.value)}
                        style={{
                          width: '100%',
                          height: 40,
                          paddingLeft: 34,
                          paddingRight: 10,
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: 8,
                          fontSize: 13,
                          color: '#0F172A',
                          outline: 'none',
                        }}
                      >
                        {BATCH_OPTIONS.map((yr) => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Explicit Terms & Conditions Consent (Unchecked by default) */}
                <div style={{ paddingTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      name="agreeTerms"
                      checked={form.agreeTerms}
                      onChange={(e) => handleChange('agreeTerms', e.target.checked)}
                      onBlur={() => handleBlur('agreeTerms')}
                      style={{
                        width: 16,
                        height: 16,
                        marginTop: 2,
                        accentColor: '#2563EB',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                    <label htmlFor="agreeTerms" style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, cursor: 'pointer' }}>
                      I agree to the{' '}
                      <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>
                        Terms & Conditions
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>
                  {touched.agreeTerms && errors.agreeTerms && (
                    <p role="alert" style={{ fontSize: 12, color: '#DC2626', margin: '4px 0 0 26px' }}>
                      {errors.agreeTerms}
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
                    marginTop: 6,
                    opacity: loading ? 0.8 : 1,
                  }}
                >
                  <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              {/* Factual Security Footnote */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
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
                  <span>Secure credential management • Passwords hashed with bcrypt</span>
                </div>
              </div>

              {/* Bottom Sign In Link */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9', textAlign: 'center', fontSize: 13, color: '#64748B' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
                  Sign In
                </Link>
              </div>

            </div>
          </div>

          {/* RIGHT: REFINED PRODUCT VALUE PREVIEW */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                minHeight: 520,
              }}
            >
              <div>
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
                    marginBottom: 16,
                  }}
                >
                  Placement Workspace
                </div>

                <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                  Everything you need for campus drives
                </h2>
                <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, margin: '0 0 24px' }}>
                  A unified student workspace for managing corporate recruitment notices, application links, and profile details.
                </p>

                {/* Core Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: '#1E293B', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>Profile Vault</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>Store verified academics, CGPA breakdown, resumes, and project details in one location.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: '#1E293B', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>Chrome Extension Autofill</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>Auto-complete Google Forms and external company recruitment applications accurately.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: '#1E293B', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>Calendar & Deadline Sync</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>Synchronize OA deadlines and interview slots directly to your schedule.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Policy Link */}
              <div style={{ paddingTop: 20, borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: 12, color: '#94A3B8' }}>
                Your data is strictly confidential and used solely for your personal placement workflow.
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
