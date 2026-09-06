import React, { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Camera,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Send,
  Radio,
  FileCode,
  Eye,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { SAMPLE_EVIDENCE_IMAGES } from '../utils/sampleImages';

export const SupervisorEntryView: React.FC = () => {
  const {
    handleAddNewFieldEntry,
    handleCustomUpload,
    siteUpdates,
    matchResults,
    setSelectedInspectorUpdateId,
    setActiveTab,
    offlineMode,
  } = useProject();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'quick-report' | 'file-upload' | 'photo-proof'>('quick-report');

  // Form State
  const [discipline, setDiscipline] = useState('Piping');
  const [description, setDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [area, setArea] = useState('Pump Bay');
  const [eventStatus, setEventStatus] = useState<'Started' | 'Completed' | 'In Progress'>('Completed');
  const [quantity, setQuantity] = useState('100%');
  const [supervisorName, setSupervisorName] = useState('R. Sharma (Lead Piping Supv)');

  // Photo Evidence State
  const [imagePreview, setImagePreview] = useState<string | null>(SAMPLE_EVIDENCE_IMAGES.pipeWeld);
  const [imageType, setImageType] = useState<'completion' | 'issue' | 'progress'>('completion');
  const [imageCaption, setImageCaption] = useState('Visual inspection verified for pipe joint erection');

  // Issue Blocker State
  const [isIssueReport, setIsIssueReport] = useState(false);
  const [issueFlag, setIssueFlag] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<'low' | 'medium' | 'critical'>('medium');

  // Submit Feedback
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // File Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchCsvRef = useRef<HTMLInputElement>(null);

  // Handle custom image file selection
  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit field entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    await handleAddNewFieldEntry({
      discipline,
      description,
      rawText: rawText || description,
      area,
      eventStatus,
      quantity,
      supervisor: supervisorName,
      imageFile: imagePreview || undefined,
      imageType,
      caption: imageCaption,
      issueFlag: isIssueReport ? issueFlag : undefined,
      issueSeverity: isIssueReport ? issueSeverity : undefined,
    });

    setSubmitSuccess(`Progress entry submitted & processed with AI multi-factor matching!`);
    setDescription('');
    setRawText('');
    setQuantity('100%');
    if (isIssueReport) setIssueFlag('');

    setTimeout(() => {
      setSubmitSuccess(null);
    }, 4000);
  };

  // Quick preset loader for supervisors
  const applyQuickTemplate = (preset: {
    disp: string;
    area: string;
    desc: string;
    raw: string;
    status: 'Started' | 'Completed' | 'In Progress';
    img: string;
    imgType: 'completion' | 'issue' | 'progress';
    caption: string;
    issue?: { flag: string; severity: 'low' | 'medium' | 'critical' };
  }) => {
    setDiscipline(preset.disp);
    setArea(preset.area);
    setDescription(preset.desc);
    setRawText(preset.raw);
    setEventStatus(preset.status);
    setImagePreview(preset.img);
    setImageType(preset.imgType);
    setImageCaption(preset.caption);
    if (preset.issue) {
      setIsIssueReport(true);
      setIssueFlag(preset.issue.flag);
      setIssueSeverity(preset.issue.severity);
    } else {
      setIsIssueReport(false);
      setIssueFlag('');
    }
  };

  // Batch file processing trigger
  const handleBatchFileDrop = async (file: File) => {
    const isTxt = file.name.endsWith('.txt');
    const isCsv = file.name.endsWith('.csv');
    const isXlsx = file.name.endsWith('.xlsx');

    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        await handleCustomUpload({ pipingProgressXlsx: buffer });
        setSubmitSuccess(`Excel file "${file.name}" parsed and ingested into Datum engine!`);
        setTimeout(() => setSubmitSuccess(null), 4000);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (isTxt) {
          await handleCustomUpload({ dailyReportTxt: content });
        } else {
          await handleCustomUpload({ dailyReportTxt: content });
        }
        setSubmitSuccess(`File "${file.name}" parsed and ingested into Datum engine!`);
        setTimeout(() => setSubmitSuccess(null), 4000);
      };
      reader.readAsText(file);
    }
  };

  // Recent supervisor submissions
  const recentSubmissions = siteUpdates.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner Header */}
      <div className="banner-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="brand-badge" style={{ background: '#e9f2ff', color: '#0c66e4', borderColor: '#cce0ff' }}>
              Field Supervisor Hub
            </span>
            {offlineMode && (
              <span className="mono-pill" style={{ background: '#fff4e5', color: '#974f0c', borderColor: '#fec195', fontWeight: 700 }}>
                ⚡ Offline Field Queue Active
              </span>
            )}
          </div>
          <h1 className="banner-title">
            <Camera size={22} style={{ color: 'var(--brand-primary)' }} />
            <span>Site Progress & Execution Evidence Portal</span>
          </h1>
          <p className="banner-desc">
            Submit daily progress logs, drag-and-drop batch spreadsheets, or record site blockers with photo evidence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('site-updates')}
            type="button"
          >
            <span>View Full Stream</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {submitSuccess && (
        <div
          style={{
            background: 'var(--status-ready-bg)',
            border: '1px solid var(--status-ready-border)',
            color: 'var(--status-ready-fg)',
            padding: '0.85rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          <CheckCircle2 size={20} />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* 3-Tab Mode Navigation Pill */}
      <div
        style={{
          display: 'flex',
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '5px',
          gap: '6px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('quick-report')}
          className="btn"
          style={{
            flex: 1,
            background: activeSubTab === 'quick-report' ? 'var(--brand-primary)' : 'transparent',
            color: activeSubTab === 'quick-report' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeSubTab === 'quick-report' ? 700 : 600,
            fontSize: '0.875rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: activeSubTab === 'quick-report' ? '0 1px 3px rgba(12, 102, 228, 0.3)' : 'none',
          }}
        >
          <FileText size={16} />
          <span>1. Direct Daily Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('file-upload')}
          className="btn"
          style={{
            flex: 1,
            background: activeSubTab === 'file-upload' ? 'var(--brand-primary)' : 'transparent',
            color: activeSubTab === 'file-upload' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeSubTab === 'file-upload' ? 700 : 600,
            fontSize: '0.875rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: activeSubTab === 'file-upload' ? '0 1px 3px rgba(12, 102, 228, 0.3)' : 'none',
          }}
        >
          <FileSpreadsheet size={16} />
          <span>2. CSV / XLSX / TXT Upload</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('photo-proof')}
          className="btn"
          style={{
            flex: 1,
            background: activeSubTab === 'photo-proof' ? 'var(--brand-primary)' : 'transparent',
            color: activeSubTab === 'photo-proof' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeSubTab === 'photo-proof' ? 700 : 600,
            fontSize: '0.875rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: activeSubTab === 'photo-proof' ? '0 1px 3px rgba(12, 102, 228, 0.3)' : 'none',
          }}
        >
          <Camera size={16} />
          <span>3. Photo Proof & Blocker Studio</span>
        </button>
      </div>

      {/* Main Form Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(330px, 1fr)', gap: '1.5rem' }}>
        
        {/* Left Column: Interactive Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* TAB 1: DIRECT REPORT */}
          {activeSubTab === 'quick-report' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
                    Write Direct Daily Progress Report
                  </h3>
                  <div className="card-desc">
                    Enter execution details below. Datum AI will automatically match them against schedule milestones.
                  </div>
                </div>
              </div>

              <div className="card-body">
                {/* 1-Click Field Scenarios */}
                <div
                  style={{
                    marginBottom: '1.25rem',
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Zap size={13} style={{ color: 'var(--brand-primary)' }} />
                    Quick Field Scenarios (1-Click Fill)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() =>
                        applyQuickTemplate({
                          disp: 'Piping',
                          area: 'Pump Bay',
                          desc: 'Hydrostatic testing completed for 8-inch cooling water headers at Pump Bay with zero pressure drop.',
                          raw: 'Hydro testing completed on cooling water header line 8in Pump Bay zero leaks',
                          status: 'Completed',
                          img: SAMPLE_EVIDENCE_IMAGES.pipeWeld,
                          imgType: 'completion',
                          caption: 'Hydro test pressure gauge reading 15.4 bar held for 4 hours',
                        })
                      }
                    >
                      <span>💧 Hydro Testing Complete</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() =>
                        applyQuickTemplate({
                          disp: 'Civil',
                          area: 'Substation #2',
                          desc: 'Foundation raft rebar binding finished. 450 m3 concrete pour underway with 2 pump trucks.',
                          raw: 'Civil foundation raft pour started Substation 2 450 cum pump in place',
                          status: 'In Progress',
                          img: SAMPLE_EVIDENCE_IMAGES.pumpFoundation,
                          imgType: 'progress',
                          caption: 'Slump test checked at 110mm, concrete pour underway',
                        })
                      }
                    >
                      <span>🏗️ Raft Concrete Pour</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() =>
                        applyQuickTemplate({
                          disp: 'Electrical',
                          area: 'Switchyard Bay 4',
                          desc: 'Main 33kV cable tray installation blocked due to heavy mobile crane hydraulic oil leak.',
                          raw: 'Cable tray work halted at Switchyard Bay 4 due to 50T crane breakdown blocking access',
                          status: 'Started',
                          img: SAMPLE_EVIDENCE_IMAGES.craneIssue,
                          imgType: 'issue',
                          caption: '50T crane hydraulic oil spill blocking cable route access',
                          issue: { flag: '50T Mobile Crane Hydraulic Failure — Access road blocked', severity: 'critical' },
                        })
                      }
                    >
                      <span>⚠️ Site Blocker / Breakdown</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  {/* Row 1: Discipline & Area */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Discipline</label>
                      <select
                        className="form-select"
                        value={discipline}
                        onChange={e => setDiscipline(e.target.value)}
                      >
                        <option value="Piping">Piping</option>
                        <option value="Civil">Civil / Structural</option>
                        <option value="Electrical">Electrical & Power</option>
                        <option value="Instrumentation">Instrumentation & Control</option>
                        <option value="Mechanical">Mechanical Equipment</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Work Area / Grid Reference</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Pump Bay, Substation #2"
                        value={area}
                        onChange={e => setArea(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row 2: Status, Quantity & Supervisor */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Execution Status</label>
                      <select
                        className="form-select"
                        value={eventStatus}
                        onChange={e => setEventStatus(e.target.value as any)}
                      >
                        <option value="Completed">Completed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Started">Started</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Quantity / Progress</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 100%, 450 m3, 12 joints"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Reporting Supervisor</label>
                      <input
                        type="text"
                        className="form-input"
                        value={supervisorName}
                        onChange={e => setSupervisorName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row 3: Formal Activity Description */}
                  <div className="form-group">
                    <label className="form-label">
                      <span>Formal Activity Description</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Core input for NLP matching</span>
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="e.g. Hydrostatic testing of 8in cooling water line completed at Pump Bay."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  {/* Row 4: Raw Field Log / Voice Transcript */}
                  <div className="form-group">
                    <label className="form-label">
                      <span>Raw Field Voice Note / Log Text</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preserves original site note verbatim</span>
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="e.g. Hydro completed on cooling water header line 8in Pump Bay zero leaks"
                      value={rawText}
                      onChange={e => setRawText(e.target.value)}
                    />
                  </div>

                  {/* Blocker / Issue Toggle Card */}
                  <div
                    style={{
                      background: isIssueReport ? '#fff5f5' : '#f8fafc',
                      border: `1px solid ${isIssueReport ? '#fca5a5' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <AlertOctagon size={18} style={{ color: isIssueReport ? '#dc2626' : 'var(--text-muted)' }} />
                        <div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: isIssueReport ? '#dc2626' : 'var(--text-primary)' }}>
                            Flag as Site Blocker / Delay Issue
                          </span>
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                            Instantly alerts project planners and flags critical path risk
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isIssueReport}
                        onChange={e => setIsIssueReport(e.target.checked)}
                        style={{ cursor: 'pointer', width: 18, height: 18 }}
                      />
                    </div>

                    {isIssueReport && (
                      <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Describe blocker reason (e.g. 50T crane breakdown, access road blocked, missing parts)"
                          value={issueFlag}
                          onChange={e => setIssueFlag(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#dc2626' }}>Severity:</span>
                          {(['low', 'medium', 'critical'] as const).map(sev => (
                            <button
                              type="button"
                              key={sev}
                              onClick={() => setIssueSeverity(sev)}
                              className="btn btn-sm"
                              style={{
                                textTransform: 'capitalize',
                                fontSize: '0.75rem',
                                padding: '0.3rem 0.75rem',
                                background: issueSeverity === sev ? '#dc2626' : '#ffffff',
                                color: issueSeverity === sev ? '#ffffff' : '#dc2626',
                                borderColor: '#fca5a5',
                                fontWeight: 700,
                              }}
                            >
                              {sev}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.25rem', fontSize: '0.925rem', fontWeight: 700, justifyContent: 'center' }}
                  >
                    <Send size={16} />
                    <span>Submit & Run AI Match Reconciliation</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: FILE UPLOAD (CSV, XLSX, TXT) */}
          {activeSubTab === 'file-upload' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <FileSpreadsheet size={18} style={{ color: 'var(--brand-primary)' }} />
                    Batch Spreadsheet & Text File Ingestion
                  </h3>
                  <div className="card-desc">
                    Upload daily field logs in CSV, Excel XLSX, or plain text format. Datum parses any format automatically.
                  </div>
                </div>
              </div>

              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* File Dropzone */}
                <div
                  style={{
                    border: '2px dashed var(--brand-primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onClick={() => batchCsvRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleBatchFileDrop(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'var(--brand-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-primary)',
                    }}
                  >
                    <UploadCloud size={28} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      Drag & Drop CSV / XLSX / TXT Log Files Here
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Supports Daily Reports (.txt), Piping Progress (.xlsx), and Site Logs (.csv)
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={batchCsvRef}
                    accept=".csv,.txt,.xlsx"
                    style={{ display: 'none' }}
                    onChange={e => {
                      if (e.target.files?.[0]) handleBatchFileDrop(e.target.files[0]);
                    }}
                  />
                </div>

                {/* Pre-formatted Sample Loaders */}
                <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                    ⚡ Instant Sample Data Ingestion (One-Click Test)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const sampleCSV = `SiteUpdate_ID,Discipline,Activity_Description,Raw_Text,Work_Area,Status,Quantity,Supervisor
SUP-101,Piping,Erection of 12-inch main steam header spool,Erected 12in spool on rack line B,Rack Line B,Completed,1 spool,R. Sharma
SUP-102,Civil,Concreting of turbine deck pier foundation,Poured 80 m3 concrete pier foundation,Turbine Area,Completed,80 m3,A. Verma
SUP-103,Electrical,Cable pulling for 415V MCC motor feeds,Pulled 650m 3.5C cable to MCC-2,Switchgear Rm,In Progress,650m,M. Gupta`;
                        handleCustomUpload({ dailyReportTxt: sampleCSV });
                        setSubmitSuccess('Loaded 3 sample CSV entries and matched to schedule!');
                        setTimeout(() => setSubmitSuccess(null), 4000);
                      }}
                    >
                      <FileCode size={15} />
                      <span>Load Sample Daily CSV</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const sampleTXT = `Daily Supervisor Site Note - 06 Sept 2026
-------------------------------------------
1. Hydro test 8in CW header Pump Bay completed zero pressure loss.
2. Foundation raft rebar binding 100% finished Substation 2.
3. 33kV cable tray work stopped switchyard bay 4 due to crane spill.`;
                        handleCustomUpload({ dailyReportTxt: sampleTXT });
                        setSubmitSuccess('Parsed text file into structured execution events!');
                        setTimeout(() => setSubmitSuccess(null), 4000);
                      }}
                    >
                      <FileText size={15} />
                      <span>Load Raw Text Log</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHOTO PROOF & BLOCKER STUDIO */}
          {activeSubTab === 'photo-proof' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <Camera size={18} style={{ color: 'var(--brand-primary)' }} />
                    Photo Evidence & Visual Proof Ingestion
                  </h3>
                  <div className="card-desc">
                    Attach visual proof of completed work or document site blockers and equipment breakdowns.
                  </div>
                </div>
              </div>

              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Photo Previews & Presets */}
                <div>
                  <label className="form-label">Select Realistic Construction Evidence Sample</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    {[
                      { key: 'pipeWeld', label: 'Pipe Weld NDT', src: SAMPLE_EVIDENCE_IMAGES.pipeWeld, type: 'completion' as const, cap: 'Visual inspection verified for pipe joint erection' },
                      { key: 'pumpFoundation', label: 'Raft Concreting', src: SAMPLE_EVIDENCE_IMAGES.pumpFoundation, type: 'progress' as const, cap: 'Slump test checked at 110mm, concrete pour underway' },
                      { key: 'cableTray', label: 'Cable Tray Pull', src: SAMPLE_EVIDENCE_IMAGES.cableTray, type: 'completion' as const, cap: 'Tier 3 cable tray support brackets bolted and torqued' },
                      { key: 'craneIssue', label: 'Crane Breakdown', src: SAMPLE_EVIDENCE_IMAGES.craneIssue, type: 'issue' as const, cap: '50T crane hydraulic oil leak blocking access road' },
                    ].map(item => (
                      <div
                        key={item.key}
                        onClick={() => {
                          setImagePreview(item.src);
                          setImageType(item.type);
                          setImageCaption(item.cap);
                          if (item.type === 'issue') {
                            setIsIssueReport(true);
                            setIssueFlag('Equipment Breakdown — Access blocked');
                            setIssueSeverity('critical');
                          }
                        }}
                        style={{
                          border: imagePreview === item.src ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          background: '#ffffff',
                          boxShadow: imagePreview === item.src ? 'var(--shadow-card-hover)' : 'var(--shadow-xs)',
                        }}
                      >
                        <img src={item.src} alt={item.label} style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                        <div style={{ padding: '6px 8px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Upload Option */}
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud size={15} />
                      <span>Upload Custom Image From Device</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleCustomImageUpload}
                    />
                  </div>
                </div>

                {/* Selected Image Detail & Caption */}
                {imagePreview && (
                  <div
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      background: '#f8fafc',
                      display: 'flex',
                      gap: '1rem',
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Selected Evidence"
                      style={{ width: 140, height: 95, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          className="mono-pill"
                          style={{
                            background: imageType === 'issue' ? '#ffebe6' : '#dcfff1',
                            color: imageType === 'issue' ? '#ae2e24' : '#1f845a',
                            borderColor: imageType === 'issue' ? '#fd9891' : '#7ee2b8',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                          }}
                        >
                          {imageType.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Timestamp: 2026-09-06 13:05 IST</span>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Caption / Inspection Note"
                        value={imageCaption}
                        onChange={e => setImageCaption(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Stream & Matching Intelligence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Live Matching Intelligence Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h4 className="card-title">
                  <Sparkles size={16} style={{ color: 'var(--brand-primary)' }} />
                  Datum NLP & Spatial Engine
                </h4>
                <div className="card-desc">Deterministic multi-factor matching intelligence.</div>
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.8125rem' }}>
                <CheckCircle2 size={16} style={{ color: '#1f845a', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>Semantic Fuzzy Matching:</strong> Evaluates Jaccard, Token Sort, and Levenshtein similarity against schedule titles.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.8125rem' }}>
                <CheckCircle2 size={16} style={{ color: '#1f845a', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>Discipline & Spatial Filter:</strong> Enforces discipline taxonomy boundaries (Piping vs Civil vs Electrical).
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.8125rem' }}>
                <CheckCircle2 size={16} style={{ color: '#1f845a', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>Photo Provenance Hash:</strong> Hashes attached photo files and stores SHA256 in immutable audit log.
                </div>
              </div>
            </div>
          </div>

          {/* Recent Submissions Feed */}
          <div className="card">
            <div className="card-header">
              <div>
                <h4 className="card-title">
                  <Radio size={16} style={{ color: 'var(--brand-primary)' }} />
                  Recent Field Stream
                </h4>
                <div className="card-desc">Latest {recentSubmissions.length} field events ingested.</div>
              </div>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentSubmissions.map(item => {
                  const match = matchResults[item.id];
                  const matchCategory = match?.category || 'review';
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedInspectorUpdateId(item.id);
                      }}
                      style={{
                        padding: '0.85rem 1.15rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span className="mono-pill" style={{ fontSize: '0.7rem' }}>{item.id}</span>
                          <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.discipline}</span>
                        </div>
                        <span
                          className="mono-pill"
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            background: matchCategory === 'ready' ? '#dcfff1' : matchCategory === 'unplanned' ? '#ffebe6' : '#fff4e5',
                            color: matchCategory === 'ready' ? '#1f845a' : matchCategory === 'unplanned' ? '#ae2e24' : '#974f0c',
                            borderColor: matchCategory === 'ready' ? '#7ee2b8' : matchCategory === 'unplanned' ? '#fd9891' : '#fec195',
                          }}
                        >
                          {matchCategory.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {item.extractedDescription || item.rawText}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Area: <strong>{item.area || 'General'}</strong></span>
                        <span style={{ color: 'var(--brand-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                          Inspect <Eye size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
