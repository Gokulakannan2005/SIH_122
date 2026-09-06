import React, { useState, useMemo, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Search,
  Link as LinkIcon,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { MatchCategory, PlannerActionType } from '../types';

export const PlannerReviewView: React.FC = () => {
  const {
    siteUpdates,
    schedule,
    matchResults,
    plannerDecisions,
    handlePlannerAction,
    selectedReviewUpdateId,
    setSelectedReviewUpdateId,
  } = useProject();

  // Search & Filter in the left queue
  const [queueSearch, setQueueSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<'all' | 'review' | 'unplanned' | 'approved'>('review');

  // Filtered review queue items
  const queueItems = useMemo(() => {
    return siteUpdates
      .filter(u => {
        const match = matchResults[u.id];
        const decision = plannerDecisions[u.id];

        // Status category
        const isApproved = decision?.status === 'approved';
        const isUnplanned = decision?.status === 'unplanned' || match?.category === 'unplanned';
        const isReview = !isApproved && !isUnplanned && match?.category === 'review';

        if (queueFilter === 'review' && !isReview) return false;
        if (queueFilter === 'unplanned' && !isUnplanned) return false;
        if (queueFilter === 'approved' && !isApproved) return false;

        // Search text
        if (queueSearch.trim()) {
          const q = queueSearch.toLowerCase();
          const matches =
            u.id.toLowerCase().includes(q) ||
            u.extractedDescription.toLowerCase().includes(q) ||
            u.rawText.toLowerCase().includes(q) ||
            u.discipline.toLowerCase().includes(q) ||
            (u.area && u.area.toLowerCase().includes(q));
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Show lowest confidence first to tackle most uncertain items
        const matchA = matchResults[a.id];
        const matchB = matchResults[b.id];
        return (matchA?.confidenceScore || 0) - (matchB?.confidenceScore || 0);
      });
  }, [siteUpdates, matchResults, plannerDecisions, queueFilter, queueSearch]);

  // Selected item
  const activeUpdateId =
    selectedReviewUpdateId ||
    (queueItems.length > 0 ? queueItems[0].id : siteUpdates[0]?.id);

  const currentUpdate = siteUpdates.find(u => u.id === activeUpdateId);
  const currentMatch = currentUpdate ? matchResults[currentUpdate.id] : null;
  const currentDecision = currentUpdate ? plannerDecisions[currentUpdate.id] : null;

  // Search & Selection within Schedule Activities Linker
  const [searchScheduleQuery, setSearchScheduleQuery] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [plannerNote, setPlannerNote] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Sync state when active update changes
  useEffect(() => {
    if (currentUpdate) {
      const match = matchResults[currentUpdate.id];
      const decision = plannerDecisions[currentUpdate.id];
      setSelectedActivityId(decision?.linkedActivityId || match?.candidateActivityId || null);
      setPlannerNote(decision?.plannerNote || '');
      setActionSuccessMessage(null);
    }
  }, [activeUpdateId, matchResults, plannerDecisions]);

  // Filtered schedule activities for linking
  const filteredSchedule = useMemo(() => {
    if (!searchScheduleQuery.trim()) {
      // If no query, show candidates first, then rest
      return schedule;
    }
    const q = searchScheduleQuery.toLowerCase();
    return schedule.filter(act => {
      return (
        act.activityId.toLowerCase().includes(q) ||
        act.wbs.toLowerCase().includes(q) ||
        act.activityName.toLowerCase().includes(q) ||
        act.area.toLowerCase().includes(q) ||
        act.discipline.toLowerCase().includes(q) ||
        act.aliases.some(alias => alias.toLowerCase().includes(q)) ||
        (act.rawAliases && act.rawAliases.toLowerCase().includes(q))
      );
    });
  }, [schedule, searchScheduleQuery]);

  const selectedActivityObj = schedule.find(a => a.activityId === selectedActivityId);

  // Action dispatcher with feedback toast & auto-advance
  const executeAction = (
    type: PlannerActionType,
    targetId: string | null = null,
    defaultNote: string = ''
  ) => {
    if (!currentUpdate) return;
    const finalNote = plannerNote.trim() || defaultNote;
    const updateIdToProcess = currentUpdate.id;
    
    // Determine next queue item to select
    const currentIndex = queueItems.findIndex(item => item.id === updateIdToProcess);
    let nextItem = null;
    if (currentIndex !== -1 && queueItems.length > 1) {
      nextItem = currentIndex < queueItems.length - 1 ? queueItems[currentIndex + 1] : queueItems[0];
    }

    handlePlannerAction(updateIdToProcess, type, targetId, finalNote);

    let msg = '';
    if (type === 'approve') msg = `Successfully confirmed link to ${targetId}`;
    else if (type === 'relink') msg = `Re-linked update to ${targetId}`;
    else if (type === 'mark_unplanned') msg = 'Categorized as new unplanned site activity';
    else if (type === 'reject') msg = 'Update marked as rejected';

    setActionSuccessMessage(msg);
    if (nextItem && nextItem.id !== updateIdToProcess) {
      setSelectedReviewUpdateId(nextItem.id);
    }
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="banner-card" style={{ borderLeftColor: '#d97706' }}>
        <div>
          <h2 className="banner-title">
            <AlertTriangle style={{ color: '#d97706' }} />
            Planner Review Queue & Schedule Linker
          </h2>
          <p className="banner-desc">
            Verify ambiguous supervisor reports, inspect NLP keyword confidence breakdowns, and manually align site evidence to L5/L6 schedule items.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="mono-pill" style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a', fontWeight: 700, padding: '0.35rem 0.75rem' }}>
            {siteUpdates.filter(u => matchResults[u.id]?.category === 'review' && !plannerDecisions[u.id]).length} Items Need Review
          </span>
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="review-container">
        {/* Left Pane: Queue List */}
        <div className="review-queue-pane">
          <div className="review-queue-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Review Queue ({queueItems.length})
              </span>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 4, marginBottom: '0.75rem' }}>
              {(['review', 'unplanned', 'approved', 'all'] as const).map(tab => (
                <button
                  key={tab}
                  className={`btn btn-sm ${queueFilter === tab ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '2px 8px', fontSize: '0.725rem', textTransform: 'capitalize' }}
                  onClick={() => setQueueFilter(tab)}
                  type="button"
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="search-input-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', fontSize: '0.8rem', padding: '0.35rem 0.6rem 0.35rem 2rem' }}
                placeholder="Filter queue..."
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="review-queue-list">
            {queueItems.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No updates matching this queue filter.
              </div>
            ) : (
              queueItems.map(item => {
                const match = matchResults[item.id];
                const decision = plannerDecisions[item.id];
                const isActive = item.id === activeUpdateId;

                const score = match?.confidenceScore || 0;
                const scoreColor = score >= 75 ? '#15803d' : score >= 50 ? '#d97706' : '#dc2626';

                return (
                  <div
                    key={item.id}
                    className={`review-queue-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedReviewUpdateId(item.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>
                        {item.id}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: scoreColor }}>
                        {score}% Conf
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, marginBottom: 4 }}>
                      {item.extractedDescription}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                      <span className="mono-pill" style={{ fontSize: '0.675rem' }}>{item.discipline}</span>
                      <span>{item.sourceFile}</span>
                    </div>

                    {decision && (
                      <div style={{ marginTop: 6, paddingTop: 4, borderTop: '1px dashed #e2e8f0', fontSize: '0.7rem', color: '#15803d', fontWeight: 600 }}>
                        &bull; Decision: {decision.status.toUpperCase()} ({decision.linkedActivityId || 'UNPLANNED'})
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Review & Linker Workbench */}
        {currentUpdate && currentMatch ? (
          <div className="review-detail-pane">
            {/* Workbench Header */}
            <div className="review-detail-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#2563eb', fontSize: '1rem' }}>
                    {currentUpdate.id}
                  </span>
                  <span className="mono-pill">{currentUpdate.discipline}</span>
                  <span className="mono-pill">{currentUpdate.area}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {currentUpdate.reportDate}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: 3 }}>
                  Source: <strong>{currentUpdate.sourceFile}</strong> {currentUpdate.lineEvidence ? `(Line/Row #${currentUpdate.lineEvidence})` : ''}
                  {currentUpdate.supervisor ? ` | Supervisor: ${currentUpdate.supervisor}` : ''}
                </div>
              </div>

              <div>
                <span
                  className={`status-badge ${
                    currentMatch.confidenceScore >= 75 ? 'ready' : currentMatch.confidenceScore >= 50 ? 'review' : 'unplanned'
                  }`}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                >
                  {currentMatch.confidenceScore}% Confidence ({currentMatch.category.toUpperCase()})
                </span>
              </div>
            </div>

            {/* Workbench Body */}
            <div className="review-detail-body">
              {/* Success Notification Alert */}
              {actionSuccessMessage && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.75rem 1rem', borderRadius: 6, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                  <Check size={16} />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}

              {/* Source Text Evidence Card */}
              <div className="card" style={{ padding: '1rem', background: '#ffffff' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Raw Site Evidence & Extracted Work
                </h4>
                <div className="raw-code-box" style={{ fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  &ldquo;{currentUpdate.rawText}&rdquo;
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#475569' }}>
                  <span><strong>Extracted Activity:</strong> {currentUpdate.extractedDescription}</span>
                  <span><strong>Event Status:</strong> {currentUpdate.eventStatus}</span>
                  {currentUpdate.quantity && (
                    <span><strong>Quantity:</strong> {currentUpdate.quantity} {currentUpdate.unit || ''}</span>
                  )}
                </div>
              </div>

              {/* Confidence Score Breakdown */}
              <div className="card" style={{ padding: '1rem', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} style={{ color: '#2563eb' }} />
                    NLP Match Score Breakdown (Total: {currentMatch.confidenceScore} / 100)
                  </h4>
                </div>

                <div className="score-breakdown-grid" style={{ marginBottom: '0.85rem' }}>
                  <div className="score-chip">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: 4 }}>
                      <span>Keyword Match</span>
                      <span>{currentMatch.scoreBreakdown.keywordScore} / 50</span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill blue"
                        style={{ width: `${(currentMatch.scoreBreakdown.keywordScore / 50) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="score-chip">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: 4 }}>
                      <span>Discipline Match</span>
                      <span>{currentMatch.scoreBreakdown.disciplineScore} / 20</span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill green"
                        style={{ width: `${(currentMatch.scoreBreakdown.disciplineScore / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="score-chip">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: 4 }}>
                      <span>Area Proximity</span>
                      <span>{currentMatch.scoreBreakdown.areaScore} / 15</span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill amber"
                        style={{ width: `${(currentMatch.scoreBreakdown.areaScore / 15) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="score-chip">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: 4 }}>
                      <span>Fuzzy Similarity</span>
                      <span>{currentMatch.scoreBreakdown.fuzzyScore} / 15</span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill blue"
                        style={{ width: `${(currentMatch.scoreBreakdown.fuzzyScore / 15) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Match Reasons */}
                {currentMatch.matchReasons && currentMatch.matchReasons.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {currentMatch.matchReasons.map((reason, idx) => (
                      <span key={idx} className="mono-pill" style={{ background: '#ffffff', fontSize: '0.725rem' }}>
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* L5/L6 Schedule Search and Interactive Linker */}
              <div className="card" style={{ padding: '1rem', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <LinkIcon size={16} style={{ color: '#2563eb' }} />
                    Link to L5/L6 Baseline Schedule Activity
                  </h4>
                  {selectedActivityObj && (
                    <span className="mono-pill" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0', fontWeight: 700 }}>
                      Selected: {selectedActivityObj.activityId}
                    </span>
                  )}
                </div>

                {/* Interactive Search Bar */}
                <div className="search-input-box" style={{ marginBottom: '0.75rem' }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '2.4rem' }}
                    placeholder="Search candidate schedule activities by ID, name, WBS, area, or alias..."
                    value={searchScheduleQuery}
                    onChange={e => setSearchScheduleQuery(e.target.value)}
                  />
                </div>

                {/* Schedule Activity Selectable List */}
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
                  {filteredSchedule.slice(0, 15).map(act => {
                    const isSelected = act.activityId === selectedActivityId;
                    const isRecommended = currentMatch.candidateActivityId === act.activityId;

                    return (
                      <div
                        key={act.activityId}
                        className={`schedule-select-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedActivityId(act.activityId)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#2563eb', fontSize: '0.85rem' }}>
                              {act.activityId}
                            </span>
                            <span className="mono-pill" style={{ fontSize: '0.7rem' }}>WBS {act.wbs}</span>
                            <span className="mono-pill" style={{ fontSize: '0.7rem' }}>{act.discipline}</span>
                            {isRecommended && (
                              <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.675rem', padding: '1px 6px', borderRadius: 4 }}>
                                ★ AI Recommended
                              </span>
                            )}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                            {act.activityName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Area: {act.area} | Window: {act.plannedStart} to {act.plannedFinish}
                          </div>
                        </div>

                        <input
                          type="radio"
                          name="selectedSchedule"
                          checked={isSelected}
                          onChange={() => setSelectedActivityId(act.activityId)}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Planner Decision & Audit Justification */}
              <div className="card" style={{ padding: '1rem', background: '#ffffff' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Planner Audit Note (Optional Justification):
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', marginBottom: '1rem' }}
                  placeholder="e.g. Confirmed site supervisor wording corresponds to CW spool erection in pump bay..."
                  value={plannerNote}
                  onChange={e => setPlannerNote(e.target.value)}
                />

                {/* 4 Working Action Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  {selectedActivityObj && (
                    <button
                      className="btn btn-primary"
                      onClick={() => executeAction('approve', selectedActivityObj.activityId, 'Planner approved activity link')}
                      type="button"
                    >
                      <CheckCircle2 size={16} />
                      <span>Confirm Link to {selectedActivityObj.activityId}</span>
                    </button>
                  )}

                  <button
                    className="btn btn-warning"
                    onClick={() => executeAction('mark_unplanned', null, 'Planner marked as new / unplanned site activity')}
                    type="button"
                  >
                    <HelpCircle size={16} />
                    <span>Classify as Unplanned Work</span>
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => executeAction('reject', null, 'Planner rejected invalid or duplicate site report')}
                    type="button"
                  >
                    <XCircle size={16} />
                    <span>Reject Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="review-detail-pane" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state">
              <CheckCircle2 size={40} style={{ color: '#10b981' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                No Update Selected
              </div>
              <p style={{ fontSize: '0.85rem' }}>Select an update item on the left queue to review.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
