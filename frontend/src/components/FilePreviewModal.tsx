import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Download,
  Sparkles,
  ArrowRight,
  Eye,
  Copy,
  Check,
} from 'lucide-react';

export type PreviewFileType = 'schedule' | 'daily_report' | 'contractor_sheet';

interface FilePreviewModalProps {
  isOpen: boolean;
  initialFile?: PreviewFileType;
  onClose: () => void;
  onLoadDataset?: () => void;
}

const SCHEDULE_DATA = [
  { id: 'CIV-L6-001', wbs: '1.1.1', name: 'Excavate pump foundation', disc: 'Civil', start: '2026-09-16', finish: '2026-09-19', area: 'Pump Bay', aliases: 'foundation excavation; pump pit' },
  { id: 'CIV-L6-002', wbs: '1.1.2', name: 'Cast pump foundation concrete', disc: 'Civil', start: '2026-09-20', finish: '2026-09-23', area: 'Pump Bay', aliases: 'PCC; pump foundation concrete; M35 pour' },
  { id: 'CIV-L6-003', wbs: '1.1.3', name: 'Install pipe rack pedestal', disc: 'Civil', start: '2026-09-22', finish: '2026-09-25', area: 'Pipe Rack A', aliases: 'pedestal work; rack pedestal' },
  { id: 'CIV-L6-004', wbs: '1.1.4', name: 'Construct cable trench', disc: 'Civil', start: '2026-09-21', finish: '2026-09-24', area: 'Substation', aliases: 'trench excavation; cable trench work' },
  { id: 'PIP-L6-011', wbs: '2.1.1', name: 'Fabricate Line 24-CW-017 spool', disc: 'Piping', start: '2026-09-18', finish: '2026-09-21', area: 'Fabrication Yard', aliases: 'spool fabrication; CW spool' },
  { id: 'PIP-L6-012', wbs: '2.1.2', name: 'Erect Line 24-CW-017 cooling water spool', disc: 'Piping', start: '2026-09-21', finish: '2026-09-24', area: 'Pump Bay', aliases: 'spool erection; erect Line 24-CW-017' },
  { id: 'PIP-L6-013', wbs: '2.1.3', name: 'Weld Line 24-CW-017 field joint', disc: 'Piping', start: '2026-09-24', finish: '2026-09-26', area: 'Pump Bay', aliases: 'field weld; CW joint welding' },
  { id: 'PIP-L6-014', wbs: '2.1.4', name: 'Hydrotest Line 24-CW-017', disc: 'Piping', start: '2026-09-27', finish: '2026-09-28', area: 'Pump Bay', aliases: 'pressure test; hydro test' },
  { id: 'PIP-L6-015', wbs: '2.1.5', name: 'Erect Line 18-FW-008 fire water spool', disc: 'Piping', start: '2026-09-22', finish: '2026-09-25', area: 'Filter Bay', aliases: 'spool erection; fire water line erection' },
  { id: 'PIP-L6-016', wbs: '2.1.6', name: 'Install pump suction piping', disc: 'Piping', start: '2026-09-25', finish: '2026-09-27', area: 'Pump Bay', aliases: 'suction spool; pump inlet piping' },
  { id: 'ELE-L6-021', wbs: '3.1.1', name: 'Install cable tray Tier-1', disc: 'Electrical', start: '2026-09-19', finish: '2026-09-22', area: 'Pump Bay', aliases: 'tray installation; cable tray work' },
  { id: 'ELE-L6-022', wbs: '3.1.2', name: 'Pull 415V MCC feeder cable Feed-01', disc: 'Electrical', start: '2026-09-23', finish: '2026-09-26', area: 'Pump Bay', aliases: 'cable pulling; feeder pulling' },
  { id: 'ELE-L6-023', wbs: '3.1.3', name: 'Terminate MCC feeder cable Feed-01', disc: 'Electrical', start: '2026-09-26', finish: '2026-09-28', area: 'Pump Bay', aliases: 'cable termination; glanding' },
  { id: 'ELE-L6-024', wbs: '3.1.4', name: 'Install motor earthing strip', disc: 'Electrical', start: '2026-09-20', finish: '2026-09-22', area: 'Pump Bay', aliases: 'earthing work; ground strip' },
  { id: 'INS-L6-031', wbs: '4.1.1', name: 'Mount pressure transmitter PT-101A', disc: 'Instrumentation', start: '2026-09-26', finish: '2026-09-28', area: 'Pump Bay', aliases: 'PT installation; impulse tubing' },
  { id: 'EQP-L6-051', wbs: '5.1.1', name: 'Position cooling water pump P-101A', disc: 'Equipment', start: '2026-09-23', finish: '2026-09-24', area: 'Pump Bay', aliases: 'pump placement; equipment positioning' },
  { id: 'HSE-L6-041', wbs: '6.1.1', name: 'Conduct crane lifting permit audit', disc: 'HSE', start: '2026-09-22', finish: '2026-09-22', area: 'Pump Bay', aliases: 'lifting inspection; crane safety check' },
];

