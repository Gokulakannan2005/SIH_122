import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { useLiveISTClock } from '../utils/istTimeService';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Filter,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { ScheduleActivity } from '../types';

export const ProjectCalendarView: React.FC = () => {
  const {
    enrichedSchedule,
    siteUpdates,
    plannerDecisions,
    matchResults,
    setSelectedScheduleActivityId,
    setActiveTab,
    currentProject,
  } = useProject();

  const istClock = useLiveISTClock();

  // Target view month: Default to current IST date
  const [currentYear, setCurrentYear] = useState<number>(() => istClock.currentISTDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => istClock.currentISTDate.getMonth());
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [selectedActivity, setSelectedActivity] = useState<ScheduleActivity | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Unique disciplines for filter pills
  const disciplines = useMemo(() => {
    const set = new Set<string>();
    enrichedSchedule.forEach(a => a.discipline && set.add(a.discipline));
    return Array.from(set).sort();
  }, [enrichedSchedule]);

  // Calendar Day Generation for the month
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: {
      dayNumber: number;
      dateStr: string; // YYYY-MM-DD
      isCurrentMonth: boolean;
      isToday: boolean;
      tasks: ScheduleActivity[];
    }[] = [];

    // Helper to format YYYY-MM-DD
    const formatDate = (y: number, m: number, d: number) => {
      const mm = String(m + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    };

    // Days from previous month to fill first row
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        dayNumber: d,
        dateStr: formatDate(prevY, prevM, d),
        isCurrentMonth: false,
        isToday: false,
        tasks: [],
      });
    }

    // Days in current month
    const todayStr = istClock.dateIsoString;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(currentYear, currentMonth, d);
      const isToday = dateStr === todayStr;

      // Match tasks spanning this date: plannedStart <= dateStr <= plannedFinish
      const matchingTasks = enrichedSchedule.filter(act => {
        if (selectedDiscipline !== 'ALL' && act.discipline !== selectedDiscipline) {
          return false;
        }
        if (!act.plannedStart || !act.plannedFinish) return false;
        return dateStr >= act.plannedStart && dateStr <= act.plannedFinish;
      });

      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday,
        tasks: matchingTasks,
      });
    }

    // Days from next month to complete the 6-row grid (42 cells total)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({
        dayNumber: d,
        dateStr: formatDate(nextY, nextM, d),
        isCurrentMonth: false,
        isToday: false,
        tasks: [],
      });
    }

    return days;
  }, [currentYear, currentMonth, enrichedSchedule, selectedDiscipline, istClock.dateIsoString]);

  // Discipline badge color
  const getDisciplineColor = (disc: string) => {
    switch (disc) {
      case 'Civil':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Piping':
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'Electrical':
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      case 'Instrumentation':
        return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' };
      case 'HSE':
        return { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' };
      default:
        return { bg: 'var(--bg-surface-secondary)', text: 'var(--text-secondary)', border: 'var(--border-subtle)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* 0. Live Clock & Dynamic Project Day Counter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to right, rgba(14, 165, 233, 0.12), rgba(16, 185, 129, 0.08))',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 12,
          padding: '0.85rem 1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.25)', padding: '0.35rem 0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            <Clock size={16} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono, monospace)' }}>
              {istClock.time || '10:00:00 AM IST'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(14, 165, 233, 0.2)', padding: '2px 8px', borderRadius: 4 }}>
              DAY COUNTER:
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
              Day 22 of 90 • 24.4% Time Elapsed
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
              (Baseline Window: Sep 01 - Nov 30, 2026)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>
            Schedule Tasks Mapped:
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399' }}>
            {enrichedSchedule.length} Activities
          </span>
        </div>
      </div>

      {/* Empty State Banner if no schedule is uploaded */}
      {enrichedSchedule.length === 0 && (
        <div
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-default)',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}
        >
          <CalendarIcon size={40} style={{ color: '#38bdf8', opacity: 0.8 }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              No Baseline Schedule Uploaded Yet
            </h3>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 460 }}>
              Upload your Primavera P6 or MS Project schedule in the Ingestion Suite to automatically populate this calendar with planned activity dates and disciplines.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveTab('upload')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
          >
            <span>Go to Ingestion Suite</span>
            <ExternalLink size={15} />
          </button>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <div
        className="card"
        style={{
          padding: '1.15rem 1.4rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-surface)',
          borderBottom: '2px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span className="brand-badge" style={{ fontSize: '0.675rem' }}>
              SCHEDULE EXECUTION CALENDAR
            </span>
            <span className="mono-pill" style={{ fontSize: '0.7rem' }}>
              {currentProject?.name || 'Active Project'} • P6 Planned Windows
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Planned Task Windows & Milestones
          </h2>
        </div>

        {/* Month Navigation & Today Jump */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)', padding: '2px 4px', border: '1px solid var(--border-default)' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handlePrevMonth}
              style={{ padding: '0.3rem 0.5rem' }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: 140, textAlign: 'center' }}>
              {monthName}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleNextMonth}
              style={{ padding: '0.3rem 0.5rem' }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setCurrentYear(2026);
              setCurrentMonth(8);
            }}
            style={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            Today (IST)
          </button>
        </div>
      </div>

      {/* 2. Filter Bar & Status Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'var(--bg-surface)',
          padding: '0.65rem 1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Discipline Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Discipline:
          </span>
          <button
            type="button"
            className={`mono-pill ${selectedDiscipline === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedDiscipline('ALL')}
            style={{
              cursor: 'pointer',
              background: selectedDiscipline === 'ALL' ? 'var(--brand-primary)' : 'var(--bg-surface-secondary)',
              color: selectedDiscipline === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
            }}
          >
            All Disciplines
          </button>
          {disciplines.map(d => {
            const active = selectedDiscipline === d;
            const colors = getDisciplineColor(d);
            return (
              <button
                key={d}
                type="button"
                className="mono-pill"
                onClick={() => setSelectedDiscipline(d)}
                style={{
                  cursor: 'pointer',
                  background: active ? colors.text : colors.bg,
                  color: active ? '#ffffff' : colors.text,
                  border: `1px solid ${colors.border}`,
                  fontWeight: 700,
                }}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.725rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#059669', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>Completed (100%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--brand-primary)', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>In Progress</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#e11d48', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>Delayed Task</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-muted)' }}>Today's Date</span>
          </div>
        </div>
      </div>

      {/* 3. Main Monthly Calendar Grid */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Day of Week Headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            background: 'var(--bg-surface-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            padding: '0.65rem 0',
          }}
        >
          <div>SUN</div>
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div>SAT</div>
        </div>

        {/* 42-Cell Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridAutoRows: 'minmax(110px, auto)',
            borderCollapse: 'collapse',
          }}
        >
          {calendarDays.map((day, idx) => {
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;

            return (
              <div
                key={idx}
                style={{
                  padding: '6px',
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: day.isToday
                    ? 'rgba(245, 158, 11, 0.07)'
                    : day.isCurrentMonth
                    ? isWeekend
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'var(--bg-surface)'
                    : 'var(--bg-surface-secondary)',
                  opacity: day.isCurrentMonth ? 1 : 0.45,
                  minHeight: 110,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  position: 'relative',
                }}
              >
                {/* Day Number Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.775rem',
                      fontWeight: day.isToday ? 800 : 600,
                      color: day.isToday ? '#b45309' : 'var(--text-primary)',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: day.isToday ? '#fef3c7' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {day.dayNumber}
                  </span>

                  {day.isToday && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        color: '#b45309',
                        background: '#fef3c7',
                        padding: '1px 5px',
                        borderRadius: 3,
                        textTransform: 'uppercase',
                      }}
                    >
                      Today IST
                    </span>
                  )}
                </div>

                {/* Task Bars in Day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', maxHeight: 85 }}>
                  {day.tasks.slice(0, 3).map(task => {
                    const isComplete = task.status === 'Completed' || (task.progressPercent || 0) >= 100;
                    const isDelayed = (task.varianceDays || 0) > 0 || task.status === 'Delayed';
                    const colors = getDisciplineColor(task.discipline);

                    return (
                      <div
                        key={task.activityId}
                        onClick={() => setSelectedActivity(task)}
                        style={{
                          fontSize: '0.675rem',
                          padding: '2px 5px',
                          borderRadius: 3,
                          cursor: 'pointer',
                          background: isComplete
                            ? 'rgba(5, 150, 105, 0.15)'
                            : isDelayed
                            ? 'rgba(225, 29, 72, 0.15)'
                            : colors.bg,
                          borderLeft: `3px solid ${
                            isComplete ? '#059669' : isDelayed ? '#e11d48' : colors.text
                          }`,
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 4,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={`${task.activityId}: ${task.activityName} (${task.progressPercent || 0}%)`}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.65rem' }}>
                          {task.activityId}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.625rem', opacity: 0.85 }}>
                          {task.progressPercent || 0}%
                        </span>
                      </div>
                    );
                  })}

                  {day.tasks.length > 3 && (
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 700, paddingLeft: 2 }}>
                      +{day.tasks.length - 3} more tasks
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Selected Activity Detail Drawer / Card */}
      {selectedActivity && (
        <div
          className="card"
          style={{
            padding: '1.15rem 1.4rem',
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--brand-primary)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="mono-pill" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                  {selectedActivity.activityId}
                </span>
                <span className="badge badge-ready" style={{ fontSize: '0.65rem' }}>
                  WBS {selectedActivity.wbs}
                </span>
                <span className="badge badge-review" style={{ fontSize: '0.65rem' }}>
                  {selectedActivity.discipline}
                </span>
                <span className="badge" style={{ fontSize: '0.65rem' }}>
                  Area: {selectedActivity.area}
                </span>
              </div>

              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedActivity.activityName}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Planned Window: <strong>{selectedActivity.plannedStart}</strong> &rarr; <strong>{selectedActivity.plannedFinish}</strong> ({selectedActivity.plannedDurationDays} days) • Progress: <strong>{selectedActivity.progressPercent || 0}%</strong>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setSelectedScheduleActivityId(selectedActivity.activityId);
                  setActiveTab('schedule-activities');
                }}
                style={{ fontSize: '0.75rem', gap: 5 }}
              >
                <ExternalLink size={13} />
                <span>Open in WBS Schedule</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedActivity(null)}
                style={{ fontSize: '0.75rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
