import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, GraduationCap, Building2, Calendar, ArrowRight, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';

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
    collegeName: 'PCCOE, Pune',
    branch: 'CS',
    batch: '2026'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to OppTrack 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please check your information.');
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
            to="/login"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#0B1F3A',
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: 6,
              background: '#FFFFFF',
              border: '1px solid #E5EAF0'
            }}
          >
            Already registered? Sign In
          </Link>
        </div>
      </header>

      {/* ── MAIN 2-COLUMN SIGNUP CONSOLE ── */}
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '36px 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36, alignItems: 'stretch' }}>
          
          {/* LEFT COLUMN: SIGNUP CONSOLE */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 540,
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
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #18B7A0 0%, #2563EB 50%, #3B5E97 100%)' }} />

              {/* Header Titles */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <img src={logoImg} alt="OppTrack" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#E8F8F5', color: '#087F71' }}>
                    Student Setup
                  </span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                  Create your OppTrack Account
                </h1>
                <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  Set up your student Profile Vault and start tracking placement opportunities.
                </p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0B1F3A', marginBottom: 5 }}>
                    Full Name *
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={set('name')}
                      style={{
                        width: '100%', height: 42, paddingLeft: 38, paddingRight: 12,
                        background: '#F8FAFD', border: '1px solid #CBD5E1', borderRadius: 8,
                        fontSize: 13.5, color: '#0B1F3A', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0B1F3A', marginBottom: 5 }}>
                    Email Address *
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="rahul.sharma@college.edu or name@gmail.com"
                      value={form.email}
                      onChange={set('email')}
                      style={{
                        width: '100%', height: 42, paddingLeft: 38, paddingRight: 12,
                        background: '#F8FAFD', border: '1px solid #CBD5E1', borderRadius: 8,
                        fontSize: 13.5, color: '#0B1F3A', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0B1F3A', marginBottom: 5 }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={set('password')}
                      style={{
                        width: '100%', height: 42, paddingLeft: 38, paddingRight: 12,
                        background: '#F8FAFD', border: '1px solid #CBD5E1', borderRadius: 8,
                        fontSize: 13.5, color: '#0B1F3A', outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* College Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0B1F3A', marginBottom: 5 }}>
                    College / Institute
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <Building2 size={16} />
                    </span>
                    <select
                      value={form.collegeName}
                      onChange={set('collegeName')}
                      style={{
                        width: '100%', height: 42, paddingLeft: 38, paddingRight: 12,
                        background: '#F8FAFD', border: '1px solid #CBD5E1', borderRadius: 8,
                        fontSize: 13.5, color: '#0B1F3A', outline: 'none'
                      }}
                    >
                      {COLLEGE_OPTIONS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Branch & Batch Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0B1F3A', marginBottom: 5 }}>
                      Branch / Department
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <GraduationCap size={16} />
                      </span>
                      <select
                        value={form.branch}
                        onChange={set('branch')}
                        style={{
                          width: '100%', height: 42, paddingLeft: 38, paddingRight: 12,
                          background: '#F8FAFD', border: '1px solid #CBD5E1', borderRadius: 8,
                          fontSize: 13, color: '#0B1F3A', outline: 'none'
                        }}
                      >
                        {BRANCH_OPTIONS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#0B1F3A', marginBottom: 5 }}>
                      Batch / Passing Year
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <Calendar size={16} />
                      </span>
                      <select
                        value={form.batch}
                        onChange={set('batch')}
                        style={{
                          width: '100%', height: 42, paddingLeft: 38, paddingRight: 12,
                          background: '#F8FAFD', border: '1px solid #CBD5E1', borderRadius: 8,
                          fontSize: 13, color: '#0B1F3A', outline: 'none'
                        }}
                      >
                        {BATCH_OPTIONS.map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                  <span>{loading ? 'Creating Workspace…' : 'Create Workspace Account'}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              {/* Security Badge */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: '#F8FAFD', border: '1px solid #E5EAF0', fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                  <ShieldCheck size={14} color="#18B7A0" />
                  <span>256-bit encrypted • Profile Vault secured</span>
                </div>
              </div>

              {/* Bottom Sign In Link */}
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #F0F4F8', textAlign: 'center', fontSize: 13, color: '#64748B' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#087F71', fontWeight: 700, textDecoration: 'none' }}>
                  Sign In
                </Link>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: PRECISION ONBOARDING SNAPSHOT */}
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
                minHeight: 560
              }}
            >
              {/* Background Ambient Glows */}
              <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(24, 183, 160, 0.14)', filter: 'blur(50px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: -50, left: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(59, 94, 151, 0.25)', filter: 'blur(50px)', pointerEvents: 'none' }} />

              {/* Content */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#72F8DF', marginBottom: 18 }}>
                  <Zap size={13} color="#72F8DF" />
                  Instant Activation
                </div>

                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                  Unified Placement Intelligence
                </h2>
                <p style={{ fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.6, margin: '0 0 28px' }}>
                  One clean dashboard replacing disconnected spreadsheets, lost emails, and repetitive form filling.
                </p>

                {/* Features Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(24, 183, 160, 0.2)', color: '#72F8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle2 size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#FFFFFF' }}>Centralized Profile Vault</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>Your verified academics, CGPA, resume versions, and coding handles in one place.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(24, 183, 160, 0.2)', color: '#72F8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle2 size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#FFFFFF' }}>1-Click Chrome Extension Autofill</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>Fills Google Forms and company registration links in 5 seconds.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(24, 183, 160, 0.2)', color: '#72F8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle2 size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#FFFFFF' }}>Automated Gmail Circular Sync</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>AI extracts packages, deadlines, and allowed branches from incoming notices.</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(24, 183, 160, 0.2)', color: '#72F8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle2 size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#FFFFFF' }}>Google Calendar 2-Way Sync</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>Never miss an Online Assessment, interview, or registration deadline.</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Campus Trust Banner */}
              <div style={{ position: 'relative', zIndex: 2, paddingTop: 20, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>
                  Trusted by students from <strong style={{ color: '#FFFFFF' }}>PCCOE, Pune</strong> and leading engineering institutions.
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
