import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
  Mic,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  TrendingDown,
  TrendingUp,
  Calendar,
  Sparkles,
  ChevronRight,
  Eye,
  FileText,
  Radio,
  FileCheck2,
  Compass,
  UploadCloud,
  Sliders,
  ChevronDown,
  AlertOctagon,
  FileUp,
  Check,
  Flame,
  Link as LinkIcon
} from 'lucide-react';

export const HomeIntroductionView: React.FC = () => {
  const {
    theme,
    setActiveTab,
    startGuidedDemo,
    schedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    setSelectedScheduleActivityId,
    setSelectedInspectorUpdateId,
    navigateToPlannerReviewWithFilter,
    navigateToSiteUpdatesWithFilter,
  } = useProject();

  const isDark = theme === 'dark';

  const [focusCriticalPath, setFocusCriticalPath] = useState(false);
  const [selectedTimescale, setSelectedTimescale] = useState('Week View');

  // Mini Gantt activities
  const miniGanttRows = [
    {
      id: 'CIV-L6-001',
      name: 'Excavate pump foundation',
      type: 'planned',
      startOffset: '10%',
      width: '30%',
      color: '#94a3b8',
      status: 'Planned',
      critical: false,
    },
    {
      id: 'CIV-L6-002',
      name: 'Cast pump foundation concrete',
      type: 'actual',
      startOffset: '35%',
      width: '28%',
      color: '#3b82f6',
      status: 'Completed',
      critical: false,
    },
    {
      id: 'PIP-L6-012',
      name: 'Erect Line 24-CW-017',
      type: 'actual_delay',
      startOffset: '50%',
      width: '20%',
      delayWidth: '12%',
      color: '#3b82f6',
      delayColor: '#ef4444',
      status: 'Delayed',
      critical: true,
    },
    {
      id: 'PIP-L6-013',
      name: 'Weld line 24-CW-017',
      type: 'planned',
      startOffset: '60%',
      width: '25%',
      color: '#94a3b8',
      status: 'Planned',
      critical: true,
    },
    {
      id: 'PIP-L6-014',
      name: 'Hydrotest line 24-CW-017',
      type: 'actual',
      startOffset: '78%',
      width: '22%',
      color: '#3b82f6',
      status: 'In Progress',
      critical: false,
    },
  ];

  const displayedRows = focusCriticalPath
    ? miniGanttRows.filter(r => r.critical)
    : miniGanttRows;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. Hero Section with Industrial Plant Backdrop & Frosted Quote Card */}
      <div
        className="card"
        style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          position: 'relative',
          background: isDark
            ? 'linear-gradient(90deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.88) 55%, rgba(15, 23, 42, 0.35) 100%), url(/refinery_hero_banner.jpg)'
            : 'linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.88) 55%, rgba(255, 255, 255, 0.4) 100%), url(/refinery_hero_banner.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          minHeight: '260px',
          padding: '2.5rem 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Left Headline & CTAs */}
        <div style={{ maxWidth: '560px', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 900,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              margin: 0,
            }}
          >
            From Field Reality <br />
            to Schedule Intelligence
          </h1>

          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: 0,
              fontWeight: 500,
            }}
          >
            DATUM links daily site updates with your project schedule using AI and human expertise.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn"
              style={{
                background: '#047857',
                color: '#ffffff',
                padding: '0.65rem 1.35rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: '0 2px 8px rgba(4, 120, 87, 0.35)',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={startGuidedDemo}
            >
              <Play size={14} fill="#ffffff" />
              <span>Start Guided Demo</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-default)',
              }}
              onClick={() => setActiveTab('dashboard')}
            >
              <FileText size={15} style={{ color: 'var(--text-secondary)' }} />
              <span>Explore Workspace</span>
            </button>
          </div>
        </div>

        {/* Right Frosted Quote Card */}
        <div
          style={{
            zIndex: 2,
            background: isDark ? 'rgba(22, 31, 49, 0.88)' : 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(12px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.9)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            maxWidth: '280px',
            boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(15, 23, 42, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
          }}
        >
          <div
            style={{
              fontStyle: 'italic',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            &ldquo;Accurate progress today. A better tomorrow for every project.&rdquo;
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
            &mdash; DATUM
          </div>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {/* KPI 1: Project Progress */}
        <div className="card" style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Project Progress</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2, margin: '2px 0' }}>
              68%
            </div>
            <div style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 700, marginBottom: 6 }}>
              ↑ +12% this week
            </div>
            {/* Mini Progress Bar */}
            <div style={{ height: 4, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: '68%', height: '100%', background: '#059669' }} />
            </div>
          </div>
        </div>

        {/* KPI 2: Field Reports */}
        <div
          className="card clickable"
          onClick={() => setActiveTab('site-updates')}
          style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer' }}
          title="Click to view daily field reports"
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Field Reports</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2, margin: '2px 0' }}>
              17
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              5 need review
            </div>
          </div>
        </div>

        {/* KPI 3: Auto-Matched */}
        <div
          className="card clickable"
          onClick={() => setActiveTab('planner-review')}
          style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer' }}
          title="Click to view AI Match Matrix"
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: '#eff6ff',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LinkIcon size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Auto-Matched</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2, margin: '2px 0' }}>
              9
            </div>
            <div style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 600 }}>
              94% avg. confidence
            </div>
          </div>
        </div>

        {/* KPI 4: Potential Delay Risk */}
        <div
          className="card clickable"
          onClick={() => setActiveTab('copilot')}
          style={{ padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer' }}
          title="Click to view Delay Simulator"
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Potential Delay Risk</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#b91c1c', lineHeight: 1.2, margin: '2px 0' }}>
              2
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              1 critical path
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: 4D Schedule Overview (Left) + Recent Field Updates (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
        
        {/* 4D Schedule Overview Card */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: '#059669' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                4D Schedule Overview
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Week View Dropdown */}
              <select
                className="form-select"
                value={selectedTimescale}
                onChange={e => setSelectedTimescale(e.target.value)}
                style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 'var(--radius-xs)' }}
              >
                <option value="Week View">Week View</option>
                <option value="Day View">Day View</option>
                <option value="Month View">Month View</option>
              </select>

              {/* Focus Critical Path Button */}
              <button
                type="button"
                className={`btn btn-sm ${focusCriticalPath ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.725rem', padding: '3px 8px', gap: 4 }}
                onClick={() => setFocusCriticalPath(!focusCriticalPath)}
              >
                <Sparkles size={12} />
                <span>Focus Critical Path</span>
              </button>
            </div>
          </div>

          {/* Mini Gantt Grid */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-surface)' }}>
            {/* Table Header with Date Columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 170px 1fr 1fr 1fr 1fr',
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.725rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <div>ID</div>
              <div>Activity Name</div>
              <div style={{ textAlign: 'center' }}>Aug 25</div>
              <div style={{ textAlign: 'center' }}>Sep 1</div>
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <span
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '2px 7px',
                    borderRadius: 3,
                    fontSize: '0.675rem',
                    fontWeight: 800,
                  }}
                >
                  Sep 8 (Today)
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>Sep 15</div>
            </div>

            {/* Timeline Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {displayedRows.map((row, idx) => (
                <div
                  key={row.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 170px 1fr',
                    padding: '0.55rem 0.75rem',
                    borderBottom: idx < displayedRows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    {row.id}
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
                    {row.name}
                  </div>

                  {/* Canvas Bar Area */}
                  <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                    {/* Vertical Today Line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '62.5%',
                        top: 0,
                        bottom: 0,
                        width: 1,
                        borderLeft: '1px dashed #64748b',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Bar */}
                    <div
                      style={{
                        position: 'absolute',
                        left: row.startOffset,
                        width: row.width,
                        height: 12,
                        borderRadius: 3,
                        background: row.color,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }}
                    />

                    {/* Delay extension if present */}
                    {row.delayWidth && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `calc(${row.startOffset} + ${row.width})`,
                          width: row.delayWidth,
                          height: 12,
                          borderRadius: '0 3px 3px 0',
                          background: row.delayColor,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.85rem', fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 8, background: '#94a3b8', borderRadius: 2 }} />
              <span>Planned</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 8, background: '#3b82f6', borderRadius: 2 }} />
              <span>Actual</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 8, background: '#ef4444', borderRadius: 2 }} />
              <span>Delay</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, background: '#ef4444', transform: 'rotate(45deg)' }} />
              <span>Critical</span>
            </div>
          </div>
        </div>

        {/* Recent Field Updates Card */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: '#059669' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Recent Field Updates
              </h3>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.75rem', padding: 0 }}
              onClick={() => setActiveTab('site-updates')}
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Feed List Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Update 1 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.65rem 0.75rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
              onClick={() => navigateToSiteUpdatesWithFilter({ discipline: 'Piping' })}
            >
              <CheckCircle2 size={16} style={{ color: '#059669', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  CW spool fabrication completed
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 1 }}>
                  PIP-L6-011 • Pump Bay
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>2h ago</div>
                <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#059669' }}>94%</div>
              </div>
            </div>

            {/* Update 2 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.65rem 0.75rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
              onClick={() => navigateToPlannerReviewWithFilter('review')}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fef3c7',
                  color: '#d97706',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                  flexShrink: 0,
                }}
              >
                !
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  24 inch CW spool erected near pump bay
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                  <span style={{ fontSize: '0.675rem', color: '#d97706', fontWeight: 700 }}>Unmatched</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>• Pump Bay</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>5h ago</div>
                <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#d97706' }}>74%</div>
              </div>
            </div>

            {/* Update 3 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.65rem 0.75rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
              onClick={() => navigateToSiteUpdatesWithFilter({ discipline: 'Piping' })}
            >
              <CheckCircle2 size={16} style={{ color: '#059669', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Pipe erection at filter bay
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 1 }}>
                  PIP-L6-015 • Filter Bay
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1d ago</div>
                <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#059669' }}>94%</div>
              </div>
            </div>

            {/* Update 4 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.65rem 0.75rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
              onClick={() => navigateToPlannerReviewWithFilter('review')}
            >
              <AlertOctagon size={16} style={{ color: '#ef4444', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Pump suction spool fit-up started
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                  <span style={{ fontSize: '0.675rem', color: '#b91c1c', fontWeight: 700 }}>Needs Review</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>• Pump Bay</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1d ago</div>
                <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#b91c1c' }}>48%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. "Your Workflow with DATUM" (6-Step Pipeline) */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={18} style={{ color: '#059669' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Your Workflow with DATUM
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            From unstructured updates to verified project intelligence
          </span>
        </div>

        {/* 6 Connected Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', position: 'relative' }}>
          {[
            { num: 1, title: 'Field Input', desc: 'Text, voice, photos', tab: 'supervisor-entry' as const },
            { num: 2, title: 'Understand', desc: 'AI extraction & tagging', tab: 'supervisor-entry' as const },
            { num: 3, title: 'Match', desc: 'Link to L5/L6 activities', tab: 'planner-review' as const },
            { num: 4, title: 'Review', desc: 'Human validation', tab: 'planner-review' as const },
            { num: 5, title: 'Reconcile', desc: 'Update schedule', tab: 'dashboard' as const },
            { num: 6, title: 'Analyze', desc: 'Insights & forecasting', tab: 'copilot' as const },
          ].map((step, idx) => (
            <div
              key={step.num}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab(step.tab)}
            >
              {/* Number Circle */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#2563eb',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 2,
                }}
              >
                {step.num}
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {step.num} {step.title}
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Bottom 3-Column Section: Needs Attention + Project Insights + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
        
        {/* Column 1: Needs Attention */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ color: '#ef4444' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Needs Attention
              </h3>
            </div>
            <span
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 999,
              }}
            >
              5
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {/* Attention Item 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Pump suction line installation delay
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PIP-L6-016 • Pump Bay</div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                onClick={() => navigateToPlannerReviewWithFilter('review')}
              >
                Review
              </button>
            </div>

            {/* Attention Item 2 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d97706', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Incomplete equipment tag in report
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ELE-L6-021 • Substation</div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                onClick={() => navigateToPlannerReviewWithFilter('review')}
              >
                Review
              </button>
            </div>

            {/* Attention Item 3 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d97706', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Unplanned work: temporary line
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Piping • Filter Bay</div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                onClick={() => navigateToPlannerReviewWithFilter('unplanned')}
              >
                Review
              </button>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.75rem', padding: 0 }}
              onClick={() => navigateToPlannerReviewWithFilter('review')}
            >
              <span>View All Items</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Column 2: Project Insights */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <TrendingUp size={18} style={{ color: '#059669' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Project Insights
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {/* Insight 1 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <CheckCircle2 size={16} style={{ color: '#059669', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  On track for current milestone
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Pump foundation phase 68% complete.
                </div>
              </div>
            </div>

            {/* Insight 2 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <TrendingDown size={16} style={{ color: '#2563eb', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Potential 3-day impact
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Delay in CW line may affect downstream welding.
                </div>
              </div>
            </div>

            {/* Insight 3 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                  flexShrink: 0,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  4 new field updates today
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  3 auto-matched, 1 needs review.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.75rem', padding: 0 }}
              onClick={() => setActiveTab('dashboard')}
            >
              <span>View Analytics</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Column 3: Quick Actions */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Sparkles size={18} style={{ color: '#059669' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Quick Actions
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.8rem', padding: '0.55rem 0.85rem' }}
              onClick={() => setActiveTab('upload')}
            >
              <FileUp size={15} style={{ color: 'var(--brand-primary)' }} />
              <span>Upload Daily Report</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.8rem', padding: '0.55rem 0.85rem' }}
              onClick={() => setActiveTab('supervisor-entry')}
            >
              <Mic size={15} style={{ color: '#059669' }} />
              <span>Open Voice & OCR Studio</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.8rem', padding: '0.55rem 0.85rem' }}
              onClick={() => setActiveTab('schedule-activities')}
            >
              <Calendar size={15} style={{ color: '#2563eb' }} />
              <span>View Gantt Timeline</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', gap: 8, fontSize: '0.8rem', padding: '0.55rem 0.85rem' }}
              onClick={() => setActiveTab('copilot')}
            >
              <Play size={15} style={{ color: '#d97706' }} />
              <span>Run Delay Simulation</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
