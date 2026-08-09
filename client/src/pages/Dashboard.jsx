import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { opportunityAPI, historyAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, ArrowRight, Clock, Sparkles, Trophy, Activity, CalendarDays, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PIPELINE_STAGES = [
  { key: 'not_applied', label: 'Not Applied' },
  { key: 'applied', label: 'Applied' },
  { key: 'oa', label: 'OA / Test', active: true },
  { key: 'interview', label: 'Interview' },
  { key: 'hr', label: 'HR Round' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
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
      <div className="loading-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" />
        <span style={{ color: 'rgba(242,243,237,0.5)', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
          Initializing placement metrics…
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
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60, fontFamily: 'Manrope, sans-serif' }}>
      {/* Editorial Header */}
      <header style={{ borderBottom: '1px solid #2A302B', paddingBottom: 28, marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 6px 0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {greeting}, {studentName}.
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: 'rgba(242,243,237,0.6)' }}>
            Here is what is happening with your placement pipeline and upcoming deadlines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            to="/opportunities/new"
            style={{
              background: '#b7e34a',
              color: '#101311',
              fontSize: 13,
              fontWeight: 700,
              padding: '10px 20px',
              textDecoration: 'none',
              borderRadius: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'transform 0.15s ease'
            }}
          >
            <Plus size={16} /> Add Opportunity
          </Link>
        </div>
      </header>

      {/* Metric Cards Row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
        {/* Card 1: Total */}
        <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(242,243,237,0.45)', marginBottom: 6 }}>
            Total Opportunities
          </div>
          <div style={{ fontSize: 38, fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', lineHeight: 1 }}>
            {total}
          </div>
        </div>

        {/* Card 2: Active */}
        <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(242,243,237,0.45)', marginBottom: 6 }}>
            Active Applications
          </div>
          <div style={{ fontSize: 38, fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', lineHeight: 1 }}>
            {active}
          </div>
        </div>

        {/* Card 3: Offers Received (Highlight) */}
        <div style={{ background: '#171B18', border: '1px solid #2A302B', borderBottom: '3px solid #b7e34a', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#b7e34a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={13} /> Offers Received
          </div>
          <div style={{ fontSize: 38, fontWeight: 400, fontFamily: 'serif', color: '#b7e34a', lineHeight: 1 }}>
            {offers}
          </div>
        </div>

        {/* Card 4: Rejection Rate */}
        <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(242,243,237,0.45)', marginBottom: 6 }}>
            Rejection Rate
          </div>
          <div style={{ fontSize: 38, fontWeight: 400, fontFamily: 'serif', color: '#F2F3ED', lineHeight: 1 }}>
            {rejectionRate}%
          </div>
        </div>
      </section>

      {/* Main Grid: Pipeline vs Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 32, alignItems: 'start' }}>
        
        {/* Left Column: Pipeline */}
        <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 16, padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 16, borderBottom: '1px solid #2A302B', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontFamily: 'serif', color: '#F2F3ED', margin: '0 0 4px 0', fontWeight: 400 }}>
                Application Pipeline
              </h2>
              <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'rgba(242,243,237,0.45)' }}>
                {total} entries across {PIPELINE_STAGES.length} stages
              </span>
            </div>
            <Link to="/opportunities" style={{ fontSize: 12, color: '#b7e34a', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {PIPELINE_STAGES.map(stage => {
              const count = stats?.byStatus?.[stage.key] ?? 0;
              const pct = Math.min(Math.round((count / maxStageCount) * 100), 100);
              const isActive = stage.active || stage.key === 'oa' || stage.key === 'offer';

              return (
                <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: isActive ? '#b7e34a' : 'rgba(242,243,237,0.7)', letterSpacing: '0.04em' }}>
                      {stage.label}
                    </span>
                    <span style={{ fontSize: 13, fontFamily: 'DM Mono, monospace', color: '#F2F3ED' }}>
                      {count}
                    </span>
                  </div>
                  <div style={{ height: 4, background: '#121413', borderRadius: 2, width: '100%', position: 'relative', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: isActive ? '#b7e34a' : 'rgba(242,243,237,0.3)',
                        borderRadius: 2,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deadlines & Activity Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Upcoming Deadlines */}
          <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b7e34a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={14} /> Upcoming Deadlines
            </div>

            {Object.keys(groupedUpcoming).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {Object.entries(groupedUpcoming).map(([dateStr, items]) => (
                  <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'rgba(242,243,237,0.4)', textTransform: 'uppercase' }}>
                      {dateStr}
                    </div>
                    {items.map(opp => (
                      <div
                        key={opp._id}
                        onClick={() => navigate(`/opportunities/${opp._id}`)}
                        style={{
                          background: '#121413',
                          border: '1px solid #2A302B',
                          borderLeft: '3px solid #ffb4ab',
                          padding: '12px 14px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#F2F3ED' }}>{opp.company}</div>
                          <div style={{ fontSize: 12, color: 'rgba(242,243,237,0.5)' }}>{opp.role}</div>
                        </div>
                        <ArrowRight size={14} color="rgba(242,243,237,0.4)" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'rgba(242,243,237,0.4)', fontStyle: 'italic' }}>
                No deadlines approaching in the next 7 days.
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div style={{ background: '#171B18', border: '1px solid #2A302B', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(242,243,237,0.5)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={14} /> Recent Log Activity
            </div>

            {recentLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentLogs.slice(0, 4).map(log => {
                  const formattedDate = new Date(log.createdAt).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
                  return (
                    <div key={log._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 10, borderBottom: '1px solid #2A302B' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#b7e34a', marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#F2F3ED', lineHeight: 1.3 }}>{log.description}</div>
                        <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'rgba(242,243,237,0.4)', marginTop: 2 }}>{formattedDate}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'rgba(242,243,237,0.4)', fontStyle: 'italic' }}>
                No recent activity logged.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
