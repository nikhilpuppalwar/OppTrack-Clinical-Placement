import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back to OppTrack!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F9FC', color: '#172033', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── MINIMAL TOP BAR ── */}
      <header style={{ height: 60, borderBottom: '1px solid #E5EAF0', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={logoImg} alt="OppTrack Logo" style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 8 }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em' }}>OppTrack</span>
            <span style={{ color: '#94A3B8', fontSize: 13, userSelect: 'none' }}>|</span>
            <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>Your placement journey, organized.</span>
          </Link>

          <Link
            to="/register"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#087F71',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 6,
              background: '#E8F8F5',
              border: '1px solid rgba(24, 183, 160, 0.3)'
            }}
          >
            Create Free Account →
          </Link>
        </div>
      </header>

      {/* ── MAIN 2-COLUMN AUTH CONSOLE ── */}
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36, alignItems: 'stretch' }}>
          
          {/* LEFT COLUMN: AUTHENTICATION CONSOLE */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 500,
                margin: '0 auto',
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E5EAF0',
                padding: '36px 36px',
                boxShadow: '0 8px 30px rgba(11, 31, 58, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle Top Gradient Aura */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #3B5E97 0%, #18B7A0 50%, #2563EB 100%)' }} />

              {/* Header Titles */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <img src={logoImg} alt="OppTrack" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#EAF2FF', color: '#2563EB' }}>
                    Student Console
                  </span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                  Welcome back to OppTrack
                </h1>
                <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  Sign in to manage your placement applications, deadlines, and Profile Vault.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                
                {/* Email Input */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0B1F3A', marginBottom: 6 }}>
                    College or Personal Email
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="name@college.edu or personal@gmail.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      style={{
                        width: '100%',
                        height: 44,
                        paddingLeft: 38,
                        paddingRight: 12,
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

                {/* Password Input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#0B1F3A' }}>
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      style={{ fontSize: 11.5, color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
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
                        transition: 'all 0.15s ease',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      style={{ position: 'absolute', right: 10, background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                      title={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Device Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
                  <input
                    type="checkbox"
                    id="rememberDevice"
                    checked={form.rememberMe}
                    onChange={e => setForm(f => ({ ...f, rememberMe: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: '#18B7A0', cursor: 'pointer' }}
                  />
                  <label htmlFor="rememberDevice" style={{ fontSize: 12.5, color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                    Remember this device for 30 days
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: 46,
                    background: '#0B1F3A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(11, 31, 58, 0.2)',
                    transition: 'all 0.15s ease',
                    marginTop: 6
                  }}
                >
                  <span>{loading ? 'Authenticating…' : 'Sign In to Workspace'}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              {/* Security Badge */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: '#F8FAFD', border: '1px solid #E5EAF0', fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                  <ShieldCheck size={14} color="#18B7A0" />
                  <span>256-bit encrypted • Profile Vault secured</span>
                </div>
              </div>

              {/* Bottom Footer */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F0F4F8', textAlign: 'center', fontSize: 13, color: '#64748B' }}>
                Don't have an OppTrack account?{' '}
                <Link to="/register" style={{ color: '#087F71', fontWeight: 700, textDecoration: 'none' }}>
                  Create an account Free
                </Link>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: PRECISION DASHBOARD SNAPSHOT / CONTEXT */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                background: '#0B1F3A',
                borderRadius: 20,
                padding: '40px 36px',
                color: '#FFFFFF',
                boxShadow: '0 20px 48px rgba(11, 31, 58, 0.25)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 520
              }}
            >
              {/* Background Ambient Glows */}
              <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(24, 183, 160, 0.14)', filter: 'blur(50px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -50, left: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(59, 94, 151, 0.25)', filter: 'blur(50px)', pointerEvents: 'none' }} />

              {/* Top Telemetry & Status */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#72F8DF' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#72F8DF', animation: 'pulse 1.5s infinite' }} />
                    Placement Radar Active
                  </div>
                  <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Batch 2026 • CSE</span>
                </div>

                <span style={{ fontSize: 11, color: '#9DBFFE', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Workspace Synchronized
                </span>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '4px 0 16px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                  Autumn Placement Season
                </h2>

                {/* Priority Deadlines Pulse Card */}
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)', borderRadius: 12, padding: 18, border: '1px solid rgba(255, 255, 255, 0.12)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} color="#72F8DF" /> 3 Priority Deadlines This Week
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: '#FEF3C7', color: '#92400E' }}>
                      Urgent
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Item 1 */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF' }}>Google India • Software Engineer</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>OA link expires in 18 hrs</div>
                      </div>
                      <span style={{ fontSize: 11, color: '#72F8DF', fontWeight: 700 }}>Sep 25</span>
                    </div>

                    {/* Item 2 */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF' }}>Microsoft • SDE-1 Core</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>Round 2 Technical • Tomorrow 10:00 AM</div>
                      </div>
                      <span style={{ fontSize: 11, color: '#9DBFFE', fontWeight: 700 }}>Sep 26</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Quote / Trust */}
              <div style={{ position: 'relative', zIndex: 2, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <p style={{ fontSize: 13, color: '#CBD5E1', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 12px' }}>
                  "OppTrack saved me from missing 2 critical campus drives when emails got buried in my inbox. The Chrome extension auto-filled Google Forms in seconds."
                </p>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                  Rahul Sharma <span style={{ color: '#72F8DF', fontWeight: 500 }}>• PCCOE, Pune (Batch 2026)</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
