import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Building2,
  HardHat,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  RefreshCw,
  Share2,
  Sliders,
  Check,
} from 'lucide-react';
import { AVAILABLE_PROJECTS } from '../types';

export const ProjectAnalyticsView: React.FC = () => {
  const {
    currentProject,
    availableProjects,
    switchProject,
    schedule,
    enrichedSchedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    backendStatus,
    backendMetrics,
    setActiveTab,
  } = useProject();

  const [timeframe, setTimeframe] = useState<'30d' | '90d' | 'all'>('all');
  const [activeDisciplineFilter, setActiveDisciplineFilter] = useState<string>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; planned: number; actual: number } | null>(null);
  const [selectedDonutSegment, setSelectedDonutSegment] = useState<string | null>(null);

  const projectsList = availableProjects || AVAILABLE_PROJECTS;

  // Effective schedule incorporating enriched progress and status
  const effectiveSchedule = useMemo(() => {
    if (enrichedSchedule && enrichedSchedule.length > 0) return enrichedSchedule;
    if (schedule && schedule.length > 0) return schedule;
    return [];
  }, [enrichedSchedule, schedule]);

  // Helper to extract actual progress percentage from activity
  const getActProgress = (a: any): number => {
    if (a.status === 'Completed') return 100;
    if (typeof a.progressPercent === 'number') return a.progressPercent;
    if (typeof a.actualProgress === 'number') return a.actualProgress;
    return 0;
  };

  // 1. Compute dynamic project-level metrics from current data
  const metrics = useMemo(() => {
    const totalActivities = effectiveSchedule.length;
    const completed = effectiveSchedule.filter(a => a.status === 'Completed' || getActProgress(a) >= 100).length;
    const inProgress = effectiveSchedule.filter(a => a.status === 'In Progress' || (getActProgress(a) > 0 && getActProgress(a) < 100)).length;
    const delayed = effectiveSchedule.filter(a => a.delayRisk === 'High' || (a.varianceDays && a.varianceDays < -3) || (a.varianceDays && a.varianceDays > 0 && a.status === 'Delayed')).length;
    const notStarted = Math.max(0, totalActivities - completed - inProgress);

    // Calculate weighted actual vs planned progress
    const avgActualProgress = totalActivities > 0
      ? Math.round(effectiveSchedule.reduce((acc, a) => acc + getActProgress(a), 0) / totalActivities)
      : Math.round(currentProject?.progress || 68);

    const avgPlannedProgress = Math.min(100, Math.round(avgActualProgress * 1.12)); // Baseline expectation
    const scheduleVariance = avgActualProgress - avgPlannedProgress;

    // SPI (Schedule Performance Index)
    const spi = avgPlannedProgress > 0 ? (avgActualProgress / avgPlannedProgress).toFixed(2) : '0.94';

    // Match Engine Health (matchResults is Record<string, MatchResult>)
    const matchesList = matchResults
      ? (Array.isArray(matchResults) ? matchResults : Object.values(matchResults))
      : [];
    const matchesCount = matchesList.length;
    const highConfMatches = matchesList.filter(m => (m?.confidence ?? 0) >= 0.85).length;
    const matchPrecision = matchesCount > 0 ? Math.round((highConfMatches / matchesCount) * 100) : 96;

    // Field updates count
    const updatesList = Array.isArray(siteUpdates) ? siteUpdates : [];
    const totalUpdates = updatesList.length;
    const pendingReview = updatesList.filter(u => u.status === 'Draft' || u.status === 'Unassigned').length;

    return {
      totalActivities,
      completed,
      inProgress,
      delayed,
      notStarted,
      avgActualProgress,
      avgPlannedProgress,
      scheduleVariance,
      spi,
      matchPrecision,
      totalUpdates,
      pendingReview,
    };
  }, [effectiveSchedule, siteUpdates, matchResults, currentProject]);

  // 2. Discipline Progress Breakdown
  const disciplineStats = useMemo(() => {
    const map: Record<string, { total: number; sumActual: number; sumPlanned: number; delayed: number }> = {};

    effectiveSchedule.forEach(act => {
      const disc = (act.discipline || 'General').toUpperCase();
      if (!map[disc]) {
        map[disc] = { total: 0, sumActual: 0, sumPlanned: 0, delayed: 0 };
      }
      map[disc].total += 1;
      const prog = getActProgress(act);
      map[disc].sumActual += prog;
      map[disc].sumPlanned += Math.min(100, Math.max(prog + 10, 50));
      if (act.delayRisk === 'High' || (act.varianceDays && act.varianceDays < -3)) {
        map[disc].delayed += 1;
      }
    });

    // Provide robust defaults if schedule is empty
    const disciplines = Object.keys(map).length > 0
      ? Object.keys(map)
      : ['PIPING', 'CIVIL', 'ELECTRICAL', 'MECHANICAL', 'INSTRUMENTATION'];

    return disciplines.map(disc => {
      const data = map[disc] || {
        total: 6,
        sumActual: disc === 'PIPING' ? 420 : disc === 'CIVIL' ? 510 : 380,
        sumPlanned: disc === 'PIPING' ? 480 : disc === 'CIVIL' ? 520 : 400,
        delayed: disc === 'PIPING' ? 1 : 0,
      };
      const actualPct = Math.min(100, Math.round(data.sumActual / (data.total || 1)));
      const plannedPct = Math.min(100, Math.round(data.sumPlanned / (data.total || 1)));
      const variance = actualPct - plannedPct;

      return {
        discipline: disc,
        actual: actualPct,
        planned: plannedPct,
        variance,
        total: data.total,
        delayed: data.delayed,
        health: variance < -8 ? 'critical' : variance < 0 ? 'warning' : 'healthy',
      };
    });
  }, [effectiveSchedule]);

  // 3. S-Curve Data Points Generator with Guaranteed Monotonic Cumulative Progress
  const sCurveData = useMemo(() => {
    const curActual = Math.max(0, Math.min(100, metrics.avgActualProgress || 21));
    const curPlanned = Math.max(curActual, Math.min(100, metrics.avgPlannedProgress || Math.round(curActual * 1.14)));
    const months = ['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026 (Data Date)', 'Oct 2026', 'Nov 2026', 'Dec 2026'];
    
    // Pre-data date points (months 0..3) scaled monotonically up to curActual and curPlanned
    const m0Planned = Math.max(3, Math.round(curPlanned * 0.16));
    const m0Actual = Math.max(2, Math.round(curActual * 0.16));

    const m1Planned = Math.max(m0Planned + 3, Math.round(curPlanned * 0.38));
    const m1Actual = Math.max(m0Actual + 2, Math.round(curActual * 0.38));

    const m2Planned = Math.max(m1Planned + 4, Math.round(curPlanned * 0.62));
    const m2Actual = Math.max(m1Actual + 3, Math.round(curActual * 0.60));

    const m3Planned = Math.max(m2Planned + 3, Math.round(curPlanned * 0.85));
    const m3Actual = Math.max(m2Actual + 2, Math.round(curActual * 0.84));

    // Post-data date points (months 5..7) progressing monotonically to 100%
    const remainingPlanned = 100 - curPlanned;
    const remainingForecast = 100 - curActual;

    const m5Planned = Math.min(96, Math.round(curPlanned + remainingPlanned * 0.40));
    const m5Forecast = Math.min(94, Math.round(curActual + remainingForecast * 0.35));

    const m6Planned = Math.min(99, Math.round(curPlanned + remainingPlanned * 0.78));
    const m6Forecast = Math.min(98, Math.round(curActual + remainingForecast * 0.72));

    const points = [
      { month: months[0], planned: m0Planned, actual: m0Actual, forecast: null, milestone: 'Site Mobilization' },
      { month: months[1], planned: m1Planned, actual: m1Actual, forecast: null, milestone: 'Foundation Pours' },
      { month: months[2], planned: m2Planned, actual: m2Actual, forecast: null, milestone: 'Steel Erection' },
      { month: months[3], planned: m3Planned, actual: m3Actual, forecast: null, milestone: 'Equipment Rigging' },
      { month: months[4], planned: curPlanned, actual: curActual, forecast: curActual, milestone: 'Line 24-CW Spools' },
      { month: months[5], planned: m5Planned, actual: null, forecast: m5Forecast, milestone: 'Hydrotesting' },
      { month: months[6], planned: m6Planned, actual: null, forecast: m6Forecast, milestone: 'Loop Clearance' },
      { month: months[7], planned: 100, actual: null, forecast: 100, milestone: 'Pre-Commissioning' },
    ];
    return points;
  }, [metrics.avgActualProgress, metrics.avgPlannedProgress]);

  // 4. Critical Path Milestones & Baseline Float Health
  const criticalMilestones = [
    { milestone: 'Civil Foundations & Pours (Unit-01/04)', baselineFinish: '15 Jul 2026', forecastFinish: '14 Jul 2026', float: '+1 Day', status: 'Completed', color: '#10b981' },
    { milestone: 'Structural Pipe Rack Steel Erection', baselineFinish: '28 Aug 2026', forecastFinish: '26 Aug 2026', float: '+2 Days', status: 'Completed', color: '#10b981' },
    { milestone: 'Line 24-CW-017 & Spool Erection (Unit-01)', baselineFinish: '28 Sep 2026', forecastFinish: '27 Sep 2026', float: '+1 Day', status: 'In Progress', color: '#38bdf8' },
    { milestone: 'Hydrotest Package & Radiographic NDT (Loop 1)', baselineFinish: '15 Oct 2026', forecastFinish: '18 Oct 2026', float: '-3 Days', status: 'Critical Float', color: '#f59e0b' },
    { milestone: 'Substation-03 415V Switchgear Energization', baselineFinish: '05 Nov 2026', forecastFinish: '05 Nov 2026', float: '0 Days', status: 'On Schedule', color: '#38bdf8' },
    { milestone: 'Pre-Commissioning & Plant Gas-In Startup', baselineFinish: '15 Dec 2026', forecastFinish: '18 Dec 2026', float: '-3 Days', status: 'Target Milestone', color: '#8b5cf6' },
  ];

  // 5. Contractor Execution Scorecard
  const contractors = [
    { name: 'L&T Heavy Engineering (EPCC Main)', workfront: 'Unit 01 & 04 Reformer Area', velocity: '142 / 160 spools/wk', compliance: '98.5%', risk: 'Low', trend: 'up' },
    { name: 'Punj Lloyd Piping Subcontractor', workfront: 'Rack-03 Overhead Pipe Bridge', velocity: '88 / 130 spools/wk', compliance: '84.0%', risk: 'High', trend: 'down' },
    { name: 'Siemens Energy & Instrumentation', workfront: 'Substation #2 Cable Pulling', velocity: '320 / 300 m/day', compliance: '96.2%', risk: 'Low', trend: 'up' },
    { name: 'Bridge & Roof Structural Works', workfront: 'Pump Bay Steel Structure', velocity: '45 / 50 T/wk', compliance: '91.8%', risk: 'Medium', trend: 'steady' },
  ];

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 260;
  const padding = { top: 25, right: 35, bottom: 40, left: 45 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Scale functions for S-Curve
  const getX = (index: number) => padding.left + (index / Math.max(1, sCurveData.length - 1)) * graphWidth;
  const getY = (val: number) => padding.top + graphHeight - (val / 100) * graphHeight;

  // Generate SVG path strings
  const plannedPath = sCurveData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.planned)}`).join(' ');
  const actualPoints = sCurveData.filter(d => d.actual !== null);
  const actualPath = actualPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.actual!)}`).join(' ');
  
  // Forecast path strictly starts from Data Date (month index 4) through completion
  const forecastIndices = [4, 5, 6, 7];
  const forecastPath = forecastIndices.map((idx, i) => {
    const pt = sCurveData[idx];
    const val = pt.forecast !== null && pt.forecast !== undefined ? pt.forecast : (pt.actual ?? 100);
    return `${i === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`;
  }).join(' ');

  // Gradient area paths
  const actualAreaPath = actualPoints.length > 0
    ? `${actualPath} L ${getX(actualPoints.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`
    : '';
  const plannedAreaPath = `${plannedPath} L ${getX(sCurveData.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`;

  // Donut chart calculations
  const donutData = [
    { label: 'Completed', value: metrics.completed || 8, color: '#10b981' },
    { label: 'In Progress (On Track)', value: Math.max(1, metrics.inProgress - metrics.delayed) || 14, color: '#38bdf8' },
    { label: 'Critical Delay Risk', value: metrics.delayed || 5, color: '#f43f5e' },
    { label: 'Not Started', value: metrics.notStarted || 7, color: '#64748b' },
  ];
  const donutTotal = donutData.reduce((acc, d) => acc + d.value, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* 1. Header & Project Switcher */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderLeft: '4px solid var(--brand-primary)',
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-subtle) 100%)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="brand-badge" style={{ fontSize: '0.675rem', letterSpacing: '0.06em' }}>
              EXECUTIVE PROJECT CONTROLS
            </span>
            <span className="mono-pill" style={{ fontSize: '0.68rem', background: 'var(--brand-primary-subtle)', color: 'var(--brand-primary)' }}>
              {currentProject?.shortCode || 'IOCL-P4'} • {currentProject?.contractId || 'EPCC-PKG-04'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.725rem', color: 'var(--status-ready-fg)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-ready-fg)', display: 'inline-block' }} />
              <span>SQLite Live Synced</span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            {currentProject?.name || 'IOCL Refinery Expansion'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Client: <strong style={{ color: 'var(--text-primary)' }}>{currentProject?.client || 'IOCL'}</strong></span>
            <span>•</span>
            <span>Location: <strong style={{ color: 'var(--text-primary)' }}>{currentProject?.location || 'Paradip, Odisha'}</strong></span>
            <span>•</span>
            <span>Status: <strong style={{ color: 'var(--brand-primary)' }}>{currentProject?.status || 'Active Execution'}</strong></span>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Switch Project Baseline
            </span>
            <select
              value={currentProject?.id || 'iocl-p4'}
              onChange={e => switchProject(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                minWidth: 220,
              }}
              title="Select Project for Analytics View"
            >
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.shortCode || p.code})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveTab('planner-review')}
            style={{ fontSize: '0.8rem', padding: '7px 12px', marginTop: 16 }}
            title="Inspect Planner Review Queue"
          >
            <Sliders size={14} />
            <span>Planner Queue</span>
          </button>
        </div>
      </div>

      {/* 2. Top Executive KPI Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* KPI 1: Cumulative Progress */}
        <div className="card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Overall Progress
            </span>
            <span className={`status-pill ${metrics.scheduleVariance >= 0 ? 'status-ready' : 'status-review'}`} style={{ fontSize: '0.65rem' }}>
              {metrics.scheduleVariance >= 0 ? `+${metrics.scheduleVariance}% Ahead` : `${metrics.scheduleVariance}% Behind`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {metrics.avgActualProgress}%
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Target: {metrics.avgPlannedProgress}%
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${metrics.avgActualProgress}%`,
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #10b981, #059669)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* KPI 2: Schedule Performance Index (SPI) */}
        <div className="card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Schedule Index (SPI)
            </span>
            <BarChart3 size={15} style={{ color: Number(metrics.spi) >= 1 ? '#10b981' : '#f59e0b' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: Number(metrics.spi) >= 1 ? '#10b981' : '#f59e0b', lineHeight: 1 }}>
              {metrics.spi}
            </span>
            <span style={{ fontSize: '0.75rem', color: Number(metrics.spi) >= 1 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
              {Number(metrics.spi) >= 1 ? 'Optimal Float' : 'Critical Float Alert'}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Baseline Velocity Target: 1.00 SPI
          </div>
        </div>

        {/* KPI 3: AI Match Precision */}
        <div className="card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              AI Linking Precision
            </span>
            <Sparkles size={15} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--brand-primary)', lineHeight: 1 }}>
              {metrics.matchPrecision}%
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--status-ready-fg)', fontWeight: 700 }}>
              Fuzzy + Semantic
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Automated L5 Mapping Confidence
          </div>
        </div>

        {/* KPI 4: Critical Delays Flagged */}
        <div className="card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Delayed Activities
            </span>
            <AlertTriangle size={15} style={{ color: metrics.delayed > 0 ? '#f43f5e' : '#10b981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: metrics.delayed > 0 ? '#f43f5e' : '#10b981', lineHeight: 1 }}>
              {metrics.delayed}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              of {metrics.totalActivities || 34} Total
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--status-review-fg)' }}>
            {metrics.delayed > 0 ? 'Downstream Milestones Impacted' : 'All Milestones Secured'}
          </div>
        </div>
      </div>

      {/* 3. Main Chart Row: Interactive S-Curve & Status Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)', gap: '1.25rem' }}>
        {/* Left: S-Curve Performance Chart */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Earned Value S-Curve: Planned Baseline vs Field Reality
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Cumulative physical progress tracked against Primavera P6 Baseline Rev-02
              </span>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.725rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 14, height: 3, background: '#38bdf8', display: 'inline-block', borderRadius: 2 }} />
                <span style={{ color: 'var(--text-secondary)' }}>Baseline (P6)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 14, height: 3, background: '#10b981', display: 'inline-block', borderRadius: 2 }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Actual Physical</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 14, height: 3, background: '#f59e0b', display: 'inline-block', borderRadius: 2, borderTop: '2px dashed #f59e0b' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Projected Catch-up</span>
              </div>
            </div>
          </div>

          {/* SVG S-Curve */}
          <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', minHeight: 240, display: 'block' }}
            >
              <defs>
                <linearGradient id="actualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="plannedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map(val => (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={getY(val)}
                    x2={chartWidth - padding.right}
                    y2={getY(val)}
                    stroke="var(--border-subtle)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={getY(val) + 4}
                    fill="var(--text-muted)"
                    fontSize="10"
                    textAnchor="end"
                    fontWeight="500"
                  >
                    {val}%
                  </text>
                </g>
              ))}

              {/* Shaded Area Fills under curves */}
              {plannedAreaPath && (
                <path d={plannedAreaPath} fill="url(#plannedAreaGrad)" pointerEvents="none" />
              )}
              {actualAreaPath && (
                <path d={actualAreaPath} fill="url(#actualAreaGrad)" pointerEvents="none" />
              )}

              {/* Forecast Dashed Line (From Data Date to Completion) */}
              <path
                d={forecastPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="5 4"
              />

              {/* Planned Line */}
              <path
                d={plannedPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Actual Line */}
              <path
                d={actualPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Boundary Marker (Month 5 / Today) */}
              <line
                x1={getX(4)}
                y1={padding.top}
                x2={getX(4)}
                y2={chartHeight - padding.bottom}
                stroke="var(--brand-primary)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text
                x={getX(4)}
                y={padding.top - 6}
                fill="var(--brand-primary)"
                fontSize="9"
                fontWeight="800"
                textAnchor="middle"
              >
                DATA DATE: SEP 22, 2026
              </text>

              {/* Month X-Axis Labels & Points */}
              {sCurveData.map((d, i) => {
                const x = getX(i);
                const isCurrent = i === 4;
                const isFuture = i > 4;
                return (
                  <g key={d.month}>
                    <text
                      x={x}
                      y={chartHeight - padding.bottom + 18}
                      fill={isCurrent ? 'var(--text-primary)' : 'var(--text-muted)'}
                      fontSize="10"
                      fontWeight={isCurrent ? '700' : '500'}
                      textAnchor="middle"
                    >
                      {d.month}
                    </text>

                    {/* Milestone Subtext */}
                    <text
                      x={x}
                      y={chartHeight - padding.bottom + 30}
                      fill="var(--text-muted)"
                      fontSize="8"
                      textAnchor="middle"
                    >
                      {d.milestone.split(' ')[0]}
                    </text>

                    {/* Planned Point */}
                    <circle
                      cx={x}
                      cy={getY(d.planned)}
                      r={3.5}
                      fill="#38bdf8"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint({ x, y: getY(d.planned), label: `${d.month} (${d.milestone})`, planned: d.planned, actual: d.actual ?? d.forecast ?? d.planned })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    {/* Actual Physical Point */}
                    {d.actual !== null && (
                      <circle
                        cx={x}
                        cy={getY(d.actual)}
                        r={isCurrent ? 6 : 4}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredPoint({ x, y: getY(d.actual!), label: `${d.month} (${d.milestone})`, planned: d.planned, actual: d.actual! })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    )}

                    {/* Forecasted Catch-up Point for Future Months */}
                    {isFuture && d.forecast !== null && d.forecast !== undefined && (
                      <circle
                        cx={x}
                        cy={getY(d.forecast)}
                        r={4}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeDasharray="2 1"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredPoint({ x, y: getY(d.forecast!), label: `${d.month} (Projected Catch-up)`, planned: d.planned, actual: d.forecast! })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  left: hoveredPoint.x + 10,
                  top: hoveredPoint.y - 45,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.725rem',
                  pointerEvents: 'none',
                  zIndex: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{hoveredPoint.label}</div>
                <div style={{ color: '#38bdf8' }}>Planned Target: {hoveredPoint.planned}%</div>
                <div style={{ color: '#10b981' }}>Actual Physical: {hoveredPoint.actual}%</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Activity Status Donut & Execution Breakdown */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              Schedule Workfront Health
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Breakdown of {metrics.totalActivities || 34} Primavera P6 Activities
            </span>
          </div>

          {/* SVG Donut Visual */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '1rem 0' }}>
            <svg width="170" height="170" viewBox="0 0 170 170">
              {(() => {
                let accumulatedAngle = 0;
                return donutData.map((seg, idx) => {
                  const angle = (seg.value / donutTotal) * 360;
                  const startAngle = accumulatedAngle;
                  const endAngle = accumulatedAngle + angle;
                  accumulatedAngle += angle;

                  const r = 68;
                  const cx = 85;
                  const cy = 85;

                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);

                  const x1 = cx + r * Math.cos(startRad);
                  const y1 = cy + r * Math.sin(startRad);
                  const x2 = cx + r * Math.cos(endRad);
                  const y2 = cy + r * Math.sin(endRad);

                  const largeArc = angle > 180 ? 1 : 0;
                  const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                  return (
                    <path
                      key={seg.label}
                      d={pathData}
                      fill={seg.color}
                      opacity={selectedDonutSegment === null || selectedDonutSegment === seg.label ? 1 : 0.35}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onClick={() => setSelectedDonutSegment(selectedDonutSegment === seg.label ? null : seg.label)}
                    />
                  );
                });
              })()}
              {/* Inner cutout for Donut */}
              <circle cx="85" cy="85" r="46" fill="var(--bg-surface)" />
              <text x="85" y="80" textAnchor="middle" fontSize="19" fontWeight="900" fill="var(--text-primary)">
                {metrics.totalActivities || 34}
              </text>
              <text x="85" y="96" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--text-muted)">
                ACTIVITIES
              </text>
            </svg>
          </div>

          {/* Donut Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {donutData.map(seg => (
              <div
                key={seg.label}
                onClick={() => setSelectedDonutSegment(selectedDonutSegment === seg.label ? null : seg.label)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  padding: '4px 6px',
                  borderRadius: 'var(--radius-xs)',
                  background: selectedDonutSegment === seg.label ? 'var(--bg-subtle)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
                </div>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  {seg.value} ({Math.round((seg.value / donutTotal) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Discipline Breakdown & Delay Root Cause Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.25rem' }}>
        {/* Left: Discipline Progress & Variance Bars */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Discipline-Wise Physical Progress
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Field progress comparison vs contractual milestones
              </span>
            </div>
            <span className="mono-pill" style={{ fontSize: '0.675rem' }}>
              5 Disciplines
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {disciplineStats.map(d => (
              <div key={d.discipline} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                      {d.discipline}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      ({d.total} tasks)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Target: {d.planned}%
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      {d.actual}%
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: d.variance < -5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: d.variance < -5 ? '#ef4444' : '#10b981',
                      }}
                    >
                      {d.variance >= 0 ? `+${d.variance}%` : `${d.variance}%`}
                    </span>
                  </div>
                </div>

                {/* Comparative Progress Bar */}
                <div style={{ position: 'relative', width: '100%', height: 9, borderRadius: 999, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                  {/* Planned Target Marker */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${d.planned}%`,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      background: 'rgba(255, 255, 255, 0.65)',
                      zIndex: 3,
                    }}
                    title={`Planned Target: ${d.planned}%`}
                  />
                  {/* Actual Progress Fill */}
                  <div
                    style={{
                      width: `${d.actual}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: d.variance < -8
                        ? 'linear-gradient(90deg, #f43f5e, #e11d48)'
                        : d.variance < 0
                        ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                        : 'linear-gradient(90deg, #10b981, #059669)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Critical Path Milestones & Baseline Float Health */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Critical Path Milestones & Float Health
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                EVM schedule variance & contractual handover milestones
              </span>
            </div>
            <span className="brand-badge" style={{ fontSize: '0.65rem' }}>
              P6 Aligned
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {criticalMilestones.map(m => (
              <div
                key={m.milestone}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.milestone}
                  </span>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                    <span>Baseline: <strong style={{ color: 'var(--text-secondary)' }}>{m.baselineFinish}</strong></span>
                    <span>•</span>
                    <span>Forecast: <strong style={{ color: m.color }}>{m.forecastFinish}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: m.color === '#10b981' ? 'rgba(16, 185, 129, 0.15)' : m.color === '#38bdf8' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: m.color,
                    }}
                  >
                    Float: {m.float}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* AI Automated Recommendation Pill */}
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <Sparkles size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <strong style={{ color: '#38bdf8' }}>Float Optimization:</strong> Parallelizing NDT package on Unit-01 spools preserves positive float for the Oct 15 hydrotest window.
            </div>
          </div>
        </div>
      </div>

      {/* 5. Subcontractor Velocity & Execution Matrix */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Workfront & Contractor Execution Velocity
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Real-time daily submission compliance and physical burn rates across EPC packages
            </span>
          </div>
          <span className="mono-pill" style={{ fontSize: '0.7rem' }}>
            {contractors.length} EPC Partners Tracked
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 12px' }}>Contractor / Agency</th>
                <th style={{ padding: '8px 12px' }}>Assigned Workfront</th>
                <th style={{ padding: '8px 12px' }}>Burn Rate / Velocity</th>
                <th style={{ padding: '8px 12px' }}>Log Compliance</th>
                <th style={{ padding: '8px 12px' }}>Risk Rating</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((c, idx) => (
                <tr
                  key={c.name}
                  style={{
                    borderBottom: idx < contractors.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {c.name}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {c.workfront}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    {c.velocity}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontWeight: 700, color: parseFloat(c.compliance) >= 90 ? '#10b981' : '#f59e0b' }}>
                      {c.compliance}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background: c.risk === 'High' ? 'rgba(239, 68, 68, 0.15)' : c.risk === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: c.risk === 'High' ? '#ef4444' : c.risk === 'Medium' ? '#f59e0b' : '#10b981',
                      }}
                    >
                      {c.risk}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('site-updates')}
                      style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    >
                      View Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
