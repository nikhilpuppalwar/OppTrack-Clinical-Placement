import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, GraduationCap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', collegeName: '', branch: '', batch: '' });
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
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#101311',
        color: '#F2F3ED',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: 'Manrope, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#171B18',
          border: '1px solid #2A302B',
          borderRadius: 16,
          padding: 40,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <img src="/logo.svg" alt="OppTrack" style={{ width: 36, height: 36 }} />
          <div>
            <h1 style={{ fontSize: 24, fontFamily: 'serif', color: '#F2F3ED', margin: 0, lineHeight: 1 }}>
              OppTrack
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'rgba(242,243,237,0.5)', letterSpacing: '0.04em' }}>
              Clinical Placement
            </p>
          </div>
        </div>

        {/* Page Title */}
        <h2 style={{ fontSize: 32, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 6px 0', fontWeight: 400 }}>
          Create account
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(242,243,237,0.6)', margin: '0 0 24px 0' }}>
          Start tracking your placement opportunities with AI precision
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Row 1: Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F2F3ED', marginBottom: 6 }}>
                Full Name *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#121413', border: '1px solid #2A302B', borderRadius: 6, overflow: 'hidden' }}>
                <span style={{ padding: '0 10px', color: 'rgba(242,243,237,0.4)', display: 'flex', alignItems: 'center' }}>
                  <User size={15} />
                </span>
                <input
                  placeholder="Raj Patel"
                  value={form.name}
                  onChange={set('name')}
                  required
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F2F3ED', fontSize: 13, padding: '10px 10px 10px 0' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F2F3ED', marginBottom: 6 }}>
                Email Address *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#121413', border: '1px solid #2A302B', borderRadius: 6, overflow: 'hidden' }}>
                <span style={{ padding: '0 10px', color: 'rgba(242,243,237,0.4)', display: 'flex', alignItems: 'center' }}>
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  placeholder="you@pccoe.edu"
                  value={form.email}
                  onChange={set('email')}
                  required
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F2F3ED', fontSize: 13, padding: '10px 10px 10px 0', fontFamily: 'DM Mono, monospace' }}
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F2F3ED', marginBottom: 6 }}>
              Password *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#121413', border: '1px solid #2A302B', borderRadius: 6, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', color: 'rgba(242,243,237,0.4)', display: 'flex', alignItems: 'center' }}>
                <Lock size={15} />
              </span>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F2F3ED', fontSize: 13, padding: '10px 10px 10px 0', fontFamily: 'DM Mono, monospace' }}
              />
            </div>
          </div>

          {/* Row 2: College & Branch */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F2F3ED', marginBottom: 6 }}>
                College
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#121413', border: '1px solid #2A302B', borderRadius: 6, overflow: 'hidden' }}>
                <span style={{ padding: '0 10px', color: 'rgba(242,243,237,0.4)', display: 'flex', alignItems: 'center' }}>
                  <GraduationCap size={15} />
                </span>
                <input
                  placeholder="PCCOE, Pune"
                  value={form.collegeName}
                  onChange={set('collegeName')}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F2F3ED', fontSize: 13, padding: '10px 10px 10px 0' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F2F3ED', marginBottom: 6 }}>
                Branch
              </label>
              <input
                placeholder="Computer Engineering"
                value={form.branch}
                onChange={set('branch')}
                style={{ width: '100%', background: '#121413', border: '1px solid #2A302B', borderRadius: 6, color: '#F2F3ED', fontSize: 13, padding: '10px 12px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Batch */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F2F3ED', marginBottom: 6 }}>
              Batch Year
            </label>
            <input
              placeholder="2027"
              value={form.batch}
              onChange={set('batch')}
              style={{ width: '100%', background: '#121413', border: '1px solid #2A302B', borderRadius: 6, color: '#F2F3ED', fontSize: 13, padding: '10px 12px', outline: 'none', fontFamily: 'DM Mono, monospace' }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#b7e34a',
              color: '#101011',
              border: 'none',
              borderRadius: 6,
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 8,
              transition: 'all 0.15s ease'
            }}
          >
            {loading ? 'Creating account…' : 'Create Account'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Link */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(242,243,237,0.6)', margin: '24px 0 0 0' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#b7e34a', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
