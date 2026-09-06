import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Search,
  FileText,
  ChevronRight,
  RotateCcw,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Camera,
  AlertTriangle,
  X,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';

export const SiteUpdatesView: React.FC = () => {
  const {
    siteUpdates,
    matchResults,
    plannerDecisions,
    setSelectedInspectorUpdateId,
    setSelectedReviewUpdateId,
    setActiveTab,
    currentRole,
    siteUpdatesFilter,
    setSiteUpdatesFilter,
    navigateToPlannerReviewWithFilter,
  } = useProject();

  // View Mode: 'table' vs 'kanban'
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');

  // Sorting state
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'confidence-desc' | 'confidence-asc'>('date-desc');

  // Active filter state from context (persists across drawer/tab visits)
  const { discipline: selectedDiscipline, status: selectedStatus, source: selectedSource, search: searchQuery } = siteUpdatesFilter;

  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedDiscipline !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedSource !== 'ALL';

  const handleResetFilters = () => {
    setSiteUpdatesFilter({
      discipline: 'ALL',
      status: 'ALL',
      source: 'ALL',
      search: '',
    });
    setSortBy('date-desc');
  };

  // Unique discipline list
  const uniqueDisciplines = useMemo(() => {
    const set = new Set<string>();
    siteUpdates.forEach(u => u.discipline && set.add(u.discipline));
    return Array.from(set).sort();
  }, [siteUpdates]);

  const uniqueSources = useMemo(() => {
    const set = new Set<string>();
    siteUpdates.forEach(u => u.sourceFile && set.add(u.sourceFile));
    return Array.from(set).sort();
  }, [siteUpdates]);

  // Discipline Color Map for industrial badge chips
  const getDisciplineColor = (disc: string) => {
    switch (disc) {
      case 'Civil':
        return { bg: '#e9f2ff', text: '#0c66e4', border: '#cce0ff' };
      case 'Piping':
        return { bg: '#dcfff1', text: '#1f845a', border: '#7ee2b8' };
      case 'Electrical':
        return { bg: '#fff4e5', text: '#974f0c', border: '#fec195' };
      case 'Instrumentation':
        return { bg: '#f3f0ff', text: '#6e5dc6', border: '#d3cbfb' };
      case 'HSE':
        return { bg: '#ffebe6', text: '#ae2e24', border: '#fd9891' };
      default:
        return { bg: '#f1f2f4', text: '#44546f', border: '#dfe1e6' };
    }
  };

  // Filtered & Sorted site updates
  const filteredUpdates = useMemo(() => {
    return siteUpdates
      .filter(update => {
        const match = matchResults[update.id];
        const decision = plannerDecisions[update.id];

        // Search text matching across multi-fields
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesQuery =
            update.id.toLowerCase().includes(q) ||
            update.extractedDescription.toLowerCase().includes(q) ||
            update.rawText.toLowerCase().includes(q) ||
            update.discipline.toLowerCase().includes(q) ||
            (update.area && update.area.toLowerCase().includes(q)) ||
            (update.supervisor && update.supervisor.toLowerCase().includes(q)) ||
            (update.sourceFile && update.sourceFile.toLowerCase().includes(q)) ||
            (update.issueFlag && update.issueFlag.toLowerCase().includes(q)) ||
            (match?.candidateActivityId && match.candidateActivityId.toLowerCase().includes(q)) ||
            (decision?.linkedActivityId && decision.linkedActivityId.toLowerCase().includes(q));

          if (!matchesQuery) return false;
        }

        // Discipline filter
        if (selectedDiscipline !== 'ALL' && update.discipline !== selectedDiscipline) {
          return false;
        }

        // Source file filter
        if (selectedSource !== 'ALL' && update.sourceFile !== selectedSource) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL') {
          const isApproved = decision?.status === 'approved' || (!decision && match?.category === 'ready');
          const isReview = !decision && match?.category === 'review';
          const isUnplanned = decision?.status === 'unplanned' || (!decision && match?.category === 'unplanned');
          if (selectedStatus === 'approved' && !isApproved) return false;
          if (selectedStatus === 'review' && !isReview) return false;
          if (selectedStatus === 'unplanned' && !isUnplanned) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const matchA = matchResults[a.id];
        const matchB = matchResults[b.id];

        if (sortBy === 'confidence-desc') {
          return (matchB?.confidenceScore || 0) - (matchA?.confidenceScore || 0);
        }
        if (sortBy === 'confidence-asc') {
          return (matchA?.confidenceScore || 0) - (matchB?.confidenceScore || 0);
        }
        if (sortBy === 'date-asc') {
          return a.reportDate.localeCompare(b.reportDate);
        }
        // date-desc default
        return b.reportDate.localeCompare(a.reportDate);
      });
  }, [siteUpdates, matchResults, plannerDecisions, searchQuery, selectedDiscipline, selectedStatus, selectedSource, sortBy]);

  // Group into Kanban buckets
  const kanbanColumns = useMemo(() => {
    const reviewItems = filteredUpdates.filter(u => {
      const dec = plannerDecisions[u.id];
      const match = matchResults[u.id];
      return !dec && match?.category === 'review';
    });

    const readyItems = filteredUpdates.filter(u => {
      const dec = plannerDecisions[u.id];
      const match = matchResults[u.id];
      return !dec && match?.category === 'ready';
    });

    const approvedItems = filteredUpdates.filter(u => {
      const dec = plannerDecisions[u.id];
      return dec?.status === 'approved';
    });

    const unplannedItems = filteredUpdates.filter(u => {
      const dec = plannerDecisions[u.id];
      const match = matchResults[u.id];
      return dec?.status === 'unplanned' || (!dec && match?.category === 'unplanned');
    });

    return [
      { id: 'review', title: 'Needs Review', icon: <Clock size={14} />, items: reviewItems, color: 'var(--status-review-fg)' },
      { id: 'ready', title: 'Auto-Matched', icon: <Sparkles size={14} />, items: readyItems, color: 'var(--brand-primary)' },
      { id: 'approved', title: 'Approved & Linked', icon: <CheckCircle2 size={14} />, items: approvedItems, color: 'var(--status-ready-fg)' },
      { id: 'unplanned', title: 'Unplanned Work', icon: <HelpCircle size={14} />, items: unplannedItems, color: 'var(--status-unplanned-fg)' },
    ];
  }, [filteredUpdates, matchResults, plannerDecisions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <FileText size={20} style={{ color: 'var(--brand-primary)' }} />
            Daily Field Reports & Execution Feed
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Extracted supervisor reports, Excel progress records, and mobile logs aligned with schedule milestones.
          </p>
        </div>

        {/* View Mode Toggle (Trello Board vs Table List) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              type="button"
              title="Kanban Board view"
            >
              <LayoutGrid size={13} />
              <span>Board</span>
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              type="button"
              title="Table List view"
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>

          <span className="mono-pill" style={{ fontSize: '0.725rem', padding: '0.3rem 0.6rem' }}>
            Showing <strong>{filteredUpdates.length}</strong> of <strong>{siteUpdates.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter Toolbar & Quick Filter Pills */}
      <div className="toolbar-card">
        {/* Live Multi-Field Search Input */}
        <div className="search-input-box" style={{ maxWidth: 320 }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%' }}
            placeholder="Search ID, desc, area, supervisor..."
            value={searchQuery}
            onChange={e => setSiteUpdatesFilter(prev => ({ ...prev, search: e.target.value }))}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSiteUpdatesFilter(prev => ({ ...prev, search: '' }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: 'var(--text-muted)' }}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="filter-pill-group">
          <button
            className={`filter-pill ${selectedDiscipline === 'ALL' && selectedStatus === 'ALL' ? 'active' : ''}`}
            onClick={handleResetFilters}
            type="button"
          >
            All
          </button>
          {uniqueDisciplines.map(d => (
            <button
              key={d}
              className={`filter-pill ${selectedDiscipline === d ? 'active' : ''}`}
              onClick={() => setSiteUpdatesFilter(prev => ({ ...prev, discipline: prev.discipline === d ? 'ALL' : d }))}
              type="button"
            >
              {d}
            </button>
          ))}
          <button
            className={`filter-pill ${selectedStatus === 'review' ? 'active' : ''}`}
            onClick={() => setSiteUpdatesFilter(prev => ({ ...prev, status: prev.status === 'review' ? 'ALL' : 'review' }))}
            type="button"
          >
            Needs Review
          </button>
          <button
            className={`filter-pill ${selectedStatus === 'unplanned' ? 'active' : ''}`}
            onClick={() => setSiteUpdatesFilter(prev => ({ ...prev, status: prev.status === 'unplanned' ? 'ALL' : 'unplanned' }))}
            type="button"
          >
            Unplanned
          </button>
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sort:</span>
          <select
            className="form-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="confidence-desc">Confidence (Highest)</option>
            <option value="confidence-asc">Confidence (Lowest)</option>
          </select>
        </div>

        {/* Reset */}
        {isFiltered && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleResetFilters}
            title="Reset search and filters"
            type="button"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Active Filter Chips Bar */}
      {isFiltered && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', padding: '0.35rem 0.5rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <SlidersHorizontal size={12} /> Active Filters:
          </span>

          {searchQuery && (
            <span className="mono-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
              Search: &ldquo;{searchQuery}&rdquo;
              <button
                type="button"
                onClick={() => setSiteUpdatesFilter(prev => ({ ...prev, search: '' }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#1e40af' }}
              >
                <X size={11} />
              </button>
            </span>
          )}

          {selectedDiscipline !== 'ALL' && (
            <span className="mono-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
              Discipline: {selectedDiscipline}
              <button
                type="button"
                onClick={() => setSiteUpdatesFilter(prev => ({ ...prev, discipline: 'ALL' }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#1e40af' }}
              >
                <X size={11} />
              </button>
            </span>
          )}

          {selectedStatus !== 'ALL' && (
            <span className="mono-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
              Status: {selectedStatus === 'review' ? 'Needs Review' : selectedStatus === 'unplanned' ? 'Unplanned' : selectedStatus}
              <button
                type="button"
                onClick={() => setSiteUpdatesFilter(prev => ({ ...prev, status: 'ALL' }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#1e40af' }}
              >
                <X size={11} />
              </button>
            </span>
          )}

          {selectedSource !== 'ALL' && (
            <span className="mono-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
              Source: {selectedSource}
              <button
                type="button"
                onClick={() => setSiteUpdatesFilter(prev => ({ ...prev, source: 'ALL' }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#1e40af' }}
              >
                <X size={11} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            style={{ marginLeft: 'auto', fontSize: '0.725rem', color: 'var(--brand-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Content: Board View vs Table View */}
      {filteredUpdates.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Search size={36} style={{ color: 'var(--brand-primary)', margin: '0 auto 0.75rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            No Matching Field Reports Found
          </h3>
          <p style={{ fontSize: '0.825rem', maxWidth: 420, margin: '0 auto 1.25rem' }}>
            No updates matched your current search and filter criteria. Clear filters or change keywords to view other records.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetFilters}
          >
            <RotateCcw size={14} />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="kanban-board">
          {kanbanColumns.map(col => (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">
                <span className="kanban-column-title" style={{ color: col.color }}>
                  {col.icon}
                  <span>{col.title}</span>
                </span>
                <span className="kanban-column-badge">{col.items.length}</span>
              </div>

              <div className="kanban-column-body">
                {col.items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    No updates in this category
                  </div>
                ) : (
                  col.items.map(update => {
                    const match = matchResults[update.id];
                    const decision = plannerDecisions[update.id];
                    const discColor = getDisciplineColor(update.discipline);
                    const isLinked = !!(decision?.linkedActivityId || (match?.category === 'ready' && match.candidateActivityId));
                    const linkedId = decision?.linkedActivityId || match?.candidateActivityId;

                    return (
                      <div
                        key={update.id}
                        className="kanban-card"
                        onClick={() => setSelectedInspectorUpdateId(update.id)}
                        title="Click to view full provenance evidence in Inspector drawer"
                      >
                        {/* Card Header: ID & Discipline Label */}
                        <div className="kanban-card-header">
                          <span
                            className="kanban-label-chip"
                            style={{
                              background: discColor.bg,
                              color: discColor.text,
                              borderColor: discColor.border,
                            }}
                          >
                            {update.discipline}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                            {update.reportDate}
                          </span>
                        </div>

                        {/* Description */}
                        <div className="kanban-card-title">
                          {update.extractedDescription}
                        </div>

                        {/* Issue Banner if critical */}
                        {update.issueFlag && (
                          <div
                            style={{
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              borderRadius: 'var(--radius-xs)',
                              padding: '0.3rem 0.5rem',
                              fontSize: '0.7rem',
                              color: '#9f1239',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontWeight: 600,
                              marginBottom: '0.45rem',
                            }}
                          >
                            <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {update.issueFlag}
                            </span>
                          </div>
                        )}

                        {/* Matched Target Pill & AI Confidence */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.45rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                            {isLinked ? (
                              <span
                                className="mono-pill"
                                style={{
                                  fontSize: '0.675rem',
                                  color: 'var(--brand-primary)',
                                  borderColor: 'var(--brand-primary)',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                &rarr; {linkedId}
                              </span>
                            ) : (
                              <span className="mono-pill" style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                                Unplanned
                              </span>
                            )}
                          </div>

                          {match && match.confidenceScore > 0 && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                color: match.confidenceScore >= 75 ? 'var(--status-ready-fg)' : match.confidenceScore >= 50 ? 'var(--status-review-fg)' : 'var(--text-muted)',
                              }}
                            >
                              {match.confidenceScore}%
                            </span>
                          )}
                        </div>

                        {/* Card Footer: Metadata badges and role-based action */}
                        <div className="kanban-card-footer">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {update.images && update.images.length > 0 && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  fontSize: '0.675rem',
                                  color: 'var(--brand-primary)',
                                  background: '#f0f9ff',
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                  border: '1px solid #bae6fd',
                                }}
                                title="Site supervisor photo evidence attached"
                              >
                                <Camera size={10} />
                                <span>Photo</span>
                              </span>
                            )}
                            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                              {update.area || 'Field'}
                            </span>
                          </div>

                          {/* Role-gated action: Planners can jump to review; Supervisors inspect only */}
                          {currentRole === 'admin' && !decision && match?.category === 'review' ? (
                            <button
                              type="button"
                              className="btn btn-warning btn-sm"
                              style={{ padding: '2px 6px', fontSize: '0.675rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReviewUpdateId(update.id);
                                navigateToPlannerReviewWithFilter('review');
                              }}
                              title="Open in Planner Review Matrix"
                            >
                              <span>Review</span>
                              <ChevronRight size={10} />
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--brand-primary)',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                              }}
                            >
                              <span>Inspect</span>
                              <ChevronRight size={11} />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table List View */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="industrial-table">
              <thead>
                <tr>
                  <th>Update ID</th>
                  <th>Date</th>
                  <th>Discipline</th>
                  <th>Extracted Description</th>
                  <th>Area</th>
                  <th>Linked Milestone</th>
                  <th>Confidence</th>
                  <th>Proof</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUpdates.map(update => {
                  const match = matchResults[update.id];
                  const decision = plannerDecisions[update.id];
                  const discColor = getDisciplineColor(update.discipline);
                  const isLinked = !!(decision?.linkedActivityId || (match?.category === 'ready' && match.candidateActivityId));
                  const linkedId = decision?.linkedActivityId || match?.candidateActivityId;

                  return (
                    <tr
                      key={update.id}
                      onClick={() => setSelectedInspectorUpdateId(update.id)}
                      style={{ cursor: 'pointer' }}
                      title="Click to inspect update provenance & breakdown"
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                        {update.id}
                      </td>
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {update.reportDate}
                      </td>
                      <td>
                        <span
                          className="kanban-label-chip"
                          style={{
                            background: discColor.bg,
                            color: discColor.text,
                            borderColor: discColor.border,
                          }}
                        >
                          {update.discipline}
                        </span>
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {update.extractedDescription}
                        </div>
                        {update.issueFlag && (
                          <span style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 600 }}>
                            Blocker: {update.issueFlag}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {update.area || '—'}
                      </td>
                      <td>
                        {isLinked ? (
                          <span className="mono-pill" style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                            {linkedId}
                          </span>
                        ) : (
                          <span className="mono-pill" style={{ color: 'var(--status-unplanned-fg)', borderColor: '#fca5a5' }}>
                            Unplanned
                          </span>
                        )}
                      </td>
                      <td>
                        {match ? (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              color:
                                match.confidenceScore >= 75
                                  ? 'var(--status-ready-fg)'
                                  : match.confidenceScore >= 50
                                  ? 'var(--status-review-fg)'
                                  : 'var(--text-muted)',
                            }}
                          >
                            {match.confidenceScore}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {update.images && update.images.length > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                            <Camera size={13} /> {update.images.length}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.725rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInspectorUpdateId(update.id);
                          }}
                        >
                          <span>Inspect</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
