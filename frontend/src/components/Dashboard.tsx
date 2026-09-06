import React from 'react';
import { useProject } from '../context/ProjectContext';
import {
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
  TrendingDown
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Planner Action Callout Banner */}
      {pendingReviewCount > 0 ? (
        <div className="action-callout warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                Action Required: {pendingReviewCount} Site Updates Pending Review
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: 2 }}>
                Site progress evidence matches require planner confirmation, re-linking, or classification as new unplanned work.
              </div>
            </div>
          </div>
          <button
            className="btn btn-warning"
            onClick={() => setActiveTab('planner-review')}
            type="button"
            style={{ fontWeight: 700, padding: '0.6rem 1.25rem' }}
          >
            <span>Open Review Queue</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="action-callout" style={{ borderLeftColor: '#10b981', background: '#f0fdf4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                All Site Updates Verified & Aligned
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: 2 }}>
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
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 5 Core Metric Cards */}
      <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Layers size={22} />
          </div>
          <div>
            <div className="kpi-title">Extracted Site Updates</div>
            <div className="kpi-value">{totalSiteUpdates}</div>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="kpi-title">Verified & Linked</div>
            <div className="kpi-value" style={{ color: '#059669' }}>{linkedCount}</div>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="kpi-title">Pending Review</div>
            <div className="kpi-value" style={{ color: '#d97706' }}>{pendingReviewCount}</div>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <Flame size={22} />
          </div>
          <div>
            <div className="kpi-title">Unplanned Activities</div>
            <div className="kpi-value" style={{ color: '#dc2626' }}>{unplannedCount}</div>
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: '#fff1f2', color: '#e11d48' }}>
            <TrendingDown size={22} />
          </div>
          <div>
            <div className="kpi-title">Schedule Delays / Variances</div>
            <div className="kpi-value" style={{ color: '#e11d48' }}>{delayedCount}</div>
          </div>
        </div>
      </div>

      {/* Discipline Progress Bars */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Discipline Completion & Schedule Health
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: 2 }}>
              Physical progress extracted from site evidence across construction packages
            </p>
          </div>
          <span className="mono-pill">L5 / L6 Baseline</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {disciplineStats.map(stat => (
            <div key={stat.discipline} style={{ padding: '0.85rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{stat.discipline}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem', color: '#2563eb' }}>
                  {stat.pct}%
                </span>
              </div>

              <div className="progress-bar-container" style={{ marginBottom: '0.5rem' }}>
                <div
                  className="progress-bar-fill green"
                  style={{ width: `${stat.pct}%` }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                <span>{stat.completed} of {stat.total} Done</span>
                {stat.delayed > 0 && (
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>{stat.delayed} Delayed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Section: Delayed Activities & Recent Audit Trail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Delayed Activities Watchlist */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingDown size={18} style={{ color: '#dc2626' }} />
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
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
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
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2563eb' }}>
                        {act.activityId}
                      </td>
                      <td style={{ fontWeight: 600 }}>{act.activityName}</td>
                      <td>
                        <span className="mono-pill">{act.discipline}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#475569' }}>
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
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: '#2563eb' }} />
              Recent Planner & Ingestion Audit Trail
            </h3>
            <span className="mono-pill">{auditLogs.length} events</span>
          </div>

          <div style={{ maxHeight: 310, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                No audit events recorded yet.
              </div>
            ) : (
              auditLogs.slice(0, 10).map(log => (
                <div
                  key={log.id}
                  onClick={() => setSelectedInspectorUpdateId(log.updateId)}
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    transition: 'all 0.1s ease',
                  }}
                  title="Click to view update details in inspector drawer"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="mono-pill">{log.updateId}</span>
                    <span>&rarr;</span>
                    <span style={{ fontWeight: 600, color: log.finalActivityId ? '#2563eb' : '#dc2626' }}>
                      {log.finalActivityId || 'UNPLANNED'}
                    </span>
                    {log.originalConfidence > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.725rem', color: '#64748b' }}>
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
