import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';

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
        background: '#F7F9FC',
        color: '#172033',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#FFFFFF',
          border: '1px solid #E5EAF0',
          borderRadius: 16,
          padding: 40,
          boxShadow: '0 8px 32px rgba(11, 31, 58, 0.08)'
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <img src={logoImg} alt="OppTrack" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0B1F3A', margin: 0, lineHeight: 1 }}>
              OppTrack
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: 11, fontWeight: 600, color: '#667085', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Career OS
            </p>
          </div>
        </div>

        {/* Page Title */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0B1F3A', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: 14, color: '#667085', margin: '0 0 28px 0' }}>
          Sign in to your placement tracker
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#172033', marginBottom: 6 }}>
              Email Address
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '0 12px', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
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
                  color: '#172033', fontSize: 14, padding: '11px 12px 11px 0', fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#172033', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
              <span style={{ padding: '0 12px', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
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
                  color: '#172033', fontSize: 14, padding: '11px 40px 11px 0', fontFamily: 'inherit'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: 12, background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
              background: '#0B1F3A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 6,
              boxShadow: '0 2px 6px rgba(11, 31, 58, 0.15)',
              transition: 'background 0.15s ease'
            }}
          >
            {loading ? 'Signing in…' : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#667085' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#087F71', fontWeight: 600, textDecoration: 'none' }}>
            Create one free
          </Link>
        </div>
      </div>
    </div>
  );
}
