import React, { useState, useEffect } from 'react';
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
  TrendingDown,
  Calendar,
  Compass,
  Search,
  HelpCircle,
  FileText,
  AlertOctagon,
  ExternalLink,
  ChevronRight,
  Play,
} from 'lucide-react';
import {
  GUIDED_DEMO_STEPS,
  DEMO_BASELINE_SCHEDULE,
  DEMO_SCENARIO_1,
  DEMO_SCENARIO_2,
  DEMO_SCENARIO_3,
  DEMO_AUDIT_TRAIL,
} from '../utils/guidedDemoData';

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
  const { theme } = useProject();
  const isSummaryScreen = currentStepIndex >= GUIDED_DEMO_STEPS.length;
  const currentStep = !isSummaryScreen ? GUIDED_DEMO_STEPS[currentStepIndex] : null;

  // Analysis Sequence State for Step 3
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Verification State for Step 5 & 6
  const [isLinkVerified, setIsLinkVerified] = useState<boolean>(false);

  // Review Selection for Step 9
  const [selectedReviewAction, setSelectedReviewAction] = useState<string | null>(null);

  // Auto-run analysis when landing on Step 3 or when user clicks analyze
  useEffect(() => {
    if (currentStepIndex === 2) {
      // Step 3 (index 2)
      setIsAnalyzing(true);
      setAnalysisProgress(0);

      const t1 = setTimeout(() => setAnalysisProgress(1), 400);
      const t2 = setTimeout(() => setAnalysisProgress(2), 800);
      const t3 = setTimeout(() => setAnalysisProgress(3), 1200);
      const t4 = setTimeout(() => setAnalysisProgress(4), 1600);
      const t5 = setTimeout(() => setAnalysisProgress(5), 2000);
      const t6 = setTimeout(() => {
        setAnalysisProgress(6);
        setIsAnalyzing(false);
      }, 2400);

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
    setTimeout(() => setAnalysisProgress(1), 300);
    setTimeout(() => setAnalysisProgress(2), 600);
    setTimeout(() => setAnalysisProgress(3), 900);
    setTimeout(() => setAnalysisProgress(4), 1200);
    setTimeout(() => setAnalysisProgress(5), 1500);
    setTimeout(() => {
      setAnalysisProgress(6);
      setIsAnalyzing(false);
      onNext();
    }, 1800);
  };

  const handleVerifyClick = () => {
    setIsLinkVerified(true);
    setTimeout(() => {
      onNext();
    }, 450);
  };

  return (
    <div className={`guided-demo-walkthrough-overlay theme-${theme}`} data-theme={theme}>
      {/* Top Fixed Demo Bar */}
      <div className="guided-demo-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="guided-demo-badge">
            <Compass size={14} />
            <span>SIH Presentation Demo Tour</span>
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
          {/* STEP 1 — INTRODUCE THE PROBLEM (Structured Schedule World) */}
          {/* ========================================================================= */}
          {currentStepIndex === 0 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-schedule-list">
              <div className="demo-stage-header">
                <span className="demo-step-badge">THIS IS THE PLANNED PROJECT WORLD</span>
                <h2>Structured Baseline Project Schedule</h2>
                <p>
                  Large infrastructure projects contain thousands of structured schedule activities. Each activity is organized with standardized WBS codes, planned durations, and progress baselines.
                </p>
              </div>

              {/* Baseline Schedule Activity Table */}
              <div className="demo-schedule-card">
                <div className="demo-card-title-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} style={{ color: 'var(--brand-primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      Primavera P6 Baseline Schedule • Rev-03
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
                        <tr key={item.code} className={item.code === 'CW-101' ? 'highlight-row' : ''}>
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

              {/* Core Callout */}
              <div className="demo-callout-banner">
                <div className="callout-icon">💡</div>
                <div className="callout-body">
                  <strong>The Engineering Reality:</strong> This planned schedule is clean and structured. However, daily site execution generates unstructured reports that must be aligned back to these exact codes.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2 — SHOW THE REAL-WORLD SITE UPDATE */}
          {/* ========================================================================= */}
          {currentStepIndex === 1 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-unstructured-report">
              <div className="demo-stage-header">
                <span className="demo-step-badge warning">THE FIELD REALITY</span>
                <h2>Unstructured Daily Field Progress Report</h2>
                <p>
                  Actual progress from the site is submitted through daily text reports, mobile logs, or supervisor spreadsheets.
                </p>
              </div>

              {/* Side-by-side comparison */}
              <div className="demo-contrast-grid">
                {/* Left: Unstructured Site Report */}
                <div className="demo-contrast-card unstructured">
                  <div className="contrast-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} style={{ color: 'var(--warning)' }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Unstructured Field Update</span>
                    </div>
                    <span className="badge badge-warning">Site Log #09-122</span>
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

                {/* Right: The Question */}
                <div className="demo-contrast-card question-card">
                  <div className="question-icon-circle">
                    <HelpCircle size={32} style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center' }}>
                    &ldquo;Which schedule activity does this update belong to?&rdquo;
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
                    Across 5,000+ schedule activities, manual searching takes hours and leads to human error. ProjectPulse bridges this gap with deterministic AI.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3 — START ANALYSIS */}
          {/* ========================================================================= */}
          {currentStepIndex === 2 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-analyze-btn">
              <div className="demo-stage-header">
                <span className="demo-step-badge primary">AI HYBRID MATCHING ENGINE</span>
                <h2>Real-Time Analysis Pipeline</h2>
                <p>
                  ProjectPulse performs transparent hybrid matching: extracting domain terminology, detecting spatial location, and evaluating schedule candidates.
                </p>
              </div>

              <div className="analysis-sequence-card">
                {/* Input snippet */}
                <div className="analysis-input-preview">
                  <span className="preview-label">TARGET SITE UPDATE:</span>
                  <p>&ldquo;{DEMO_SCENARIO_1.updateText}&rdquo;</p>
                </div>

                {/* Sequence Checkmarks */}
                <div className="analysis-steps-list">
                  <div className={`analysis-step-item ${analysisProgress >= 1 ? 'done' : isAnalyzing ? 'running' : ''}`}>
                    <div className="step-check-icon">{analysisProgress >= 1 ? <Check size={14} /> : '1'}</div>
                    <span className="step-name">Extracting key engineering terminology</span>
                    {analysisProgress >= 1 && <span className="step-detail">(&quot;Cooling water&quot;, &quot;pipe section&quot;)</span>}
                  </div>

                  <div className={`analysis-step-item ${analysisProgress >= 2 ? 'done' : isAnalyzing && analysisProgress === 1 ? 'running' : ''}`}>
                    <div className="step-check-icon">{analysisProgress >= 2 ? <Check size={14} /> : '2'}</div>
                    <span className="step-name">Detecting location & workfront context</span>
                    {analysisProgress >= 2 && <span className="step-detail">(&quot;Unit-01 Pump Bay&quot;)</span>}
                  </div>

                  <div className={`analysis-step-item ${analysisProgress >= 3 ? 'done' : isAnalyzing && analysisProgress === 2 ? 'running' : ''}`}>
                    <div className="step-check-icon">{analysisProgress >= 3 ? <Check size={14} /> : '3'}</div>
                    <span className="step-name">Searching project schedule activities & WBS hierarchy</span>
                    {analysisProgress >= 3 && <span className="step-detail">(4 candidate milestones found)</span>}
                  </div>

                  <div className={`analysis-step-item ${analysisProgress >= 4 ? 'done' : isAnalyzing && analysisProgress === 3 ? 'running' : ''}`}>
                    <div className="step-check-icon">{analysisProgress >= 4 ? <Check size={14} /> : '4'}</div>
                    <span className="step-name">Performing hybrid semantic & structured matching</span>
                    {analysisProgress >= 4 && <span className="step-detail">(Discipline: Piping)</span>}
                  </div>

                  <div className={`analysis-step-item ${analysisProgress >= 5 ? 'done' : isAnalyzing && analysisProgress === 4 ? 'running' : ''}`}>
                    <div className="step-check-icon">{analysisProgress >= 5 ? <Check size={14} /> : '5'}</div>
                    <span className="step-name">Calculating multi-factor confidence scores</span>
                    {analysisProgress >= 5 && <span className="step-detail">(Keywords 50%, Discipline 20%, Area 15%, Fuzzy 15%)</span>}
                  </div>

                  <div className={`analysis-step-item ${analysisProgress >= 6 ? 'done' : isAnalyzing && analysisProgress === 5 ? 'running' : ''}`}>
                    <div className="step-check-icon">{analysisProgress >= 6 ? <Check size={14} /> : '6'}</div>
                    <span className="step-name">Ranking top candidate matches</span>
                    {analysisProgress >= 6 && <span className="step-detail success">Ready for planner review</span>}
                  </div>
                </div>

                {/* Interactive Trigger */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={handleManualAnalyzeClick}
                    disabled={isAnalyzing}
                    style={{ padding: '0.65rem 1.75rem', fontSize: '0.95rem', fontWeight: 800 }}
                  >
                    <Sparkles size={18} />
                    <span>{isAnalyzing ? 'Analyzing Site Update...' : 'Re-Run Analysis Sequence'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4 — SHOW CANDIDATE MATCHES */}
          {/* ========================================================================= */}
          {currentStepIndex === 3 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-candidate-matches">
              <div className="demo-stage-header">
                <span className="demo-step-badge success">EXPLAINABLE EVIDENCE BREAKDOWN</span>
                <h2>Ranked Schedule Activity Candidates</h2>
                <p>
                  ProjectPulse combines semantic understanding with structured project context. It never outputs a black-box guess.
                </p>
              </div>

              <div className="candidate-results-grid">
                {/* Candidates List */}
                <div className="candidate-cards-col">
                  <div className="section-subtitle">BEST MATCHES</div>
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
                          {cand.confidence}% Confidence
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

                {/* Why this match explainability card */}
                <div className="explainability-sidebar-card">
                  <div className="sidebar-header-title">
                    <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
                    <span>WHY THIS MATCH?</span>
                  </div>

                  <div className="explainability-items">
                    <div className="explain-item">
                      <div className="explain-key">Cooling Water</div>
                      <div className="explain-val">Strong terminology match against P6 activity name</div>
                    </div>
                    <div className="explain-item">
                      <div className="explain-key">Pipeline / Pipe</div>
                      <div className="explain-val">Activity context & discipline alignment (Piping)</div>
                    </div>
                    <div className="explain-item">
                      <div className="explain-key">Pump Bay</div>
                      <div className="explain-val">Location context match (Unit-01 Pump Bay)</div>
                    </div>
                    <div className="explain-item">
                      <div className="explain-key">Erected</div>
                      <div className="explain-val">Installation activity context matches erection stage</div>
                    </div>
                  </div>

                  <div className="explainability-summary">
                    &ldquo;ProjectPulse combines semantic understanding with structured project context.&rdquo;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5 — SHOW HIGH-CONFIDENCE DECISION */}
          {/* ========================================================================= */}
          {currentStepIndex === 4 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-verify-btn">
              <div className="demo-stage-header">
                <span className="demo-step-badge success">HIGH CONFIDENCE MATCH (91%)</span>
                <h2>Verifiable AI Recommendation Gate</h2>
                <p>
                  When sufficient evidence exists, ProjectPulse can confidently suggest the most relevant schedule activity and provide 1-click planner verification.
                </p>
              </div>

              <div className="high-confidence-gate-card">
                <div className="gate-status-banner">
                  <div className="status-score-block">
                    <span className="score-num">91%</span>
                    <span className="score-label">MATCH CONFIDENCE</span>
                  </div>
                  <div className="status-info-block">
                    <div className="status-title">STATUS: HIGH CONFIDENCE</div>
                    <div className="status-desc">Suggested Activity: <strong>CW-101 — Install Cooling Water Line</strong></div>
                  </div>
                </div>

                <div className="verification-details-grid">
                  <div className="detail-box">
                    <span className="box-title">Source Field Reality</span>
                    <p className="box-content">&ldquo;{DEMO_SCENARIO_1.updateText}&rdquo;</p>
                  </div>

                  <div className="detail-box match-highlight">
                    <span className="box-title">Target Baseline Activity</span>
                    <p className="box-content">
                      <strong>CW-101 • Install Cooling Water Line</strong>
                      <br />
                      WBS: 2.1.4.1 | Area: Unit-01 Pump Bay
                    </p>
                  </div>
                </div>

                {/* Highlighted Action Button */}
                <div className="gate-action-container">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={handleVerifyClick}
                    style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 800 }}
                  >
                    <CheckCircle2 size={20} />
                    <span>Verify Link & Commit Connection</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 6 — SHOW THE VERIFIED CONNECTION */}
          {/* ========================================================================= */}
          {currentStepIndex === 5 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-verified-bridge">
              <div className="demo-stage-header">
                <span className="demo-step-badge success">LINK VERIFIED</span>
                <h2>The Connected Project Reality</h2>
                <p>
                  ProjectPulse has successfully bridged raw field evidence into the structured project schedule baseline.
                </p>
              </div>

              {/* Visual Bridge Diagram */}
              <div className="verified-bridge-container">
                {/* Node 1: Real Field Information */}
                <div className="bridge-node field-node">
                  <div className="node-tag">REAL FIELD INFORMATION</div>
                  <div className="node-icon">📋</div>
                  <div className="node-title">Daily Site Progress Log</div>
                  <div className="node-text">&ldquo;{DEMO_SCENARIO_1.updateText}&rdquo;</div>
                  <span className="node-meta">Supervisor: Rajesh Kumar • 09:10 AM</span>
                </div>

                {/* Middle Connection Line */}
                <div className="bridge-connector-line">
                  <div className="connector-pulse-beam" />
                  <div className="connector-badge">
                    <Check size={16} />
                    <span>LINK VERIFIED</span>
                  </div>
                </div>

                {/* Node 2: Structured Project Schedule */}
                <div className="bridge-node schedule-node">
                  <div className="node-tag">STRUCTURED PROJECT SCHEDULE</div>
                  <div className="node-icon">📊</div>
                  <div className="node-title">CW-101 • Install Cooling Water Line</div>
                  <div className="node-text">WBS 2.1.4.1 • Unit-01 Pump Bay</div>
                  <span className="node-meta">Primavera P6 Active Production Baseline</span>
                </div>
              </div>

              <div className="demo-callout-banner success">
                <div className="callout-icon">🎯</div>
                <div className="callout-body">
                  <strong>The Core Value Demonstrated:</strong> The manual bottleneck of reading field logs and searching schedule activities is replaced by an instant, explainable, and verifiable link.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 7 — SHOW PLANNED VS ACTUAL PROGRESS */}
          {/* ========================================================================= */}
          {currentStepIndex === 6 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-progress-intelligence">
              <div className="demo-stage-header">
                <span className="demo-step-badge warning">SCHEDULE INTELLIGENCE</span>
                <h2>Planned vs Actual Progress Intelligence</h2>
                <p>
                  Once field updates are connected to schedule activities, actual project progress is automatically compared against the original project plan.
                </p>
              </div>

              <div className="progress-intelligence-card">
                <div className="intelligence-activity-header">
                  <div>
                    <span className="code-badge">CW-101</span>
                    <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                      Install Cooling Water Line (Unit-01 Pump Bay)
                    </h3>
                  </div>
                  <div className="variance-alert-badge">
                    <AlertTriangle size={16} />
                    <span>STATUS: BEHIND SCHEDULE (-20% Gap)</span>
                  </div>
                </div>

                {/* Progress Comparison Bars */}
                <div className="progress-comparison-section">
                  {/* Planned Bar */}
                  <div className="progress-row">
                    <div className="progress-row-header">
                      <span className="row-label">PLANNED PROGRESS (Baseline Rev-03)</span>
                      <span className="row-val planned">80%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill planned" style={{ width: '80%' }}>
                        <span className="fill-text">Target: 80%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actual Bar */}
                  <div className="progress-row">
                    <div className="progress-row-header">
                      <span className="row-label">ACTUAL PROGRESS (From Verified Field Updates)</span>
                      <span className="row-val actual">60%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill actual" style={{ width: '60%' }}>
                        <span className="fill-text">Verified: 60%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Insights Grid */}
                <div className="schedule-insights-grid">
                  <div className="insight-card">
                    <span className="insight-title">Schedule Variance (SV)</span>
                    <span className="insight-num negative">-20.0%</span>
                    <span className="insight-sub">Requires alignment acceleration</span>
                  </div>
                  <div className="insight-card">
                    <span className="insight-title">Critical Path Status</span>
                    <span className="insight-num warning">Near Critical</span>
                    <span className="insight-sub">Total float reduced by 4 days</span>
                  </div>
                  <div className="insight-card">
                    <span className="insight-title">Verified Updates Count</span>
                    <span className="insight-num">3 Logs</span>
                    <span className="insight-sub">100% provenance verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 8 — SHOW AN AMBIGUOUS UPDATE */}
          {/* ========================================================================= */}
          {currentStepIndex === 7 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-ambiguous-card">
              <div className="demo-stage-header">
                <span className="demo-step-badge warning">UNCERTAINTY RECOGNITION</span>
                <h2>Scenario 2 — The Ambiguous Site Update</h2>
                <p>
                  What happens when site teams provide sparse information? ProjectPulse recognizes uncertainty and never guesses blindly.
                </p>
              </div>

              <div className="ambiguous-scenario-card">
                {/* Vague Input */}
                <div className="vague-update-header">
                  <span className="badge badge-warning">NEW SITE UPDATE</span>
                  <div className="vague-quote-text">&ldquo;{DEMO_SCENARIO_2.updateText}&rdquo;</div>
                  <div className="vague-question-tag">
                    <HelpCircle size={15} />
                    <span>{DEMO_SCENARIO_2.question}</span>
                  </div>
                </div>

                {/* Low confidence matches */}
                <div className="ambiguous-matches-list">
                  <div className="section-subtitle">POSSIBLE MATCHES (INSUFFICIENT CONTEXT)</div>
                  {DEMO_SCENARIO_2.candidates.map(cand => (
                    <div key={cand.activityCode} className="ambiguous-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span className="rank-badge">#{cand.rank}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>[{cand.activityCode}] {cand.activityName}</span>
                      </div>
                      <div className="confidence-meter medium">{cand.confidence}%</div>
                    </div>
                  ))}
                </div>

                {/* Uncertainty Banner */}
                <div className="uncertainty-banner">
                  <div className="banner-badge">STATUS: REVIEW REQUIRED</div>
                  <div className="banner-text">
                    <strong>ProjectPulse recognizes uncertainty.</strong>
                    <br />
                    When context is insufficient, the decision is routed to a human planner rather than risking inaccurate schedule reporting.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 9 — HUMAN REVIEW WORKBENCH */}
          {/* ========================================================================= */}
          {currentStepIndex === 8 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-review-workbench">
              <div className="demo-stage-header">
                <span className="demo-step-badge primary">HUMAN-IN-THE-LOOP GOVERNANCE</span>
                <h2>Human Review Workbench</h2>
                <p>
                  AI RECOMMENDS. HUMAN DECIDES. The planner retains full authority with 4 explicit, structured actions.
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
                  <span className="badge badge-warning">Review Required (52% Top Match)</span>
                </div>

                {/* 4 Action Buttons */}
                <div className="planner-actions-quad">
                  <button
                    type="button"
                    className={`planner-action-btn ${selectedReviewAction === 'approve' ? 'active' : ''}`}
                    onClick={() => setSelectedReviewAction('approve')}
                  >
                    <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                    <div className="btn-text-block">
                      <strong>Approve Suggested Match</strong>
                      <span>Link to CW-101 (Install Cooling Water Line)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`planner-action-btn ${selectedReviewAction === 'relink' ? 'active' : ''}`}
                    onClick={() => setSelectedReviewAction('relink')}
                  >
                    <Search size={18} style={{ color: 'var(--brand-primary)' }} />
                    <div className="btn-text-block">
                      <strong>Select Different Activity</strong>
                      <span>Choose from master WBS schedule search</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`planner-action-btn ${selectedReviewAction === 'unplanned' ? 'active' : ''}`}
                    onClick={() => setSelectedReviewAction('unplanned')}
                  >
                    <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                    <div className="btn-text-block">
                      <strong>Mark as Unplanned Work</strong>
                      <span>Flag as out-of-scope work requiring variation order</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`planner-action-btn ${selectedReviewAction === 'reject' ? 'active' : ''}`}
                    onClick={() => setSelectedReviewAction('reject')}
                  >
                    <X size={18} style={{ color: 'var(--danger)' }} />
                    <div className="btn-text-block">
                      <strong>Reject Update</strong>
                      <span>Return report to supervisor for clarification</span>
                    </div>
                  </button>
                </div>

                {selectedReviewAction && (
                  <div className="action-feedback-toast">
                    <Check size={14} />
                    <span>Action selected: <strong>{selectedReviewAction.toUpperCase()}</strong>. Decision logged to immutable audit trail.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 10 — SHOW UNPLANNED WORK */}
          {/* ========================================================================= */}
          {currentStepIndex === 9 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-unplanned-work">
              <div className="demo-stage-header">
                <span className="demo-step-badge warning">SCOPE VARIANCE DETECTION</span>
                <h2>Scenario 3 — Unplanned Work Detection</h2>
                <p>
                  Instead of forcing every update into an existing schedule activity, ProjectPulse identifies updates that represent work outside the original plan.
                </p>
              </div>

              <div className="unplanned-scenario-card">
                {/* Incident Report */}
                <div className="unplanned-report-box">
                  <span className="badge badge-danger">OUT-OF-SCOPE REPORT</span>
                  <p className="unplanned-text">&ldquo;{DEMO_SCENARIO_3.updateText}&rdquo;</p>
                </div>

                <div className="unplanned-result-split">
                  {/* Analysis Result */}
                  <div className="unplanned-box">
                    <div className="box-tagline">ANALYSIS RESULT</div>
                    <div className="no-match-alert">
                      <AlertOctagon size={24} style={{ color: 'var(--warning)' }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--warning)' }}>
                          NO RELIABLE SCHEDULE MATCH FOUND
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Confidence score across all baseline activities &lt; 25%
                        </div>
                      </div>
                    </div>

                    <div className="possible-causes-list">
                      <span className="causes-title">POSSIBLE CLASSIFICATIONS:</span>
                      {DEMO_SCENARIO_3.causePoints.map((cause, cIdx) => (
                        <div key={cIdx} className="cause-item">
                          <span className="bullet">•</span>
                          <span>{cause}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Planner Routing */}
                  <div className="unplanned-action-box">
                    <div className="box-tagline">GOVERNANCE ACTION</div>
                    <h4 style={{ color: 'var(--text-primary)', margin: '0.5rem 0' }}>⚠ CLASSIFIED AS UNPLANNED WORK</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Unplanned work is flagged immediately for project variation control, contractor claim assessment, and scope change management.
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
          {/* STEP 11 — SHOW THE AUDIT TRAIL */}
          {/* ========================================================================= */}
          {currentStepIndex === 10 && (
            <div className="demo-step-pane animate-fade-in" id="demo-target-audit-timeline">
              <div className="demo-stage-header">
                <span className="demo-step-badge primary">IMMUTABLE RECORD OF EXECUTION</span>
                <h2>Complete Chronological Audit Trail</h2>
                <p>
                  Every field update, system recommendation, human verification, and schedule recalculation is preserved in an immutable, traceable log.
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

                <div className="audit-provenance-footer">
                  <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
                  <span>
                    <strong>End-to-End Governance:</strong> Original Update → System Analysis → AI Recommendation → Confidence Scoring → Human Decision → Final Verified Result.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FINAL DEMO SUMMARY SCREEN */}
          {/* ========================================================================= */}
          {isSummaryScreen && (
            <div className="demo-step-pane animate-fade-in">
              <div className="demo-summary-hero">
                <div className="summary-trophy-icon">🏆</div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.5rem 0' }}>
                  The ProjectPulse Core Architecture
                </h1>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 1.5rem' }}>
                  ProjectPulse converts fragmented field updates into structured, traceable schedule intelligence.
                </p>

                {/* 5 Core Concepts Grid */}
                <div className="summary-pillars-grid">
                  <div className="pillar-card">
                    <span className="pillar-num">01</span>
                    <h3 className="pillar-title">Hybrid Matching</h3>
                    <p className="pillar-desc">Combines semantic language with structured WBS & location context.</p>
                  </div>

                  <div className="pillar-card">
                    <span className="pillar-num">02</span>
                    <h3 className="pillar-title">Confidence Scoring</h3>
                    <p className="pillar-desc">Multi-factor mathematical breakdown (Keywords, Discipline, Area, Similarity).</p>
                  </div>

                  <div className="pillar-card">
                    <span className="pillar-num">03</span>
                    <h3 className="pillar-title">Human Review</h3>
                    <p className="pillar-desc">Recognizes uncertainty and routes low confidence to human planners.</p>
                  </div>

                  <div className="pillar-card">
                    <span className="pillar-num">04</span>
                    <h3 className="pillar-title">Schedule Intelligence</h3>
                    <p className="pillar-desc">Turns verified connections into real-time Planned vs Actual progress.</p>
                  </div>

                  <div className="pillar-card">
                    <span className="pillar-num">05</span>
                    <h3 className="pillar-title">Audit Trail</h3>
                    <p className="pillar-desc">Full traceability and provenance from field submission to schedule sync.</p>
                  </div>
                </div>

                {/* Final Value Proposition Banner */}
                <div className="summary-tagline-box">
                  &ldquo;We automate the search, not the planner&apos;s judgment.&rdquo;
                </div>

                {/* Final Buttons */}
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
                    <span>Exit Demo & Explore Workspace</span>
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
              <span className="sidecard-tag">PRESENTER CHEATSHEET</span>
              <h3>{currentStep.title}</h3>
              <p className="sidecard-tagline">{currentStep.tagline}</p>
            </div>

            <div className="sidecard-qa-list">
              <div className="sidecard-qa-block">
                <span className="qa-label">1. What is happening right now:</span>
                <p className="qa-text">{currentStep.whatIsHappening}</p>
              </div>

              <div className="sidecard-qa-block">
                <span className="qa-label">2. Why it matters:</span>
                <p className="qa-text">{currentStep.whyItMatters}</p>
              </div>

              <div className="sidecard-qa-block">
                <span className="qa-label">3. What to interact with next:</span>
                <p className="qa-text highlight">{currentStep.whatToInteract}</p>
              </div>

              <div className="sidecard-qa-block">
                <span className="qa-label">4. What the audience should notice:</span>
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
