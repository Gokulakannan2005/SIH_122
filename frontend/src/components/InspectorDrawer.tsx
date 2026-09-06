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
  AlertOctagon
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
    setSelectedAuditUpdateId,
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

  // Editable fields
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

  return (
    <div className="drawer-backdrop" onClick={() => setSelectedInspectorUpdateId(null)}>
      <div className="drawer-pane" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span className="mono-pill" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                {update.id}
              </span>
              <span className="mono-pill">
                {update.discipline}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {update.sourceFile} {update.lineEvidence ? `(#${update.lineEvidence})` : ''}
              </span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              Site Update Inspector & Parameter Editor
            </h3>
          </div>

          <button
            onClick={() => setSelectedInspectorUpdateId(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* Section 0: Photo Proof & Issue Flag (if present) */}
          {update.images && update.images.length > 0 && (
            <div className="card" style={{ padding: '0.85rem 1rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Camera size={14} /> Attached Photo Evidence ({update.images.length})
                </span>
                <span className="mono-pill" style={{ textTransform: 'capitalize' }}>{update.images[0].type}</span>
              </div>
              <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#0f172a', maxHeight: 160, display: 'flex', justifyContent: 'center' }}>
                <img src={update.images[0].url} alt="Photo Evidence" style={{ maxHeight: 160, width: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                &ldquo;{update.images[0].caption}&rdquo; &bull; {update.images[0].timestamp} ({update.images[0].supervisor})
              </div>
            </div>
          )}

          {update.issueFlag && (
            <div style={{ background: 'var(--status-unplanned-bg)', border: '1px solid var(--status-unplanned-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertOctagon size={18} style={{ color: 'var(--status-unplanned-fg)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--status-unplanned-fg)' }}>
                  Reported Site Blocker / Delay Issue ({update.issueSeverity?.toUpperCase() || 'MEDIUM'} SEVERITY)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {update.issueFlag}
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Raw Text Evidence */}
          <div className="card" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
              Original Source Evidence Text:
            </div>
            <div className="raw-code-box">
              &ldquo;{update.rawText}&rdquo;
            </div>
          </div>

          {/* Section 2: Algorithm Score Breakdown */}
          <div className="card" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                <Sparkles size={14} style={{ color: 'var(--brand-primary)' }} /> Alignment Confidence Score
              </span>
              <span className={`status-badge ${match.category}`}>
                {match.confidenceScore}% Confidence
              </span>
            </div>

            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              Keyword ({match.scoreBreakdown.keywordScore}/50) | Discipline ({match.scoreBreakdown.disciplineScore}/20) | Area ({match.scoreBreakdown.areaScore}/15) | Fuzzy ({match.scoreBreakdown.fuzzyScore}/15)
            </div>

            {match.matchReasons.length > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', marginTop: '5px', fontWeight: 600 }}>
                💡 <i>{match.matchReasons[0]}</i>
              </div>
            )}
          </div>

          {/* Section 3: Editable Parameters */}
          <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
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
                style={{ width: '100%', paddingLeft: '0.75rem' }}
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
                  style={{ width: '100%', paddingLeft: '0.75rem' }}
                  value={editArea}
                  onChange={e => setEditArea(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Event Status:</label>
                <select
                  className="form-select"
                  style={{ width: '100%' }}
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

          {/* Section 4: L5/L6 Schedule Search Bar */}
          <div>
            <h4 style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <LinkIcon size={14} style={{ color: 'var(--brand-primary)' }} /> Target Schedule Activity:
            </h4>

            {/* Search Input */}
            <div className="search-input-box" style={{ marginBottom: '0.5rem' }}>
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search schedule activities by ID or keyword..."
                value={searchSchedule}
                onChange={e => setSearchSchedule(e.target.value)}
              />
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '180px', overflowY: 'auto' }}>
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

          {/* Section 5: Planner Justification Note */}
          <div>
            <label style={{ fontSize: '0.725rem', color: 'var(--text-primary)', display: 'block', marginBottom: '2px', fontWeight: 700 }}>
              Planner Justification Note:
            </label>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '0.75rem' }}
              placeholder="Enter audit note for decision rationale..."
              value={plannerNote}
              onChange={e => setPlannerNote(e.target.value)}
            />
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedAuditUpdateId(update.id)}
            type="button"
          >
            <ShieldCheck size={13} /> Full Audit Log
          </button>

          {selectedActivityObj && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                saveEdits();
                const actionType: PlannerActionType = selectedActivityId === match.candidateActivityId ? 'approve' : 'relink';
                handlePlannerAction(update.id, actionType, selectedActivityId, plannerNote);
                setSelectedInspectorUpdateId(null);
              }}
              type="button"
            >
              <CheckCircle2 size={13} /> Confirm Link
            </button>
          )}

          <button
            className="btn btn-warning btn-sm"
            onClick={() => {
              saveEdits();
              handlePlannerAction(update.id, 'mark_unplanned', null, plannerNote || 'Marked as unplanned work');
              setSelectedInspectorUpdateId(null);
            }}
            type="button"
          >
            <HelpCircle size={13} /> Unplanned
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              handlePlannerAction(update.id, 'reject', null, plannerNote || 'Rejected');
              setSelectedInspectorUpdateId(null);
            }}
            type="button"
          >
            <XCircle size={13} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
};
