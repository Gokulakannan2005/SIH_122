import React from 'react';
import { useProject } from '../context/ProjectContext';
import {
  X,
  Calendar,
  Tag,
  FileText,
  ChevronRight
} from 'lucide-react';

export const ScheduleActivityDrawer: React.FC = () => {
  const {
    enrichedSchedule,
    siteUpdates,
    plannerDecisions,
    matchResults,
    selectedScheduleActivityId,
    setSelectedScheduleActivityId,
    setSelectedInspectorUpdateId,
  } = useProject();

  if (!selectedScheduleActivityId) return null;

  const activity = enrichedSchedule.find(a => a.activityId === selectedScheduleActivityId);
  if (!activity) return null;

  // Find all linked updates for this activity
  const linkedUpdates = siteUpdates.filter(u => {
    const dec = plannerDecisions[u.id];
    if (dec && dec.linkedActivityId) {
      return dec.linkedActivityId === activity.activityId && dec.status !== 'rejected';
    }
    const match = matchResults[u.id];
    return match?.category === 'ready' && match.candidateActivityId === activity.activityId;
  });

  const variance = activity.varianceDays || 0;
  const isDelayed = variance > 0 || activity.status === 'Delayed';

  return (
    <div
      className="drawer-backdrop"
      onClick={() => setSelectedScheduleActivityId(null)}
    >
      <div
        className="drawer-pane"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 580 }}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--brand-primary)' }}>
                {activity.activityId}
              </span>
              <span className="mono-pill">
                WBS {activity.wbs}
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>
              {activity.activityName}
            </h3>
          </div>

          <button
            onClick={() => setSelectedScheduleActivityId(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="drawer-body">
          {/* Status & Variance Overview Card */}
          <div className="card" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Schedule Performance
              </span>
              <span
                className={`status-badge ${
                  activity.status === 'Completed'
                    ? 'ready'
                    : activity.status === 'In Progress'
                    ? 'review'
                    : activity.status === 'Delayed'
                    ? 'unplanned'
                    : 'rejected'
                }`}
              >
                {activity.status}
              </span>
            </div>

            <div className="progress-bar-container" style={{ marginBottom: '0.75rem', height: 6 }}>
              <div
                className={`progress-bar-fill ${
                  activity.status === 'Completed' ? 'green' : activity.status === 'In Progress' ? 'blue' : 'red'
                }`}
                style={{ width: `${activity.progressPercent || 0}%` }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.45rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Discipline</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{activity.discipline}</div>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.45rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Area</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{activity.area}</div>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.45rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Schedule Variance</div>
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: isDelayed ? 'var(--status-unplanned-fg)' : 'var(--status-ready-fg)' }}>
                  {variance > 0 ? `+${variance}d Delay` : '0d On-Track'}
                </div>
              </div>
            </div>
          </div>

          {/* Planned vs Actual Timeline */}
          <div className="card" style={{ padding: '0.85rem 1rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={14} style={{ color: 'var(--brand-primary)' }} />
              Planned Baseline vs Actual Site Evidence
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '0.5rem' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>Planned Window</div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {activity.plannedStart} &rarr; {activity.plannedFinish}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>Actual Site Window</div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: activity.actualStart ? 'var(--status-ready-fg)' : 'var(--text-subtle)', marginTop: 2 }}>
                  {activity.actualStart ? `${activity.actualStart} \u2192 ${activity.actualFinish || 'In Progress'}` : 'No Site Activity Logged'}
                </div>
              </div>
            </div>
          </div>

          {/* Recognized Aliases & Keywords */}
          <div className="card" style={{ padding: '0.85rem 1rem' }}>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tag size={14} style={{ color: 'var(--brand-primary)' }} />
              Recognized Search Aliases & Matching Keywords
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
              Synonyms and equipment tags used by the matching engine to pair supervisor field text with this activity:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {activity.aliases && activity.aliases.length > 0 ? (
                activity.aliases.map((alias, i) => (
                  <span key={i} className="mono-pill" style={{ padding: '0.2rem 0.55rem' }}>
                    {alias}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.775rem', color: 'var(--text-subtle)' }}>No aliases specified</span>
              )}
            </div>
          </div>

          {/* Linked Site Progress Updates */}
          <div className="card" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={14} style={{ color: 'var(--status-ready-fg)' }} />
                Linked Site Progress Updates ({linkedUpdates.length})
              </h4>
            </div>

            {linkedUpdates.length === 0 ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                No site updates currently linked to this activity.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {linkedUpdates.map(u => {
                  return (
                    <div
                      key={u.id}
                      style={{
                        padding: '0.65rem 0.75rem',
                        background: 'var(--bg-surface-secondary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-xs)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span className="mono-pill" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                            {u.id}
                          </span>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {u.reportDate}
                          </span>
                        </div>
                        <span
                          className={`status-badge ${
                            u.eventStatus === 'Completed' ? 'ready' : u.eventStatus === 'In Progress' ? 'review' : 'rejected'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {u.eventStatus}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {u.extractedDescription}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        <span>
                          Source: {u.sourceFile} {u.lineEvidence ? `(#${u.lineEvidence})` : ''}
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 7px', fontSize: '0.675rem' }}
                          onClick={() => {
                            setSelectedScheduleActivityId(null);
                            setSelectedInspectorUpdateId(u.id);
                          }}
                          type="button"
                        >
                          <span>Inspect</span>
                          <ChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedScheduleActivityId(null)}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
