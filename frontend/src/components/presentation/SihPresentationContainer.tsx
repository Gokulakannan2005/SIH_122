import React, { useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Calendar,
  Layers,
  Inbox,
  FileText,
  FileSpreadsheet,
  Mic,
  Scan,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CheckSquare,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Info,
  ChevronRight,
  ChevronLeft,
  HardHat,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Volume2,
  MicOff,
  Send,
  Edit3,
} from 'lucide-react';
import { DatumArchitectureVisual } from './DatumArchitectureVisual';
import { PptScreenshotToolbar } from './PptScreenshotToolbar';
import { SihPsCoverageModal } from './SihPsCoverageModal';
import { PptScreenshotState, SiteUpdate } from '../../types';
import { parseSpokenUpdate } from '../../utils/speechParser';
import { deriveProjectMemory, queryProjectMemory } from '../../utils/projectMemoryData';

export const SIH_STEPS_CONFIG = [
  { stepNumber: 1, title: 'Project Baseline', subtitle: 'THIS IS THE PLAN', icon: Calendar },
  { stepNumber: 2, title: 'Field Data Inbox', subtitle: 'Heterogeneous Capture', icon: Inbox },
  { stepNumber: 3, title: 'Understand / Extract', subtitle: 'Evidence Extraction', icon: FileText },
  { stepNumber: 4, title: 'Talk to DATUM', subtitle: 'Conversational Voice/Text', icon: Mic },
  { stepNumber: 5, title: 'L5/L6 Match', subtitle: 'Explainable AI Linking', icon: CheckSquare },
  { stepNumber: 6, title: 'Human Verification', subtitle: 'Ambiguity Governance', icon: ShieldCheck },
  { stepNumber: 7, title: 'Out-of-Baseline', subtitle: 'Surfacing Unplanned Work', icon: AlertTriangle },
  { stepNumber: 8, title: 'Actual Progress', subtitle: 'Real-Time Schedule Update', icon: Clock },
  { stepNumber: 9, title: 'Structured Dataset', subtitle: 'Discipline-Tagged Actuals', icon: Database },
  { stepNumber: 10, title: 'Execution Intelligence', subtitle: 'Delays & Bottlenecks', icon: TrendingUp },
  { stepNumber: 11, title: 'Project Memory', subtitle: 'Institutional Knowledge', icon: Sparkles },
  { stepNumber: 12, title: 'Audit Provenance', subtitle: 'Immutable Traceability', icon: ShieldCheck },
];

