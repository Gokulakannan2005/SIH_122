import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Search,
  FileText,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

export const SiteUpdatesView: React.FC = () => {
  const {
    siteUpdates,
    matchResults,
    plannerDecisions,
    setSelectedInspectorUpdateId,
    setSelectedReviewUpdateId,
    setActiveTab,
  } = useProject();

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} style={{ color: 'var(--brand-primary)' }} />
            Site Progress Updates & Extracted Items
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Daily supervisor reports and discipline tracking entries parsed for L5/L6 schedule alignment.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="mono-pill" style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>
            Showing <strong>{filteredUpdates.length}</strong> of <strong>{siteUpdates.length}</strong> Updates
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar-card">
        {/* Live Search Input */}
        <div className="search-input-box" style={{ maxWidth: 360 }}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%' }}
            placeholder="Search ID, keyword, area, supervisor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Discipline Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discipline:</span>
          <select
            className="form-select"
            value={selectedDiscipline}
            onChange={e => setSelectedDiscipline(e.target.value)}
          >
            <option value="ALL">All Disciplines</option>
            {uniqueDisciplines.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status:</span>
          <select
            className="form-select"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="approved">Linked / Approved</option>
            <option value="review">Review Needed</option>
            <option value="unplanned">Unplanned Work</option>
          </select>
        </div>

        {/* Source File Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Source:</span>
          <select
            className="form-select"
            value={selectedSource}
            onChange={e => setSelectedSource(e.target.value)}
          >
            <option value="ALL">All Source Files</option>
            {uniqueSources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sort:</span>
          <select
            className="form-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="confidence-desc">Confidence (Highest First)</option>
            <option value="confidence-asc">Confidence (Lowest First)</option>
          </select>
        </div>

        {/* Clear Filters Button */}
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

      {/* Updates Data Table */}
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
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleResetFilters}
                        style={{ marginTop: '0.5rem' }}
                        type="button"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUpdates.map(update => {
                  const match = matchResults[update.id];
                  const decision = plannerDecisions[update.id];

                  // Resolve final activity id & label
                  const linkedId = decision?.linkedActivityId || (match?.category === 'ready' ? match.candidateActivityId : null);
                  const isUnplanned = decision?.status === 'unplanned' || match?.category === 'unplanned';
                  const isReview = !decision && match?.category === 'review';

                  return (
                    <tr
                      key={update.id}
                      onClick={() => setSelectedInspectorUpdateId(update.id)}
                      title="Click row to open details in Inspector Drawer"
                    >
                      {/* Update ID */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                        {update.id}
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {update.reportDate}
                      </td>

                      {/* Source & Line */}
                      <td style={{ fontSize: '0.775rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{update.sourceFile}</span>
                        {update.lineEvidence && (
                          <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontFamily: 'var(--font-mono)' }}>
                            #{update.lineEvidence}
                          </span>
                        )}
                      </td>

                      {/* Discipline */}
                      <td>
                        <span className="mono-pill">{update.discipline}</span>
                      </td>

                      {/* Extracted Work Description */}
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

                      {/* Area */}
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                        {update.area || '—'}
                      </td>

                      {/* Event Status */}
                      <td>
                        <span
                          className={`status-badge ${
                            update.eventStatus === 'Completed' ? 'ready' : update.eventStatus === 'In Progress' ? 'review' : 'rejected'
                          }`}
                        >
                          {update.eventStatus}
                        </span>
                      </td>

                      {/* Matched L5/L6 Activity */}
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

                      {/* Confidence Score */}
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

                      {/* Action Button */}
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
    </div>
  );
};
