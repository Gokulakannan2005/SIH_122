import React, { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Database,
  RefreshCw,
  Eye,
  FileUp,
  Check,
  CheckCircle2,
  Layers,
  ArrowRight,
  GitBranch,
  Calendar,
  AlertTriangle,
  Inbox,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Search,
  Activity,
  UserCheck,
  Play
} from 'lucide-react';

export const UploadDemoView: React.FC = () => {
  const {
    schedule,
    siteUpdates,
    loadDemoData,
    handleCustomUpload,
    isLoading,
    scheduleVersions,
    activeScheduleVersion,
    activateScheduleVersion,
    uploadNewScheduleVersion,
    fieldSubmissions,
    setActiveTab,
    setSelectedReviewUpdateId,
    setPlannerQueueFilter,
    addToast,
    currentRole,
    isGuidedDemoActive,
    matchResults,
  } = useProject();

  const isSupervisor = currentRole === 'supervisor';

  const [selectedPreview, setSelectedPreview] = useState<'schedule' | 'txt' | 'xlsx'>('schedule');
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [isActivatingVersion, setIsActivatingVersion] = useState(false);
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [simulationActive, setSimulationActive] = useState<string | null>(null);

  const scheduleInputRef = useRef<HTMLInputElement>(null);
  const scheduleRevisedInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);
  const xlsxInputRef = useRef<HTMLInputElement>(null);

  const txtUpdates = siteUpdates.filter(u => u.sourceFile === 'daily_report.txt');
  const xlsxUpdates = siteUpdates.filter(u => u.sourceFile === 'piping_progress.xlsx');

  // Stats calculation
  const totalUpdates = siteUpdates.length;
  const matchArray = Object.values(matchResults);
  const readyCount = matchArray.filter(m => m.category === 'ready').length;
  const reviewCount = matchArray.filter(m => m.category === 'review').length;
  const unplannedCount = matchArray.filter(m => m.category === 'unplanned').length;

  // Handle schedule master upload (Planner only)
  const handleScheduleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      await handleCustomUpload({ scheduleCsv: text });
      setUploadStatusMsg(`Uploaded & parsed ${file.name} successfully into Master Baseline.`);
      setTimeout(() => setUploadStatusMsg(null), 5000);
    };
    reader.readAsText(file);
  };

  // Handle revised schedule upload (new version creation, Planner only)
  const handleRevisedScheduleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadNewScheduleVersion(file);
      setUploadStatusMsg(`Uploaded new schedule version ${file.name}. Parsed and ready for review.`);
      setTimeout(() => setUploadStatusMsg(null), 5000);
    } catch {
      addToast({
        type: 'error',
        title: 'Schedule Parsing Error',
        message: 'Error parsing schedule revision.',
      });
    }
  };

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      await handleCustomUpload({ dailyReportTxt: text });
      setUploadStatusMsg(`Ingested ${file.name}: Stored in Daily Reports feed & routed to AI Matching Engine.`);
      setSelectedPreview('txt');
      setTimeout(() => setUploadStatusMsg(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleXlsxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const buffer = event.target?.result as ArrayBuffer;
      await handleCustomUpload({ pipingProgressXlsx: buffer });
      setUploadStatusMsg(`Ingested ${file.name}: Extracted rows & routed to AI Matching Engine.`);
      setSelectedPreview('xlsx');
      setTimeout(() => setUploadStatusMsg(null), 5000);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleVersionActivate = async (versionId: string) => {
    setIsActivatingVersion(true);
    try {
      await activateScheduleVersion(versionId);
    } finally {
      setIsActivatingVersion(false);
    }
  };

  const runSimulation = async (type: 'txt' | 'xlsx' | 'ambiguous') => {
    setSimulationActive(type);
    if (type === 'txt') {
      await loadDemoData();
      setSelectedPreview('txt');
      setUploadStatusMsg('Simulated daily_report.txt ingestion: 14 items parsed & matched against active baseline.');
    } else if (type === 'xlsx') {
      await loadDemoData();
      setSelectedPreview('xlsx');
      setUploadStatusMsg('Simulated piping_progress.xlsx ingestion: 18 progress rows parsed & scored.');
    } else if (type === 'ambiguous') {
      await loadDemoData();
      setSelectedPreview('txt');
      setUploadStatusMsg('Simulated ambiguous log: 3 items scored <75% and flagged for human evaluation.');
    }
    setTimeout(() => {
      setSimulationActive(null);
      setTimeout(() => setUploadStatusMsg(null), 4000);
    }, 800);
  };

  const activeVersion = activeScheduleVersion || {
    versionId: 'Rev-03',
    versionName: 'Rev-03 (Active Baseline)',
    projectId: 'IOCL Refinery - P4',
    uploadedBy: 'Lead Planner',
    uploadedAt: '08 September 2026',
    fileType: 'Primavera P6 Export (.XLSX)',
    activitiesCount: schedule.length,
    isActive: true,
    changeSummary: {
      newCount: 12,
      modCount: 27,
      dateChanges: 41,
      removedCount: 3,
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="mono-pill" style={{ background: 'var(--brand-surface)', color: 'var(--brand-primary)', borderColor: 'var(--border-default)', fontWeight: 700 }}>
              Live Data Pipeline
            </span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Active Baseline: {activeVersion.versionId}
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Data Ingestion & AI Reconciliation Hub
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Upload baseline schedules, supervisor logs, and progress sheets. Watch data ingest, match with AI, and route ambiguous items for human evaluation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('site-updates')}
            type="button"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', fontWeight: 600 }}
          >
            <FileText size={13} />
            <span>View Ingested Feed</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setActiveTab('planner-review')}
            type="button"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', fontWeight: 600 }}
          >
            <ShieldCheck size={13} />
            <span>AI Review Queue ({reviewCount})</span>
          </button>
        </div>
      </div>

      {uploadStatusMsg && (
        <div
          style={{
            background: 'var(--status-ready-bg)',
            border: '1px solid var(--status-ready-border)',
            color: 'var(--status-ready-fg)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          <Check size={16} />
          <span>{uploadStatusMsg}</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: THE 4-STAGE DATA JOURNEY VISUAL STEPPER
          ========================================================================= */}
      <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Execution Lifecycle
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              How Uploaded Data Flows Through Datum
            </h3>
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Deterministic Multi-Factor Processing
          </span>
        </div>

        {/* 4 Connected Flow Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          {/* Step 1 */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.725rem', fontWeight: 800 }}>
                1
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Upload / Input Data
              </div>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Drop your Primavera P6 XLSX, MS Project CSV, daily supervisor TXT notes, or voice/photo entries.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.675rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <UploadCloud size={12} />
              <span>Multi-format Ingestion</span>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.725rem', fontWeight: 800 }}>
                2
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Live Ingestion & Staging
              </div>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Parsed into normalized rows with report dates, source line numbers, raw payloads, and SHA-256 evidence hashes.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.675rem', color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FileText size={12} />
              <span>{totalUpdates} Records Ingested</span>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#d97706', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.725rem', fontWeight: 800 }}>
                3
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                AI Matching Engine
              </div>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Evaluated against baseline activities via 4 factors: Tag & Alias (50%), Discipline (20%), Area (15%), Fuzzy Tokens (15%).
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.675rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} />
              <span>{readyCount} Auto-Matched (&ge;75%)</span>
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.725rem', fontWeight: 800 }}>
                4
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Human Review & Gate
              </div>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Ambiguous items (40–74%) or unlisted scope are escalated with audit evidence to the Lead Planner for approval.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.675rem', color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} />
              <span>{reviewCount + unplannedCount} In Human Queue</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: INTERACTIVE PIPELINE SIMULATION TRIGGERS
          ========================================================================= */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Interactive Ingestion & Matching Simulator
            </h3>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Test how raw files flow through ingestion, scoring, and human escalation in real time
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => runSimulation('txt')}
            style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '0.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-xs)', background: 'var(--status-review-bg)', color: 'var(--status-review-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Simulate Daily TXT Log
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  14 field updates &rarr; Ingest & Score
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => runSimulation('xlsx')}
            style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '0.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-xs)', background: 'var(--status-ready-bg)', color: 'var(--status-ready-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Simulate Piping Excel Sheet
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  18 progress rows &rarr; Auto-link
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => runSimulation('ambiguous')}
            style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '0.75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-xs)', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--status-unplanned-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Simulate Ambiguous Log
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Missing Tag &rarr; Escalates to Planner
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: ACTIVE SCHEDULE BASELINE & REVISED VERSION DROPZONES
          ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '1.25rem' }}>
        {/* Left Column: Upload Revised Schedule */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
            Upload Schedule Revision (P6 / MS Project / CSV)
          </h3>

          <input
            type="file"
            ref={scheduleRevisedInputRef}
            accept=".xlsx,.csv,.xml,.xer"
            style={{ display: 'none' }}
            onChange={handleRevisedScheduleUpload}
          />

          {/* Dotted Drag & Drop Box */}
          <div
            onClick={() => scheduleRevisedInputRef.current?.click()}
            style={{
              flex: 1,
              border: '2px dashed var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '0.65rem',
              cursor: 'pointer',
              background: 'var(--bg-subtle)',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-surface)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UploadCloud size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Drag and drop your schedule file here
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600, marginTop: 2 }}>
                or click to browse
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', maxWidth: 360, lineHeight: 1.35, marginTop: 4 }}>
              Supported formats: Primavera P6 (.XLSX), MS Project (.XLSX, MPP), CSV. File should include: Activity ID, Activity Name, WBS, Planned Dates, Discipline.
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 6, padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
              onClick={(e) => {
                e.stopPropagation();
                scheduleRevisedInputRef.current?.click();
              }}
            >
              Browse Files
            </button>
          </div>
        </div>

        {/* Right Column: Active Schedule Status */}
        <div id="demo-target-version-control" className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="status-badge ready" style={{ fontSize: '0.675rem' }}>● Active Master</span>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeVersion.versionId}
                </h3>
              </div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{activeVersion.uploadedAt}</span>
            </div>

            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              <strong>{activeVersion.projectId || 'IOCL Refinery - P4'}</strong> • {schedule.length} Master Activities
            </div>

            {/* Comparison Metrics List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Baseline Scope</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{schedule.length} Milestones</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Auto-Matched Updates</span>
                <span style={{ fontWeight: 700, color: 'var(--status-ready-fg)' }}>{readyCount} updates</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pending Human Review</span>
                <span style={{ fontWeight: 700, color: 'var(--status-review-fg)' }}>{reviewCount + unplannedCount} items</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.725rem', justifyContent: 'center' }}
              onClick={() => setActiveTab('schedule-activities')}
            >
              Open 4D Gantt View
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.725rem', justifyContent: 'center' }}
              onClick={() => setActiveTab('planner-review')}
            >
              Reconcile Matches
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: DATASET INGESTION DROPZONES (SCHEDULE, TXT, EXCEL)
          ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {/* Schedule Master */}
        <div className="card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>schedule.csv</h4>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Baseline Master Schedule</span>
              </div>
            </div>
            <span className="mono-pill" style={{ fontWeight: 700 }}>
              {schedule.length} Activities
            </span>
          </div>

          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', flex: 1, marginBottom: '0.85rem', lineHeight: 1.4 }}>
            Master schedule baseline with WBS codes, planned start/finish dates, disciplines, area tags, and recognized equipment aliases.
          </p>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button
              className={`btn btn-sm ${selectedPreview === 'schedule' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedPreview('schedule')}
              style={{ flex: 1 }}
              type="button"
            >
              <Eye size={13} />
              <span>Preview Baseline</span>
            </button>

            <input
              type="file"
              ref={scheduleInputRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleScheduleUpload}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => scheduleInputRef.current?.click()}
              title="Upload custom CSV schedule"
              type="button"
            >
              <FileUp size={13} />
              <span>Upload CSV</span>
            </button>
          </div>
        </div>

        {/* Daily Report TXT */}
        <div className="card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--status-review-bg)', color: 'var(--status-review-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>daily_report.txt</h4>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Supervisor Field Logs</span>
              </div>
            </div>
            <span className="mono-pill" style={{ fontWeight: 700 }}>
              {txtUpdates.length} Updates
            </span>
          </div>

          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', flex: 1, marginBottom: '0.85rem', lineHeight: 1.4 }}>
            Unstructured daily log entries containing supervisor work notes, progress statements, and informal site terminology.
          </p>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button
              className={`btn btn-sm ${selectedPreview === 'txt' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedPreview('txt')}
              style={{ flex: 1 }}
              type="button"
            >
              <Eye size={13} />
              <span>Preview Ingested</span>
            </button>

            <input
              type="file"
              ref={txtInputRef}
              accept=".txt"
              style={{ display: 'none' }}
              onChange={handleTxtUpload}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => txtInputRef.current?.click()}
              title="Upload custom TXT log"
              type="button"
            >
              <FileUp size={13} />
              <span>Upload TXT</span>
            </button>
          </div>
        </div>

        {/* Piping Progress XLSX */}
        <div className="card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--status-ready-bg)', color: 'var(--status-ready-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>piping_progress.xlsx</h4>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Discipline Excel Sheet</span>
              </div>
            </div>
            <span className="mono-pill" style={{ fontWeight: 700 }}>
              {xlsxUpdates.length} Rows
            </span>
          </div>

          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', flex: 1, marginBottom: '0.85rem', lineHeight: 1.4 }}>
            Discipline-level Excel spreadsheet detailing site progress, event status (Started, Completed), quantities, and supervisors.
          </p>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button
              className={`btn btn-sm ${selectedPreview === 'xlsx' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedPreview('xlsx')}
              style={{ flex: 1 }}
              type="button"
            >
              <Eye size={13} />
              <span>Preview Ingested</span>
            </button>

            <input
              type="file"
              ref={xlsxInputRef}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleXlsxUpload}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => xlsxInputRef.current?.click()}
              title="Upload custom XLSX file"
              type="button"
            >
              <FileUp size={13} />
              <span>Upload XLSX</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: INGESTED DATA PREVIEW TABLE
          ========================================================================= */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Staged Data Preview &mdash;{' '}
              {selectedPreview === 'schedule'
                ? 'Master Schedule Baseline'
                : selectedPreview === 'txt'
                ? 'Ingested Field Daily Report Log'
                : 'Ingested Piping Progress Excel Rows'}
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {selectedPreview === 'schedule' ? 'Active master activities in memory' : 'Raw updates staged in database and processed by AI engine'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="mono-pill">
              {selectedPreview === 'schedule'
                ? `${schedule.length} activities`
                : selectedPreview === 'txt'
                ? `${txtUpdates.length} staged records`
                : `${xlsxUpdates.length} staged rows`}
            </span>
            {selectedPreview !== 'schedule' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('site-updates')}
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem' }}
              >
                Open in Daily Feed
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive" style={{ maxHeight: 360, overflowY: 'auto' }}>
          {selectedPreview === 'schedule' ? (
            <table className="industrial-table">
              <thead>
                <tr>
                  <th>Activity ID</th>
                  <th>L5 Code</th>
                  <th>WBS</th>
                  <th>Activity Name</th>
                  <th>Discipline</th>
                  <th>Area</th>
                  <th>Planned Window</th>
                  <th>Aliases</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(act => (
                  <tr key={act.activityId}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>{act.activityId}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.725rem', color: '#3b82f6' }}>
                      {act.l5Code || `IOCL.P4.${(act.area || 'UNIT01').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}.${act.discipline.substring(0, 3).toUpperCase()}.L5.011`}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.725rem' }}>{act.wbs}</td>
                    <td style={{ fontWeight: 600 }}>{act.activityName}</td>
                    <td><span className="mono-pill">{act.discipline}</span></td>
                    <td>{act.area}</td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>{act.plannedStart} &rarr; {act.plannedFinish}</td>
                    <td style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{act.rawAliases || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="industrial-table">
              <thead>
                <tr>
                  <th>Update ID</th>
                  <th>Report Date</th>
                  <th>Discipline</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th>Raw Extracted Text</th>
                  <th>Line #</th>
                  <th>AI Match Category</th>
                </tr>
              </thead>
              <tbody>
                {(selectedPreview === 'txt' ? txtUpdates : xlsxUpdates).map(u => {
                  const match = matchResults[u.id];
                  const category = match?.category || 'unplanned';
                  return (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>{u.id}</td>
                      <td style={{ fontSize: '0.775rem' }}>{u.reportDate}</td>
                      <td><span className="mono-pill">{u.discipline}</span></td>
                      <td>{u.area || '—'}</td>
                      <td>
                        <span className={`status-badge ${u.eventStatus === 'Completed' ? 'ready' : 'review'}`}>
                          {u.eventStatus}
                        </span>
                      </td>
                      <td style={{ maxWidth: 300, fontSize: '0.8rem', fontWeight: 600 }}>{u.rawText}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.725rem' }}>#{u.lineEvidence || '—'}</td>
                      <td>
                        <span
                          className={`status-badge ${category === 'ready' ? 'ready' : category === 'review' ? 'review' : 'unplanned'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {category === 'ready' ? '✓ Auto-Match' : category === 'review' ? '⚠️ Planner Review' : '✕ Unplanned Scope'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
