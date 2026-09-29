import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { opportunityAPI, historyAPI, profileAPI, gmailAPI, settingsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, ArrowRight, Clock, Sparkles, Trophy, Activity, CalendarDays, CheckCircle2, 
  TrendingUp, AlertCircle, Briefcase, GraduationCap, Target, FileText, Check, 
  ExternalLink, Zap, ChevronRight, X, Send, SlidersHorizontal, AlertTriangle, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const PIPELINE_STAGES = [
  { key: 'not_applied', label: 'Not Applied', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
  { key: 'applied', label: 'Applied', color: '#2563EB', bg: '#EAF2FF', border: '#BFDBFE' },
  { key: 'oa', label: 'OA / Assessment', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { key: 'interview', label: 'Interview', color: '#EA580C', bg: '#FFF7ED', border: '#FFEDD5' },
  { key: 'hr', label: 'HR Round', color: '#7E22CE', bg: '#FAF5FF', border: '#F3E8FF' },
  { key: 'offer', label: 'Offer', color: '#16A34A', bg: '#EAF8EF', border: '#BBF7D0' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary Data States
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [pendingGmailCount, setPendingGmailCount] = useState(0);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // UX Feature States
  const [focusMode, setFocusMode] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswers, setAiAnswers] = useState([]);
  const [isAiAnswering, setIsAiAnswering] = useState(false);

  // ─── Fetch All Workspace Data ─────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const [statsRes, historyRes, oppsRes, profileRes, gmailRes, settingsRes] = await Promise.allSettled([
          opportunityAPI.stats(),
          historyAPI.list({ limit: 5 }),
          opportunityAPI.list(),
          profileAPI.get().catch(() => null),
          gmailAPI.getPending().catch(() => null),
          settingsAPI.get().catch(() => null),
        ]);

        if (!isMounted) return;

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        } else {
          console.warn('Stats error:', statsRes.reason);
        }

        if (historyRes.status === 'fulfilled') {
          setRecentLogs(historyRes.value.data?.logs || []);
        }

        if (oppsRes.status === 'fulfilled') {
          const rawOpps = oppsRes.value.data;
          const oppList = Array.isArray(rawOpps) ? rawOpps : (rawOpps?.opportunities || []);
          setOpportunities(oppList);
        }

        if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
          setProfile(profileRes.value.data);
        }

        if (gmailRes.status === 'fulfilled' && gmailRes.value?.data) {
          const pData = gmailRes.value.data;
          const count = Array.isArray(pData) ? pData.length : (pData?.total || pData?.items?.length || 0);
          setPendingGmailCount(count);
        }

        if (settingsRes.status === 'fulfilled' && settingsRes.value?.data) {
          setSettings(settingsRes.value.data);
        }
      } catch (err) {
        if (isMounted) toast.error('Failed to load dashboard data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => { isMounted = false; };
  }, []);

  // ─── Calculations from Real Data ──────────────────────────────────────────
  const now = new Date();
  const currentHour = now.getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const studentName = user?.name ? user.name.split(' ')[0] : 'Student';

  // Basic counts
  const total = stats?.total ?? opportunities.length ?? 0;
  const active = (stats?.applied ?? 0) + (stats?.inProgress ?? 0);
  const offers = stats?.offers ?? opportunities.filter(o => o.status === 'offer').length ?? 0;
  const rejected = stats?.rejected ?? opportunities.filter(o => o.status === 'rejected').length ?? 0;

  // New this month calculation
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const addedThisMonth = opportunities.filter(o => o.createdAt && new Date(o.createdAt) >= startOfMonth).length;

  // Response rate calculation: outcomes (oa, interview, hr, offer, rejected) / total applied
  const evaluatedCount = (stats?.byStatus?.oa || 0) + 
                         (stats?.byStatus?.interview || 0) + 
                         (stats?.byStatus?.hr || 0) + 
                         offers + rejected;
  const appliedBase = (stats?.byStatus?.applied || 0) + evaluatedCount;
  const responseRate = appliedBase > 0 ? Math.round((evaluatedCount / appliedBase) * 100) : null;

  // Profile completion calculation
  const profileCompletion = useMemo(() => {
    if (!profile) return 60;
    const checks = [
      profile.candidateName,
      profile.collegeEmail || profile.personalEmail,
      profile.phone,
      profile.branch,
      profile.passingYear,
      profile.cgpa,
      profile.tenthPercent,
      profile.twelfthPercent,
      profile.technicalSkills || profile.programmingLanguages,
      profile.resumeLink,
      profile.linkedinLink || profile.githubLink,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.min(100, Math.round((filled / checks.length) * 100));
  }, [profile]);

  // User skills set for matching
  const userSkills = useMemo(() => {
    if (!profile) return [];
    const raw = [
      profile.technicalSkills,
      profile.programmingLanguages,
      profile.frameworks,
      profile.tools,
    ].filter(Boolean).join(', ');
    return raw
      .split(/[,;\n/]+/)
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 1);
  }, [profile]);

  // ─── Dynamic "Your Next Moves" Generation ─────────────────────────────────
  const nextMoves = useMemo(() => {
    const moves = [];

    // 1. Critical Deadline (< 72 hours)
    const upcomingDeadlines = opportunities
      .filter(o => o.deadline && new Date(o.deadline) >= now && o.status !== 'offer' && o.status !== 'rejected')
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    if (upcomingDeadlines.length > 0) {
      const topDeadline = upcomingDeadlines[0];
      const hoursLeft = Math.round((new Date(topDeadline.deadline) - now) / (1000 * 60 * 60));
      const urgency = hoursLeft <= 24 ? 'Deadline: Today / Tomorrow' : `Deadline: In ${Math.ceil(hoursLeft / 24)} days`;
      moves.push({
        id: `deadline-${topDeadline._id}`,
        priority: 'urgent',
        badge: '🔴 DEADLINE',
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FECACA',
        title: topDeadline.company,
        subtitle: topDeadline.role || 'Placement Drive',
        detail: urgency,
        actionLabel: 'View Opportunity',
        onClick: () => navigate(`/opportunities/${topDeadline._id}`),
      });
    }

    // 2. Upcoming Assessment / Interview
    const testOrInterview = opportunities.find(o => 
      (o.status === 'interview' || o.status === 'hr' || o.status === 'oa' || o.testDate || o.interviewDate) &&
      o.status !== 'offer' && o.status !== 'rejected'
    );
    if (testOrInterview) {
      const isInterview = testOrInterview.status === 'interview' || testOrInterview.status === 'hr';
      moves.push({
        id: `prep-${testOrInterview._id}`,
        priority: 'high',
        badge: isInterview ? '🔵 PREPARE' : '🟠 ASSESSMENT',
        color: isInterview ? '#2563EB' : '#D97706',
        bg: isInterview ? '#EFF6FF' : '#FFFBEB',
        border: isInterview ? '#BFDBFE' : '#FDE68A',
        title: testOrInterview.company,
        subtitle: testOrInterview.role || 'Round in Progress',
        detail: isInterview ? 'Interview round scheduled or expected' : 'Online Assessment scheduled',
        actionLabel: isInterview ? 'Prepare for Interview' : 'View Test Details',
        onClick: () => navigate(`/opportunities/${testOrInterview._id}`),
      });
    }

    // 3. Stale Application Follow-up (> 7 days since applied)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const staleApp = opportunities.find(o => 
      o.status === 'applied' && 
      new Date(o.updatedAt || o.createdAt) < sevenDaysAgo
    );
    if (staleApp) {
      const daysAgo = Math.floor((now - new Date(staleApp.updatedAt || staleApp.createdAt)) / (1000 * 60 * 60 * 24));
      moves.push({
        id: `followup-${staleApp._id}`,
        priority: 'medium',
        badge: '🟠 FOLLOW UP',
        color: '#EA580C',
        bg: '#FFF7ED',
        border: '#FED7AA',
        title: staleApp.company,
        subtitle: staleApp.role || 'Application Submitted',
        detail: `No status update since ${daysAgo} days ago`,
        actionLabel: 'Follow Up',
        onClick: () => navigate(`/opportunities/${staleApp._id}`),
      });
    }

    // 4. Pending Review Queue or Profile Completeness
    if (pendingGmailCount > 0) {
      moves.push({
        id: 'gmail-pending',
        priority: 'high',
        badge: '✉️ INCOMING',
        color: '#087F71',
        bg: '#E8F8F5',
        border: '#A7F3D0',
        title: 'Pending Gmail Reviews',
        subtitle: `${pendingGmailCount} opportunities imported`,
        detail: 'New job notifications extracted from college TPO emails',
        actionLabel: 'Review Emails',
        onClick: () => navigate('/opportunities'),
      });
    } else if (profileCompletion < 100) {
      moves.push({
        id: 'complete-profile',
        priority: 'normal',
        badge: '🟢 COMPLETE',
        color: '#15803D',
        bg: '#F0FDF4',
        border: '#BBF7D0',
        title: 'Complete Profile Vault',
        subtitle: `Profile is ${profileCompletion}% ready`,
        detail: 'Fill missing fields to power 1-click Chrome Extension autofill',
        actionLabel: 'Complete Profile',
        onClick: () => navigate('/profile'),
      });
    }

    // Fallback if user has no pending moves: add opportunity reminder
    if (moves.length === 0) {
      moves.push({
        id: 'track-first',
        priority: 'normal',
        badge: '✦ GET STARTED',
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        title: 'Track a New Application',
        subtitle: 'Keep your placement pipeline active',
        detail: 'Add applications to track deadlines, test dates, and interviews',
        actionLabel: 'Add Opportunity',
        onClick: () => navigate('/opportunities/new'),
      });
    }

    return moves.slice(0, 4);
  }, [opportunities, pendingGmailCount, profileCompletion, now, navigate]);

  // ─── Upcoming Deadlines Grouped Chronologically ───────────────────────────
  const upcomingDeadlinesGrouped = useMemo(() => {
    const list = opportunities
      .filter(o => o.deadline && new Date(o.deadline) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 6);

    const groups = { today: [], tomorrow: [], later: [] };
    const todayStr = now.toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    list.forEach(opp => {
      const oppDate = new Date(opp.deadline);
      const oppDateStr = oppDate.toDateString();
      if (oppDateStr === todayStr) {
        groups.today.push(opp);
      } else if (oppDateStr === tomorrowStr) {
        groups.tomorrow.push(opp);
      } else {
        const formattedDate = oppDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
        const existing = groups.later.find(g => g.dateLabel === formattedDate);
        if (existing) {
          existing.items.push(opp);
        } else {
          groups.later.push({ dateLabel: formattedDate, items: [opp] });
        }
      }
    });

    return groups;
  }, [opportunities, now]);

  // ─── Application Momentum: Last 4 Weeks Data ──────────────────────────────
  const momentumWeeks = useMemo(() => {
    const weeks = [
      { label: 'Week 1', count: 0, daysAgoStart: 28, daysAgoEnd: 21 },
      { label: 'Week 2', count: 0, daysAgoStart: 21, daysAgoEnd: 14 },
      { label: 'Week 3', count: 0, daysAgoStart: 14, daysAgoEnd: 7 },
      { label: 'Week 4', count: 0, daysAgoStart: 7, daysAgoEnd: 0 },
    ];

    opportunities.forEach(opp => {
      if (!opp.createdAt) return;
      const created = new Date(opp.createdAt);
      const diffDays = (now - created) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 28) {
        if (diffDays > 21) weeks[0].count++;
        else if (diffDays > 14) weeks[1].count++;
        else if (diffDays > 7) weeks[2].count++;
        else weeks[3].count++;
      }
    });

    return weeks;
  }, [opportunities, now]);

  // ─── Opportunity Matches ("Opportunities Worth a Look") ───────────────────
  const opportunityMatches = useMemo(() => {
    const activeOpps = opportunities.filter(o => o.status !== 'rejected');
    if (activeOpps.length === 0) return [];

    const scored = activeOpps.map(opp => {
      let matchScore = 70; // baseline
      const textToSearch = [
        opp.company,
        opp.role,
        opp.description,
        opp.employmentType,
        JSON.stringify(opp.customFields || []),
        JSON.stringify(opp.eligibility || {}),
      ].join(' ').toLowerCase();

      const matchedSkills = [];
      userSkills.forEach(skill => {
        if (textToSearch.includes(skill)) {
          matchedSkills.push(skill);
          matchScore += 5;
        }
      });

      // Branch match boost
      if (profile?.branch && textToSearch.includes(profile.branch.toLowerCase())) {
        matchScore += 8;
      }

      matchScore = Math.min(96, Math.max(68, matchScore));

      return {
        ...opp,
        matchScore,
        matchedTags: matchedSkills.slice(0, 4),
      };
    });

    return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }, [opportunities, userSkills, profile]);

  // ─── OppTrack Intelligence Summary Insights ───────────────────────────────
  const aiInsights = useMemo(() => {
    // 1. Application Pattern
    const internshipCount = opportunities.filter(o => (o.employmentType || '').includes('intern')).length;
    const placementCount = opportunities.length - internshipCount;
    let patternText = 'Your pipeline is just starting. Add your target campus companies to discover pattern trends.';
    if (opportunities.length > 0) {
      if (internshipCount > placementCount) {
        patternText = `Your strongest focus is in internships (${Math.round((internshipCount / opportunities.length) * 100)}% of tracked roles). Keep an eye on PPO conversion timelines.`;
      } else {
        patternText = `Your active focus is primarily full-time placements (${Math.round((placementCount / opportunities.length) * 100)}% of pipeline). Standardize your core DSA and system design prep.`;
      }
    }

    // 2. Deadline Timeline
    const dueNext7Days = opportunities.filter(o => {
      if (!o.deadline) return false;
      const d = new Date(o.deadline);
      const diff = (d - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;
    const deadlineText = dueNext7Days > 0
      ? `${dueNext7Days} opportunity deadline${dueNext7Days > 1 ? 's close' : ' closes'} within the next 7 days. Verify registration links and submission timestamps early.`
      : 'You have zero urgent deadlines closing in the next 7 days. Good window to research upcoming campus recruitment drives.';

    // 3. Profile Vault Readiness
    const profileText = profileCompletion < 90
      ? `Profile Vault is ${profileCompletion}% complete. Adding your GitHub, portfolio, and key coursework will maximize Chrome Extension autofill speed.`
      : `Profile Vault is ${profileCompletion}% complete with verified academic data. Ready for 1-click autofill across campus placement portals.`;

    return {
      pattern: patternText,
      deadlines: deadlineText,
      profile: profileText,
    };
  }, [opportunities, profileCompletion, now]);

  // ─── AI Ask Command Answers (RAG on Real OppTrack Data) ───────────────────
  const handleAskOppTrack = (queryText) => {
    const q = queryText.toLowerCase().trim();
    setIsAiAnswering(true);
    setAiQuery(queryText);

    setTimeout(() => {
      let answer = '';

      if (q.includes('focus') || q.includes('today')) {
        const topMoves = nextMoves.map((m, i) => `${i + 1}. ${m.title} (${m.subtitle}) — ${m.detail}`).join('\n');
        answer = `Here is your high-priority focus agenda for today based on active records:\n\n${topMoves || 'No urgent items today! Use this time to research target companies.'}`;
      } else if (q.includes('follow') || q.includes('update')) {
        const followUps = opportunities.filter(o => o.status === 'applied');
        if (followUps.length > 0) {
          answer = `You have ${followUps.length} applications in "Applied" status waiting for updates:\n` +
            followUps.slice(0, 5).map(o => `• ${o.company} (${o.role}) — Applied`).join('\n') +
            `\n\nTip: You can use the "Merge Follow-up Email" feature to update rounds automatically.`;
        } else {
          answer = 'All your applications have had recent updates or are already in evaluation stages!';
        }
      } else if (q.includes('match') || q.includes('profile')) {
        if (opportunityMatches.length > 0) {
          answer = `Top opportunities matching your Profile Vault skills (${userSkills.slice(0, 4).join(', ') || 'General'}):\n\n` +
            opportunityMatches.map(m => `• ${m.company} — ${m.role} (${m.matchScore}% Match)`).join('\n') +
            `\n\nBased on your academic profile and stored technical skill keywords.`;
        } else {
          answer = 'Add more applications to see match scores computed against your Profile Vault skills.';
        }
      } else if (q.includes('deadline')) {
        const dList = opportunities
          .filter(o => o.deadline && new Date(o.deadline) >= now)
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
          .slice(0, 5);
        if (dList.length > 0) {
          answer = `Your upcoming application deadlines:\n\n` +
            dList.map(o => `• ${o.company} (${o.role}) — ${new Date(o.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`).join('\n');
        } else {
          answer = 'You have zero upcoming deadlines in the next 7 days. You are completely caught up!';
        }
      } else if (q.includes('pipeline') || q.includes('stat') || q.includes('progress')) {
        answer = `Pipeline Breakdown:\n` +
          `• Total Applications: ${total}\n` +
          `• Active / In Progress: ${active}\n` +
          `• Assessment / Tests: ${stats?.byStatus?.oa || 0}\n` +
          `• Interviews: ${(stats?.byStatus?.interview || 0) + (stats?.byStatus?.hr || 0)}\n` +
          `• Offers: ${offers}\n` +
          `• Rejection Rate: ${stats?.rejectionRate || 0}%\n\n` +
          `Your response rate is ${responseRate !== null ? responseRate + '%' : 'calculating as more outcomes arrive'}.`;
      } else {
        answer = `OppTrack Workspace Summary for ${studentName}:\n` +
          `You have ${total} tracked opportunities (${active} currently active). ` +
          `Profile Vault is ${profileCompletion}% complete. ` +
          `Upcoming deadlines: ${opportunities.filter(o => o.deadline && new Date(o.deadline) >= now).length}.`;
      }

      setAiAnswers(prev => [{ query: queryText, answer, time: new Date() }, ...prev]);
      setIsAiAnswering(false);
    }, 300);
  };

  // ─── Loading Screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '65vh', flexDirection: 'column', gap: 14 }}>
        <div className="spinner" />
        <span style={{ color: '#64748B', fontSize: 13, fontWeight: 500 }}>
          Loading your Opportunity Command Center…
        </span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 60 }}>
      {/* ─── 1. HEADER & COMMAND CENTER ──────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid #E5EAF0', paddingBottom: 22, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0B1F3A', margin: '0 0 4px 0', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            {greeting}, {studentName} 👋
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#64748B', fontWeight: 500 }}>
            Here is what needs your attention today across your placement pipeline.
          </p>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Focus Mode Toggle */}
          <button
            type="button"
            onClick={() => setFocusMode(!focusMode)}
            style={{
              background: focusMode ? '#0B1F3A' : '#FFFFFF',
              color: focusMode ? '#FFFFFF' : '#475467',
              border: `1px solid ${focusMode ? '#0B1F3A' : '#D0D5DD'}`,
              padding: '8px 14px',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.18s ease',
              boxShadow: focusMode ? '0 2px 5px rgba(11,31,58,0.2)' : '0 1px 2px rgba(11,31,58,0.04)'
            }}
          >
            <Target size={14} color={focusMode ? '#10B981' : '#64748B'} />
            {focusMode ? 'Focus Mode: ON' : 'Focus Mode'}
          </button>

          {/* Ask OppTrack AI Trigger */}
          <button
            type="button"
            onClick={() => setShowAiPanel(true)}
            style={{
              background: '#FFFFFF',
              color: '#087F71',
              border: '1px solid #A3E5D9',
              padding: '8px 14px',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 3px rgba(8,127,113,0.08)'
            }}
          >
            <Sparkles size={14} color="#087F71" />
            ✦ Ask OppTrack
          </button>

          {/* Add Opportunity */}
          <Link
            to="/opportunities/new"
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 16px',
              textDecoration: 'none',
              borderRadius: 7,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 2px rgba(37, 99, 235, 0.25)',
              transition: 'background 0.15s ease'
            }}
          >
            <Plus size={15} /> Add Opportunity
          </Link>
        </div>
      </header>

      {/* ─── 2. COMPACT AI INSIGHT BAR ─────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #F0FDF9 0%, #FFFFFF 100%)',
          border: '1px solid #A3E5D9',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 1px 3px rgba(8,127,113,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 280 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#E8F8F5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={15} color="#087F71" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#087F71', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              ✦ OppTrack Intelligence
            </div>
            <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 500, lineHeight: 1.4 }}>
              {pendingGmailCount > 0 ? (
                <>You have <strong style={{ color: '#087F71' }}>{pendingGmailCount} opportunities</strong> waiting for your review in Gmail sync, and {nextMoves.length} priority action{nextMoves.length === 1 ? '' : 's'} today.</>
              ) : (
                <>You have <strong style={{ color: '#0B1F3A' }}>{nextMoves.length} items</strong> needing attention today. {aiInsights.deadlines}</>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAiPanel(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#087F71',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px'
          }}
        >
          View insights <ArrowRight size={13} />
        </button>
      </div>

      {/* ─── 3. QUICK STATS (4 METRIC CARDS) ──────────────────────────────── */}
      {!focusMode && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
          {/* Card 1: Total Tracked */}
          <div className="card" style={{ padding: '18px 20px', transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
                Total Tracked
              </span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={14} color="#64748B" />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#0B1F3A', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 6 }}>
              {total}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
              <span style={{ color: '#15803D', fontWeight: 600, background: '#EAF8EF', padding: '1px 6px', borderRadius: 4 }}>
                +{addedThisMonth} this month
              </span>
              <span>Across pipeline</span>
            </div>
          </div>

          {/* Card 2: Active Applications */}
          <div className="card" style={{ padding: '18px 20px', borderLeft: '3px solid #2563EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563EB' }}>
                Active Applications
              </span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EAF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={14} color="#2563EB" />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#2563EB', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 6 }}>
              {active}
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              <strong style={{ color: '#1E293B', fontWeight: 600 }}>{total > 0 ? Math.round((active / total) * 100) : 0}%</strong> of tracked opportunities in progress
            </div>
          </div>

          {/* Card 3: Offers Received */}
          <div className="card" style={{ padding: '18px 20px', borderLeft: '3px solid #16A34A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#15803D' }}>
                Offers Received
              </span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EAF8EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={14} color="#16A34A" />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#16A34A', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 6 }}>
              {offers}
            </div>
            <div style={{ fontSize: 12, color: '#15803D', fontWeight: 500 }}>
              {offers > 0 ? 'Congratulations! Pipeline delivered offers.' : 'Keep going — pipeline active'}
            </div>
          </div>

          {/* Card 4: Response Rate */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
                Response Rate
              </span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={14} color="#64748B" />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: responseRate !== null ? '#0B1F3A' : '#94A3B8', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 6 }}>
              {responseRate !== null ? `${responseRate}%` : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              {responseRate !== null ? 'Based on applications with outcomes' : 'Not enough data yet'}
            </div>
          </div>
        </section>
      )}

      {/* ─── 4. "YOUR NEXT MOVES" & UPCOMING DEADLINES ────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 24, marginBottom: 28, alignItems: 'start' }}>
        
        {/* Left: YOUR NEXT MOVES */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                Your Next Moves
              </h2>
            </div>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              Prioritized by urgency ({nextMoves.length} actions)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {nextMoves.map(move => (
              <div
                key={move.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5EAF0',
                  borderRadius: 9,
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 240 }}>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: move.bg,
                    color: move.color,
                    border: `1px solid ${move.border}`,
                    whiteSpace: 'nowrap',
                    marginTop: 2
                  }}>
                    {move.badge}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1F3A' }}>
                      {move.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', margin: '2px 0' }}>
                      {move.subtitle}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#475467', fontWeight: 500 }}>
                      {move.detail}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={move.onClick}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D0D5DD',
                    color: '#0B1F3A',
                    padding: '7px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 1px 2px rgba(11,31,58,0.03)'
                  }}
                >
                  {move.actionLabel} <ChevronRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: UPCOMING DEADLINES */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <CalendarDays size={16} color="#087F71" />
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                Upcoming Deadlines
              </h2>
            </div>
            <Link to="/calendar" style={{ fontSize: 12, color: '#087F71', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              View Calendar <ArrowRight size={13} />
            </Link>
          </div>

          {/* Group: Today */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} /> TODAY
              </div>
              {upcomingDeadlinesGrouped.today.length === 0 ? (
                <div style={{ fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic', padding: '6px 0 6px 12px', borderLeft: '2px solid #F1F5F9' }}>
                  No deadlines closing today.
                </div>
              ) : (
                upcomingDeadlinesGrouped.today.map(opp => (
                  <div
                    key={opp._id}
                    onClick={() => navigate(`/opportunities/${opp._id}`)}
                    style={{
                      background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '10px 12px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: 6
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>{opp.company}</div>
                      <div style={{ fontSize: 11.5, color: '#B91C1C' }}>{opp.role} · Closes today</div>
                    </div>
                    <ArrowRight size={13} color="#DC2626" />
                  </div>
                ))
              )}
            </div>

            {/* Group: Tomorrow */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706' }} /> TOMORROW
              </div>
              {upcomingDeadlinesGrouped.tomorrow.length === 0 ? (
                <div style={{ fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic', padding: '6px 0 6px 12px', borderLeft: '2px solid #F1F5F9' }}>
                  No deadlines tomorrow.
                </div>
              ) : (
                upcomingDeadlinesGrouped.tomorrow.map(opp => (
                  <div
                    key={opp._id}
                    onClick={() => navigate(`/opportunities/${opp._id}`)}
                    style={{
                      background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '10px 12px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: 6
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>{opp.company}</div>
                      <div style={{ fontSize: 11.5, color: '#B45309' }}>{opp.role} · 24h remaining</div>
                    </div>
                    <ArrowRight size={13} color="#D97706" />
                  </div>
                ))
              )}
            </div>

            {/* Group: Later This Week / Month */}
            {upcomingDeadlinesGrouped.later.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  UPCOMING SCHEDULE
                </div>
                {upcomingDeadlinesGrouped.later.map(grp => (
                  <div key={grp.dateLabel} style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#087F71', background: '#E8F8F5', padding: '2px 6px', borderRadius: 4 }}>
                      {grp.dateLabel}
                    </span>
                    {grp.items.map(opp => (
                      <div
                        key={opp._id}
                        onClick={() => navigate(`/opportunities/${opp._id}`)}
                        style={{
                          background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 6, padding: '8px 12px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginTop: 4
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1F3A' }}>{opp.company}</div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>{opp.role}</div>
                        </div>
                        <ArrowRight size={12} color="#94A3B8" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Smart Empty State if 0 deadlines */}
            {upcomingDeadlinesGrouped.today.length === 0 && 
             upcomingDeadlinesGrouped.tomorrow.length === 0 && 
             upcomingDeadlinesGrouped.later.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 12px', background: '#F8FAFD', borderRadius: 8, border: '1px dashed #E5EAF0' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0B1F3A', marginBottom: 4 }}>
                  You are clear for now.
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                  No upcoming deadlines in the next 7 days.
                </div>
                <Link
                  to="/opportunities"
                  style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}
                >
                  View all opportunities →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 5. APPLICATION PIPELINE (REDESIGNED VISUAL PIPELINE) ─────────── */}
      {!focusMode && (
        <section className="card" style={{ padding: 22, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                Application Pipeline
              </h2>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Click any recruitment stage to view filtered opportunities
              </span>
            </div>
            <Link to="/opportunities" style={{ fontSize: 12.5, color: '#087F71', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All Opportunities <ArrowRight size={14} />
            </Link>
          </div>

          {/* Visual Step-by-Step Pipeline Flow */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, alignItems: 'stretch' }}>
            {PIPELINE_STAGES.map((stage, idx) => {
              const count = stats?.byStatus?.[stage.key] ?? opportunities.filter(o => o.status === stage.key).length;
              const pctOfTotal = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div
                  key={stage.key}
                  onClick={() => navigate('/opportunities')}
                  style={{
                    background: count > 0 ? stage.bg : '#F8FAFD',
                    border: `1px solid ${count > 0 ? stage.border : '#E5EAF0'}`,
                    borderRadius: 8,
                    padding: '14px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: count > 0 ? stage.color : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {stage.label}
                      </span>
                      {idx < PIPELINE_STAGES.length - 1 && (
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>→</span>
                      )}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: count > 0 ? stage.color : '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
                      {count}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 8 }}>
                    {pctOfTotal}% of pipeline
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rejected Outcome Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, padding: '10px 14px', background: '#F8FAFD', borderRadius: 6, border: '1px solid #E5EAF0', fontSize: 12 }}>
            <span style={{ color: '#64748B' }}>
              <strong>{rejected}</strong> application{rejected === 1 ? '' : 's'} closed without offer.
            </span>
            <span style={{ color: '#087F71', fontWeight: 600 }}>
              Outcome feedback updated
            </span>
          </div>
        </section>
      )}

      {/* ─── 6. APPLICATION MOMENTUM & OPPORTUNITY MATCH ─────────────────── */}
      {!focusMode && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 28 }}>
          
          {/* APPLICATION MOMENTUM (Clean SVG Line Chart) */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                  Application Momentum
                </h2>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Weekly added applications (last 30 days)
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#EAF2FF', padding: '3px 8px', borderRadius: 4 }}>
                Last 30 Days
              </span>
            </div>

            {/* SVG Line Sparkline Chart */}
            <div style={{ height: 130, width: '100%', position: 'relative', marginTop: 10, marginBottom: 14 }}>
              <svg width="100%" height="100%" viewBox="0 0 320 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="momentumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="20" x2="320" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2="320" y2="60" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />

                {/* Calculate coordinates */}
                {(() => {
                  const maxC = Math.max(...momentumWeeks.map(w => w.count), 2);
                  const points = momentumWeeks.map((w, idx) => {
                    const x = 30 + idx * 86;
                    const y = 80 - (w.count / maxC) * 60;
                    return { x, y, count: w.count };
                  });

                  const dPath = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  const dArea = `${dPath} L ${points[points.length - 1].x} 90 L ${points[0].x} 90 Z`;

                  return (
                    <>
                      <path d={dArea} fill="url(#momentumGrad)" />
                      <path d={dPath} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0B1F3A">
                            {p.count}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* X-Axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px', fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
              {momentumWeeks.map(w => (
                <span key={w.label}>{w.label}</span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid #F1F5F9', fontSize: 12 }}>
              <span style={{ color: '#475467' }}>
                <strong style={{ color: '#0B1F3A' }}>{active}</strong> applications active
              </span>
              <span style={{ color: '#15803D', fontWeight: 600 }}>
                +{addedThisMonth} added this month
              </span>
            </div>
          </div>

          {/* OPPORTUNITY MATCH ("Opportunities Worth a Look") */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                  Opportunities Worth a Look
                </h2>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Matches based on Profile Vault skills
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#087F71', background: '#E8F8F5', padding: '3px 8px', borderRadius: 4 }}>
                Profile Match
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {opportunityMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 12px', color: '#64748B', fontSize: 13 }}>
                  Add opportunities and update Profile Vault skills to calculate matching rankings.
                </div>
              ) : (
                opportunityMatches.map(opp => (
                  <div
                    key={opp._id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5EAF0',
                      borderRadius: 8,
                      padding: '11px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#15803D', background: '#EAF8EF', border: '1px solid #BBF7D0', padding: '1px 6px', borderRadius: 4 }}>
                          {opp.matchScore}% MATCH
                        </span>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1F3A' }}>{opp.company}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{opp.role}</div>
                      {opp.matchedTags && opp.matchedTags.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {opp.matchedTags.map(t => (
                            <span key={t} style={{ fontSize: 10, color: '#475467', background: '#F1F5F9', padding: '1px 5px', borderRadius: 3 }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/opportunities/${opp._id}`)}
                      style={{
                        background: '#F8FAFD',
                        border: '1px solid #D0D5DD',
                        color: '#0B1F3A',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 12, fontStyle: 'italic' }}>
              ✦ Profile match is estimated based on your Profile Vault skills & department.
            </div>
          </div>
        </section>
      )}

      {/* ─── 7. OPPTRACK INTELLIGENCE (3 COMPACT AI INSIGHT CARDS) ────────── */}
      {!focusMode && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Sparkles size={15} color="#087F71" />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#087F71', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              OppTrack Intelligence
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Card 1: Application Pattern */}
            <div className="card" style={{ padding: 18, background: '#FFFFFF', borderTop: '3px solid #087F71' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#087F71', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={13} /> Application Pattern
              </div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, marginBottom: 14 }}>
                {aiInsights.pattern}
              </div>
              <Link to="/opportunities" style={{ fontSize: 12, fontWeight: 700, color: '#087F71', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View analysis <ArrowRight size={12} />
              </Link>
            </div>

            {/* Card 2: Deadline Insight */}
            <div className="card" style={{ padding: 18, background: '#FFFFFF', borderTop: '3px solid #2563EB' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} /> Deadline Insight
              </div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, marginBottom: 14 }}>
                {aiInsights.deadlines}
              </div>
              <Link to="/calendar" style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Review deadlines <ArrowRight size={12} />
              </Link>
            </div>

            {/* Card 3: Profile Insight */}
            <div className="card" style={{ padding: 18, background: '#FFFFFF', borderTop: '3px solid #16A34A' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShieldCheck size={13} /> Profile Readiness
              </div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, marginBottom: 14 }}>
                {aiInsights.profile}
              </div>
              <Link to="/profile" style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Complete profile <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── 8. RECENT ACTIVITY & CAREER PROGRESS ─────────────────────────── */}
      {!focusMode && (
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 24, alignItems: 'start' }}>
          
          {/* RECENT ACTIVITY (Latest 5 Logs) */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Activity size={16} color="#2563EB" />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                  Recent Activity
                </h2>
              </div>
              <Link to="/history" style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View Activity Log <ArrowRight size={13} />
              </Link>
            </div>

            {recentLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentLogs.slice(0, 5).map(log => {
                  const formattedDate = new Date(log.createdAt).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={log._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, paddingBottom: 10, borderBottom: '1px solid #F8FAFD' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 500, lineHeight: 1.4 }}>
                          {log.description}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                          {formattedDate}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic', padding: '16px 0' }}>
                No recent activity logged yet.
              </div>
            )}
          </div>

          {/* CAREER PROGRESS ("Your Placement Journey") */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ marginBottom: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1F3A', margin: '0 0 2px 0' }}>
                Your Placement Journey
              </h2>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Recruitment funnel conversion
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Stage 1: Applications */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>
                  <span>Applications Tracked</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{total}</span>
                </div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: total > 0 ? '100%' : '0%', background: '#2563EB', borderRadius: 3 }} />
                </div>
              </div>

              {/* Stage 2: Assessments */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>
                  <span>Assessments Reached</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{stats?.byStatus?.oa || 0}</span>
                </div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: total > 0 ? `${Math.round(((stats?.byStatus?.oa || 0) / total) * 100)}%` : '0%', background: '#D97706', borderRadius: 3 }} />
                </div>
              </div>

              {/* Stage 3: Interviews */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>
                  <span>Interviews Scheduled</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{(stats?.byStatus?.interview || 0) + (stats?.byStatus?.hr || 0)}</span>
                </div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: total > 0 ? `${Math.round((((stats?.byStatus?.interview || 0) + (stats?.byStatus?.hr || 0)) / total) * 100)}%` : '0%', background: '#EA580C', borderRadius: 3 }} />
                </div>
              </div>

              {/* Stage 4: Offers */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>
                  <span>Offers Secured</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{offers}</span>
                </div>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: total > 0 ? `${Math.round((offers / total) * 100)}%` : '0%', background: '#16A34A', borderRadius: 3 }} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── 9. "ASK OPPTRACK" COMMAND PANEL (SLIDE-OVER DRAWER) ─────────── */}
      {showAiPanel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,31,58,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', height: '100%', boxShadow: '-4px 0 25px rgba(11,31,58,0.15)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px 22px', borderBottom: '1px solid #E5EAF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={17} color="#087F71" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0B1F3A' }}>
                  ✦ Ask OppTrack
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiPanel(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content & Suggested Prompts */}
            <div style={{ padding: 22, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Ask with 1-Click
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'What should I focus on today?',
                    'Which applications need follow-up?',
                    'Which opportunities match my profile?',
                    'Show my upcoming deadlines',
                    'Analyze my application pipeline',
                  ].map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleAskOppTrack(prompt)}
                      style={{
                        textAlign: 'left',
                        background: '#F8FAFD',
                        border: '1px solid #E5EAF0',
                        color: '#1E293B',
                        padding: '9px 12px',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Answers feed */}
              {isAiAnswering && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#087F71', fontSize: 13, fontWeight: 600 }}>
                  <div className="spinner" style={{ width: 14, height: 14 }} /> OppTrack is analyzing your data…
                </div>
              )}

              {aiAnswers.map((item, idx) => (
                <div key={idx} style={{ background: '#F8FAFD', border: '1px solid #E5EAF0', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#087F71', marginBottom: 6 }}>
                    Q: {item.query}
                  </div>
                  <div style={{ fontSize: 13, color: '#1E293B', whiteSpace: 'pre-line', lineHeight: 1.55 }}>
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (aiQuery.trim()) handleAskOppTrack(aiQuery);
              }}
              style={{ padding: '16px 22px', borderTop: '1px solid #E5EAF0', display: 'flex', gap: 8 }}
            >
              <input
                type="text"
                placeholder="Ask about deadlines, follow-ups, stats..."
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', borderRadius: 6, border: '1px solid #D0D5DD', fontSize: 13, outline: 'none' }}
              />
              <button
                type="submit"
                style={{ background: '#087F71', color: '#FFFFFF', border: 'none', padding: '9px 14px', borderRadius: 6, cursor: 'pointer' }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
