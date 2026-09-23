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
      {/* Top Clean Header */}
      <div
        className="card"
        style={{
          padding: '1.15rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          borderLeft: '4px solid #10b981',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Cryptographic Audit Trail & Decision Provenance
              </h2>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                SHA-256 Ledger
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Chronological provenance tracking with live system timestamps and planner authority verification.
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={exportAlignmentCSV}
          style={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0.55rem 1.15rem',
            borderRadius: 8,
          }}
        >
          <Download size={15} />
          <span>Export Audit Log (CSV)</span>
        </button>
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
          <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)' }}>
                <th style={{ width: '140px', padding: '12px 16px', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Timestamp</th>
                <th style={{ width: '160px', padding: '12px 16px', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Action & Authority</th>
                <th style={{ padding: '12px 16px', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Field Evidence & Raw Log</th>
                <th style={{ width: '110px', padding: '12px 16px', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>AI Confidence</th>
                <th style={{ width: '220px', padding: '12px 16px', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Target Schedule Activity</th>
                <th style={{ width: '90px', padding: '12px 16px', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
                  const update = siteUpdates.find(u => u.id === log.updateId);
                  const activity = schedule.find(a => a.activityId === log.finalActivityId);

                  return (
                    <tr key={log.id} style={{ transition: 'background 0.15s ease', borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {new Date(log.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className={`status-badge ${log.action.toLowerCase().includes('approved') ? 'ready' : log.action.toLowerCase().includes('unplanned') ? 'unplanned' : 'review'}`}>
                            {log.action}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            by {log.userName || log.userRole || 'Lead Planner'}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ maxWidth: '420px' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
                            &ldquo;{log.rawText}&rdquo;
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Source: {log.sourceFile || update?.sourceFile || 'Site Log'} • {update?.area || 'Unit-01'}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <div className={`confidence-pill ${log.originalConfidence >= 80 ? 'high' : log.originalConfidence >= 50 ? 'medium' : 'low'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                            {log.originalConfidence}%
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
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

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
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
