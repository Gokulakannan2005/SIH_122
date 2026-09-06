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
          <div style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
            <ShieldCheck size={22} style={{ color: '#93c5fd' }} />
            Decision Audit Trail & Provenance History
          </div>
          <button
            onClick={() => setSelectedAuditUpdateId(null)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Source Evidence Card */}
          <div className="card" style={{ background: '#ffffff', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
              📄 Original Source Evidence: <b>{update?.sourceFile}</b> (Line/Row #{update?.lineEvidence})
            </div>
            <div className="raw-code-box">
              &ldquo;{update?.rawText}&rdquo;
            </div>
            <div style={{ fontSize: '0.825rem', color: '#334155', marginTop: '6px' }}>
              Extracted Description: <b>&ldquo;{update?.extractedDescription}&rdquo;</b> | Discipline: <b>{update?.discipline}</b> | Area: <b>{update?.area}</b>
            </div>
          </div>

          {/* Match Algorithm Output Card */}
          {match && (
            <div className="card" style={{ padding: '1rem', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>Deterministic Match Engine Output</span>
                <span className={`status-badge ${match.category}`}>
                  {match.confidenceScore}% Confidence Score
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.5rem' }}>
                <b>Top Candidate Match:</b> {match.candidateActivityId || 'None'}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                <b>Logged Match Reasons:</b>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '4px' }}>
                  {match.matchReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Final Linked Schedule Activity */}
          <div className="card" style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 800, marginBottom: '4px' }}>
              🎯 Current Baseline Schedule Link Status:
            </div>
            {finalActivityObj ? (
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                  [{finalActivityObj.activityId}] {finalActivityObj.activityName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '2px' }}>
                  WBS {finalActivityObj.wbs} | Planned: {finalActivityObj.plannedStart} to {finalActivityObj.plannedFinish}
                </div>
              </div>
            ) : (
              <div style={{ color: '#be123c', fontSize: '0.85rem', fontWeight: 700 }}>
                Categorized as New / Unplanned Activity (Not linked to baseline)
              </div>
            )}
          </div>

          {/* Immutable Audit Log History */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Action Provenance Logs ({logs.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {logs.map(log => (
                <div
                  key={log.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.825rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 800, color: '#2563eb' }}>{log.action}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {log.plannerNote && (
                    <div style={{ color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
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
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAuditUpdateId(null)}>
            Close Audit History
          </button>
        </div>
      </div>
    </div>
  );
};
