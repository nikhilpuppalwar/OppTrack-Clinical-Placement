import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, Calendar, User, Clock, ArrowRight, X } from 'lucide-react';
import { opportunityAPI, profileAPI } from '../api';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch quick searchable data when opened
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
      return;
    }

    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      opportunityAPI.list().catch(() => null),
      profileAPI.get().catch(() => null),
    ]).then(([oppsRes, profRes]) => {
      if (!isMounted) return;
      if (oppsRes.status === 'fulfilled' && oppsRes.value?.data) {
        const raw = oppsRes.value.data;
        const list = Array.isArray(raw) ? raw : (raw?.opportunities || []);
        setOpportunities(list);
      }
      if (profRes.status === 'fulfilled' && profRes.value?.data) {
        const p = profRes.value.data;
        setSkills(p?.skills || []);
      }
      setLoading(false);
    });

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Filter items based on query
  const filteredResults = [];

  // Default Quick Navigation Destinations
  const navShortcuts = [
    { type: 'nav', title: 'Dashboard Overview', subtitle: 'View high-level KPIs and upcoming drives', path: '/', icon: Briefcase },
    { type: 'nav', title: 'Opportunities Pipeline', subtitle: 'Track student placement applications', path: '/opportunities', icon: Briefcase },
    { type: 'nav', title: 'Schedule Calendar', subtitle: 'View interview dates & exam deadlines', path: '/calendar', icon: Calendar },
    { type: 'nav', title: 'Profile Vault', subtitle: 'Update GPA, academic scores, skills & resume', path: '/profile', icon: User },
    { type: 'nav', title: 'Google Testers Program', subtitle: 'Request or approve Gmail tester slots', path: '/google-tester', icon: User },
  ];

  if (!query.trim()) {
    filteredResults.push(...navShortcuts);
  } else {
    const q = query.toLowerCase();

    // 1. Matches in Opportunities (Company, Role, Location)
    opportunities.forEach((opp) => {
      if (
        opp.company?.toLowerCase().includes(q) ||
        opp.role?.toLowerCase().includes(q) ||
        opp.location?.toLowerCase().includes(q)
      ) {
        filteredResults.push({
          type: 'opportunity',
          title: `${opp.company} — ${opp.role}`,
          subtitle: `Stage: ${opp.stage || 'Applied'} • ${opp.location || 'Remote'}`,
          path: `/opportunities/${opp._id}`,
          icon: Briefcase,
        });
      }
    });

    // 2. Matches in Skills
    skills.forEach((skill) => {
      if (skill.toLowerCase().includes(q)) {
        filteredResults.push({
          type: 'skill',
          title: `Skill: ${skill}`,
          subtitle: 'Profile Vault • Matching credential',
          path: '/profile',
          icon: User,
        });
      }
    });

    // 3. Navigation matches
    navShortcuts.forEach((item) => {
      if (item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)) {
        filteredResults.push(item);
      }
    });
  }

  // Keyboard navigation (Up, Down, Enter, Esc)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filteredResults.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredResults[selectedIndex];
        if (selected) {
          navigate(selected.path);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredResults, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="modal-backdrop-motion"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 17, 32, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-card-motion"
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--surface)',
          borderRadius: 22,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Search size={20} color="var(--vessa-plum)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search opportunities, companies, deadlines, skills... (↑/↓ to navigate)"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <X size={16} />
            </button>
          )}
          <span className="vessa-kbd">ESC</span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '10px 8px' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading searchable records...
            </div>
          ) : filteredResults.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
              No matching companies, opportunities, or skills found for "{query}".
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const Icon = item.icon || Briefcase;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: isSelected ? 'var(--card-subtle)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                    marginBottom: 2,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: isSelected ? 'var(--vessa-plum)' : 'var(--card-subtle)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 120ms ease',
                      }}
                    >
                      <Icon size={17} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    color={isSelected ? 'var(--vessa-plum)' : 'var(--border)'}
                    style={{
                      transform: isSelected ? 'translateX(2px)' : 'none',
                      transition: 'transform 120ms ease',
                    }}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: '10px 18px',
            background: 'var(--card-subtle)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11.5,
            color: 'var(--text-muted)',
          }}
        >
          <span>Use <strong style={{ color: 'var(--text-primary)' }}>↑ / ↓</strong> to navigate, <strong style={{ color: 'var(--text-primary)' }}>ENTER</strong> to select</span>
          <span>OppTrack Global Command</span>
        </div>
      </div>
    </div>
  );
}