const DAILY_REPORT_TEXT = `DAILY PROGRESS REPORT — IOCL Refinery Expansion (Cooling Water & Infrastructure Package)
Date: 2026-09-22
Project: IOCL-EPCC-PKG-04
Lead Supervisor: Rajesh Kumar (Field Operations)
Shift: Day Shift A (07:00 - 17:30)

Civil Works
1. Cast pump foundation concrete (CIV-L6-002) completed at Pump Bay; 25 cum M35 pour cured.
2. Excavated cable trench reached 1.2m final invert level along Substation perimeter.
3. Emergency temporary bypass trench for rainwater routing around pump pit. [Unplanned activity - non-baseline field modification]

Piping Works
4. Erect Line 24-CW-017 heavy cooling water spool at inlet bay; alignment completed, ready for fit-up.
5. Erected pipe spool near pump bay inlet without specific isometric line tag.
6. Small-bore utility drain piping installed near pump casing. [Not in baseline schedule - field instruction #14]

Electrical Works
7. Erect perforated galvanized cable tray Tier-1 completed in Pump Bay.
8. Pull heavy armored feeder cable without specified feeder tag in Pump Bay cable trench.
9. Motor earthing copper strip installation completed around pump foundation perimeter.

HSE Safety & Rigging
10. Crane lifting permit safety inspection conducted for 75T mobile crane before heavy spool lift.

Supervisor Shift Summary:
Morning heavy crane mobilization completed smoothly under standard PTW safety protocol. Weather clear, productivity high.`;

