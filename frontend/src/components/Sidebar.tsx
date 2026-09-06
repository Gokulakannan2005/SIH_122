import React from 'react';
import { useProject } from '../context/ProjectContext';
import {
  LayoutDashboard,
  Radio,
  FileCheck2,
  CalendarDays,
  Sparkles,
  UploadCloud,
  Camera,
  ShieldCheck,
  HardHat,
  Wifi,
  WifiOff,
  Layers
} from 'lucide-react';
import { NavigationTab } from '../types';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentRole,
    setCurrentRole,
    offlineMode,
    toggleOfflineMode,
    siteUpdates,
    schedule,
    offlineSyncQueue,
    plannerDecisions,
  } = useProject();

  const handleTabClick = (tab: NavigationTab) => {
    setActiveTab(tab);
  };

  const pendingReviewCount = siteUpdates.filter(
    u => !plannerDecisions[u.id] || plannerDecisions[u.id]?.status === 'unplanned'
  ).length;

  return (
    <aside className="app-sidebar">
      {/* Sidebar Header & Brand */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <Layers size={18} />
          </div>
          <div>
            <div className="sidebar-brand-title">
              <span>Datum</span>
              <span className="sidebar-brand-badge">L5/L6</span>
            </div>
            <div className="sidebar-brand-subtitle">The record of execution.</div>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="sidebar-role-toggle">
          <button
            type="button"
            className={`sidebar-role-btn ${currentRole === 'admin' ? 'active' : ''}`}
            onClick={() => setCurrentRole('admin')}
            title="Full Enterprise Planner & Control Room Access"
          >
            <ShieldCheck size={13} />
            <span>Admin</span>
          </button>
          <button
            type="button"
            className={`sidebar-role-btn ${currentRole === 'supervisor' ? 'active' : ''}`}
            onClick={() => {
              setCurrentRole('supervisor');
              setActiveTab('supervisor-entry');
            }}
            title="Simplified Field Supervisor Quick-Entry Mode"
          >
            <HardHat size={13} />
            <span>Supervisor</span>
          </button>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {/* Field & Operational Group */}
        <div>
          <div className="sidebar-group-title">Field Operations</div>
          <div className="sidebar-group-items">
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'supervisor-entry' ? 'active' : ''}`}
              onClick={() => handleTabClick('supervisor-entry')}
            >
              <Camera size={16} />
              <span>Field Daily Entry</span>
              {offlineSyncQueue.length > 0 && (
                <span
                  className="sidebar-item-badge"
                  style={{ background: '#fff4e5', color: '#974f0c' }}
                >
                  {offlineSyncQueue.length} queued
                </span>
              )}
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeTab === 'site-updates' ? 'active' : ''}`}
              onClick={() => handleTabClick('site-updates')}
            >
              <Radio size={16} />
              <span>Site Event Stream</span>
              <span
                className="sidebar-item-badge"
                style={{ background: '#f1f2f4', color: '#44546f' }}
              >
                {siteUpdates.length}
              </span>
            </button>
          </div>
        </div>

        {/* Project Control & Reconciliation Group */}
        <div>
          <div className="sidebar-group-title">Control & Engine</div>
          <div className="sidebar-group-items">
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleTabClick('dashboard')}
            >
              <LayoutDashboard size={16} />
              <span>Control Room</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeTab === 'planner-review' ? 'active' : ''}`}
              onClick={() => handleTabClick('planner-review')}
            >
              <FileCheck2 size={16} />
              <span>Match Matrix</span>
              {pendingReviewCount > 0 && (
                <span
                  className="sidebar-item-badge"
                  style={{ background: '#e9f2ff', color: '#0c66e4' }}
                >
                  {pendingReviewCount}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeTab === 'schedule-activities' ? 'active' : ''}`}
              onClick={() => handleTabClick('schedule-activities')}
            >
              <CalendarDays size={16} />
              <span>Activity Master</span>
              <span
                className="sidebar-item-badge"
                style={{ background: '#f1f2f4', color: '#44546f' }}
              >
                {schedule.length}
              </span>
            </button>
          </div>
        </div>

        {/* Intelligence & Data Group */}
        <div>
          <div className="sidebar-group-title">AI & Data Pipeline</div>
          <div className="sidebar-group-items">
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'copilot' ? 'active' : ''}`}
              onClick={() => handleTabClick('copilot')}
            >
              <Sparkles size={16} style={{ color: '#0c66e4' }} />
              <span>AI Copilot & Sim</span>
              <span
                className="sidebar-item-badge"
                style={{ background: '#dcfff1', color: '#1f845a' }}
              >
                AI
              </span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => handleTabClick('upload')}
            >
              <UploadCloud size={16} />
              <span>Batch Ingestion</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Offline Simulator Switch */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.4rem 0.5rem',
            background: offlineMode ? '#fff4e5' : '#f7f8f9',
            border: `1px solid ${offlineMode ? '#fec195' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {offlineMode ? (
              <WifiOff size={14} style={{ color: '#974f0c' }} />
            ) : (
              <Wifi size={14} style={{ color: '#1f845a' }} />
            )}
            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                color: offlineMode ? '#974f0c' : '#1f845a',
              }}
            >
              {offlineMode ? 'Offline Mode' : 'Cloud Sync Live'}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleOfflineMode}
            style={{
              border: 'none',
              background: offlineMode ? '#974f0c' : '#0c66e4',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 'var(--radius-xs)',
              cursor: 'pointer',
            }}
          >
            {offlineMode ? 'Go Online' : 'Simulate Offline'}
          </button>
        </div>

        {/* Engine status text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.675rem',
            color: 'var(--text-muted)',
            paddingTop: '0.2rem',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#1f845a',
                display: 'inline-block',
              }}
            />
            NLP / Spatial Matched
          </span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>v2.4 Standalone</span>
        </div>
      </div>
    </aside>
  );
};
