import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Search,
  CalendarCheck,
  ChevronRight,
  RotateCcw,
  LayoutGrid,
  List,
  Layers,
  Calendar,
  Clock
} from 'lucide-react';

export const ScheduleActivitiesView: React.FC = () => {
  const {
    enrichedSchedule,
    siteUpdates,
    plannerDecisions,
    matchResults,
    setSelectedScheduleActivityId,
  } = useProject();

  // View Mode: 'table' vs 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [sortBy, setSortBy] = useState<'wbs' | 'id' | 'planned-finish' | 'variance'>('wbs');

  // Unique lists for filter dropdowns
  const uniqueDisciplines = useMemo(() => {
    const set = new Set<string>();
    enrichedSchedule.forEach(a => a.discipline && set.add(a.discipline));
    return Array.from(set).sort();
  }, [enrichedSchedule]);

  const uniqueAreas = useMemo(() => {
    const set = new Set<string>();
    enrichedSchedule.forEach(a => a.area && set.add(a.area));
    return Array.from(set).sort();
  }, [enrichedSchedule]);

  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedDiscipline !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedArea !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDiscipline('ALL');
    setSelectedStatus('ALL');
    setSelectedArea('ALL');
    setSortBy('wbs');
  };

  // Filtered and sorted activities
  const filteredActivities = useMemo(() => {
    return enrichedSchedule
      .filter(act => {
        // Search query across all relevant fields
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesQuery =
            act.activityId.toLowerCase().includes(q) ||
            act.wbs.toLowerCase().includes(q) ||
            act.activityName.toLowerCase().includes(q) ||
            act.discipline.toLowerCase().includes(q) ||
            act.area.toLowerCase().includes(q) ||
            act.aliases.some(alias => alias.toLowerCase().includes(q)) ||
            (act.rawAliases && act.rawAliases.toLowerCase().includes(q));

          if (!matchesQuery) return false;
        }

        // Discipline filter
        if (selectedDiscipline !== 'ALL' && act.discipline !== selectedDiscipline) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL' && act.status !== selectedStatus) {
          return false;
        }

        // Area filter
        if (selectedArea !== 'ALL' && act.area !== selectedArea) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'id') {
          return a.activityId.localeCompare(b.activityId);
        }
        if (sortBy === 'planned-finish') {
          return a.plannedFinish.localeCompare(b.plannedFinish);
        }
        if (sortBy === 'variance') {
          return (b.varianceDays || 0) - (a.varianceDays || 0);
        }
        // WBS default
        return a.wbs.localeCompare(b.wbs);
      });
  }, [enrichedSchedule, searchQuery, selectedDiscipline, selectedStatus, selectedArea, sortBy]);

  // Helper to count linked updates for an activity
  const getLinkedUpdatesCount = (activityId: string) => {
    return siteUpdates.filter(u => {
      const dec = plannerDecisions[u.id];
      if (dec && dec.linkedActivityId) {
        return dec.linkedActivityId === activityId && dec.status !== 'rejected';
      }
      const match = matchResults[u.id];
      return match?.category === 'ready' && match.candidateActivityId === activityId;
    }).length;
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <CalendarCheck size={20} style={{ color: 'var(--brand-primary)' }} />
            Master Schedule Activities
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Baseline L5/L6 deliverables, progress tracking, planned vs. actual windows, and delay variance.
          </p>
        </div>

        {/* View Mode Toggle (Cards vs Table) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              type="button"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              type="button"
            >
              <List size={13} />
              <span>Table</span>
            </button>
          </div>

          <span className="mono-pill" style={{ fontSize: '0.725rem', padding: '0.3rem 0.6rem' }}>
            <strong>{filteredActivities.length}</strong> of <strong>{enrichedSchedule.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Working Search Toolbar */}
      <div className="toolbar-card">
        {/* Working Search Bar */}
        <div className="search-input-box" style={{ maxWidth: 300 }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%' }}
            placeholder="Search activity ID, WBS, name, alias..."
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
            className={`filter-pill ${selectedStatus === 'Delayed' ? 'active' : ''}`}
            onClick={() => setSelectedStatus(selectedStatus === 'Delayed' ? 'ALL' : 'Delayed')}
            type="button"
          >
            Delayed
          </button>
          <button
            className={`filter-pill ${selectedStatus === 'In Progress' ? 'active' : ''}`}
            onClick={() => setSelectedStatus(selectedStatus === 'In Progress' ? 'ALL' : 'In Progress')}
            type="button"
          >
            In Progress
          </button>
          <button
            className={`filter-pill ${selectedStatus === 'Completed' ? 'active' : ''}`}
            onClick={() => setSelectedStatus(selectedStatus === 'Completed' ? 'ALL' : 'Completed')}
            type="button"
          >
            Completed
          </button>
        </div>

        {/* Sort Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sort:</span>
          <select
            className="form-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="wbs">WBS Hierarchy</option>
            <option value="id">Activity ID</option>
            <option value="planned-finish">Planned Finish Date</option>
            <option value="variance">Delay Variance (Highest)</option>
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

      {/* Main Content: Card Grid Mode vs Table View Mode */}
      {viewMode === 'cards' ? (
        /* Card Grid View (Trello/Linear Project Cards) */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '0.85rem' }}>
          {filteredActivities.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <CalendarCheck size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>No schedule activities match your filter</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Try clearing the search query or adjusting filters.</div>
            </div>
          ) : (
            filteredActivities.map(act => {
              const linkedCount = getLinkedUpdatesCount(act.activityId);
              const variance = act.varianceDays || 0;
              const isDelayed = variance > 0 || act.status === 'Delayed';
              const discColor = getDisciplineColor(act.discipline);

              return (
                <div
                  key={act.activityId}
                  className="card card-interactive"
                  style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', cursor: 'pointer' }}
                  onClick={() => setSelectedScheduleActivityId(act.activityId)}
                >
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span
                        className="trello-tag"
                        style={{
                          background: discColor.bg,
                          color: discColor.text,
                          border: `1px solid ${discColor.border}`,
                        }}
                      >
                        {act.discipline}
                      </span>
                      <span className="mono-pill" style={{ fontSize: '0.65rem' }}>
                        WBS {act.wbs}
                      </span>
                    </div>

                    <span
                      className={`status-badge ${
                        act.status === 'Completed'
                          ? 'ready'
                          : act.status === 'In Progress'
                          ? 'review'
                          : act.status === 'Delayed'
                          ? 'unplanned'
                          : 'rejected'
                      }`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {act.status}
                    </span>
                  </div>

                  {/* Title & ID */}
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.8rem', color: 'var(--brand-primary)' }}>
                      {act.activityId}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 2, lineHeight: 1.3 }}>
                      {act.activityName}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-bar-container" style={{ height: 4 }}>
                    <div
                      className={`progress-bar-fill ${
                        act.status === 'Completed' ? 'green' : act.status === 'In Progress' ? 'blue' : 'red'
                      }`}
                      style={{ width: `${act.progressPercent || 0}%` }}
                    />
                  </div>

                  {/* Metadata: Dates & Variance */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                    <span>Area: {act.area}</span>
                    <span className={`variance-badge ${isDelayed ? 'delayed' : 'on-track'}`}>
                      {variance > 0 ? `+${variance}d delay` : '0d on-track'}
                    </span>
                  </div>

                  {/* Planned Window Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>{act.plannedStart} &rarr; {act.plannedFinish}</span>
                    <span style={{ fontWeight: 600, color: linkedCount > 0 ? 'var(--brand-primary)' : 'var(--text-subtle)' }}>
                      {linkedCount} {linkedCount === 1 ? 'update' : 'updates'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Full Schedule Table View */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="industrial-table">
              <thead>
                <tr>
                  <th>Activity ID</th>
                  <th>WBS</th>
                  <th>Activity Name & Aliases</th>
                  <th>Discipline</th>
                  <th>Area</th>
                  <th>Planned Window</th>
                  <th>Actual Evidence</th>
                  <th>Variance</th>
                  <th>Status</th>
                  <th>Linked Evidence</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="empty-state">
                        <CalendarCheck size={32} />
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>No schedule activities match your filter</div>
                        <div style={{ fontSize: '0.8rem' }}>Try clearing the search query or adjusting discipline/area filters.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map(act => {
                    const linkedCount = getLinkedUpdatesCount(act.activityId);
                    const variance = act.varianceDays || 0;
                    const isDelayed = variance > 0 || act.status === 'Delayed';

                    return (
                      <tr
                        key={act.activityId}
                        onClick={() => setSelectedScheduleActivityId(act.activityId)}
                        title="Click to view activity details & linked site updates"
                      >
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)', whiteSpace: 'nowrap' }}>
                          {act.activityId}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {act.wbs}
                        </td>
                        <td style={{ maxWidth: 280 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.825rem' }}>
                            {act.activityName}
                          </div>
                          {act.aliases && act.aliases.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                              {act.aliases.slice(0, 3).map((alias, i) => (
                                <span key={i} className="mono-pill" style={{ fontSize: '0.675rem' }}>
                                  {alias}
                                </span>
                              ))}
                              {act.aliases.length > 3 && (
                                <span style={{ fontSize: '0.675rem', color: 'var(--text-subtle)' }}>
                                  +{act.aliases.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="mono-pill">{act.discipline}</span>
                        </td>
                        <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                          {act.area}
                        </td>
                        <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {act.plannedStart} &rarr; {act.plannedFinish}
                        </td>
                        <td style={{ fontSize: '0.775rem', whiteSpace: 'nowrap' }}>
                          {act.actualStart ? (
                            <span style={{ color: act.actualFinish ? 'var(--status-ready-fg)' : 'var(--brand-primary)', fontWeight: 600 }}>
                              {act.actualStart} &rarr; {act.actualFinish || 'Active'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-subtle)' }}>No site activity</span>
                          )}
                        </td>
                        <td>
                          {act.actualFinish || act.status === 'Delayed' ? (
                            <span className={`variance-badge ${isDelayed ? 'delayed' : 'on-track'}`}>
                              {variance > 0 ? `+${variance}d` : `${variance}d`}
                            </span>
                          ) : (
                            <span className="variance-badge neutral">0d</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              act.status === 'Completed'
                                ? 'ready'
                                : act.status === 'In Progress'
                                ? 'review'
                                : act.status === 'Delayed'
                                ? 'unplanned'
                                : 'rejected'
                            }`}
                          >
                            {act.status}
                          </span>
                        </td>
                        <td>
                          {linkedCount > 0 ? (
                            <span
                              className="mono-pill"
                              style={{
                                background: 'var(--brand-surface)',
                                color: 'var(--brand-primary)',
                                borderColor: '#cce0ff',
                                fontWeight: 700,
                              }}
                            >
                              {linkedCount} {linkedCount === 1 ? 'update' : 'updates'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>0 updates</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedScheduleActivityId(act.activityId);
                            }}
                            title="Open Activity Details Drawer"
                            type="button"
                          >
                            <span>Details</span>
                            <ChevronRight size={11} />
                          </button>
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
