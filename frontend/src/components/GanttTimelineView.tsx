import React, { useState, useMemo } from 'react';
import { ScheduleActivity, SiteUpdate } from '../types';
import { useProject } from '../context/ProjectContext';
import {
  Layers,
  TrendingUp,
  Activity,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Camera,
  Users,
  Building2,
  Flame,
  Zap,
  Boxes,
  Wrench,
  ChevronRight,
  ArrowRight,
  Filter,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface GanttTimelineViewProps {
  activities: ScheduleActivity[];
  siteUpdates: SiteUpdate[];
  onSelectActivity: (id: string) => void;
}

interface WorkfrontZone {
  id: string;
  name: string;
  areaCode: string;
  discipline: string;
  progress: number;
  status: 'on-track' | 'critical-delay' | 'ahead' | 'completed';
  statusText: string;
  statusBadge: string;
  activeMilestone: string;
  crew: string;
  manpower: number;
  lastUpdated: string;
  linkedPhotosCount: number;
  activityId: string;
  delayDays?: number;
  riskReason?: string;
  icon: 'pump' | 'piperack' | 'filter' | 'substation' | 'tank' | 'control';
}

const WORKFRONT_ZONES: WorkfrontZone[] = [
  {
    id: 'wf-pump-bay',
    name: 'Unit-01: Main Pump Bay',
    areaCode: 'Unit-01',
    discipline: 'Mechanical & Piping',
    progress: 72,
    status: 'on-track',
    statusText: 'Fabrication and erection proceeding within baseline buffer',
    statusBadge: '● On Track',
    activeMilestone: 'Erect & Align Line 24-CW-017 Spool',
    crew: 'C-01 Piping Crew',
    manpower: 14,
    lastUpdated: '2 hours ago',
    linkedPhotosCount: 4,
    activityId: 'PIP-L6-011',
    icon: 'pump',
  },
  {
    id: 'wf-pipe-rack',
    name: 'Unit-02: Modular Pipe Rack Corridor',
    areaCode: 'Unit-02',
    discipline: 'Structural & Piping',
    progress: 88,
    status: 'ahead',
    statusText: 'Pre-assembled structural modules erected ahead of schedule',
    statusBadge: '▲ +3d Ahead',
    activeMilestone: 'Pipe rack Tier-2 spool tie-ins',
    crew: 'P-04 Heavy Rigging',
    manpower: 12,
    lastUpdated: '1 hour ago',
    linkedPhotosCount: 3,
    activityId: 'PIP-L6-015',
    icon: 'piperack',
  },
  {
    id: 'wf-filter-bay',
    name: 'Unit-03: Secondary Filter Bay',
    areaCode: 'Unit-03',
    discipline: 'Civil & Structural',
    progress: 54,
    status: 'on-track',
    statusText: 'Foundation concrete 28-day curing completed; pump base ready',
    statusBadge: '● Steady Progress',
    activeMilestone: 'Cast & grout pump foundation plinths',
    crew: 'C-02 Civil Works',
    manpower: 8,
    lastUpdated: '4 hours ago',
    linkedPhotosCount: 2,
    activityId: 'CIV-L6-002',
    icon: 'filter',
  },
  {
    id: 'wf-substation',
    name: 'Unit-04: Electrical Substation & Transformer',
    areaCode: 'Unit-04',
    discipline: 'Electrical & Heavy Lift',
    progress: 36,
    status: 'critical-delay',
    statusText: 'Transformer placement halted due to hydraulic crane maintenance',
    statusBadge: '⚠️ -4.2d Critical Slip',
    activeMilestone: 'Transformer Bay Crane Heavy Lift',
    crew: 'E-03 Electrical Rigging',
    manpower: 10,
    lastUpdated: '30 mins ago',
    linkedPhotosCount: 5,
    activityId: 'ELE-L6-021',
    delayDays: 4.2,
    riskReason: 'Crane Hyd-02 maintenance exhausted float on critical path',
    icon: 'substation',
  },
  {
    id: 'wf-tank-farm',
    name: 'Unit-05: Crude Storage Tank Farm',
    areaCode: 'Unit-05',
    discipline: 'Civil & Earthworks',
    progress: 28,
    status: 'on-track',
    statusText: 'Tank pad ring foundation excavation and rebar cage tying',
    statusBadge: '● In Progress',
    activeMilestone: 'Excavate crude storage ring wall',
    crew: 'C-03 Earthworks Crew',
    manpower: 6,
    lastUpdated: '6 hours ago',
    linkedPhotosCount: 2,
    activityId: 'CIV-L6-004',
    icon: 'tank',
  },
  {
    id: 'wf-control-room',
    name: 'Unit-06: Central Control Building',
    areaCode: 'Unit-06',
    discipline: 'Instrumentation',
    progress: 100,
    status: 'completed',
    statusText: 'DCS racks and cable tray raceways 100% installed and sealed',
    statusBadge: '✓ 100% Complete',
    activeMilestone: 'Control room cable trench & raceways',
    crew: 'I-01 Instrument Techs',
    manpower: 0,
    lastUpdated: 'Yesterday',
    linkedPhotosCount: 6,
    activityId: 'CIV-L6-001',
    icon: 'control',
  },
];

interface ProjectMilestonePhase {
  phaseNum: number;
  name: string;
  progress: number;
  status: 'completed' | 'active' | 'in-review' | 'upcoming';
  statusText: string;
  duration: string;
  dateRange: string;
  logsCount: number;
  critical: boolean;
  tasks: string[];
}

const MILESTONE_PHASES: ProjectMilestonePhase[] = [
  {
    phaseNum: 1,
    name: 'Civil Excavation & Heavy Foundations',
    progress: 100,
    status: 'completed',
    statusText: 'All pump bays & ring wall plinths cast and verified',
    duration: '14 Days',
    dateRange: 'Aug 20 → Sep 03, 2026',
    logsCount: 32,
    critical: false,
    tasks: ['Excavate pump foundation (CIV-001)', 'Pour reinforced concrete plinths (CIV-002)'],
  },
  {
    phaseNum: 2,
    name: 'Piping Spool Fabrication & Field Erection',
    progress: 68,
    status: 'active',
    statusText: 'CW line 24-CW-017 in progress; 14 workers active on site',
    duration: '21 Days',
    dateRange: 'Sep 01 → Sep 21, 2026',
    logsCount: 18,
    critical: true,
    tasks: ['Fabricate 24-CW spool (PIP-011)', 'Weld field joint (PIP-013)'],
  },
  {
    phaseNum: 3,
    name: 'Hydrotesting & NDT Quality Clearance',
    progress: 25,
    status: 'in-review',
    statusText: '⚠️ Hydrotest test pack delayed by crane downtime in Unit-04',
    duration: '12 Days',
    dateRange: 'Sep 15 → Sep 27, 2026',
    logsCount: 6,
    critical: true,
    tasks: ['Hydrotest Line 24-CW-017 (PIP-014)', 'Radiographic weld test'],
  },
  {
    phaseNum: 4,
    name: 'Electrical Substation & Transformer Energization',
    progress: 10,
    status: 'upcoming',
    statusText: 'Scheduled after crane replacement is commissioned',
    duration: '18 Days',
    dateRange: 'Sep 22 → Oct 10, 2026',
    logsCount: 2,
    critical: false,
    tasks: ['Install cable tray in pump bay (ELE-021)', 'Transformer busbar coupling'],
  },
  {
    phaseNum: 5,
    name: 'Integrated Commissioning & Plant Handover',
    progress: 0,
    status: 'upcoming',
    statusText: 'Pre-commissioning loops & P6 milestone final acceptance',
    duration: '15 Days',
    dateRange: 'Oct 10 → Oct 28, 2026',
    logsCount: 0,
    critical: false,
    tasks: ['Nitrogen purge & loop testing', 'Commercial operation certificate'],
  },
];

export const GanttTimelineView: React.FC<GanttTimelineViewProps> = ({
  activities,
  siteUpdates,
  onSelectActivity,
}) => {
  const { setActiveTab: navigateTab, navigateToSiteUpdatesWithFilter } = useProject();
  const [activeViewTab, setActiveViewTab] = useState<'digital-twin' | 'roadmap' | 'scurve'>('digital-twin');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<'all' | 'on-track' | 'critical-delay' | 'ahead'>('all');

  const filteredZones = useMemo(() => {
    if (selectedZoneFilter === 'all') return WORKFRONT_ZONES;
    return WORKFRONT_ZONES.filter(z => z.status === selectedZoneFilter);
  }, [selectedZoneFilter]);

  // EVM metrics
  const evmMetrics = useMemo(() => {
    return {
      spi: 0.94,
      cpi: 0.94,
      earnedValue: 68,
      plannedValue: 74,
      varianceDays: 4.2,
      eacForecastDate: '2026-10-24',
    };
  }, []);

  const getZoneIcon = (iconType: string) => {
    switch (iconType) {
      case 'pump': return <Wrench size={18} />;
      case 'piperack': return <Boxes size={18} />;
      case 'filter': return <Building2 size={18} />;
      case 'substation': return <Zap size={18} />;
      case 'tank': return <Flame size={18} />;
      default: return <Layers size={18} />;
    }
  };

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* Top Header Strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 3 }}>
            <span className="brand-badge" style={{ fontSize: '0.725rem' }}>
              4D Physical Digital Twin
            </span>
            <span className="mono-pill" style={{ fontSize: '0.725rem' }}>
              IOCL Refinery • Phase 4
            </span>
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
            <Activity size={18} style={{ color: 'var(--brand-primary)' }} />
            4D Workfront Digital Twin & Milestone Velocity Suite
          </h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
            Instant visual understanding of physical plant execution, contractor velocity, and schedule health.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="filter-pill-group">
          <button
            type="button"
            className={`filter-pill ${activeViewTab === 'digital-twin' ? 'active' : ''}`}
            onClick={() => setActiveViewTab('digital-twin')}
          >
            <Layers size={13} />
            <span>4D Workfront Twin</span>
          </button>

          <button
            type="button"
            className={`filter-pill ${activeViewTab === 'roadmap' ? 'active' : ''}`}
            onClick={() => setActiveViewTab('roadmap')}
          >
            <ArrowRight size={13} />
            <span>Milestone Roadmap</span>
          </button>

          <button
            type="button"
            className={`filter-pill ${activeViewTab === 'scurve' ? 'active' : ''}`}
            onClick={() => setActiveViewTab('scurve')}
          >
            <TrendingUp size={13} />
            <span>EVM S-Curve</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: 4D WORKFRONT DIGITAL TWIN (ACTIVE DEFAULT)
          ========================================================================= */}
      {activeViewTab === 'digital-twin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Executive Workfront Telemetry Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Filter Workfronts:
              </span>
              <button
                type="button"
                className={`btn btn-sm ${selectedZoneFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedZoneFilter('all')}
                style={{ fontSize: '0.7rem', padding: '3px 8px' }}
              >
                All Zones ({WORKFRONT_ZONES.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedZoneFilter === 'critical-delay' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setSelectedZoneFilter('critical-delay')}
                style={{ fontSize: '0.7rem', padding: '3px 8px' }}
              >
                ⚠️ At Risk (1)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${selectedZoneFilter === 'ahead' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedZoneFilter('ahead')}
                style={{ fontSize: '0.7rem', padding: '3px 8px' }}
              >
                Ahead (+3d)
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={13} style={{ color: 'var(--brand-primary)' }} />
                <span><strong>50</strong> Active Workers on Site</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Camera size={13} style={{ color: '#10b981' }} />
                <span><strong>22</strong> Photo Evidences Linked</span>
              </div>
            </div>
          </div>

          {/* Interactive Workfront Plant Spatial Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredZones.map((zone) => {
              const isDelayed = zone.status === 'critical-delay';

              return (
                <div
                  key={zone.id}
                  style={{
                    background: isDelayed ? 'rgba(244, 63, 94, 0.04)' : 'var(--bg-surface)',
                    border: `1px solid ${isDelayed ? 'rgba(244, 63, 94, 0.35)' : 'var(--border-default)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-sm)',
                          background: isDelayed ? 'rgba(244, 63, 94, 0.15)' : 'var(--brand-surface)',
                          color: isDelayed ? '#f43f5e' : 'var(--brand-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {getZoneIcon(zone.icon)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {zone.name}
                        </div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                          {zone.discipline}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: isDelayed ? 'rgba(244, 63, 94, 0.15)' : zone.progress === 100 ? '#ecfdf5' : 'var(--bg-subtle)',
                        color: isDelayed ? '#f43f5e' : zone.progress === 100 ? '#059669' : 'var(--brand-primary)',
                        border: `1px solid ${isDelayed ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-subtle)'}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {zone.statusBadge}
                    </span>
                  </div>

                  {/* Progress Ring & Metric Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    {/* Donut Progress */}
                    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                      <svg width="44" height="44" viewBox="0 0 44 44">
                        <circle cx="22" cy="22" r="17" fill="none" stroke="var(--border-subtle)" strokeWidth="4" />
                        <circle
                          cx="22"
                          cy="22"
                          r="17"
                          fill="none"
                          stroke={isDelayed ? '#f43f5e' : zone.progress === 100 ? '#10b981' : '#3b82f6'}
                          strokeWidth="4"
                          strokeDasharray="106.8"
                          strokeDashoffset={106.8 - (106.8 * zone.progress) / 100}
                          strokeLinecap="round"
                          transform="rotate(-90 22 22)"
                        />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {zone.progress}%
                      </div>
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                        Active: {zone.activeMilestone}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                        {zone.statusText}
                      </div>
                    </div>
                  </div>

                  {/* Crew & Photo Evidence Telemetry */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} />
                      <span>{zone.crew} ({zone.manpower} workers)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-primary)', fontWeight: 600 }}>
                      <Camera size={12} />
                      <span>{zone.linkedPhotosCount} Photos</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 'auto', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigateToSiteUpdatesWithFilter({ search: zone.areaCode })}
                      style={{ fontSize: '0.675rem', padding: '0.3rem 0.5rem', justifyContent: 'center' }}
                    >
                      <Camera size={12} />
                      <span>Site Logs</span>
                    </button>

                    {isDelayed ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => navigateTab('copilot')}
                        style={{ fontSize: '0.675rem', padding: '0.3rem 0.5rem', justifyContent: 'center', background: '#e11d48' }}
                      >
                        <AlertTriangle size={12} />
                        <span>Simulate Delay</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectActivity(zone.activityId)}
                        style={{ fontSize: '0.675rem', padding: '0.3rem 0.5rem', justifyContent: 'center' }}
                      >
                        <ExternalLink size={12} />
                        <span>WBS Inspect</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MILESTONE VELOCITY ROADMAP
          ========================================================================= */}
      {activeViewTab === 'roadmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            <strong>Executive Milestone Pipeline:</strong> Sequence of major construction deliverables derived from Primavera baseline. Each milestone tracks real field log completions and critical path risk propagation.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {MILESTONE_PHASES.map((phase) => {
              const isDone = phase.status === 'completed';
              const isActive = phase.status === 'active';
              const isInReview = phase.status === 'in-review';

              return (
                <div
                  key={phase.phaseNum}
                  style={{
                    background: isInReview ? 'rgba(244, 63, 94, 0.03)' : 'var(--bg-surface)',
                    border: `1px solid ${isInReview ? 'rgba(244, 63, 94, 0.3)' : isActive ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  {/* Left Phase Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 260 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: isDone ? '#10b981' : isActive ? 'var(--brand-primary)' : isInReview ? '#f43f5e' : 'var(--border-subtle)',
                        color: isDone || isActive || isInReview ? '#ffffff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {isDone ? <Check size={18} strokeWidth={3} /> : `0${phase.phaseNum}`}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {phase.name}
                        </span>
                        {phase.critical && (
                          <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                            Critical Path
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: isInReview ? '#f43f5e' : 'var(--text-secondary)' }}>
                        {phase.statusText}
                      </div>
                    </div>
                  </div>

                  {/* Middle Progress Bar */}
                  <div style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.675rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{phase.dateRange}</span>
                      <span style={{ fontWeight: 800, color: isDone ? '#059669' : 'var(--text-primary)' }}>{phase.progress}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${phase.progress}%`,
                          height: '100%',
                          background: isDone ? '#10b981' : isInReview ? '#f43f5e' : 'var(--brand-primary)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>

                  {/* Right Meta Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      {phase.duration}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigateTab('planner-review')}
                      style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                    >
                      <span>Inspect</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: EARNED VALUE (EVM) S-CURVE FORENSIC DEEP-DIVE
          ========================================================================= */}
      {activeViewTab === 'scurve' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* EVM Metrics Cards Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
            <div className="card" style={{ padding: '0.85rem', borderLeft: '4px solid var(--brand-primary)' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Schedule Performance (SPI)
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: evmMetrics.spi >= 1.0 ? '#047857' : '#f59e0b', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                {evmMetrics.spi}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {evmMetrics.spi >= 1.0 ? 'Ahead of Planned Schedule' : 'Schedule Friction (+4.2d slip)'}
              </div>
            </div>

            <div className="card" style={{ padding: '0.85rem', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Earned Progress (EV)
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                {evmMetrics.earnedValue}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Target Planned: {evmMetrics.plannedValue}%
              </div>
            </div>

            <div className="card" style={{ padding: '0.85rem', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Cost Performance (CPI)
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                {evmMetrics.cpi}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Labor & Equipment Efficiency
              </div>
            </div>

            <div className="card" style={{ padding: '0.85rem', borderLeft: '4px solid #b91c1c' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                EAC Forecast Finish
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b91c1c', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                {evmMetrics.eacForecastDate}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Baseline: 2026-10-18 (+6d slip)
              </div>
            </div>
          </div>

          {/* S-Curve SVG Visualization Card */}
          <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Cumulative Progress S-Curve (Planned Value vs Earned Value)
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                  Derived from daily supervisor field logs reconciled against Primavera WBS milestones.
                </p>
              </div>

              {/* S-Curve Legend */}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 14, height: 3, background: '#94a3b8' }} />
                  <span>Planned Value (PV)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 14, height: 3, background: '#059669' }} />
                  <strong>Earned Value (EV)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 14, height: 3, background: '#0284c7' }} />
                  <span>Actuals (AC)</span>
                </div>
              </div>
            </div>

            {/* SVG S-Curve Chart */}
            <div style={{ width: '100%', height: 260 }}>
              <svg width="100%" height="100%" viewBox="0 0 800 240" preserveAspectRatio="none">
                <line x1="60" y1="20" x2="780" y2="20" stroke="var(--border-subtle)" strokeDasharray="4,4" />
                <text x="35" y="24" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">100%</text>

                <line x1="60" y1="75" x2="780" y2="75" stroke="var(--border-subtle)" strokeDasharray="4,4" />
                <text x="35" y="79" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">75%</text>

                <line x1="60" y1="130" x2="780" y2="130" stroke="var(--border-subtle)" strokeDasharray="4,4" />
                <text x="35" y="134" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">50%</text>

                <line x1="60" y1="185" x2="780" y2="185" stroke="var(--border-subtle)" strokeDasharray="4,4" />
                <text x="35" y="189" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">25%</text>

                <line x1="60" y1="220" x2="780" y2="220" stroke="var(--border-default)" strokeWidth="1.5" />
                <text x="45" y="224" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">0%</text>

                {/* Vertical Time Marker (Today) */}
                <line x1="320" y1="20" x2="320" y2="220" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" />
                <text x="325" y="32" fill="#ef4444" fontSize="10" fontWeight="bold" fontFamily="var(--font-mono)">Current Date (Sep 8)</text>

                {/* 1. Planned Value Curve (PV) */}
                <path d="M 60,220 C 180,215 280,160 440,90 C 600,35 700,20 780,20" fill="none" stroke="#94a3b8" strokeWidth="3" />

                {/* 2. Actuals Curve (AC) */}
                <path d="M 60,220 C 180,218 260,170 320,135" fill="none" stroke="#0284c7" strokeWidth="3" />

                {/* 3. Earned Value Curve (EV) */}
                <path d="M 60,220 C 180,218 260,180 320,148" fill="none" stroke="#059669" strokeWidth="4" />

                {/* Forecast Extrapolation Line */}
                <path d="M 320,148 C 460,95 620,45 780,30" fill="none" stroke="#059669" strokeWidth="3" strokeDasharray="6,4" />

                <circle cx="320" cy="148" r="6" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                <circle cx="320" cy="130" r="5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--brand-primary)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '0.75rem' }}>
              <strong>EVM Forensic Synthesis:</strong> Project is progressing at an <strong>SPI of {evmMetrics.spi}</strong>. Reconciled field evidence forecasts cumulative recovery by Oct 15 once spool welds on 24-CW-017 clear hydrotesting QA.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

