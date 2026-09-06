import React from 'react';
import { useProject } from '../context/ProjectContext';
import {
  X,
  Calendar,
  Clock,
  Layers,
  MapPin,
  Tag,
  CheckCircle2,
  AlertTriangle,
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
    setSelectedReviewUpdateId,
    setActiveTab,
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
        style={{ maxWidth: 620 }}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: '#93c5fd' }}>
                {activity.activityId}
              </span>
              <span className="mono-pill" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'transparent' }}>
                WBS {activity.wbs}
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4 }}>
              {activity.activityName}
            </h3>
          </div>

          <button
            onClick={() => setSelectedScheduleActivityId(null)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="drawer-body">
          {/* Status & Variance Overview Card */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
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

            <div className="progress-bar-container" style={{ marginBottom: '0.75rem', height: 8 }}>
              <div
                className={`progress-bar-fill ${
                  activity.status === 'Completed' ? 'green' : activity.status === 'In Progress' ? 'blue' : 'red'
                }`}
                style={{ width: `${activity.progressPercent || 0}%` }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Discipline</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{activity.discipline}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Area Location</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{activity.area}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Schedule Variance</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: isDelayed ? '#dc2626' : '#15803d' }}>
                  {variance > 0 ? `+${variance} Days Delay` : '0 Days (On-Track)'}
                </div>
              </div>
            </div>
          </div>

          {/* Planned vs Actual Timeline */}
          <div className="card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} style={{ color: '#2563eb' }} />
              Planned Baseline vs Actual Site Evidence
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Planned Window</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                  {activity.plannedStart} &rarr; {activity.plannedFinish}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Actual Site Window</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: activity.actualStart ? '#15803d' : '#94a3b8', marginTop: 3 }}>
                  {activity.actualStart ? `${activity.actualStart} \u2192 ${activity.actualFinish || 'In Progress'}` : 'No Site Activity Logged'}
                </div>
              </div>
            </div>
          </div>

          {/* Recognized Aliases & Keywords */}
          <div className="card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Tag size={16} style={{ color: '#2563eb' }} />
              Recognized Search Aliases & Matching Keywords
            </h4>
            <p style={{ fontSize: '0.775rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Synonyms and equipment tags used by the matching engine to pair supervisor field text with this activity:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {activity.aliases && activity.aliases.length > 0 ? (
                activity.aliases.map((alias, i) => (
                  <span key={i} className="mono-pill" style={{ background: '#f8fafc', padding: '0.25rem 0.65rem' }}>
                    {alias}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No aliases specified</span>
              )}
            </div>
          </div>

          {/* Linked Site Progress Updates */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} style={{ color: '#15803d' }} />
                Linked Site Progress Updates ({linkedUpdates.length})
              </h4>
            </div>

            {linkedUpdates.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No site updates currently linked to this activity.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {linkedUpdates.map(u => {
                  const match = matchResults[u.id];
                  return (
                    <div
                      key={u.id}
                      style={{
                        padding: '0.75rem',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="mono-pill" style={{ color: '#2563eb', fontWeight: 700 }}>
                            {u.id}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
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

                      <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#0f172a' }}>
                        {u.extractedDescription}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, fontSize: '0.75rem', color: '#64748b' }}>
                        <span>
                          Source: {u.sourceFile} {u.lineEvidence ? `(#${u.lineEvidence})` : ''}
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                          onClick={() => {
                            setSelectedScheduleActivityId(null);
                            setSelectedInspectorUpdateId(u.id);
                          }}
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
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
