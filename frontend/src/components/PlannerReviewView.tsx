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
  Check,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { PlannerActionType } from '../types';

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
  const [queueFilter, setQueueFilter] = useState<'review' | 'unplanned' | 'approved' | 'all'>('review');

  // Filtered review queue items
  const queueItems = useMemo(() => {
    return siteUpdates
      .filter(u => {
        const match = matchResults[u.id];
        const decision = plannerDecisions[u.id];

        // Status category
        const isApproved = decision?.status === 'approved';
        const isUnplanned = decision?.status === 'unplanned' || (!decision && match?.category === 'unplanned');
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
  const isSelectedDifferentFromRecommended =
    selectedActivityId !== (currentMatch?.candidateActivityId || null);

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
    if (type === 'approve') msg = `Link confirmed to activity ${targetId}`;
    else if (type === 'relink') msg = `Re-linked update to activity ${targetId}`;
    else if (type === 'mark_unplanned') msg = 'Categorized as unplanned site work';
    else if (type === 'reject') msg = 'Site update rejected';

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
      <div className="banner-card">
        <div>
          <h2 className="banner-title">
            <AlertTriangle size={20} style={{ color: 'var(--brand-primary)' }} />
            Planner Review & Schedule Alignment Workbench
          </h2>
          <p className="banner-desc">
            Verify ambiguous supervisor reports, inspect confidence breakdowns, and link or relink site evidence to L5/L6 schedule items.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            className="mono-pill"
            style={{
              background: 'var(--status-review-bg)',
              color: 'var(--status-review-fg)',
              borderColor: 'var(--status-review-border)',
              fontWeight: 700,
              padding: '0.3rem 0.65rem',
            }}
          >
            {siteUpdates.filter(u => matchResults[u.id]?.category === 'review' && !plannerDecisions[u.id]).length} Items Need Review
          </span>
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="review-container">
        {/* Left Pane: Queue List */}
        <div className="review-queue-pane">
          <div className="review-queue-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Review Queue ({queueItems.length})
              </span>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 3, marginBottom: '0.65rem' }}>
              {([
                { id: 'review', label: 'Review' },
                { id: 'unplanned', label: 'Unplanned' },
                { id: 'approved', label: 'Approved' },
                { id: 'all', label: 'All' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  className={`btn btn-sm ${queueFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '2px 8px', fontSize: '0.725rem' }}
                  onClick={() => setQueueFilter(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="search-input-box">
              <Search size={13} className="search-icon" />
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', fontSize: '0.775rem', padding: '0.35rem 0.6rem 0.35rem 1.9rem' }}
                placeholder="Filter queue items..."
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="review-queue-list">
            {queueItems.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                No updates match this queue filter.
              </div>
            ) : (
              queueItems.map(item => {
                const match = matchResults[item.id];
                const decision = plannerDecisions[item.id];
                const isActive = item.id === activeUpdateId;

                const score = match?.confidenceScore || 0;
                const scoreClass = score >= 75 ? 'ready' : score >= 50 ? 'review' : 'unplanned';

                return (
                  <div
                    key={item.id}
                    className={`review-queue-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedReviewUpdateId(item.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                        {item.id}
                      </span>
                      <span className={`status-badge ${scoreClass}`} style={{ fontSize: '0.675rem' }}>
                        {score}% Conf
                      </span>
                    </div>

                    <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 4 }}>
                      {item.extractedDescription}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      <span className="mono-pill" style={{ fontSize: '0.65rem' }}>{item.discipline}</span>
                      <span>{item.sourceFile}</span>
                    </div>

                    {decision && (
                      <div style={{ marginTop: 5, paddingTop: 4, borderTop: '1px dashed var(--border-subtle)', fontSize: '0.7rem', color: 'var(--status-ready-fg)', fontWeight: 600 }}>
                        &bull; Action: {decision.status.toUpperCase()} ({decision.linkedActivityId || 'UNPLANNED'})
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.95rem' }}>
                    {currentUpdate.id}
                  </span>
                  <span className="mono-pill">{currentUpdate.discipline}</span>
                  <span className="mono-pill">{currentUpdate.area}</span>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    Report Date: {currentUpdate.reportDate}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                  Source: <strong>{currentUpdate.sourceFile}</strong> {currentUpdate.lineEvidence ? `(Line/Row #${currentUpdate.lineEvidence})` : ''}
                  {currentUpdate.supervisor ? ` | Supervisor: ${currentUpdate.supervisor}` : ''}
                </div>
              </div>

              <div>
                <span
                  className={`status-badge ${
                    currentMatch.confidenceScore >= 75 ? 'ready' : currentMatch.confidenceScore >= 50 ? 'review' : 'unplanned'
                  }`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                >
                  {currentMatch.confidenceScore}% Match ({currentMatch.category.toUpperCase()})
                </span>
              </div>
            </div>

            {/* Workbench Body */}
            <div className="review-detail-body">
              {/* Success Notification Alert */}
              {actionSuccessMessage && (
                <div
                  style={{
                    background: 'var(--status-ready-bg)',
                    border: '1px solid var(--status-ready-border)',
                    color: 'var(--status-ready-fg)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                  }}
                >
                  <Check size={15} />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}

              {/* Source Text Evidence Card */}
              <div className="card" style={{ padding: '0.85rem 1rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Raw Supervisor Field Evidence & Extracted Task
                </h4>
                <div className="raw-code-box" style={{ marginBottom: '0.65rem' }}>
                  &ldquo;{currentUpdate.rawText}&rdquo;
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.775rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span><strong>Extracted Activity:</strong> {currentUpdate.extractedDescription}</span>
                  <span><strong>Status:</strong> {currentUpdate.eventStatus}</span>
                  {currentUpdate.quantity && (
                    <span><strong>Quantity:</strong> {currentUpdate.quantity} {currentUpdate.unit || ''}</span>
                  )}
                </div>
              </div>

              {/* Confidence Score Breakdown */}
              <div className="card" style={{ padding: '0.85rem 1rem', background: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h4 style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={14} style={{ color: 'var(--brand-primary)' }} />
                    Multi-Factor Alignment Score (Total: {currentMatch.confidenceScore} / 100)
                  </h4>
                </div>

                <div className="score-breakdown-grid" style={{ marginBottom: '0.75rem' }}>
                  <div className="score-chip">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600, marginBottom: 3 }}>
                      <span>Keyword Match</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{currentMatch.scoreBreakdown.keywordScore}/50</span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill blue"
                        style={{ width: `${(currentMatch.scoreBreakdown.keywordScore / 50) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="score-chip">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600, marginBottom: 3 }}>
                      <span>Discipline Match</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{currentMatch.scoreBreakdown.disciplineScore}/20</span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill green"
                        style={{ width: `${(currentMatch.scoreBreakdown.disciplineScore / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="score-chip">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600, marginBottom: 3 }}>
                      <span>Area Match</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{currentMatch.scoreBreakdown.areaScore}/15</span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill amber"
                        style={{ width: `${(currentMatch.scoreBreakdown.areaScore / 15) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="score-chip">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600, marginBottom: 3 }}>
                      <span>Fuzzy Similarity</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{currentMatch.scoreBreakdown.fuzzyScore}/15</span>
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {currentMatch.matchReasons.map((reason, idx) => (
                      <span key={idx} className="mono-pill" style={{ background: '#ffffff', fontSize: '0.7rem' }}>
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* L5/L6 Schedule Search and Interactive Linker */}
              <div className="card" style={{ padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <LinkIcon size={15} style={{ color: 'var(--brand-primary)' }} />
                    Target Baseline Schedule Activity
                  </h4>
                  {selectedActivityObj && (
                    <span
                      className="mono-pill"
                      style={{
                        background: 'var(--status-ready-bg)',
                        color: 'var(--status-ready-fg)',
                        borderColor: 'var(--status-ready-border)',
                        fontWeight: 700,
                      }}
                    >
                      Selected: {selectedActivityObj.activityId}
                    </span>
                  )}
                </div>

                {/* Interactive Search Bar */}
                <div className="search-input-box" style={{ marginBottom: '0.65rem' }}>
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%' }}
                    placeholder="Search activities by ID, name, WBS, area, or alias..."
                    value={searchScheduleQuery}
                    onChange={e => setSearchScheduleQuery(e.target.value)}
                  />
                </div>

                {/* Schedule Activity Selectable List */}
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 3 }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.825rem' }}>
                              {act.activityId}
                            </span>
                            <span className="mono-pill" style={{ fontSize: '0.675rem' }}>WBS {act.wbs}</span>
                            <span className="mono-pill" style={{ fontSize: '0.675rem' }}>{act.discipline}</span>
                            {isRecommended && (
                              <span style={{ background: 'var(--status-ready-bg)', color: 'var(--status-ready-fg)', border: '1px solid var(--status-ready-border)', fontWeight: 700, fontSize: '0.65rem', padding: '1px 5px', borderRadius: 3 }}>
                                ★ Algorithmic Match
                              </span>
                            )}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                            {act.activityName}
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            Area: {act.area} | Window: {act.plannedStart} to {act.plannedFinish}
                          </div>
                        </div>

                        <input
                          type="radio"
                          name="selectedSchedule"
                          checked={isSelected}
                          onChange={() => setSelectedActivityId(act.activityId)}
                          style={{ width: 15, height: 15, cursor: 'pointer' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Planner Decision & Audit Justification */}
              <div className="card" style={{ padding: '0.85rem 1rem' }}>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  Planner Audit Note (Optional Justification):
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', marginBottom: '0.85rem', paddingLeft: '0.75rem' }}
                  placeholder="e.g. Verified site supervisor log corresponds to Line CW spool in pump bay..."
                  value={plannerNote}
                  onChange={e => setPlannerNote(e.target.value)}
                />

                {/* 4 Working Action Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'flex-end' }}>
                  {/* Action 1 & 2: Approve / Relink */}
                  {selectedActivityObj && (
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        executeAction(
                          isSelectedDifferentFromRecommended ? 'relink' : 'approve',
                          selectedActivityObj.activityId,
                          isSelectedDifferentFromRecommended
                            ? `Planner manually re-linked to ${selectedActivityObj.activityId}`
                            : `Planner approved link to ${selectedActivityObj.activityId}`
                        )
                      }
                      type="button"
                    >
                      <CheckCircle2 size={15} />
                      <span>
                        {isSelectedDifferentFromRecommended
                          ? `Relink to ${selectedActivityObj.activityId}`
                          : `Approve Link to ${selectedActivityObj.activityId}`}
                      </span>
                    </button>
                  )}

                  {/* Action 3: Mark as Unplanned */}
                  <button
                    className="btn btn-warning"
                    onClick={() =>
                      executeAction('mark_unplanned', null, 'Planner classified update as unplanned / out-of-scope work')
                    }
                    type="button"
                  >
                    <HelpCircle size={15} />
                    <span>Mark as Unplanned Work</span>
                  </button>

                  {/* Action 4: Reject Report */}
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      executeAction('reject', null, 'Planner rejected duplicate or invalid site update')
                    }
                    type="button"
                  >
                    <XCircle size={15} />
                    <span>Reject Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="review-detail-pane" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
            <div className="empty-state">
              <CheckCircle2 size={36} style={{ color: 'var(--status-ready-fg)' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                No Update Selected
              </div>
              <p style={{ fontSize: '0.825rem' }}>Select an update item on the left queue to review.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
