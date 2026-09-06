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
  ArrowRight,
  Camera,
  Layers,
  FileText,
  Eye,
  ShieldCheck,
  AlertOctagon,
  ChevronRight,
  Sparkle,
  Calendar,
  ExternalLink
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
    setSelectedInspectorUpdateId,
    setActiveTab,
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

  // Robust active update resolution: ensures no stale selection if queue item is completed
  const currentUpdate = useMemo(() => {
    if (queueItems.length === 0) return null;
    if (selectedReviewUpdateId) {
      const found = queueItems.find(item => item.id === selectedReviewUpdateId);
      if (found) return found;
    }
    return queueItems[0];
  }, [queueItems, selectedReviewUpdateId]);

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
    } else {
      setSelectedActivityId(null);
      setPlannerNote('');
    }
  }, [currentUpdate?.id, matchResults, plannerDecisions]);

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
  const recommendedActivityObj = schedule.find(a => a.activityId === currentMatch?.candidateActivityId);
  const isSelectedDifferentFromRecommended =
    selectedActivityId !== (currentMatch?.candidateActivityId || null);

  // AI Suggestions: Top candidates for this update
  const suggestedCandidates = useMemo(() => {
    if (!currentUpdate) return [];
    if (currentMatch?.suggestedActivities && currentMatch.suggestedActivities.length > 0) {
      return currentMatch.suggestedActivities;
    }
    // Fallback: Pick top matching activities by discipline and area
    const matchingDiscipline = schedule.filter(
      a => a.discipline.toLowerCase() === currentUpdate.discipline.toLowerCase()
    );
    return matchingDiscipline.slice(0, 3).map(a => ({
      activity: a,
      score: a.activityId === currentMatch?.candidateActivityId ? (currentMatch?.confidenceScore || 80) : 55,
      reasons: [a.discipline, a.area],
    }));
  }, [currentUpdate, currentMatch, schedule]);

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
    let nextItemId: string | null = null;
    if (queueItems.length > 1) {
      const nextIndex = currentIndex < queueItems.length - 1 ? currentIndex + 1 : 0;
      nextItemId = queueItems[nextIndex].id;
    }

    handlePlannerAction(updateIdToProcess, type, targetId, finalNote);

    let msg = '';
    if (type === 'approve') msg = `Link confirmed to activity ${targetId}`;
    else if (type === 'relink') msg = `Re-linked update to activity ${targetId}`;
    else if (type === 'mark_unplanned') msg = 'Categorized as unplanned site work';
    else if (type === 'reject') msg = 'Site update rejected';

    setActionSuccessMessage(msg);
    setSelectedReviewUpdateId(nextItemId);

    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  const pendingReviewTotal = siteUpdates.filter(
    u => matchResults[u.id]?.category === 'review' && !plannerDecisions[u.id]
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner Header */}
      <div className="banner-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="brand-badge" style={{ background: '#e9f2ff', color: '#0c66e4', borderColor: '#cce0ff' }}>
              Planner Reconciliation Center
            </span>
            <span
              className="mono-pill"
              style={{
                background: pendingReviewTotal > 0 ? '#fffbeb' : '#ecfdf5',
                color: pendingReviewTotal > 0 ? '#92400e' : '#047857',
                borderColor: pendingReviewTotal > 0 ? '#fcd34d' : '#6ee7b7',
                fontWeight: 700,
              }}
            >
              {pendingReviewTotal} Items Pending Review
            </span>
          </div>
          <h1 className="banner-title">
            <Sparkles size={22} style={{ color: 'var(--brand-primary)' }} />
            <span>AI Auto-Match Matrix & Task Approval</span>
          </h1>
          <p className="banner-desc">
            Review site supervisor reports, inspect AI confidence scores, and confirm or re-assign progress to L5/L6 milestone activities.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveTab('site-updates')}
          >
            <span>View All Field Updates</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Dual Pane Workbench Layout */}
      <div className="review-container" style={{ gridTemplateColumns: '340px minmax(0, 1fr)', gap: '1.5rem' }}>
        
        {/* Left Pane: Queue List with Filters */}
        <div className="review-queue-pane">
          <div className="review-queue-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Queue ({queueItems.length})
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Sorted by Confidence
              </span>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '0.65rem' }}>
              {([
                { id: 'review', label: 'Needs Review' },
                { id: 'unplanned', label: 'Unplanned' },
                { id: 'approved', label: 'Approved' },
                { id: 'all', label: 'All' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  className={`btn btn-sm ${queueFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.725rem',
                    flex: 1,
                    fontWeight: queueFilter === tab.id ? 700 : 500,
                  }}
                  onClick={() => setQueueFilter(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="search-input-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', fontSize: '0.8rem' }}
                placeholder="Search queue updates..."
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Queue Items List */}
          <div className="review-queue-list" style={{ maxHeight: '720px' }}>
            {queueItems.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <CheckCircle2 size={32} style={{ color: '#047857', margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No Items In Queue</div>
                <div style={{ fontSize: '0.775rem', marginTop: 4 }}>
                  All updates in the &ldquo;{queueFilter}&rdquo; filter have been processed!
                </div>
              </div>
            ) : (
              queueItems.map(item => {
                const match = matchResults[item.id];
                const decision = plannerDecisions[item.id];
                const isActive = item.id === currentUpdate?.id;

                const score = match?.confidenceScore || 0;
                const scoreClass = score >= 75 ? 'ready' : score >= 50 ? 'review' : 'unplanned';

                return (
                  <div
                    key={item.id}
                    className={`review-queue-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedReviewUpdateId(item.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isActive ? 'var(--brand-surface)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--brand-primary)' : '3px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                        {item.id}
                      </span>
                      <span className={`status-badge ${scoreClass}`} style={{ fontSize: '0.7rem' }}>
                        {score}% Conf
                      </span>
                    </div>

                    <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 4 }}>
                      {item.extractedDescription || item.rawText}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      <span className="mono-pill" style={{ fontSize: '0.675rem' }}>{item.discipline}</span>
                      <span>Area: {item.area || 'General'}</span>
                    </div>

                    {decision && (
                      <div style={{ marginTop: 6, paddingTop: 4, borderTop: '1px dashed var(--border-subtle)', fontSize: '0.725rem', color: '#047857', fontWeight: 700 }}>
                        ✓ {decision.status.toUpperCase()} ({decision.linkedActivityId || 'UNPLANNED'})
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Review & Approval Workbench */}
        {currentUpdate && currentMatch ? (
          <div className="review-detail-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'transparent', border: 'none', boxShadow: 'none' }}>
            
            {/* Success Toast */}
            {actionSuccessMessage && (
              <div
                style={{
                  background: 'var(--status-ready-bg)',
                  border: '1px solid var(--status-ready-border)',
                  color: 'var(--status-ready-fg)',
                  padding: '0.85rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <CheckCircle2 size={18} />
                <span>{actionSuccessMessage}</span>
              </div>
            )}

            {/* SECTION 1: WHAT ARE WE LOOKING AT? (Field Event Details) */}
            <div className="card">
              <div className="card-header" style={{ background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    1. Field Event (Source of Truth)
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.95rem' }}>
                    {currentUpdate.id}
                  </span>
                  <span className="mono-pill">{currentUpdate.discipline}</span>
                  <span className="mono-pill">{currentUpdate.area}</span>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    📅 {currentUpdate.reportDate}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedInspectorUpdateId(currentUpdate.id)}
                    title="Open side drawer to inspect full metadata and hash provenance"
                  >
                    <Eye size={13} />
                    <span>Inspect Full Metadata</span>
                  </button>
                </div>
              </div>

              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>
                    SUPERVISOR NOTE:
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {currentUpdate.extractedDescription}
                  </div>
                </div>

                <div className="raw-code-box" style={{ padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, fontWeight: 700 }}>VERBATIM LOG TEXT:</div>
                  &ldquo;{currentUpdate.rawText}&rdquo;
                </div>

                {/* Evidence Chips: Photo & Blocker */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  {currentUpdate.images && currentUpdate.images.length > 0 && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#e9f2ff',
                        border: '1px solid #cce0ff',
                        color: '#0c66e4',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedInspectorUpdateId(currentUpdate.id)}
                    >
                      <Camera size={14} />
                      <span>{currentUpdate.images.length} Photo Proof Attached (View)</span>
                    </div>
                  )}

                  {currentUpdate.issueFlag && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#fef2f2',
                        border: '1px solid #fca5a5',
                        color: '#991b1b',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      <AlertOctagon size={14} />
                      <span>Blocker Flagged: {currentUpdate.issueFlag}</span>
                    </div>
                  )}

                  {currentUpdate.supervisor && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      Reported by: <strong>{currentUpdate.supervisor}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: WHAT IS IT ASSIGNED TO? (AI Alignment & Suggestions) */}
            <div className="card">
              <div className="card-header" style={{ background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    2. AI Match & Milestone Assignment
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className="status-badge"
                    style={{
                      background: currentMatch.confidenceScore >= 75 ? 'var(--status-ready-bg)' : 'var(--status-review-bg)',
                      color: currentMatch.confidenceScore >= 75 ? 'var(--status-ready-fg)' : 'var(--status-review-fg)',
                      borderColor: currentMatch.confidenceScore >= 75 ? 'var(--status-ready-border)' : 'var(--status-review-border)',
                      fontSize: '0.75rem',
                      padding: '3px 8px',
                      fontWeight: 700,
                    }}
                  >
                    {currentMatch.confidenceScore}% AI Confidence ({currentMatch.category.toUpperCase()})
                  </span>
                </div>
              </div>

              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Algorithmic Recommended Candidate Card */}
                {recommendedActivityObj ? (
                  <div
                    style={{
                      border: selectedActivityId === recommendedActivityObj.activityId ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      background: selectedActivityId === recommendedActivityObj.activityId ? '#f0f7ff' : '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedActivityId(recommendedActivityObj.activityId)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 3 }}>
                        <span style={{ background: '#047857', color: '#ffffff', fontSize: '0.675rem', fontWeight: 800, padding: '1px 6px', borderRadius: 'var(--radius-xs)' }}>
                          ★ AI Top Recommendation
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.9rem' }}>
                          {recommendedActivityObj.activityId}
                        </span>
                        <span className="mono-pill">WBS {recommendedActivityObj.wbs}</span>
                        <span className="mono-pill">{recommendedActivityObj.discipline}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {recommendedActivityObj.activityName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Area: <strong>{recommendedActivityObj.area}</strong> | Window: {recommendedActivityObj.plannedStart} to {recommendedActivityObj.plannedFinish}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="radio"
                        name="activeMatch"
                        checked={selectedActivityId === recommendedActivityObj.activityId}
                        onChange={() => setSelectedActivityId(recommendedActivityObj.activityId)}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '0.85rem', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', color: '#991b1b', fontSize: '0.825rem' }}>
                    <strong>No deterministic match found.</strong> Choose a suggested alternative below or search the schedule baseline.
                  </div>
                )}

                {/* AI Alternative Suggestions (1-Click Switch) */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Alternative Candidate Suggestions (1-Click Select):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                    {suggestedCandidates.map((cand, idx) => {
                      const isSelected = selectedActivityId === cand.activity.activityId;
                      return (
                        <div
                          key={cand.activity.activityId}
                          onClick={() => setSelectedActivityId(cand.activity.activityId)}
                          style={{
                            border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.55rem 0.75rem',
                            background: isSelected ? '#f0f7ff' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.775rem', color: 'var(--brand-primary)' }}>
                              {cand.activity.activityId}
                            </span>
                            <span className="mono-pill" style={{ fontSize: '0.65rem' }}>
                              {cand.score}% match
                            </span>
                          </div>
                          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cand.activity.activityName}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {cand.activity.area}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule Activity Manual Search Box */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Browse Full Milestone Schedule (L5/L6):
                    </span>
                    {searchScheduleQuery && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', cursor: 'pointer' }} onClick={() => setSearchScheduleQuery('')}>
                        Clear Search
                      </span>
                    )}
                  </div>
                  <div className="search-input-box" style={{ marginBottom: '0.5rem' }}>
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                      placeholder="Type activity ID, name, WBS or area to search all activities..."
                      value={searchScheduleQuery}
                      onChange={e => setSearchScheduleQuery(e.target.value)}
                    />
                  </div>

                  {searchScheduleQuery && (
                    <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '4px' }}>
                      {filteredSchedule.map(act => (
                        <div
                          key={act.activityId}
                          onClick={() => setSelectedActivityId(act.activityId)}
                          style={{
                            padding: '0.45rem 0.65rem',
                            borderRadius: 'var(--radius-xs)',
                            background: selectedActivityId === act.activityId ? 'var(--brand-surface)' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: 'var(--brand-primary)', marginRight: 6 }}>
                              {act.activityId}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {act.activityName}
                            </span>
                          </div>
                          <span className="mono-pill" style={{ fontSize: '0.65rem' }}>{act.area}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: PROMINENT ACTION BAR */}
            <div className="card" style={{ padding: '1.15rem 1.35rem', background: '#ffffff' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.775rem' }}>
                  <span>Planner Verification Note / Justification (Logged to Audit Trail):</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Verified pipe spool tag matches isometric drawing CW-017..."
                  value={plannerNote}
                  onChange={e => setPlannerNote(e.target.value)}
                />
              </div>

              {/* Action Buttons with High-Contrast Colors */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                
                {/* Approve / Relink Button */}
                {selectedActivityObj && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      background: isSelectedDifferentFromRecommended ? '#0c66e4' : '#059669',
                      borderColor: isSelectedDifferentFromRecommended ? '#0052cc' : '#047857',
                      padding: '0.65rem 1.25rem',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                    onClick={() =>
                      executeAction(
                        isSelectedDifferentFromRecommended ? 'relink' : 'approve',
                        selectedActivityObj.activityId,
                        isSelectedDifferentFromRecommended
                          ? `Planner manually re-linked to ${selectedActivityObj.activityId}`
                          : `Planner approved link to ${selectedActivityObj.activityId}`
                      )
                    }
                  >
                    <CheckCircle2 size={16} />
                    <span>
                      {isSelectedDifferentFromRecommended
                        ? `Confirm Re-Link to ${selectedActivityObj.activityId}`
                        : `Approve Match to ${selectedActivityObj.activityId}`}
                    </span>
                  </button>
                )}

                {/* Mark as Unplanned Button */}
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: '#d97706',
                    color: '#ffffff',
                    borderColor: '#b45309',
                    padding: '0.65rem 1.15rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                  onClick={() =>
                    executeAction('mark_unplanned', null, 'Planner classified update as unplanned / out-of-scope work')
                  }
                >
                  <HelpCircle size={16} />
                  <span>Mark Unplanned Work</span>
                </button>

                {/* Reject Button */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    color: '#b91c1c',
                    borderColor: '#fca5a5',
                    padding: '0.65rem 1.15rem',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                  onClick={() =>
                    executeAction('reject', null, 'Planner rejected duplicate or invalid site update')
                  }
                >
                  <XCircle size={16} />
                  <span>Reject Log</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* Empty / All Reconciled State (NO STALE DATA BUG) */
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 420,
              padding: '3rem 2rem',
              textAlign: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#ecfdf5',
                border: '2px solid #6ee7b7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#047857',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                All Tasks in This Queue Reconciled! 🎉
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem', maxWidth: 460 }}>
                There are currently zero pending review items in the &ldquo;{queueFilter}&rdquo; filter. You can switch filters to review other items or return to the Project Control Center.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setQueueFilter('approved')}
              >
                <span>View Approved Items</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setQueueFilter('unplanned')}
              >
                <span>View Unplanned Work</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('dashboard')}
              >
                <span>Go to Control Center</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
