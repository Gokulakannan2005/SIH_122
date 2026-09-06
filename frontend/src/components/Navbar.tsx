import React from 'react';
import { useProject } from '../context/ProjectContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  CalendarCheck,
  CheckSquare,
  UploadCloud,
  Download,
  RefreshCw,
  Database,
  Radio
} from 'lucide-react';
import { NavigationTab } from '../types';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    siteUpdates,
    schedule,
    matchResults,
    plannerDecisions,
    backendStatus,
    loadDemoData,
    exportAlignmentCSV,
    isLoading,
  } = useProject();

  // Pending review items count
  const pendingReviewCount = siteUpdates.filter(update => {
    const match = matchResults[update.id];
    const decision = plannerDecisions[update.id];
    if (decision && decision.status === 'approved') return false;
    return match && (match.category === 'review' || match.category === 'unplanned');
  }).length;

  const tabs: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number | string; badgeType?: 'warning' | 'neutral' }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={15} />,
    },
    {
      id: 'site-updates',
      label: 'Site Updates',
      icon: <FileSpreadsheet size={15} />,
      badge: siteUpdates.length,
      badgeType: 'neutral',
    },
    {
      id: 'schedule-activities',
      label: 'Schedule Activities',
      icon: <CalendarCheck size={15} />,
      badge: schedule.length,
      badgeType: 'neutral',
    },
    {
      id: 'planner-review',
      label: 'Planner Review',
      icon: <CheckSquare size={15} />,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
      badgeType: 'warning',
    },
    {
      id: 'upload',
      label: 'Data & Ingestion',
      icon: <UploadCloud size={15} />,
    },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand & System Metadata */}
        <div className="brand-section">
          <div className="brand-logo">
            <Radio size={18} />
          </div>
          <div>
            <div className="brand-title">
              <span>Datum</span>
              <span className="brand-badge">L5/L6</span>
            </div>
            <div className="brand-subtitle">
              The record of execution.
            </div>
          </div>
        </div>

        {/* Backend Status Live Badge */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {backendStatus === 'connected' ? (
            <div
              className="mono-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--status-ready-bg)',
                borderColor: 'var(--status-ready-border)',
                color: 'var(--status-ready-fg)',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '3px 8px',
              }}
              title="Connected to Express REST API & embedded SQLite database"
            >
              <Database size={12} />
              <span>SQLite Engine Active</span>
            </div>
          ) : backendStatus === 'checking' ? (
            <div
              className="mono-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.72rem',
                padding: '3px 8px',
              }}
            >
              <RefreshCw size={11} className="spin" />
              <span>Checking System...</span>
            </div>
          ) : (
            <div
              className="mono-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                padding: '3px 8px',
              }}
              title="Running in client-side in-memory mode"
            >
              <span>Client Mode</span>
            </div>
          )}
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="nav-tabs">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className="badge"
                    style={{
                      background:
                        tab.badgeType === 'warning'
                          ? 'var(--status-review-bg)'
                          : isActive
                          ? 'var(--brand-surface)'
                          : 'var(--bg-app)',
                      color:
                        tab.badgeType === 'warning'
                          ? 'var(--status-review-fg)'
                          : 'var(--text-secondary)',
                      border:
                        tab.badgeType === 'warning'
                          ? '1px solid var(--status-review-border)'
                          : '1px solid var(--border-subtle)',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Global Action Toolbar */}
        <div className="nav-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={exportAlignmentCSV}
            title="Download CSV report of aligned schedule & site progress"
            type="button"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => loadDemoData()}
            disabled={isLoading}
            title="Reload baseline benchmark datasets"
            type="button"
          >
            <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
            <span>{isLoading ? 'Reloading...' : 'Reload Demo'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