const CONTRACTOR_DATA = [
  { id: 'SEP22-CIV-01', date: '2026-09-22', disc: 'Civil', area: 'Pump Bay', desc: 'Cast pump foundation concrete (CIV-L6-002)', status: 'Completed', qty: '1 foundation', sup: 'Rajesh Kumar', scenario: 'Auto Match (95%)' },
  { id: 'SEP22-CIV-02', date: '2026-09-22', disc: 'Civil', area: 'Pump Bay', desc: 'Emergency temporary bypass trench for rainwater routing [Unplanned activity]', status: 'Completed', qty: '25 m', sup: 'Rajesh Kumar', scenario: 'Unplanned (< 40%)' },
  { id: 'SEP22-PIP-01', date: '2026-09-22', disc: 'Piping', area: 'Pump Bay', desc: 'Erect Line 24-CW-017 heavy cooling water spool at inlet bay', status: 'Completed', qty: '1 spool', sup: 'Amit Sharma', scenario: 'Auto Match (92%)' },
  { id: 'SEP22-PIP-02', date: '2026-09-22', disc: 'Piping', area: 'Pump Bay', desc: 'Erect pipe spool in pump bay area without specific isometric spool tag', status: 'Started', qty: '1 spool', sup: 'Amit Sharma', scenario: 'Uncertain Review (58%)' },
  { id: 'SEP22-PIP-03', date: '2026-09-22', disc: 'Piping', area: 'Pump Bay', desc: 'Small-bore utility drain piping installed near pump casing [Not in baseline]', status: 'Completed', qty: '18 m', sup: 'Amit Sharma', scenario: 'Unplanned (< 40%)' },
  { id: 'SEP22-ELE-01', date: '2026-09-22', disc: 'Electrical', area: 'Pump Bay', desc: 'Erect perforated galvanized cable tray Tier-1', status: 'Completed', qty: '35 m', sup: 'Venkatesh Rao', scenario: 'Auto Match (88%)' },
  { id: 'SEP22-ELE-02', date: '2026-09-22', disc: 'Electrical', area: 'Pump Bay', desc: 'Pull heavy armored feeder cable without specified feeder tag', status: 'Started', qty: '120 m', sup: 'Venkatesh Rao', scenario: 'Uncertain Review (60%)' },
  { id: 'SEP22-ELE-03', date: '2026-09-22', disc: 'Electrical', area: 'Pump Bay', desc: 'Install motor earthing copper strip around pump foundation perimeter', status: 'Completed', qty: '42 m', sup: 'Venkatesh Rao', scenario: 'Auto Match (84%)' },
  { id: 'SEP22-HSE-01', date: '2026-09-22', disc: 'HSE', area: 'Pump Bay', desc: 'Conduct lifting permit inspection for 75T mobile crane', status: 'Completed', qty: '1 permit', sup: 'Sanjay Patel', scenario: 'Auto Match (90%)' },
];

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  initialFile = 'schedule',
  onClose,
  onLoadDataset,
}) => {
  const [activeTab, setActiveTab] = useState<PreviewFileType>(initialFile);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const reportLines = useMemo(() => DAILY_REPORT_TEXT.split('\n'), []);

  const handleCopy = () => {
    navigator.clipboard.writeText(DAILY_REPORT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 1050,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 14,
          border: '1px solid var(--border-default)',
          background: 'var(--bg-surface, #ffffff)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Eye size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Demo Data Inspector & File Preview
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                September 22, 2026 &bull; Formatted benchmark files for live demonstration
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {onLoadDataset && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onLoadDataset();
                  onClose();
                }}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', gap: 5 }}
              >
                <Sparkles size={13} />
                <span>Ingest & Run Auto-Match</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              style={{ padding: '0.35rem 0.6rem', color: 'var(--text-muted)' }}
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div
          style={{
            padding: '0.65rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-secondary, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`filter-pill ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
              style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Layers size={13} />
              <span>1. Baseline Schedule (.csv)</span>
              <span className="mono-pill" style={{ fontSize: '0.6rem', padding: '0 4px' }}>17 tasks</span>
            </button>

            <button
              type="button"
              className={`filter-pill ${activeTab === 'daily_report' ? 'active' : ''}`}
              onClick={() => setActiveTab('daily_report')}
              style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <FileText size={13} />
              <span>2. Daily Site Report (.txt)</span>
              <span className="mono-pill" style={{ fontSize: '0.6rem', padding: '0 4px' }}>10 items</span>
            </button>

            <button
              type="button"
              className={`filter-pill ${activeTab === 'contractor_sheet' ? 'active' : ''}`}
              onClick={() => setActiveTab('contractor_sheet')}
              style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <FileSpreadsheet size={13} />
              <span>3. Contractor Progress (.csv)</span>
              <span className="mono-pill" style={{ fontSize: '0.6rem', padding: '0 4px' }}>9 entries</span>
            </button>
          </div>

          {activeTab !== 'daily_report' && (
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Quick search preview..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px 8px 4px 26px',
                  borderRadius: 6,
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                }}
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {activeTab === 'schedule' && (
            <div className="table-responsive" style={{ border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
              <table className="industrial-table" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th>Activity ID</th>
                    <th>WBS</th>
                    <th>Activity Name</th>
                    <th>Discipline</th>
                    <th>Area</th>
                    <th>Planned Window</th>
                    <th>Key Aliases</th>
                  </tr>
                </thead>
                <tbody>
                  {SCHEDULE_DATA.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase())).map(row => (
                    <tr key={row.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)' }}>
                        {row.id}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {row.wbs}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.name}
                      </td>
                      <td>
                        <span className="mono-pill" style={{ fontSize: '0.65rem' }}>{row.disc}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {row.area}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {row.start} &rarr; {row.finish}
                      </td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: 220 }}>
                        {row.aliases}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'daily_report' && (
            <div
              style={{
                background: 'var(--bg-surface, #ffffff)',
                border: '1px solid var(--border-default, #e2e8f0)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Document Header Bar */}
              <div
                style={{
                  padding: '0.65rem 1rem',
                  background: 'var(--bg-surface-secondary, #f8fafc)',
                  borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <FileText size={15} style={{ color: 'var(--brand-primary, #2563eb)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    02_Daily_Site_Report_Field_Log.txt
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span className="mono-pill" style={{ fontSize: '0.65rem' }}>Plaintext Field Log</span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{reportLines.length} lines</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopy}
                  style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                >
                  {copied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              {/* Text Body with Line Numbers */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--bg-surface, #ffffff)',
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.8rem',
                  lineHeight: 1.65,
                }}
              >
                {/* Line numbers gutter */}
                <div
                  style={{
                    padding: '1rem 0.75rem',
                    textAlign: 'right',
                    userSelect: 'none',
                    color: 'var(--text-muted, #94a3b8)',
                    background: 'var(--bg-surface-secondary, #f8fafc)',
                    borderRight: '1px solid var(--border-subtle, #e2e8f0)',
                    fontSize: '0.75rem',
                    lineHeight: 1.65,
                    minWidth: 42,
                  }}
                >
                  {reportLines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Text Content */}
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    flex: 1,
                    color: 'var(--text-primary, #1e293b)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {DAILY_REPORT_TEXT}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contractor_sheet' && (
            <div className="table-responsive" style={{ border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
              <table className="industrial-table" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    <th>Entry ID</th>
                    <th>Date</th>
                    <th>Discipline</th>
                    <th>Area</th>
                    <th>Site Description</th>
                    <th>Quantity</th>
                    <th>Supervisor</th>
                    <th>Demonstration Scenario</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTRACTOR_DATA.filter(r => !search || r.desc.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase())).map(row => {
                    const isAuto = row.scenario.includes('Auto');
                    const isUnplanned = row.scenario.includes('Unplanned');
                    return (
                      <tr key={row.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: isUnplanned ? '#ef4444' : isAuto ? '#10b981' : '#f59e0b' }}>
                          {row.id}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {row.date}
                        </td>
                        <td>
                          <span className="mono-pill" style={{ fontSize: '0.65rem' }}>{row.disc}</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {row.area}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 280 }}>
                          {row.desc}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {row.qty}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {row.sup}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: isAuto ? 'rgba(16, 185, 129, 0.15)' : isUnplanned ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: isAuto ? '#10b981' : isUnplanned ? '#ef4444' : '#f59e0b',
                              border: `1px solid ${isAuto ? 'rgba(16, 185, 129, 0.3)' : isUnplanned ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                            }}
                          >
                            {row.scenario}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1px solid var(--border-default)',
            background: 'var(--bg-surface-secondary, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ color: 'var(--text-muted)' }}>
            Dataset synchronized to: <strong style={{ color: 'var(--text-primary)' }}>d:\SIH_122_AG\demo_sample_files\</strong>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
