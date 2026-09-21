import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { opportunityAPI, historyAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, ArrowRight, Clock, Sparkles, Trophy, Activity, CalendarDays, CheckCircle2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const PIPELINE_STAGES = [
  { key: 'not_applied', label: 'Not Applied', color: '#64748b' },
  { key: 'applied', label: 'Applied', color: '#2563EB' },
  { key: 'oa', label: 'OA / Assessment', color: '#F59E0B', active: true },
  { key: 'interview', label: 'Interview', color: '#EA580C' },
  { key: 'hr', label: 'HR Round', color: '#7E22CE' },
  { key: 'offer', label: 'Offer', color: '#16A34A', active: true },
  { key: 'rejected', label: 'Rejected', color: '#DC3545' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        const [statsRes, historyRes] = await Promise.allSettled([
          opportunityAPI.stats(),
          historyAPI.list({ limit: 6 }),
        ]);

        if (isMounted) {
          if (statsRes.status === 'fulfilled') {
            setStats(statsRes.value.data);
          } else {
            console.error('Stats error:', statsRes.reason);
            toast.error('Failed to load dashboard statistics');
          }

          if (historyRes.status === 'fulfilled') {
            setRecentLogs(historyRes.value.data?.logs || []);
          }
        }
      } catch (err) {
        if (isMounted) toast.error('Failed to load dashboard statistics');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: 14 }}>
        <div className="spinner" />
        <span style={{ color: '#667085', fontSize: 13, fontWeight: 500 }}>
          Loading your placement workspace…
        </span>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const studentName = user?.name ? user.name.split(' ')[0] : 'Student';

  const total = stats?.total ?? 0;
  const active = (stats?.applied ?? 0) + (stats?.inProgress ?? 0);
  const offers = stats?.offers ?? 0;
  const rejectionRate = stats?.rejectionRate ?? 0;
  const upcomingList = stats?.upcoming || [];

  const groupedUpcoming = upcomingList.reduce((acc, opp) => {
    if (!opp.deadline) return acc;
    const d = new Date(opp.deadline);
    const dateStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(opp);
    return acc;
  }, {});

  const maxStageCount = Math.max(...PIPELINE_STAGES.map(s => stats?.byStatus?.[s.key] ?? 0), 1);

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #E5EAF0', paddingBottom: 24, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B1F3A', margin: '0 0 6px 0', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {greeting}, {studentName} 👋
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#667085' }}>
            Here is your placement pipeline, upcoming assessment dates, and recent activity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            to="/opportunities/new"
            style={{
              background: '#0B1F3A',
              color: '#FFFFFF',
              fontSize: 13.5,
              fontWeight: 600,
              padding: '9px 18px',
              textDecoration: 'none',
              borderRadius: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: '0 2px 6px rgba(11, 31, 58, 0.12)',
              transition: 'background 0.15s ease'
            }}
          >
            <Plus size={16} /> Add Opportunity
          </Link>
        </div>
      </header>

      {/* Metric Cards Row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {/* Card 1: Total */}
        <div className="stat-card">
          <div className="stat-label">Total Tracked</div>
          <div className="stat-value">{total}</div>
          <div style={{ fontSize: 12, color: '#667085', marginTop: 2 }}>In your placement pipeline</div>
        </div>

        {/* Card 2: Active */}
        <div className="stat-card">
          <div className="stat-label">Active Applications</div>
          <div className="stat-value" style={{ color: '#123C73' }}>{active}</div>
          <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, marginTop: 2 }}>Currently in progress</div>
        </div>

        {/* Card 3: Offers Received */}
        <div className="stat-card" style={{ borderTop: '3px solid #18B7A0' }}>
          <div className="stat-label" style={{ color: '#087F71', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={14} color="#18B7A0" /> Offers Received
          </div>
          <div className="stat-value" style={{ color: '#16A34A' }}>{offers}</div>
          <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, marginTop: 2 }}>Offers locked in 🎉</div>
        </div>

        {/* Card 4: Rejection Rate */}
        <div className="stat-card">
          <div className="stat-label">Rejection Rate</div>
          <div className="stat-value" style={{ color: '#667085' }}>{rejectionRate}%</div>
          <div style={{ fontSize: 12, color: '#667085', marginTop: 2 }}>Outcome ratio</div>
        </div>
      </section>

      {/* Main Grid: Pipeline vs Deadlines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Pipeline */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #E5EAF0', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                Application Pipeline
              </h2>
              <span style={{ fontSize: 12, color: '#667085' }}>
                {total} opportunities across recruitment stages
              </span>
            </div>
            <Link to="/opportunities" style={{ fontSize: 12.5, color: '#087F71', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View Table <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {PIPELINE_STAGES.map(stage => {
              const count = stats?.byStatus?.[stage.key] ?? 0;
              const pct = Math.min(Math.round((count / maxStageCount) * 100), 100);

              return (
                <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#172033' }}>
                      {stage.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1F3A', fontFamily: 'JetBrains Mono, monospace' }}>
                      {count}
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#F1F4F9', borderRadius: 3, width: '100%', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: stage.color || '#18B7A0',
                        borderRadius: 3,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deadlines & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Upcoming Deadlines */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#087F71', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={15} color="#18B7A0" /> Upcoming Deadlines
            </div>

            {Object.keys(groupedUpcoming).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(groupedUpcoming).map(([dateStr, items]) => (
                  <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {dateStr}
                    </div>
                    {items.map(opp => (
                      <div
                        key={opp._id}
                        onClick={() => navigate(`/opportunities/${opp._id}`)}
                        style={{
                          background: '#F8FAFD',
                          border: '1px solid #E5EAF0',
                          borderLeft: '3px solid #18B7A0',
                          padding: '11px 14px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1F3A' }}>{opp.company}</div>
                          <div style={{ fontSize: 12, color: '#667085' }}>{opp.role}</div>
                        </div>
                        <ArrowRight size={14} color="#94A3B8" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#667085', fontStyle: 'italic', padding: '12px 0' }}>
                No deadlines approaching in the next 7 days.
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#667085', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={15} color="#2563EB" /> Recent Activity Log
            </div>

            {recentLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentLogs.slice(0, 4).map(log => {
                  const formattedDate = new Date(log.createdAt).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
                  return (
                    <div key={log._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 10, borderBottom: '1px solid #E5EAF0' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#18B7A0', marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#172033', lineHeight: 1.35 }}>{log.description}</div>
                        <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>{formattedDate}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#667085', fontStyle: 'italic', padding: '12px 0' }}>
                No recent activity logged yet.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
