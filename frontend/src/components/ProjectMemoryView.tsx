import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Sparkles,
  Search,
  TrendingUp,
  AlertTriangle,
  History,
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
  ChevronRight,
  Database,
  Layers,
  BookOpen,
  FileCheck,
} from 'lucide-react';
import { deriveProjectMemory, queryProjectMemory } from '../utils/projectMemoryData';

export const ProjectMemoryView: React.FC = () => {
  const { currentProject, enrichedSchedule, siteUpdates } = useProject();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'contractors' | 'delays' | 'productivity' | 'lessons'>('all');

  const memoryData = useMemo(() => {
    return deriveProjectMemory(enrichedSchedule, siteUpdates);
  }, [enrichedSchedule, siteUpdates]);

  const queryResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return queryProjectMemory(searchQuery, memoryData);
  }, [searchQuery, memoryData]);

  // Sample quick queries
  const sampleQueries = [
    'Why is cooling water piping delayed?',
    'L&T vs Punj Lloyd contractor velocity',
    'Hydrotest permit turnaround time',
    'Substation switchgear termination bottlenecks',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* 1. Executive Header */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(124, 58, 237, 0.05))',
          borderBottom: '2px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="brand-badge" style={{ fontSize: '0.675rem' }}>
              INSTITUTIONAL KNOWLEDGE BASE
            </span>
            <span className="mono-pill" style={{ fontSize: '0.7rem' }}>
              IOCL Multi-Project Enterprise Brain
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Project Memory & Execution Intelligence
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Cross-project learning from 34 past petrochemical revamps, contractor velocity curves, and recurring critical path delay risks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Indexed Historical Records
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
              142,890 Data Points
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Semantic Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.15rem 1.35rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} style={{ color: 'var(--brand-primary)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Ask DATUM Project Memory
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Ask anything (e.g. 'Why does 24-CW-017 risk delay?', 'Contractor welding velocity in monsoon')..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 36, fontSize: '0.85rem' }}
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchQuery('')}
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Sample Queries */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try queries:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="mono-pill"
              onClick={() => setSearchQuery(q)}
              style={{
                cursor: 'pointer',
                background: 'var(--bg-surface-secondary)',
                fontSize: '0.7rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* 3. Query Results if Search is active */}
      {searchQuery.trim() && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Knowledge Search Results for "{searchQuery}" ({queryResults.length})
          </h4>
          {queryResults.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No direct matches found. Try keywords like "piping", "contractor", "welding", or "delay".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {queryResults.map((res, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 6,
                    background: 'var(--bg-surface-secondary)',
                    borderLeft: '4px solid var(--brand-primary)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {res.category.toUpperCase()} • Confidence {Math.round(res.relevanceScore * 100)}%
                    </span>
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                      Source: {res.sourceProject}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {res.title}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                    {res.insight}
                  </p>
                  {res.mitigation && (
                    <div style={{ marginTop: 6, fontSize: '0.725rem', color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: 4 }}>
                      <strong>Recommended Action:</strong> {res.mitigation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Core Memory Pillars Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Pillar 1: Contractor Velocity Benchmarks */}
        <div className="card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.85rem' }}>
            <Building2 size={16} style={{ color: 'var(--brand-primary)' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Contractor Execution Velocity
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-surface-secondary)', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>L&T Heavy Civil (Unit-05 Foundations)</span>
                <span style={{ color: '#059669' }}>108% Planned Rate</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Average excavation: 420 m³/day vs baseline 380 m³/day. Zero rework logged.
              </div>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-surface-secondary)', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>Punj Lloyd Piping Spool Erection</span>
                <span style={{ color: '#d97706' }}>82% Planned Rate</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Crane mobilization bottlenecks in Pump Bay corridor causing 1.8-day spool positioning delays.
              </div>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-surface-secondary)', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>BHEL Electrical & Substation-03</span>
                <span style={{ color: '#059669' }}>97% Planned Rate</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                415V switchgear cable terminations on track; high productivity in dry weather.
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Recurring Delay Patterns */}
        <div className="card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.85rem' }}>
            <AlertTriangle size={16} style={{ color: '#e11d48' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Identified Delay Hotspots
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(225, 29, 72, 0.05)', borderRadius: 6, borderLeft: '3px solid #e11d48' }}>
              <div style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Hydrotest Permit Turnaround
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Historically, third-party NDT X-ray signoffs take 3.2 days vs 1.0 day baseline assumption. Recommend initiating blind list 48h prior.
              </div>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Field Tie-In Flange Mismatch
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                18% of small-bore tie-ins encounter missing RTJ gaskets on battery limit connections. Pre-stage gasket kits before permit issue.
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Automated Lessons Learned Playbook */}
        <div className="card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.85rem' }}>
            <BookOpen size={16} style={{ color: '#059669' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Corporate Lessons Learned
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-surface-secondary)', borderRadius: 6 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Tank Foundation Ring Wall Curing Protocol
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Mathura 2022 lesson: Accelerating ring wall formwork stripping resulted in micro-cracks. Enforce mandatory 7-day wet burlap curing.
              </div>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-surface-secondary)', borderRadius: 6 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Out-of-Baseline Scope Containment
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                DATUM flagged 14 small-bore bypasses in Q2. Early detection prevented ₹42 Lakhs in unapproved commercial contractor claims.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
