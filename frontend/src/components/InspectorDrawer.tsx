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
  Lock
} from 'lucide-react';
import { PlannerActionType } from '../types';

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

  useEffect(() => {
    if (update) {
      setEditDesc(update.extractedDescription);
      setEditArea(update.area);
      setEditStatus(update.eventStatus);
      setEditDate(update.reportDate);
      const curMatch = matchResults[update.id];
      const curDec = plannerDecisions[update.id];
      setSelectedActivityId(curDec?.linkedActivityId || curMatch?.candidateActivityId || null);
      setPlannerNote(curDec?.plannerNote || '');
      setSaveSuccess(false);
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

  return (
    <div className="drawer-backdrop" onClick={() => setSelectedInspectorUpdateId(null)}>
      <div className="drawer-pane" onClick={e => e.stopPropagation()} style={{ width: '480px', maxWidth: '95vw' }}>
        
        {/* Drawer Header */}
        <div className="drawer-header" style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)', padding: '1rem 1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span className="mono-pill" style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>
                {update.id}
              </span>
              <span className="mono-pill">{update.discipline}</span>
              <span className="mono-pill">{update.area || 'General'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {update.sourceFile} {update.lineEvidence ? `(#${update.lineEvidence})` : ''}
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {isSupervisor ? (
                <>
                  <HardHat size={18} style={{ color: 'var(--brand-primary)' }} />
                  <span>Field Record & Photo Inspector</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} style={{ color: 'var(--brand-primary)' }} />
                  <span>Update Inspector & Planner Workbench</span>
                </>
              )}
            </h3>
          </div>

          <button
            onClick={() => setSelectedInspectorUpdateId(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6, borderRadius: 'var(--radius-xs)' }}
            type="button"
            title="Close Drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Section 0: Attached Photo Evidence */}
          {update.images && update.images.length > 0 && (
            <div className="card" style={{ padding: '0.85rem 1rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Camera size={15} /> Attached Field Photo Proof ({update.images.length})
                </span>
                <span className="mono-pill" style={{ textTransform: 'capitalize' }}>{update.images[0].type}</span>
              </div>
              <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#0f172a', maxHeight: 200, display: 'flex', justifyContent: 'center' }}>
                <img src={update.images[0].url} alt="Photo Evidence" style={{ maxHeight: 200, width: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                &ldquo;{update.images[0].caption}&rdquo; &bull; {update.images[0].timestamp} ({update.images[0].supervisor})
              </div>
            </div>
          )}

          {/* Section 0.5: Site Blocker Alert */}
          {update.issueFlag && (
            <div style={{ background: 'var(--status-unplanned-bg)', border: '1px solid var(--status-unplanned-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertOctagon size={20} style={{ color: 'var(--status-unplanned-fg)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--status-unplanned-fg)' }}>
                  Reported Blocker: {update.issueFlag}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Severity: <strong>{update.issueSeverity?.toUpperCase() || 'MEDIUM'}</strong> | Flagged for critical path risk
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Original Source Evidence Text */}
          <div className="card" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
              Original Source Field Text:
            </div>
            <div className="raw-code-box" style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem' }}>
              &ldquo;{update.rawText}&rdquo;
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              <strong>Extracted Task:</strong> {update.extractedDescription}
            </div>
          </div>

          {/* Section 2: Algorithm Score Breakdown (Clean Chips) */}
          <div className="card" style={{ padding: '0.85rem 1rem', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)' }}>
                <Sparkles size={15} style={{ color: 'var(--brand-primary)' }} /> Alignment Confidence Score
              </span>
              <span className={`status-badge ${match.category}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                {match.confidenceScore}% Confidence
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '5px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
                  <span>Keyword</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{match.scoreBreakdown.keywordScore}/50</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 3 }}>
                  <div className="progress-bar-fill blue" style={{ width: `${(match.scoreBreakdown.keywordScore / 50) * 100}%` }} />
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '5px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
                  <span>Discipline</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{match.scoreBreakdown.disciplineScore}/20</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 3 }}>
                  <div className="progress-bar-fill green" style={{ width: `${(match.scoreBreakdown.disciplineScore / 20) * 100}%` }} />
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '5px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
                  <span>Spatial / Area</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{match.scoreBreakdown.areaScore}/15</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 3 }}>
                  <div className="progress-bar-fill amber" style={{ width: `${(match.scoreBreakdown.areaScore / 15) * 100}%` }} />
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '5px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
                  <span>Fuzzy Similarity</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{match.scoreBreakdown.fuzzyScore}/15</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 3 }}>
                  <div className="progress-bar-fill blue" style={{ width: `${(match.scoreBreakdown.fuzzyScore / 15) * 100}%` }} />
                </div>
              </div>
            </div>

            {match.matchReasons.length > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', marginTop: '0.5rem', fontWeight: 600 }}>
                💡 <i>{match.matchReasons[0]}</i>
              </div>
            )}
          </div>

          {/* Section 3: Role-Specific Actions & Forms */}
          {isSupervisor ? (
            /* SUPERVISOR VIEW: READ ONLY PROVENANCE */
            <div className="card" style={{ padding: '0.85rem 1rem', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Lock size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Field Supervisor Read-Only View
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                This record has been submitted to the Datum ingestion pipeline. Only Lead Planners have permission to approve, re-link, or alter schedule parameters.
              </p>
              {decision && (
                <div style={{ marginTop: '0.65rem', padding: '0.5rem 0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', color: '#047857', fontWeight: 700 }}>
                  ✓ Status: {decision.status.toUpperCase()} linked to {decision.linkedActivityId || 'UNPLANNED'}
                </div>
              )}
            </div>
          ) : (
            /* LEAD PLANNER VIEW: FULL PARAMETER EDIT & RE-LINKING WORKBENCH */
            <>
              {/* Editable Parameters */}
              <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.825rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Edit3 size={14} style={{ color: 'var(--brand-primary)' }} /> Edit Site Update Parameters
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={saveEdits} type="button">
                    <Save size={13} /> <span>{saveSuccess ? 'Saved!' : 'Save Parameters'}</span>
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Extracted Description:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Area / Location:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editArea}
                      onChange={e => setEditArea(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Event Status:</label>
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

              {/* Schedule Activity Search & Linker */}
              <div className="card" style={{ padding: '0.85rem 1rem' }}>
                <h4 style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LinkIcon size={14} style={{ color: 'var(--brand-primary)' }} /> Target Schedule Activity:
                </h4>

                {/* Search Input */}
                <div className="search-input-box" style={{ marginBottom: '0.5rem' }}>
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search schedule activities..."
                    value={searchSchedule}
                    onChange={e => setSearchSchedule(e.target.value)}
                  />
                </div>

                {/* Activity List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {filteredSchedule.slice(0, 15).map(act => {
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
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.8rem' }}>
                              {act.activityId}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WBS {act.wbs}</span>
                            {isRec && <span style={{ fontSize: '0.65rem', background: 'var(--status-ready-bg)', color: 'var(--status-ready-fg)', border: '1px solid var(--status-ready-border)', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>★ Top Match</span>}
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{act.activityName}</div>
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

              {/* Planner Justification Note */}
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-primary)', display: 'block', marginBottom: '3px', fontWeight: 700 }}>
                  Planner Justification Note:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter audit note for decision rationale..."
                  value={plannerNote}
                  onChange={e => setPlannerNote(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#047857', fontWeight: 700 }}
                  onClick={() => {
                    handlePlannerAction(update.id, 'approve', selectedActivityId, plannerNote);
                    setSelectedInspectorUpdateId(null);
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Confirm Link</span>
                </button>

                <button
                  type="button"
                  className="btn"
                  style={{ background: '#d97706', color: '#ffffff', borderColor: '#b45309', fontWeight: 700 }}
                  onClick={() => {
                    handlePlannerAction(update.id, 'mark_unplanned', null, plannerNote);
                    setSelectedInspectorUpdateId(null);
                  }}
                >
                  <HelpCircle size={14} />
                  <span>Unplanned</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ color: '#be123c', borderColor: '#fecdd3' }}
                  onClick={() => {
                    handlePlannerAction(update.id, 'reject', null, plannerNote);
                    setSelectedInspectorUpdateId(null);
                  }}
                >
                  <XCircle size={14} />
                  <span>Reject</span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
