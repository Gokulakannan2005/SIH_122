import React from 'react';
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
  CalendarCheck
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
  } = useProject();

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Planner Action Callout Banner */}
      {pendingReviewCount > 0 ? (
        <div className="action-callout warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--status-review-bg)',
                color: 'var(--status-review-fg)',
                border: '1px solid var(--status-review-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {pendingReviewCount} Site Updates Awaiting Planner Confirmation
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Site progress evidence matches require planner confirmation, re-linking, or classification as unplanned work.
              </div>
            </div>
          </div>
          <button
            className="btn btn-warning"
            onClick={() => setActiveTab('planner-review')}
            type="button"
          >
            <span>Open Review Queue</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className="action-callout">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--status-ready-bg)',
                color: 'var(--status-ready-fg)',
                border: '1px solid var(--status-ready-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                All Site Updates Verified & Aligned
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 2 }}>
                All extracted supervisor reports and Excel progress rows have been linked to L5/L6 activities or classified.
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('schedule-activities')}
            type="button"
          >
            <span>View Schedule</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* 5 Core Metric Cards */}
      <div className="grid-kpi">
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: '#f1f5f9', color: '#2b4360' }}>
            <Layers size={20} />
          </div>
          <div>
            <div className="kpi-title">Extracted Updates</div>
            <div className="kpi-value">{totalSiteUpdates}</div>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--status-ready-bg)', color: 'var(--status-ready-fg)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="kpi-title">Verified & Linked</div>
            <div className="kpi-value" style={{ color: 'var(--status-ready-fg)' }}>{linkedCount}</div>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--status-review-bg)', color: 'var(--status-review-fg)' }}>
            <Clock size={20} />
          </div>
          <div>
            <div className="kpi-title">Pending Review</div>
            <div className="kpi-value" style={{ color: 'var(--status-review-fg)' }}>{pendingReviewCount}</div>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: '#fef2f2', color: '#b91c1c' }}>
            <Flame size={20} />
          </div>
          <div>
            <div className="kpi-title">Unplanned Work</div>
            <div className="kpi-value" style={{ color: '#b91c1c' }}>{unplannedCount}</div>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: '#fff1f2', color: '#991b1b' }}>
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="kpi-title">Schedule Delays</div>
            <div className="kpi-value" style={{ color: '#991b1b' }}>{delayedCount}</div>
          </div>
        </div>
      </div>

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
              style={{
                padding: '0.75rem 0.85rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
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

      {/* 2-Column Section: Delayed Activities & Recent Audit Trail */}
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
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    transition: 'all 0.1s ease',
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
  );
};