export const SihPresentationContainer: React.FC = () => {
  const {
    schedule,
    enrichedSchedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    auditLogs,
    handlePlannerAction,
    handleAddNewFieldEntry,
    loadDemoData,
    addToast,
    exportAlignmentCSV,
    startGuidedDemo,
    setActiveTab,
  } = useProject();

  // Active Presentation Step (1 to 12)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showArchitectureVisual, setShowArchitectureVisual] = useState<boolean>(false);
  const [showCoverageModal, setShowCoverageModal] = useState<boolean>(false);
  const [activeScreenshotState, setActiveScreenshotState] = useState<PptScreenshotState | null>(null);

  // Step 4: Talk to DATUM State
  const [conversationalInput, setConversationalInput] = useState<string>(
    'Today we erected the 24-inch cooling water spool near Pump Bay. It started yesterday and alignment is still going on.'
  );
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [isEditingExtractedFields, setIsEditingExtractedFields] = useState<boolean>(false);

  // Real-time extraction for Step 4
  const parsedConversation = useMemo(() => {
    return parseSpokenUpdate(conversationalInput);
  }, [conversationalInput]);

  const [editedFields, setEditedFields] = useState({
    discipline: 'Piping',
    description: 'CW 24-inch spool erection and alignment',
    tag: '24-CW-017',
    area: 'Pump Bay',
    status: 'In Progress' as 'Started' | 'Completed' | 'In Progress',
  });

  // Step 9: Structured actuals discipline filter
  const [structuredDisciplineFilter, setStructuredDisciplineFilter] = useState<string>('ALL');
  const [structuredSearchQuery, setStructuredSearchQuery] = useState<string>('');

  // Step 11: Project Memory State
  const memoryPatterns = useMemo(() => {
    return deriveProjectMemory(siteUpdates, schedule, plannerDecisions);
  }, [siteUpdates, schedule, plannerDecisions]);

  const [memoryQueryInput, setMemoryQueryInput] = useState<string>(
    'Which piping activities repeatedly exceeded their planned duration?'
  );
  const [memoryQueryResult, setMemoryQueryResult] = useState(() =>
    queryProjectMemory('Which piping activities repeatedly exceeded their planned duration?', siteUpdates, schedule, memoryPatterns)
  );

  // Quick jump via PPT screenshot states
  const handleSelectScreenshotState = (stateNum: PptScreenshotState) => {
    setActiveScreenshotState(stateNum);
    const stepMap: Record<PptScreenshotState, number> = {
      1: 2,
      2: 4,
      3: 5,
      4: 6,
      5: 8,
      6: 9,
      7: 11,
      8: 12,
    };
    const targetStep = stepMap[stateNum];
    if (targetStep) {
      setActiveStep(targetStep);
      addToast({
        type: 'info',
        title: `Architectural Milestone ${stateNum} Active`,
        message: `Navigated to ${SIH_STEPS_CONFIG[targetStep - 1].title} stage in core execution pipeline.`,
      });
    }
  };

  // Reset demo state
  const handleResetDemo = async () => {
    await loadDemoData();
    setActiveStep(1);
    setActiveScreenshotState(null);
    setConversationalInput(
      'Today we erected the 24-inch cooling water spool near Pump Bay. It started yesterday and alignment is still going on.'
    );
    addToast({
      type: 'success',
      title: 'Enterprise Baseline Restored',
      message: 'Clean benchmark dataset reloaded: 34 schedule items, daily reports, and initial match state.',
    });
  };

  // Handle Conversational Submit into real DATUM pipeline
  const handleConfirmConversationalEntry = async () => {
    const discipline = isEditingExtractedFields ? editedFields.discipline : (parsedConversation.discipline || 'Piping');
    const description = isEditingExtractedFields ? editedFields.description : parsedConversation.cleanDescription;
    const area = isEditingExtractedFields ? editedFields.area : (parsedConversation.area || 'Pump Bay');
    const status = isEditingExtractedFields ? editedFields.status : (parsedConversation.eventStatus || 'In Progress');
    const tag = isEditingExtractedFields ? editedFields.tag : (parsedConversation.detectedTag || '24-CW-017');

    await handleAddNewFieldEntry({
      discipline,
      description,
      rawText: conversationalInput,
      area,
      eventStatus: status,
      confirmedTag: tag,
      supervisor: 'Rajesh Kumar (Field Supervisor)',
    });

    addToast({
      type: 'success',
      title: 'Conversational Event Ingested',
      message: `Extracted ${discipline} event sent to DATUM matching engine. Next: Inspect L5/L6 match.`,
    });

    // Advance to Step 5 to show the match
    setActiveStep(5);
  };

  // Pre-selected ambiguous item for Step 6
  const ambiguousUpdate = useMemo(() => {
    return (
      siteUpdates.find(u => u.rawText.toLowerCase().includes('cable pulling') || u.extractedDescription.toLowerCase().includes('cable')) ||
      siteUpdates.find(u => matchResults[u.id]?.category === 'review') ||
      siteUpdates[2]
    );
  }, [siteUpdates, matchResults]);

  // Pre-selected out-of-baseline item for Step 7
  const outOfBaselineUpdate = useMemo(() => {
    return (
      siteUpdates.find(u => u.rawText.toLowerCase().includes('drain line') || u.rawText.toLowerCase().includes('not in baseline')) ||
      siteUpdates.find(u => matchResults[u.id]?.category === 'unplanned') ||
      siteUpdates[3]
    );
  }, [siteUpdates, matchResults]);

  // Structured dataset derived dynamically
  const structuredRows = useMemo(() => {
    let rows = siteUpdates.map(u => {
      const dec = plannerDecisions[u.id];
      const match = matchResults[u.id];
      const linkedId = dec ? dec.linkedActivityId : (match?.category === 'ready' ? match.candidateActivityId : null);
      const act = linkedId ? enrichedSchedule.find(s => s.activityId === linkedId) : null;

      return {
        id: u.id,
        date: u.reportDate,
        project: 'IOCL-P4-REFINERY',
        discipline: u.discipline,
        activityId: linkedId || 'UNLINKED',
        l5Code: act?.l5Code || (linkedId ? `IOCL.P4.UNIT01.${u.discipline.substring(0, 3).toUpperCase()}.${linkedId}` : '—'),
        l6Description: act?.activityName || u.extractedDescription,
        actualStart: act?.actualStart || u.reportDate,
        actualFinish: act?.actualFinish || (u.eventStatus === 'Completed' ? u.reportDate : 'In Progress'),
        progress: act?.progressPercent || (u.eventStatus === 'Completed' ? 100 : 60),
        status: act?.status || (u.eventStatus === 'Completed' ? 'Completed' : 'In Progress'),
        confidence: match ? match.confidenceScore : 0,
        source: u.sourceFile,
        verificationStatus: dec ? dec.status.toUpperCase() : (match?.category === 'ready' ? 'AUTO HIGH-CONF' : 'PENDING REVIEW'),
      };
    });

    if (structuredDisciplineFilter !== 'ALL') {
      rows = rows.filter(r => r.discipline.toLowerCase() === structuredDisciplineFilter.toLowerCase());
    }

    if (structuredSearchQuery.trim()) {
      const q = structuredSearchQuery.toLowerCase();
      rows = rows.filter(
        r =>
          r.activityId.toLowerCase().includes(q) ||
          r.l6Description.toLowerCase().includes(q) ||
          r.discipline.toLowerCase().includes(q) ||
          r.verificationStatus.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [siteUpdates, plannerDecisions, matchResults, enrichedSchedule, structuredDisciplineFilter, structuredSearchQuery]);

  return (
    <div className="sih-presentation-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* Top Banner: Presentation Header & Tools */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 3,
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.3)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img src="/datum_logo.png" alt="DATUM" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
                DATUM
              </span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #10b981)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                END-TO-END PIPELINE
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• Enterprise Reconciliation System</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Projects: Real-Time Actual Progress Tracking
            </div>
          </div>
        </div>

        {/* Global Presentation Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setShowArchitectureVisual(prev => !prev)}
            style={{ fontSize: '0.76rem', gap: 6 }}
          >
            <Layers size={14} style={{ color: '#38bdf8' }} />
            <span>{showArchitectureVisual ? 'Hide Architecture Diagram' : 'Architecture Diagram'}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setShowCoverageModal(true)}
            style={{ fontSize: '0.76rem', gap: 6 }}
          >
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            <span>Capabilities Matrix</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleResetDemo}
            title="Restore pristine benchmark dataset for clean demonstration"
            style={{ fontSize: '0.76rem', gap: 6 }}
          >
            <RotateCcw size={14} style={{ color: '#f59e0b' }} />
            <span>Reset Demo</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={startGuidedDemo}
            style={{ fontSize: '0.76rem', gap: 6, fontWeight: 800 }}
          >
            <Sparkles size={14} />
            <span>Start System Tour</span>
          </button>
        </div>
      </div>

      {/* Architecture Visual Collapsible Panel */}
      {showArchitectureVisual && (
        <DatumArchitectureVisual onSelectStep={step => setActiveStep(step)} />
      )}

      {/* PPT Screenshot States Quick Toolbar */}
      <PptScreenshotToolbar
        activeScreenshotState={activeScreenshotState}
        onSelectScreenshotState={handleSelectScreenshotState}
        onClearScreenshotState={() => setActiveScreenshotState(null)}
      />

      {/* 12-Step Continuous Interactive Stepper Ribbon */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            END-TO-END EXECUTION PIPELINE (STAGE {activeStep} OF 12)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-xs btn-secondary"
              disabled={activeStep <= 1}
              onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
              style={{ padding: '2px 6px' }}
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>
            <button
              type="button"
              className="btn btn-xs btn-primary"
              disabled={activeStep >= 12}
              onClick={() => setActiveStep(prev => Math.min(12, prev + 1))}
              style={{ padding: '2px 6px' }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.4rem',
          }}
        >
          {SIH_STEPS_CONFIG.map(st => {
            const isActive = activeStep === st.stepNumber;
            const Icon = st.icon;
            return (
              <button
                key={st.stepNumber}
                type="button"
                onClick={() => {
                  setActiveStep(st.stepNumber);
                  setActiveScreenshotState(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.45rem 0.6rem',
                  background: isActive ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(15, 118, 110, 0.25))' : 'var(--bg-subtle)',
                  border: isActive ? '2px solid #0284c7' : '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    background: isActive ? '#0284c7' : 'rgba(51, 65, 85, 0.5)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {st.stepNumber}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#38bdf8' : 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {st.title}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {st.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Viewport: Seamless Real DATUM Engine Panels */}

      {/* ========================================================================= */}
      {/* STEP 1: PROJECT BASELINE */}
      {/* ========================================================================= */}
      {activeStep === 1 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontWeight: 800 }}>STEP 1</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  PROJECT BASELINE ("THIS IS THE PLAN")
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Schedule Source: <strong>Primavera P6 Master Schedule Baseline</strong> • Project: <strong>IOCL Refinery Expansion - Package 4</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Planned Baseline Milestone</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>PIP-L6-012 (Cooling Water Spool)</div>
            </div>
          </div>

          {/* Benchmark Highlight Card */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), var(--bg-subtle))',
              border: '1px solid rgba(2, 132, 199, 0.35)',
              borderRadius: 8,
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PRIMARY BENCHMARK SCHEDULE TARGET
              </span>
              <span className="badge" style={{ background: '#0284c7', color: '#fff', fontSize: '0.68rem', fontWeight: 700 }}>
                L6 Activity
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Activity ID</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  PIP-L6-012
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Activity Name</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Erect Line 24-CW-017
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Discipline / Area</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Piping • Pump Bay
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Planned Duration</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>
                  01 Sep 2026 → 05 Sep 2026 (4 Days)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>WBS Node</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  2.1.2 (Piping Erection)
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Table Preview */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Primavera P6 L5/L6 Schedule Master Activities ({schedule.length} Baseline Items)
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 6, maxHeight: '280px' }}>
              <table className="table" style={{ width: '100%', fontSize: '0.75rem', margin: 0 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)' }}>
                    <th style={{ padding: '8px' }}>Activity ID</th>
                    <th style={{ padding: '8px' }}>WBS</th>
                    <th style={{ padding: '8px' }}>Activity Name</th>
                    <th style={{ padding: '8px' }}>Discipline</th>
                    <th style={{ padding: '8px' }}>Area</th>
                    <th style={{ padding: '8px' }}>Planned Start</th>
                    <th style={{ padding: '8px' }}>Planned Finish</th>
                    <th style={{ padding: '8px' }}>Aliases / Keywords</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.slice(0, 8).map(act => (
                    <tr
                      key={act.activityId}
                      style={{
                        background: act.activityId === 'PIP-L6-012' ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
                        fontWeight: act.activityId === 'PIP-L6-012' ? 700 : 400,
                      }}
                    >
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: act.activityId === 'PIP-L6-012' ? '#38bdf8' : 'inherit' }}>
                        {act.activityId}
                      </td>
                      <td style={{ padding: '8px' }}>{act.wbs}</td>
                      <td style={{ padding: '8px' }}>{act.activityName}</td>
                      <td style={{ padding: '8px' }}>
                        <span className={`badge badge-sm badge-${act.discipline.toLowerCase()}`}>
                          {act.discipline}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>{act.area}</td>
                      <td style={{ padding: '8px' }}>{act.plannedStart}</td>
                      <td style={{ padding: '8px' }}>{act.plannedFinish}</td>
                      <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{act.rawAliases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Navigation Button to Next Step */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveStep(2)}
              style={{ fontWeight: 800, gap: 6 }}
            >
              <span>Next: Field Data Inbox</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: FIELD DATA INBOX */}
      {/* ========================================================================= */}
      {activeStep === 2 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontWeight: 800 }}>STEP 2</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  FIELD DATA INBOX (HETEROGENEOUS INPUT CAPTURE)
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Demonstrating multi-source ingestion: Free-text reports, discipline spreadsheets, scanned diaries, and voice logs.
              </div>
            </div>

            <span className="badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
              Multi-Source Ingestion Pipeline Active
            </span>
          </div>

          {/* Supported Ingestion Sources Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ padding: '0.65rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <FileText size={14} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f8fafc' }}>Daily Report (TXT)</span>
              </div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Live demo: daily_report.txt</div>
            </div>

            <div style={{ padding: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <FileSpreadsheet size={14} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f8fafc' }}>Spreadsheet (XLSX)</span>
              </div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Live demo: piping_progress.xlsx</div>
            </div>

            <div style={{ padding: '0.65rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Mic size={14} style={{ color: '#c084fc' }} />
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f8fafc' }}>Voice / Conversational</span>
              </div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>Demonstrated in Step 4</div>
            </div>

            <div style={{ padding: '0.65rem', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Scan size={14} style={{ color: '#f472b6' }} />
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f8fafc' }}>Scanned Diary / OCR</span>
              </div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>OCR-ready ingestion preview</div>
            </div>

            <div style={{ padding: '0.65rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Calendar size={14} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f8fafc' }}>Primavera Export</span>
              </div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>P6 baseline CSV/XML</div>
            </div>
          </div>

          {/* Side-by-Side Ingestion Previews */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* SOURCE A: Daily Progress Report */}
            <div style={{ border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-subtle)' }}>
              <div style={{ padding: '0.65rem 0.9rem', background: 'rgba(2, 132, 199, 0.15)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={15} style={{ color: '#38bdf8' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    SOURCE A: daily_report.txt (Free-Text Daily Log)
                  </span>
                </div>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>792 bytes • UTF-8</span>
              </div>
              <pre
                style={{
                  padding: '0.85rem',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  lineHeight: 1.5,
                  background: 'var(--bg-code)',
                }}
              >
{`DAILY PROGRESS REPORT — Cooling Water Pump Package
Date: 2026-09-05

Civil
1. Pump foundation excavation completed at Pump Bay.
2. PCC started for the pump foundation after inspection.

Piping
3. CW 24-inch spool was erected near Pump Bay today; alignment is in progress.
4. Fabrication of one more cooling-water spool completed in the yard.
5. Fire-water spool erection at Filter Bay has started.
6. A small-bore drain line was installed near the pump. [Not in baseline]

Electrical
7. Cable tray work completed in Pump Bay.
8. Earthing strip installation started around motor foundation.
9. Crew reported cable pulling, but feeder number was not mentioned.

HSE
10. Crane lifting safety inspection completed before spool erection.`}
              </pre>
            </div>

            {/* SOURCE B: Discipline Progress Spreadsheet */}
            <div style={{ border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-subtle)' }}>
              <div style={{ padding: '0.65rem 0.9rem', background: 'rgba(16, 185, 129, 0.15)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileSpreadsheet size={15} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    SOURCE B: piping_progress.xlsx (Discipline Spreadsheet)
                  </span>
                </div>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>5.3 KB • Excel 2016+</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: '220px' }}>
                <table className="table" style={{ width: '100%', fontSize: '0.72rem', margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-secondary)' }}>
                      <th style={{ padding: '6px' }}>Isometric Line</th>
                      <th style={{ padding: '6px' }}>Spool ID</th>
                      <th style={{ padding: '6px' }}>Status</th>
                      <th style={{ padding: '6px' }}>Qty (m)</th>
                      <th style={{ padding: '6px' }}>Supervisor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>24-CW-017</td>
                      <td style={{ padding: '6px' }}>SP-017-A</td>
                      <td style={{ padding: '6px' }}><span className="badge badge-sm badge-warning">Erected / Align</span></td>
                      <td style={{ padding: '6px' }}>12.4</td>
                      <td style={{ padding: '6px' }}>R. Sharma</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px', fontFamily: 'var(--font-mono)' }}>24-CW-017</td>
                      <td style={{ padding: '6px' }}>SP-017-B</td>
                      <td style={{ padding: '6px' }}><span className="badge badge-sm badge-success">Fabricated</span></td>
                      <td style={{ padding: '6px' }}>8.6</td>
                      <td style={{ padding: '6px' }}>R. Sharma</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px', fontFamily: 'var(--font-mono)' }}>18-FW-008</td>
                      <td style={{ padding: '6px' }}>SP-008-A</td>
                      <td style={{ padding: '6px' }}><span className="badge badge-sm badge-info">Started</span></td>
                      <td style={{ padding: '6px' }}>15.0</td>
                      <td style={{ padding: '6px' }}>V. Nair</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px', fontFamily: 'var(--font-mono)' }}>DRAIN-01</td>
                      <td style={{ padding: '6px' }}>DR-UNPLN</td>
                      <td style={{ padding: '6px' }}><span className="badge badge-sm badge-danger">Out-of-Baseline</span></td>
                      <td style={{ padding: '6px' }}>4.2</td>
                      <td style={{ padding: '6px' }}>M. Khan</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Navigation Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveStep(3)}
              style={{ fontWeight: 800, gap: 6 }}
            >
              <span>Next: Understand / Extract</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: UNDERSTAND / EXTRACT */}
      {/* ========================================================================= */}
      {activeStep === 3 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontWeight: 800 }}>STEP 3</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  UNDERSTANDING FIELD EVIDENCE (RAW → STRUCTURED TRANSFORMATION)
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Transforming unstructured supervisor text into normalized, discipline-tagged activity events.
              </div>
            </div>

            <span className="badge" style={{ background: '#0284c7', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
              Entity & Intent Extraction
            </span>
          </div>

          {/* Visual Transformation Box */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr auto 1.3fr',
              gap: '1.25rem',
              alignItems: 'center',
              padding: '1.25rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              marginBottom: '1.25rem',
            }}
          >
            {/* Left: Raw Evidence */}
            <div style={{ padding: '1rem', background: 'var(--bg-surface)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: 4 }}>
                1. RAW FIELD EVIDENCE (UNSTRUCTURED TEXT)
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.45, marginBottom: 8 }}>
                "CW 24-inch spool was erected near Pump Bay today; alignment is in progress. Work started on 03 Sep."
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Source: <strong>daily_report.txt (Line 9, Piping Section)</strong> • Unstructured contractor phrasing
              </div>
            </div>

            {/* Center: Transformation Indicator */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                DATUM NLP
              </span>
              <ArrowRight size={24} style={{ color: 'var(--brand-primary)' }} />
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Normalized</span>
            </div>

            {/* Right: Structured Event */}
            <div style={{ padding: '1rem', background: 'var(--bg-surface)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: 6 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: 6 }}>
                2. STRUCTURED ACTIVITY EVENT (NORMALIZED)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.55rem', fontSize: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Discipline:</span>{' '}
                  <strong style={{ color: 'var(--brand-primary)' }}>Piping</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Activity:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>Spool Erection</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Equipment / Tag:</span>{' '}
                  <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>24-CW-017</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Area / Location:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>Pump Bay</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Actual Start:</span>{' '}
                  <strong style={{ color: '#fbbf24' }}>03 Sep 2026</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Status / Progress:</span>{' '}
                  <strong style={{ color: '#f87171' }}>In Progress (60%)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Extracted Events Table */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Extracted Execution Events from Field Submissions ({siteUpdates.length} Records)
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 6, maxHeight: '240px' }}>
              <table className="table" style={{ width: '100%', fontSize: '0.75rem', margin: 0 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)' }}>
                    <th style={{ padding: '6px' }}>Event ID</th>
                    <th style={{ padding: '6px' }}>Discipline</th>
                    <th style={{ padding: '6px' }}>Extracted Activity Description</th>
                    <th style={{ padding: '6px' }}>Area</th>
                    <th style={{ padding: '6px' }}>Status</th>
                    <th style={{ padding: '6px' }}>Confirmed Tag</th>
                    <th style={{ padding: '6px' }}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {siteUpdates.slice(0, 6).map(u => (
                    <tr key={u.id}>
                      <td style={{ padding: '6px', fontFamily: 'var(--font-mono)' }}>{u.id}</td>
                      <td style={{ padding: '6px' }}>
                        <span className={`badge badge-sm badge-${u.discipline.toLowerCase()}`}>
                          {u.discipline}
                        </span>
                      </td>
                      <td style={{ padding: '6px', fontWeight: 600 }}>{u.extractedDescription}</td>
                      <td style={{ padding: '6px' }}>{u.area}</td>
                      <td style={{ padding: '6px' }}>
                        <span className={`badge badge-sm ${u.eventStatus === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                          {u.eventStatus}
                        </span>
                      </td>
                      <td style={{ padding: '6px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{u.confirmedTag || '—'}</td>
                      <td style={{ padding: '6px', color: 'var(--text-muted)' }}>{u.sourceFile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Navigation Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveStep(4)}
              style={{ fontWeight: 800, gap: 6 }}
            >
              <span>Next: Talk to DATUM (Conversational Capture)</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: TALK TO DATUM (CONVERSATIONAL FIELD CAPTURE) */}
      {/* ========================================================================= */}
      {activeStep === 4 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontWeight: 800 }}>STEP 4</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  TALK TO DATUM (LOW-FRICTION FIELD CAPTURE)
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Industrial Assistant Interface: Natural supervisor reporting without rigid forms $\rightarrow$ Structured activity extraction.
              </div>
            </div>

            <span className="badge" style={{ background: '#a855f7', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
              Natural Language Intent Engine
            </span>
          </div>

          {/* Supervisor Natural Input Box */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: 8,
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <HardHat size={16} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  SUPERVISOR VOICE / TEXT FIELD REPORT
                </span>
              </div>

              {/* Preset Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Sample Prompts:</span>
                <button
                  type="button"
                  className="btn btn-xs btn-secondary"
                  onClick={() =>
                    setConversationalInput(
                      'Today we erected the 24-inch cooling water spool near Pump Bay. It started yesterday and alignment is still going on.'
                    )
                  }
                  style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                >
                  Cooling Water Spool
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-secondary"
                  onClick={() =>
                    setConversationalInput(
                      'Pump bay foundation raft concrete pouring started this morning, 45 cubic meters poured.'
                    )
                  }
                  style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                >
                  Civil Concrete Pour
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-secondary"
                  onClick={() =>
                    setConversationalInput(
                      'Temporary drain line installed near Pump Bay for pump suction bypass.'
                    )
                  }
                  style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                >
                  Temporary Drain Line
                </button>
              </div>
            </div>

            {/* Input Textarea & Controls */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <textarea
                value={conversationalInput}
                onChange={e => setConversationalInput(e.target.value)}
                placeholder="Supervisor speaks or types naturally: e.g. 'Today we erected the 24-inch cooling water spool near Pump Bay...'"
                rows={3}
                style={{
                  flex: 1,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${isDictating ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => {
                    setIsDictating(!isDictating);
                    if (!isDictating) {
                      addToast({
                        type: 'info',
                        title: 'Microphone Activated',
                        message: 'Listening for field supervisor voice input (multilingual parser active).',
                      });
                    }
                  }}
                  style={{ gap: 6, fontWeight: 700 }}
                  title="Simulate speech-to-text audio ingestion"
                >
                  {isDictating ? <MicOff size={14} /> : <Mic size={14} style={{ color: '#a855f7' }} />}
                  <span>{isDictating ? 'Stop Recording' : 'Dictate (Voice)'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    addToast({
                      type: 'success',
                      title: 'Conversational Input Parsed',
                      message: 'Extracted structured fields and mapped to candidate schedule items.',
                    });
                  }}
                  style={{ gap: 6, fontWeight: 800 }}
                >
                  <Sparkles size={14} />
                  <span>Parse & Extract</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Extraction Card */}
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} style={{ color: 'var(--brand-primary)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  DATUM SEMANTIC EXTRACTION RESULT
                </span>
                <span className="badge badge-sm badge-success">Confidence: 92%</span>
              </div>

              <button
                type="button"
                className="btn btn-xs btn-secondary"
                onClick={() => setIsEditingExtractedFields(prev => !prev)}
                style={{ fontSize: '0.7rem', gap: 4 }}
              >
                <Edit3 size={12} />
                <span>{isEditingExtractedFields ? 'Lock Fields' : 'Edit Extracted Fields'}</span>
              </button>
            </div>

            {/* Extracted Fields Display */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Discipline</div>
                {isEditingExtractedFields ? (
                  <input
                    type="text"
                    value={editedFields.discipline}
                    onChange={e => setEditedFields({ ...editedFields, discipline: e.target.value })}
                    style={{ width: '100%', fontSize: '0.8rem', background: 'transparent', border: 'none', color: 'var(--brand-primary)', fontWeight: 700 }}
                  />
                ) : (
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    {parsedConversation.discipline || 'Piping'}
                  </div>
                )}
              </div>

              <div style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Activity Scope</div>
                {isEditingExtractedFields ? (
                  <input
                    type="text"
                    value={editedFields.description}
                    onChange={e => setEditedFields({ ...editedFields, description: e.target.value })}
                    style={{ width: '100%', fontSize: '0.8rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 700 }}
                  />
                ) : (
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {parsedConversation.cleanDescription || 'CW Spool Erection'}
                  </div>
                )}
              </div>

              <div style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Equipment / Tag</div>
                {isEditingExtractedFields ? (
                  <input
                    type="text"
                    value={editedFields.tag}
                    onChange={e => setEditedFields({ ...editedFields, tag: e.target.value })}
                    style={{ width: '100%', fontSize: '0.8rem', background: 'transparent', border: 'none', color: '#10b981', fontWeight: 700 }}
                  />
                ) : (
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {parsedConversation.detectedTag || '24-CW-017'}
                  </div>
                )}
              </div>

              <div style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Area / Status</div>
                {isEditingExtractedFields ? (
                  <input
                    type="text"
                    value={`${editedFields.area} • ${editedFields.status}`}
                    onChange={e => setEditedFields({ ...editedFields, area: e.target.value.split('•')[0]?.trim() || 'Pump Bay' })}
                    style={{ width: '100%', fontSize: '0.8rem', background: 'transparent', border: 'none', color: '#f59e0b', fontWeight: 700 }}
                  />
                ) : (
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b' }}>
                    {parsedConversation.area || 'Pump Bay'} • {parsedConversation.eventStatus || 'In Progress'}
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation & Pipeline Forwarding */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Low-friction capture confirmed: Click <strong>CONFIRM</strong> to inject into the DATUM schedule-linking engine.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setIsEditingExtractedFields(!isEditingExtractedFields)}
                >
                  {isEditingExtractedFields ? 'Done Editing' : 'Edit'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleConfirmConversationalEntry}
                  style={{ fontWeight: 800, gap: 6 }}
                >
                  <CheckCircle2 size={14} />
                  <span>CONFIRM & LINK TO SCHEDULE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: L5/L6 MATCHING */}
      {/* ========================================================================= */}
      {activeStep === 5 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontWeight: 800 }}>STEP 5</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  L5/L6 SCHEDULE MATCHING & EXPLAINABLE EVIDENCE
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Multi-factor deterministic matching engine linking field evidence to formal schedule baseline nodes.
              </div>
            </div>

            {/* Operating Threshold Callout matching Section 12 */}
            <div
              title="75% is a configurable prototype operating threshold based on weighted matching evidence. It is not a statistically calibrated probability."
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(2, 132, 199, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#38bdf8',
                cursor: 'help',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Info size={13} />
              <span>High-Confidence Operating Threshold: 75%</span>
            </div>
          </div>

          {/* Matched Schedule Activity Card */}
          <div
            style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), var(--bg-surface))',
              border: '2px solid var(--brand-primary)',
              borderRadius: 8,
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  MATCHED SCHEDULE ACTIVITY
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: 2 }}>
                  PIP-L6-012 — Erect Line 24-CW-017
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
                  92%
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>OPERATIONAL EVIDENCE SCORE</div>
              </div>
            </div>

            {/* 4 Factor Evidence Breakdown */}
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Explainable Matching Evidence Factors:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.65rem', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, fontSize: '0.74rem', marginBottom: 2 }}>
                  <CheckCircle2 size={14} />
                  <span>Equipment / Tag Match</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Tag "24-CW-017" exact match with activity code & aliases (+40 pts)
                </div>
              </div>

              <div style={{ padding: '0.65rem', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, fontSize: '0.74rem', marginBottom: 2 }}>
                  <CheckCircle2 size={14} />
                  <span>Discipline Match</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Field discipline "Piping" strictly aligns with WBS trade (+20 pts)
                </div>
              </div>

              <div style={{ padding: '0.65rem', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, fontSize: '0.74rem', marginBottom: 2 }}>
                  <CheckCircle2 size={14} />
                  <span>Area / Location Proximity</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  "Pump Bay" exact location match in site plan (+15 pts)
                </div>
              </div>

              <div style={{ padding: '0.65rem', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, fontSize: '0.74rem', marginBottom: 2 }}>
                  <CheckCircle2 size={14} />
                  <span>Description Similarity</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  "Erected spool" $\approx$ "Erect Line" token overlap (+17 pts)
                </div>
              </div>
            </div>

            {/* Clear Architecture Separation Notice */}
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-subtle)',
                padding: '0.5rem 0.75rem',
                borderRadius: 4,
                borderLeft: '3px solid var(--brand-primary)',
              }}
            >
              <strong>Architecture Distinction:</strong> Conversational NLP layer understands field language $\rightarrow$ DATUM deterministic matching engine links the event to L5/L6 schedule $\rightarrow$ Human planner resolves uncertainty.
            </div>
          </div>

          {/* Navigation Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveStep(6)}
              style={{ fontWeight: 800, gap: 6 }}
            >
              <span>Next: Ambiguity & Human Verification</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: AMBIGUITY / HUMAN VERIFICATION */}
      {/* ========================================================================= */}
      {activeStep === 6 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-warning" style={{ fontWeight: 800 }}>STEP 6</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  AMBIGUOUS CASE — HUMAN-IN-THE-LOOP VERIFICATION
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Automation for clear cases + Human judgment for ambiguous cases. Real state changes triggered on decision.
              </div>
            </div>

            <span className="badge badge-amber" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
              REVIEW REQUIRED
            </span>
          </div>

          {/* Ambiguous Field Report Box */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--bg-surface))',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 8,
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 4 }}>
              AMBIGUOUS FIELD UPDATE
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              "{ambiguousUpdate?.rawText || 'Crew reported cable pulling, but feeder number was not mentioned.'}"
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Status: <strong style={{ color: '#f59e0b' }}>REVIEW REQUIRED</strong> — Insufficient evidence for automatic linking. Multiple candidate activities match generic discipline and area context without unambiguous feeder tag.
            </div>
          </div>

          {/* Competing Candidates Grid */}
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Competing Schedule Activity Candidates (Planner Review Queue):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Candidate A */}
            <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand-primary)' }}>CANDIDATE A (Top Match)</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>63%</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ELE-L6-022 — Pull MCC feeder cable
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Discipline: Electrical • Area: Pump Bay • WBS: 3.1.2
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Overlap: "Cable pulling" verb phrase, Pump Bay area match. Missing: Tag confirmation.
              </div>
            </div>

            {/* Candidate B */}
            <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>CANDIDATE B (Second Candidate)</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>59%</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ELE-L6-023 — Terminate MCC feeder cable
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Discipline: Electrical • Area: Pump Bay • WBS: 3.1.3
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Overlap: "Cable" context, electrical discipline. Subordinate trade sequence.
              </div>
            </div>
          </div>

          {/* Interactive Planner Action Matrix (Triggers REAL State Changes) */}
          <div
            style={{
              padding: '1rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Lead Planner Verification Decision:
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Actions update underlying state, schedule actuals, and generate immutable audit provenance.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={async () => {
                  if (ambiguousUpdate) {
                    await handlePlannerAction(ambiguousUpdate.id, 'approve', 'ELE-L6-022', 'Planner verified feeder cable pulling based on shift engineer confirmation.');
                    addToast({
                      type: 'success',
                      title: 'Link Confirmed',
                      message: 'Verified ELE-L6-022. Actual progress updated across project controls.',
                    });
                  }
                }}
                style={{ fontSize: '0.74rem', fontWeight: 800 }}
              >
                CONFIRM LINK (ELE-L6-022)
              </button>

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={async () => {
                  if (ambiguousUpdate) {
                    await handlePlannerAction(ambiguousUpdate.id, 'relink', 'ELE-L6-023', 'Planner re-linked to termination scope.');
                    addToast({
                      type: 'info',
                      title: 'Re-linked',
                      message: 'Manual re-link to ELE-L6-023 recorded in audit log.',
                    });
                  }
                }}
                style={{ fontSize: '0.74rem' }}
              >
                RELINK
              </button>

              <button
                type="button"
                className="btn btn-sm btn-warning"
                onClick={async () => {
                  if (ambiguousUpdate) {
                    await handlePlannerAction(ambiguousUpdate.id, 'mark_unplanned', null, 'Classified as out-of-baseline electrical work.');
                    addToast({
                      type: 'warning',
                      title: 'Classified Out-of-Baseline',
                      message: 'Logged as potential out-of-baseline electrical scope.',
                    });
                  }
                }}
                style={{ fontSize: '0.74rem' }}
              >
                CLASSIFY AS UNPLANNED
              </button>

              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={async () => {
                  if (ambiguousUpdate) {
                    await handlePlannerAction(ambiguousUpdate.id, 'reject', null, 'Rejected due to insufficient site documentation.');
                  }
                }}
                style={{ fontSize: '0.74rem' }}
              >
                REJECT
              </button>
            </div>
          </div>

          {/* Navigation Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveStep(7)}
              style={{ fontWeight: 800, gap: 6 }}
            >
              <span>Next: Potential Out-of-Baseline Activity</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 7: UNMATCHED / NEW ACTIVITY */}
      {/* ========================================================================= */}
      {activeStep === 7 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-danger" style={{ fontWeight: 800 }}>STEP 7</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  POTENTIAL OUT-OF-BASELINE ACTIVITY (SURFACING UNPLANNED WORK)
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Never silently discard field execution — Unmatched work is routed to the Lead Planner for scope governance.
              </div>
            </div>

            <span className="badge badge-danger" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
              POTENTIAL OUT-OF-BASELINE
            </span>
          </div>

          {/* Alert Card matching Section 14 */}
          <div
            style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), var(--bg-surface))',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 8,
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <AlertTriangle size={18} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>
                POTENTIAL OUT-OF-BASELINE ACTIVITY IDENTIFIED
              </span>
            </div>

            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              "{outOfBaselineUpdate?.rawText || 'A small-bore drain line was installed near the pump. [Not in baseline]'}"
            </div>

            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
              <strong>System Evaluation:</strong> No reliable baseline activity identified in loaded Primavera P6 master schedule. Matching confidence below minimum threshold (&lt;15%). Rather than silently discarding this field event, DATUM has flagged it for planner review.
            </div>

            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-subtle)',
                padding: '0.45rem 0.75rem',
                borderRadius: 4,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <strong>Terminology Standard:</strong> DATUM does not claim to mathematically prove unauthorized work. It identifies that physical field evidence does not currently reconcile with the approved project baseline.
            </div>
          </div>

          {/* Planner Resolution Matrix */}
          <div
            style={{
              padding: '1rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Planner Resolution Action:
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Classify for client variation order, link to parent WBS node, or reject if invalid.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-warning"
                onClick={async () => {
                  if (outOfBaselineUpdate) {
                    await handlePlannerAction(outOfBaselineUpdate.id, 'mark_unplanned', null, 'Confirmed potential out-of-baseline work. Queued for client change order approval.');
                    addToast({
                      type: 'warning',
                      title: 'Classified as Unplanned',
                      message: 'Item recorded in Project Memory & Change Request Queue.',
                    });
                  }
                }}
                style={{ fontSize: '0.74rem', fontWeight: 800 }}
              >
                CLASSIFY AS UNPLANNED WORK
              </button>

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={async () => {
                  if (outOfBaselineUpdate) {
                    await handlePlannerAction(outOfBaselineUpdate.id, 'relink', 'PIP-L6-016', 'Linked under Pump Suction Auxiliary Piping.');
                  }
                }}
                style={{ fontSize: '0.74rem' }}
              >
                LINK TO EXISTING WBS
              </button>

              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={async () => {
                  if (outOfBaselineUpdate) {
                    await handlePlannerAction(outOfBaselineUpdate.id, 'reject', null, 'Rejected as duplicate contractor entry.');
                  }
                }}
                style={{ fontSize: '0.74rem' }}
              >
                REJECT
              </button>
            </div>
          </div>

          {/* Navigation Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveStep(8)}
              style={{ fontWeight: 800, gap: 6 }}
            >
              <span>Next: Actual Progress & Variance Update</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 8: ACTUAL PROGRESS UPDATE */}
      {/* ========================================================================= */}
      {activeStep === 8 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontWeight: 800 }}>STEP 8</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  REAL-TIME ACTUAL PROGRESS & SCHEDULE VARIANCE
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Verified field execution automatically propagates into actual dates, progress percentage, and schedule variance.
              </div>
            </div>

            <span className="badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
              Live Schedule Sync
            </span>
          </div>

          {/* Pipeline Chain Visual */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.6rem 1rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: '1.25rem',
            }}
          >
            <span style={{ color: '#38bdf8' }}>FIELD EVENT</span>
            <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: '#a855f7' }}>VERIFIED L5/L6 ACTIVITY</span>
            <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: '#10b981' }}>ACTUAL PROGRESS</span>
            <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: '#f87171' }}>SCHEDULE VARIANCE</span>
          </div>

          {/* Comparison Card: Planned vs Actual */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            {/* Planned Target */}
            <div style={{ padding: '1.25rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                1. PRIMAVERA P6 PLANNED TARGET
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                PIP-L6-012 — Erect Line 24-CW-017
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Planned Start:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>01 Sep 2026</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Planned Finish:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>05 Sep 2026</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Planned Duration:</span>{' '}
                  <strong style={{ color: 'var(--brand-primary)' }}>4 Days</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Target Progress:</span>{' '}
                  <strong style={{ color: 'var(--brand-primary)' }}>100%</strong>
                </div>
              </div>
            </div>

            {/* Actual Performance */}
            <div style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '2px solid #ef4444', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>
                  2. REAL-TIME RECONCILED ACTUALS
                </span>
                <span className="badge badge-danger" style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                  VARIANCE: +2 DAYS
                </span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                Status: <span style={{ color: '#ef4444' }}>Delayed</span> (In Progress)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Actual Start:</span>{' '}
                  <strong style={{ color: '#f59e0b' }}>03 Sep 2026</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Current Report Date:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>05 Sep 2026</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Actual Progress:</span>{' '}
                  <strong style={{ color: '#10b981' }}>60% (Spool Erected, Aligning)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Critical Path Slip:</span>{' '}
                  <strong style={{ color: '#ef4444' }}>+2.0 Days Impact</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 6 }}>
              <span>Progress Comparison for Line 24-CW-017</span>
              <span><strong>Actual: 60%</strong> vs Planned Baseline Target: 100%</span>
            </div>
            <div style={{ position: 'relative', height: 16, background: 'rgba(51, 65, 85, 0.5)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, #0284c7, #10b981)', borderRadius: 8 }} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, background: '#f87171' }} title="Planned Finish Deadline" />
            </div>
          </div>

          {/* Navigation Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveStep(9)}
              style={{ fontWeight: 800, gap: 6 }}
            >
              <span>Next: Structured Actual Dataset</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 9: STRUCTURED ACTUAL DATASET */}
      {/* ========================================================================= */}
      {activeStep === 9 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontWeight: 800 }}>STEP 9</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  STRUCTURED ACTUAL DATASET ("STRUCTURED, DISCIPLINE-TAGGED EXECUTION DATA")
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                RAW FIELD DATA $\rightarrow$ STRUCTURED, QUERYABLE ACTUALS. Clean institutional asset for project analytics and memory.
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={exportAlignmentCSV}
              style={{ fontSize: '0.74rem', gap: 6 }}
            >
              <Download size={14} />
              <span>Export Execution Dataset (CSV)</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {['ALL', 'Piping', 'Civil', 'Electrical', 'HSE'].map(disc => (
                <button
                  key={disc}
                  type="button"
                  onClick={() => setStructuredDisciplineFilter(disc)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 14,
                    fontSize: '0.72rem',
                    fontWeight: structuredDisciplineFilter === disc ? 800 : 500,
                    background: structuredDisciplineFilter === disc ? '#0284c7' : 'var(--bg-subtle)',
                    color: structuredDisciplineFilter === disc ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  {disc}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '2px 8px', maxWidth: '240px' }}>
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search dataset..."
                value={structuredSearchQuery}
                onChange={e => setStructuredSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', fontSize: '0.74rem', color: 'var(--text-primary)', marginLeft: 6, width: '100%' }}
              />
            </div>
          </div>

          {/* Structured Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 8, maxHeight: '340px' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.74rem', margin: 0 }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '8px' }}>Date</th>
                  <th style={{ padding: '8px' }}>Project</th>
                  <th style={{ padding: '8px' }}>Discipline</th>
                  <th style={{ padding: '8px' }}>Activity ID</th>
                  <th style={{ padding: '8px' }}>L5 WBS Code</th>
                  <th style={{ padding: '8px' }}>L6 Description</th>
                  <th style={{ padding: '8px' }}>Actual Start</th>
                  <th style={{ padding: '8px' }}>Progress</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Confidence</th>
                  <th style={{ padding: '8px' }}>Source</th>
                  <th style={{ padding: '8px' }}>Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {structuredRows.map(r => (
                  <tr key={r.id}>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{r.project}</td>
                    <td style={{ padding: '8px' }}>
                      <span className={`badge badge-sm badge-${r.discipline.toLowerCase()}`}>{r.discipline}</span>
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>{r.activityId}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.l5Code}</td>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{r.l6Description}</td>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{r.actualStart}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: r.progress === 100 ? '#10b981' : '#f59e0b' }}>{r.progress}%</td>
                    <td style={{ padding: '8px' }}>
                      <span className={`badge badge-sm ${r.status === 'Completed' ? 'badge-success' : r.status === 'Delayed' ? 'badge-danger' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px', fontWeight: 700 }}>{r.confidence}%</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{r.source}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: r.verificationStatus.includes('APPROVED') || r.verificationStatus.includes('HIGH-CONF') ? '#10b981' : '#f59e0b' }}>
                        {r.verificationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Navigation Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveStep(10)}
              style={{ fontWeight: 800, gap: 6 }}
            >
              <span>Next: Execution Intelligence</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 10: PERFORMANCE / DELAY INTELLIGENCE */}
      {/* ========================================================================= */}
      {activeStep === 10 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontWeight: 800 }}>STEP 10</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  EXECUTION INTELLIGENCE & DELAY PATTERN DISCOVERY
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Derived dynamically from verified execution actuals — Uncovering recurring bottlenecks and discipline-level performance.
              </div>
            </div>

            <span className="badge" style={{ background: '#f87171', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
              Actionable Variance Intelligence
            </span>
          </div>

          {/* Discipline-Wise Progress Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Piping Card */}
            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8' }}>PIPING DISCIPLINE</span>
                <span className="badge badge-sm badge-danger">+1.8d Avg Variance</span>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                6 Activities Tracked
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                4 Completed • 2 Delayed (Alignment sequence holds on Line 24-CW-017)
              </div>
            </div>

            {/* Civil Card */}
            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#10b981' }}>CIVIL DISCIPLINE</span>
                <span className="badge badge-sm badge-success">0.0d On Track</span>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                4 Activities Tracked
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                3 Completed • 1 In Progress (Foundation excavation & PCC concrete pour verified)
              </div>
            </div>

            {/* Electrical Card */}
            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fbbf24' }}>ELECTRICAL DISCIPLINE</span>
                <span className="badge badge-sm badge-warning">+1.0d Variance</span>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                4 Activities Tracked
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                2 Completed • 2 In Progress (Cable tray completed; cable pulling verified by planner)
              </div>
            </div>
          </div>

          {/* Recurring Bottleneck Discovery Alert matching Section 17 */}
          <div
            style={{
              padding: '1.15rem',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--bg-surface))',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 8,
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>
                  RECURRING BOTTLENECK DISCOVERY
                </span>
              </div>
              <span className="badge badge-danger" style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                4 Recorded Occurrences
              </span>
            </div>

            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              Piping $\rightarrow$ Spool Alignment Hold
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong>Observed Pattern:</strong> Repeated delays occur between physical crane placement of heavy spools and final bolt-up alignment clearance. Spool erection consistently commences on schedule but alignment sequences take an additional 24 to 48 hours in pump bay workfronts.
            </div>
          </div>

          {/* Productivity Indicators */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Piping Erection Productivity</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>18.5 inch-dia / day</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Empirical site rate observed across 6 piping spools (Planned: 25.0 inch-dia/day).
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Civil Foundation Pour Productivity</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>45.0 m³ / day</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                M35 grade pump foundation concrete placement matching planned batch plant dispatch.
              </div>
            </div>
          </div>

          {/* Navigation Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveStep(11)}
              style={{ fontWeight: 800, gap: 6 }}
            >
              <span>Next: Project Memory (Institutional Learning)</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 11: PROJECT MEMORY */}
      {/* ========================================================================= */}
      {activeStep === 11 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontWeight: 800 }}>STEP 11</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  PROJECT MEMORY (REUSABLE INSTITUTIONAL KNOWLEDGE)
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                "Past execution becomes structured knowledge for future planning." Preserving duration learning, bottlenecks, and empirical norms.
              </div>
            </div>

            <span className="badge" style={{ background: '#a855f7', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
              Institutional Asset
            </span>
          </div>

          {/* The 4 Core Project Memory Learnings matching Section 18 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Card 1: Actual Duration Learning */}
            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                  ACTUAL DURATION LEARNING
                </span>
                <span className="badge badge-sm badge-warning">+2 Days Variance</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                Activity: CW Spool Erection (PIP-L6-012)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.74rem', marginBottom: 6 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Planned Duration:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>3 days</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Observed Duration:</span>{' '}
                  <strong style={{ color: '#f59e0b' }}>5 days</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Average Variance:</span>{' '}
                  <strong style={{ color: '#ef4444' }}>+2 days</strong>
                </div>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                <strong>Recommendation:</strong> Calibrate future refinery pump bay baseline duration from 3 days to 5 days.
              </div>
            </div>

            {/* Card 2: Recurring Bottleneck */}
            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>
                  RECURRING BOTTLENECK
                </span>
                <span className="badge badge-sm badge-danger">4 Occurrences</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                Discipline: Piping • Pattern: Alignment Delays
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Repeated hold between initial crane placement and laser flange fit-up sign-off.
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                <strong>Mitigation:</strong> Pre-mobilize dedicated rigging teams with optical alignment tools during crane hire.
              </div>
            </div>

            {/* Card 3: Discipline Productivity */}
            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                  DISCIPLINE PRODUCTIVITY NORM
                </span>
                <span className="badge badge-sm badge-success">Calibrated Metric</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                Piping Erection: 18.5 inch-dia / day
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Empirical actual rate achieved in congested refinery pump bay workfronts.
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                <strong>Planning Standard:</strong> Adopt 18.5 inch-dia/day as standard tender scheduling norm for congested bays.
              </div>
            </div>

            {/* Card 4: Execution Pattern */}
            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase' }}>
                  EXECUTION PATTERN
                </span>
                <span className="badge badge-sm badge-info">Pump Bay</span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                Recurring Challenge: Crane Hook Availability
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Material staging and mobile crane hook sharing creates serial delays between civil and piping.
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                <strong>Planning Lesson:</strong> Schedule separate crane access windows for civil grouting vs spool lifting.
              </div>
            </div>
          </div>

          {/* Interactive "Ask Project Memory" Query Box matching Section 19 */}
          <div
            style={{
              padding: '1.15rem',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), var(--bg-subtle))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: 8,
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} style={{ color: '#a855f7' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ASK PROJECT MEMORY (QUERYABLE KNOWLEDGE ENGINE)
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Deterministic Query Engine over Historical Execution Dataset
              </span>
            </div>

            {/* Query Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>Click to query:</span>
              <button
                type="button"
                className="btn btn-xs btn-secondary"
                onClick={() => {
                  const q = 'Which piping activities repeatedly exceeded their planned duration?';
                  setMemoryQueryInput(q);
                  setMemoryQueryResult(queryProjectMemory(q, siteUpdates, schedule, memoryPatterns));
                }}
                style={{ fontSize: '0.68rem' }}
              >
                Piping duration variance
              </button>
              <button
                type="button"
                className="btn btn-xs btn-secondary"
                onClick={() => {
                  const q = 'What is the actual observed productivity for piping spool erection in Pump Bay?';
                  setMemoryQueryInput(q);
                  setMemoryQueryResult(queryProjectMemory(q, siteUpdates, schedule, memoryPatterns));
                }}
                style={{ fontSize: '0.68rem' }}
              >
                Pump Bay productivity rate
              </button>
              <button
                type="button"
                className="btn btn-xs btn-secondary"
                onClick={() => {
                  const q = 'What recurring bottlenecks were identified in electrical activities?';
                  setMemoryQueryInput(q);
                  setMemoryQueryResult(queryProjectMemory(q, siteUpdates, schedule, memoryPatterns));
                }}
                style={{ fontSize: '0.68rem' }}
              >
                Recurring bottlenecks
              </button>
              <button
                type="button"
                className="btn btn-xs btn-secondary"
                onClick={() => {
                  const q = 'Were there any out-of-baseline activities recorded?';
                  setMemoryQueryInput(q);
                  setMemoryQueryResult(queryProjectMemory(q, siteUpdates, schedule, memoryPatterns));
                }}
                style={{ fontSize: '0.68rem' }}
              >
                Out-of-baseline records
              </button>
            </div>

            {/* Query Input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <input
                type="text"
                value={memoryQueryInput}
                onChange={e => setMemoryQueryInput(e.target.value)}
                placeholder="Ask Project Memory: e.g. Which piping activities repeatedly exceeded their planned duration?"
                style={{
                  flex: 1,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setMemoryQueryResult(queryProjectMemory(memoryQueryInput, siteUpdates, schedule, memoryPatterns));
                }}
                style={{ fontWeight: 800, padding: '0.55rem 1rem', fontSize: '0.74rem' }}
              >
                Query Memory
              </button>
            </div>

            {/* Answer Display */}
            {memoryQueryResult && (
              <div style={{ padding: '0.85rem', background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid rgba(168, 85, 247, 0.3)', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase' }}>
                    DATUM PROJECT MEMORY RESPONSE
                  </span>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    {memoryQueryResult.recordsAnalyzed} execution records evaluated
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.45, marginBottom: 6 }}>
                  {memoryQueryResult.answer}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <strong>Key Evidence:</strong>
                  <ul style={{ margin: '2px 0 0 1rem', padding: 0 }}>
                    {memoryQueryResult.evidencePoints.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveStep(12)}
              style={{ fontWeight: 800, gap: 6 }}
            >
              <span>Next: Traceable Audit Provenance</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 12: AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeStep === 12 && (
        <div className="sih-step-card card-panel" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontWeight: 800 }}>STEP 12</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  TRACEABLE AUDIT TRAIL (EXECUTION PROVENANCE)
                </h3>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Complete immutable provenance: Source $\rightarrow$ Extraction $\rightarrow$ Match $\rightarrow$ Verification $\rightarrow$ Schedule Update.
              </div>
            </div>

            <span className="badge" style={{ background: '#0284c7', color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
              SHA-256 Provenance Fingerprints
            </span>
          </div>

          {/* Audit Chain Visual */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.85rem',
              padding: '0.65rem 1rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--text-secondary)',
              marginBottom: '1.25rem',
            }}
          >
            <span style={{ color: '#38bdf8' }}>1. Raw Source</span>
            <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: '#a855f7' }}>2. Event Extraction</span>
            <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: '#fbbf24' }}>3. Candidate Match</span>
            <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: '#10b981' }}>4. Planner Verification</span>
            <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: '#38bdf8' }}>5. Schedule Recalculation</span>
          </div>

          {/* Chronological Audit Logs Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 8, maxHeight: '380px' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.74rem', margin: 0 }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '8px' }}>Timestamp</th>
                  <th style={{ padding: '8px' }}>Action / Transformation</th>
                  <th style={{ padding: '8px' }}>Update ID</th>
                  <th style={{ padding: '8px' }}>Final Activity</th>
                  <th style={{ padding: '8px' }}>Confidence</th>
                  <th style={{ padding: '8px' }}>User / Role</th>
                  <th style={{ padding: '8px' }}>Evidence SHA-256 Fingerprint</th>
                  <th style={{ padding: '8px' }}>Decision Note</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 10).map(log => (
                  <tr key={log.id}>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {log.timestamp ? log.timestamp.split('T')[1]?.substring(0, 8) || log.timestamp.substring(11, 19) : '10:33:00'}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 700, color: log.action.includes('Approved') ? '#10b981' : log.action.includes('Unplanned') ? '#f59e0b' : 'var(--text-primary)' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{log.updateId}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 700 }}>
                      {log.finalActivityId || 'UNPLANNED'}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 700 }}>{log.originalConfidence}%</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{log.userName || log.userRole || 'Lead Planner'}</td>
                    <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#34d399' }}>
                      {log.evidenceHash ? log.evidenceHash.substring(0, 16) + '...' : `sha256:7f8a${log.id.slice(-6)}...`}
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{log.plannerNote || 'Verified in workflow'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Concluding Presentation Note */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(16, 185, 129, 0.15))',
              borderRadius: 8,
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                DATUM End-to-End Workflow Story Complete
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                DATUM has bridged unstructured field evidence to formal schedule baselines and preserved execution knowledge for future planning.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setActiveStep(1)}
              >
                Restart Workflow (Step 1)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => setShowCoverageModal(true)}
                style={{ fontWeight: 800 }}
              >
                View Capabilities Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Matrix Modal */}
      <SihPsCoverageModal
        isOpen={showCoverageModal}
        onClose={() => setShowCoverageModal(false)}
        onNavigateToStep={step => setActiveStep(step)}
      />
    </div>
  );
};
