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
  ArrowRight
} from 'lucide-react';

export const SiteUpdatesView: React.FC = () => {
  const {
    siteUpdates,
    matchResults,
    plannerDecisions,
    setSelectedInspectorUpdateId,
    setSelectedReviewUpdateId,
    handlePlannerAction,
    setActiveTab,
  } = useProject();

  // View Mode: 'table' vs 'kanban'
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'confidence-desc' | 'confidence-asc'>('date-desc');

  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedDiscipline !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedSource !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDiscipline('ALL');
    setSelectedStatus('ALL');
    setSelectedSource('ALL');
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

  // Discipline Color Map for Trello-style Label Chips
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

        // Search text matching
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesQuery =
            update.id.toLowerCase().includes(q) ||
            update.extractedDescription.toLowerCase().includes(q) ||
            update.rawText.toLowerCase().includes(q) ||
            update.discipline.toLowerCase().includes(q) ||
            update.area.toLowerCase().includes(q) ||
            (update.supervisor && update.supervisor.toLowerCase().includes(q)) ||
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
            Site Progress Updates
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Supervisor progress reports and discipline trackers parsed for L5/L6 schedule alignment.
          </p>
        </div>

        {/* View Mode Toggle (Trello Board vs Table List) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              type="button"
            >
              <LayoutGrid size={13} />
              <span>Board</span>
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              type="button"
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>

          <span className="mono-pill" style={{ fontSize: '0.725rem', padding: '0.3rem 0.6rem' }}>
            <strong>{filteredUpdates.length}</strong> of <strong>{siteUpdates.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter Toolbar & Quick Filter Pills */}
      <div className="toolbar-card">
        {/* Live Search Input */}
        <div className="search-input-box" style={{ maxWidth: 300 }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%' }}
            placeholder="Search keywords, areas, supervisors..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Filter Pill Buttons (Trello/Jira style) */}
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
              onClick={() => setSelectedDiscipline(selectedDiscipline === d ? 'ALL' : d)}
              type="button"
            >
              {d}
            </button>
          ))}
          <button
            className={`filter-pill ${selectedStatus === 'review' ? 'active' : ''}`}
            onClick={() => setSelectedStatus(selectedStatus === 'review' ? 'ALL' : 'review')}
            type="button"
          >
            Needs Review
          </button>
          <button
            className={`filter-pill ${selectedStatus === 'unplanned' ? 'active' : ''}`}
            onClick={() => setSelectedStatus(selectedStatus === 'unplanned' ? 'ALL' : 'unplanned')}
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

      {/* Main Content: Board View vs Table View */}
      {viewMode === 'kanban' ? (
        /* Trello Kanban Board Mode */
        <div className="kanban-board">
          {kanbanColumns.map(col => (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">
                <span className="kanban-column-title" style={{ color: col.color }}>
                  {col.icon}
                  <span>{col.title}</span>
                </span>
                <span className="mono-pill" style={{ fontSize: '0.675rem', fontWeight: 700 }}>
                  {col.items.length}
                </span>
              </div>

              <div className="kanban-cards-container">
                {col.items.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.775rem' }}>
                    No updates in this column.
                  </div>
                ) : (
                  col.items.map(update => {
                    const match = matchResults[update.id];
                    const decision = plannerDecisions[update.id];
                    const discColor = getDisciplineColor(update.discipline);
                    const linkedId = decision?.linkedActivityId || (match?.category === 'ready' ? match.candidateActivityId : null);

                    return (
                      <div
                        key={update.id}
                        className="kanban-card"
                        onClick={() => setSelectedInspectorUpdateId(update.id)}
                      >
                        {/* Tags & Badges */}
                        <div className="kanban-card-labels">
                          <span
                            className="trello-tag"
                            style={{
                              background: discColor.bg,
                              color: discColor.text,
                              border: `1px solid ${discColor.border}`,
                            }}
                          >
                            {update.discipline}
                          </span>
                          <span className="mono-pill" style={{ fontSize: '0.65rem' }}>
                            {update.id}
                          </span>
                          {match && (
                            <span
                              className={`status-badge ${
                                match.confidenceScore >= 75 ? 'ready' : match.confidenceScore >= 50 ? 'review' : 'unplanned'
                              }`}
                              style={{ marginLeft: 'auto', fontSize: '0.65rem' }}
                            >
                              {match.confidenceScore}%
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                          {update.extractedDescription}
                        </div>

                        {/* Metadata row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          <span>{update.area || 'General Area'}</span>
                          <span>{update.reportDate}</span>
                        </div>

                        {/* Linked Target Activity */}
                        {linkedId && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--brand-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>&rarr;</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{linkedId}</span>
                          </div>
                        )}

                        {/* Quick Action Footer on Card */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-subtle)' }}>
                            {update.sourceFile}
                          </span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {col.id === 'review' ? (
                              <button
                                className="btn btn-warning btn-sm"
                                style={{ padding: '2px 6px', fontSize: '0.675rem' }}
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedReviewUpdateId(update.id);
                                  setActiveTab('planner-review');
                                }}
                                title="Review & link in Planner Review"
                                type="button"
                              >
                                <span>Review</span>
                                <ChevronRight size={10} />
                              </button>
                            ) : (
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 6px', fontSize: '0.675rem' }}
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedInspectorUpdateId(update.id);
                                }}
                                title="Inspect details"
                                type="button"
                              >
                                <span>Inspect</span>
                              </button>
                            )}
                          </div>
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
                  <th>Source & Line</th>
                  <th>Discipline</th>
                  <th>Extracted Work Description</th>
                  <th>Area</th>
                  <th>Event Status</th>
                  <th>Matched L5/L6 Activity</th>
                  <th>Confidence</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUpdates.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state">
                        <FileText size={32} />
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>No site updates match your filter</div>
                        <div style={{ fontSize: '0.8rem' }}>Try clearing the search keyword or changing discipline/status filters.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUpdates.map(update => {
                    const match = matchResults[update.id];
                    const decision = plannerDecisions[update.id];
                    const linkedId = decision?.linkedActivityId || (match?.category === 'ready' ? match.candidateActivityId : null);
                    const isUnplanned = decision?.status === 'unplanned' || match?.category === 'unplanned';
                    const isReview = !decision && match?.category === 'review';

                    return (
                      <tr
                        key={update.id}
                        onClick={() => setSelectedInspectorUpdateId(update.id)}
                        title="Click row to open details in Inspector Drawer"
                      >
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                          {update.id}
                        </td>
                        <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {update.reportDate}
                        </td>
                        <td style={{ fontSize: '0.775rem', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{update.sourceFile}</span>
                          {update.lineEvidence && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontFamily: 'var(--font-mono)' }}>
                              #{update.lineEvidence}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="mono-pill">{update.discipline}</span>
                        </td>
                        <td style={{ maxWidth: 280 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.825rem' }}>
                            {update.extractedDescription}
                          </div>
                          {update.supervisor && (
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              Supv: {update.supervisor}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                          {update.area || '—'}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              update.eventStatus === 'Completed' ? 'ready' : update.eventStatus === 'In Progress' ? 'review' : 'rejected'
                            }`}
                          >
                            {update.eventStatus}
                          </span>
                        </td>
                        <td>
                          {linkedId ? (
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--status-ready-fg)' }}>
                              {linkedId}
                            </span>
                          ) : isUnplanned ? (
                            <span className="status-badge unplanned">
                              Unplanned
                            </span>
                          ) : (
                            <span className="status-badge review">
                              Needs Review
                            </span>
                          )}
                        </td>
                        <td>
                          {match ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div className="progress-bar-container" style={{ width: 44, height: 5 }}>
                                <div
                                  className={`progress-bar-fill ${
                                    match.confidenceScore >= 75 ? 'green' : match.confidenceScore >= 50 ? 'amber' : 'red'
                                  }`}
                                  style={{ width: `${match.confidenceScore}%` }}
                                />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {match.confidenceScore}%
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {isReview ? (
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedReviewUpdateId(update.id);
                                  setActiveTab('planner-review');
                                }}
                                title="Review & link in Planner Review"
                                type="button"
                              >
                                <span>Review</span>
                                <ChevronRight size={11} />
                              </button>
                            ) : (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedInspectorUpdateId(update.id);
                                }}
                                title="Inspect details & edit parameters"
                                type="button"
                              >
                                <span>Inspect</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
