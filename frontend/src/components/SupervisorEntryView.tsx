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
  Layers,
  ArrowRight,
  Image as ImageIcon,
  Check,
  Send,
  X,
  Radio
} from 'lucide-react';
import { SAMPLE_EVIDENCE_IMAGES } from '../utils/sampleImages';

export const SupervisorEntryView: React.FC = () => {
  const {
    handleAddNewFieldEntry,
    handleCustomUpload,
    siteUpdates,
    setSelectedInspectorUpdateId,
    setActiveTab,
    offlineMode,
  } = useProject();

  // Form State
  const [discipline, setDiscipline] = useState('Piping');
  const [description, setDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [area, setArea] = useState('Pump Bay');
  const [eventStatus, setEventStatus] = useState<'Started' | 'Completed' | 'In Progress'>('Completed');
  const [quantity, setQuantity] = useState('');
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchCsvRef = useRef<HTMLInputElement>(null);
  const batchTxtRef = useRef<HTMLInputElement>(null);
  const batchXlsxRef = useRef<HTMLInputElement>(null);

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
    setQuantity('');
    if (isIssueReport) setIssueFlag('');

    setTimeout(() => {
      setSubmitSuccess(null);
    }, 4000);
  };

  // Recent supervisor submissions
  const recentSubmissions = siteUpdates.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="banner-card" style={{ borderLeftColor: '#0c66e4' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span className="brand-badge" style={{ background: '#e9f2ff', color: '#0c66e4', borderColor: '#cce0ff' }}>
              Field Supervisor Mode
            </span>
            {offlineMode && (
              <span className="mono-pill" style={{ background: '#fff4e5', color: '#974f0c', borderColor: '#fec195', fontWeight: 700 }}>
                ⚡ Offline Field Queue Active
              </span>
            )}
          </div>
          <h2 className="banner-title" style={{ marginTop: 4 }}>
            <Camera size={20} style={{ color: '#0c66e4' }} />
            Site Progress & Photo Evidence Ingestion
          </h2>
          <p className="banner-desc">
            Submit daily progress updates, capture completion photos, report site blockers, and upload batch spreadsheets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('site-updates')}
            type="button"
          >
            <span>View All Updates</span>
            <ArrowRight size={13} />
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
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* 2-Column Layout: Entry Form on Left, Photo Proof & Batch Upload on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left: Quick Progress Entry Form */}
        <form onSubmit={handleSubmit} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Send size={15} style={{ color: 'var(--brand-primary)' }} />
              Direct Field Progress Entry
            </h3>
            <span className="mono-pill">Instant AI Matching</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Discipline */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
                Discipline Package *
              </label>
              <select
                className="form-select"
                style={{ width: '100%' }}
                value={discipline}
                onChange={e => setDiscipline(e.target.value)}
              >
                <option value="Civil">Civil Works</option>
                <option value="Piping">Piping Erection & Welding</option>
                <option value="Electrical">Electrical & Cabling</option>
                <option value="Instrumentation">Instrumentation & Control</option>
                <option value="HSE">HSE & Scaffolding</option>
              </select>
            </div>

            {/* Event Status */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
                Progress Status *
              </label>
              <select
                className="form-select"
                style={{ width: '100%' }}
                value={eventStatus}
                onChange={e => setEventStatus(e.target.value as any)}
              >
                <option value="Completed">Work Completed (100%)</option>
                <option value="In Progress">In Progress (Active)</option>
                <option value="Started">Work Started</option>
              </select>
            </div>
          </div>

          {/* Activity Description */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
              Extracted Work Title / Scope Statement *
            </label>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '0.75rem' }}
              placeholder="e.g. Erect Line 24-CW-017 spool in pump bay and complete field weld"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Raw Note */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
              Supervisor Field Log / Raw Description:
            </label>
            <textarea
              rows={2}
              className="form-input"
              style={{ width: '100%', paddingLeft: '0.75rem', fontSize: '0.8rem' }}
              placeholder="e.g. Line 24-CW-017 spool erection completed at pump bay. 1 joint welded, NDT visual clear."
              value={rawText}
              onChange={e => setRawText(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Area */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
                Work Area / Grid:
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', paddingLeft: '0.75rem' }}
                placeholder="e.g. Pump Bay - Grid C4"
                value={area}
                onChange={e => setArea(e.target.value)}
              />
            </div>

            {/* Quantity */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
                Quantity Completed:
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', paddingLeft: '0.75rem' }}
                placeholder="e.g. 1 joint / 1 spool / 240m"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>
          </div>

          {/* Supervisor Name */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>
              Reporting Supervisor:
            </label>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '0.75rem' }}
              value={supervisorName}
              onChange={e => setSupervisorName(e.target.value)}
            />
          </div>

          {/* Blocker / Issue Reporting Toggle */}
          <div style={{ background: isIssueReport ? 'var(--status-unplanned-bg)' : 'var(--bg-subtle)', border: `1px solid ${isIssueReport ? 'var(--status-unplanned-border)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isIssueReport ? 'var(--status-unplanned-fg)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertOctagon size={15} />
                <span>Report Site Blocker / Delay Issue</span>
              </span>
              <input
                type="checkbox"
                checked={isIssueReport}
                onChange={e => {
                  setIsIssueReport(e.target.checked);
                  if (e.target.checked) {
                    setImageType('issue');
                    setImagePreview(SAMPLE_EVIDENCE_IMAGES.craneIssue);
                  }
                }}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
            </div>

            {isIssueReport && (
              <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '0.75rem' }}
                  placeholder="Describe delay root-cause (e.g. 50T crane breakdown, material stockout, weather)..."
                  value={issueFlag}
                  onChange={e => setIssueFlag(e.target.value)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)' }}>Severity:</span>
                  {(['low', 'medium', 'critical'] as const).map(sev => (
                    <label key={sev} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', textTransform: 'capitalize', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="issueSev"
                        checked={issueSeverity === sev}
                        onChange={() => setIssueSeverity(sev)}
                      />
                      <span>{sev}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontWeight: 700 }}>
            <Send size={15} />
            <span>Submit Progress & Run AI Matching</span>
          </button>
        </form>

        {/* Right: Photo Proof Preview & Batch Ingestion Dropzones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Photo Proof Attachment Card */}
          <div className="card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ImageIcon size={15} style={{ color: 'var(--brand-primary)' }} />
                Photo Proof & Evidence Attachment
              </h3>
              <span className="mono-pill" style={{ textTransform: 'capitalize' }}>{imageType}</span>
            </div>

            {/* Photo Preset Selector */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm ${imagePreview === SAMPLE_EVIDENCE_IMAGES.pipeWeld ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setImagePreview(SAMPLE_EVIDENCE_IMAGES.pipeWeld);
                  setImageType('completion');
                  setImageCaption('Field Joint 24-CW-017 / NDT Passed');
                }}
              >
                Pipe Weld Proof
              </button>
              <button
                type="button"
                className={`btn btn-sm ${imagePreview === SAMPLE_EVIDENCE_IMAGES.pumpFoundation ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setImagePreview(SAMPLE_EVIDENCE_IMAGES.pumpFoundation);
                  setImageType('completion');
                  setImageCaption('Pump Bay Foundation Curing Verified');
                }}
              >
                Foundation Proof
              </button>
              <button
                type="button"
                className={`btn btn-sm ${imagePreview === SAMPLE_EVIDENCE_IMAGES.cableTray ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setImagePreview(SAMPLE_EVIDENCE_IMAGES.cableTray);
                  setImageType('progress');
                  setImageCaption('415V Cable Pulling in Progress');
                }}
              >
                Cable Tray Proof
              </button>
              <button
                type="button"
                className={`btn btn-sm ${imagePreview === SAMPLE_EVIDENCE_IMAGES.craneIssue ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => {
                  setImagePreview(SAMPLE_EVIDENCE_IMAGES.craneIssue);
                  setImageType('issue');
                  setIsIssueReport(true);
                  setImageCaption('CRITICAL: 50T Mobile Crane Breakdown');
                  setIssueFlag('Hydraulic cylinder leak on 50T crane');
                }}
              >
                Crane Blocker
              </button>
            </div>

            {/* Image Preview Box */}
            {imagePreview ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', maxHeight: 180, display: 'flex', justifyContent: 'center', background: '#0f172a' }}>
                <img src={imagePreview} alt="Field Evidence Preview" style={{ width: '100%', height: 'auto', maxHeight: 180, objectFit: 'contain' }} />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Camera size={24} style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>No image attached</div>
              </div>
            )}

            {/* Custom File Upload Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleCustomImageUpload}
            />
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={13} />
                <span>Upload From Device</span>
              </button>
            </div>

            {/* Caption Input */}
            <div>
              <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                Photo Caption / QA Note:
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', paddingLeft: '0.75rem', fontSize: '0.775rem' }}
                value={imageCaption}
                onChange={e => setImageCaption(e.target.value)}
              />
            </div>
          </div>

          {/* Batch File Ingestion Options (CSV, XLSX, TXT) */}
          <div className="card" style={{ padding: '1.15rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <UploadCloud size={15} style={{ color: 'var(--brand-primary)' }} />
              Supervisor Batch Uploads (CSV, XLSX, TXT)
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Upload supervisor daily logs or progress spreadsheets for bulk schedule linking.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <input
                type="file"
                ref={batchTxtRef}
                accept=".txt"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => handleCustomUpload({ dailyReportTxt: ev.target?.result as string });
                  reader.readAsText(file);
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => batchTxtRef.current?.click()}
              >
                <FileText size={12} />
                <span>TXT Log</span>
              </button>

              <input
                type="file"
                ref={batchXlsxRef}
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => handleCustomUpload({ pipingProgressXlsx: ev.target?.result as ArrayBuffer });
                  reader.readAsArrayBuffer(file);
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => batchXlsxRef.current?.click()}
              >
                <FileSpreadsheet size={12} />
                <span>XLSX Sheet</span>
              </button>

              <input
                type="file"
                ref={batchCsvRef}
                accept=".csv"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => handleCustomUpload({ scheduleCsv: ev.target?.result as string });
                  reader.readAsText(file);
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => batchCsvRef.current?.click()}
              >
                <Layers size={12} />
                <span>Schedule CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stream of Recent Ingested Field Updates */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Radio size={15} style={{ color: '#0c66e4' }} />
            Live Ingested Field Evidence Stream
          </h3>
          <span className="mono-pill">Real-Time Ingestion</span>
        </div>

        <div className="table-responsive">
          <table className="industrial-table">
            <thead>
              <tr>
                <th>Update ID</th>
                <th>Discipline</th>
                <th>Description</th>
                <th>Area</th>
                <th>Status</th>
                <th>Photo Proof</th>
                <th>Issue / Blocker</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.map(u => (
                <tr key={u.id} onClick={() => setSelectedInspectorUpdateId(u.id)}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>{u.id}</td>
                  <td><span className="mono-pill">{u.discipline}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 260 }}>{u.extractedDescription}</td>
                  <td style={{ fontSize: '0.775rem' }}>{u.area}</td>
                  <td>
                    <span className="status-badge ready">{u.eventStatus}</span>
                  </td>
                  <td>
                    {u.images && u.images.length > 0 ? (
                      <span className="mono-pill" style={{ background: '#e9f2ff', color: '#0c66e4', borderColor: '#cce0ff', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Camera size={11} />
                        <span>Photo Attached</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    {u.issueFlag ? (
                      <span className="status-badge unplanned" title={u.issueFlag}>
                        ⚠ {u.issueSeverity || 'Issue'}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>None</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedInspectorUpdateId(u.id);
                      }}
                      type="button"
                    >
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
