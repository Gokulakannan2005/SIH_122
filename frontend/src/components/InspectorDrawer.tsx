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
  Link as LinkIcon
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
  };

  return (
    <div className="drawer-backdrop" onClick={() => setSelectedInspectorUpdateId(null)}>
      <div className="drawer-pane" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header" style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="mono-pill" style={{ background: '#2563eb', color: 'white', borderColor: 'transparent', fontWeight: 700 }}>
                {update.id}
              </span>
              <span className="mono-pill" style={{ background: '#334155', color: '#e2e8f0', borderColor: 'transparent' }}>
                {update.discipline}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                {update.sourceFile} #{update.lineEvidence || '—'}
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', marginTop: '6px' }}>
              Site Update Inspector & Parameter Editor
            </h3>
          </div>

          <button
            onClick={() => setSelectedInspectorUpdateId(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* Section 1: Raw Text Evidence */}
          <div className="card" style={{ background: '#ffffff', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
              📄 Original Source Evidence Text:
            </div>
            <div className="raw-code-box">
              &ldquo;{update.rawText}&rdquo;
            </div>
          </div>

          {/* Section 2: Algorithm Score Breakdown */}
          <div className="card" style={{ padding: '1rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a' }}>
                <Sparkles size={16} style={{ color: '#2563eb' }} /> Algorithm Confidence Score
              </span>
              <span className={`status-badge ${match.category}`}>
                {match.confidenceScore}% Confidence
              </span>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
              Keyword ({match.scoreBreakdown.keywordScore}/50) | Discipline ({match.scoreBreakdown.disciplineScore}/20) | Area ({match.scoreBreakdown.areaScore}/15) | Fuzzy ({match.scoreBreakdown.fuzzyScore}/15)
            </div>

            {match.matchReasons.length > 0 && (
              <div style={{ fontSize: '0.78rem', color: '#1e3a8a', marginTop: '6px', fontWeight: 600 }}>
                💡 <i>{match.matchReasons[0]}</i>
              </div>
            )}
          </div>

          {/* Section 3: Editable Parameters */}
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#ffffff' }}>
            <div style={{ fontWeight: 800, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0f172a' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Edit3 size={16} style={{ color: '#2563eb' }} /> Edit Site Update Parameters
              </span>
              <button className="btn btn-secondary btn-sm" onClick={saveEdits}>
                <Save size={14} /> Save Parameters
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Extracted Description:</label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%' }}
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Area / Location:</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%' }}
                  value={editArea}
                  onChange={e => setEditArea(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Event Status:</label>
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
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <LinkIcon size={16} style={{ color: '#2563eb' }} /> Search & Link L5/L6 Schedule Activity:
            </h4>

            {/* High Visibility Search Input */}
            <div className="search-input-box" style={{ marginBottom: '0.5rem' }}>
              <Search size={16} className="search-icon" style={{ color: '#2563eb' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search schedule activities by ID or keyword..."
                value={searchSchedule}
                onChange={e => setSearchSchedule(e.target.value)}
                style={{ borderColor: '#2563eb', fontWeight: 600 }}
              />
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredSchedule.map(act => {
                const isSelected = act.activityId === selectedActivityId;
                const isRec = match.candidateActivityId === act.activityId;

                return (
                  <div
                    key={act.activityId}
                    onClick={() => setSelectedActivityId(act.activityId)}
                    className={`schedule-select-item ${isSelected ? 'selected' : ''}`}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#2563eb', fontSize: '0.85rem' }}>
                          {act.activityId}
                        </span>
                        <span style={{ fontSize: '0.725rem', color: '#64748b' }}>WBS {act.wbs}</span>
                        {isRec && <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>★ Top Candidate</span>}
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{act.activityName}</div>
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
            <label style={{ fontSize: '0.75rem', color: '#0f172a', display: 'block', marginBottom: '2px', fontWeight: 700 }}>
              Planner Decision Justification Note:
            </label>
            <textarea
              rows={2}
              className="form-input"
              style={{ width: '100%', fontSize: '0.85rem' }}
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
          >
            <ShieldCheck size={14} /> Full Audit Log
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
            >
              <CheckCircle2 size={14} /> Confirm Link
            </button>
          )}

          <button
            className="btn btn-warning btn-sm"
            onClick={() => {
              saveEdits();
              handlePlannerAction(update.id, 'mark_unplanned', null, plannerNote || 'Marked as unplanned work');
              setSelectedInspectorUpdateId(null);
            }}
          >
            <HelpCircle size={14} /> Mark Unplanned
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              handlePlannerAction(update.id, 'reject', null, plannerNote || 'Rejected');
              setSelectedInspectorUpdateId(null);
            }}
          >
            <XCircle size={14} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
};
