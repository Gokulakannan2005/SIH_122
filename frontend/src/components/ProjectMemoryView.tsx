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
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { deriveProjectMemory, queryProjectMemory } from '../utils/projectMemoryData';

export const ProjectMemoryView: React.FC = () => {
  const { currentProject, enrichedSchedule, siteUpdates, plannerDecisions } = useProject();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'variance' | 'bottleneck' | 'productivity' | 'lessons'>('all');

  // Safely derive memory patterns from active project data
  const memoryPatterns = useMemo(() => {
    return deriveProjectMemory(siteUpdates || [], enrichedSchedule || [], plannerDecisions || {});
  }, [siteUpdates, enrichedSchedule, plannerDecisions]);

  // Safely execute deterministic semantic query
  const queryAnswer = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return queryProjectMemory(searchQuery, siteUpdates || [], enrichedSchedule || [], memoryPatterns);
  }, [searchQuery, siteUpdates, enrichedSchedule, memoryPatterns]);

  // Sample quick queries
  const sampleQueries = [
    'Why is cooling water piping delayed?',
    'What is the actual productivity rate in Pump Bay?',
    'Primary recurring bottleneck in execution',
    'Surfacing potential out-of-baseline drain line',
  ];

  // Filter patterns
  const filteredPatterns = useMemo(() => {
    if (activeCategory === 'all') return memoryPatterns;
    if (activeCategory === 'variance') return memoryPatterns.filter(p => p.category === 'duration_variance');
    if (activeCategory === 'bottleneck') return memoryPatterns.filter(p => p.category === 'bottleneck');
    if (activeCategory === 'productivity') return memoryPatterns.filter(p => p.category === 'productivity');
    return memoryPatterns;
  }, [memoryPatterns, activeCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* 1. Executive Header */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderLeft: '4px solid var(--brand-primary)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="brand-badge" style={{ fontSize: '0.675rem' }}>
              INSTITUTIONAL KNOWLEDGE REPOSITORY
            </span>
            <span className="mono-pill" style={{ fontSize: '0.68rem' }}>
              {currentProject?.shortCode || currentProject?.code || 'IOCL-PR-01'} Multi-Unit Memory
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Project Memory & Historical Execution Intelligence
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Empirical learning synthesized from past petrochemical turnarounds, actual contractor velocities, and verified L5/L6 variance patterns.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Indexed Historical Norms
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
              142,890 Data Points
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Project Site
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentProject?.name || 'Active Project Site'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Semantic Search Bar */}
      <div
        className="card"
        style={{
          padding: '0.9rem 1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: 'var(--brand-primary)' }} />
          <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Ask DATUM Project Memory (Empirical Knowledge Query)
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
              placeholder="Ask anything (e.g. 'Why is cooling water piping delayed?', 'What is the actual productivity in Pump Bay?')..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 36, fontSize: '0.825rem', height: 38 }}
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchQuery('')}
              style={{ padding: '0 12px' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Sample Queries */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Suggested Queries:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="mono-pill"
              onClick={() => setSearchQuery(q)}
              style={{
                cursor: 'pointer',
                background: searchQuery === q ? 'var(--brand-surface)' : 'var(--bg-surface-secondary)',
                color: searchQuery === q ? 'var(--brand-primary)' : 'inherit',
                fontSize: '0.68rem',
                border: '1px solid var(--border-subtle)',
                padding: '2px 8px',
              }}
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* 3. Query Results Card (if Search Query is active) */}
      {searchQuery.trim() && queryAnswer && (
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--bg-surface)',
            borderLeft: '4px solid var(--brand-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: 'var(--brand-primary)' }} />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Knowledge Search Response
              </h4>
              <span className="mono-pill" style={{ fontSize: '0.65rem' }}>
                Discipline: {queryAnswer.matchedDiscipline}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Analyzed <strong>{queryAnswer.recordsAnalyzed}</strong> active site records & <strong>{memoryPatterns.length}</strong> historical patterns
            </span>
          </div>

          <div
            style={{
              padding: '0.75rem 0.95rem',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              fontWeight: 500,
            }}
          >
            {queryAnswer.answer}
          </div>

          {queryAnswer.evidencePoints && queryAnswer.evidencePoints.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Corroborating Historical Evidence & Provenance:
              </div>
              {queryAnswer.evidencePoints.map((ep, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={13} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>{ep}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Category Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div className="filter-pill-group">
          <button
            type="button"
            className={`filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
            style={{ fontSize: '0.725rem' }}
          >
            All Institutional Patterns ({memoryPatterns.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeCategory === 'variance' ? 'active' : ''}`}
            onClick={() => setActiveCategory('variance')}
            style={{ fontSize: '0.725rem' }}
          >
            Duration Variances
          </button>
          <button
            type="button"
            className={`filter-pill ${activeCategory === 'bottleneck' ? 'active' : ''}`}
            onClick={() => setActiveCategory('bottleneck')}
            style={{ fontSize: '0.725rem' }}
          >
            Bottlenecks
          </button>
          <button
            type="button"
            className={`filter-pill ${activeCategory === 'productivity' ? 'active' : ''}`}
            onClick={() => setActiveCategory('productivity')}
            style={{ fontSize: '0.725rem' }}
          >
            Productivity Norms
          </button>
        </div>

        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Showing {filteredPatterns.length} empirical execution patterns
        </span>
      </div>

      {/* 5. Derived Project Memory Patterns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
        {filteredPatterns.map(pattern => (
          <div
            key={pattern.id}
            className="card"
            style={{
              padding: '0.95rem 1.15rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              borderLeft: `4px solid ${
                pattern.category === 'duration_variance'
                  ? '#ef4444'
                  : pattern.category === 'bottleneck'
                  ? '#f59e0b'
                  : pattern.category === 'productivity'
                  ? '#3b82f6'
                  : '#10b981'
              }`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.75rem', color: 'var(--brand-primary)' }}>
                  {pattern.id}
                </span>
                <span className="mono-pill" style={{ fontSize: '0.625rem' }}>
                  {pattern.discipline}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                }}
              >
                {pattern.confidenceScore}% Confidence
              </span>
            </div>

            <div>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {pattern.activityName}
              </h4>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Area: {pattern.area} &bull; Recorded across {pattern.occurrences} field reports
              </div>
            </div>

            {/* Metrics Comparison */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                background: 'var(--bg-surface-secondary)',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.725rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Planned Baseline:</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pattern.plannedMetric}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Observed Actual:</div>
                <div style={{ fontWeight: 700, color: '#ef4444' }}>{pattern.observedMetric}</div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {pattern.varianceNote}
            </p>

            <div
              style={{
                marginTop: 'auto',
                padding: '0.45rem 0.65rem',
                borderRadius: 4,
                background: 'rgba(5, 150, 105, 0.08)',
                border: '1px solid rgba(5, 150, 105, 0.2)',
                fontSize: '0.72rem',
                color: '#059669',
                lineHeight: 1.35,
              }}
            >
              <strong>Future Baseline Recommendation:</strong> {pattern.recommendation}
            </div>
          </div>
        ))}
      </div>

      {/* 6. Execution Benchmarks & Lessons Learned Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
        {/* Contractor Velocity Benchmarks */}
        <div className="card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
            <Building2 size={16} style={{ color: 'var(--brand-primary)' }} />
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Contractor Execution Velocity
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-surface-secondary)', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>L&T Heavy Civil (Unit-05 Foundations)</span>
                <span style={{ color: '#059669' }}>108% Planned Rate</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Average excavation: 420 m³/day vs baseline 380 m³/day. Zero rework logged.
              </div>
            </div>

            <div style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-surface-secondary)', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>Punj Lloyd Piping Spool Erection</span>
                <span style={{ color: '#d97706' }}>82% Planned Rate</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Crane mobilization bottlenecks in Pump Bay corridor causing 1.8-day spool positioning delays.
              </div>
            </div>

            <div style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-surface-secondary)', borderRadius: 6 }}>
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

        {/* Identified Delay Hotspots */}
        <div className="card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
            <AlertTriangle size={16} style={{ color: '#e11d48' }} />
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Identified Delay Hotspots
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ padding: '0.55rem 0.75rem', background: 'rgba(225, 29, 72, 0.05)', borderRadius: 6, borderLeft: '3px solid #e11d48' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Hydrotest Permit Turnaround
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Historically, third-party NDT X-ray signoffs take 3.2 days vs 1.0 day baseline assumption. Recommend initiating blind list 48h prior.
              </div>
            </div>

            <div style={{ padding: '0.55rem 0.75rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Field Tie-In Flange Mismatch
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                18% of small-bore tie-ins encounter missing RTJ gaskets on battery limit connections. Pre-stage gasket kits before permit issue.
              </div>
            </div>
          </div>
        </div>

        {/* Corporate Lessons Learned Playbook */}
        <div className="card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
            <BookOpen size={16} style={{ color: '#059669' }} />
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Corporate Lessons Learned
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-surface-secondary)', borderRadius: 6 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Tank Foundation Ring Wall Curing Protocol
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Mathura lesson: Accelerating ring wall formwork stripping resulted in micro-cracks. Enforce mandatory 7-day wet burlap curing.
              </div>
            </div>

            <div style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-surface-secondary)', borderRadius: 6 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Out-of-Baseline Scope Containment
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                DATUM flagged small-bore bypasses early, preventing ₹42 Lakhs in unapproved commercial contractor claims.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
