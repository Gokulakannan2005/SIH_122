import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
  TrendingDown,
  Info,
  Calendar,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  FileText,
  Filter,
  Search,
  HardHat,
  Sparkles,
  Camera,
  Activity,
  BarChart3,
  Check,
  XCircle,
  AlertCircle,
  Compass,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    enrichedSchedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    auditLogs,
    setActiveTab,
    setSelectedScheduleActivityId,
    setSelectedInspectorUpdateId,
    setSelectedAuditUpdateId,
    navigateToSiteUpdatesWithFilter,
    navigateToPlannerReviewWithFilter,
  } = useProject();

  const [activeDashboardTab, setActiveDashboardTab] = useState<'today-tasks' | 'classification-hub' | 'schedule-variance'>('today-tasks');
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');

  // 1. Calculations for KPIs
  const totalSiteUpdates = siteUpdates.length;

  // Auto-linked or Approved
  const linkedCount = siteUpdates.filter(u => {
    const dec = plannerDecisions[u.id];
    if (dec && dec.linkedActivityId && dec.status === 'approved') return true;
    const match = matchResults[u.id];
    return match?.category === 'ready' && (!dec || dec.status === 'approved');
  }).length;

  // Pending Planner Review
  const pendingReviewUpdates = siteUpdates.filter(u => {
    const dec = plannerDecisions[u.id];
    if (dec && dec.status === 'approved') return false;
    const match = matchResults[u.id];
    return match && (match.category === 'review' || match.category === 'unplanned');
  });
  const pendingReviewCount = pendingReviewUpdates.length;

  // Unplanned count
  const unplannedCount = siteUpdates.filter(u => {
    const dec = plannerDecisions[u.id];
    if (dec?.status === 'unplanned') return true;
    return matchResults[u.id]?.category === 'unplanned';
  }).length;

  // Delayed / Critical variance activities
  const delayedActivities = enrichedSchedule.filter(a => (a.varianceDays || 0) > 0 || a.status === 'Delayed');
  const delayedCount = delayedActivities.length;

  // Discipline breakdown
  const disciplines = ['Civil', 'Piping', 'Electrical', 'Instrumentation', 'HSE'];
  const disciplineStats = disciplines.map(disc => {
    const discActivities = enrichedSchedule.filter(s => s.discipline === disc);
    const total = discActivities.length;
    const completed = discActivities.filter(s => s.status === 'Completed').length;
    const inProgress = discActivities.filter(s => s.status === 'In Progress').length;
    const delayed = discActivities.filter(s => (s.varianceDays || 0) > 0).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      discipline: disc,
      total,
      completed,
      inProgress,
      delayed,
      pct,
    };
  });

  // Today's Assigned Tasks Data (derived from enriched schedule activities)
  const todayTasks = enrichedSchedule.map(act => {
    // Find linked site updates for this activity
    const linkedUpdates = siteUpdates.filter(u => {
      const dec = plannerDecisions[u.id];
      if (dec && dec.linkedActivityId === act.activityId && dec.status === 'approved') return true;
      const match = matchResults[u.id];
      return match?.candidateActivityId === act.activityId;
    });

    const hasBlocker = linkedUpdates.some(u => u.issueFlag || u.issueSeverity === 'critical');
    const hasPhotoProof = linkedUpdates.some(u => (u.images?.length || 0) > 0);
    const blockerText = linkedUpdates.find(u => u.issueFlag)?.issueFlag;
    const confirmedTag = linkedUpdates.find(u => u.confirmedTag)?.confirmedTag;

    // Crew lead assignment mapping
    let crew = 'L&T Infrastructure Team Alpha';
    if (act.discipline === 'Piping') crew = 'Punj Lloyd Piping Crew 4';
    if (act.discipline === 'Electrical') crew = 'Siemens Power & Drive Team';
    if (act.discipline === 'Instrumentation') crew = 'Yokogawa Controls Crew';
    if (act.discipline === 'HSE') crew = 'IOCL Safety & Audit Cell';

    return {
      activity: act,
      linkedUpdates,
      hasBlocker,
      blockerText,
      hasPhotoProof,
      confirmedTag,
      crew,
      targetToday: act.status === 'Completed' ? 100 : act.status === 'In Progress' ? 75 : 30,
      actualProgress: act.progressPercent || 0,
    };
  });

  // Filtered Today's Tasks
  const filteredTodayTasks = todayTasks.filter(item => {
    if (selectedDisciplineFilter !== 'ALL' && item.activity.discipline !== selectedDisciplineFilter) return false;
    if (selectedStatusFilter === 'Completed' && item.activity.status !== 'Completed') return false;
    if (selectedStatusFilter === 'In Progress' && item.activity.status !== 'In Progress') return false;
    if (selectedStatusFilter === 'Blocked' && !item.hasBlocker && item.activity.status !== 'Delayed') return false;
    if (taskSearchQuery) {
      const q = taskSearchQuery.toLowerCase();
      return (
        item.activity.activityId.toLowerCase().includes(q) ||
        item.activity.activityName.toLowerCase().includes(q) ||
        item.activity.discipline.toLowerCase().includes(q) ||
        item.activity.area.toLowerCase().includes(q) ||
        item.crew.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div id="demo-target-project-intelligence" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Industrial Hero Banner matching Reference Screen 1 */}
      <div className="dashboard-hero-banner">
        <div className="dashboard-hero-content">
          <span className="dashboard-hero-subtitle">PROJECT CONTROL CENTER</span>
          <h1 className="dashboard-hero-title">IOCL Refinery - P4</h1>
          <p className="dashboard-hero-desc">
            Live project intelligence from field reality to schedule execution.
          </p>
        </div>

        <div className="dashboard-hero-visual">
          <div className="dashboard-hero-tagline">
            Turning Field Reality into Project Intelligence.
          </div>
        </div>
      </div>

      {/* 2. Horizontal 6-Metric KPI Strip (Step 1 Spotlight Target) */}
      <div id="demo-target-project-context" className="dashboard-kpi-strip">
        {/* KPI 1: Overall Progress */}
        <div
          className="kpi-strip-card clickable"
          onClick={() => setActiveTab('schedule-activities')}
          title="Click to view 4D Schedule Progress"
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-strip-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Activity size={18} />
          </div>
          <div className="kpi-strip-content">
            <span className="kpi-strip-label">Overall Progress</span>
            <span className="kpi-strip-value">68%</span>
            <span className="kpi-strip-sub" style={{ color: '#059669' }}>
              +12% this week
            </span>
          </div>
        </div>

        {/* KPI 2: Critical Activities */}
        <div
          className="kpi-strip-card clickable"
          onClick={() => setActiveTab('schedule-activities')}
          title="Click to inspect Critical Path items"
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-strip-icon" style={{ background: '#fff1f2', color: '#e11d48' }}>
            <AlertTriangle size={18} />
          </div>
          <div className="kpi-strip-content">
            <span className="kpi-strip-label">Critical Activities</span>
            <span className="kpi-strip-value">5</span>
            <span className="kpi-strip-sub" style={{ color: '#e11d48' }}>
              At risk
            </span>
          </div>
        </div>

        {/* KPI 3: Unresolved Reports */}
        <div
          className="kpi-strip-card clickable"
          onClick={() => navigateToPlannerReviewWithFilter('review')}
          title="Click to open Planner Review Queue"
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-strip-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={18} />
          </div>
          <div className="kpi-strip-content">
            <span className="kpi-strip-label">Unresolved Reports</span>
            <span className="kpi-strip-value">{pendingReviewCount || 8}</span>
            <span className="kpi-strip-sub" style={{ color: '#d97706' }}>
              Needs review
            </span>
          </div>
        </div>

        {/* KPI 4: Verified & Linked */}
        <div
          className="kpi-strip-card clickable"
          onClick={() => navigateToSiteUpdatesWithFilter({ status: 'approved' })}
          title="Click to view verified field updates"
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-strip-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <ShieldCheck size={18} />
          </div>
          <div className="kpi-strip-content">
            <span className="kpi-strip-label">Verified & Linked</span>
            <span className="kpi-strip-value">{linkedCount || 142}</span>
            <span className="kpi-strip-sub" style={{ color: '#059669' }}>
              +18 this week
            </span>
          </div>
        </div>

        {/* KPI 5: Schedule Variance */}
        <div
          className="kpi-strip-card clickable"
          onClick={() => setActiveTab('copilot')}
          title="Click to simulate Delay Scenarios"
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-strip-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <Calendar size={18} />
          </div>
          <div className="kpi-strip-content">
            <span className="kpi-strip-label">Schedule Variance</span>
            <span className="kpi-strip-value">+3 days</span>
            <span className="kpi-strip-sub" style={{ color: '#7c3aed' }}>
              Behind baseline
            </span>
          </div>
        </div>

        {/* KPI 6: Upcoming Milestone */}
        <div
          className="kpi-strip-card clickable"
          onClick={() => setActiveTab('schedule-activities')}
          title="Click to view Milestone Schedule"
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-strip-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Calendar size={18} />
          </div>
          <div className="kpi-strip-content">
            <span className="kpi-strip-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Upcoming Milestone</span>
              <Info size={11} style={{ color: 'var(--text-muted)' }} />
            </span>
            <span className="kpi-strip-value" style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: 3 }}>
              Pump Bay Completion
            </span>
            <span className="kpi-strip-sub" style={{ color: 'var(--text-muted)' }}>
              Sep 15, 2026
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main 3-Column Industrial Workspace Grid */}
      <div className="dashboard-main-grid">
        {/* Column 1: Executive Workfront Execution Matrix */}
        <div className="card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={16} style={{ color: 'var(--brand-primary)' }} />
                Live Workfront Velocity Matrix
              </h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                Physical plant zones reconciled from daily supervisor logs
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('schedule-activities')}
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem', gap: 4 }}
            >
              <span>4D Twin Map</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Workfront Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Workfront 1: Pump Bay */}
            <div
              onClick={() => setActiveTab('schedule-activities')}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Unit-01: Pump Bay
                  </span>
                  <span className="mono-pill" style={{ fontSize: '0.6rem', padding: '1px 5px', background: 'var(--bg-surface)' }}>
                    Piping & Civil
                  </span>
                </div>
                <span className="badge badge-ready" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  ● On Schedule
                </span>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                CW Spool Fabrication & Erection (24-CW-017) • 14 Workers Active
              </div>

              {/* Progress Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '72%', height: '100%', background: 'linear-gradient(90deg, #059669, #10b981)', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#059669', minWidth: 32, textAlign: 'right' }}>
                  72%
                </span>
              </div>
            </div>

            {/* Workfront 2: Filter Bay */}
            <div
              onClick={() => setActiveTab('schedule-activities')}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Unit-03: Filter Bay
                  </span>
                  <span className="mono-pill" style={{ fontSize: '0.6rem', padding: '1px 5px', background: 'var(--bg-surface)' }}>
                    Civil Foundation
                  </span>
                </div>
                <span className="badge badge-ready" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  ● Steady Progress
                </span>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Foundation curing & Pump baseplate grout • 8 Workers Active
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '54%', height: '100%', background: 'linear-gradient(90deg, #2563eb, #3b82f6)', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-secondary)', minWidth: 32, textAlign: 'right' }}>
                  54%
                </span>
              </div>
            </div>

            {/* Workfront 3: Electrical Substation (Critical Risk) */}
            <div
              onClick={() => setActiveTab('copilot')}
              style={{
                background: 'rgba(244, 63, 94, 0.04)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Critical delay detected! Click to simulate schedule impact in Copilot"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#f43f5e' }}>
                    Unit-04: Substation
                  </span>
                  <span className="mono-pill" style={{ fontSize: '0.6rem', padding: '1px 5px', background: 'var(--bg-surface)', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
                    Electrical & Heavy Lift
                  </span>
                </div>
                <span className="badge badge-unplanned" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  ⚠️ -4.2d Critical Slip
                </span>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Transformer Bay Crane Hydraulic Downtime • Needs Planner Intervention
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '36%', height: '100%', background: 'linear-gradient(90deg, #e11d48, #f43f5e)', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#f43f5e', minWidth: 32, textAlign: 'right' }}>
                  36%
                </span>
              </div>
            </div>

            {/* Workfront 4: Utility Corridor */}
            <div
              onClick={() => setActiveTab('schedule-activities')}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Unit-02: Utility Corridor
                  </span>
                  <span className="mono-pill" style={{ fontSize: '0.6rem', padding: '1px 5px', background: 'var(--bg-surface)' }}>
                    Pipe Rack Modular
                  </span>
                </div>
                <span className="badge badge-ready" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  ▲ +3d Ahead
                </span>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Pipe rack module alignment & tie-ins complete • 12 Workers
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '81%', height: '100%', background: 'linear-gradient(90deg, #059669, #10b981)', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#059669', minWidth: 32, textAlign: 'right' }}>
                  81%
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span><strong>18 / 24</strong> Active Workfronts</span>
            <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Click any zone for 4D Digital Twin →</span>
          </div>
        </div>

        {/* Column 2: Recent Field Activity */}
        <div className="card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Recent Field Activity
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('site-updates')}
              style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {/* Activity 1 */}
            <div className="activity-stream-item">
              <div style={{ color: '#059669', marginTop: 2 }}>
                <CheckCircle2 size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span className="mono-pill" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0', fontSize: '0.65rem' }}>
                    Piping
                  </span>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>2 hours ago</span>
                  <span className="badge badge-ready" style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '1px 6px' }}>
                    Verified
                  </span>
                </div>
                <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  CW spool fabrication completed in yard
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 600, marginTop: 2 }}>
                  Linked to PIP-L6-011
                </div>
              </div>
            </div>

            {/* Activity 2 */}
            <div className="activity-stream-item">
              <div style={{ color: '#d97706', marginTop: 2 }}>
                <Clock size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span className="mono-pill" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0', fontSize: '0.65rem' }}>
                    Piping
                  </span>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>5 hours ago</span>
                  <span className="badge badge-review" style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '1px 6px' }}>
                    Needs Review
                  </span>
                </div>
                <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  24 inch CW spool erected near pump bay
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 600, marginTop: 2 }}>
                  Linked to PIP-L6-012
                </div>
              </div>
            </div>

            {/* Activity 3 */}
            <div className="activity-stream-item">
              <div style={{ color: '#059669', marginTop: 2 }}>
                <CheckCircle2 size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span className="mono-pill" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe', fontSize: '0.65rem' }}>
                    Civil
                  </span>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>1 day ago</span>
                  <span className="badge badge-ready" style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '1px 6px' }}>
                    Verified
                  </span>
                </div>
                <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  Pump foundation excavation completed
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 600, marginTop: 2 }}>
                  Linked to CIV-L6-001
                </div>
              </div>
            </div>

            {/* Activity 4 */}
            <div className="activity-stream-item">
              <div style={{ color: '#e11d48', marginTop: 2 }}>
                <AlertTriangle size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span className="mono-pill" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0', fontSize: '0.65rem' }}>
                    Piping
                  </span>
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>1 day ago</span>
                  <span className="badge badge-unplanned" style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '1px 6px' }}>
                    Unplanned
                  </span>
                </div>
                <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  Drain line installed near pump
                </div>
                <div style={{ fontSize: '0.7rem', color: '#e11d48', fontWeight: 600, marginTop: 2 }}>
                  Unplanned Scope
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Risk & Delay Indicators */}
        <div className="card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Risk & Delay Indicators
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('copilot')}
              style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', cursor: 'pointer' }}
            >
              View Analysis →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
            {/* Risk 1 */}
            <div
              className="risk-indicator-item"
              onClick={() => setActiveTab('copilot')}
              title="Click to simulate schedule risk"
            >
              <div style={{ color: '#d97706', marginTop: 1 }}>
                <AlertTriangle size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Potential Delay Detected
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.25 }}>
                  Pump Foundation Curing<br />
                  <span style={{ color: '#d97706' }}>May impact 3 downstream activities</span>
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginTop: 2 }} />
            </div>

            {/* Risk 2 */}
            <div
              className="risk-indicator-item"
              onClick={() => navigateToPlannerReviewWithFilter('review')}
              title="Click to review pending updates"
            >
              <div style={{ color: '#2563eb', marginTop: 1 }}>
                <FileText size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Unverified Field Updates
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.25 }}>
                  8 reports pending review<br />
                  <span style={{ color: '#2563eb' }}>Requires planner attention</span>
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginTop: 2 }} />
            </div>

            {/* Risk 3 */}
            <div
              className="risk-indicator-item"
              onClick={() => setActiveTab('copilot')}
              title="Click to inspect critical path slippage"
            >
              <div style={{ color: '#e11d48', marginTop: 1 }}>
                <TrendingDown size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Critical Path Impact
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.25 }}>
                  <strong style={{ color: '#e11d48' }}>+3 days</strong> potential impact<br />
                  Based on current field inputs
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginTop: 2 }} />
            </div>

            {/* Risk 4 */}
            <div
              className="risk-indicator-item"
              onClick={() => setActiveTab('schedule-activities')}
              title="Click to view crew allocation"
            >
              <div style={{ color: '#7c3aed', marginTop: 1 }}>
                <HardHat size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Resource Constraint
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.25 }}>
                  Piping crew over-allocated<br />
                  Filter Bay area
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginTop: 2 }} />
            </div>
          </div>
        </div>
      </div>


      {/* Main Section Tab Navigation: Today's Tasks, Classification Hub, Schedule Health */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: '0.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveDashboardTab('today-tasks')}
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.875rem',
              fontWeight: activeDashboardTab === 'today-tasks' ? 700 : 500,
              color: activeDashboardTab === 'today-tasks' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              background: activeDashboardTab === 'today-tasks' ? 'var(--brand-surface)' : 'transparent',
              border: `1px solid ${activeDashboardTab === 'today-tasks' ? 'var(--brand-primary)' : 'transparent'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Calendar size={16} />
            <span>Today&apos;s Assigned Tasks & Execution Status</span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
                background: activeDashboardTab === 'today-tasks' ? 'var(--brand-primary)' : 'var(--bg-surface-secondary)',
                color: activeDashboardTab === 'today-tasks' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              {todayTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDashboardTab('classification-hub')}
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.875rem',
              fontWeight: activeDashboardTab === 'classification-hub' ? 700 : 500,
              color: activeDashboardTab === 'classification-hub' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              background: activeDashboardTab === 'classification-hub' ? 'var(--brand-surface)' : 'transparent',
              border: `1px solid ${activeDashboardTab === 'classification-hub' ? 'var(--brand-primary)' : 'transparent'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={16} />
            <span>Daily Reports Filed & Classification Hub</span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
                background: activeDashboardTab === 'classification-hub' ? 'var(--brand-primary)' : 'var(--bg-surface-secondary)',
                color: activeDashboardTab === 'classification-hub' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              {totalSiteUpdates}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDashboardTab('schedule-variance')}
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.875rem',
              fontWeight: activeDashboardTab === 'schedule-variance' ? 700 : 500,
              color: activeDashboardTab === 'schedule-variance' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              background: activeDashboardTab === 'schedule-variance' ? 'var(--brand-surface)' : 'transparent',
              border: `1px solid ${activeDashboardTab === 'schedule-variance' ? 'var(--brand-primary)' : 'transparent'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
            }}
          >
            <BarChart3 size={16} />
            <span>Discipline Health & Schedule Variance</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Active Shift: Sep 8, 2026 (08:00 - 18:00 IST)
          </span>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: TODAY'S ASSIGNED TASKS & EXECUTION STATUS
          ========================================================================= */}
      {activeDashboardTab === 'today-tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Controls & Filter Bar */}
          <div
            className="card"
            style={{
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 240px', maxWidth: '380px' }}>
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter today's tasks, crew, workfront..."
                value={taskSearchQuery}
                onChange={e => setTaskSearchQuery(e.target.value)}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  width: '100%',
                }}
              />
            </div>

            {/* Discipline Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: 4 }}>
                Discipline:
              </span>
              {['ALL', 'Civil', 'Piping', 'Electrical', 'Instrumentation', 'HSE'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDisciplineFilter(d)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.725rem',
                    fontWeight: selectedDisciplineFilter === d ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${selectedDisciplineFilter === d ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                    background: selectedDisciplineFilter === d ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: selectedDisciplineFilter === d ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: 4 }}>
                Status:
              </span>
              {['ALL', 'In Progress', 'Completed', 'Blocked'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedStatusFilter(s)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.725rem',
                    fontWeight: selectedStatusFilter === s ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${selectedStatusFilter === s ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                    background: selectedStatusFilter === s ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: selectedStatusFilter === s ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Today's Tasks Structured Grid / Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
            {filteredTodayTasks.length === 0 ? (
              <div
                className="card"
                style={{
                  gridColumn: '1 / -1',
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                No assigned tasks match the selected filters.
              </div>
            ) : (
              filteredTodayTasks.map(item => {
                const act = item.activity;
                const isDone = act.status === 'Completed';
                const isBlocked = item.hasBlocker || act.status === 'Delayed';

                return (
                  <div
                    key={act.activityId}
                    className="card"
                    style={{
                      padding: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      borderLeft: `4px solid ${
                        isDone
                          ? 'var(--status-ready-fg)'
                          : isBlocked
                          ? 'var(--status-unplanned-fg)'
                          : 'var(--brand-primary)'
                      }`,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Header: ID, Discipline, Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: 'var(--brand-primary)',
                            }}
                          >
                            {act.activityId}
                          </span>
                          <span className="mono-pill" style={{ fontSize: '0.675rem' }}>
                            {act.discipline}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--text-muted)',
                              fontWeight: 500,
                            }}
                          >
                            {act.area}
                          </span>
                        </div>
                        <h4
                          style={{
                            fontSize: '0.925rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginTop: '0.35rem',
                            lineHeight: 1.3,
                          }}
                        >
                          {act.activityName}
                        </h4>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`badge ${
                          isDone
                            ? 'badge-ready'
                            : isBlocked
                            ? 'badge-unplanned'
                            : 'badge-review'
                        }`}
                        style={{ fontSize: '0.7rem', padding: '2px 8px', flexShrink: 0 }}
                      >
                        {isBlocked ? 'Blocked / Risk' : isDone ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    {/* Assigned Crew & Planned Window */}
                    <div
                      style={{
                        padding: '0.5rem 0.65rem',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <HardHat size={12} /> Assigned Crew:
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.crew}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Calendar size={12} /> Shift Schedule:
                        </span>
                        <span>{act.plannedStart} &rarr; {act.plannedFinish}</span>
                      </div>
                      {item.confirmedTag && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Equipment Tag:</span>
                          <span className="mono-pill" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                            {item.confirmedTag}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Physical Execution:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isDone ? 'var(--status-ready-fg)' : 'var(--brand-primary)' }}>
                          {item.actualProgress}% / 100%
                        </span>
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className={`progress-bar-fill ${isDone ? 'green' : isBlocked ? 'red' : 'blue'}`}
                          style={{ width: `${item.actualProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Blocker Alert Banner if any */}
                    {item.blockerText && (
                      <div
                        style={{
                          padding: '0.45rem 0.65rem',
                          background: 'var(--status-unplanned-bg)',
                          border: '1px solid var(--status-unplanned-border)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '0.725rem',
                          color: 'var(--status-unplanned-fg)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{item.blockerText}</span>
                      </div>
                    )}

                    {/* Card Footer Actions */}
                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {item.hasPhotoProof ? (
                          <span
                            style={{
                              fontSize: '0.675rem',
                              color: 'var(--status-ready-fg)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              fontWeight: 600,
                            }}
                          >
                            <Camera size={12} /> Proof Attached
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                            No image evidence
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedScheduleActivityId(act.activityId);
                            setActiveTab('schedule-activities');
                          }}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                          title="Inspect 4D Schedule Milestone"
                        >
                          <span>4D Gantt</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            if (item.linkedUpdates[0]) {
                              setSelectedInspectorUpdateId(item.linkedUpdates[0].id);
                            }
                            setActiveTab('planner-review');
                          }}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                          title="Review Match Evidence"
                        >
                          <Sparkles size={12} />
                          <span>Match</span>
                        </button>

                        {isBlocked && (
                          <button
                            type="button"
                            className="btn btn-warning btn-sm"
                            onClick={() => setActiveTab('copilot')}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                            title="Simulate delay impact"
                          >
                            <TrendingDown size={12} />
                            <span>Simulate</span>
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
      )}

      {/* =========================================================================
          TAB 2: DAILY REPORTS FILED & CLASSIFICATION HUB
          ========================================================================= */}
      {activeDashboardTab === 'classification-hub' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Classification Formula & Logic Banner */}
          <div
            className="card"
            style={{
              padding: '1.15rem',
              background: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: 'var(--brand-primary)' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Multi-Factor Deterministic Classification Standard
                </h3>
              </div>
              <span className="mono-pill">ISO / P6 Compliant</span>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              DATUM matches unstructured text, audio recordings, and handwritten job tickets against master WBS deliverables using transparent mathematical scoring rather than generative guessing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
              <div style={{ padding: '0.65rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>FACTOR 1</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-primary)' }}>Keywords (50%)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>Trade action verbs & nouns</div>
              </div>
              <div style={{ padding: '0.65rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>FACTOR 2</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-primary)' }}>Discipline (20%)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>Civil, Piping, Electrical, HSE</div>
              </div>
              <div style={{ padding: '0.65rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>FACTOR 3</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-primary)' }}>Spatial Area (15%)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>Workfront & battery limit</div>
              </div>
              <div style={{ padding: '0.65rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>FACTOR 4</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-primary)' }}>Equipment Tag (15%)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>Exact alphanumeric tag match</div>
              </div>
            </div>
          </div>

          {/* Classification Breakdown Table of All Filed Reports */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Filed Daily Reports & Evidence Stream
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Showing all extracted field entries, AI confidence score, and classified WBS target
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => navigateToSiteUpdatesWithFilter({})}
              >
                <span>Open Full Feed</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="industrial-table">
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Source & Date</th>
                    <th>Extracted Summary</th>
                    <th>Discipline</th>
                    <th>Target WBS Match</th>
                    <th>Confidence</th>
                    <th>Classification</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {siteUpdates.map(u => {
                    const match = matchResults[u.id];
                    const dec = plannerDecisions[u.id];
                    const category: string = (dec?.status as string) || (match?.category as string) || 'review';
                    const targetActivity = enrichedSchedule.find(s => s.activityId === (dec?.linkedActivityId || match?.candidateActivityId));

                    return (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedInspectorUpdateId(u.id)}
                        style={{ cursor: 'pointer' }}
                        title="Click to inspect full details in drawer"
                      >
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                          {u.id}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{u.sourceFile}</div>
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{u.reportDate}</div>
                        </td>
                        <td style={{ maxWidth: '280px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {u.extractedDescription || u.rawText.slice(0, 45) + '...'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.rawText}
                          </div>
                        </td>
                        <td>
                          <span className="mono-pill">{u.discipline || 'General'}</span>
                        </td>
                        <td>
                          {targetActivity ? (
                            <div>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                                {targetActivity.activityId}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {targetActivity.activityName.slice(0, 24)}...
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--status-unplanned-fg)', fontWeight: 600 }}>
                              Unplanned Scope
                            </span>
                          )}
                        </td>
                        <td>
                          {match?.confidenceScore ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem' }}>
                                {match.confidenceScore}%
                              </span>
                              <div
                                style={{
                                  width: 36,
                                  height: 4,
                                  background: 'var(--border-subtle)',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${match.confidenceScore}%`,
                                    background:
                                      match.confidenceScore >= 80
                                        ? 'var(--status-ready-fg)'
                                        : match.confidenceScore >= 55
                                        ? 'var(--status-review-fg)'
                                        : 'var(--status-unplanned-fg)',
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>N/A</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              category === 'ready' || category === 'approved'
                                ? 'badge-ready'
                                : category === 'unplanned'
                                ? 'badge-unplanned'
                                : 'badge-review'
                            }`}
                            style={{ fontSize: '0.675rem', padding: '1px 6px' }}
                          >
                            {category === 'approved' ? 'Approved' : category === 'ready' ? 'Auto-Aligned' : category === 'unplanned' ? 'Unplanned' : 'Needs Review'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedInspectorUpdateId(u.id);
                              setActiveTab('planner-review');
                            }}
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DISCIPLINE HEALTH & SCHEDULE VARIANCE
          ========================================================================= */}
      {activeDashboardTab === 'schedule-variance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Discipline Progress Bars */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Discipline Progress & Schedule Health
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Physical progress extracted from site evidence across construction packages
                </p>
              </div>
              <span className="mono-pill">L5 / L6 Baseline</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
              {disciplineStats.map(stat => (
                <div
                  key={stat.discipline}
                  onClick={() => navigateToSiteUpdatesWithFilter({ discipline: stat.discipline })}
                  style={{
                    padding: '0.75rem 0.85rem',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-out',
                  }}
                  title={`Click to filter Daily Field Reports for ${stat.discipline}`}
                  className="clickable"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{stat.discipline}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.825rem', color: 'var(--brand-primary)' }}>
                      {stat.pct}%
                    </span>
                  </div>

                  <div className="progress-bar-container" style={{ marginBottom: '0.45rem' }}>
                    <div
                      className="progress-bar-fill green"
                      style={{ width: `${stat.pct}%` }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    <span>{stat.completed} of {stat.total} Done</span>
                    {stat.delayed > 0 && (
                      <span style={{ color: 'var(--status-unplanned-fg)', fontWeight: 600 }}>{stat.delayed} Delayed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2-Column Section: Delayed Activities Watchlist & Live Audit Trail */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
            {/* Delayed Activities Watchlist */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <TrendingDown size={16} style={{ color: 'var(--status-unplanned-fg)' }} />
                  Schedule Variance Watchlist (Behind Planned Dates)
                </h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('schedule-activities')}
                  type="button"
                >
                  <span>View All</span>
                </button>
              </div>

              <div className="table-responsive">
                <table className="industrial-table">
                  <thead>
                    <tr>
                      <th>Activity ID</th>
                      <th>Activity Name</th>
                      <th>Discipline</th>
                      <th>Planned Finish</th>
                      <th>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delayedActivities.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                          No critical schedule variances detected.
                        </td>
                      </tr>
                    ) : (
                      delayedActivities.slice(0, 6).map(act => (
                        <tr
                          key={act.activityId}
                          onClick={() => setSelectedScheduleActivityId(act.activityId)}
                          title="Click to inspect activity details & linked site updates"
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                            {act.activityId}
                          </td>
                          <td style={{ fontWeight: 600 }}>{act.activityName}</td>
                          <td>
                            <span className="mono-pill">{act.discipline}</span>
                          </td>
                          <td style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                            {act.plannedFinish}
                          </td>
                          <td>
                            <span className={`variance-badge ${(act.varianceDays || 0) > 0 ? 'delayed' : (act.varianceDays || 0) < 0 ? 'on-track' : 'neutral'}`}>
                              {(act.varianceDays || 0) > 0 ? `+${act.varianceDays}d` : `${act.varianceDays || 0}d`}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Audit Trail */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--brand-primary)' }} />
                  Recent Execution & Audit Trail
                </h3>
                <span className="mono-pill">{auditLogs.length} events</span>
              </div>

              <div style={{ maxHeight: 290, overflowY: 'auto', padding: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {auditLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    No audit events recorded yet.
                  </div>
                ) : (
                  auditLogs.slice(0, 10).map(log => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedInspectorUpdateId(log.updateId)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        background: 'var(--bg-surface-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        transition: 'all 0.15s ease-out',
                      }}
                      title="Click to view update details in inspector drawer"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {log.action}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span className="mono-pill" style={{ fontSize: '0.65rem' }}>{log.updateId}</span>
                        <span>&rarr;</span>
                        <span style={{ fontWeight: 600, color: log.finalActivityId ? 'var(--brand-primary)' : 'var(--status-unplanned-fg)' }}>
                          {log.finalActivityId || 'UNPLANNED'}
                        </span>
                        {log.originalConfidence > 0 && (
                          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {log.originalConfidence}% match
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
