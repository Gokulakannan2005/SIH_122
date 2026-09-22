import React, { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  ArrowRight,
  Layers,
  Calendar,
  Sparkles,
  BarChart3,
  Download,
  Eye,
  RefreshCw,
  Search,
  Check,
  RotateCcw,
  BookOpen,
  FolderPlus,
} from 'lucide-react';
import { formatDisplayDate } from '../utils/scheduleSimulator';

export const UploadDemoView: React.FC = () => {
  const {
    schedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    handleCustomUpload,
    handlePlannerAction,
    setSelectedInspectorUpdateId,
    setSelectedReviewUpdateId,
    setPlannerQueueFilter,
    navigateToPlannerReviewWithFilter,
    setActiveTab,
    loadDemoData,
    exportAlignmentCSV,
    setIsProjectAnalyticsOpen,
    setIsSystemTourOpen,
    currentProject,
    currentRole,
    addToast,
  } = useProject();

  const isSupervisor = currentRole === 'supervisor';

  // Parsing progress animation state
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsingProgress, setParsingProgress] = useState<number>(0);
  const [parsingStage, setParsingStage] = useState<string>('');

  // Active post-parsing sub-tab
  const [activeResultsTab, setActiveResultsTab] = useState<'auto_matched' | 'human_verification'>('auto_matched');
  const [searchQuery, setSearchQuery] = useState('');

  const scheduleInputRef = useRef<HTMLInputElement>(null);
  const reportTxtInputRef = useRef<HTMLInputElement>(null);
  const progressXlsxInputRef = useRef<HTMLInputElement>(null);

  // Trigger simulated mini progress bar during ingestion
  const runParsingAnimation = (callback: () => Promise<void>) => {
    setIsParsing(true);
    setParsingProgress(15);
    setParsingStage('Tokenizing raw input & normalizing entries...');

    setTimeout(() => {
      setParsingProgress(45);
      setParsingStage('Extracting discipline keywords, workfront areas & system tags...');
    }, 400);

    setTimeout(() => {
      setParsingProgress(80);
      setParsingStage('Evaluating NLP semantic similarity & Level-5/6 schedule matching...');
    }, 800);

    setTimeout(async () => {
      setParsingProgress(100);
      setParsingStage('Parsing complete! Categorizing confident vs uncertain matches...');
      await callback();
      setTimeout(() => {
        setIsParsing(false);
        setParsingProgress(0);
        setParsingStage('');
      }, 500);
    }, 1200);
  };

  // Schedule upload handler
  const handleScheduleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      runParsingAnimation(async () => {
        await handleCustomUpload({ scheduleCsv: text });
      });
    };
    reader.readAsText(file);
  };

  // Daily report txt handler
  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      runParsingAnimation(async () => {
        await handleCustomUpload({ dailyReportTxt: text });
      });
    };
    reader.readAsText(file);
  };

  // Piping progress xlsx handler
  const handleXlsxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const buffer = event.target?.result as ArrayBuffer;
      runParsingAnimation(async () => {
        await handleCustomUpload({ pipingProgressXlsx: buffer });
      });
    };
    reader.readAsArrayBuffer(file);
  };

  // Load 3-Scenario sample report (Confident, Unsure, Unplanned)
  const handleLoadSampleData = () => {
    runParsingAnimation(async () => {
      await loadDemoData();
    });
  };

  // Categorized records
  const autoMatchedReports = siteUpdates.filter(u => {
    const match = matchResults[u.id];
    return match && match.category === 'ready';
  });

  const uncertainReports = siteUpdates.filter(u => {
    const match = matchResults[u.id];
    const dec = plannerDecisions[u.id];
    const isUnplanned = dec?.status === 'unplanned' || (!dec && match?.category === 'unplanned');
    const isReview = !dec && match?.category === 'review';
    return isUnplanned || isReview;
  });

  // Filtered lists based on search
  const filteredAutoMatched = autoMatchedReports.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.id.toLowerCase().includes(q) ||
      u.extractedDescription.toLowerCase().includes(q) ||
      u.discipline.toLowerCase().includes(q) ||
      (u.area && u.area.toLowerCase().includes(q))
    );
  });

  const filteredUncertain = uncertainReports.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.id.toLowerCase().includes(q) ||
      u.extractedDescription.toLowerCase().includes(q) ||
      u.discipline.toLowerCase().includes(q) ||
      (u.area && u.area.toLowerCase().includes(q))
    );
  });

  const handleOpenVerificationQueue = (updateId?: string) => {
    if (updateId) {
      setSelectedReviewUpdateId(updateId);
      setPlannerQueueFilter('all');
    }
    setActiveTab('planner-review');
  };

  return (
    <div className="upload-view-container" style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={scheduleInputRef}
        onChange={handleScheduleUpload}
        accept=".csv,.xlsx,.xer"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={reportTxtInputRef}
        onChange={handleTxtUpload}
        accept=".txt"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={progressXlsxInputRef}
        onChange={handleXlsxUpload}
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
      />

      {/* Top Banner & Quick Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))',
          borderRadius: 12,
          padding: '1rem 1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(14, 165, 233, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadCloud size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>
              Project Data Ingestion & Auto-Matching Suite
            </h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              Upload master schedules and daily execution logs. AI automatically maps progress to Level-5/Level-6 activities.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => setIsSystemTourOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 8,
              border: '1px solid var(--border-default, #334155)',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-secondary, #cbd5e1)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <BookOpen size={14} />
            <span>Guidebook</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            disabled={schedule.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 8,
              border: '1px solid var(--border-default, #334155)',
              background: 'rgba(255,255,255,0.05)',
              color: schedule.length > 0 ? '#38bdf8' : 'var(--text-muted, #64748b)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: schedule.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            <Calendar size={14} />
            <span>Master Calendar & Clock</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProjectAnalyticsOpen(true)}
            disabled={siteUpdates.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 8,
              border: 'none',
              background: siteUpdates.length > 0 ? '#10b981' : '#334155',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: siteUpdates.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            <BarChart3 size={14} />
            <span>Analytics & Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3 Fresh Demo Files Direct Action Strip */}
      <div
        style={{
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))',
          borderRadius: 12,
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(14, 165, 233, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FolderPlus size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Sample Demo Files (3 Files Formatted for Live Demonstration)
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Ready inside <code style={{ background: 'var(--bg-subtle, rgba(0,0,0,0.1))', padding: '1px 5px', borderRadius: 4, color: 'var(--text-secondary)' }}>d:\SIH_122_AG\demo_sample_files\</code> or download below:
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a
            href="/demo_sample_files/01_Master_Schedule_P6_Baseline.csv"
            download="01_Master_Schedule_P6_Baseline.csv"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0.4rem 0.75rem',
              borderRadius: 6,
              background: 'rgba(2, 132, 199, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '0.74rem',
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            title="Download Step 1 Master Schedule Baseline CSV"
          >
            <Download size={12} />
            <span>1. Baseline Schedule (.csv)</span>
          </a>

          <a
            href="/demo_sample_files/02_Daily_Site_Report_Field_Log.txt"
            download="02_Daily_Site_Report_Field_Log.txt"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0.4rem 0.75rem',
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.74rem',
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            title="Download Step 2 Daily Site Report Field Log TXT"
          >
            <Download size={12} />
            <span>2. Daily Report (.txt)</span>
          </a>

          <a
            href="/demo_sample_files/03_Contractor_Daily_Progress_Sheet.xlsx"
            download="03_Contractor_Daily_Progress_Sheet.xlsx"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '0.4rem 0.75rem',
              borderRadius: 6,
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontSize: '0.74rem',
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            title="Download Step 2 Contractor Progress Sheet XLSX"
          >
            <Download size={12} />
            <span>3. Contractor Sheet (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* STEP 1: Master Schedule Ingestion */}
      <div
        style={{
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))',
          borderRadius: 12,
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: schedule.length > 0 ? '#10b981' : '#0284c7',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {schedule.length > 0 ? <Check size={14} /> : '1'}
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>
                Step 1: Master Baseline Schedule (Primavera P6 / MS Project)
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                Upload the approved engineering schedule (CSV or XLSX). You can update or replace this schedule at any time.
              </p>
            </div>
          </div>

          {schedule.length > 0 && (
            <button
              type="button"
              onClick={() => scheduleInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 6,
                border: '1px solid #0284c7',
                background: 'rgba(2, 132, 199, 0.12)',
                color: '#38bdf8',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} />
              <span>Update Schedule Anytime</span>
            </button>
          )}
        </div>

        {schedule.length === 0 ? (
          /* Empty State Dropzone when no schedule is uploaded */
          <div
            onClick={() => scheduleInputRef.current?.click()}
            style={{
              padding: '2.5rem 1.5rem',
              borderRadius: 10,
              border: '2px dashed rgba(56, 189, 248, 0.35)',
              background: 'rgba(14, 165, 233, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            className="hover-card"
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(14, 165, 233, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <FileSpreadsheet size={26} />
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #fff)', marginBottom: 4 }}>
              Click to Upload Primavera P6 / MS Project Schedule
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', textAlign: 'center', maxWidth: 460 }}>
              Supports .csv and .xlsx with Activity ID, WBS, Activity Name, Discipline, Planned Start, Planned Finish, Area, and Aliases.
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  handleLoadSampleData();
                }}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 6,
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  background: 'rgba(14, 165, 233, 0.1)',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Or Load Benchmark Sample Schedule
              </button>
            </div>
          </div>
        ) : (
          /* Active Schedule Summary Badge */
          <div
            style={{
              padding: '0.85rem 1.2rem',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={18} style={{ color: '#34d399' }} />
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                  Baseline Active: {schedule.length} Schedule Activities Configured
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginLeft: '0.5rem' }}>
                  • Level-5/Level-6 WBS mapped • Auto-calendar synchronization enabled
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                Civil ({schedule.filter(a => a.discipline === 'Civil').length})
              </span>
              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                Piping ({schedule.filter(a => a.discipline === 'Piping').length})
              </span>
              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                Electrical ({schedule.filter(a => a.discipline === 'Electrical').length})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: Daily Progress Reports Ingestion */}
      <div
        style={{
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))',
          borderRadius: 12,
          padding: '1.25rem',
          opacity: schedule.length === 0 ? 0.5 : 1,
          pointerEvents: schedule.length === 0 ? 'none' : 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: siteUpdates.length > 0 ? '#10b981' : '#0284c7',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {siteUpdates.length > 0 ? <Check size={14} /> : '2'}
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>
                Step 2: Ingest Daily Execution Reports (TXT or XLSX)
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
                Upload raw daily field reports or progress spreadsheets. Prototype does not load phantom records until provided.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLoadSampleData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 6,
              border: '1px solid rgba(16, 185, 129, 0.4)',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={13} />
            <span>Load Sample 3-Scenario Report</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Daily Report TXT Card */}
          <div
            onClick={() => reportTxtInputRef.current?.click()}
            style={{
              padding: '1.25rem',
              borderRadius: 10,
              border: '1px dashed var(--border-default, #334155)',
              background: 'rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer',
            }}
            className="hover-card"
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                Upload Daily Progress Report (.txt)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
                Text logs with numbered shift items, supervisor notes &amp; out-of-baseline flags.
              </div>
            </div>
          </div>

          {/* Piping Progress XLSX Card */}
          <div
            onClick={() => progressXlsxInputRef.current?.click()}
            style={{
              padding: '1.25rem',
              borderRadius: 10,
              border: '1px dashed var(--border-default, #334155)',
              background: 'rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer',
            }}
            className="hover-card"
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                Upload Progress Spreadsheet (.xlsx)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
                Excel sheets with spool tags, fabrication records &amp; hydrostatic test logs.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Parsing Progress Bar Animation */}
      {isParsing && (
        <div
          style={{
            background: 'var(--bg-surface, #1e293b)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 12,
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
              <RefreshCw size={15} className="animate-spin" />
              <span>{parsingStage}</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
              {parsingProgress}%
            </span>
          </div>

          <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${parsingProgress}%`,
                height: '100%',
                borderRadius: 4,
                background: 'linear-gradient(to right, #0284c7, #38bdf8)',
                transition: 'width 0.35s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* POST-PARSING TWO SECTIONS */}
      {siteUpdates.length > 0 && !isParsing && (
        <div
          style={{
            background: 'var(--bg-surface, #1e293b)',
            border: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* Section Tabs Header */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid var(--border-default, rgba(255, 255, 255, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveResultsTab('auto_matched')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: 8,
                  border: 'none',
                  background: activeResultsTab === 'auto_matched' ? '#0284c7' : 'transparent',
                  color: activeResultsTab === 'auto_matched' ? '#fff' : 'var(--text-secondary, #94a3b8)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={15} />
                <span>1. Auto Matched Reports ({autoMatchedReports.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveResultsTab('human_verification')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: 8,
                  border: 'none',
                  background: activeResultsTab === 'human_verification' ? '#f59e0b' : 'transparent',
                  color: activeResultsTab === 'human_verification' ? '#000' : 'var(--text-secondary, #94a3b8)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <HelpCircle size={15} />
                <span>2. Human Verification Queue ({uncertainReports.length})</span>
              </button>
            </div>

            {/* Quick Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-default, #334155)', borderRadius: 6, padding: '0.35rem 0.65rem' }}>
              <Search size={14} style={{ color: 'var(--text-muted, #94a3b8)' }} />
              <input
                type="text"
                placeholder="Filter results..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.78rem',
                  outline: 'none',
                  width: 160,
                }}
              />
            </div>
          </div>

          {/* TAB 1: Auto Matched Reports Content */}
          {activeResultsTab === 'auto_matched' && (
            <div style={{ padding: '1rem', overflowX: 'auto' }}>
              {filteredAutoMatched.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                  No auto matched reports found.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default, #334155)', color: 'var(--text-muted, #94a3b8)', textAlign: 'left' }}>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Report ID</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Extracted Description</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Discipline &amp; Area</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Matched Activity ID</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>AI Confidence</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Variance Status</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAutoMatched.map(u => {
                      const match = matchResults[u.id];
                      const matchedAct = schedule.find(s => s.activityId === match?.candidateActivityId);
                      return (
                        <tr
                          key={u.id}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                          className="hover-table-row"
                          onClick={() => setSelectedInspectorUpdateId(u.id)}
                        >
                          <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                            {u.id}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-primary, #fff)', maxWidth: 320 }}>
                            {u.extractedDescription}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary, #cbd5e1)' }}>
                            {u.discipline} • {u.area}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem' }}>
                            <span style={{ fontWeight: 700, color: '#34d399' }}>
                              {matchedAct?.activityId || 'AUTO-LINKED'}
                            </span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)' }}>
                              {matchedAct?.activityName || ''}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem' }}>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}>
                              {match?.confidenceScore || 90}%
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem' }}>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
                              On Schedule
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedInspectorUpdateId(u.id);
                              }}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: 4,
                                border: '1px solid #334155',
                                background: 'transparent',
                                color: '#38bdf8',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: Human Verification / Uncertain Queue Content */}
          {activeResultsTab === 'human_verification' && (
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Verification Queue Redirection Header Banner */}
              <div
                style={{
                  padding: '0.85rem 1.15rem',
                  borderRadius: 8,
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HelpCircle size={16} />
                    <span>Human Verification Queue ({filteredUncertain.length} Items Pending Review)</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 2 }}>
                    Tasks flagged for human verification, ambiguous matching, or out-of-baseline work. Click any task to verify it directly in the Verification Queue workbench.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (filteredUncertain.length > 0) {
                      handleOpenVerificationQueue(filteredUncertain[0].id);
                    } else {
                      handleOpenVerificationQueue();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0.5rem 1rem',
                    borderRadius: 6,
                    border: 'none',
                    background: '#f59e0b',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }}
                  title="Open Full Verification Queue workbench with selected task"
                >
                  <span>Open Full Verification Queue ({filteredUncertain.length})</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {filteredUncertain.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#34d399' }}>
                  <CheckCircle2 size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                  Zero ambiguous or out-of-baseline records pending review!
                </div>
              ) : (
                filteredUncertain.map(u => {
                  const match = matchResults[u.id];
                  const dec = plannerDecisions[u.id];
                  const isUnplanned = match?.category === 'unplanned';
                  const candidateAct = schedule.find(s => s.activityId === match?.candidateActivityId);

                  return (
                    <div
                      key={u.id}
                      style={{
                        padding: '1rem',
                        borderRadius: 8,
                        background: isUnplanned ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                        border: `1px solid ${isUnplanned ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: '1 1 340px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isUnplanned ? '#f87171' : '#fbbf24' }}>
                            {u.id} • {isUnplanned ? 'OUT-OF-BASELINE (UNPLANNED)' : 'AMBIGUOUS / UNSURE MATCH'}
                          </span>
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                            AI Score: {match?.confidenceScore || 0}%
                          </span>
                          {dec?.status && (
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: dec.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: dec.status === 'approved' ? '#34d399' : '#f87171', fontWeight: 700 }}>
                              Status: {dec.status.toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary, #fff)', fontWeight: 600 }}>
                          {u.extractedDescription}
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 4 }}>
                          Discipline: {u.discipline} • Area: {u.area} • Source: {u.sourceFile}
                          {candidateAct && ` • Suggested Candidate: ${candidateAct.activityId} (${candidateAct.activityName})`}
                        </div>
                      </div>

                      {/* Action Buttons with Explicit Task Redirection */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedInspectorUpdateId(u.id)}
                          style={{
                            padding: '0.45rem 0.8rem',
                            borderRadius: 6,
                            border: '1px solid #334155',
                            background: 'transparent',
                            color: '#38bdf8',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                          title="Open visual inspector drawer"
                        >
                          Inspect Evidence
                        </button>

                        {/* Dedicated direct redirection to verification queue with this exact task preselected */}
                        <button
                          type="button"
                          onClick={() => handleOpenVerificationQueue(u.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.45rem 0.85rem',
                            borderRadius: 6,
                            border: '1px solid #38bdf8',
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title={`Open task ${u.id} in Verification Queue with full dual-pane workbench`}
                        >
                          <span>Verify in Queue</span>
                          <ArrowRight size={13} />
                        </button>

                        {isUnplanned ? (
                          <button
                            type="button"
                            onClick={() => handlePlannerAction(u.id, 'mark_unplanned', null, 'Confirmed out-of-baseline workfront action.')}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: 6,
                              border: 'none',
                              background: '#ef4444',
                              color: '#fff',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Confirm Unplanned Flag
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                if (match?.candidateActivityId) {
                                  handlePlannerAction(u.id, 'approve', match.candidateActivityId, 'Approved by Lead Planner after human review.');
                                } else {
                                  handleOpenVerificationQueue(u.id);
                                }
                              }}
                              style={{
                                padding: '0.45rem 0.85rem',
                                borderRadius: 6,
                                border: 'none',
                                background: '#10b981',
                                color: '#fff',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Approve Match
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenVerificationQueue(u.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.45rem 0.85rem',
                                borderRadius: 6,
                                border: '1px solid #f59e0b',
                                background: 'rgba(245, 158, 11, 0.1)',
                                color: '#fbbf24',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title={`Relink schedule activity for task ${u.id} in Verification Queue`}
                            >
                              <span>Relink Activity</span>
                              <ArrowRight size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
