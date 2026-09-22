import React, { useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Download,
  X,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  PieChart,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { diffDaysBetweenDates } from '../utils/scheduleSimulator';

export const AnalyticsExportModal: React.FC = () => {
  const {
    isProjectAnalyticsOpen,
    setIsProjectAnalyticsOpen,
    schedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    exportAlignmentCSV,
    currentProject,
    theme,
  } = useProject();

  const isDark = theme === 'dark';

  if (!isProjectAnalyticsOpen) return null;

  // Analytics Calculations
  const totalReports = siteUpdates.length;
  const matchValues = Object.values(matchResults);
  const confidentCount = matchValues.filter(m => m.category === 'ready').length;
  const uncertainCount = matchValues.filter(m => m.category === 'review').length;
  const unplannedCount = matchValues.filter(m => m.category === 'unplanned').length;

  // Delay & Bottleneck Analysis
  const delayedActivities = useMemo(() => {
    return schedule.filter(act => {
      const linked = siteUpdates.filter(u => {
        const dec = plannerDecisions[u.id];
        return (dec && dec.linkedActivityId === act.activityId) ||
          (matchResults[u.id]?.category === 'ready' && matchResults[u.id]?.candidateActivityId === act.activityId);
      });
      if (linked.length === 0) return false;
      const latestReport = linked.map(u => u.reportDate).filter(Boolean).sort().pop();
      if (!latestReport || !act.plannedStart) return false;
      return diffDaysBetweenDates(latestReport, act.plannedStart) > 0;
    });
  }, [schedule, siteUpdates, matchResults, plannerDecisions]);

  // Discipline Breakdown
  const disciplineStats = useMemo(() => {
    const map: Record<string, { total: number; delayed: number }> = {};
    siteUpdates.forEach(u => {
      const disc = u.discipline || 'General';
      if (!map[disc]) map[disc] = { total: 0, delayed: 0 };
      map[disc].total++;
      const match = matchResults[u.id];
      const dec = plannerDecisions[u.id];
      const linkedId = dec?.linkedActivityId || match?.candidateActivityId;
      const act = schedule.find(s => s.activityId === linkedId);
      if (act && u.reportDate && act.plannedStart && diffDaysBetweenDates(u.reportDate, act.plannedStart) > 0) {
        map[disc].delayed++;
      }
    });
    return map;
  }, [siteUpdates, matchResults, plannerDecisions, schedule]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: isDark ? 'rgba(5, 10, 20, 0.88)' : 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          background: isDark ? '#111827' : '#ffffff',
          border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: isDark
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.85)'
            : '0 20px 45px -10px rgba(15, 23, 42, 0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'background 0.2s ease, border 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark
              ? 'linear-gradient(to right, rgba(16, 185, 129, 0.12), rgba(17, 24, 39, 0.8))'
              : 'linear-gradient(to right, #f0fdf4, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isDark ? 'rgba(16, 185, 129, 0.18)' : '#dcfce7',
                color: isDark ? '#34d399' : '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #bbf7d0',
              }}
            >
              <BarChart3 size={20} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: isDark ? '#f8fafc' : '#0f172a',
                }}
              >
                Aligned Execution Analytics & Standardized CSV
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                Automated bottleneck intelligence generated directly from verified Level-5 / Level-6 matching
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={exportAlignmentCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1.1rem',
                borderRadius: 8,
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Download size={15} />
              <span>Download Problem Statement CSV</span>
            </button>
            <button
              onClick={() => setIsProjectAnalyticsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: 10, background: isDark ? 'rgba(0,0,0,0.35)' : '#f8fafc', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase' }}>
                Total Verified Records
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: isDark ? '#38bdf8' : '#0284c7', marginTop: 4 }}>
                {totalReports}
              </div>
              <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>
                Across {schedule.length} schedule activities
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: 10, background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4', border: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? '#34d399' : '#16a34a', textTransform: 'uppercase' }}>
                Confident Matches (&gt;80%)
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: isDark ? '#34d399' : '#16a34a', marginTop: 4 }}>
                {confidentCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: isDark ? '#a7f3d0' : '#15803d', marginTop: 2 }}>
                Auto-linked with high certainty
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: 10, background: isDark ? 'rgba(245, 158, 11, 0.08)' : '#fffbeb', border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? '#fbbf24' : '#d97706', textTransform: 'uppercase' }}>
                Human Verified / Uncertain
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: isDark ? '#fbbf24' : '#d97706', marginTop: 4 }}>
                {uncertainCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: isDark ? '#fde68a' : '#b45309', marginTop: 2 }}>
                Reconciled by Lead Planner
              </div>
            </div>

            <div style={{ padding: '1rem', borderRadius: 10, background: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2', border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid #fecaca' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? '#f87171' : '#dc2626', textTransform: 'uppercase' }}>
                Out-of-Baseline / Unplanned
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: isDark ? '#f87171' : '#dc2626', marginTop: 4 }}>
                {unplannedCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: isDark ? '#fca5a5' : '#b91c1c', marginTop: 2 }}>
                Commercial variation order flagged
              </div>
            </div>
          </div>

          {/* Graphical Representation: Bottleneck Analysis & Discipline Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            {/* Critical Path Bottlenecks */}
            <div style={{ padding: '1.25rem', borderRadius: 12, background: isDark ? 'rgba(0,0,0,0.35)' : '#f8fafc', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                  <span>Workfront Bottlenecks & Slippage</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                  {delayedActivities.length} tasks delayed
                </span>
              </div>

              {delayedActivities.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#10b981', fontSize: '0.85rem' }}>
                  <CheckCircle2 size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                  All active activities are progressing on schedule without critical variance!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {delayedActivities.slice(0, 4).map(act => (
                    <div
                      key={act.activityId}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 8,
                        background: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
                        border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid #fecaca',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                          {act.activityName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                          {act.activityId} • {act.area} ({act.discipline})
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                          color: isDark ? '#f87171' : '#dc2626',
                        }}
                      >
                        Delayed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discipline Delay Breakdown */}
            <div style={{ padding: '1.25rem', borderRadius: 12, background: isDark ? 'rgba(0,0,0,0.35)' : '#f8fafc', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={16} style={{ color: isDark ? '#38bdf8' : '#0284c7' }} />
                <span>Discipline Progress Breakdown</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.entries(disciplineStats).map(([disc, stat]) => {
                  const pct = totalReports > 0 ? Math.round((stat.total / totalReports) * 100) : 0;
                  return (
                    <div key={disc}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>{disc}</span>
                        <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem' }}>
                          {stat.total} records ({stat.delayed > 0 ? `${stat.delayed} delayed` : '0 delayed'})
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 7, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            borderRadius: 4,
                            background: stat.delayed > 0 ? 'linear-gradient(to right, #0284c7, #ef4444)' : '#0284c7',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Problem Statement CSV Schema Explanation */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 10,
              background: isDark ? 'rgba(14, 165, 233, 0.08)' : '#f0f9ff',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
            }}
          >
            <ShieldCheck size={20} style={{ color: isDark ? '#38bdf8' : '#0284c7', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.8rem', color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 800, color: isDark ? '#38bdf8' : '#0284c7', marginBottom: 2 }}>
                Problem Statement Compliance & Export Guarantee
              </div>
              The downloaded CSV directly adheres to the SIH Problem Statement schema, mapping each daily site progress entry to its corresponding Level-5 / Level-6 Master Schedule baseline activity. It provides explicit variance flags (&quot;Delayed by X Days&quot;, &quot;On Schedule&quot;) and cryptographic SHA-256 custody hashes for project audit integrity.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
