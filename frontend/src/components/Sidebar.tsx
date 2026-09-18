import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Home,
  Camera,
  FileText,
  LayoutDashboard,
  FileCheck2,
  TrendingUp,
  Sliders,
  Database,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Compass,
  Building2,
  Check,
  ExternalLink,
  RotateCcw,
  Calendar,
  AlertCircle,
  CheckSquare,
  UploadCloud,
  ShieldCheck,
  HardHat,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface ProjectOption {
  id: string;
  name: string;
  shortCode: string;
  client: string;
  contractId: string;
  location: string;
  progress: number;
  progressDelta: string;
  status: 'Active' | 'Staging' | 'Planning';
  statusColor: string;
  workfronts: string;
}

const AVAILABLE_PROJECTS: ProjectOption[] = [
  {
    id: 'iocl-p4',
    name: 'IOCL Refinery Expansion - P4',
    shortCode: 'IOCL-P4',
    client: 'Indian Oil Corporation Ltd',
    contractId: 'IOCL-EPCC-2024-P4',
    location: 'Mathura Refinery, UP',
    progress: 68,
    progressDelta: '+12% this week',
    status: 'Active',
    statusColor: 'var(--status-ready-fg)',
    workfronts: '18 / 24 active',
  },
  {
    id: 'ongc-delta',
    name: 'ONGC Deepwater Platform Delta',
    shortCode: 'ONGC-D9',
    client: 'Oil & Natural Gas Corp',
    contractId: 'ONGC-OFFSHORE-2025-D9',
    location: 'KG Basin Offshore, AP',
    progress: 42,
    progressDelta: '+5% this week',
    status: 'Staging',
    statusColor: '#3b82f6',
    workfronts: '11 / 16 active',
  },
  {
    id: 'lnt-metro-3',
    name: 'L&T Metro Underground Line 3',
    shortCode: 'METRO-L3',
    client: 'Chennai Metro Rail Ltd',
    contractId: 'CMRL-UG-PKG3-2025',
    location: 'Chennai Metro Corridor 3',
    progress: 19,
    progressDelta: '+3% this week',
    status: 'Planning',
    statusColor: '#f59e0b',
    workfronts: '6 / 12 active',
  },
];

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentRole,
    currentUser,
    startGuidedDemo,
    isGuidedDemoActive,
    addToast,
    loadDemoData,
    presentationMode,
    setPresentationMode,
  } = useProject();

  const isSupervisor = currentRole === 'supervisor';

  const [showExtendedTools, setShowExtendedTools] = useState<boolean>(() => {
    return activeTab === 'schedule-activities' || activeTab === 'site-updates' || activeTab === 'upload';
  });

  const [showProjectSwitcher, setShowProjectSwitcher] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState('iocl-p4');
  const projectSwitcherRef = useRef<HTMLDivElement>(null);

  const currentProject = AVAILABLE_PROJECTS.find(p => p.id === activeProjectId) || AVAILABLE_PROJECTS[0];

  // Close project switcher when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectSwitcherRef.current && !projectSwitcherRef.current.contains(event.target as Node)) {
        setShowProjectSwitcher(false);
      }
    };
    if (showProjectSwitcher) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProjectSwitcher]);

  const handleTabClick = (tab: NavigationTab) => {
    setActiveTab(tab);
  };

  const handleSelectProject = (project: ProjectOption) => {
    setActiveProjectId(project.id);
    setShowProjectSwitcher(false);
    addToast({
      type: 'success',
      title: `Workspace Switched: ${project.shortCode}`,
      message: `Switched project context to ${project.name} (${project.contractId}).`,
    });
  };

  return (
    <aside className="app-sidebar" aria-label="Main Workspace Navigation">
      {/* Brand Header */}
      <div className="sidebar-header" style={{ padding: '1.15rem 1rem 0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: isSupervisor ? '#0284c7' : '#047857',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isSupervisor ? '0 2px 6px rgba(2, 132, 199, 0.2)' : '0 2px 6px rgba(4, 120, 87, 0.2)',
              flexShrink: 0,
            }}
          >
            <Layers size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.1 }}>
              DATUM
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '-0.01em' }}>
              Planning-to-Execution Bridge
            </div>
          </div>
        </div>

        {/* Mode & Role Authority Indicator Badge */}
        <div
          style={{
            marginTop: '0.65rem',
            padding: '0.35rem 0.55rem',
            borderRadius: 'var(--radius-xs)',
            background: presentationMode === 'sih' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(4, 120, 87, 0.12)',
            border: `1px solid ${presentationMode === 'sih' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(4, 120, 87, 0.25)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.675rem',
          }}
        >
          <span style={{ fontWeight: 800, color: presentationMode === 'sih' ? '#38bdf8' : '#047857', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {presentationMode === 'sih' ? 'Pipeline View' : (isSupervisor ? 'Field Supervisor' : 'Lead Planning Eng')}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {presentationMode === 'sih' ? 'Core System' : (currentUser?.username || (isSupervisor ? 'rajesh' : 'gokul'))}
          </span>
        </div>
      </div>

      {/* Primary Navigation Links */}
      <nav className="sidebar-nav" style={{ padding: '0.5rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, overflowY: 'auto' }}>
        {presentationMode === 'sih' ? (
          <div>
            <span className="sidebar-category-label">END-TO-END PIPELINE</span>
            <div style={{ padding: '0.55rem 0.65rem', background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 6, marginBottom: 8 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', marginBottom: 2 }}>
                Core Execution Pipeline
              </div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8', lineHeight: 1.35 }}>
                12 continuous stages: Baseline → Capture → Extraction → Talk to DATUM → Match → Verify → Out-of-Baseline → Actuals → Dataset → Intelligence → Memory → Audit.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                type="button"
                className="sidebar-nav-pill active"
                onClick={() => setPresentationMode('sih')}
                title="Active Execution Pipeline"
              >
                <Sparkles size={15} style={{ color: '#38bdf8' }} />
                <span>12-Stage Pipeline View</span>
                <span className="sidebar-badge live">Active</span>
              </button>

              <button
                type="button"
                className="sidebar-nav-pill"
                onClick={() => {
                  setPresentationMode('standard');
                  setActiveTab('dashboard');
                }}
                title="Switch to full standard engineering workspace"
              >
                <LayoutDashboard size={15} />
                <span>Operations Workspace</span>
                <span className="sidebar-badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>Full Platform</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="sidebar-category-label" style={{ margin: 0 }}>CORE WORKFLOW</span>
              <button
                type="button"
                onClick={() => setPresentationMode('sih')}
                style={{
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(16, 185, 129, 0.2))',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: '#38bdf8',
                  cursor: 'pointer',
                }}
                title="Switch to End-to-End Pipeline"
              >
                Pipeline View
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* 1. Dashboard */}
              <button
                type="button"
                className={`sidebar-nav-pill ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleTabClick('dashboard')}
                title="Overview & Executive Control Center"
              >
                <LayoutDashboard size={15} />
                <span>1. Dashboard</span>
              </button>

            {/* 2. Daily Field Log & Upload */}
            <button
              type="button"
              className={`sidebar-nav-pill ${activeTab === 'supervisor-entry' ? 'active' : ''}`}
              onClick={() => handleTabClick('supervisor-entry')}
              title="Supervisor daily task execution, voice dictation, photo OCR, and text log upload"
            >
              <HardHat size={15} />
              <span>2. Daily Field Log & Upload</span>
              <span className="sidebar-badge live">Log Entry</span>
            </button>

            {/* 3. Tasks & Master Schedule (WBS) */}
            <button
              type="button"
              className={`sidebar-nav-pill ${activeTab === 'schedule-activities' ? 'active' : ''}`}
              onClick={() => handleTabClick('schedule-activities')}
              title="WBS Master Schedule Tasks, 4D Critical Path Gantt, and Planned vs Actual progress"
            >
              <CheckSquare size={15} />
              <span>3. Tasks & Schedule (WBS)</span>
              <span className="sidebar-badge" style={{ background: 'var(--brand-surface)', color: 'var(--brand-primary)', fontWeight: 700 }}>Tasks</span>
            </button>

            {/* 4. Field Reports & AI Inspector */}
            <button
              type="button"
              className={`sidebar-nav-pill ${activeTab === 'site-updates' ? 'active' : ''}`}
              onClick={() => handleTabClick('site-updates')}
              title="Uploaded text logs, field reports, and explainable AI matching inspector"
            >
              <FileText size={15} />
              <span>4. Field Reports & Inspector</span>
              <span className="sidebar-badge live">AI Match</span>
            </button>

            {/* 5. Review Queue */}
            <button
              type="button"
              className={`sidebar-nav-pill ${activeTab === 'planner-review' ? 'active' : ''}`}
              onClick={() => handleTabClick('planner-review')}
              title="Human-in-the-loop review workbench for ambiguous updates"
            >
              <FileCheck2 size={15} />
              <span>5. Review Queue</span>
              <span className="sidebar-badge amber">Approvals</span>
            </button>

            {/* 6. Direct File Ingestion */}
            <button
              type="button"
              className={`sidebar-nav-pill ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => handleTabClick('upload')}
              title="Direct upload center for P6 baselines, daily_report.txt, and excel progress files"
            >
              <UploadCloud size={15} />
              <span>6. Data Ingestion & Uploads</span>
              <span className="sidebar-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 700 }}>Upload</span>
            </button>

              {/* 7. Audit Trail */}
              <button
                type="button"
                className={`sidebar-nav-pill ${activeTab === 'audit-trail' ? 'active' : ''}`}
                onClick={() => handleTabClick('audit-trail')}
                title="Complete chronological decision provenance and audit log"
              >
                <ShieldCheck size={15} />
                <span>7. Audit Trail</span>
              </button>
            </div>
          </div>
        )}

        {/* Guided Demo Launch Banner in Sidebar */}
        <div style={{ marginTop: 'auto', padding: '0.75rem', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(16, 185, 129, 0.12))', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Compass size={14} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f1f5f9' }}>
              Interactive System Tour
            </span>
          </div>
          <div style={{ fontSize: '0.675rem', color: '#94a3b8', marginBottom: 8, lineHeight: 1.35 }}>
            Guided architectural walkthrough across all automated data-linking stages.
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={startGuidedDemo}
            style={{ width: '100%', padding: '0.45rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, justifyContent: 'center' }}
          >
            <Sparkles size={13} />
            <span>{isGuidedDemoActive ? 'Resume System Tour' : 'Start System Tour'}</span>
          </button>
        </div>
      </nav>

      {/* Sidebar Bottom: Active Project Card with Interactive Switcher */}
      <div ref={projectSwitcherRef} style={{ padding: '0.75rem', marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative' }}>
        {/* Project Switcher Popover Floating Above */}
        {showProjectSwitcher && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '0.75rem',
              right: '0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.75rem',
              zIndex: 300,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={14} style={{ color: 'var(--brand-primary)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Switch Workspace
                </span>
              </div>
              <span style={{ fontSize: '0.65rem', background: 'var(--brand-surface)', padding: '2px 6px', borderRadius: 10, color: 'var(--brand-primary)', fontWeight: 600 }}>
                {AVAILABLE_PROJECTS.length} Projects
              </span>
            </div>

            {/* Project List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '240px', overflowY: 'auto' }}>
              {AVAILABLE_PROJECTS.map((proj) => {
                const isSelected = proj.id === activeProjectId;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => handleSelectProject(proj)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--brand-surface)' : 'var(--bg-subtle)',
                      border: `1px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, marginRight: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                          {proj.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)',
                            color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          }}
                        >
                          {proj.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        {proj.location} • {proj.workfronts}
                      </div>

                      {/* Micro Progress Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--border-default)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${proj.progress}%`, height: '100%', background: isSelected ? '#10b981' : '#64748b', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {proj.progress}%
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--brand-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Action Shortcuts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowProjectSwitcher(false);
                  setActiveTab('dashboard');
                }}
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.675rem', justifyContent: 'center' }}
              >
                <LayoutDashboard size={12} />
                <span>Control Center</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowProjectSwitcher(false);
                  setActiveTab('upload');
                }}
                style={{ padding: '0.3rem 0.4rem', fontSize: '0.675rem', justifyContent: 'center' }}
              >
                <Database size={12} />
                <span>Ingest Schemas</span>
              </button>
            </div>
          </div>
        )}

        {/* Interactive Active Project Trigger Button */}
        <button
          type="button"
          onClick={() => setShowProjectSwitcher(!showProjectSwitcher)}
          aria-expanded={showProjectSwitcher}
          aria-label="Toggle Project Switcher Menu"
          style={{
            width: '100%',
            background: showProjectSwitcher ? 'var(--bg-sidebar-active)' : 'var(--bg-surface)',
            border: '1px solid var(--border-sidebar)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
          }}
        >
          {/* Active Project Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                <Layers size={13} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-sidebar-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentProject.shortCode}
                </div>
                <div style={{ fontSize: '0.65rem', color: currentProject.statusColor, fontWeight: 600 }}>
                  {currentProject.status} Project
                </div>
              </div>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--text-sidebar-muted)',
                flexShrink: 0,
                transform: showProjectSwitcher ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
              }}
            />
          </div>

          {/* Donut Progress Visual */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%' }}>
            <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
              <svg width="38" height="38" viewBox="0 0 38 38">
                <circle
                  cx="19"
                  cy="19"
                  r="15"
                  fill="none"
                  stroke="var(--border-default)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="19"
                  cy="19"
                  r="15"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeDasharray="94.2"
                  strokeDashoffset={94.2 - (94.2 * currentProject.progress) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 19 19)"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: 'var(--text-sidebar-primary)',
                }}
              >
                {currentProject.progress}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-sidebar-primary)' }}>
                Overall Progress
              </div>
              <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>
                {currentProject.progressDelta}
              </div>
            </div>
          </div>
        </button>

        {/* Brand Version Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: '0.5rem', paddingLeft: 2, color: 'var(--text-sidebar-muted)', fontSize: '0.65rem', fontWeight: 500 }}>
          <Layers size={10} />
          <span>DATUM v1.0 • Enterprise Edition</span>
        </div>
      </div>
    </aside>
  );
};

