import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Sparkles,
  Send,
  AlertTriangle,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  Zap,
  HelpCircle
} from 'lucide-react';

export const CopilotView: React.FC = () => {
  const {
    enrichedSchedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    setActiveTab,
    setSelectedScheduleActivityId,
  } = useProject();

  const [promptQuery, setPromptQuery] = useState('');
  const [activeAnalysis, setActiveAnalysis] = useState<'briefing' | 'delay_sim' | 'provenance'>('briefing');
  const [simulatedDelayActivity, setSimulatedDelayActivity] = useState('PIP-L6-012');
  const [simulatedDays, setSimulatedDays] = useState(5);

  // Filter delayed items
  const delayedItems = enrichedSchedule.filter(a => (a.varianceDays || 0) > 0 || a.status === 'Delayed');
  const pendingReviews = siteUpdates.filter(u => !plannerDecisions[u.id] && matchResults[u.id]?.category === 'review');
  const completedCount = enrichedSchedule.filter(a => a.status === 'Completed').length;

  // Simulate prompt submission
  const handleAskPrompt = (text: string) => {
    setPromptQuery(text);
    if (text.toLowerCase().includes('delay') || text.toLowerCase().includes('impact')) {
      setActiveAnalysis('delay_sim');
    } else if (text.toLowerCase().includes('provenance') || text.toLowerCase().includes('audit')) {
      setActiveAnalysis('provenance');
    } else {
      setActiveAnalysis('briefing');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="banner-card" style={{ borderLeftColor: '#8270db' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span className="brand-badge" style={{ background: '#f3f0ff', color: '#6e5dc6', borderColor: '#d3cbfb' }}>
              Intelligent Copilot & Schedule Intelligence
            </span>
          </div>
          <h2 className="banner-title" style={{ marginTop: 4 }}>
            <Sparkles size={20} style={{ color: '#6e5dc6' }} />
            Datum AI Intelligence & Critical Path Simulator
          </h2>
          <p className="banner-desc">
            Natural language executive summaries, automated schedule delay propagation risk analysis, and forensic provenance validation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn btn-sm ${activeAnalysis === 'briefing' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveAnalysis('briefing')}
            type="button"
          >
            Executive Briefing
          </button>
          <button
            className={`btn btn-sm ${activeAnalysis === 'delay_sim' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveAnalysis('delay_sim')}
            type="button"
          >
            Delay Risk Simulator
          </button>
          <button
            className={`btn btn-sm ${activeAnalysis === 'provenance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveAnalysis('provenance')}
            type="button"
          >
            Forensic Provenance
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="toolbar-card">
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Suggested Inquiries:
        </div>
        <div className="filter-pill-group">
          <button
            className="filter-pill"
            onClick={() => handleAskPrompt('Generate Daily Executive Progress Briefing')}
            type="button"
          >
            📋 Daily Executive Briefing
          </button>
          <button
            className="filter-pill"
            onClick={() => handleAskPrompt('Simulate Critical Path Delay Impact for Piping in Pump Bay')}
            type="button"
          >
            ⚡ Critical Path Delay Impact
          </button>
          <button
            className="filter-pill"
            onClick={() => handleAskPrompt('Explain Forensic Audit Trail for Supervisor Photo Proofs')}
            type="button"
          >
            🔍 Forensic Audit Provenance
          </button>
        </div>
      </div>

      {/* Analysis View Modes */}
      {activeAnalysis === 'briefing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
          {/* Executive Summary Report */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={16} style={{ color: '#0c66e4' }} />
                AI Executive Briefing & Workfront Health
              </h3>
              <span className="mono-pill">Generated in 12ms</span>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--brand-primary)', fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              <strong>Executive Overview:</strong> Project execution across <strong>{enrichedSchedule.length} L5/L6 activities</strong> is currently <strong>{Math.round((completedCount / (enrichedSchedule.length || 1)) * 100)}% complete</strong>. A total of <strong>{siteUpdates.length} daily progress records</strong> have been ingested from field supervisor reports and piping spreadsheets.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--status-ready-bg)', color: 'var(--status-ready-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  ✓
                </div>
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Piping & Foundation Erection On-Track in CW Area
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Civil foundation and pipe spool welding verified with attached NDT photo proof.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--status-review-bg)', color: 'var(--status-review-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  !
                </div>
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {pendingReviews.length} Supervisor Reports Need Planner Alignment
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Informal terminology from field logs requires single-click human planner confirmation.
                  </div>
                </div>
              </div>

              {delayedItems.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--status-unplanned-bg)', color: 'var(--status-unplanned-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    ⚠
                  </div>
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--status-unplanned-fg)' }}>
                      Schedule Variance Alert: {delayedItems.length} Activities Behind Planned Baseline
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Equipment crane breakdown flagged in pump bay causing 3–5 days variance on downstream hydrotest.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab('planner-review')}
                type="button"
              >
                <span>Open Planner Review Queue</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Key Metrics Summary Card */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Execution Reliability Indices
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span>Matching Engine Precision</span>
                  <span style={{ color: 'var(--status-ready-fg)' }}>94.2%</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 4 }}>
                  <div className="progress-bar-fill green" style={{ width: '94.2%' }} />
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span>Photo Evidence Coverage</span>
                  <span style={{ color: 'var(--brand-primary)' }}>87.5%</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 4 }}>
                  <div className="progress-bar-fill blue" style={{ width: '87.5%' }} />
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span>Baseline Adherence Score</span>
                  <span style={{ color: 'var(--status-review-fg)' }}>81.0%</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 4 }}>
                  <div className="progress-bar-fill amber" style={{ width: '81%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delay Risk Propagation Simulator */}
      {activeAnalysis === 'delay_sim' && (
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingDown size={16} style={{ color: '#ae2e24' }} />
                Critical Path Delay Propagation Simulator
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Simulate how field delay variances cascade into downstream commissioning milestones.
              </p>
            </div>
            <span className="brand-badge" style={{ background: '#ffebe6', color: '#ae2e24', borderColor: '#fd9891' }}>
              Novelty AI Feature
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Select Impacted Baseline Activity:
              </label>
              <select
                className="form-select"
                style={{ width: '100%' }}
                value={simulatedDelayActivity}
                onChange={e => setSimulatedDelayActivity(e.target.value)}
              >
                {enrichedSchedule.map(a => (
                  <option key={a.activityId} value={a.activityId}>
                    [{a.activityId}] {a.activityName} ({a.discipline})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Simulated Workfront Slip (Days): {simulatedDays} Days
              </label>
              <input
                type="range"
                min="1"
                max="21"
                value={simulatedDays}
                onChange={e => setSimulatedDays(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Cascade Chain Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              Downstream Milestone Impact Cascade:
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Root Activity Slip</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ae2e24', marginTop: 2 }}>
                  {simulatedDelayActivity} (+{simulatedDays}d)
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Direct critical path predecessor
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cascaded Milestone</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#e26d00', marginTop: 2 }}>
                  System Hydrotest (+{simulatedDays}d)
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Line testing cannot commence until weld clearance
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Final Commissioning Delta</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ae2e24', marginTop: 2 }}>
                  Commercial Readiness (+{Math.max(1, simulatedDays - 2)}d)
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Estimated Delay Cost: ~${simulatedDays * 8500} USD
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Provenance Audit Trail Replay */}
      {activeAnalysis === 'provenance' && (
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} style={{ color: 'var(--brand-primary)' }} />
              Forensic Evidence Provenance & Audit Integrity
            </h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Verifiable chain of evidence connecting supervisor raw logs & photos directly to Primavera/MS-Project baseline deliverables.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div className="mono-pill" style={{ marginBottom: 4 }}>Step 1: Source Ingestion</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Raw Text & Photo Upload</div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Unstructured logs, piping Excel, and photo timestamps stored immutably.
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div className="mono-pill" style={{ marginBottom: 4 }}>Step 2: 4-Factor Matching</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Multi-Dimensional Scoring</div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Keyword (50%), Discipline (20%), Area (15%), and Fuzzy string matching (15%).
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div className="mono-pill" style={{ marginBottom: 4 }}>Step 3: Human Verification</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Planner Review Workbench</div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Lead planners inspect NLP breakdown and photo proofs with 1-click approve/relink.
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div className="mono-pill" style={{ marginBottom: 4 }}>Step 4: Baseline Alignment</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>WBS Schedule Enrichment</div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Actual start/finish dates and delay variance updated in master Primavera baseline.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
