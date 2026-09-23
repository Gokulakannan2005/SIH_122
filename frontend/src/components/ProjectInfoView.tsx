import React, { useState, useMemo, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Search,
  CalendarCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  LayoutGrid,
  List,
  Layers,
  Calendar,
  Clock,
  Activity,
  FileDown,
  Sparkles,
  Download,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Camera,
  ArrowRight,
  ShieldCheck,
  Filter,
  ExternalLink,
  MapPin,
  Tag,
  Plus,
  Trash2,
  FolderPlus,
  Check,
  FolderKanban,
} from 'lucide-react';
import { exportPrimaveraP6XER, exportMSProjectXML } from '../utils/scheduleExportService';
import { formatVarianceBadge, formatDisplayDate, diffDaysBetweenDates } from '../utils/scheduleSimulator';

export const ProjectInfoView: React.FC = () => {
  const {
    enrichedSchedule,
    schedule,
    siteUpdates,
    plannerDecisions,
    matchResults,
    setSelectedScheduleActivityId,
    setSelectedInspectorUpdateId,
    setActiveTab,
    addToast,
    exportAlignmentCSV,
    currentProject,
    currentRole,
    availableProjects,
    switchProject,
    deleteUserProject,
    setIsProjectSelectionModalOpen,
  } = useProject();

  const isSupervisor = currentRole === 'supervisor';

  // Sub-view: 'schedule' vs 'workspaces'
  const [activeTabSubView, setActiveTabSubView] = useState<'schedule' | 'workspaces'>('schedule');

  // View Mode: 'table' vs 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Scope filter: All, Completed, Unplanned
  const [scopeView, setScopeView] = useState<'all' | 'completed' | 'unplanned'>('all');
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const scrollTableLeft = () => {
    tableScrollRef.current?.scrollBy({ left: -350, behavior: 'smooth' });
  };

  const scrollTableRight = () => {
    tableScrollRef.current?.scrollBy({ left: 350, behavior: 'smooth' });
  };

  // Filter state
  const [selectedDiscipline, setSelectedDiscipline] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [sortBy, setSortBy] = useState<'wbs' | 'id' | 'planned-finish' | 'variance' | 'progress'>('wbs');

  // Expanded schedule rows to reveal linked field reports and supervisor evidence
  const [expandedActivityIds, setExpandedActivityIds] = useState<Record<string, boolean>>({});

  const toggleRowExpanded = (activityId: string) => {
    setExpandedActivityIds(prev => ({
      ...prev,
      [activityId]: !prev[activityId],
    }));
  };

  // Unique lists for filter dropdowns
  const uniqueDisciplines = useMemo(() => {
    const set = new Set<string>();
    enrichedSchedule.forEach(a => a.discipline && set.add(a.discipline));
    return Array.from(set).sort();
  }, [enrichedSchedule]);

  const uniqueAreas = useMemo(() => {
    const set = new Set<string>();
    enrichedSchedule.forEach(a => a.area && set.add(a.area));
    return Array.from(set).sort();
  }, [enrichedSchedule]);

  const handleResetFilters = () => {
    setScopeView('all');
    setSelectedDiscipline('ALL');
    setSelectedStatus('ALL');
    setSelectedArea('ALL');
    setSortBy('wbs');
  };

  // Map each activity to its dynamically linked site updates (taking into account approvals/re-links in Verification Queue)
  const activityLinkedUpdatesMap = useMemo(() => {
    const map: Record<string, typeof siteUpdates> = {};
    
    siteUpdates.forEach(update => {
      const decision = plannerDecisions[update.id];
      const match = matchResults[update.id];

      // If approved or relinked in Verification Queue
      let targetActId: string | null = null;
      if (decision) {
        if (decision.status === 'approved' && decision.linkedActivityId) {
          targetActId = decision.linkedActivityId;
        }
      } else if (match?.category === 'ready' && match?.candidateActivityId) {
        targetActId = match.candidateActivityId;
      }

      if (targetActId) {
        if (!map[targetActId]) {
          map[targetActId] = [];
        }
        map[targetActId].push(update);
      }
    });

    return map;
  }, [siteUpdates, plannerDecisions, matchResults]);

  // Unplanned / non-baseline site updates
  const unplannedUpdates = useMemo(() => {
    return siteUpdates.filter(u => {
      const match = matchResults[u.id];
      const decision = plannerDecisions[u.id];
      return decision?.status === 'unplanned' || (!decision && match?.category === 'unplanned');
    });
  }, [siteUpdates, matchResults, plannerDecisions]);

  // Filtered and dynamically enriched activities
  const filteredActivities = useMemo(() => {
    return enrichedSchedule
      .filter(act => {
        // Scope filter: completed
        if (scopeView === 'completed') {
          const isDone = act.status === 'Completed' || (act.progressPercent || 0) >= 100;
          if (!isDone) return false;
        }

        // Discipline filter
        if (selectedDiscipline !== 'ALL' && act.discipline !== selectedDiscipline) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL' && act.status !== selectedStatus) {
          return false;
        }

        // Area filter
        if (selectedArea !== 'ALL' && act.area !== selectedArea) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'id') {
          return a.activityId.localeCompare(b.activityId);
        }
        if (sortBy === 'planned-finish') {
          return a.plannedFinish.localeCompare(b.plannedFinish);
        }
        if (sortBy === 'variance') {
          return (b.varianceDays || 0) - (a.varianceDays || 0);
        }
        if (sortBy === 'progress') {
          return (b.progressPercent || 0) - (a.progressPercent || 0);
        }
        // default: wbs
        return a.wbs.localeCompare(b.wbs);
      });
  }, [enrichedSchedule, scopeView, selectedDiscipline, selectedStatus, selectedArea, sortBy]);

  // Project Health Metrics
  const projectMetrics = useMemo(() => {
    const total = enrichedSchedule.length;
    const completed = enrichedSchedule.filter(a => a.status === 'Completed').length;
    const delayed = enrichedSchedule.filter(a => (a.varianceDays || 0) > 0 || a.status === 'Delayed').length;
    const inProgress = enrichedSchedule.filter(a => a.status === 'In Progress').length;
    const overallProgress = total > 0 ? Math.round(enrichedSchedule.reduce((acc, a) => acc + (a.progressPercent || 0), 0) / total) : 0;
    const totalEvidenceCount = Object.values(activityLinkedUpdatesMap).reduce((acc, arr) => acc + arr.length, 0);

    return {
      total,
      completed,
      delayed,
      inProgress,
      overallProgress,
      totalEvidenceCount,
    };
  }, [enrichedSchedule, activityLinkedUpdatesMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner: Project Master Metadata */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.7))',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <span className="mono-pill" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)', fontWeight: 800 }}>
                {currentProject?.shortCode || currentProject?.code || 'IOCL-P4'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Contract: <strong>{currentProject?.contractId || currentProject?.shortCode || 'IOCL-EPCC-2024-P4'}</strong>
              </span>
              <span className="status-badge ready" style={{ fontSize: '0.7rem' }}>
                {currentProject?.status || 'Active Workspace'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
              {currentProject?.name || 'IOCL Refinery Expansion - P4 Master Schedule'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', fontSize: '0.775rem', color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} style={{ color: '#38bdf8' }} /> {currentProject?.location || 'Mathura Refinery, UP'}
              </span>
              <span>•</span>
              <span>Client: <strong>{currentProject?.client || 'Indian Oil Corporation Ltd'}</strong></span>
              <span>•</span>
              <span>Baseline: <strong>{schedule.length > 0 ? `${schedule.length} Activities Extracted` : 'Clean Baseline Pending'}</strong></span>
            </div>
          </div>
        </div>

        {/* Global Action Buttons & Sub-View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Sub-view toggle buttons */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 2, border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setActiveTabSubView('schedule')}
              style={{
                border: 'none',
                borderRadius: 6,
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: activeTabSubView === 'schedule' ? 800 : 600,
                background: activeTabSubView === 'schedule' ? '#0284c7' : 'transparent',
                color: activeTabSubView === 'schedule' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <Layers size={13} />
              <span>Schedule Activities ({schedule.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabSubView('workspaces')}
              style={{
                border: 'none',
                borderRadius: 6,
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: activeTabSubView === 'workspaces' ? 800 : 600,
                background: activeTabSubView === 'workspaces' ? '#0284c7' : 'transparent',
                color: activeTabSubView === 'workspaces' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <FolderKanban size={13} />
              <span>All Projects ({(availableProjects || []).length})</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsProjectSelectionModalOpen(true)}
            title="Create a new project workspace"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', gap: 5 }}
          >
            <Plus size={14} />
            <span>New Project</span>
          </button>

          {schedule.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => exportPrimaveraP6XER(enrichedSchedule)}
                title="Export Primavera P6 XER file"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
              >
                <FileDown size={14} />
                <span>P6 XER</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={exportAlignmentCSV}
                title="Export Verified Alignment Dataset adhering to problem statement"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
              >
                <Download size={14} />
                <span>Alignment CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {activeTabSubView === 'workspaces' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Registered Enterprise Projects & Workspaces
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Switch active context, manage project baselines, or initialize new project workspaces.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsProjectSelectionModalOpen(true)}
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.9rem', gap: 6 }}
            >
              <FolderPlus size={15} />
              <span>+ Create New Project</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {(availableProjects || []).map(proj => {
              const isCurrent = proj.id === currentProject?.id;
              return (
                <div
                  key={proj.id}
                  className="card"
                  style={{
                    padding: '1.15rem',
                    borderRadius: 'var(--radius-md)',
                    border: isCurrent ? '2px solid var(--brand-primary)' : '1px solid var(--border-default)',
                    background: isCurrent ? 'linear-gradient(135deg, var(--bg-surface), var(--brand-surface))' : 'var(--bg-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    position: 'relative',
                    boxShadow: isCurrent ? '0 4px 18px rgba(2, 132, 199, 0.18)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: isCurrent ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                          color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="mono-pill" style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                            {proj.shortCode || proj.code}
                          </span>
                          {isCurrent && (
                            <span className="badge badge-ready" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                              Active
                            </span>
                          )}
                        </div>
                        <h4 style={{ margin: '3px 0 0', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {proj.name}
                        </h4>
                      </div>
                    </div>

                    {!isCurrent && deleteUserProject && proj.id !== 'iocl-p4' && proj.id !== 'ongc-delta' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteUserProject(proj.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--status-unplanned-fg, #ef4444)',
                          cursor: 'pointer',
                          padding: 4,
                          borderRadius: 4,
                        }}
                        title="Delete project workspace"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div>Contract: <strong style={{ color: 'var(--text-secondary)' }}>{proj.contractId || proj.shortCode}</strong></div>
                    <div>Location: <strong style={{ color: 'var(--text-secondary)' }}>{proj.location}</strong></div>
                    <div>Client: <strong style={{ color: 'var(--text-secondary)' }}>{proj.client || 'Enterprise'}</strong></div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {isCurrent && schedule.length > 0
                        ? `${schedule.length} Master Activities`
                        : isCurrent
                        ? 'Clean Baseline (0 Activities)'
                        : 'Stored Workspace'}
                    </span>
                    {isCurrent ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={13} />
                        <span>Current Workspace</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          switchProject(proj.id);
                          setActiveTabSubView('schedule');
                        }}
                        style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
                      >
                        <span>Switch Workspace &rarr;</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Create Project Card */}
            <div
              onClick={() => setIsProjectSelectionModalOpen(true)}
              style={{
                borderRadius: 'var(--radius-md)',
                border: '2px dashed var(--border-default)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
                minHeight: 180,
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
              className="hover-card"
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'var(--brand-surface)',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FolderPlus size={20} />
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                + Create New Project
              </span>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 220 }}>
                Initialize a clean workspace with your own schedule and site logs.
              </p>
            </div>
          </div>
        </div>
      ) : schedule.length === 0 ? (
        /* Empty State: Master Baseline Not Ingested */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '750px', margin: '1rem auto' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CalendarCheck size={32} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Schedule Baseline Pending: {currentProject?.name}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto 1.5rem' }}>
              You are currently working in <strong style={{ color: 'var(--text-primary)' }}>{currentProject?.name}</strong>. To view extracted schedule baselines, WBS hierarchies, and progress tracking, please upload your Primavera P6 (XER/XLSX) or MS Project schedule in the Data Ingestion Hub.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('upload')}
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', fontWeight: 700 }}
              >
                <span>Go to Data Ingestion Hub</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTabSubView('workspaces')}
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', fontWeight: 700 }}
              >
                <FolderKanban size={16} />
                <span>View All Workspaces ({(availableProjects || []).length})</span>
              </button>
            </div>
          </div>

          {/* Quick Workspaces Strip */}
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Your Registered Workspaces ({(availableProjects || []).length})
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTabSubView('workspaces')}
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
              >
                Manage All
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {(availableProjects || []).map(p => {
                const isSelected = p.id === currentProject?.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      switchProject(p.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-default)',
                      background: isSelected ? 'var(--brand-surface)' : 'var(--bg-surface-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {p.shortCode || p.code} &bull; {p.location}
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="badge badge-ready" style={{ fontSize: '0.6rem' }}>Active</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 600 }}>Switch &rarr;</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>

      {/* 5-Metric Summary Cards Strip */}
      <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        {/* Metric 1: Total Extracted Activities */}
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
            <Layers size={18} />
          </div>
          <div>
            <div className="kpi-title">Master Activities</div>
            <div className="kpi-value">{projectMetrics.total}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              WBS Levels 4, 5 & 6 Extracted
            </div>
          </div>
        </div>

        {/* Metric 2: Overall Physical Progress */}
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <Activity size={18} />
          </div>
          <div>
            <div className="kpi-title">Overall Progress</div>
            <div className="kpi-value">{projectMetrics.overallProgress}%</div>
            <div className="progress-bar-container" style={{ marginTop: 4, height: 5, width: 90 }}>
              <div className="progress-bar-fill green" style={{ width: `${projectMetrics.overallProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Metric 3: Critical Path & Delays */}
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: projectMetrics.delayed > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)', color: projectMetrics.delayed > 0 ? '#ef4444' : '#10b981' }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="kpi-title">Schedule Slips</div>
            <div className="kpi-value" style={{ color: projectMetrics.delayed > 0 ? '#ef4444' : 'inherit' }}>
              {projectMetrics.delayed} {projectMetrics.delayed === 1 ? 'Activity' : 'Activities'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {projectMetrics.delayed > 0 ? 'Variance detected vs baseline' : 'On baseline schedule'}
            </div>
          </div>
        </div>

        {/* Metric 4: In Progress / Execution */}
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <Clock size={18} />
          </div>
          <div>
            <div className="kpi-title">Active Workfronts</div>
            <div className="kpi-value">{projectMetrics.inProgress} In Progress</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {projectMetrics.completed} Completed
            </div>
          </div>
        </div>

        {/* Metric 5: Linked Field Evidence */}
        <div className="card kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(147, 51, 234, 0.12)', color: '#a855f7' }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="kpi-title">Linked Evidence</div>
            <div className="kpi-value">{projectMetrics.totalEvidenceCount} Logs</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Supervisor proofs & photos
            </div>
          </div>
        </div>
      </div>

      {/* Filter, Scope Mode & Display Mode Bar (Clean layout without search bar) */}
      <div className="toolbar-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Scope Mode Selector: All / Completed / Unplanned */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface-secondary)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className={`filter-pill ${scopeView === 'all' ? 'active' : ''}`}
              onClick={() => setScopeView('all')}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              All Master Activities ({enrichedSchedule.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${scopeView === 'completed' ? 'active' : ''}`}
              onClick={() => setScopeView('completed')}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              Completed Work ({projectMetrics.completed})
            </button>
            <button
              type="button"
              className={`filter-pill ${scopeView === 'unplanned' ? 'active' : ''}`}
              onClick={() => setScopeView('unplanned')}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              Unplanned Scope ({unplannedUpdates.length})
            </button>
          </div>

          {/* Quick Filter Dropdowns, Scroll Buttons & View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Horizontal Scroll Helper Buttons */}
            {viewMode === 'table' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', borderRight: '1px solid var(--border-subtle)', paddingRight: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={scrollTableLeft}
                  title="Scroll table sideways left"
                  style={{ fontSize: '0.7rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <ChevronLeft size={13} />
                  <span>Scroll Left</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={scrollTableRight}
                  title="Scroll table sideways right"
                  style={{ fontSize: '0.7rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <span>Scroll Right</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* Discipline Dropdown */}
            <select
              className="form-select"
              value={selectedDiscipline}
              onChange={e => setSelectedDiscipline(e.target.value)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <option value="ALL">All Disciplines</option>
              {uniqueDisciplines.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              className="form-select"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Delayed">Delayed</option>
              <option value="Completed">Completed</option>
              <option value="Not Started">Not Started</option>
            </select>

            {/* Area Dropdown */}
            <select
              className="form-select"
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <option value="ALL">All Workfronts</option>
              {uniqueAreas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Sort By Dropdown */}
            <select
              className="form-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <option value="wbs">Sort by WBS Hierarchy</option>
              <option value="id">Sort by Activity ID</option>
              <option value="progress">Sort by Progress (%)</option>
              <option value="variance">Sort by Schedule Slip</option>
              <option value="planned-finish">Sort by Planned Finish Date</option>
            </select>

            {/* View Mode Toggle */}
            <div className="view-toggle">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Industrial Master Schedule Table"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Activity Workfront Cards"
              >
                <LayoutGrid size={14} />
              </button>
            </div>

            {(scopeView !== 'all' || selectedDiscipline !== 'ALL' || selectedStatus !== 'ALL' || selectedArea !== 'ALL') && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleResetFilters}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem' }}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Discipline Pills */}
        <div className="filter-pill-group">
          <button
            type="button"
            className={`filter-pill ${selectedDiscipline === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedDiscipline('ALL')}
          >
            All Disciplines ({enrichedSchedule.length})
          </button>
          {uniqueDisciplines.map(d => {
            const count = enrichedSchedule.filter(a => a.discipline === d).length;
            return (
              <button
                key={d}
                type="button"
                className={`filter-pill ${selectedDiscipline === d ? 'active' : ''}`}
                onClick={() => setSelectedDiscipline(d)}
              >
                {d} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Master Schedule Table, Unplanned Scope or Cards */}
      {scopeView === 'unplanned' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div ref={tableScrollRef} className="table-responsive" style={{ maxHeight: '720px', overflowY: 'auto' }}>
            <table className="industrial-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Update ID</th>
                  <th>Date</th>
                  <th>Discipline & Area</th>
                  <th>Field Description</th>
                  <th>Quantity</th>
                  <th>Supervisor</th>
                  <th>Classification</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unplannedUpdates.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No out-of-baseline or unplanned activities reported. All field updates correspond to master schedule activities.
                    </td>
                  </tr>
                ) : (
                  unplannedUpdates.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--status-unplanned-fg, #ef4444)' }}>
                        {u.id}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {u.reportDate}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="mono-pill" style={{ fontSize: '0.65rem' }}>{u.discipline}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.area || 'Site'}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 360 }}>
                        {u.extractedDescription || u.rawText}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {u.quantity ? `${u.quantity} ${u.unit || ''}` : 'Execution Recorded'}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {u.supervisor || 'Field Supervisor'}
                      </td>
                      <td>
                        <span className="status-badge unplanned" style={{ fontSize: '0.65rem' }}>
                          Out-of-Baseline Scope
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setActiveTab('planner-review')}
                          style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                        >
                          Review in Queue &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div ref={tableScrollRef} className="table-responsive" style={{ maxHeight: '720px', overflowY: 'auto' }}>
            <table className="industrial-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Activity ID & WBS</th>
                  <th>Activity Name & Description</th>
                  <th>Discipline & Workfront</th>
                  <th>Planned Baseline Window</th>
                  <th>Actual Progress & Status</th>
                  <th>Schedule Variance</th>
                  <th>Verified Evidence</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No master schedule activities match your current search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map(act => {
                    const isExpanded = !!expandedActivityIds[act.activityId];
                    const linkedUpdates = activityLinkedUpdatesMap[act.activityId] || [];
                    const varianceDays = act.varianceDays || 0;
                    const varianceBadge = formatVarianceBadge(varianceDays);

                    return (
                      <React.Fragment key={act.activityId}>
                        <tr
                          style={{
                            background: isExpanded ? 'var(--bg-surface-secondary)' : 'transparent',
                            transition: 'background 0.15s ease-out',
                          }}
                        >
                          {/* Expand Toggle */}
                          <td style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleRowExpanded(act.activityId)}>
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title={isExpanded ? 'Collapse Linked Evidence' : 'Expand Linked Evidence'}
                            >
                              {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </button>
                          </td>

                          {/* Activity ID & WBS */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.825rem' }}>
                                {act.activityId}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                WBS: <strong>{act.wbs}</strong>
                              </span>
                            </div>
                          </td>

                          {/* Activity Name */}
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                              {act.activityName}
                            </div>
                            {act.aliases && act.aliases.length > 0 && (
                              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                Aliases: {act.aliases.slice(0, 2).join(', ')}
                              </div>
                            )}
                          </td>

                          {/* Discipline & Workfront */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span className="mono-pill" style={{ fontSize: '0.675rem', alignSelf: 'flex-start' }}>
                                {act.discipline}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {act.area}
                              </span>
                            </div>
                          </td>

                          {/* Planned Baseline Dates */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
                              <span style={{ fontFamily: 'var(--font-mono)' }}>
                                {formatDisplayDate(act.plannedStart)} &rarr; {formatDisplayDate(act.plannedFinish)}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                Duration: {Math.max(1, diffDaysBetweenDates(act.plannedStart, act.plannedFinish))} days
                              </span>
                            </div>
                          </td>

                          {/* Actual Progress & Status */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 110 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 700 }}>
                                <span style={{ color: act.status === 'Completed' ? 'var(--status-ready-fg)' : act.status === 'Delayed' ? 'var(--status-unplanned-fg)' : 'var(--text-primary)' }}>
                                  {act.status || 'Not Started'}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>
                                  {act.progressPercent || 0}%
                                </span>
                              </div>
                              <div className="progress-bar-container" style={{ height: 5 }}>
                                <div
                                  className={`progress-bar-fill ${act.status === 'Completed' ? 'green' : act.status === 'Delayed' ? 'unplanned' : 'blue'}`}
                                  style={{ width: `${act.progressPercent || 0}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Schedule Variance */}
                          <td>
                            <span className={`status-badge ${varianceBadge.className}`} style={{ fontSize: '0.7rem' }}>
                              {varianceBadge.label}
                            </span>
                          </td>

                          {/* Verified Evidence Link Counter */}
                          <td>
                            {linkedUpdates.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => toggleRowExpanded(act.activityId)}
                                style={{
                                  background: 'rgba(56, 189, 248, 0.1)',
                                  border: '1px solid rgba(56, 189, 248, 0.3)',
                                  borderRadius: 4,
                                  padding: '2px 7px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: '#38bdf8',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <FileText size={11} />
                                <span>{linkedUpdates.length} {linkedUpdates.length === 1 ? 'Report' : 'Reports'}</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                0 linked
                              </span>
                            )}
                          </td>

                          {/* Action Hub */}
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedScheduleActivityId(act.activityId)}
                              style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                              title="Inspect full activity metadata & predecessors/successors"
                            >
                              <span>Inspect</span>
                              <ExternalLink size={11} />
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Evidence Accordion Row */}
                        {isExpanded && (
                          <tr style={{ background: 'var(--bg-surface-secondary)' }}>
                            <td colSpan={9} style={{ padding: '0.75rem 1.25rem 1rem' }}>
                              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                  <div style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <ShieldCheck size={14} style={{ color: 'var(--brand-primary)' }} />
                                    <span>Verified Field Reports Linked to [{act.activityId}]</span>
                                  </div>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Updates approve and propagate automatically from the Verification Queue
                                  </span>
                                </div>

                                {linkedUpdates.length === 0 ? (
                                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                                    No field updates are currently linked to this activity. Ingest a daily report in Data Ingestion Hub or verify recommendations in Verification Queue.
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {linkedUpdates.map(u => {
                                      const dec = plannerDecisions[u.id];
                                      const m = matchResults[u.id];
                                      const hasImg = u.images && u.images.length > 0;

                                      return (
                                        <div
                                          key={u.id}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.55rem 0.75rem',
                                            background: 'var(--bg-surface-secondary)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: 'var(--radius-xs)',
                                            fontSize: '0.75rem',
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                                              {u.id}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)' }}>
                                              {formatDisplayDate(u.reportDate)}
                                            </span>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              &ldquo;{u.extractedDescription || u.rawText}&rdquo;
                                            </span>
                                            {hasImg && (
                                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#0284c7', fontSize: '0.7rem', fontWeight: 700 }}>
                                                <Camera size={11} /> {u.images[0].confirmedTag || 'Photo Attached'}
                                              </span>
                                            )}
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className="status-badge ready" style={{ fontSize: '0.675rem' }}>
                                              {dec ? `Approved (${dec.status})` : `${m?.confidenceScore || 90}% AI Match`}
                                            </span>
                                            <button
                                              type="button"
                                              className="btn btn-secondary btn-sm"
                                              onClick={() => setSelectedInspectorUpdateId(u.id)}
                                              style={{ padding: '2px 7px', fontSize: '0.68rem' }}
                                            >
                                              <span>Evidence Inspector</span>
                                              <ArrowRight size={11} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredActivities.map(act => {
            const linkedUpdates = activityLinkedUpdatesMap[act.activityId] || [];
            const varianceDays = act.varianceDays || 0;
            const varianceBadge = formatVarianceBadge(varianceDays);

            return (
              <div key={act.activityId} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.85rem' }}>
                      {act.activityId}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                      WBS: {act.wbs}
                    </span>
                  </div>
                  <span className={`status-badge ${varianceBadge.className}`} style={{ fontSize: '0.675rem' }}>
                    {varianceBadge.label}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                  {act.activityName}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                  <span>Discipline: <strong>{act.discipline}</strong></span>
                  <span>Area: <strong>{act.area}</strong></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Planned: {formatDisplayDate(act.plannedStart)} &rarr; {formatDisplayDate(act.plannedFinish)}</span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 700, marginBottom: 3 }}>
                    <span style={{ color: act.status === 'Completed' ? 'var(--status-ready-fg)' : 'var(--text-primary)' }}>
                      {act.status || 'Not Started'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{act.progressPercent || 0}%</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: 6 }}>
                    <div
                      className={`progress-bar-fill ${act.status === 'Completed' ? 'green' : act.status === 'Delayed' ? 'unplanned' : 'blue'}`}
                      style={{ width: `${act.progressPercent || 0}%` }}
                    />
                  </div>
                </div>

                {/* Linked Evidence Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.725rem', color: '#38bdf8', fontWeight: 600 }}>
                    {linkedUpdates.length} Verified Field {linkedUpdates.length === 1 ? 'Update' : 'Updates'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedScheduleActivityId(act.activityId)}
                    style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                  >
                    <span>Details</span>
                    <ExternalLink size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}
    </div>
  );
};
