import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, GraduationCap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';

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
        background: '#F7F9FC',
        color: '#172033',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#FFFFFF',
          border: '1px solid #E5EAF0',
          borderRadius: 16,
          padding: 40,
          boxShadow: '0 8px 32px rgba(11, 31, 58, 0.08)'
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 26 }}>
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
          Create account
        </h2>
        <p style={{ fontSize: 14, color: '#667085', margin: '0 0 24px 0' }}>
          Start tracking your placement opportunities with precision
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Row 1: Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#172033', marginBottom: 6 }}>
                Full Name *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
                <span style={{ padding: '0 10px', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                  <User size={15} />
                </span>
                <input
                  placeholder="Nikhil Puppalwar"
                  value={form.name}
                  onChange={set('name')}
                  required
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#172033', fontSize: 13, padding: '10px 10px 10px 0' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#172033', marginBottom: 6 }}>
                Email Address *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
                <span style={{ padding: '0 10px', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={set('email')}
                  required
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#172033', fontSize: 13, padding: '10px 10px 10px 0' }}
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#172033', marginBottom: 6 }}>
              Password *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                <Lock size={15} />
              </span>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#172033', fontSize: 13, padding: '10px 10px 10px 0' }}
              />
            </div>
          </div>

          {/* Row 2: College & Branch */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#172033', marginBottom: 6 }}>
                College
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 8, overflow: 'hidden' }}>
                <span style={{ padding: '0 10px', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                  <GraduationCap size={15} />
                </span>
                <input
                  placeholder="PCCOE, Pune"
                  value={form.collegeName}
                  onChange={set('collegeName')}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#172033', fontSize: 13, padding: '10px 10px 10px 0' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#172033', marginBottom: 6 }}>
                Branch / Specialization
              </label>
              <input
                placeholder="Computer Engineering"
                value={form.branch}
                onChange={set('branch')}
                style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 8, color: '#172033', fontSize: 13, padding: '10px 12px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Batch */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#172033', marginBottom: 6 }}>
              Batch Year
            </label>
            <input
              placeholder="2027"
              value={form.batch}
              onChange={set('batch')}
              style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 8, color: '#172033', fontSize: 13, padding: '10px 12px', outline: 'none' }}
            />
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
              transition: 'all 0.15s ease'
            }}
          >
            {loading ? 'Creating account…' : 'Create Free Account'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Link */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#667085', margin: '24px 0 0 0' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#087F71', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
