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
  BarChart3,
  Calendar,
  Check,
  ExternalLink,
  Flame,
  Info,
} from 'lucide-react';
import {
  deriveProjectMemory,
  queryProjectMemory,
  CROSS_PROJECT_DELAY_PATTERNS,
  INSTITUTIONAL_PROJECTS_MEMORY,
} from '../utils/projectMemoryData';

export const ProjectMemoryView: React.FC = () => {
  const { currentProject, enrichedSchedule, siteUpdates, plannerDecisions, switchProject } = useProject();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'variance' | 'bottleneck' | 'productivity' | 'lessons'>('all');
  const [projectMemoryFilter, setProjectMemoryFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedDelayCategory, setSelectedDelayCategory] = useState<string | null>(null);
  const [selectedProjectCard, setSelectedProjectCard] = useState<string | null>(null);


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

      {/* 2. OVERALL GRAPH: Cross-Project Execution Intelligence & Recurring Delays */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          borderTop: '3px solid var(--brand-primary)',
          background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-subtle) 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <TrendingUp size={16} style={{ color: 'var(--brand-primary)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Overall Cross-Project Delay Intelligence
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Recurring Schedule Bottlenecks Across Capital Projects
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 760 }}>
              When projects build up over time, institutional memory aggregates historical field telemetry to expose systematic delay patterns. <strong>Knowledge does not disappear when a project finishes</strong>—it directly calibrates future baseline buffers and contractor float.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-surface-secondary)', padding: '0.45rem 0.85rem', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>PORTFOLIO DELAYS MAPPED</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f43f5e' }}>161 Days</div>
            </div>
            <div style={{ height: 24, width: 1, background: 'var(--border-subtle)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>COMMERCIAL CLAIMS SAVED</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>₹9.84 Cr</div>
            </div>
          </div>
        </div>

        {/* Dual Visualizer: Delay Root Cause Bar Graph + Historical Learning Curve */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 1fr)', gap: '1.25rem', marginTop: 4 }}>
          {/* Left: Interactive Delay Root Causes Bar Graph */}
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Cumulative Delay Impact by Root Cause (All 7 Projects)
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Click bar to inspect root cause
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              {CROSS_PROJECT_DELAY_PATTERNS.map(pattern => {
                const maxDays = 50;
                const pct = Math.round((pattern.totalDelayDaysAcrossProjects / maxDays) * 100);
                const isSelected = selectedDelayCategory === pattern.id;

                return (
                  <div
                    key={pattern.id}
                    onClick={() => setSelectedDelayCategory(isSelected ? null : pattern.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '0.5rem 0.65rem',
                      borderRadius: 6,
                      background: isSelected ? 'rgba(14, 165, 233, 0.08)' : 'var(--bg-surface-secondary)',
                      border: isSelected ? '1px solid var(--brand-primary)' : '1px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {pattern.category}
                        </span>
                        <span className="mono-pill" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                          {pattern.discipline}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f43f5e' }}>
                        {pattern.totalDelayDaysAcrossProjects} Days
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div style={{ width: '100%', height: 6, background: 'var(--bg-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: pattern.discipline === 'Piping' ? '#f43f5e' : pattern.discipline === 'Civil' ? '#f59e0b' : '#38bdf8',
                          borderRadius: 999,
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      <span>Impacted: {pattern.projectsImpacted.join(', ')}</span>
                      <span>Freq: {pattern.recurrenceFrequency}</span>
                    </div>

                    {isSelected && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border-subtle)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <div style={{ color: 'var(--brand-primary)', fontWeight: 700, marginBottom: 2 }}>
                          Empirical Recommendation:
                        </div>
                        <div>{pattern.recommendation}</div>
                        <div style={{ marginTop: 4, color: '#10b981', fontWeight: 600 }}>
                          Historical Calibration Result: {pattern.historicalTrend}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Institutional Variance Reduction Learning Curve */}
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <History size={15} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Institutional Learning Curve & Variance Reduction
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Demonstrating the power of Project Memory: As historical turnarounds completed, empirical lessons were locked into DATUM&apos;s calibration matrix, reducing schedule slippage on successive projects.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {[
                { proj: 'Vizag Refinery VR-3', year: '2024 (Finished)', variance: '+26 Days', spi: '0.95', color: '#f43f5e' },
                { proj: 'Panipat Naphtha Cracker 2', year: '2025 (Finished)', variance: '+18 Days', spi: '0.97', color: '#f59e0b' },
                { proj: 'Paradip Hydrocracker P1', year: '2025 (Finished)', variance: '+14 Days', spi: '0.98', color: '#f59e0b' },
                { proj: 'BPCL Kochi Clean Fuel', year: '2026 (Active)', variance: '+5 Days', spi: '0.94', color: '#10b981' },
                { proj: 'IOCL Refinery Expansion', year: '2026 (Active)', variance: '+3 Days', spi: '0.88', color: '#10b981' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', background: 'var(--bg-surface-secondary)', borderRadius: 6, fontSize: '0.73rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.proj}</span>
                    <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginLeft: 6 }}>{item.year}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>SPI {item.spi}</span>
                    <span style={{ fontWeight: 800, color: item.color }}>{item.variance}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '0.65rem', borderRadius: 6, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.72rem', color: '#059669', lineHeight: 1.4 }}>
              <strong>Execution Intelligence ROI:</strong> Preserving completed project telemetry reduced average schedule slippage from <strong>+26 days down to +3 days</strong> across 24 months.
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROJECT-BY-PROJECT MEMORY & INSIGHTS ("Insights Under Each Project's Name") */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={17} style={{ color: 'var(--brand-primary)' }} />
              <span>Project Memory Bank: Learned Insights by Project</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Information never disappears upon project completion. Permanent institutional records directly accessible under each project:
            </span>
          </div>

          {/* Filter Pills */}
          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${projectMemoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setProjectMemoryFilter('all')}
              style={{ fontSize: '0.725rem' }}
            >
              All Projects ({INSTITUTIONAL_PROJECTS_MEMORY.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${projectMemoryFilter === 'active' ? 'active' : ''}`}
              onClick={() => setProjectMemoryFilter('active')}
              style={{ fontSize: '0.725rem' }}
            >
              Active Execution (4)
            </button>
            <button
              type="button"
              className={`filter-pill ${projectMemoryFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setProjectMemoryFilter('completed')}
              style={{ fontSize: '0.725rem' }}
            >
              Finished (Memory Retained) (3)
            </button>
          </div>
        </div>

        {/* Project Memory Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
          {INSTITUTIONAL_PROJECTS_MEMORY
            .filter(p => {
              if (projectMemoryFilter === 'active') return p.status === 'active';
              if (projectMemoryFilter === 'completed') return p.status === 'completed';
              return true;
            })
            .map(proj => {
              const isCurrent = currentProject?.id === proj.id;
              const isFinished = proj.status === 'completed';

              return (
                <div
                  key={proj.id}
                  className="card"
                  style={{
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    borderLeft: `4px solid ${isFinished ? '#8b5cf6' : '#10b981'}`,
                    background: isCurrent ? 'var(--bg-surface)' : 'var(--bg-surface)',
                    boxShadow: isCurrent ? '0 0 0 1.5px var(--brand-primary)' : undefined,
                  }}
                >
                  {/* Card Header: Project Name & Status */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <span className="mono-pill" style={{ color: isFinished ? '#8b5cf6' : 'var(--brand-primary)', fontWeight: 800 }}>
                        {proj.shortCode}
                      </span>
                      <span
                        className="status-pill"
                        style={{
                          fontSize: '0.65rem',
                          background: isFinished ? 'rgba(139, 92, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: isFinished ? '#8b5cf6' : '#10b981',
                          border: `1px solid ${isFinished ? 'rgba(139, 92, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                          fontWeight: 700,
                        }}
                      >
                        {isFinished ? 'Finished • Memory Preserved' : 'Active Execution'}
                      </span>
                    </div>

                    <h4 style={{ margin: '4px 0 2px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {proj.name}
                    </h4>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      {proj.client} &bull; {proj.location} ({proj.executionWindow})
                    </div>
                  </div>

                  {/* Execution Telemetry Ribbon */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 6,
                      background: 'var(--bg-surface-secondary)',
                      padding: '0.5rem 0.65rem',
                      borderRadius: 6,
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Progress</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{proj.progress}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SPI</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: Number(proj.spi) >= 0.95 ? '#10b981' : '#f59e0b' }}>{proj.spi}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delay Flagged</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f43f5e' }}>+{proj.totalDelayDays}d</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Field Logs</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{proj.recordsAnalyzed}</div>
                    </div>
                  </div>

                  {/* INSIGHTS UNDER PROJECT'S NAME: Surfaced Recurring Delays */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f43f5e', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={12} />
                      <span>Recurring Delays Identified in this Project:</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {proj.recurringDelayTriggers.map((trig, tIdx) => (
                        <div
                          key={tIdx}
                          style={{
                            padding: '0.45rem 0.6rem',
                            borderRadius: 4,
                            background: 'rgba(244, 63, 94, 0.05)',
                            borderLeft: '3px solid #f43f5e',
                            fontSize: '0.72rem',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {trig.trigger} ({trig.recurrenceRate})
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: 2 }}>
                            Root Cause: {trig.rootCause} &bull; <strong style={{ color: '#f43f5e' }}>+{trig.impactDays} Days</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Institutional Insights Under Project's Name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={12} />
                      <span>Preserved Institutional Lessons:</span>
                    </div>
                    {proj.institutionalInsights.map((ins, iIdx) => (
                      <div key={iIdx} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 5, lineHeight: 1.35 }}>
                        <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>•</span>
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calibrated Rule & Financial Protection */}
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ padding: '0.45rem 0.6rem', borderRadius: 4, background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.2)', fontSize: '0.7rem', color: 'var(--brand-primary)' }}>
                      <strong>AI Baseline Rule:</strong> {proj.calibratedBaselineRule}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                      <span style={{ color: '#059669', fontWeight: 700 }}>
                        {proj.claimsPrevented}
                      </span>

                      {!isFinished && !isCurrent && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => switchProject(proj.id)}
                          style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                          title="Switch active project context"
                        >
                          Switch Context
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 4. Interactive Semantic Search Bar */}
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
