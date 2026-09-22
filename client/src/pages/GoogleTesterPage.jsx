import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { testerAPI } from '../api';
import {
  ShieldCheck, CheckCircle2, Clock, ArrowRight, Send
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function GoogleTesterPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    userCap: 100,
    developerCount: 1,
    approvedCount: 0,
    pendingCount: 0,
    totalUsed: 1,
    remainingSlots: 99,
    usagePercent: 1,
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    gmail: user?.email?.includes('@gmail.com') ? user.email : '',
    reason: 'Sync clinical placement drive emails and deadlines to Google Calendar',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myRequest, setMyRequest] = useState(null);

  const fetchStatsAndStatus = async () => {
    try {
      setLoading(true);
      const { data: statsData } = await testerAPI.getStats();
      setStats(statsData);

      if (user) {
        const { data: myData } = await testerAPI.getMyStatus();
        if (myData?.request) {
          setMyRequest(myData.request);
        }
      }
    } catch (err) {
      console.error('Failed to load tester stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndStatus();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Please enter your name');
    if (!formData.email.trim()) return toast.error('Please enter your contact email');
    if (!formData.gmail.trim()) return toast.error('Please enter your Google / Gmail address');

    if (!formData.gmail.includes('@')) {
      return toast.error('Please enter a valid Gmail address');
    }

    setSubmitting(true);
    const toastId = toast.loading('Submitting tester access request…');

    try {
      const { data } = await testerAPI.create(formData);
      toast.success(data.message || 'Request submitted successfully!', { id: toastId });
      setMyRequest(data.request);
      if (data.stats) {
        setStats(prev => ({ ...prev, ...data.stats }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #E5EAF0', paddingBottom: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{
            background: '#E8F8F5', color: '#0D7A6B', padding: '4px 10px',
            borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-flex',
            alignItems: 'center', gap: 5, border: '1px solid rgba(24,183,160,0.3)'
          }}>
            <ShieldCheck size={14} /> Google OAuth Beta
          </span>
          <span style={{ color: '#667085', fontSize: 13 }}>• Developer Testing Program</span>
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, color: '#0B1F3A', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Request Google Tester Access
        </h1>
        <p style={{ margin: 0, fontSize: 14.5, color: '#667085', maxWidth: 680, lineHeight: 1.6 }}>
          Google OAuth is currently in <strong>Testing Mode</strong>. Under Google Cloud policies, only authorized test users can connect their Gmail & Google Calendar. Submit your Gmail below to be added by the administrator.
        </p>
      </header>

      {/* 100 User Cap Status Card */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 14,
        padding: 24, marginBottom: 30, boxShadow: '0 2px 8px rgba(11,31,58,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#123C73', letterSpacing: '0.05em' }}>
              Google OAuth User Cap
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1F3A', marginTop: 2 }}>
              {stats.totalUsed} <span style={{ fontSize: 14, fontWeight: 500, color: '#667085' }}>/ {stats.userCap} Users Allowed</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              background: '#F1F5F9', color: '#475569', padding: '6px 12px',
              borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
              🛡️ 1 Primary Admin
            </span>
            <span style={{
              background: '#E8F8F5', color: '#0D7A6B', padding: '6px 12px',
              borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
              👥 {stats.approvedCount} Approved Testers
            </span>
            <span style={{
              background: stats.remainingSlots > 10 ? '#EAF2FF' : '#FEF3C7',
              color: stats.remainingSlots > 10 ? '#2563EB' : '#B45309',
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
              ⚡ {stats.remainingSlots} Slots Available
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.max(1, ((stats.totalUsed) / stats.userCap) * 100))}%`,
            background: 'linear-gradient(90deg, #123C73 0%, #18B7A0 100%)',
            borderRadius: 4,
            transition: 'width 0.4s ease',
          }} />
        </div>

        <p style={{ margin: 0, fontSize: 12.5, color: '#667085', lineHeight: 1.5 }}>
          ℹ️ When you submit your Gmail, an automated notification is instantly dispatched to the platform owner. Once added to Google Cloud Console, your Google Account is immediately authorized to sync emails and calendar events.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: myRequest ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 36 }}>
        {/* If user already requested */}
        {myRequest ? (
          <div style={{
            background: myRequest.status === 'approved' ? '#E8F8F5' : '#FEF9C3',
            border: `1px solid ${myRequest.status === 'approved' ? '#A7F3D0' : '#FDE047'}`,
            borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {myRequest.status === 'approved' ? (
                <CheckCircle2 size={22} color="#0D7A6B" />
              ) : (
                <Clock size={22} color="#A16207" />
              )}
              <h3 style={{
                margin: 0, fontSize: 17, fontWeight: 700,
                color: myRequest.status === 'approved' ? '#0D7A6B' : '#854D0E'
              }}>
                {myRequest.status === 'approved'
                  ? 'Your Gmail Has Been Approved & Added!'
                  : 'Tester Request Pending Admin Approval'}
              </h3>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
              {myRequest.status === 'approved' ? (
                <>Your Gmail <strong>{myRequest.gmail}</strong> was successfully registered as an OAuth Test User in Google Cloud Console. You can now go to Settings and connect your account!</>
              ) : (
                <>Your request for <strong>{myRequest.gmail}</strong> was sent to the administrator. As soon as they paste your Gmail into Google Cloud Console, you will receive an approval email.</>
              )}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {myRequest.status === 'approved' ? (
                <Link
                  to="/settings"
                  style={{
                    background: '#0B1F3A', color: '#FFFFFF', padding: '9px 18px',
                    borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  Go to Settings & Connect Google <ArrowRight size={14} />
                </Link>
              ) : (
                <div style={{ fontSize: 12, color: '#854D0E', fontWeight: 600 }}>
                  Submitted on {new Date(myRequest.createdAt).toLocaleDateString()} • We will notify you via {myRequest.email}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Application Form */
          <div style={{
            background: '#FFFFFF', border: '1px solid #E5EAF0', borderRadius: 14,
            padding: 28, boxShadow: '0 2px 8px rgba(11,31,58,0.04)'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3A', margin: '0 0 6px 0' }}>
              Submit Your Gmail Address
            </h2>
            <p style={{ fontSize: 13, color: '#667085', margin: '0 0 20px 0' }}>
              Enter the exact Google account you want to use for auto-fetching placement emails and syncing deadlines.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0B1F3A', marginBottom: 6 }}>
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  required
                  style={{
                    width: '100%', padding: '9px 12px', background: '#FFFFFF',
                    border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13,
                    color: '#172033', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0B1F3A', marginBottom: 6 }}>
                  Contact Email (for notifications)
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  required
                  style={{
                    width: '100%', padding: '9px 12px', background: '#FFFFFF',
                    border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13,
                    color: '#172033', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#123C73', marginBottom: 6 }}>
                  Google / Gmail Address to Add <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={formData.gmail}
                  onChange={e => setFormData(p => ({ ...p, gmail: e.target.value }))}
                  required
                  style={{
                    width: '100%', padding: '9px 12px', background: '#F8FAFD',
                    border: '1.5px solid #18B7A0', borderRadius: 8, fontSize: 13.5,
                    color: '#0B1F3A', fontWeight: 600, outline: 'none', boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: 11.5, color: '#667085', marginTop: 4, display: 'block' }}>
                  Must be your active Google Account (e.g. <code>@gmail.com</code> or Google Workspace email).
                </span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0B1F3A', marginBottom: 6 }}>
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Campus placement drive calendar synchronization"
                  value={formData.reason}
                  onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                  style={{
                    width: '100%', padding: '9px 12px', background: '#FFFFFF',
                    border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13,
                    color: '#172033', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || stats.remainingSlots <= 0}
                style={{
                  width: '100%', background: '#0B1F3A', color: '#FFFFFF',
                  padding: '11px 0', border: 'none', borderRadius: 8,
                  fontSize: 14, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.2s',
                  boxShadow: '0 2px 6px rgba(11,31,58,0.15)'
                }}
                onMouseEnter={e => !submitting && (e.currentTarget.style.background = '#18B7A0')}
                onMouseLeave={e => !submitting && (e.currentTarget.style.background = '#0B1F3A')}
              >
                <Send size={15} /> {submitting ? 'Submitting…' : 'Submit Tester Request'}
              </button>
            </form>
          </div>
        )}

        {/* Informational Card */}
        <div style={{
          background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 14,
          padding: 24, display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B1F3A', margin: '0 0 6px 0' }}>
              Why is this required?
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#667085', lineHeight: 1.6 }}>
              OppTrack interacts directly with Google APIs to auto-fetch campus placement emails and sync interview dates to Google Calendar. Google limits applications in developer testing status to <strong>100 authorized test users</strong> before requiring corporate domain verification.
            </p>
          </div>

          <div style={{ borderTop: '1px solid #E5EAF0', paddingTop: 14 }}>
            <h4 style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1F3A', margin: '0 0 6px 0' }}>
              What happens next?
            </h4>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#667085', lineHeight: 1.6 }}>
              <li>The administrator immediately receives an email notification with your Gmail address.</li>
              <li>Your Gmail is added to the <strong>Google Cloud Console → Audience → Test Users</strong> list.</li>
              <li>You can log in and connect Gmail & Calendar with zero verification errors!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
