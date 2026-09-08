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
  ChevronRight
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
  } = useProject();

  const isSupervisor = currentRole === 'supervisor';

  const [selectedPreview, setSelectedPreview] = useState<'schedule' | 'txt' | 'xlsx'>('schedule');
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [isActivatingVersion, setIsActivatingVersion] = useState(false);
  const [supervisorSearch, setSupervisorSearch] = useState('');

  const scheduleInputRef = useRef<HTMLInputElement>(null);
  const scheduleRevisedInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);
  const xlsxInputRef = useRef<HTMLInputElement>(null);

  const txtUpdates = siteUpdates.filter(u => u.sourceFile === 'daily_report.txt');
  const xlsxUpdates = siteUpdates.filter(u => u.sourceFile === 'piping_progress.xlsx');

  // Handle schedule master upload (Planner only)
  const handleScheduleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      await handleCustomUpload({ scheduleCsv: text });
      setUploadStatusMsg(`Uploaded & parsed ${file.name} successfully.`);
      setTimeout(() => setUploadStatusMsg(null), 4000);
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
      setUploadStatusMsg(`Uploaded & parsed ${file.name} successfully.`);
      setTimeout(() => setUploadStatusMsg(null), 4000);
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
      setUploadStatusMsg(`Uploaded & parsed ${file.name} successfully.`);
      setTimeout(() => setUploadStatusMsg(null), 4000);
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

  // Dedicated Supervisor Read-Only View (when not in guided demo tour)
  if (isSupervisor && !isGuidedDemoActive) {
    const filteredSchedule = schedule.filter(act => {
      if (!supervisorSearch.trim()) return true;
      const q = supervisorSearch.toLowerCase();
      return (
        act.activityId.toLowerCase().includes(q) ||
        act.activityName.toLowerCase().includes(q) ||
        act.discipline.toLowerCase().includes(q) ||
        act.area.toLowerCase().includes(q) ||
        act.wbs.toLowerCase().includes(q)
      );
    });

    return (
      <div id="demo-target-project-schedule" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Read-Only Banner for Supervisor */}
        <div className="banner-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="brand-badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                Field Supervisor Reference
              </span>
              <span
                className="mono-pill"
                style={{
                  background: 'var(--status-ready-bg)',
                  color: 'var(--status-ready-fg)',
                  borderColor: 'var(--status-ready-border)',
                  fontWeight: 700,
                }}
              >
                Active Schedule: {activeVersion.versionId}
              </span>
            </div>
            <h1 className="banner-title">
              <Database size={20} style={{ color: 'var(--brand-primary)' }} />
              <span>Project Schedule & Activity Reference</span>
            </h1>
            <p className="banner-desc">
              Browse planned activities, WBS milestone identifiers, and execution windows for your workfront. Official schedule baselines are administered by the Lead Planner.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => setActiveTab('supervisor-entry')}
              type="button"
            >
              <span>Go to Today's Tasks</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Active Schedule Metadata Card (Read-Only) */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--brand-surface)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeVersion.projectId || 'IOCL Refinery - P4'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Active Master Schedule • Version {activeVersion.versionId}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="mono-pill" style={{ fontWeight: 700 }}>
                {schedule.length} Activities Total
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('schedule-activities')}
                type="button"
              >
                <Eye size={13} />
                <span>Open 4D Gantt View</span>
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="search-input-box" style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', fontSize: '0.825rem' }}
              placeholder="Search planned activities by ID, name, discipline, or area..."
              value={supervisorSearch}
              onChange={e => setSupervisorSearch(e.target.value)}
            />
          </div>

          {/* Clean Schedule Table */}
          <div className="table-responsive">
            <table className="industrial-table">
              <thead>
                <tr>
                  <th>Activity ID</th>
                  <th>L5 Code</th>
                  <th>Fingerprint</th>
                  <th>WBS</th>
                  <th>Activity Name</th>
                  <th>Discipline</th>
                  <th>Area</th>
                  <th>Planned Window</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.map(act => (
                  <tr key={act.activityId}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                      {act.activityId}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.725rem', color: '#3b82f6' }}>
                      {act.l5Code || `IOCL.P4.${(act.area || 'UNIT01').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}.${act.discipline.substring(0, 3).toUpperCase()}.L5.011`}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      #{act.taskHash || 'D7A9F4B2'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.725rem' }}>{act.wbs}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.activityName}</td>
                    <td><span className="mono-pill">{act.discipline}</span></td>
                    <td>{act.area}</td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                      {act.plannedStart} &rarr; {act.plannedFinish}
                    </td>
                    <td>
                      <span className={`status-badge ${act.status === 'Completed' ? 'ready' : act.status === 'In Progress' ? 'review' : 'unplanned'}`}>
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header matching Reference Screen 2 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Project Schedule
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Upload, manage and compare project schedules. Keep the field and plan aligned.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('schedule-activities')}
            type="button"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', fontWeight: 600 }}
          >
            <span>View Full Schedule</span>
          </button>

          <input
            type="file"
            ref={scheduleRevisedInputRef}
            accept=".xlsx,.csv,.xml,.xer"
            style={{ display: 'none' }}
            onChange={handleRevisedScheduleUpload}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => scheduleRevisedInputRef.current?.click()}
            type="button"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', fontWeight: 600 }}
          >
            <FileUp size={13} />
            <span>Upload New Schedule</span>
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

      {/* TOP: ACTIVE SCHEDULE CARD */}
      <div id="demo-target-project-schedule" className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Database size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Schedule
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#059669', background: 'rgba(5, 150, 105, 0.12)', padding: '1px 6px', borderRadius: 3 }}>
                  CURRENT
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                {activeVersion.versionId} Production Schedule
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className="status-badge ready"
              style={{ fontWeight: 700, fontSize: '0.725rem' }}
            >
              ● Active
            </span>
          </div>
        </div>

        {/* Structured Metadata Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', background: 'var(--bg-subtle)', padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Uploaded by</div>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              {activeVersion.uploadedBy || 'Gokulakannan P.'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Date</div>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              {activeVersion.uploadedAt || '5 Sep 2026'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Source</div>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              Primavera P6
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Format</div>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              XLSX
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Activities</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              {(activeVersion.activitiesCount || schedule.length).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE TWO-COLUMN GRID: UPLOAD REVISED SCHEDULE & SCHEDULE COMPARISON */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '1.25rem' }}>
        {/* Left Column: Upload Revised Schedule */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
            Upload Revised Schedule
          </h3>

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

        {/* Right Column: Schedule Comparison */}
        <div id="demo-target-version-control" className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Schedule Comparison
              </h3>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>5 Sep 2026</span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.85rem' }}>
              Rev-02 &rarr; Rev-03
            </div>

            {/* Comparison Metrics List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#059669', fontWeight: 600 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>+</span>
                <span>12 New Activities</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#2563eb', fontWeight: 600 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>~</span>
                <span>27 Modified Activities</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#d97706', fontWeight: 600 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>~</span>
                <span>41 Date Changes</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: '#dc2626', fontWeight: 600 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>−</span>
                <span>3 Removed Activities</span>
              </div>
            </div>
          </div>

          {/* Comparison Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.725rem', justifyContent: 'center' }}
              onClick={() => setActiveTab('schedule-activities')}
            >
              View Detailed Changes
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.725rem', justifyContent: 'center' }}
              onClick={() => handleVersionActivate('Rev-03')}
              disabled={isActivatingVersion}
            >
              {isActivatingVersion ? 'Activating...' : 'Activate Schedule'}
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM: SCHEDULE VERSIONS TABLE */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
          Schedule Versions
        </h3>

        <div className="table-responsive">
          <table className="industrial-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Date Uploaded</th>
                <th>Uploaded By</th>
                <th>Activities</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scheduleVersions.map(ver => {
                const isActive = ver.isActive;
                return (
                  <tr key={ver.versionId}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.8rem' }}>
                      {ver.versionId}
                    </td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                      {ver.uploadedAt}
                    </td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-primary)' }}>
                      {ver.uploadedBy}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.775rem' }}>
                      {ver.activitiesCount?.toLocaleString() || '1,248'}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${isActive ? 'ready' : 'rejected'}`}
                        style={{ fontSize: '0.675rem' }}
                      >
                        {isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActiveTab('schedule-activities')}
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: DATASET INGESTION & UPLOAD DROPZONES */}
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
              <span>Preview Data</span>
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
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Field Supervisor Log</span>
              </div>
            </div>
            <span className="mono-pill" style={{ fontWeight: 700 }}>
              {txtUpdates.length} Updates
            </span>
          </div>

          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', flex: 1, marginBottom: '0.85rem', lineHeight: 1.4 }}>
            Unstructured daily log entries containing supervisor work notes, progress statements, and informal terminology.
          </p>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button
              className={`btn btn-sm ${selectedPreview === 'txt' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedPreview('txt')}
              style={{ flex: 1 }}
              type="button"
            >
              <Eye size={13} />
              <span>Preview Data</span>
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
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Discipline Tracker</span>
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
              <span>Preview Data</span>
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

      {/* Ingested Data Preview Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Data Preview &mdash;{' '}
            {selectedPreview === 'schedule'
              ? 'Schedule Master Baseline'
              : selectedPreview === 'txt'
              ? 'Daily Report Free-Text Entries'
              : 'Piping Progress Excel Rows'}
          </h3>

          <span className="mono-pill">
            {selectedPreview === 'schedule'
              ? `${schedule.length} items`
              : selectedPreview === 'txt'
              ? `${txtUpdates.length} items`
              : `${xlsxUpdates.length} items`}
          </span>
        </div>

        <div className="table-responsive" style={{ maxHeight: 360, overflowY: 'auto' }}>
          {selectedPreview === 'schedule' ? (
            <table className="industrial-table">
              <thead>
                <tr>
                  <th>Activity ID</th>
                  <th>L5 Code</th>
                  <th>Fingerprint</th>
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
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      #{act.taskHash || 'D7A9F4B2'}
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
                  <th>Date</th>
                  <th>Discipline</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th>Raw Extracted Text</th>
                  <th>Line/Row #</th>
                </tr>
              </thead>
              <tbody>
                {(selectedPreview === 'txt' ? txtUpdates : xlsxUpdates).map(u => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>{u.id}</td>
                    <td style={{ fontSize: '0.775rem' }}>{u.reportDate}</td>
                    <td><span className="mono-pill">{u.discipline}</span></td>
                    <td>{u.area || '—'}</td>
                    <td>
                      <span className="status-badge ready">
                        {u.eventStatus}
                      </span>
                    </td>
                    <td style={{ maxWidth: 320, fontSize: '0.825rem', fontWeight: 600 }}>{u.rawText}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.725rem' }}>#{u.lineEvidence || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

