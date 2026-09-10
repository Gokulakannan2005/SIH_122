import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  X,
  Search,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Edit3,
  ShieldCheck,
  Sparkles,
  Save,
  Link as LinkIcon,
  Camera,
  AlertOctagon,
  HardHat,
  FileText,
  Calendar,
  Layers,
  Lock,
  Copy,
  Check,
  MapPin,
  Clock,
  Tag,
  Hash,
  ExternalLink
} from 'lucide-react';
import { PlannerActionType } from '../types';
import { formatDisplayDate, diffDaysBetweenDates, formatVarianceBadge } from '../utils/scheduleSimulator';

export const InspectorDrawer: React.FC = () => {
  const {
    selectedInspectorUpdateId,
    setSelectedInspectorUpdateId,
    siteUpdates,
    schedule,
    matchResults,
    plannerDecisions,
    handlePlannerAction,
    handleEditUpdate,
    handleConfirmImageTag,
    handleRemoveImageFromUpdate,
    currentRole,
  } = useProject();

  if (!selectedInspectorUpdateId) return null;

  const update = siteUpdates.find(u => u.id === selectedInspectorUpdateId);
  const match = update ? matchResults[update.id] : null;
  const decision = update ? plannerDecisions[update.id] : null;

  const [searchSchedule, setSearchSchedule] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    decision?.linkedActivityId || match?.candidateActivityId || null
  );
  const [plannerNote, setPlannerNote] = useState<string>(decision?.plannerNote || '');

  // Editable fields for Lead Planner
  const [editDesc, setEditDesc] = useState<string>('');
  const [editArea, setEditArea] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'Started' | 'Completed' | 'In Progress'>('In Progress');
  const [editDate, setEditDate] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Photo Evidence State
  const [selectedTagInput, setSelectedTagInput] = useState<string>('');
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (update) {
      setEditDesc(update.extractedDescription);
      setEditArea(update.area || '');
      setEditStatus(update.eventStatus);
      setEditDate(update.reportDate);
      const curMatch = matchResults[update.id];
      const curDec = plannerDecisions[update.id];
      setSelectedActivityId(curDec?.linkedActivityId || curMatch?.candidateActivityId || null);
      setPlannerNote(curDec?.plannerNote || '');
      setSaveSuccess(false);

      const firstImg = update.images && update.images.length > 0 ? update.images[0] : null;
      setSelectedTagInput(firstImg?.confirmedTag || update.confirmedTag || '');
    }
  }, [selectedInspectorUpdateId, siteUpdates, matchResults, plannerDecisions]);

  if (!update || !match) return null;

  const filteredSchedule = schedule.filter(act => {
    if (!searchSchedule.trim()) return true;
    const q = searchSchedule.toLowerCase();
    return (
      act.activityId.toLowerCase().includes(q) ||
      act.activityName.toLowerCase().includes(q) ||
      act.area.toLowerCase().includes(q) ||
      act.discipline.toLowerCase().includes(q) ||
      act.rawAliases.toLowerCase().includes(q)
    );
  });

  const selectedActivityObj = schedule.find(a => a.activityId === selectedActivityId);

  // Calculate schedule variance if linked
  const varianceDays = selectedActivityObj && update.reportDate
    ? diffDaysBetweenDates(selectedActivityObj.plannedStart, update.reportDate)
    : null;

  const saveEdits = () => {
    handleEditUpdate(update.id, {
      extractedDescription: editDesc,
      area: editArea,
      eventStatus: editStatus,
      reportDate: editDate,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const isSupervisor = currentRole === 'supervisor';
  const attachedImage = update.images && update.images.length > 0 ? update.images[0] : null;

  const copyHashToClipboard = (hash: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const submitTagConfirmation = (tagToConfirm: string) => {
    if (!attachedImage) return;
    const cleanTag = tagToConfirm.trim().toUpperCase();
    if (!cleanTag) return;
    handleConfirmImageTag(
      update.id,
      attachedImage.id,
      cleanTag,
      isSupervisor ? 'supervisor' : 'planner'
    );
  };

  return (
    <div className="drawer-backdrop" onClick={() => setSelectedInspectorUpdateId(null)}>
      <div className="drawer-pane" onClick={e => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span className="mono-pill" style={{ color: 'var(--brand-primary)', fontWeight: 800, borderColor: 'var(--brand-primary)' }}>
                {update.id}
              </span>
              <span className="mono-pill">{update.discipline}</span>
              <span className="mono-pill">{update.area || 'General Site'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {update.sourceFile} {update.lineEvidence ? `(#${update.lineEvidence})` : ''}
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {isSupervisor ? (
                <>
                  <HardHat size={18} style={{ color: 'var(--brand-primary)' }} />
                  <span>Field Record & Evidence Inspector</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} style={{ color: 'var(--brand-primary)' }} />
                  <span>Activity Evaluation & Link Workbench</span>
                </>
              )}
            </h3>
          </div>

          <button
            onClick={() => setSelectedInspectorUpdateId(null)}
            className="btn btn-ghost btn-sm"
            type="button"
            title="Close Drawer"
            style={{ padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="drawer-body">
          
          {/* Section 1: Evaluation Target & Schedule Alignment */}
          <div className="inspector-card">
            <div className="inspector-card-title">
              <LinkIcon size={15} style={{ color: 'var(--brand-primary)' }} />
              <span>Target Schedule Activity Alignment</span>
            </div>

            {selectedActivityObj ? (
              <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="mono-pill" style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>
                      {selectedActivityObj.activityId}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      WBS {selectedActivityObj.wbs}
                    </span>
                  </div>
                  <span className="status-badge ready" style={{ fontSize: '0.7rem' }}>
                    {selectedActivityObj.discipline}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {selectedActivityObj.activityName}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '4px' }}>
                  <span>Planned: <strong>{formatDisplayDate(selectedActivityObj.plannedStart)}</strong> → <strong>{formatDisplayDate(selectedActivityObj.plannedFinish)}</strong></span>
                  <span>Duration: <strong>{Math.max(1, diffDaysBetweenDates(selectedActivityObj.plannedStart, selectedActivityObj.plannedFinish))}d</strong></span>
                </div>

                {varianceDays !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', marginTop: '2px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Date Variance:</span>
                    <span className={`status-badge ${varianceDays > 0 ? 'unplanned' : varianceDays < 0 ? 'ready' : 'review'}`} style={{ fontSize: '0.7rem' }}>
                      {formatVarianceBadge(varianceDays).label}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'var(--status-unplanned-bg)', border: '1px solid var(--status-unplanned-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--status-unplanned-fg)' }}>
                No schedule activity currently linked. Search and select a target activity below or flag as Unplanned.
              </div>
            )}

            {!isSupervisor && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                <div className="search-input-box">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search master schedule by ID, name, or alias..."
                    value={searchSchedule}
                    onChange={e => setSearchSchedule(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '140px', overflowY: 'auto' }}>
                  {filteredSchedule.slice(0, 12).map(act => {
                    const isSelected = act.activityId === selectedActivityId;
                    const isRec = match.candidateActivityId === act.activityId;

                    return (
                      <div
                        key={act.activityId}
                        onClick={() => setSelectedActivityId(act.activityId)}
                        className={`schedule-select-item ${isSelected ? 'selected' : ''}`}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.775rem' }}>
                              {act.activityId}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WBS {act.wbs}</span>
                            {isRec && (
                              <span style={{ fontSize: '0.65rem', background: 'var(--status-ready-bg)', color: 'var(--status-ready-fg)', border: '1px solid var(--status-ready-border)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                                ★ Algorithm Recommended
                              </span>
                            )}
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.775rem' }}>
                            {act.activityName}
                          </div>
                        </div>

                        <input
                          type="radio"
                          name="drawerScheduleMatch"
                          checked={isSelected}
                          onChange={() => setSelectedActivityId(act.activityId)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Original Documented Field Entry & Workfront Location */}
          <div className="inspector-card">
            <div className="inspector-card-title">
              <FileText size={15} style={{ color: 'var(--brand-primary)' }} />
              <span>Original Documented Field Entry</span>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Verbatim Field Log Record:
              </div>
              <div className="raw-code-box">
                &ldquo;{update.rawText}&rdquo;
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '2px' }}>
              <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.65rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Report Date</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{formatDisplayDate(update.reportDate)}</span>
              </div>

              <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.65rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Status Recorded</span>
                <span className={`status-badge ${update.eventStatus}`} style={{ fontSize: '0.7rem', marginTop: 2 }}>
                  {update.eventStatus}
                </span>
              </div>
            </div>

            {/* Editable Parameters for Lead Planner */}
            {!isSupervisor && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Edit3 size={13} style={{ color: 'var(--brand-primary)' }} /> Update Field Parameters
                  </span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={saveEdits}>
                    <Save size={12} />
                    <span>{saveSuccess ? 'Saved!' : 'Save Edits'}</span>
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.725rem' }}>Extracted Task Title:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.725rem' }}>Spatial Location:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editArea}
                      onChange={e => setEditArea(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.725rem' }}>Progress Event:</label>
                    <select
                      className="form-select"
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as any)}
                    >
                      <option value="Started">Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Cryptographic Evidence Proof & OCR Tag Verification */}
          {attachedImage && (
            <div className="inspector-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="inspector-card-title">
                  <Camera size={15} style={{ color: 'var(--brand-primary)' }} />
                  <span>Cryptographic Photo Evidence & OCR</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="mono-pill" style={{ textTransform: 'capitalize', fontSize: '0.675rem' }}>
                    {attachedImage.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImageFromUpdate(update.id, attachedImage.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--status-unplanned-fg)',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                    title="Remove Photo Evidence"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Photo Preview */}
              <div className="photo-evidence-container">
                <img src={attachedImage.url} alt="Photo Proof" style={{ maxHeight: 220, width: '100%', objectFit: 'contain' }} />
              </div>

              {/* File Info & SHA-256 Hash */}
              <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                  <span>File: <strong>{attachedImage.filename || 'PHOTO_PROOF.jpg'}</strong></span>
                  <span>{attachedImage.fileSize ? `${(attachedImage.fileSize / 1024).toFixed(1)} KB` : 'Local Capture'}</span>
                </div>
                {attachedImage.sha256Hash && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }} title={`SHA-256: ${attachedImage.sha256Hash}`}>
                      SHA-256: <strong>{attachedImage.sha256Hash.substring(0, 18)}...</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyHashToClipboard(attachedImage.sha256Hash || '')}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontSize: '0.675rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}
                    >
                      {copiedHash ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* OCR Tag Detection & Confidence */}
              <div style={{ padding: '0.65rem 0.75rem', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    OCR Equipment Tag Extraction
                  </span>
                  {attachedImage.ocrConfidence !== undefined && (
                    <span className="mono-pill" style={{ fontSize: '0.675rem', background: 'var(--brand-surface)', color: 'var(--brand-primary)', borderColor: 'var(--border-default)' }}>
                      {attachedImage.ocrConfidence}% Confidence
                    </span>
                  )}
                </div>

                {/* Candidate Tag Chips */}
                {attachedImage.ocrDetectedTags && attachedImage.ocrDetectedTags.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      Detected Equipment Candidates (Click to select & confirm):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {attachedImage.ocrDetectedTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSelectedTagInput(tag);
                            submitTagConfirmation(tag);
                          }}
                          style={{
                            background: attachedImage.confirmedTag === tag ? 'var(--brand-primary)' : 'var(--bg-surface)',
                            color: attachedImage.confirmedTag === tag ? '#ffffff' : 'var(--brand-primary)',
                            border: '1px solid var(--brand-primary)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span>{tag}</span>
                          {attachedImage.confirmedTag === tag && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                    {attachedImage.ocrStatus === 'scanning'
                      ? 'Analyzing photo text locally...'
                      : 'No equipment tag was confidently detected. Enter or confirm a tag manually.'}
                  </div>
                )}

                {/* Manual Tag Confirmation Input */}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.775rem', padding: '4px 8px', fontFamily: 'var(--font-mono)', flex: 1 }}
                    placeholder="e.g. 24-CW-017, PT-2401"
                    value={selectedTagInput}
                    onChange={e => setSelectedTagInput(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem', whiteSpace: 'nowrap' }}
                    onClick={() => submitTagConfirmation(selectedTagInput)}
                  >
                    Confirm Tag
                  </button>
                </div>

                {/* Confirmed Tag Notice */}
                {attachedImage.confirmedTag ? (
                  <div style={{ fontSize: '0.725rem', background: 'var(--status-ready-bg)', border: '1px solid var(--status-ready-border)', color: 'var(--status-ready-fg)', padding: '4px 8px', borderRadius: '4px', lineHeight: 1.35 }}>
                    <strong>✓ Confirmed Tag: {attachedImage.confirmedTag}</strong> ({attachedImage.confirmedBy || 'planner'}).
                    <div style={{ fontSize: '0.675rem', opacity: 0.9, marginTop: 2 }}>
                      Equipment tag verified against plant register.
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                    Status: <strong>No tag confirmed</strong>. Human confirmation required for equipment tagging.
                  </div>
                )}

                {/* Collapsible Raw OCR Text */}
                {attachedImage.ocrRawText && (
                  <div style={{ marginTop: 2 }}>
                    <button
                      type="button"
                      onClick={() => setShowRawOcr(!showRawOcr)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.675rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      {showRawOcr ? 'Hide Raw OCR Text' : 'View Raw OCR Extracted Text'}
                    </button>
                    {showRawOcr && (
                      <div className="raw-code-box" style={{ marginTop: 4, maxHeight: 90, fontSize: '0.675rem', padding: '4px 6px' }}>
                        {attachedImage.ocrRawText}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: AI Multi-Factor Match Score Radar */}
          <div className="inspector-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="inspector-card-title">
                <Sparkles size={15} style={{ color: 'var(--brand-primary)' }} />
                <span>Multi-Factor Match Score Radar</span>
              </div>
              <span className={`status-badge ${match.category}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                {match.confidenceScore}% Confidence
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '6px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
                  <span>Keyword Weight</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{match.scoreBreakdown.keywordScore}/50</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 4 }}>
                  <div className="progress-bar-fill blue" style={{ width: `${(match.scoreBreakdown.keywordScore / 50) * 100}%` }} />
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '6px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
                  <span>Discipline Match</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{match.scoreBreakdown.disciplineScore}/20</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 4 }}>
                  <div className="progress-bar-fill green" style={{ width: `${(match.scoreBreakdown.disciplineScore / 20) * 100}%` }} />
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '6px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
                  <span>Spatial / Area</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{match.scoreBreakdown.areaScore}/15</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 4 }}>
                  <div className="progress-bar-fill amber" style={{ width: `${(match.scoreBreakdown.areaScore / 15) * 100}%` }} />
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '6px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
                  <span>Fuzzy Similarity</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{match.scoreBreakdown.fuzzyScore}/15</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 4 }}>
                  <div className="progress-bar-fill blue" style={{ width: `${(match.scoreBreakdown.fuzzyScore / 15) * 100}%` }} />
                </div>
              </div>
            </div>

            {match.matchReasons.length > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', marginTop: '0.25rem', fontWeight: 600, background: 'var(--brand-surface)', padding: '6px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-default)' }}>
                💡 Rationale: <i>{match.matchReasons[0]}</i>
              </div>
            )}
          </div>

          {/* Section 5: Blocker or Risk Alerts */}
          {update.issueFlag && (
            <div style={{ background: 'var(--status-unplanned-bg)', border: '1px solid var(--status-unplanned-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertOctagon size={20} style={{ color: 'var(--status-unplanned-fg)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--status-unplanned-fg)' }}>
                  Reported Field Blocker: {update.issueFlag}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Severity: <strong>{update.issueSeverity?.toUpperCase() || 'MEDIUM'}</strong> | Requires schedule lead mitigation
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sticky Drawer Footer Action Hub */}
        <div className="drawer-footer">
          {isSupervisor ? (
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                <Lock size={14} />
                <span>Field Supervisor View (Governance actions reserved for Lead Planners)</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedInspectorUpdateId(null)}
              >
                Close
              </button>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.775rem', padding: '5px 8px' }}
                  placeholder="Audit trail rationale note (optional)..."
                  value={plannerNote}
                  onChange={e => setPlannerNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ color: 'var(--status-unplanned-fg)', borderColor: 'var(--status-unplanned-border)' }}
                  onClick={() => {
                    handlePlannerAction(update.id, 'reject', null, plannerNote);
                    setSelectedInspectorUpdateId(null);
                  }}
                >
                  <XCircle size={14} />
                  <span>Reject Record</span>
                </button>

                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => {
                    handlePlannerAction(update.id, 'mark_unplanned', null, plannerNote);
                    setSelectedInspectorUpdateId(null);
                  }}
                >
                  <HelpCircle size={14} />
                  <span>Mark Unplanned</span>
                </button>

                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    handlePlannerAction(update.id, 'approve', selectedActivityId, plannerNote);
                    setSelectedInspectorUpdateId(null);
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Confirm Schedule Link</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
