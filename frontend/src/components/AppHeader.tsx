import React from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Download,
  RotateCcw,
  ShieldCheck,
  HardHat,
  ChevronRight,
  Database,
  Sparkles
} from 'lucide-react';
import { NavigationTab } from '../types';

export const AppHeader: React.FC = () => {
  const {
    activeTab,
    currentRole,
    setCurrentRole,
    exportAlignmentCSV,
    loadDemoData,
    siteUpdates,
    matchResults,
    offlineMode,
  } = useProject();

  const getTabInfo = (tab: NavigationTab): { title: string; subtitle: string } => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Project Control Room',
          subtitle: 'KPIs, Reconciliation Overview, and Daily Trend Analysis',
        };
      case 'site-updates':
        return {
          title: 'Site Event Stream',
          subtitle: 'Supervisor Daily Field Log Events and Status Kanban',
        };
      case 'schedule-activities':
        return {
          title: 'Schedule Activity Master',
          subtitle: 'L5 / L6 Milestone Hierarchy and Schedule Baseline',
        };
      case 'planner-review':
        return {
          title: 'Planner Match Matrix',
          subtitle: 'Confidence-Scored Match Candidates, AI Overrides, and Approvals',
        };
      case 'supervisor-entry':
        return {
          title: 'Field Supervisor Daily Portal',
          subtitle: 'Daily Progress Note, CSV / XLSX Dropzone, and Completion Photo Studio',
        };
      case 'copilot':
        return {
          title: 'AI Copilot & Delay Risk Simulator',
          subtitle: 'Predictive Milestone Delay Forecasting & Provenance Audit',
        };
      case 'upload':
        return {
          title: 'Batch Schema & Ingestion Portal',
          subtitle: 'Import Custom CSV / XLSX Data Streams with Multi-Factor Ingestion',
        };
      default:
        return { title: 'Datum', subtitle: 'The record of execution.' };
    }
  };

  const tabInfo = getTabInfo(activeTab);

  // Compute live match stats
  const totalCount = siteUpdates.length;
  const readyCount = siteUpdates.filter(u => matchResults[u.id]?.category === 'ready').length;
  const highConfPct = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  return (
    <header className="app-header">
      {/* Breadcrumb & Section Name */}
      <div className="header-breadcrumb">
        <span style={{ color: 'var(--text-muted)' }}>Datum</span>
        <ChevronRight size={14} style={{ color: 'var(--border-strong)' }} />
        <span className="header-breadcrumb-current">{tabInfo.title}</span>
      </div>

      {/* Global Actions and Indicators */}
      <div className="header-actions">
        {/* Role Switcher Pill */}
        <button
          type="button"
          onClick={() => setCurrentRole(currentRole === 'admin' ? 'supervisor' : 'admin')}
          className="mono-pill"
          style={{
            cursor: 'pointer',
            background: currentRole === 'admin' ? '#e9f2ff' : '#dcfff1',
            color: currentRole === 'admin' ? '#0c66e4' : '#1f845a',
            borderColor: currentRole === 'admin' ? '#cce0ff' : '#7ee2b8',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          title="Click to toggle user role"
        >
          {currentRole === 'admin' ? <ShieldCheck size={12} /> : <HardHat size={12} />}
          <span>{currentRole === 'admin' ? 'Admin / Lead Planner' : 'Supervisor Mode'}</span>
        </button>

        {/* Live Confidence Index */}
        <div
          className="mono-pill"
          style={{
            background: '#f1f2f4',
            color: 'var(--text-secondary)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <span>Auto-Match: </span>
          <strong style={{ color: '#1f845a' }}>
            {highConfPct}% High Conf
          </strong>
        </div>

        {/* Export CSV */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={exportAlignmentCSV}
          title="Export complete execution log to CSV"
        >
          <Download size={13} />
          <span>Export CSV</span>
        </button>

        {/* Reload Demo */}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={loadDemoData}
          title="Reset dataset to fresh SIH 122 sample baseline"
        >
          <RotateCcw size={13} />
          <span>Reset Demo</span>
        </button>
      </div>
    </header>
  );
};
