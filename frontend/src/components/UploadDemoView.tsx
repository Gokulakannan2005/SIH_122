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
  Check
} from 'lucide-react';

export const UploadDemoView: React.FC = () => {
  const {
    schedule,
    siteUpdates,
    loadDemoData,
    handleCustomUpload,
    isLoading,
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
      setUploadStatusMsg(`Uploaded & parsed ${file.name} successfully.`);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="banner-card">
        <div>
          <h2 className="banner-title">
            <UploadCloud size={20} style={{ color: 'var(--brand-primary)' }} />
            Data Ingestion & Benchmark Datasets
          </h2>
          <p className="banner-desc">
            Load baseline L5/L6 project schedules and site progress logs. Upload custom files or reset to benchmark datasets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => loadDemoData()}
            disabled={isLoading}
            type="button"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            <span>{isLoading ? 'Processing...' : 'Reload Benchmark Data'}</span>
          </button>
        </div>
      </div>

      {/* Success alert */}
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

      {/* Plain-Language Pipeline Explainer */}
      <div className="card" style={{ padding: '1.15rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          How the Alignment Pipeline Works
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          An automated audit layer connecting unstructured supervisor field reporting with master schedule deliverables.
        </p>

        <div className="pipeline-steps">
          <div className="pipeline-step-card">
            <div className="pipeline-step-number">1</div>
            <h4 style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 3 }}>
              Multi-Source Ingestion
            </h4>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Parses supervisor text logs and discipline Excel sheets into uniform progress records with dates, areas, quantities, and evidence lines.
            </p>
          </div>

          <div className="pipeline-step-card">
            <div className="pipeline-step-number">2</div>
            <h4 style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 3 }}>
              Multi-Factor Matching
            </h4>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Calculates confidence from 0–100% across Keyword overlap (50%), Discipline agreement (20%), Area proximity (15%), and Fuzzy similarity (15%).
            </p>
          </div>

          <div className="pipeline-step-card">
            <div className="pipeline-step-number">3</div>
            <h4 style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 3 }}>
              Planner Alignment & Audit
            </h4>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              High-confidence items auto-align; ambiguous items route to human review with approve, relink, or unplanned classification.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Dataset Cards with Live Counts and Custom Upload Dropzones */}
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

        <div className="table-responsive" style={{ maxHeight: 360, overflowY: 'auto' }}>
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
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>{act.activityId}</td>
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
