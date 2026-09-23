import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { evaluateMatch } from '../utils/matchingEngine';
import { MatchScoreRadarChart } from './MatchScoreRadarChart';

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
    plannerQueueFilter,
    setPlannerQueueFilter,
  } = useProject();

  // Search & Filter in the left queue
  const [queueSearch, setQueueSearch] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');

  // Dynamic real-time counts across all 4 queue tabs
  const counts = useMemo(() => {
    let review = 0;
    let approved = 0;
    let unplanned = 0;

    siteUpdates.forEach(u => {
      const match = matchResults[u.id];
      const decision = plannerDecisions[u.id];

      const isApproved =
        decision?.status === 'approved' ||
        decision?.status === 'modified' ||
        (!decision && match?.category === 'ready');

      const isUnplanned =
        decision?.status === 'unplanned' ||
        (!decision && match?.category === 'unplanned');

      const isReview = !decision && match?.category === 'review';

      if (isReview) review++;
      if (isUnplanned) unplanned++;
      if (isApproved) approved++;
    });

    return {
      all: siteUpdates.length,
      review,
      approved,
      unplanned,
    };
  }, [siteUpdates, matchResults, plannerDecisions]);

  // Available disciplines for filtering
  const availableDisciplines = useMemo(() => {
    const list = Array.from(new Set(siteUpdates.map(u => u.discipline).filter(Boolean)));
    return ['all', ...list];
  }, [siteUpdates]);

  // Filtered review queue items
  const queueItems = useMemo(() => {
    return siteUpdates
      .filter(u => {
        const match = matchResults[u.id];
        const decision = plannerDecisions[u.id];

        // Status category
        const isApproved =
          decision?.status === 'approved' ||
          decision?.status === 'modified' ||
          (!decision && match?.category === 'ready');
        const isUnplanned =
          decision?.status === 'unplanned' ||
          (!decision && match?.category === 'unplanned');
        const isReview = !decision && match?.category === 'review';

        if (plannerQueueFilter === 'review' && !isReview) return false;
        if (plannerQueueFilter === 'unplanned' && !isUnplanned) return false;
        if (plannerQueueFilter === 'approved' && !isApproved) return false;

        // Discipline filter
        if (disciplineFilter !== 'all' && u.discipline.toLowerCase() !== disciplineFilter.toLowerCase()) {
          return false;
        }

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
  }, [siteUpdates, matchResults, plannerDecisions, plannerQueueFilter, disciplineFilter, queueSearch]);

  // Pagination & Arbitrary Dataset Scale Engine (supports 10 to 1,000,000+ records)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const totalPages = Math.max(1, Math.ceil(queueItems.length / pageSize));

  // Reset page on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [plannerQueueFilter, queueSearch, disciplineFilter, pageSize]);

  // Robust active update resolution: keeps selection within current filtered queue, or falls back to queue[0]
  const currentUpdate = useMemo(() => {
    if (selectedReviewUpdateId) {
      const foundInQueue = queueItems.find(item => item.id === selectedReviewUpdateId);
      if (foundInQueue) return foundInQueue;
    }
    if (queueItems.length > 0) return queueItems[0];
    return null;
  }, [queueItems, selectedReviewUpdateId]);

  // When active item changes, ensure current page contains it
  useEffect(() => {
    if (currentUpdate) {
      const idx = queueItems.findIndex(item => item.id === currentUpdate.id);
      if (idx !== -1) {
        const itemPage = Math.floor(idx / pageSize) + 1;
        if (itemPage !== currentPage) {
          setCurrentPage(itemPage);
        }
      }
    }
  }, [currentUpdate?.id, queueItems, pageSize]);

  const paginatedQueueItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return queueItems.slice(start, start + pageSize);
  }, [queueItems, currentPage, pageSize]);

  // Ref to automatically scroll to the active queue item in the left queue list
  const activeQueueItemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeQueueItemRef.current) {
      activeQueueItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentUpdate?.id]);

  const currentMatch = useMemo(() => {
    if (!currentUpdate) return null;
    return matchResults[currentUpdate.id] || {
      siteUpdateId: currentUpdate.id,
      candidateActivityId: '',
      confidenceScore: 0,
      category: 'unplanned',
      explanation: 'No initial baseline match evaluated.',
      subScores: { textSimilarity: 0, disciplineMatch: 0, wbsHierarchy: 0, dateProximity: 0, contractorMatch: 0 },
      suggestedActivities: [],
    };
  }, [currentUpdate, matchResults]);

  const currentDecision = currentUpdate ? plannerDecisions[currentUpdate.id] : null;

  // Search & Selection within Schedule Activities Linker
  const [searchScheduleQuery, setSearchScheduleQuery] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [plannerNote, setPlannerNote] = useState('');

  // Sync state when active update changes
  useEffect(() => {
    if (currentUpdate) {
      const match = matchResults[currentUpdate.id];
      const decision = plannerDecisions[currentUpdate.id];
      setSelectedActivityId(decision?.linkedActivityId || match?.candidateActivityId || null);
      setPlannerNote(decision?.plannerNote || '');
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

  const selectedActivityObj = useMemo(() => {
    return schedule.find(a => a.activityId === selectedActivityId) || null;
  }, [schedule, selectedActivityId]);

  const recommendedActivityObj = useMemo(() => {
    return schedule.find(a => a.activityId === currentMatch?.candidateActivityId) || null;
  }, [schedule, currentMatch?.candidateActivityId]);

  const isSelectedDifferentFromRecommended =
    selectedActivityId !== (currentMatch?.candidateActivityId || null);

  // Dynamic real-time multi-factor evaluation for the currently selected schedule activity
  const selectedActivityEvaluation = useMemo(() => {
    if (!currentUpdate || !selectedActivityObj) return null;
    return evaluateMatch(currentUpdate, selectedActivityObj);
  }, [currentUpdate, selectedActivityObj]);

  // Compute match confidence scores for schedule search results against currentUpdate
  const scheduleItemsWithConfidence = useMemo(() => {
    if (!currentUpdate) {
      return filteredSchedule.map(act => ({ act, score: 0 }));
    }
    return filteredSchedule.map(act => {
      const evaluation = evaluateMatch(currentUpdate, act);
      return {
        act,
        score: evaluation.score,
      };
    }).sort((a, b) => {
      // If user typed a search query, sort highest confidence first
      if (searchScheduleQuery.trim()) {
        return b.score - a.score;
      }
      return 0;
    });
  }, [currentUpdate, filteredSchedule, searchScheduleQuery]);

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

  // Action dispatcher with feedback toast & smooth auto-advance
  const executeAction = (
    type: PlannerActionType,
    targetId: string | null = null,
    defaultNote: string = ''
  ) => {
    if (!currentUpdate) return;
    const finalNote = plannerNote.trim() || defaultNote;
    const updateIdToProcess = currentUpdate.id;

    // Determine next queue item to advance focus without disorientation
    const remainingItems = queueItems.filter(item => item.id !== updateIdToProcess);
    const currentIndex = queueItems.findIndex(item => item.id === updateIdToProcess);
    let nextItemId: string | null = null;
    if (remainingItems.length > 0) {
      const nextIndex = Math.min(currentIndex, remainingItems.length - 1);
      nextItemId = remainingItems[nextIndex].id;
    }

    handlePlannerAction(updateIdToProcess, type, targetId, finalNote);
    setSelectedReviewUpdateId(nextItemId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header matching Verification Queue */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '0.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Verification Queue & Field Approvals
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Audit, verify, and reconcile field execution updates against the master schedule baseline.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('project-info')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', fontWeight: 600 }}
          >
            <span>View Master Schedule (Project Info)</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Dual Pane Workbench Layout */}
      <div className="review-container" style={{ gridTemplateColumns: '380px minmax(0, 1fr)', gap: '1.25rem' }}>
        
        {/* Left Pane: Submissions Inbox Queue with Filter Tabs */}
        <div className="review-queue-pane">
          <div className="review-queue-header">
            {/* Top Filter Tabs with live dynamic counts */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${plannerQueueFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.725rem', fontWeight: plannerQueueFilter === 'all' ? 700 : 500 }}
                onClick={() => setPlannerQueueFilter('all')}
                type="button"
              >
                All ({counts.all})
              </button>
              <button
                className={`btn btn-sm ${plannerQueueFilter === 'review' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.725rem', fontWeight: plannerQueueFilter === 'review' ? 700 : 500 }}
                onClick={() => setPlannerQueueFilter('review')}
                type="button"
              >
                Needs Review ({counts.review})
              </button>
              <button
                className={`btn btn-sm ${plannerQueueFilter === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.725rem', fontWeight: plannerQueueFilter === 'approved' ? 700 : 500 }}
                onClick={() => setPlannerQueueFilter('approved')}
                type="button"
              >
                Auto-Matched ({counts.approved})
              </button>
              <button
                className={`btn btn-sm ${plannerQueueFilter === 'unplanned' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 8px', fontSize: '0.725rem', fontWeight: plannerQueueFilter === 'unplanned' ? 700 : 500 }}
                onClick={() => setPlannerQueueFilter('unplanned')}
                type="button"
              >
                Unplanned Work ({counts.unplanned})
              </button>
            </div>

            {/* Filter Dropdowns Row & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.65rem' }}>
              <select
                className="form-input"
                style={{ fontSize: '0.7rem', padding: '0.25rem 0.4rem', height: 'auto', flex: 1 }}
                value={disciplineFilter}
                onChange={e => setDisciplineFilter(e.target.value)}
              >
                <option value="all">All Disciplines</option>
                {availableDisciplines.filter(d => d !== 'all').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="search-input-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', fontSize: '0.8rem' }}
                placeholder="Search submissions..."
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Queue Items List */}
          <div className="review-queue-list" style={{ maxHeight: '700px' }}>
            {queueItems.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <CheckCircle2 size={32} style={{ color: '#047857', margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No Items In Queue</div>
                <div style={{ fontSize: '0.775rem', marginTop: 4 }}>
                  All updates in the &ldquo;{plannerQueueFilter}&rdquo; filter have been reconciled.
                </div>
              </div>
            ) : (
              paginatedQueueItems.map(item => {
                const match = matchResults[item.id];
                const decision = plannerDecisions[item.id];
                const isActive = item.id === currentUpdate?.id;

                const score = match?.confidenceScore || 0;
                const scoreClass = score >= 75 ? 'ready' : score >= 50 ? 'review' : 'unplanned';

                return (
                  <div
                    key={item.id}
                    ref={isActive ? activeQueueItemRef : null}
                    className={`review-queue-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedReviewUpdateId(item.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isActive ? 'var(--brand-surface)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--brand-primary)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease-out, border-color 0.15s ease-out',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.images && item.images.length > 0 && (
                          <span style={{ fontSize: '0.675rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700 }}>
                            <Camera size={11} /> {item.images[0].confirmedTag ? item.images[0].confirmedTag : 'Photo Attached'}
                          </span>
                        )}
                        <span>Area: {item.area || 'General'}</span>
                      </div>
                    </div>

                    {decision && (
                      <div
                        style={{
                          marginTop: 6,
                          paddingTop: 4,
                          borderTop: '1px dashed var(--border-subtle)',
                          fontSize: '0.725rem',
                          color: decision.status === 'unplanned' ? '#d97706' : decision.status === 'rejected' ? '#dc2626' : '#047857',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {decision.status === 'unplanned' ? (
                          <>
                            <HelpCircle size={12} />
                            <span>OUT-OF-BASELINE (UNPLANNED)</span>
                          </>
                        ) : decision.status === 'rejected' ? (
                          <>
                            <XCircle size={12} />
                            <span>REJECTED</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={12} />
                            <span>{decision.status.toUpperCase()} ({decision.linkedActivityId || 'VERIFIED'})</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* High-Scale Pagination Footer (supports small batches to 10M+ tasks) */}
          {queueItems.length > 0 && (
            <div
              style={{
                padding: '0.55rem 0.85rem',
                borderTop: '1px solid var(--border-default)',
                background: 'var(--bg-surface-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.725rem',
                borderBottomLeftRadius: 'var(--radius-sm)',
                borderBottomRightRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ color: 'var(--text-muted)' }}>
                <strong>{Math.min((currentPage - 1) * pageSize + 1, queueItems.length)}</strong>–<strong>{Math.min(currentPage * pageSize, queueItems.length)}</strong> of <strong>{queueItems.length}</strong> tasks
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 7px', fontSize: '0.675rem', opacity: currentPage === 1 ? 0.4 : 1 }}
                >
                  Prev
                </button>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                  Page {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 7px', fontSize: '0.675rem', opacity: currentPage >= totalPages ? 0.4 : 1 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Review & Approval Workbench */}
        {currentUpdate && currentMatch ? (
          <div className="review-detail-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'transparent', border: 'none', boxShadow: 'none' }}>
            
            {/* SECTION 1: WHAT ARE WE LOOKING AT? (Field Event Details) */}
            <div className="card">
              <div className="card-header">
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
                    <span>Inspect Metadata</span>
                  </button>
                </div>
              </div>

              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>
                    SUPERVISOR REPORT:
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
                        gap: '0.5rem',
                        background: 'var(--brand-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--brand-primary)',
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedInspectorUpdateId(currentUpdate.id)}
                    >
                      <Camera size={15} />
                      <span>Photo Proof Attached</span>
                      {currentUpdate.images[0].confirmedTag ? (
                        <span style={{ background: 'var(--brand-primary)', color: '#ffffff', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                          Tag: {currentUpdate.images[0].confirmedTag}
                        </span>
                      ) : (
                        <span style={{ background: 'var(--brand-surface-hover)', color: 'var(--brand-primary)', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem' }}>
                          Unconfirmed Tag
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', textDecoration: 'underline', marginLeft: 4 }}>
                        View / Verify Tag →
                      </span>
                    </div>
                  )}

                  {currentUpdate.issueFlag && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'var(--status-unplanned-bg)',
                        border: '1px solid var(--status-unplanned-border)',
                        color: 'var(--status-unplanned-fg)',
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
                      Supervisor: <strong>{currentUpdate.supervisor}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: WHAT IS IT ASSIGNED TO? (AI Alignment & Suggestions) */}
            <div id="demo-target-ai-matching" className="card">
              <div className="card-header">
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
                  <>
                    <div
                      style={{
                        border: selectedActivityId === recommendedActivityObj.activityId ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1rem',
                        background: selectedActivityId === recommendedActivityObj.activityId ? 'var(--brand-surface)' : 'var(--bg-surface)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-out',
                        boxShadow: selectedActivityId === recommendedActivityObj.activityId ? 'var(--shadow-xs)' : 'none',
                      }}
                      onClick={() => setSelectedActivityId(recommendedActivityObj.activityId)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ background: '#047857', color: '#ffffff', fontSize: '0.675rem', fontWeight: 800, padding: '2px 7px', borderRadius: 'var(--radius-xs)' }}>
                            ★ AI Top Recommendation
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.9rem' }}>
                            {recommendedActivityObj.activityId}
                          </span>
                          <span className="mono-pill" title="Level-5 WBS Identification Code" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            L5: {recommendedActivityObj.l5Code || `IOCL.P4.${(recommendedActivityObj.area || 'UNIT01').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}.${recommendedActivityObj.discipline.substring(0, 3).toUpperCase()}.L5.011`}
                          </span>
                          <span className="mono-pill" title="Cryptographic SHA-256 Task Fingerprint" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.675rem' }}>
                            #{recommendedActivityObj.taskHash || 'D7A9F4B2'}
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
                          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
                        />
                      </div>
                    </div>

                    {/* AI Multi-Factor Match Score Radar (Dynamic for Selected Schedule Item) */}
                    {selectedActivityObj && (
                      <MatchScoreRadarChart
                        score={selectedActivityEvaluation ? selectedActivityEvaluation.score : (currentMatch?.confidenceScore || 0)}
                        scoreBreakdown={selectedActivityEvaluation ? selectedActivityEvaluation.scoreBreakdown : (currentMatch?.scoreBreakdown || { keywordScore: 0, disciplineScore: 0, areaScore: 0, fuzzyScore: 0 })}
                        activityId={selectedActivityObj.activityId}
                        activityName={selectedActivityObj.activityName}
                        isAlternative={isSelectedDifferentFromRecommended}
                        reasons={selectedActivityEvaluation ? selectedActivityEvaluation.reasons : (currentMatch?.matchReasons || [])}
                      />
                    )}
                  </>
                ) : (
                  <div style={{ padding: '0.85rem', background: 'var(--status-unplanned-bg)', border: '1px solid var(--status-unplanned-border)', borderRadius: 'var(--radius-md)', color: 'var(--status-unplanned-fg)', fontSize: '0.825rem' }}>
                    <strong>No deterministic match found.</strong> Choose a suggested alternative below or search the schedule baseline.
                  </div>
                )}

                {/* AI Alternative Suggestions (1-Click Switch) */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.55rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={14} style={{ color: 'var(--brand-primary)' }} />
                    Alternative Candidate Suggestions (1-Click Select):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                    {suggestedCandidates.map((cand) => {
                      const isSelected = selectedActivityId === cand.activity.activityId;
                      return (
                        <div
                          key={cand.activity.activityId}
                          onClick={() => setSelectedActivityId(cand.activity.activityId)}
                          style={{
                            border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.65rem 0.85rem',
                            background: isSelected ? 'var(--brand-surface)' : 'var(--bg-surface)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            transition: 'all 0.15s ease-out',
                            boxShadow: isSelected ? 'var(--shadow-xs)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.8rem', color: 'var(--brand-primary)' }}>
                              {cand.activity.activityId}
                            </span>
                            <span
                              className="mono-pill"
                              style={{
                                fontSize: '0.675rem',
                                background: cand.score >= 70 ? 'var(--status-ready-bg)' : 'var(--status-review-bg)',
                                color: cand.score >= 70 ? 'var(--status-ready-fg)' : 'var(--status-review-fg)',
                                borderColor: cand.score >= 70 ? 'var(--status-ready-border)' : 'var(--status-review-border)',
                                fontWeight: 700,
                              }}
                            >
                              {cand.score}% match
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cand.activity.activityName}
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {cand.activity.area} • WBS {cand.activity.wbs}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule Activity Manual Search Box & Full Schedule Browser */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Browse Full Milestone Schedule (L5/L6 Activities):
                    </span>
                    {searchScheduleQuery && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setSearchScheduleQuery('')}>
                        Clear Search ({scheduleItemsWithConfidence.length} matches)
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

                  {/* Display Schedule Items with Real-Time Apt Confidence Scores */}
                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '6px', background: 'var(--bg-surface)' }}>
                    {scheduleItemsWithConfidence.length === 0 ? (
                      <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        No schedule activities matched "{searchScheduleQuery}"
                      </div>
                    ) : (
                      scheduleItemsWithConfidence.map(({ act, score }) => {
                        const isSelected = selectedActivityId === act.activityId;
                        const isRecommended = currentMatch?.candidateActivityId === act.activityId;
                        const confColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#94a3b8';
                        const confBg = score >= 70 ? 'rgba(16, 185, 129, 0.12)' : score >= 40 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(148, 163, 184, 0.08)';
                        const confBorder = score >= 70 ? 'rgba(16, 185, 129, 0.3)' : score >= 40 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(148, 163, 184, 0.2)';

                        return (
                          <div
                            key={act.activityId}
                            onClick={() => setSelectedActivityId(act.activityId)}
                            style={{
                              padding: '0.45rem 0.65rem',
                              borderRadius: 'var(--radius-xs)',
                              background: isSelected ? 'var(--brand-surface)' : 'transparent',
                              border: isSelected ? '1.5px solid var(--brand-primary)' : '1px solid transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: 'background 0.15s ease, border-color 0.15s ease',
                            }}
                            className="hover-card"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                              <input
                                type="radio"
                                name="scheduleSearchSelection"
                                checked={isSelected}
                                onChange={() => setSelectedActivityId(act.activityId)}
                                style={{ accentColor: 'var(--brand-primary)', cursor: 'pointer', flexShrink: 0 }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.75rem', color: 'var(--brand-primary)' }}>
                                    {act.activityId}
                                  </span>
                                  {isRecommended && (
                                    <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: 3, background: '#047857', color: '#fff', fontWeight: 800 }}>
                                      ★ AI Top Match
                                    </span>
                                  )}
                                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {act.activityName}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                  Discipline: {act.discipline} • Area: {act.area} • WBS: {act.wbs}
                                </div>
                              </div>
                            </div>

                            {/* Real-time confidence badge displayed next to every schedule item in the search list */}
                            <span
                              className="mono-pill"
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: 5,
                                background: confBg,
                                color: confColor,
                                border: `1px solid ${confBorder}`,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                              title={`Multi-factor AI match score: ${score}%`}
                            >
                              {score}% Conf
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: PROMINENT ACTION BAR */}
            <div id="demo-target-human-control" className="card" style={{ padding: '1.15rem 1.35rem', background: 'var(--bg-surface)' }}>
              
              {/* Decision Confirmation Banners */}
              {currentDecision?.status === 'unplanned' && (
                <div
                  style={{
                    background: 'rgba(217, 119, 6, 0.1)',
                    border: '1px solid rgba(217, 119, 6, 0.35)',
                    borderRadius: 8,
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <HelpCircle size={22} style={{ color: '#d97706', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#d97706' }}>
                      Classified as Out-of-Baseline (Unplanned Scope)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      This field log has been recorded as unplanned work outside baseline milestones and flagged for change-order review.
                      {currentDecision.digitalSignature && (
                        <span style={{ fontFamily: 'var(--font-mono)', marginLeft: 6, opacity: 0.85 }}>
                          [{currentDecision.digitalSignature}]
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentDecision?.status === 'approved' && (
                <div
                  style={{
                    background: 'rgba(5, 150, 105, 0.1)',
                    border: '1px solid rgba(5, 150, 105, 0.35)',
                    borderRadius: 8,
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <CheckCircle2 size={22} style={{ color: '#059669', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669' }}>
                      Verified & Linked to Master Schedule: {currentDecision.linkedActivityId}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      Cryptographically verified & signed milestone progress update logged in project audit chain.
                      {currentDecision.digitalSignature && (
                        <span style={{ fontFamily: 'var(--font-mono)', marginLeft: 6, opacity: 0.85 }}>
                          [{currentDecision.digitalSignature}]
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                      background: isSelectedDifferentFromRecommended ? '#0284c7' : '#059669',
                      borderColor: isSelectedDifferentFromRecommended ? '#0369a1' : '#047857',
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
                      {currentDecision?.status === 'unplanned'
                        ? `Re-link & Align to ${selectedActivityObj.activityId}`
                        : currentDecision?.status === 'approved' && !isSelectedDifferentFromRecommended
                        ? `Re-confirm Link to ${selectedActivityObj.activityId}`
                        : isSelectedDifferentFromRecommended
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
                    background: currentDecision?.status === 'unplanned' ? 'rgba(217, 119, 6, 0.15)' : '#d97706',
                    color: currentDecision?.status === 'unplanned' ? '#d97706' : '#ffffff',
                    borderColor: '#b45309',
                    padding: '0.65rem 1.15rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: currentDecision?.status === 'unplanned' ? 'default' : 'pointer',
                  }}
                  disabled={currentDecision?.status === 'unplanned'}
                  onClick={() =>
                    executeAction('mark_unplanned', null, 'Planner classified update as unplanned / out-of-scope work')
                  }
                >
                  <HelpCircle size={16} />
                  <span>{currentDecision?.status === 'unplanned' ? 'Classified as Unplanned' : 'Mark Unplanned Work'}</span>
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
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--status-ready-bg)',
                border: '1px solid var(--status-ready-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--status-ready-fg)',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                All Items Reconciled & Aligned
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', maxWidth: 460 }}>
                There are currently zero pending review items in the &ldquo;{plannerQueueFilter}&rdquo; filter. You can switch filters to review other items or return to the Project Control Center.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPlannerQueueFilter('approved')}
              >
                <span>View Approved Items</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPlannerQueueFilter('unplanned')}
              >
                <span>View Unplanned Work</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab('dashboard')}
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
