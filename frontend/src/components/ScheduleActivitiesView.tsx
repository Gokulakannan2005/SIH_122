import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Search,
  CalendarCheck,
  Filter,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

export const ScheduleActivitiesView: React.FC = () => {
  const {
    enrichedSchedule,
    siteUpdates,
    plannerDecisions,
    matchResults,
    setSelectedScheduleActivityId,
  } = useProject();

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarCheck size={20} style={{ color: 'var(--brand-primary)' }} />
            L5 / L6 Master Schedule Activities
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Master schedule baseline deliverables, aliases, planned vs. actual completion dates, and variance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="mono-pill" style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>
            Showing <strong>{filteredActivities.length}</strong> of <strong>{enrichedSchedule.length}</strong> Activities
          </span>
        </div>
      </div>

      {/* Filter and Working Search Toolbar */}
      <div className="toolbar-card">
        {/* Working Search Bar */}
        <div className="search-input-box" style={{ maxWidth: 360 }}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%' }}
            placeholder="Search activity ID, WBS, name, alias..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Discipline Filter */}
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

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status:</span>
          <select
            className="form-select"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Delayed">Delayed</option>
            <option value="Not Started">Not Started</option>
          </select>
        </div>

        {/* Area Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Area:</span>
          <select
            className="form-select"
            value={selectedArea}
            onChange={e => setSelectedArea(e.target.value)}
          >
            <option value="ALL">All Areas</option>
            {uniqueAreas.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
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

      {/* Full Schedule Table */}
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
                      {/* Activity ID */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)', whiteSpace: 'nowrap' }}>
                        {act.activityId}
                      </td>

                      {/* WBS */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {act.wbs}
                      </td>

                      {/* Activity Name & Aliases */}
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

                      {/* Discipline */}
                      <td>
                        <span className="mono-pill">{act.discipline}</span>
                      </td>

                      {/* Area */}
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                        {act.area}
                      </td>

                      {/* Planned Window */}
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {act.plannedStart} &rarr; {act.plannedFinish}
                      </td>

                      {/* Actual Evidence */}
                      <td style={{ fontSize: '0.775rem', whiteSpace: 'nowrap' }}>
                        {act.actualStart ? (
                          <span style={{ color: act.actualFinish ? 'var(--status-ready-fg)' : 'var(--brand-primary)', fontWeight: 600 }}>
                            {act.actualStart} &rarr; {act.actualFinish || 'Active'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>No site activity</span>
                        )}
                      </td>

                      {/* Variance Days */}
                      <td>
                        {act.actualFinish || act.status === 'Delayed' ? (
                          <span className={`variance-badge ${isDelayed ? 'delayed' : 'on-track'}`}>
                            {variance > 0 ? `+${variance}d` : `${variance}d`}
                          </span>
                        ) : (
                          <span className="variance-badge neutral">0d</span>
                        )}
                      </td>

                      {/* Status */}
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

                      {/* Linked Evidence Count */}
                      <td>
                        {linkedCount > 0 ? (
                          <span
                            className="mono-pill"
                            style={{
                              background: 'var(--brand-surface)',
                              color: 'var(--brand-primary)',
                              borderColor: 'var(--border-default)',
                              fontWeight: 700,
                            }}
                          >
                            {linkedCount} {linkedCount === 1 ? 'update' : 'updates'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>0 updates</span>
                        )}
                      </td>

                      {/* Action */}
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
    </div>
  );
};
