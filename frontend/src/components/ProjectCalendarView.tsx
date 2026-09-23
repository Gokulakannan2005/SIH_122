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
  List,
  Grid,
  Check,
  Flag,
  ArrowRight,
  HardHat,
  FileText,
  MapPin,
  CalendarCheck,
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

  // Target view month: Default to September 2026 (Data Date window) or current IST
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // September (0-indexed)
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [selectedActivity, setSelectedActivity] = useState<ScheduleActivity | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'agenda'>('matrix');
  const [statusFilter, setStatusFilter] = useState<'all' | 'milestones' | 'in_progress' | 'delayed'>('all');
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>('2026-09-22');

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
      isDataDate: boolean;
      activeTasks: ScheduleActivity[];
      startingTasks: ScheduleActivity[];
      finishingTasks: ScheduleActivity[];
      delayedTasks: ScheduleActivity[];
      fieldLogsCount: number;
    }[] = [];

    // Helper to format YYYY-MM-DD
    const formatDate = (y: number, m: number, d: number) => {
      const mm = String(m + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    };

    const dataDateStr = '2026-09-22';
    const todayStr = istClock.dateIsoString;

    // Previous month padding
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = formatDate(prevY, prevM, d);
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        isDataDate: dateStr === dataDateStr,
        activeTasks: [],
        startingTasks: [],
        finishingTasks: [],
        delayedTasks: [],
        fieldLogsCount: 0,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(currentYear, currentMonth, d);
      const isToday = dateStr === todayStr;
      const isDataDate = dateStr === dataDateStr;

      // Filter tasks active on this day
      const activeTasks = enrichedSchedule.filter(act => {
        if (selectedDiscipline !== 'ALL' && act.discipline !== selectedDiscipline) return false;
        if (!act.plannedStart || !act.plannedFinish) return false;
        return dateStr >= act.plannedStart && dateStr <= act.plannedFinish;
      });

      // Starting tasks
      const startingTasks = activeTasks.filter(act => act.plannedStart === dateStr);

      // Finishing milestone tasks
      const finishingTasks = activeTasks.filter(act => act.plannedFinish === dateStr);

      // Delayed tasks
      const delayedTasks = activeTasks.filter(
        act => (act.varianceDays && act.varianceDays < -2) || act.delayRisk === 'High' || act.status === 'Delayed'
      );

      // Field logs on this day
      const fieldLogsCount = siteUpdates.filter(u => u.reportDate === dateStr).length;

      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday,
        isDataDate,
        activeTasks,
        startingTasks,
        finishingTasks,
        delayedTasks,
        fieldLogsCount,
      });
    }

    // Days from next month to complete 42 cells grid
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = formatDate(nextY, nextM, d);
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        isDataDate: dateStr === dataDateStr,
        activeTasks: [],
        startingTasks: [],
        finishingTasks: [],
        delayedTasks: [],
        fieldLogsCount: 0,
      });
    }

    return days;
  }, [currentYear, currentMonth, enrichedSchedule, siteUpdates, selectedDiscipline, istClock.dateIsoString]);

  // Selected Day Details for the Day Quick Inspector
  const selectedDayInfo = useMemo(() => {
    if (!selectedDayDate) return null;
    return calendarDays.find(d => d.dateStr === selectedDayDate) || null;
  }, [calendarDays, selectedDayDate]);

  // Discipline badge color
  const getDisciplineColor = (disc: string) => {
    switch (disc) {
      case 'Civil':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' };
      case 'Piping':
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981' };
      case 'Electrical':
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a', dot: '#f59e0b' };
      case 'Instrumentation':
        return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', dot: '#8b5cf6' };
      case 'HSE':
        return { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', dot: '#f43f5e' };
      default:
        return { bg: 'var(--bg-surface-secondary)', text: 'var(--text-secondary)', border: 'var(--border-subtle)', dot: '#64748b' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* 0. Live Clock & Project Calendar Header Ribbon */}
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
              DATA DATE:
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              September 22, 2026 (Live Progress Reconciled)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              &bull; {enrichedSchedule.length} Master Schedule Activities
            </span>
          </div>
        </div>

        {/* View Mode Toggle: Monthly Matrix vs Workfront Agenda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', padding: 3, borderRadius: 8, border: '1px solid var(--border-default)' }}>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'matrix' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('matrix')}
            style={{ fontSize: '0.75rem', padding: '4px 10px', gap: 5 }}
            title="Monthly Calendar Matrix"
          >
            <Grid size={14} />
            <span>Monthly Matrix</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'agenda' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('agenda')}
            style={{ fontSize: '0.75rem', padding: '4px 10px', gap: 5 }}
            title="Workfront Agenda & Timeline List"
          >
            <List size={14} />
            <span>Workfront Agenda</span>
          </button>
        </div>
      </div>

      {/* 1. Header Toolbar & Month Navigation */}
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
              {currentProject?.name || 'Active Project'} • P6 Planned Execution
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Planned Task Windows & Key Milestones
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Click any day box to inspect all scheduled activities, task start/finish milestones, and field evidence.
          </span>
        </div>

        {/* Month Navigation & Data Date Jump */}
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
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: 150, textAlign: 'center' }}>
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
              setSelectedDayDate('2026-09-22');
            }}
            style={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            Data Date (Sep 2026)
          </button>
        </div>
      </div>

      {/* 2. Filter Bar & Clear Visual Legend */}
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
        {/* Discipline Filters */}
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

        {/* Clear Visual Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.725rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: '0.85rem' }}>🚀</span>
            <span style={{ color: 'var(--text-secondary)' }}>Activity Start</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: '0.85rem' }}>🏁</span>
            <span style={{ color: 'var(--text-secondary)' }}>Milestone Finish</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ color: '#ef4444', fontWeight: 700 }}>Critical Delay</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-primary)' }} />
            <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>Data Date</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: MONTHLY MATRIX VIEW */}
      {viewMode === 'matrix' && (
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

          {/* 42-Cell Clean Monthly Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridAutoRows: 'minmax(115px, auto)',
              borderCollapse: 'collapse',
            }}
          >
            {calendarDays.map((day, idx) => {
              const isWeekend = idx % 7 === 0 || idx % 7 === 6;
              const isSelected = selectedDayDate === day.dateStr;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDayDate(day.dateStr);
                    if (day.activeTasks.length > 0) {
                      setSelectedActivity(day.activeTasks[0]);
                    }
                  }}
                  style={{
                    padding: '8px',
                    borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--border-subtle)',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isSelected
                      ? 'rgba(14, 165, 233, 0.12)'
                      : day.isDataDate
                      ? 'rgba(14, 165, 233, 0.06)'
                      : day.isCurrentMonth
                      ? isWeekend
                        ? 'rgba(255, 255, 255, 0.015)'
                        : 'var(--bg-surface)'
                      : 'var(--bg-surface-secondary)',
                    opacity: day.isCurrentMonth ? 1 : 0.4,
                    minHeight: 115,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    position: 'relative',
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'inset 0 0 0 2px var(--brand-primary)' : undefined,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Day Number Header & Data Date Tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: day.isDataDate ? 800 : day.isToday ? 800 : 600,
                        color: day.isDataDate ? '#ffffff' : day.isToday ? '#b45309' : 'var(--text-primary)',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: day.isDataDate ? 'var(--brand-primary)' : day.isToday ? '#fef3c7' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {day.dayNumber}
                    </span>

                    {day.isDataDate && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          background: 'var(--brand-primary)',
                          padding: '1px 5px',
                          borderRadius: 3,
                          textTransform: 'uppercase',
                        }}
                      >
                        DATA DATE
                      </span>
                    )}
                  </div>

                  {/* Clean Content Summary: Milestone Badges & Density Count */}
                  {day.isCurrentMonth && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                      {/* Milestone: Starting Activity */}
                      {day.startingTasks.slice(0, 1).map(act => (
                        <div
                          key={`start-${act.activityId}`}
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: 4,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={`Starts: ${act.activityId} ${act.activityName}`}
                        >
                          🚀 {act.activityId} Start
                        </div>
                      ))}

                      {/* Milestone: Finishing Activity */}
                      {day.finishingTasks.slice(0, 1).map(act => (
                        <div
                          key={`fin-${act.activityId}`}
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: 4,
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: '#8b5cf6',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={`Milestone Finish: ${act.activityId} ${act.activityName}`}
                        >
                          🏁 {act.activityId} Finish
                        </div>
                      ))}

                      {/* Delay Warning Flag if tasks are in critical float */}
                      {day.delayedTasks.length > 0 && (
                        <div
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: 3,
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f43f5e',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <AlertTriangle size={10} />
                          <span>{day.delayedTasks.length} Delayed</span>
                        </div>
                      )}

                      {/* Workload Indicator: Total Active Tasks & Discipline Dots */}
                      {day.activeTasks.length > 0 && (
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {day.activeTasks.length} {day.activeTasks.length === 1 ? 'task' : 'tasks'}
                          </span>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {Array.from(new Set(day.activeTasks.map(t => t.discipline))).slice(0, 3).map(disc => {
                              const c = getDisciplineColor(disc);
                              return (
                                <span
                                  key={disc}
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: c.dot,
                                    display: 'inline-block',
                                  }}
                                  title={disc}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: WORKFRONT AGENDA & TIMELINE VIEW */}
      {viewMode === 'agenda' && (
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Chronological Workfront Execution Schedule
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing {enrichedSchedule.filter(s => selectedDiscipline === 'ALL' || s.discipline === selectedDiscipline).length} activities
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {enrichedSchedule
              .filter(s => selectedDiscipline === 'ALL' || s.discipline === selectedDiscipline)
              .map(act => {
                const colors = getDisciplineColor(act.discipline);
                const isDelayed = (act.varianceDays && act.varianceDays < -2) || act.delayRisk === 'High' || act.status === 'Delayed';
                const isSelected = selectedActivity?.activityId === act.activityId;

                return (
                  <div
                    key={act.activityId}
                    onClick={() => setSelectedActivity(act)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 8,
                      background: isSelected ? 'var(--bg-surface-secondary)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      borderLeft: `4px solid ${isDelayed ? '#f43f5e' : colors.text}`,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="mono-pill" style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>
                          {act.activityId}
                        </span>
                        <span className="mono-pill" style={{ fontSize: '0.65rem' }}>
                          WBS {act.wbs}
                        </span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: colors.bg,
                            color: colors.text,
                          }}
                        >
                          {act.discipline}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {act.area}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {act.activityName}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Planned Window: <strong>{act.plannedStart}</strong> &rarr; <strong>{act.plannedFinish}</strong>
                      </div>
                    </div>

                    {/* Progress Bar & Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 140 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, marginBottom: 3 }}>
                          <span>Progress</span>
                          <span>{act.progressPercent || 0}%</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'var(--bg-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${act.progressPercent || 0}%`,
                              height: '100%',
                              background: (act.progressPercent || 0) >= 100 ? '#10b981' : isDelayed ? '#f43f5e' : 'var(--brand-primary)',
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: 90 }}>
                        <span
                          className={`status-pill ${
                            (act.progressPercent || 0) >= 100 ? 'status-ready' : isDelayed ? 'status-review' : 'status-ready'
                          }`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {act.status}
                        </span>
                        {isDelayed && (
                          <div style={{ fontSize: '0.65rem', color: '#f43f5e', fontWeight: 700, marginTop: 2 }}>
                            Variance: {act.varianceDays || -3}d
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE DAY QUICK-INSPECTOR PANEL */}
      {selectedDayInfo && (
        <div
          className="card"
          style={{
            padding: '1.25rem 1.4rem',
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--brand-primary)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarCheck size={18} style={{ color: 'var(--brand-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Workfront Schedule for {selectedDayInfo.dateStr}
              </h3>
              {selectedDayInfo.isDataDate && (
                <span className="mono-pill" style={{ background: 'var(--brand-primary)', color: '#ffffff', fontWeight: 800 }}>
                  CURRENT DATA DATE
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedDayDate(null)}
              style={{ fontSize: '0.75rem' }}
            >
              Close Day View
            </button>
          </div>

          {selectedDayInfo.activeTasks.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No master schedule activities active or scheduled on {selectedDayInfo.dateStr}.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {selectedDayInfo.activeTasks.map(task => {
                const colors = getDisciplineColor(task.discipline);
                const isStartingToday = task.plannedStart === selectedDayInfo.dateStr;
                const isFinishingToday = task.plannedFinish === selectedDayInfo.dateStr;

                return (
                  <div
                    key={task.activityId}
                    style={{
                      padding: '0.75rem',
                      background: 'var(--bg-surface-secondary)',
                      borderRadius: 6,
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="mono-pill" style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>
                        {task.activityId}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: colors.bg,
                          color: colors.text,
                        }}
                      >
                        {task.discipline}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {task.activityName}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Window: {task.plannedStart} &rarr; {task.plannedFinish}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {isStartingToday && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: 4 }}>
                          🚀 Starting Today
                        </span>
                      )}
                      {isFinishingToday && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.12)', padding: '2px 6px', borderRadius: 4 }}>
                          🏁 Finishing Today
                        </span>
                      )}
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        Progress: <strong>{task.progressPercent || 0}%</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Selected Activity Detail Drawer */}
      {selectedActivity && (
        <div
          className="card"
          style={{
            padding: '1.15rem 1.4rem',
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--brand-primary)',
            boxShadow: 'var(--shadow-md)',
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
                Planned Window: <strong>{selectedActivity.plannedStart}</strong> &rarr; <strong>{selectedActivity.plannedFinish}</strong> ({selectedActivity.plannedDurationDays || 14} days) • Progress: <strong>{selectedActivity.progressPercent || 0}%</strong>
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
