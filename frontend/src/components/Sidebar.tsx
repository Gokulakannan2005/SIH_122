import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Home,
  LayoutDashboard,
  UploadCloud,
  FileCheck2,
  Calendar,
  Sliders,
  Sparkles,
  ShieldCheck,
  HardHat,
  Compass,
  Building2,
  Database,
  Layers,
  CheckSquare,
  FileText,
  Check,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { NavigationTab, ProjectOption, AVAILABLE_PROJECTS } from '../types';

interface DockItemProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  badge?: string;
  isSupervisor?: boolean;
}

const DockItem: React.FC<DockItemProps> = ({
  name,
  icon,
  isActive,
  onClick,
  badge,
  isSupervisor,
}) => {
  return (
    <button
      type="button"
      className={`macos-dock-item ${isActive ? 'active' : ''} ${isSupervisor ? 'supervisor' : ''}`}
      onClick={onClick}
      aria-label={name}
    >
      {isActive && <div className="macos-dock-indicator" />}
      {icon}

      {/* Floating Glassmorphism Tooltip Pill */}
      <div className="macos-dock-tooltip">
        <span>{name}</span>
        {badge && (
          <span
            style={{
              fontSize: '0.65rem',
              padding: '1px 6px',
              borderRadius: 6,
              background: 'rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              fontWeight: 800,
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </button>
  );
};

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentRole,
    currentUser,
    currentProject,
    switchProject,
    availableProjects,
    setIsProjectSelectionModalOpen,
    startGuidedDemo,
    isGuidedDemoActive,
    presentationMode,
    setPresentationMode,
    setIsSystemTourOpen,
  } = useProject();

  const isSupervisor = currentRole === 'supervisor';
  const [showProjectSwitcher, setShowProjectSwitcher] = useState(false);
  const projectSwitcherRef = useRef<HTMLDivElement>(null);

  // Close project switcher on outside click
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
    setPresentationMode('standard');
    setActiveTab(tab);
  };

  const handleSelectProject = (project: ProjectOption) => {
    setShowProjectSwitcher(false);
    switchProject(project.id);
  };

  return (
    <aside className="app-sidebar" aria-label="macOS Dock Navigation">
      {/* Top Dock Logo */}
      <button
        type="button"
        className="macos-dock-item"
        onClick={() => handleTabClick('home')}
        style={{
          width: 44,
          height: 44,
          padding: 3,
          background: '#ffffff',
          borderRadius: 12,
          boxShadow: isSupervisor ? '0 3px 10px rgba(2, 132, 199, 0.3)' : '0 3px 10px rgba(4, 120, 87, 0.3)',
          marginBottom: '0.35rem',
          border: '1px solid rgba(255,255,255,0.25)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
        aria-label="DATUM Home"
      >
        <img
          src="/datum_logo.png"
          alt="DATUM"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <div className="macos-dock-tooltip">
          <span>DATUM — Planning-to-Execution Bridge</span>
        </div>
      </button>

      <div className="macos-dock-divider" />

      {/* Primary Dock Items Container */}
      <nav className="macos-dock-container">
        {presentationMode === 'sih' ? (
          <>
            <DockItem
              id="pipeline"
              name="12-Stage Execution Pipeline"
              icon={<Sparkles size={20} style={{ color: '#38bdf8' }} />}
              isActive={true}
              onClick={() => setPresentationMode('sih')}
              badge="Live"
            />
            <DockItem
              id="standard"
              name="Switch to Operations Workspace"
              icon={<LayoutDashboard size={20} />}
              isActive={false}
              onClick={() => {
                setPresentationMode('standard');
                setActiveTab('dashboard');
              }}
            />
          </>
        ) : (
          <>
            {/* Home */}
            <DockItem
              id="home"
              name="Home & Overview"
              icon={<Home size={20} />}
              isActive={activeTab === 'home'}
              onClick={() => handleTabClick('home')}
            />

            {/* Dashboard */}
            <DockItem
              id="dashboard"
              name="Executive Control Center"
              icon={<LayoutDashboard size={20} />}
              isActive={activeTab === 'dashboard'}
              onClick={() => handleTabClick('dashboard')}
            />

            {isSupervisor ? (
              <>
                {/* Daily Field Log */}
                <DockItem
                  id="supervisor-entry"
                  name="Daily Field Log & Upload"
                  icon={<HardHat size={20} />}
                  isActive={activeTab === 'supervisor-entry'}
                  onClick={() => handleTabClick('supervisor-entry')}
                  badge="Entry"
                  isSupervisor={true}
                />

                {/* Tasks & Master Schedule */}
                <DockItem
                  id="project-info"
                  name="Tasks & Master Schedule"
                  icon={<CheckSquare size={20} />}
                  isActive={activeTab === 'project-info' || activeTab === 'schedule-activities'}
                  onClick={() => handleTabClick('project-info')}
                  badge="WBS"
                  isSupervisor={true}
                />

                {/* Field Reports & Logs */}
                <DockItem
                  id="site-updates"
                  name="Field Reports & Submissions"
                  icon={<FileText size={20} />}
                  isActive={activeTab === 'site-updates'}
                  onClick={() => handleTabClick('site-updates')}
                  isSupervisor={true}
                />
              </>
            ) : (
              <>
                {/* Data Ingestion Hub */}
                <DockItem
                  id="upload"
                  name="Data Ingestion Hub"
                  icon={<UploadCloud size={20} />}
                  isActive={activeTab === 'upload'}
                  onClick={() => handleTabClick('upload')}
                  badge="Upload"
                />

                {/* Project Info & Master Schedule */}
                <DockItem
                  id="project-info"
                  name="Project Info & Master Baseline"
                  icon={<Layers size={20} />}
                  isActive={activeTab === 'project-info' || activeTab === 'schedule-activities' || activeTab === 'site-updates'}
                  onClick={() => handleTabClick('project-info')}
                  badge="Baseline"
                />

                {/* Verification Queue */}
                <DockItem
                  id="planner-review"
                  name="Verification Queue & Field Approvals"
                  icon={<FileCheck2 size={20} />}
                  isActive={activeTab === 'planner-review'}
                  onClick={() => handleTabClick('planner-review')}
                  badge="Review"
                />

                {/* Master Calendar */}
                <DockItem
                  id="calendar"
                  name="Master Project Calendar"
                  icon={<Calendar size={20} />}
                  isActive={activeTab === 'calendar'}
                  onClick={() => handleTabClick('calendar')}
                />

                {/* Delay Risk Simulator */}
                <DockItem
                  id="copilot"
                  name="Delay Risk Simulator & Predictor"
                  icon={<Sliders size={20} />}
                  isActive={activeTab === 'copilot'}
                  onClick={() => handleTabClick('copilot')}
                />

                {/* Project Analytics */}
                <DockItem
                  id="project-memory"
                  name="Project Analytics & Performance Trends"
                  icon={<BarChart3 size={20} />}
                  isActive={activeTab === 'project-memory'}
                  onClick={() => handleTabClick('project-memory')}
                />

                {/* Cryptographic Audit Trail */}
                <DockItem
                  id="audit-trail"
                  name="Cryptographic Provenance Audit"
                  icon={<ShieldCheck size={20} />}
                  isActive={activeTab === 'audit-trail'}
                  onClick={() => handleTabClick('audit-trail')}
                />
              </>
            )}
          </>
        )}
      </nav>

      <div className="macos-dock-divider" />

      {/* Bottom Dock Utilities */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem', width: '100%' }}>
        {/* System Tour */}
        <button
          type="button"
          className="macos-dock-item"
          onClick={startGuidedDemo}
          aria-label="Interactive System Tour"
        >
          <Compass size={20} style={{ color: '#60a5fa' }} />
          <div className="macos-dock-tooltip">
            <span>{isGuidedDemoActive ? 'Resume System Tour' : 'Interactive System Tour'}</span>
          </div>
        </button>

        {/* Project Switcher */}
        <div ref={projectSwitcherRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={`macos-dock-item ${showProjectSwitcher ? 'active' : ''}`}
            onClick={() => setShowProjectSwitcher(!showProjectSwitcher)}
            aria-label="Switch Project Workspace"
          >
            <Building2 size={20} style={{ color: 'var(--brand-primary)' }} />
            <div className="macos-dock-tooltip">
              <span>Project: {currentProject?.name} ({currentProject?.shortCode || currentProject?.code || 'IOCL-P4'})</span>
            </div>
          </button>

          {/* Floating Workspace Popover */}
          {showProjectSwitcher && (
            <div
              style={{
                position: 'fixed',
                left: '78px',
                bottom: '16px',
                width: '300px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.75rem',
                zIndex: 400,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={14} style={{ color: 'var(--brand-primary)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Workspaces
                  </span>
                </div>
                <span style={{ fontSize: '0.65rem', background: 'var(--brand-surface)', padding: '2px 6px', borderRadius: 10, color: 'var(--brand-primary)', fontWeight: 600 }}>
                  {(availableProjects || AVAILABLE_PROJECTS).length} Sites
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 220, overflowY: 'auto' }}>
                {(availableProjects || AVAILABLE_PROJECTS).map(proj => {
                  const isSelected = proj.id === currentProject?.id;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => handleSelectProject(proj)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.65rem',
                        borderRadius: 'var(--radius-xs)',
                        border: isSelected ? '1.5px solid var(--brand-primary)' : '1px solid transparent',
                        background: isSelected ? 'var(--brand-surface)' : 'var(--bg-surface-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 210 }}>
                          {proj.name}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {proj.shortCode || proj.code} &bull; {proj.location}
                        </div>
                      </div>
                      {isSelected && <Check size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowProjectSwitcher(false);
                  setIsProjectSelectionModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px dashed var(--brand-primary)',
                  background: 'var(--brand-surface)',
                  color: 'var(--brand-primary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '0.15rem',
                  transition: 'all var(--transition-fast)',
                }}
              >
                + Create / Manage Workspaces
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
