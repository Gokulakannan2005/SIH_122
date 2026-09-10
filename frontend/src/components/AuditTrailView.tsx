import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Hash,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const {
    auditLogs,
    siteUpdates,
    schedule,
    matchResults,
    plannerDecisions,
    exportAlignmentCSV,
    setSelectedAuditUpdateId,
    setActiveTab,
  } = useProject();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (selectedActionFilter !== 'ALL' && !log.action.toLowerCase().includes(selectedActionFilter.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.rawText.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          (log.finalActivityId && log.finalActivityId.toLowerCase().includes(q)) ||
          (log.plannerNote && log.plannerNote.toLowerCase().includes(q)) ||
          (log.userName && log.userName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [auditLogs, selectedActionFilter, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="banner-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.08))', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <ShieldCheck size={20} style={{ color: '#10b981' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Immutable Audit Trail & Decision Provenance
              </h2>
              <span className="badge badge-success">Cryptographically Verifiable</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '800px', lineHeight: 1.5 }}>
              Every field update, AI hybrid match, confidence score, and human planner verification is logged chronologically to ensure complete regulatory traceability and dispute resolution.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={exportAlignmentCSV}
            style={{ fontWeight: 700 }}
          >
            <Download size={14} />
            <span>Export Audit Log (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search audit records by text, activity ID, user, or note..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Filter Action:</span>
            <select
              className="form-control"
              value={selectedActionFilter}
              onChange={e => setSelectedActionFilter(e.target.value)}
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.775rem' }}
            >
              <option value="ALL">All Actions ({auditLogs.length})</option>
              <option value="Approved">Approved Matches</option>
              <option value="Relink">Relinked Activities</option>
              <option value="Unplanned">Marked Unplanned</option>
              <option value="Auto">System Ingestion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline / Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} style={{ color: 'var(--brand-primary)' }} />
            <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Chronological Audit Ledger ({filteredLogs.length} Records)
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing full lineage: Input → Analysis → Decision → Schedule Update
          </span>
        </div>

        <div className="table-responsive">
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Timestamp</th>
                <th style={{ width: '150px' }}>Action & Authority</th>
                <th>Field Evidence & Raw Log</th>
                <th style={{ width: '130px' }}>AI Confidence</th>
                <th style={{ width: '200px' }}>Target Schedule Activity</th>
                <th style={{ width: '110px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
                  const update = siteUpdates.find(u => u.id === log.updateId);
                  const activity = schedule.find(a => a.activityId === log.finalActivityId);

                  return (
                    <tr key={log.id} style={{ transition: 'background 0.15s ease' }}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                            {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span className={`status-badge ${log.action.toLowerCase().includes('approved') ? 'ready' : log.action.toLowerCase().includes('unplanned') ? 'unplanned' : 'review'}`}>
                            {log.action}
                          </span>
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                            by {log.userName || log.userRole || 'Lead Planner'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ maxWidth: '420px' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
                            &ldquo;{log.rawText}&rdquo;
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Source: {log.sourceFile || update?.sourceFile || 'Site Log'} • {update?.area || 'Unit-01'}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <div className={`confidence-pill ${log.originalConfidence >= 80 ? 'high' : log.originalConfidence >= 50 ? 'medium' : 'low'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                            {log.originalConfidence}%
                          </div>
                        </div>
                      </td>

                      <td>
                        {activity ? (
                          <div>
                            <span className="code-badge" style={{ fontSize: '0.7rem' }}>{activity.activityId}</span>
                            <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                              {activity.activityName}
                            </div>
                            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                              WBS {activity.wbs}
                            </div>
                          </div>
                        ) : log.finalActivityId ? (
                          <span className="code-badge">{log.finalActivityId}</span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--status-unplanned-fg)', fontWeight: 700 }}>
                            ⚠ Out-of-Scope (Unplanned)
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedAuditUpdateId(log.updateId)}
                          style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem' }}
                        >
                          <span>Inspect</span>
                          <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No audit records match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
