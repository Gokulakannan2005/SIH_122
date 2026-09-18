import React, { useState, useEffect, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Check,
  X,
  Clock,
  Calendar,
  Compass,
  Search,
  HelpCircle,
  FileText,
  AlertOctagon,
  Mic,
  FileSpreadsheet,
  Download,
  Filter,
  TrendingUp,
  Inbox,
  Database,
  Send,
  Edit3,
  HardHat,
  MessageSquare,
  Volume2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  GUIDED_DEMO_STEPS,
  DEMO_BASELINE_SCHEDULE,
  DEMO_SCENARIO_1,
  DEMO_SCENARIO_2,
  DEMO_SCENARIO_3,
  DEMO_AUDIT_TRAIL,
} from '../utils/guidedDemoData';
import { parseSpokenUpdate } from '../utils/speechParser';
import { deriveProjectMemory, queryProjectMemory } from '../utils/projectMemoryData';

interface GuidedDemoWalkthroughViewProps {
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onJumpToStep: (index: number) => void;
  onRestart: () => void;
  onExit: () => void;
}

export const GuidedDemoWalkthroughView: React.FC<GuidedDemoWalkthroughViewProps> = ({
  currentStepIndex,
  onNext,
  onPrev,
  onJumpToStep,
  onRestart,
  onExit,
}) => {
  const {
    theme,
    schedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    handlePlannerAction,
    exportAlignmentCSV,
    addToast,
  } = useProject();

  const isSummaryScreen = currentStepIndex >= GUIDED_DEMO_STEPS.length;
  const currentStep = !isSummaryScreen ? GUIDED_DEMO_STEPS[currentStepIndex] : null;

  // Analysis Sequence State for Step 3
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Verification State for Step 5 & 6
  const [isLinkVerified, setIsLinkVerified] = useState<boolean>(false);

  // Review Selection for Step 10
  const [selectedReviewAction, setSelectedReviewAction] = useState<string | null>(null);

  // Step 6: Talk to DATUM State
  const [conversationalInput, setConversationalInput] = useState<string>(
    'CW line 24-CW-017 erection started at Pump Bay 2 this morning.'
  );
  const [talkToDatumSuccess, setTalkToDatumSuccess] = useState<boolean>(false);

  // Step 14: Structured Actuals Discipline Filter
  const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');

  // Step 16: Project Memory State
  const memoryPatterns = useMemo(() => {
    return deriveProjectMemory(siteUpdates, schedule, plannerDecisions);
  }, [siteUpdates, schedule, plannerDecisions]);

  const [memoryQueryInput, setMemoryQueryInput] = useState<string>(
    'What is the actual duration of CW line erection?'
  );
  const [memoryQueryResult, setMemoryQueryResult] = useState(() =>
    queryProjectMemory('What is the actual duration of CW line erection?', siteUpdates, schedule, memoryPatterns)
  );

  // Step 17: Audit Trail Copied Hash
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Auto-run analysis when landing on Step 3
  useEffect(() => {
    if (currentStepIndex === 2) {
      setIsAnalyzing(true);
      setAnalysisProgress(0);

      const t1 = setTimeout(() => setAnalysisProgress(1), 350);
      const t2 = setTimeout(() => setAnalysisProgress(2), 700);
      const t3 = setTimeout(() => setAnalysisProgress(3), 1050);
      const t4 = setTimeout(() => setAnalysisProgress(4), 1400);
      const t5 = setTimeout(() => setAnalysisProgress(5), 1750);
      const t6 = setTimeout(() => {
        setAnalysisProgress(6);
        setIsAnalyzing(false);
      }, 2100);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
        clearTimeout(t6);
      };
    } else {
      setAnalysisProgress(6);
      setIsAnalyzing(false);
    }
  }, [currentStepIndex]);

  // Reset verification when navigating back
  useEffect(() => {
    if (currentStepIndex < 4) {
      setIsLinkVerified(false);
    }
    if (currentStepIndex >= 4) {
      setIsLinkVerified(true);
    }
  }, [currentStepIndex]);

  const handleManualAnalyzeClick = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setTimeout(() => setAnalysisProgress(1), 250);
    setTimeout(() => setAnalysisProgress(2), 500);
    setTimeout(() => setAnalysisProgress(3), 750);
    setTimeout(() => setAnalysisProgress(4), 1000);
    setTimeout(() => setAnalysisProgress(5), 1250);
    setTimeout(() => {
      setAnalysisProgress(6);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleVerifyClick = () => {
    setIsLinkVerified(true);
    setTimeout(() => {
      onNext();
    }, 450);
  };

  const handleTalkToDatumConfirm = () => {
    setTalkToDatumSuccess(true);
    if (addToast) {
      addToast({ title: 'Event Extracted', message: '24-CW-017 Spool Erection at Pump Bay linked to schedule.', type: 'success' });
    }
    setTimeout(() => {
      onNext();
    }, 600);
  };

  const handleMemoryQuerySubmit = (queryText: string) => {
    setMemoryQueryInput(queryText);
    const result = queryProjectMemory(queryText, siteUpdates, schedule, memoryPatterns);
    setMemoryQueryResult(result);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(true);
    if (addToast) {
      addToast({ title: 'Copied', message: 'SHA-256 fingerprint copied to clipboard.', type: 'info' });
    }
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Filtered schedule actuals for Step 14
  const filteredScheduleActivities = useMemo(() => {
    if (disciplineFilter === 'ALL') return schedule;
    return schedule.filter(item => item.discipline.toUpperCase() === disciplineFilter);
  }, [schedule, disciplineFilter]);

  return (
    <div className={`guided-demo-walkthrough-overlay theme-${theme}`} data-theme={theme}>
      {/* Top Fixed Demo Bar */}
      <div className="guided-demo-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="guided-demo-badge">
            <Compass size={14} />
            <span>Interactive System Tour</span>
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {!isSummaryScreen ? `Step ${currentStepIndex + 1} of ${GUIDED_DEMO_STEPS.length}` : 'Demo Summary & Takeaways'}
          </span>
        </div>

        {/* Step dots navigation */}
        <div className="guided-demo-step-pills">
          {GUIDED_DEMO_STEPS.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onJumpToStep(idx)}
                className={`guided-demo-step-dot ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                title={`${step.title} (${step.tagline || ''})`}
              >
                <span>{step.stepNumber}</span>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRestart}
            title="Restart demo from beginning"
          >
            <RotateCcw size={13} />
            <span>Restart</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onExit}
            title="Exit guided tour"
          >
            <X size={14} />
            <span>Exit Demo</span>
          </button>
        </div>
      </div>

      {/* Main Presentation Stage */}
      <div className="guided-demo-stage-container">
        {/* Left / Center: Interactive Demo Content Stage */}
        <div className="guided-demo-content-stage">

          {/* ========================================================================= */}
          {/* STEP 1 (idx 0) — PROJECT BASELINE (Primavera P6 Schedule) */}
          {/* ========================================================================= */}
          {currentStepIndex === 0 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-schedule-list">
              <div className="demo-stage-header">
                <span className="demo-step-badge">THIS IS THE PLANNED PROJECT WORLD</span>
                <h2>Structured Baseline Project Schedule</h2>
                <p>
                  Large infrastructure projects contain thousands of structured schedule activities. Each activity is organized with standardized WBS codes, planned durations, and progress baselines in Primavera P6.
                </p>
              </div>

              <div className="demo-schedule-card">
                <div className="demo-card-title-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} style={{ color: 'var(--brand-primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      Primavera P6 Baseline Schedule • Rev-03 (WBS Package 2.1.2)
                    </span>
                  </div>
                  <span className="badge badge-success">4 Core Milestone Activities</span>
                </div>

                <div className="demo-table-wrapper">
                  <table className="demo-table">
                    <thead>
                      <tr>
                        <th>Activity ID</th>
                        <th>Activity Description</th>
                        <th>WBS Code</th>
                        <th>Discipline</th>
                        <th>Area</th>
                        <th>Planned Progress</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_BASELINE_SCHEDULE.map(item => (
                        <tr key={item.code} className={item.code === 'PIP-L6-012' ? 'highlight-row' : ''}>
                          <td>
                            <strong className="code-badge">{item.code}</strong>
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{item.wbs}</td>
                          <td>
                            <span className={`discipline-badge ${item.discipline.toLowerCase()}`}>{item.discipline}</span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{item.area}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div className="mini-progress-bar">
                                <div className="mini-progress-fill" style={{ width: `${item.plannedProgress}%` }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.plannedProgress}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${item.status === 'Behind Schedule' ? 'delayed' : 'active'}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="demo-callout-banner">
                <div className="callout-icon">💡</div>
                <div className="callout-body">
                  <strong>The Engineering Reality:</strong> This planned schedule is clean and structured. However, daily site execution generates unstructured reports that must be aligned back to these exact codes without manual delays.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2 (idx 1) — FIELD DATA INBOX (Multi-Source Capture) */}
          {/* ========================================================================= */}
          {currentStepIndex === 1 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-inbox">
              <div className="demo-stage-header">
                <span className="demo-step-badge primary">HETEROGENEOUS DATA CAPTURE</span>
                <h2>Multi-Source Field Execution Inbox</h2>
                <p>
                  Execution evidence arrives in varied formats across civil, piping, electrical, and mechanical packages. DATUM accepts raw formats without requiring rigid proprietary forms.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                <div className="demo-contrast-card" style={{ padding: '1.25rem', border: '1px solid var(--border-default)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
                    <strong style={{ fontSize: '0.95rem' }}>1. Unstructured Daily Log (TXT)</strong>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Free-text supervisor diary entries describing crew activities, crane mobilizations, and line progress.
                  </p>
                  <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '0.5rem' }}>
                    daily_report.txt (10 discipline items)
                  </div>
                </div>

                <div className="demo-contrast-card" style={{ padding: '1.25rem', border: '1px solid var(--border-default)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <FileSpreadsheet size={18} style={{ color: 'var(--success)' }} />
                    <strong style={{ fontSize: '0.95rem' }}>2. Contractor Spreadsheets (XLSX)</strong>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Granular piping progress tables containing cut lengths, spool numbers, and joint weld inspections.
                  </p>
                  <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '0.5rem' }}>
                    piping_progress.xlsx (Lines, Spools, Welds)
                  </div>
                </div>

                <div className="demo-contrast-card" style={{ padding: '1.25rem', border: '1px solid var(--border-default)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Mic size={18} style={{ color: 'var(--warning)' }} />
                    <strong style={{ fontSize: '0.95rem' }}>3. Conversational Voice & Mobile</strong>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Spoken reports from field engineers captured via Web Speech or mobile voice recordings.
                  </p>
                  <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '0.5rem' }}>
                    Audio note: &ldquo;CW line 24-CW-017 erection started...&rdquo;
                  </div>
                </div>

                <div className="demo-contrast-card" style={{ padding: '1.25rem', border: '1px solid var(--border-default)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <HardHat size={18} style={{ color: '#8b5cf6' }} />
                    <strong style={{ fontSize: '0.95rem' }}>4. Scanned Inspection Records (OCR)</strong>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    On-site quality inspection checklists, weld test certificates, and site diary photographs.
                  </p>
                  <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '0.5rem' }}>
                    OCR scanned punch sheet & weld QA tags
                  </div>
                </div>
              </div>

              <div className="demo-callout-banner success" style={{ marginTop: '1.25rem' }}>
                <div className="callout-icon">📥</div>
                <div className="callout-body">
                  <strong>Zero-Friction Ingestion:</strong> DATUM adapts to how contractors actually communicate rather than imposing high digital compliance friction on construction sites.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3 (idx 2) — DAILY PROGRESS REPORT (Unstructured Text) */}
          {/* ========================================================================= */}
          {currentStepIndex === 2 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-unstructured-report">
              <div className="demo-stage-header">
                <span className="demo-step-badge warning">SOURCE A: FREE-TEXT LOG</span>
                <h2>Unstructured Daily Progress Report</h2>
                <p>
                  Actual field execution from the piping crew submitted as an informal text note in the daily progress log.
                </p>
              </div>

              <div className="demo-contrast-grid">
                <div className="demo-contrast-card unstructured">
                  <div className="contrast-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} style={{ color: 'var(--warning)' }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>daily_report.txt (Item #3)</span>
                    </div>
                    <span className="badge badge-warning">Piping Section</span>
                  </div>

                  <div className="report-quote-box">
                    <span className="quote-mark">&ldquo;</span>
                    <p className="quote-text">{DEMO_SCENARIO_1.updateText}</p>
                    <span className="quote-mark">&rdquo;</span>
                  </div>

                  <div className="report-metadata-row">
                    <div>
                      <span className="meta-label">Supervisor:</span> {DEMO_SCENARIO_1.supervisor}
                    </div>
                    <div>
                      <span className="meta-label">Location:</span> {DEMO_SCENARIO_1.location}
                    </div>
                  </div>
                </div>

                <div className="demo-contrast-card question-card">
                  <div className="question-icon-circle">
                    <HelpCircle size={32} style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center' }}>
                    &ldquo;Which schedule activity does this update belong to?&rdquo;
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
                    Across 5,000+ baseline schedule activities, manual searching takes hours and introduces human error. DATUM extracts structured fields and connects it to the master schedule.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4 (idx 3) — DISCIPLINE SPREADSHEET (Tabular Progress) */}
          {/* ========================================================================= */}
          {currentStepIndex === 3 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-spreadsheet">
              <div className="demo-stage-header">
                <span className="demo-step-badge success">SOURCE B: PIPING SPREADSHEET</span>
                <h2>Tabular Discipline Execution Progress</h2>
                <p>
                  Alongside text reports, piping contractors log granular fabrication and erection progress in Excel spreadsheets.
                </p>
              </div>

              <div className="demo-schedule-card">
                <div className="demo-card-title-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileSpreadsheet size={16} style={{ color: 'var(--success)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      piping_progress.xlsx • Spool & Weld Tracking Sheet
                    </span>
                  </div>
                  <span className="badge badge-info">Reconciled into Common Pipeline</span>
                </div>

                <div className="demo-table-wrapper">
                  <table className="demo-table">
                    <thead>
                      <tr>
                        <th>Line Number</th>
                        <th>Iso Drawing</th>
                        <th>Spool ID</th>
                        <th>Cut Length</th>
                        <th>Weld Joint</th>
                        <th>Heat Number</th>
                        <th>Erection Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="highlight-row">
                        <td><strong className="code-badge">24-CW-017</strong></td>
                        <td>ISO-CW-002</td>
                        <td><strong>SP-04</strong></td>
                        <td>12.4 m</td>
                        <td>W-01 / W-02</td>
                        <td>HT-8821</td>
                        <td><span className="badge badge-warning">Erected (In Progress)</span></td>
                      </tr>
                      <tr>
                        <td><strong className="code-badge">24-CW-017</strong></td>
                        <td>ISO-CW-001</td>
                        <td>SP-03</td>
                        <td>8.6 m</td>
                        <td>W-03</td>
                        <td>HT-8819</td>
                        <td><span className="badge badge-success">Completed</span></td>
                      </tr>
                      <tr>
                        <td><strong className="code-badge">16-FW-005</strong></td>
                        <td>ISO-FW-010</td>
                        <td>SP-01</td>
                        <td>6.2 m</td>
                        <td>W-01</td>
                        <td>HT-7740</td>
                        <td><span className="badge badge-secondary">Fit-up Ready</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="demo-callout-banner">
                <div className="callout-icon">📊</div>
                <div className="callout-body">
                  <strong>Simultaneous Reconciliation:</strong> DATUM extracts line tag <code>24-CW-017</code> and spool data from both <code>daily_report.txt</code> and <code>piping_progress.xlsx</code>, cross-validating the evidence before schedule linking.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5 (idx 4) — STRUCTURED EXTRACTION (Raw Evidence -> Structured Event) */}
          {/* ========================================================================= */}
          {currentStepIndex === 4 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-extraction">
              <div className="demo-stage-header">
                <span className="demo-step-badge primary">EVIDENCE UNDERSTANDING</span>
                <h2>Structured Activity Event Extraction</h2>
                <p>
                  Before matching can occur, DATUM transforms informal field language into a canonical, structured activity event.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
                <div className="demo-contrast-card unstructured" style={{ height: '100%' }}>
                  <div className="contrast-header">
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>RAW FIELD EVIDENCE</span>
                    <span className="badge badge-warning">TXT Input</span>
                  </div>
                  <div className="report-quote-box" style={{ margin: '0.75rem 0' }}>
                    <p className="quote-text" style={{ fontSize: '0.875rem' }}>
                      &ldquo;CW 24-inch spool was erected near Pump Bay today; alignment is in progress. Work started on 03 Sep.&rdquo;
                    </p>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Source: daily_report.txt (Line 14)</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)' }}>
                  <Sparkles size={24} />
                  <ArrowRight size={20} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>PARSED</span>
                </div>

                <div className="demo-contrast-card" style={{ height: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>STRUCTURED ACTIVITY EVENT</strong>
                    <span className="badge badge-success">Normalized</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Discipline:</span>
                      <strong style={{ color: 'var(--brand-primary)' }}>Piping</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Activity:</span>
                      <strong>Spool Erection & Alignment</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Equipment / Line Tag:</span>
                      <strong className="code-badge">24-CW-017</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Area / Location:</span>
                      <strong>Unit-01 Pump Bay 2</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Actual Start:</span>
                      <strong>03 Sep (Recorded)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Status & Progress:</span>
                      <span className="badge badge-warning">In Progress (60%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="demo-callout-banner success" style={{ marginTop: '1.25rem' }}>
                <div className="callout-icon">🎯</div>
                <div className="callout-body">
                  <strong>The Bridge Foundation:</strong> The unstructured field narrative is now clean, typed data ready for the deterministic matching engine.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 6 (idx 5) — TALK TO DATUM (Conversational Field Capture) */}
          {/* ========================================================================= */}
          {currentStepIndex === 5 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-talk-to-datum">
              <div className="demo-stage-header">
                <span className="demo-step-badge warning">CONVERSATIONAL CAPTURE</span>
                <h2>Talk to DATUM — Voice & Text Field Entry</h2>
                <p>
                  Site supervisors can simply speak or type daily accomplishments from their phones. DATUM parses engineering entities and connects directly to the schedule.
                </p>
              </div>

              <div className="demo-contrast-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', padding: '1.25rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} style={{ color: 'var(--brand-primary)' }} />
                    <strong style={{ fontSize: '0.95rem' }}>Natural Language Field Submission</strong>
                  </div>
                  <span className="badge badge-primary">Zero-Friction Mobile</span>
                </div>

                {/* Prompt chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Try prompt:</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setConversationalInput('CW line 24-CW-017 erection started at Pump Bay 2 this morning.')}
                  >
                    &ldquo;CW line 24-CW-017 erection started at Pump Bay 2...&rdquo;
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setConversationalInput('Poured foundation concrete for CW Pump B foundation.')}
                  >
                    &ldquo;Poured foundation concrete for CW Pump B...&rdquo;
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setConversationalInput('Pulling 415V power cable for SWG-01 in substation.')}
                  >
                    &ldquo;Pulling 415V power cable for SWG-01...&rdquo;
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <textarea
                    rows={2}
                    value={conversationalInput}
                    onChange={e => setConversationalInput(e.target.value)}
                    className="form-control"
                    style={{ flex: 1, padding: '0.65rem', borderRadius: '6px', fontSize: '0.85rem' }}
                    placeholder="Type or speak field execution update..."
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.65rem 1rem' }}
                    title="Voice input simulation"
                    onClick={() => {
                      if (addToast) addToast({ title: 'Microphone Active', message: 'Listening via microphone simulation...', type: 'info' });
                    }}
                  >
                    <Mic size={18} style={{ color: 'var(--brand-primary)' }} />
                  </button>
                </div>

                {/* Parsed Preview Card */}
                <div style={{ background: 'var(--bg-surface-secondary)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-default)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>EXTRACTED PARAMETERS:</span>
                    <span className="badge badge-success">Live Parser Active</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>DISCIPLINE</span>
                      <strong>Piping</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>TAG / EQUIPMENT</span>
                      <strong className="code-badge">24-CW-017</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>LOCATION</span>
                      <strong>Pump Bay 2</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleTalkToDatumConfirm}
                      style={{ fontWeight: 800 }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Confirm & Link to Schedule →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 7 (idx 6) — L5/L6 SCHEDULE MATCHING (Deterministic Linking) */}
          {/* ========================================================================= */}
          {currentStepIndex === 6 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-candidate-matches">
              <div className="demo-stage-header">
                <span className="demo-step-badge success">DETERMINISTIC LINKING</span>
                <h2>Ranked Schedule Activity Candidates</h2>
                <p>
                  DATUM searches the Primavera P6 schedule baseline using explainable factors: equipment tag, discipline, area, and text similarity.
                </p>
              </div>

              <div className="candidate-results-grid">
                <div className="candidate-cards-col">
                  <div className="section-subtitle">EVALUATED BASELINE CANDIDATES</div>
                  {DEMO_SCENARIO_1.candidates.map(cand => (
                    <div key={cand.activityCode} className={`candidate-match-card ${cand.isTopMatch ? 'top-match' : ''}`}>
                      <div className="match-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="rank-badge">#{cand.rank}</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              [{cand.activityCode}] {cand.activityName}
                            </div>
                          </div>
                        </div>
                        <div className={`confidence-meter ${cand.confidence >= 80 ? 'high' : cand.confidence >= 50 ? 'medium' : 'low'}`}>
                          {cand.confidence}% Match
                        </div>
                      </div>

                      <div className="match-reasons-list">
                        {cand.reasons.map((reason, rIdx) => (
                          <div key={rIdx} className="reason-item">
                            <Check size={12} className="reason-check" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="explainability-sidebar-card">
                  <div className="sidebar-header-title">
                    <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
                    <span>OPERATING THRESHOLD GATE</span>
                  </div>

                  <div style={{ padding: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      <span>Candidate Score:</span>
                      <strong style={{ color: 'var(--success)' }}>92%</strong>
                    </div>
                    <div className="mini-progress-bar" style={{ height: '8px' }}>
                      <div className="mini-progress-fill" style={{ width: '92%', background: 'var(--success)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Operating Threshold: 75%</span>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>GATE PASSED ✓</span>
                    </div>
                  </div>

                  <div className="explainability-summary">
                    &ldquo;PIP-L6-012 matches with 92% operational evidence. It is routed for automatic milestone progress tracking.&rdquo;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 8 (idx 7) — EXPLAINABLE EVIDENCE BREAKDOWN */}
          {/* ========================================================================= */}
          {currentStepIndex === 7 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-explainable-breakdown">
              <div className="demo-stage-header">
                <span className="demo-step-badge primary">OPERATIONAL EVIDENCE BREAKDOWN</span>
                <h2>Explainable Multi-Factor Evidence Breakdown</h2>
                <p>
                  DATUM provides transparent mathematical proof rather than a black-box AI guess. Planners can audit every point.
                </p>
              </div>

              <div className="high-confidence-gate-card">
                <div className="gate-status-banner">
                  <div className="status-score-block">
                    <span className="score-num">92%</span>
                    <span className="score-label">MATCH SCORE</span>
                  </div>
                  <div className="status-info-block">
                    <div className="status-title">STATUS: HIGH CONFIDENCE MATCH</div>
                    <div className="status-desc">Target Activity: <strong>PIP-L6-012 — Erect Line 24-CW-017 (Pump Bay)</strong></div>
                  </div>
                </div>

                {/* 4 Factor Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.25rem' }}>
                  <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.85rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.825rem' }}>
                      <strong>1. Equipment Tag Overlap (40%)</strong>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>+40 / 40 pts</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Exact match on equipment line tag <code>24-CW-017</code>.</p>
                  </div>

                  <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.85rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.825rem' }}>
                      <strong>2. Discipline Consistency (25%)</strong>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>+25 / 25 pts</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Both report and P6 milestone belong to <code>Piping</code> trade.</p>
                  </div>

                  <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.85rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.825rem' }}>
                      <strong>3. Area / Workfront (20%)</strong>
                      <span style={{ color: 'var(--success)', fontWeight: 700 }}>+20 / 20 pts</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Spatial match on <code>Unit-01 Pump Bay 2</code> workfront.</p>
                  </div>

                  <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.85rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.825rem' }}>
                      <strong>4. Token Similarity (15%)</strong>
                      <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>+7 / 15 pts</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Semantic overlap on tokens: &ldquo;spool&rdquo;, &ldquo;erection&rdquo;, &ldquo;cooling water&rdquo;.</p>
                  </div>
                </div>

                <div className="demo-callout-banner" style={{ marginTop: '1.25rem' }}>
                  <div className="callout-icon">🛡️</div>
                  <div className="callout-body">
                    <strong>High-Confidence Operating Threshold: 75%</strong>
                    <br />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      75% is a configurable prototype operating threshold based on weighted matching evidence. It is not a statistically calibrated probability.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 9 (idx 8) — AMBIGUOUS CASE (Uncertainty Recognition) */}
          {/* ========================================================================= */}
          {currentStepIndex === 8 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-ambiguous-card">
              <div className="demo-stage-header">
                <span className="demo-step-badge warning">UNCERTAINTY RECOGNITION</span>
                <h2>Handling Ambiguous Field Evidence</h2>
                <p>
                  What happens when site teams provide sparse information? DATUM recognizes uncertainty and never guesses blindly.
                </p>
              </div>

              <div className="ambiguous-scenario-card">
                <div className="vague-update-header">
                  <span className="badge badge-warning">ELECTRICAL CREW UPDATE</span>
                  <div className="vague-quote-text">&ldquo;{DEMO_SCENARIO_2.updateText}&rdquo;</div>
                  <div className="vague-question-tag">
                    <HelpCircle size={15} />
                    <span>{DEMO_SCENARIO_2.question}</span>
                  </div>
                </div>

                <div className="ambiguous-matches-list">
                  <div className="section-subtitle">CLOSE COMPETING CANDIDATES (DELTA MARGIN: ONLY 4%)</div>
                  {DEMO_SCENARIO_2.candidates.map(cand => (
                    <div key={cand.activityCode} className="ambiguous-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span className="rank-badge">#{cand.rank}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>[{cand.activityCode}] {cand.activityName}</span>
                      </div>
                      <div className="confidence-meter medium">{cand.confidence}% Match</div>
                    </div>
                  ))}
                </div>

                <div className="uncertainty-banner">
                  <div className="banner-badge">STATUS: REVIEW REQUIRED</div>
                  <div className="banner-text">
                    <strong>DATUM recognizes uncertainty.</strong>
                    <br />
                    Because both feeder cables are in the same switchgear room and the margin is only 4%, DATUM routes the decision to the human planner instead of risking master schedule corruption.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 10 (idx 9) — PLANNER VERIFICATION WORKBENCH */}
          {/* ========================================================================= */}
          {currentStepIndex === 9 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-review-workbench">
              <div className="demo-stage-header">
                <span className="demo-step-badge primary">HUMAN-IN-THE-LOOP GOVERNANCE</span>
                <h2>Planner Decision Workbench</h2>
                <p>
                  AI RECOMMENDS. HUMAN DECIDES. The Lead Planning Engineer retains full authority with 4 explicit, binding actions.
                </p>
              </div>

              <div className="review-workbench-card">
                <div className="workbench-review-header">
                  <div>
                    <span className="preview-label">PENDING RECONCILIATION:</span>
                    <p style={{ margin: '0.2rem 0 0', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      &ldquo;{DEMO_SCENARIO_2.updateText}&rdquo;
                    </p>
                  </div>
                  <span className="badge badge-warning">Review Required (63% Top Match)</span>
                </div>

                <div className="planner-actions-quad">
                  <button
                    type="button"
                    className={`planner-action-btn ${selectedReviewAction === 'approve' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedReviewAction('approve');
                      if (addToast) addToast({ title: 'Link Confirmed', message: 'Verified link committed to ELE-L6-022. Audit trail updated.', type: 'success' });
                    }}
                  >
                    <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                    <div className="btn-text-block">
                      <strong>Confirm Link</strong>
                      <span>Link to ELE-L6-022 (Pull MCC-01 Feeder Cable)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`planner-action-btn ${selectedReviewAction === 'relink' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedReviewAction('relink');
                      if (addToast) addToast({ title: 'Activity Relinked', message: 'Relinked to ELE-L6-023. Audit trail updated.', type: 'info' });
                    }}
                  >
                    <Search size={18} style={{ color: 'var(--brand-primary)' }} />
                    <div className="btn-text-block">
                      <strong>Relink to Different Activity</strong>
                      <span>Select alternative activity from master WBS schedule</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`planner-action-btn ${selectedReviewAction === 'unplanned' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedReviewAction('unplanned');
                      if (addToast) addToast({ title: 'Scope Flagged', message: 'Classified as Potential Out-of-Baseline Work.', type: 'warning' });
                    }}
                  >
                    <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                    <div className="btn-text-block">
                      <strong>Classify as Potential Out-of-Baseline</strong>
                      <span>Flag as out-of-scope work requiring variation order</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`planner-action-btn ${selectedReviewAction === 'reject' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedReviewAction('reject');
                      if (addToast) addToast({ title: 'Update Rejected', message: 'Update rejected. Returned to site supervisor.', type: 'error' });
                    }}
                  >
                    <X size={18} style={{ color: 'var(--danger)' }} />
                    <div className="btn-text-block">
                      <strong>Reject Update</strong>
                      <span>Return report to site supervisor for clarification</span>
                    </div>
                  </button>
                </div>

                {selectedReviewAction && (
                  <div className="action-feedback-toast">
                    <Check size={14} />
                    <span>Decision committed: <strong>{selectedReviewAction.toUpperCase()}</strong>. Mutable state updated & SHA-256 audit fingerprint logged.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 11 (idx 10) — POTENTIAL OUT-OF-BASELINE WORK */}
          {/* ========================================================================= */}
          {currentStepIndex === 10 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-unplanned-work">
              <div className="demo-stage-header">
                <span className="demo-step-badge warning">SCOPE VARIANCE DETECTION</span>
                <h2>Potential Out-of-Baseline Activity</h2>
                <p>
                  Instead of forcing every update into an existing schedule activity, DATUM identifies updates that represent work outside the loaded baseline.
                </p>
              </div>

              <div className="unplanned-scenario-card">
                <div className="unplanned-report-box">
                  <span className="badge badge-danger">OUT-OF-SCOPE REPORT</span>
                  <p className="unplanned-text">&ldquo;{DEMO_SCENARIO_3.updateText}&rdquo;</p>
                </div>

                <div className="unplanned-result-split">
                  <div className="unplanned-box">
                    <div className="box-tagline">ANALYSIS RESULT</div>
                    <div className="no-match-alert">
                      <AlertOctagon size={24} style={{ color: 'var(--warning)' }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--warning)' }}>
                          NO MATCHING BASELINE ACTIVITY FOUND
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Confidence score across all baseline activities &lt; 20%
                        </div>
                      </div>
                    </div>

                    <div className="possible-causes-list">
                      <span className="causes-title">ANALYSIS FINDINGS:</span>
                      {DEMO_SCENARIO_3.causePoints.map((cause, cIdx) => (
                        <div key={cIdx} className="cause-item">
                          <span className="bullet">•</span>
                          <span>{cause}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="unplanned-action-box">
                    <div className="box-tagline">GOVERNANCE ACTION</div>
                    <h4 style={{ color: 'var(--text-primary)', margin: '0.5rem 0' }}>⚠ ROUTED FOR CLASSIFICATION</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      DATUM never silently discards field execution. Flagging potential out-of-baseline work protects commercial variation claims and contract adjustments.
                    </p>

                    <button
                      type="button"
                      className="btn btn-warning"
                      style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}
                      onClick={onNext}
                    >
                      <AlertTriangle size={15} />
                      <span>Send for Planner Scope Review →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 12 (idx 11) — REAL-TIME ACTUAL PROGRESS */}
          {/* ========================================================================= */}
          {currentStepIndex === 11 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-actual-progress">
              <div className="demo-stage-header">
                <span className="demo-step-badge success">SCHEDULE SYNCHRONIZATION</span>
                <h2>Real-Time Actual Progress Tracking</h2>
                <p>
                  Once field evidence is verified, actual project progress is automatically synchronized with the master schedule baseline.
                </p>
              </div>

              <div className="progress-intelligence-card">
                <div className="intelligence-activity-header">
                  <div>
                    <span className="code-badge">PIP-L6-012</span>
                    <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                      Erect Line 24-CW-017 (Unit-01 Pump Bay 2)
                    </h3>
                  </div>
                  <div className="variance-alert-badge">
                    <AlertTriangle size={16} />
                    <span>STATUS: BEHIND SCHEDULE (-40% Gap)</span>
                  </div>
                </div>

                <div className="progress-comparison-section">
                  <div className="progress-row">
                    <div className="progress-row-header">
                      <span className="row-label">PLANNED PROGRESS (Primavera Baseline Rev-03)</span>
                      <span className="row-val planned">100%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill planned" style={{ width: '100%' }}>
                        <span className="fill-text">Target: 100%</span>
                      </div>
                    </div>
                  </div>

                  <div className="progress-row">
                    <div className="progress-row-header">
                      <span className="row-label">ACTUAL VERIFIED PROGRESS (From Field Updates)</span>
                      <span className="row-val actual">60%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill actual" style={{ width: '60%' }}>
                        <span className="fill-text">Verified: 60%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="schedule-insights-grid">
                  <div className="insight-card">
                    <span className="insight-title">Planned vs Actual Start</span>
                    <span className="insight-num warning">01 Sep → 03 Sep</span>
                    <span className="insight-sub">+2 days late start</span>
                  </div>
                  <div className="insight-card">
                    <span className="insight-title">Observed Duration</span>
                    <span className="insight-num">5.2 Days</span>
                    <span className="insight-sub">vs 3.0 days planned baseline</span>
                  </div>
                  <div className="insight-card">
                    <span className="insight-title">Verified Evidence Source</span>
                    <span className="insight-num">2 Logs + 1 XLSX</span>
                    <span className="insight-sub">100% provenance verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 13 (idx 12) — SCHEDULE VARIANCE & CRITICAL PATH */}
          {/* ========================================================================= */}
          {currentStepIndex === 12 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-schedule-variance">
              <div className="demo-stage-header">
                <span className="demo-step-badge warning">+2 DAYS VARIANCE DETECTED</span>
                <h2>Critical Path Delay Propagation</h2>
                <p>
                  Connecting field reality directly to the schedule enables early warning of downstream delays before milestones slip contractually.
                </p>
              </div>

              <div className="progress-intelligence-card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="insight-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                    <span className="insight-title">Schedule Variance (SV)</span>
                    <span className="insight-num negative">+2.0 Days</span>
                    <span className="insight-sub">Critical path cooling water line slip</span>
                  </div>
                  <div className="insight-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                    <span className="insight-title">Total Float Consumption</span>
                    <span className="insight-num warning">-2 Days Float</span>
                    <span className="insight-sub">Reduced from 6 days to 4 days</span>
                  </div>
                  <div className="insight-card" style={{ borderLeft: '4px solid var(--brand-primary)' }}>
                    <span className="insight-title">Successor Milestone At Risk</span>
                    <span className="insight-num">PIP-L6-013</span>
                    <span className="insight-sub">Hydrotest Line 24-CW-017</span>
                  </div>
                </div>

                <div className="demo-contrast-card" style={{ padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '6px' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    🚨 Early Corrective Action Triggered
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Because the alignment of spool <code>24-CW-017</code> required 5.2 days instead of the 3 days planned, DATUM flags a forward milestone drag. Project controls can immediately allocate alignment support crews before pump commissioning is blocked.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 14 (idx 13) — STRUCTURED ACTUAL DATASET */}
          {/* ========================================================================= */}
          {currentStepIndex === 13 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-structured-dataset">
              <div className="demo-stage-header">
                <span className="demo-step-badge primary">STANDARDIZED EXECUTION DATASET</span>
                <h2>Structured Actual Progress Dataset</h2>
                <p>
                  DATUM converts noisy, unstructured site reports into a clean, queryable, discipline-tagged enterprise dataset ready for export.
                </p>
              </div>

              <div className="demo-schedule-card">
                <div className="demo-card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['ALL', 'PIPING', 'CIVIL', 'ELECTRICAL'].map(d => (
                      <button
                        key={d}
                        type="button"
                        className={`btn btn-sm ${disciplineFilter === d ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDisciplineFilter(d)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      exportAlignmentCSV();
                      if (addToast) addToast({ title: 'Export Complete', message: 'Canonical actual progress CSV exported.', type: 'success' });
                    }}
                  >
                    <Download size={13} />
                    <span>Export Canonical CSV</span>
                  </button>
                </div>

                <div className="demo-table-wrapper" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="demo-table">
                    <thead>
                      <tr>
                        <th>Activity ID</th>
                        <th>Discipline</th>
                        <th>Activity Description</th>
                        <th>Actual Start</th>
                        <th>Actual Finish</th>
                        <th>Progress</th>
                        <th>Variance</th>
                        <th>Provenance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScheduleActivities.slice(0, 6).map(act => (
                        <tr key={act.activityId}>
                          <td><strong className="code-badge">{act.activityId}</strong></td>
                          <td><span className={`discipline-badge ${act.discipline.toLowerCase()}`}>{act.discipline}</span></td>
                          <td style={{ fontWeight: 600 }}>{act.activityName}</td>
                          <td>{act.actualStart || act.plannedStart}</td>
                          <td>{act.actualFinish || '-'}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <div className="mini-progress-bar" style={{ width: '50px' }}>
                                <div className="mini-progress-fill" style={{ width: `${act.progressPercent || 0}%` }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{act.progressPercent || 0}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${(act.varianceDays || 0) > 0 ? 'warning' : 'success'}`}>
                              {(act.varianceDays || 0) > 0 ? `+${act.varianceDays}d` : '0d'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>daily_report.txt</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="demo-callout-banner success" style={{ marginTop: '1rem' }}>
                <div className="callout-icon">💾</div>
                <div className="callout-body">
                  <strong>Standardized Canonical Output:</strong> Ready for downstream enterprise ERPs, Primavera P6 schedule updates, or PMIS business intelligence dashboards.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 15 (idx 14) — EXECUTION INTELLIGENCE */}
          {/* ========================================================================= */}
          {currentStepIndex === 14 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-execution-intelligence">
              <div className="demo-stage-header">
                <span className="demo-step-badge primary">PERFORMANCE INTELLIGENCE</span>
                <h2>Discipline Performance & Recurring Bottlenecks</h2>
                <p>
                  By analyzing cumulative verified actuals across activities, DATUM uncovers systemic productivity bottlenecks and discipline trends.
                </p>
              </div>

              {/* Discipline Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="insight-card" style={{ borderTop: '3px solid var(--brand-primary)' }}>
                  <span className="insight-title">Piping Discipline</span>
                  <span className="insight-num warning">+1.8 Days Avg</span>
                  <span className="insight-sub">6 activities • 68% on-time</span>
                </div>
                <div className="insight-card" style={{ borderTop: '3px solid var(--success)' }}>
                  <span className="insight-title">Civil Discipline</span>
                  <span className="insight-num" style={{ color: 'var(--success)' }}>0.0 Days Avg</span>
                  <span className="insight-sub">4 activities • 100% on-time</span>
                </div>
                <div className="insight-card" style={{ borderTop: '3px solid var(--warning)' }}>
                  <span className="insight-title">Electrical Discipline</span>
                  <span className="insight-num">+0.8 Days Avg</span>
                  <span className="insight-sub">5 activities • 80% on-time</span>
                </div>
              </div>

              {/* Bottleneck Spotlight */}
              <div className="demo-contrast-card" style={{ padding: '1.25rem', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} style={{ color: 'var(--danger)' }} />
                    <strong style={{ fontSize: '0.95rem' }}>Recurring Bottleneck: Spool Flange Alignment</strong>
                  </div>
                  <span className="badge badge-danger">32% of Piping Schedule Drag</span>
                </div>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Observed across 4 distinct piping packages at Unit-01 Pump Bay. Flange alignment and bolt torque checks repeatedly consume an additional 2.2 days beyond baseline estimates due to shared mobile crane hook contention.
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>Occurrences: <strong>4 Events</strong></div>
                  <div>Avg Delay: <strong>+2.2 Days</strong></div>
                  <div>Impact: <strong>Critical Path Risk</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 16 (idx 15) — PROJECT MEMORY (Organizational Learning) */}
          {/* ========================================================================= */}
          {currentStepIndex === 15 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-project-memory">
              <div className="demo-stage-header">
                <span className="demo-step-badge primary">ORGANIZATIONAL LEARNING</span>
                <h2>Project Memory & Empirical Norms</h2>
                <p>
                  Execution experience is converted into reusable institutional memory for future project planning, bidding, and risk-adjusted schedules.
                </p>
              </div>

              {/* Memory Insights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div className="insight-card">
                  <span className="insight-title">Duration Learning (Piping Spools)</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span className="insight-num">5.2 Days</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>observed actual vs 3.0d planned</span>
                  </div>
                  <span className="insight-sub">+73% empirical duration adjustment recommended</span>
                </div>

                <div className="insight-card">
                  <span className="insight-title">Empirical Productivity Norm</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span className="insight-num">18.5 In-Dia/Day</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>observed vs 25.0 planned</span>
                  </div>
                  <span className="insight-sub">Basis for realistic future tender schedules</span>
                </div>
              </div>

              {/* Interactive Ask Project Memory Box */}
              <div className="demo-contrast-card" style={{ padding: '1.25rem', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} style={{ color: 'var(--brand-primary)' }} />
                    <strong style={{ fontSize: '0.95rem' }}>Ask Project Memory</strong>
                  </div>
                  <span className="badge badge-info">Dataset-Backed Learning Engine</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleMemoryQuerySubmit('What is the actual duration of CW line erection?')}
                  >
                    &ldquo;What is the actual duration of CW line erection?&rdquo;
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleMemoryQuerySubmit('What causes pump bay alignment delays?')}
                  >
                    &ldquo;What causes pump bay alignment delays?&rdquo;
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleMemoryQuerySubmit('What is our actual piping productivity norm?')}
                  >
                    &ldquo;What is our actual piping productivity norm?&rdquo;
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    value={memoryQueryInput}
                    onChange={e => setMemoryQueryInput(e.target.value)}
                    className="form-control"
                    style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    placeholder="Ask Project Memory a question..."
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleMemoryQuerySubmit(memoryQueryInput)}
                  >
                    <Search size={14} />
                    <span>Search</span>
                  </button>
                </div>

                {memoryQueryResult && (
                  <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-default)', fontSize: '0.825rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '0.35rem' }}>
                      EMPIRICAL FINDINGS ({memoryQueryResult.recordsAnalyzed} records analyzed):
                    </div>
                    <p style={{ margin: '0 0 0.5rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
                      {memoryQueryResult.answer}
                    </p>
                    {memoryQueryResult.evidencePoints && memoryQueryResult.evidencePoints.length > 0 && (
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.775rem' }}>
                        {memoryQueryResult.evidencePoints.map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 17 (idx 16) — TRACEABLE AUDIT TRAIL */}
          {/* ========================================================================= */}
          {currentStepIndex === 16 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-audit-timeline">
              <div className="demo-stage-header">
                <span className="demo-step-badge primary">IMMUTABLE RECORD OF EXECUTION</span>
                <h2>Complete Chronological Audit Trail</h2>
                <p>
                  Every field update, system recommendation, human verification, and schedule recalculation is preserved in an immutable, traceable provenance chain.
                </p>
              </div>

              <div className="audit-timeline-card">
                <div className="audit-timeline-stream">
                  {DEMO_AUDIT_TRAIL.map((entry, aIdx) => (
                    <div key={aIdx} className="timeline-event-row">
                      <div className="event-time-col">
                        <Clock size={13} />
                        <span>{entry.time}</span>
                      </div>

                      <div className="event-connector">
                        <div className="timeline-node-dot" />
                        {aIdx < DEMO_AUDIT_TRAIL.length - 1 && <div className="timeline-line-stem" />}
                      </div>

                      <div className="event-body-col">
                        <div className="event-header-line">
                          <strong className="event-title">{entry.title}</strong>
                          {entry.badge && (
                            <span className={`badge badge-${entry.badgeType || 'info'}`}>{entry.badge}</span>
                          )}
                        </div>
                        <p className="event-detail">{entry.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Evidence Fingerprint Box */}
                <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-default)', padding: '0.75rem 1rem', borderRadius: '6px', margin: '1rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>SHA-256 Evidence Fingerprint:</span>
                      <code style={{ fontSize: '0.7rem' }}>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      onClick={() => handleCopyHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')}
                    >
                      {copiedHash ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="audit-provenance-footer">
                  <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
                  <span>
                    <strong>End-to-End Governance:</strong> Original Field Update → Entity Extraction → AI Candidate Scoring → Planner Verification → Master Schedule Sync → Immutable Audit Provenance.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FINAL DEMO SUMMARY SCREEN (idx >= 17) */}
          {/* ========================================================================= */}
          {isSummaryScreen && (
            <div className="demo-step-pane animate-fade-in">
              <div className="demo-summary-hero">
                <div className="summary-trophy-icon">🏆</div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.5rem 0' }}>
                  The DATUM Core Architecture
                </h1>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 1.5rem' }}>
                  DATUM bridges physical field execution to master project schedule baselines with explainable AI, human governance, and institutional memory.
                </p>

                <div className="summary-pillars-grid">
                  <div className="pillar-card">
                    <span className="pillar-num">01</span>
                    <h3 className="pillar-title">Heterogeneous Capture</h3>
                    <p className="pillar-desc">Ingests text logs, piping spreadsheets, voice notes, and inspection scans.</p>
                  </div>

                  <div className="pillar-card">
                    <span className="pillar-num">02</span>
                    <h3 className="pillar-title">Explainable Linking</h3>
                    <p className="pillar-desc">Multi-factor deterministic matching (Tags, Discipline, Area, Similarity).</p>
                  </div>

                  <div className="pillar-card">
                    <span className="pillar-num">03</span>
                    <h3 className="pillar-title">Human Governance</h3>
                    <p className="pillar-desc">Recognizes uncertainty and keeps human planning engineers in complete control.</p>
                  </div>

                  <div className="pillar-card">
                    <span className="pillar-num">04</span>
                    <h3 className="pillar-title">Real-Time Progress</h3>
                    <p className="pillar-desc">Turns verified connections into live planned vs actual schedule tracking.</p>
                  </div>

                  <div className="pillar-card">
                    <span className="pillar-num">05</span>
                    <h3 className="pillar-title">Project Memory</h3>
                    <p className="pillar-desc">Extracts duration learnings, bottleneck patterns, and empirical productivity norms.</p>
                  </div>
                </div>

                <div className="summary-tagline-box">
                  &ldquo;We automate the search, not the planner&apos;s judgment.&rdquo;
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-lg"
                    onClick={onRestart}
                    style={{ padding: '0.75rem 1.75rem', fontWeight: 700 }}
                  >
                    <RotateCcw size={16} />
                    <span>Restart Walkthrough</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={onExit}
                    style={{ padding: '0.75rem 2rem', fontWeight: 800 }}
                  >
                    <Layers size={16} />
                    <span>Exit Tour & Explore DATUM</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right: Presenter Guidance Sidecard */}
        {!isSummaryScreen && currentStep && (
          <div className="guided-demo-sidecard animate-fade-in">
            <div className="sidecard-step-header">
              <span className="sidecard-tag">ARCHITECTURE & SPECIFICATION GUIDE</span>
              <h3>{currentStep.title}</h3>
              <p className="sidecard-tagline">{currentStep.tagline}</p>
            </div>

            <div className="sidecard-qa-list">
              <div className="sidecard-qa-block">
                <span className="qa-label">1. OPERATIONAL PROCESS:</span>
                <p className="qa-text">{currentStep.whatIsHappening}</p>
              </div>

              <div className="sidecard-qa-block">
                <span className="qa-label">2. ENGINEERING IMPACT:</span>
                <p className="qa-text">{currentStep.whyItMatters}</p>
              </div>

              <div className="sidecard-qa-block">
                <span className="qa-label">3. INTERACTION CONTROLS:</span>
                <p className="qa-text highlight">{currentStep.whatToInteract}</p>
              </div>

              <div className="sidecard-qa-block">
                <span className="qa-label">4. KEY SYSTEM BEHAVIORS:</span>
                <p className="qa-text">{currentStep.whatToNotice}</p>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="sidecard-controls-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onPrev}
                disabled={currentStepIndex === 0}
                style={{ padding: '0.45rem 0.85rem' }}
              >
                <ArrowLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onNext}
                style={{ padding: '0.45rem 1.15rem', fontWeight: 800 }}
              >
                <span>{currentStepIndex === GUIDED_DEMO_STEPS.length - 1 ? 'Finish Tour 🏆' : 'Next Step'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
