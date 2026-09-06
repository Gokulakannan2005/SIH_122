import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Download,
  RotateCcw,
  ShieldCheck,
  HardHat,
  ChevronRight,
  Database,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { NavigationTab } from '../types';

export const AppHeader: React.FC = () => {
  const {
    activeTab,
    currentRole,
    setCurrentRole,
    setActiveTab,
    exportAlignmentCSV,
    loadDemoData,
    siteUpdates,
    matchResults,
  } = useProject();

  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const getTabTitle = (tab: NavigationTab): string => {
    switch (tab) {
      case 'dashboard':
        return 'Project Control Center';
      case 'site-updates':
        return 'Daily Field Reports Feed';
      case 'schedule-activities':
        return 'Milestone Baseline (L5/L6)';
      case 'planner-review':
        return 'AI Auto-Match Matrix';
      case 'supervisor-entry':
        return 'Field Progress & Photo Logs';
      case 'copilot':
        return 'AI Predictive Risk & Copilot';
      case 'upload':
        return 'Data Ingestion & Schemas';
      default:
        return 'Datum — The record of execution.';
    }
  };

  const handleResetClick = async () => {
    await loadDemoData();
    setResetSuccess('Demo baseline reset! Pristine schedule, reports, and photos restored.');
    setTimeout(() => setResetSuccess(null), 4000);
  };

  const handleRoleToggle = () => {
    const nextRole = currentRole === 'admin' ? 'supervisor' : 'admin';
    setCurrentRole(nextRole);
    if (nextRole === 'supervisor') {
      if (activeTab === 'planner-review' || activeTab === 'dashboard' || activeTab === 'upload') {
        setActiveTab('supervisor-entry');
      }
    }
  };

  // Compute live match stats
  const totalCount = siteUpdates.length;
  const readyCount = siteUpdates.filter(u => matchResults[u.id]?.category === 'ready').length;
  const highConfPct = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  return (
    <>
      <header className="app-header">
        {/* Breadcrumb & Section Name */}
        <div className="header-breadcrumb">
          <span style={{ color: 'var(--text-muted)' }}>Datum</span>
          <ChevronRight size={14} style={{ color: 'var(--border-strong)' }} />
          <span className="header-breadcrumb-current">{getTabTitle(activeTab)}</span>
        </div>

        {/* Global Actions and Indicators */}
        <div className="header-actions">
          {/* Role Switcher Pill */}
          <button
            type="button"
            onClick={handleRoleToggle}
            className="mono-pill"
            style={{
              cursor: 'pointer',
              background: currentRole === 'admin' ? '#e0f2fe' : '#ecfdf5',
              color: currentRole === 'admin' ? '#0284c7' : '#047857',
              borderColor: currentRole === 'admin' ? '#bae6fd' : '#a7f3d0',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              fontWeight: 700,
            }}
            title="Click to toggle user role"
          >
            {currentRole === 'admin' ? <ShieldCheck size={13} /> : <HardHat size={13} />}
            <span>{currentRole === 'admin' ? 'Lead Planner Mode' : 'Supervisor Mode'}</span>
          </button>

          {/* Live Confidence Index */}
          <div
            className="mono-pill"
            style={{
              background: '#f8fafc',
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
            }}
          >
            <CheckCircle2 size={13} style={{ color: '#047857' }} />
            <span>Auto-Match: </span>
            <strong style={{ color: '#047857' }}>
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
            onClick={handleResetClick}
            title="Reset dataset to fresh baseline"
          >
            <RotateCcw size={13} />
            <span>Restart Demo</span>
          </button>
        </div>
      </header>

      {/* Reset Demo Toast Notification */}
      {resetSuccess && (
        <div
          style={{
            position: 'fixed',
            top: 60,
            right: 24,
            background: '#ecfdf5',
            border: '1px solid #6ee7b7',
            color: '#047857',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            zIndex: 9999,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{resetSuccess}</span>
        </div>
      )}
    </>
  );
};
