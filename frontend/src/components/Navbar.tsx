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
  Radio,
  Camera,
  Sparkles,
  User,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react';
import { NavigationTab, UserRole } from '../types';

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
    currentRole,
    setCurrentRole,
    offlineMode,
    toggleOfflineMode,
    offlineSyncQueue,
    syncOfflineQueue,
  } = useProject();

  // Pending review items count
  const pendingReviewCount = siteUpdates.filter(update => {
    const match = matchResults[update.id];
    const decision = plannerDecisions[update.id];
    if (decision && decision.status === 'approved') return false;
    return match && (match.category === 'review' || match.category === 'unplanned');
  }).length;

  // Tabs configured by User Role
  const adminTabs: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number | string; badgeType?: 'warning' | 'neutral' }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={14} />,
    },
    {
      id: 'site-updates',
      label: 'Site Updates',
      icon: <FileSpreadsheet size={14} />,
      badge: siteUpdates.length,
      badgeType: 'neutral',
    },
    {
      id: 'schedule-activities',
      label: 'Schedule Activities',
      icon: <CalendarCheck size={14} />,
      badge: schedule.length,
      badgeType: 'neutral',
    },
    {
      id: 'planner-review',
      label: 'Planner Review',
      icon: <CheckSquare size={14} />,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
      badgeType: 'warning',
    },
    {
      id: 'copilot',
      label: 'AI Copilot & Delay Sim',
      icon: <Sparkles size={14} />,
    },
    {
      id: 'upload',
      label: 'Data Ingestion',
      icon: <UploadCloud size={14} />,
    },
  ];

  const supervisorTabs: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number | string; badgeType?: 'warning' | 'neutral' }[] = [
    {
      id: 'supervisor-entry',
      label: 'Field Entry & Photos',
      icon: <Camera size={14} />,
    },
    {
      id: 'site-updates',
      label: 'Site Updates Board',
      icon: <FileSpreadsheet size={14} />,
      badge: siteUpdates.length,
      badgeType: 'neutral',
    },
    {
      id: 'schedule-activities',
      label: 'Master Schedule',
      icon: <CalendarCheck size={14} />,
      badge: schedule.length,
      badgeType: 'neutral',
    },
    {
      id: 'dashboard',
      label: 'Progress Overview',
      icon: <LayoutDashboard size={14} />,
    },
  ];

  const visibleTabs = currentRole === 'admin' ? adminTabs : supervisorTabs;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand & System Metadata */}
        <div className="brand-section">
          <div className="brand-logo">
            <Radio size={16} />
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

        {/* Role Switcher Pill (Admin vs Field Supervisor) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
          }}
        >
          <button
            className={`btn btn-sm ${currentRole === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '2px 8px', fontSize: '0.725rem', border: 'none' }}
            onClick={() => {
              setCurrentRole('admin');
              if (activeTab === 'supervisor-entry') setActiveTab('dashboard');
            }}
            type="button"
          >
            <Shield size={12} />
            <span>Admin / Planner</span>
          </button>
          <button
            className={`btn btn-sm ${currentRole === 'supervisor' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '2px 8px', fontSize: '0.725rem', border: 'none' }}
            onClick={() => {
              setCurrentRole('supervisor');
              setActiveTab('supervisor-entry');
            }}
            type="button"
          >
            <User size={12} />
            <span>Supervisor Portal</span>
          </button>
        </div>

        {/* Offline Simulator Mode & Database Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="filter-pill"
            style={{
              background: offlineMode ? 'var(--status-review-bg)' : 'var(--bg-subtle)',
              color: offlineMode ? 'var(--status-review-fg)' : 'var(--text-secondary)',
              borderColor: offlineMode ? 'var(--status-review-border)' : 'var(--border-subtle)',
              fontSize: '0.72rem',
              padding: '2px 7px',
            }}
            onClick={toggleOfflineMode}
            title="Toggle between online REST database and offline field sync storage"
            type="button"
          >
            {offlineMode ? <WifiOff size={11} /> : <Wifi size={11} />}
            <span>{offlineMode ? 'Field Offline Mode' : 'Online'}</span>
          </button>

          {offlineSyncQueue.length > 0 && (
            <button
              className="btn btn-warning btn-sm"
              style={{ padding: '2px 7px', fontSize: '0.7rem' }}
              onClick={syncOfflineQueue}
              type="button"
            >
              <RefreshCw size={10} className={isLoading ? 'spin' : ''} />
              <span>Sync ({offlineSyncQueue.length})</span>
            </button>
          )}

          {!offlineMode && backendStatus === 'connected' && (
            <div
              className="mono-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--status-ready-bg)',
                borderColor: 'var(--status-ready-border)',
                color: 'var(--status-ready-fg)',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '2px 6px',
              }}
              title="Connected to SQLite REST API Engine"
            >
              <Database size={11} />
              <span>SQLite</span>
            </div>
          )}
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="nav-tabs">
          {visibleTabs.map(tab => {
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
            <Download size={12} />
            <span>Export CSV</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => loadDemoData()}
            disabled={isLoading}
            title="Reload baseline benchmark datasets"
            type="button"
          >
            <RefreshCw size={12} className={isLoading ? 'spin' : ''} />
            <span>{isLoading ? 'Loading...' : 'Reload Demo'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
