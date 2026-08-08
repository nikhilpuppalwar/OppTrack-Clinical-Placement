import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
        padding: 20,
        fontFamily: 'Manrope, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#171B18',
          border: '1px solid #2A302B',
          borderRadius: 16,
          padding: 40,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
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
          Welcome back
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(242,243,237,0.6)', margin: '0 0 28px 0' }}>
          Sign in to your placement tracker
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F2F3ED', marginBottom: 6 }}>
              Email Address
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#121413', border: '1px solid #2A302B', borderRadius: 6, overflow: 'hidden' }}>
              <span style={{ padding: '0 12px', color: 'rgba(242,243,237,0.4)', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                placeholder="you@college.edu"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#F2F3ED', fontSize: 14, padding: '12px 12px 12px 0', fontFamily: 'DM Mono, monospace'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F2F3ED', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#121413', border: '1px solid #2A302B', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
              <span style={{ padding: '0 12px', color: 'rgba(242,243,237,0.4)', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} />
              </span>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#F2F3ED', fontSize: 14, padding: '12px 40px 12px 0', fontFamily: 'DM Mono, monospace'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: 12, background: 'transparent', border: 'none', color: 'rgba(242,243,237,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#b7e34a',
              color: '#101311',
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
            {loading ? 'Signing in…' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Link */}
        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: 'rgba(242,243,237,0.6)', margin: '28px 0 0 0' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#b7e34a', fontWeight: 600, textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
