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
  Layers,
  Activity,
  FileSpreadsheet
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
      {/* Sidebar Header & Industrial Branding */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <Layers size={18} />
          </div>
          <div>
            <div className="sidebar-brand-title">
              <span>Datum</span>
              <span className="sidebar-brand-badge">L5 / L6 ENGINE</span>
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
            title="Lead Project Planner & Admin Access"
          >
            <ShieldCheck size={13} />
            <span>Lead Planner</span>
          </button>
          <button
            type="button"
            className={`sidebar-role-btn ${currentRole === 'supervisor' ? 'active' : ''}`}
            onClick={() => {
              setCurrentRole('supervisor');
              setActiveTab('supervisor-entry');
            }}
            title="Site Supervisor Quick-Entry Portal"
          >
            <HardHat size={13} />
            <span>Site Supervisor</span>
          </button>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {/* Field Execution Section */}
        <div>
          <div className="sidebar-group-title">Field Operations</div>
          <div className="sidebar-group-items">
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'supervisor-entry' ? 'active' : ''}`}
              onClick={() => handleTabClick('supervisor-entry')}
            >
              <Camera size={16} />
              <span>Field Progress & Photo Logs</span>
              {offlineSyncQueue.length > 0 && (
                <span
                  className="sidebar-item-badge"
                  style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
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
              <span>Daily Field Reports Feed</span>
              <span
                className="sidebar-item-badge"
                style={{ background: '#f1f5f9', color: '#334155' }}
              >
                {siteUpdates.length}
              </span>
            </button>
          </div>
        </div>

        {/* Schedule & Alignment Section */}
        <div>
          <div className="sidebar-group-title">Schedule & Reconciliation</div>
          <div className="sidebar-group-items">
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleTabClick('dashboard')}
            >
              <LayoutDashboard size={16} />
              <span>Project Control Center</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeTab === 'planner-review' ? 'active' : ''}`}
              onClick={() => handleTabClick('planner-review')}
            >
              <FileCheck2 size={16} />
              <span>AI Auto-Match Matrix</span>
              {pendingReviewCount > 0 && (
                <span
                  className="sidebar-item-badge"
                  style={{ background: '#e9f2ff', color: '#0c66e4', border: '1px solid #cce0ff' }}
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
              <span>Milestone Baseline (L5/L6)</span>
              <span
                className="sidebar-item-badge"
                style={{ background: '#f1f5f9', color: '#334155' }}
              >
                {schedule.length}
              </span>
            </button>
          </div>
        </div>

        {/* Intelligence & Data Section */}
        <div>
          <div className="sidebar-group-title">AI & Data Pipeline</div>
          <div className="sidebar-group-items">
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'copilot' ? 'active' : ''}`}
              onClick={() => handleTabClick('copilot')}
            >
              <Sparkles size={16} style={{ color: 'var(--brand-primary)' }} />
              <span>AI Predictive Risk & Copilot</span>
              <span
                className="sidebar-item-badge"
                style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
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
              <span>Data Ingestion & Schemas</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Offline Sync Switch */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.45rem 0.6rem',
            background: offlineMode ? '#fffbeb' : '#f8fafc',
            border: `1px solid ${offlineMode ? '#fde68a' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {offlineMode ? (
              <WifiOff size={14} style={{ color: '#b45309' }} />
            ) : (
              <Wifi size={14} style={{ color: '#047857' }} />
            )}
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: offlineMode ? '#b45309' : '#047857',
              }}
            >
              {offlineMode ? 'Offline Queue' : 'Cloud Sync Active'}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleOfflineMode}
            style={{
              border: 'none',
              background: offlineMode ? '#b45309' : '#0c66e4',
              color: '#ffffff',
              fontSize: '0.675rem',
              fontWeight: 700,
              padding: '3px 8px',
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
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            paddingTop: '0.15rem',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
              }}
            />
            Deterministic L5/L6 Engine
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>v2.4 Ready</span>
        </div>
      </div>
    </aside>
  );
};
