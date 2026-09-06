import React, { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  RefreshCw,
  Eye,
  ArrowRight,
  Sparkles,
  Cpu,
  Layers,
  FileUp,
  Check
} from 'lucide-react';

export const UploadDemoView: React.FC = () => {
  const {
    schedule,
    siteUpdates,
    loadDemoData,
    handleCustomUpload,
    isLoading,
    setActiveTab,
  } = useProject();

  const [selectedPreview, setSelectedPreview] = useState<'schedule' | 'txt' | 'xlsx'>('schedule');
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);

  const scheduleInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);
  const xlsxInputRef = useRef<HTMLInputElement>(null);

  const txtUpdates = siteUpdates.filter(u => u.sourceFile === 'daily_report.txt');
  const xlsxUpdates = siteUpdates.filter(u => u.sourceFile === 'piping_progress.xlsx');

  // Handle file uploads
  const handleScheduleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      await handleCustomUpload({ scheduleCsv: text });
      setUploadStatusMsg(`Uploaded & parsed ${file.name} successfully!`);
      setTimeout(() => setUploadStatusMsg(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      await handleCustomUpload({ dailyReportTxt: text });
      setUploadStatusMsg(`Uploaded & parsed ${file.name} successfully!`);
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
      setUploadStatusMsg(`Uploaded & parsed ${file.name} successfully!`);
      setTimeout(() => setUploadStatusMsg(null), 4000);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div className="banner-card">
        <div>
          <h2 className="banner-title">
            <UploadCloud style={{ color: '#2563eb' }} />
            Data Ingestion & Pipeline Orchestration
          </h2>
          <p className="banner-desc">
            Load baseline L5/L6 project schedules and site progress logs. Upload custom files or reset to jury benchmark datasets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => loadDemoData()}
            disabled={isLoading}
            type="button"
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            <span>{isLoading ? 'Processing...' : 'Reload Benchmark Data'}</span>
          </button>
        </div>
      </div>

      {/* Success alert */}
      {uploadStatusMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.85rem 1.25rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 600, fontSize: '0.9rem' }}>
          <Check size={18} />
          <span>{uploadStatusMsg}</span>
        </div>
      )}

      {/* Plain-Language Pipeline Explainer */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          How the Intelligent Alignment Pipeline Works
        </h3>
        <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1.25rem' }}>
          An end-to-end audit layer bridging unstructured supervisor field reporting with master schedule activities.
        </p>

        <div className="pipeline-steps">
          <div className="pipeline-step-card">
            <div className="pipeline-step-number">1</div>
            <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: 4 }}>
              Multi-Source Ingestion
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
              Parses raw supervisor text logs and discipline Excel sheets into uniform site progress records with dates, areas, quantities, and line evidence.
            </p>
          </div>

          <div className="pipeline-step-card">
            <div className="pipeline-step-number">2</div>
            <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: 4 }}>
              Multi-Factor NLP Matching
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
              Scores matches from 0–100% across 4 dimensions: Keyword overlap (50%), Discipline agreement (20%), Area proximity (15%), and Fuzzy similarity (15%).
            </p>
          </div>

          <div className="pipeline-step-card">
            <div className="pipeline-step-number">3</div>
            <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: 4 }}>
              Planner Review & Alignment
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
              High-confidence items auto-align; ambiguous items route to human planner review with single-click approve, relink, or mark as unplanned work.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Dataset Cards with Live Counts and Custom Upload Dropzones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Schedule Master */}
        <div className="card" style={{ background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: 6, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>schedule.csv</h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Master Baseline Deliverables</span>
              </div>
            </div>
            <span className="mono-pill" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe', fontWeight: 700 }}>
              {schedule.length} Activities
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#475569', flex: 1, marginBottom: '1rem', lineHeight: 1.4 }}>
            Master schedule baseline with WBS codes, planned start/finish dates, disciplines, area tags, and recognized equipment aliases.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-sm ${selectedPreview === 'schedule' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedPreview('schedule')}
              style={{ flex: 1 }}
              type="button"
            >
              <Eye size={14} />
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
              <FileUp size={14} />
              <span>Upload CSV</span>
            </button>
          </div>
        </div>

        {/* Daily Report TXT */}
        <div className="card" style={{ background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: 6, background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>daily_report.txt</h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Field Supervisor Log</span>
              </div>
            </div>
            <span className="mono-pill" style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a', fontWeight: 700 }}>
              {txtUpdates.length} Updates
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#475569', flex: 1, marginBottom: '1rem', lineHeight: 1.4 }}>
            Unstructured daily log entries containing supervisor work notes, progress statements, and informal terminology.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-sm ${selectedPreview === 'txt' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedPreview('txt')}
              style={{ flex: 1 }}
              type="button"
            >
              <Eye size={14} />
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
              <FileUp size={14} />
              <span>Upload TXT</span>
            </button>
          </div>
        </div>

        {/* Piping Progress XLSX */}
        <div className="card" style={{ background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: 6, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>piping_progress.xlsx</h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Discipline Tracker</span>
              </div>
            </div>
            <span className="mono-pill" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0', fontWeight: 700 }}>
              {xlsxUpdates.length} Rows
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#475569', flex: 1, marginBottom: '1rem', lineHeight: 1.4 }}>
            Discipline-level Excel spreadsheet detailing site progress, event status (Started, Completed), quantities, and supervisors.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-sm ${selectedPreview === 'xlsx' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedPreview('xlsx')}
              style={{ flex: 1 }}
              type="button"
            >
              <Eye size={14} />
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
              <FileUp size={14} />
              <span>Upload XLSX</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ingested Data Preview Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
            Live Ingestion Preview &mdash;{' '}
            {selectedPreview === 'schedule'
              ? 'Schedule CSV Baseline'
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

        <div className="table-responsive" style={{ maxHeight: 380, overflowY: 'auto' }}>
          {selectedPreview === 'schedule' ? (
            <table className="industrial-table">
              <thead>
                <tr>
                  <th>Activity ID</th>
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
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2563eb' }}>{act.activityId}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{act.wbs}</td>
                    <td style={{ fontWeight: 600 }}>{act.activityName}</td>
                    <td><span className="mono-pill">{act.discipline}</span></td>
                    <td>{act.area}</td>
                    <td style={{ fontSize: '0.8rem', color: '#475569' }}>{act.plannedStart} &rarr; {act.plannedFinish}</td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{act.rawAliases || '—'}</td>
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
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2563eb' }}>{u.id}</td>
                    <td style={{ fontSize: '0.8rem' }}>{u.reportDate}</td>
                    <td><span className="mono-pill">{u.discipline}</span></td>
                    <td>{u.area || '—'}</td>
                    <td>
                      <span className="status-badge ready" style={{ fontSize: '0.7rem' }}>
                        {u.eventStatus}
                      </span>
                    </td>
                    <td style={{ maxWidth: 320, fontSize: '0.85rem', fontWeight: 600 }}>{u.rawText}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>#{u.lineEvidence || '—'}</td>
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
