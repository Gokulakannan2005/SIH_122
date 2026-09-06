import React from 'react';
import { useProject } from '../context/ProjectContext';
import { ShieldCheck, X } from 'lucide-react';

export const AuditTrailModal: React.FC = () => {
  const {
    selectedAuditUpdateId,
    setSelectedAuditUpdateId,
    siteUpdates,
    schedule,
    matchResults,
    plannerDecisions,
    auditLogs,
  } = useProject();

  if (!selectedAuditUpdateId) return null;

  const update = siteUpdates.find(u => u.id === selectedAuditUpdateId);
  const match = matchResults[selectedAuditUpdateId];
  const decision = plannerDecisions[selectedAuditUpdateId];
  const logs = auditLogs.filter(a => a.updateId === selectedAuditUpdateId);

  const finalActivityId = decision ? decision.linkedActivityId : (match?.category === 'ready' ? match.candidateActivityId : null);
  const finalActivityObj = schedule.find(a => a.activityId === finalActivityId);

  return (
    <div className="modal-overlay" onClick={() => setSelectedAuditUpdateId(null)}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-primary)' }}>
            <ShieldCheck size={18} style={{ color: 'var(--brand-primary)' }} />
            Decision Audit Trail & Provenance History
          </div>
          <button
            onClick={() => setSelectedAuditUpdateId(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Source Evidence Card */}
          <div className="card" style={{ padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
              Original Source Evidence: {update?.sourceFile} (Line/Row #{update?.lineEvidence})
            </div>
            <div className="raw-code-box">
              &ldquo;{update?.rawText}&rdquo;
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
              Extracted: <strong>&ldquo;{update?.extractedDescription}&rdquo;</strong> | Discipline: <strong>{update?.discipline}</strong> | Area: <strong>{update?.area}</strong>
            </div>
          </div>

          {/* Match Algorithm Output Card */}
          {match && (
            <div className="card" style={{ padding: '0.85rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.825rem', color: 'var(--text-primary)' }}>Algorithm Output</span>
                <span className={`status-badge ${match.category}`}>
                  {match.confidenceScore}% Confidence Score
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                <strong>Candidate Match:</strong> {match.candidateActivityId || 'None'}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <strong>Match Reasons:</strong>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '3px' }}>
                  {match.matchReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Final Linked Schedule Activity */}
          <div
            className="card"
            style={{
              background: finalActivityObj ? 'var(--status-ready-bg)' : 'var(--status-unplanned-bg)',
              borderColor: finalActivityObj ? 'var(--status-ready-border)' : 'var(--status-unplanned-border)',
              padding: '0.85rem 1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: finalActivityObj ? 'var(--status-ready-fg)' : 'var(--status-unplanned-fg)', fontWeight: 800, marginBottom: '3px' }}>
              Schedule Link Status:
            </div>
            {finalActivityObj ? (
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  [{finalActivityObj.activityId}] {finalActivityObj.activityName}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  WBS {finalActivityObj.wbs} | Planned: {finalActivityObj.plannedStart} to {finalActivityObj.plannedFinish}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--status-unplanned-fg)', fontSize: '0.825rem', fontWeight: 700 }}>
                Categorized as Unplanned Activity (Out of baseline scope)
              </div>
            )}
          </div>

          {/* Immutable Audit Log History */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
              Action Provenance History ({logs.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {logs.map(log => (
                <div
                  key={log.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-xs)',
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.775rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>{log.action}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {log.plannerNote && (
                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                      Note: &ldquo;{log.plannerNote}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAuditUpdateId(null)} type="button">
            Close Audit History
          </button>
        </div>
      </div>
    </div>
  );
};
