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
  Building2,
  Database,
  Wifi,
  WifiOff
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
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: 'site-updates',
      label: 'Site Updates',
      icon: <FileSpreadsheet size={16} />,
      badge: siteUpdates.length,
      badgeType: 'neutral',
    },
    {
      id: 'schedule-activities',
      label: 'Schedule Activities',
      icon: <CalendarCheck size={16} />,
      badge: schedule.length,
      badgeType: 'neutral',
    },
    {
      id: 'planner-review',
      label: 'Planner Review',
      icon: <CheckSquare size={16} />,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
      badgeType: 'warning',
    },
    {
      id: 'upload',
      label: 'Upload / Demo Data',
      icon: <UploadCloud size={16} />,
    },
  ];

  return (
    <header className="navbar" style={{ borderBottom: '1px solid #1e293b' }}>
      <div className="navbar-inner">
        {/* Brand & System Metadata */}
        <div className="brand-section">
          <div className="brand-logo" style={{ background: '#2563eb', color: '#ffffff' }}>
            <Building2 size={22} />
          </div>
          <div>
            <div className="brand-title">
              ProjectPulse <span style={{ fontSize: '0.72rem', background: '#3b82f6', color: 'white', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>SIH 2026</span>
            </div>
            <div className="brand-subtitle">
              L5/L6 Progress Tracking & Schedule Linking Platform
            </div>
          </div>
        </div>

        {/* Backend Status Live Badge */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {backendStatus === 'connected' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#064e3b',
                border: '1px solid #059669',
                color: '#a7f3d0',
                fontSize: '0.725rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                letterSpacing: '0.02em',
              }}
              title="Connected to Express REST API & embedded SQLite database (backend/database.sqlite)"
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
              <Database size={13} />
              <span>Backend: SQLite Online</span>
            </div>
          ) : backendStatus === 'checking' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#1e293b',
                border: '1px solid #475569',
                color: '#94a3b8',
                fontSize: '0.725rem',
                padding: '3px 10px',
                borderRadius: '999px',
              }}
            >
              <RefreshCw size={12} className="spin" />
              <span>Checking Backend...</span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#334155',
                border: '1px solid #475569',
                color: '#e2e8f0',
                fontSize: '0.725rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '999px',
              }}
              title="Backend offline — running in standalone client in-memory mode"
            >
              <WifiOff size={13} />
              <span>Client Mode (Standalone)</span>
            </div>
          )}
        </div>

        {/* 5 Primary Navigation Tabs */}
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
                      background: tab.badgeType === 'warning' ? '#d97706' : (isActive ? '#2563eb' : 'rgba(255,255,255,0.2)'),
                      color: '#ffffff',
                      fontWeight: tab.badgeType === 'warning' ? 700 : 500,
                      padding: '1px 6px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
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
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => loadDemoData()}
            disabled={isLoading}
            title="Reload baseline benchmark datasets"
            type="button"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            <span>{isLoading ? 'Reloading...' : 'Reload Demo'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
