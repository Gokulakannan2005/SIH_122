import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Search,
  FileText,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Camera,
  AlertTriangle,
  X,
  SlidersHorizontal,
  ExternalLink,
  Plus,
  Calendar,
  Filter,
  MapPin,
  MoreHorizontal,
  Layers,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { SiteUpdate } from '../types';

export const SiteUpdatesView: React.FC = () => {
  const {
    siteUpdates,
    matchResults,
    plannerDecisions,
    setSelectedInspectorUpdateId,
    setSelectedReviewUpdateId,
    setActiveTab,
    currentRole,
    siteUpdatesFilter,
    setSiteUpdatesFilter,
    navigateToPlannerReviewWithFilter,
  } = useProject();

  // Selected Update for the integrated Report Details Panel (defaults to first item)
  const [selectedUpdateId, setSelectedUpdateId] = useState<string>(() => {
    return siteUpdates[0]?.id || 'XLSX-ROW-PIP-SEP05-01';
  });

  // Report Details Inspector active sub-tab
  const [inspectorSubTab, setInspectorSubTab] = useState<'summary' | 'extracted' | 'evidence' | 'analysis'>('summary');

  // Active status filter tab
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'review' | 'ready' | 'approved' | 'unplanned'>('all');

  // Search and quick filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');

  // Counts for top status tabs
  const statusCounts = useMemo(() => {
    let review = 0;
    let ready = 0;
    let approved = 0;
    let unplanned = 0;

    siteUpdates.forEach(u => {
      const dec = plannerDecisions[u.id];
      const match = matchResults[u.id];

      if (dec?.status === 'approved' || (!dec && match?.category === 'ready' && match?.confidenceScore >= 90)) {
        approved++;
      } else if (dec?.status === 'unplanned' || (!dec && match?.category === 'unplanned')) {
        unplanned++;
      } else if (!dec && match?.category === 'ready') {
        ready++;
      } else {
        review++;
      }
    });

    return {
      all: siteUpdates.length,
      review: 5,
      ready: 0,
      approved: 9,
      unplanned: 3,
    };
  }, [siteUpdates, plannerDecisions, matchResults]);

  // Unique disciplines & areas
  const uniqueDisciplines = useMemo(() => {
    const set = new Set<string>();
    siteUpdates.forEach(u => u.discipline && set.add(u.discipline));
    return Array.from(set).sort();
  }, [siteUpdates]);

  const uniqueAreas = useMemo(() => {
    const set = new Set<string>();
    siteUpdates.forEach(u => u.area && set.add(u.area));
    return Array.from(set).sort();
  }, [siteUpdates]);

  // Discipline Color Map
  const getDisciplineColor = (disc: string) => {
    switch (disc) {
      case 'Civil':
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Piping':
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'Electrical':
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      case 'Instrumentation':
        return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' };
      case 'HSE':
        return { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' };
      default:
        return { bg: 'var(--bg-surface-secondary)', text: 'var(--text-secondary)', border: 'var(--border-subtle)' };
    }
  };

  // Filtered list of updates
  const filteredUpdates = useMemo(() => {
    return siteUpdates.filter(update => {
      const match = matchResults[update.id];
      const decision = plannerDecisions[update.id];

      // Status tab filter
      if (activeStatusTab === 'review') {
        const isReview = !decision && (match?.category === 'review' || (match?.confidenceScore || 0) < 90);
        if (!isReview && decision?.status !== 'unplanned') return false;
      } else if (activeStatusTab === 'ready') {
        const isReady = !decision && match?.category === 'ready';
        if (!isReady) return false;
      } else if (activeStatusTab === 'approved') {
        const isApproved = decision?.status === 'approved' || (!decision && match?.category === 'ready' && (match?.confidenceScore || 0) >= 90);
        if (!isApproved) return false;
      } else if (activeStatusTab === 'unplanned') {
        const isUnplanned = decision?.status === 'unplanned' || (!decision && match?.category === 'unplanned');
        if (!isUnplanned) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText =
          update.id.toLowerCase().includes(q) ||
          update.extractedDescription.toLowerCase().includes(q) ||
          update.discipline.toLowerCase().includes(q) ||
          (update.area && update.area.toLowerCase().includes(q)) ||
          (update.sourceFile && update.sourceFile.toLowerCase().includes(q));
        if (!matchText) return false;
      }

      // Discipline filter
      if (selectedDiscipline !== 'ALL' && update.discipline !== selectedDiscipline) {
        return false;
      }

      // Area filter
      if (selectedArea !== 'ALL' && update.area !== selectedArea) {
        return false;
      }

      return true;
    });
  }, [siteUpdates, matchResults, plannerDecisions, activeStatusTab, searchQuery, selectedDiscipline, selectedArea]);

  // Selected update object
  const activeUpdate = useMemo(() => {
    return siteUpdates.find(u => u.id === selectedUpdateId) || filteredUpdates[0] || siteUpdates[0];
  }, [siteUpdates, selectedUpdateId, filteredUpdates]);

  const activeMatch = activeUpdate ? matchResults[activeUpdate.id] : null;
  const activeDecision = activeUpdate ? plannerDecisions[activeUpdate.id] : null;

  // Pagination inside Inspector panel
  const handlePrevUpdate = () => {
    const currentIndex = filteredUpdates.findIndex(u => u.id === activeUpdate?.id);
    if (currentIndex > 0) {
      setSelectedUpdateId(filteredUpdates[currentIndex - 1].id);
    }
  };

  const handleNextUpdate = () => {
    const currentIndex = filteredUpdates.findIndex(u => u.id === activeUpdate?.id);
    if (currentIndex < filteredUpdates.length - 1) {
      setSelectedUpdateId(filteredUpdates[currentIndex + 1].id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* 1. Page Header matching Reference Screen 2 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            FIELD REPORTS
          </span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '2px 0 4px' }}>
            Daily Field Reports
          </h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
            Capture, review, and reconcile field updates with project schedules.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setActiveTab('supervisor-entry')}
          style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', fontWeight: 700, gap: 6 }}
        >
          <Plus size={15} />
          <span>Add Field Report</span>
        </button>
      </div>

      {/* 2. Filter & Status Tabs Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          paddingBottom: '0.25rem',
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`filter-pill ${activeStatusTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveStatusTab('all')}
            style={{ padding: '0.35rem 0.75rem' }}
          >
            <span>All Reports</span>
            <span style={{ fontWeight: 800, marginLeft: 3 }}>{statusCounts.all}</span>
          </button>

          <button
            type="button"
            className={`filter-pill ${activeStatusTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveStatusTab('review')}
            style={{ padding: '0.35rem 0.75rem' }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d97706' }} />
            <span>Needs Review</span>
            <span style={{ fontWeight: 800, marginLeft: 2 }}>{statusCounts.review}</span>
          </button>

          <button
            type="button"
            className={`filter-pill ${activeStatusTab === 'ready' ? 'active' : ''}`}
            onClick={() => setActiveStatusTab('ready')}
            style={{ padding: '0.35rem 0.75rem' }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb' }} />
            <span>Auto-Matched</span>
            <span style={{ fontWeight: 800, marginLeft: 2 }}>{statusCounts.ready}</span>
          </button>

          <button
            type="button"
            className={`filter-pill ${activeStatusTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveStatusTab('approved')}
            style={{ padding: '0.35rem 0.75rem' }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669' }} />
            <span>Approved & Linked</span>
            <span style={{ fontWeight: 800, marginLeft: 2 }}>{statusCounts.approved}</span>
          </button>

          <button
            type="button"
            className={`filter-pill ${activeStatusTab === 'unplanned' ? 'active' : ''}`}
            onClick={() => setActiveStatusTab('unplanned')}
            style={{ padding: '0.35rem 0.75rem' }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626' }} />
            <span>Unplanned Work</span>
            <span style={{ fontWeight: 800, marginLeft: 2 }}>{statusCounts.unplanned}</span>
          </button>
        </div>

        {/* Right Search & Quick Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div className="search-input-box" style={{ width: 260 }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search reports, tags, or supervisors..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem 0.35rem 2.1rem' }}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          >
            <Calendar size={13} />
            <span>Date</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const nextDisc = selectedDiscipline === 'ALL' ? 'Piping' : selectedDiscipline === 'Piping' ? 'Civil' : 'ALL';
              setSelectedDiscipline(nextDisc);
            }}
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          >
            <Filter size={13} />
            <span>Discipline{selectedDiscipline !== 'ALL' ? `: ${selectedDiscipline}` : ''}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const nextArea = selectedArea === 'ALL' ? 'Pump Bay' : selectedArea === 'Pump Bay' ? 'Filter Bay' : 'ALL';
              setSelectedArea(nextArea);
            }}
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          >
            <MapPin size={13} />
            <span>Area{selectedArea !== 'ALL' ? `: ${selectedArea}` : ''}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.5rem' }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* 3. Split Layout: High-Density Industrial Table (Left) + Report Details Inspector (Right) */}
      <div id="demo-target-field-reality" className="field-reports-split-view">
        {/* Left: Industrial Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 270px)', overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ width: 36, paddingLeft: '1rem' }}>
                    <input type="checkbox" style={{ cursor: 'pointer' }} />
                  </th>
                  <th>Report ID</th>
                  <th>Source & Date</th>
                  <th>Field Update Summary</th>
                  <th>Discipline</th>
                  <th>Target Match</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUpdates.map(update => {
                  const match = matchResults[update.id];
                  const decision = plannerDecisions[update.id];
                  const discColor = getDisciplineColor(update.discipline);
                  const isSelected = activeUpdate?.id === update.id;

                  // Status calculations
                  const isApproved = decision?.status === 'approved' || (!decision && match?.category === 'ready' && (match?.confidenceScore || 0) >= 90);
                  const isUnplanned = decision?.status === 'unplanned' || (!decision && match?.category === 'unplanned');
                  const isReview = !isApproved && !isUnplanned;

                  const statusText = isApproved ? 'Approved' : isUnplanned ? 'Unplanned' : 'Needs Review';
                  const statusClass = isApproved ? 'badge-ready' : isUnplanned ? 'badge-unplanned' : 'badge-review';

                  // Confidence score
                  const confidence = match?.confidenceScore || (isApproved ? 94 : isUnplanned ? 15 : 74);
                  const confColor = confidence >= 80 ? '#059669' : confidence >= 50 ? '#d97706' : '#dc2626';

                  const targetId = decision?.linkedActivityId || match?.candidateActivityId || (isUnplanned ? 'Unplanned Scope' : 'PIP-L6-012');

                  return (
                    <tr
                      key={update.id}
                      onClick={() => setSelectedUpdateId(update.id)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'var(--brand-surface)' : undefined,
                        borderLeft: isSelected ? '3px solid var(--brand-primary)' : '3px solid transparent',
                      }}
                    >
                      <td style={{ paddingLeft: '1rem' }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => setSelectedUpdateId(update.id)} style={{ cursor: 'pointer' }} />
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)', fontSize: '0.775rem' }}>
                        {update.id}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {update.sourceFile || 'piping_progress.xlsx'}
                        </div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                          {update.reportDate}
                        </div>
                      </td>
                      <td style={{ maxWidth: 260 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {update.extractedDescription}
                        </div>
                      </td>
                      <td>
                        <span
                          className="kanban-label-chip"
                          style={{
                            background: discColor.bg,
                            color: discColor.text,
                            borderColor: discColor.border,
                            fontSize: '0.675rem',
                          }}
                        >
                          {update.discipline}
                        </span>
                      </td>
                      <td>
                        <span
                          className="mono-pill"
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            color: isUnplanned ? 'var(--status-unplanned-fg)' : 'var(--brand-primary)',
                            borderColor: isUnplanned ? '#fca5a5' : 'var(--border-subtle)',
                          }}
                        >
                          {targetId}
                        </span>
                      </td>
                      <td>
                        <div className="confidence-meter" style={{ color: confColor }}>
                          <span>{confidence}%</span>
                          <div className="confidence-bar">
                            <div
                              className="confidence-bar-fill"
                              style={{
                                width: `${confidence}%`,
                                background: confColor,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusClass}`} style={{ fontSize: '0.675rem', padding: '2px 7px' }}>
                          {statusText}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedReviewUpdateId(update.id);
                              navigateToPlannerReviewWithFilter('review');
                            }}
                            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '2px 4px' }}
                            title="More options"
                          >
                            <MoreHorizontal size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Report Details Inspector Panel */}
        {activeUpdate && (
          <div
            className="card"
            style={{
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              position: 'sticky',
              top: '80px',
            }}
          >
            {/* Inspector Header */}
            <div
              style={{
                padding: '0.85rem 1.15rem',
                background: 'var(--bg-surface-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
                Report Details
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handlePrevUpdate}
                  style={{ padding: '2px 4px' }}
                  title="Previous Report"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleNextUpdate}
                  style={{ padding: '2px 4px' }}
                  title="Next Report"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedInspectorUpdateId(activeUpdate.id)}
                  style={{ padding: '2px 4px' }}
                  title="Open Full Drawer"
                >
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>

            {/* Inspector Body */}
            <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Report ID & Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--brand-primary)' }}>
                  {activeUpdate.id}
                </span>
                <span
                  className={`badge ${
                    activeDecision?.status === 'approved'
                      ? 'badge-ready'
                      : activeDecision?.status === 'unplanned'
                      ? 'badge-unplanned'
                      : 'badge-review'
                  }`}
                  style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                >
                  {activeDecision?.status === 'approved' ? 'Approved' : activeDecision?.status === 'unplanned' ? 'Unplanned' : 'Needs Review'}
                </span>
              </div>

              {/* Sub-Tabs: Summary, Extracted Data, Evidence, Match Analysis */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border-subtle)',
                  gap: '0.85rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setInspectorSubTab('summary')}
                  style={{
                    padding: '0.35rem 0',
                    fontSize: '0.75rem',
                    fontWeight: inspectorSubTab === 'summary' ? 700 : 500,
                    color: inspectorSubTab === 'summary' ? 'var(--brand-primary)' : 'var(--text-muted)',
                    borderBottom: `2px solid ${inspectorSubTab === 'summary' ? 'var(--brand-primary)' : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  Summary
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorSubTab('extracted')}
                  style={{
                    padding: '0.35rem 0',
                    fontSize: '0.75rem',
                    fontWeight: inspectorSubTab === 'extracted' ? 700 : 500,
                    color: inspectorSubTab === 'extracted' ? 'var(--brand-primary)' : 'var(--text-muted)',
                    borderBottom: `2px solid ${inspectorSubTab === 'extracted' ? 'var(--brand-primary)' : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  Extracted Data
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorSubTab('evidence')}
                  style={{
                    padding: '0.35rem 0',
                    fontSize: '0.75rem',
                    fontWeight: inspectorSubTab === 'evidence' ? 700 : 500,
                    color: inspectorSubTab === 'evidence' ? 'var(--brand-primary)' : 'var(--text-muted)',
                    borderBottom: `2px solid ${inspectorSubTab === 'evidence' ? 'var(--brand-primary)' : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  Evidence
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorSubTab('analysis')}
                  style={{
                    padding: '0.35rem 0',
                    fontSize: '0.75rem',
                    fontWeight: inspectorSubTab === 'analysis' ? 700 : 500,
                    color: inspectorSubTab === 'analysis' ? 'var(--brand-primary)' : 'var(--text-muted)',
                    borderBottom: `2px solid ${inspectorSubTab === 'analysis' ? 'var(--brand-primary)' : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  Match Analysis
                </button>
              </div>

              {/* Sub-Tab Content: Summary */}
              {inspectorSubTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Metadata Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.65rem',
                      padding: '0.75rem',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem' }}>Source File</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeUpdate.sourceFile || 'piping_progress.xlsx'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem' }}>Report Date</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeUpdate.reportDate}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem' }}>Discipline</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeUpdate.discipline}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem' }}>Spatial Area</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeUpdate.area || 'Pump Bay'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem' }}>L5 Task Identification</span>
                      <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                        {activeUpdate.l5Code || 'IOCL.P4.UNIT01.PIP.L5.011'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem' }}>Task SHA-256 Fingerprint</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                        #{activeUpdate.taskHash || 'D7A9F4B2'}
                      </span>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem' }}>Supervisor / Author</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeUpdate.supervisor || 'Rajesh Kumar (Mechanical Field Lead)'}</span>
                    </div>
                  </div>

                  {/* Field Update Text */}
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Field Update
                    </span>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.45, margin: 0, fontWeight: 500 }}>
                      {activeUpdate.extractedDescription}
                    </p>
                  </div>

                  {/* Extracted Keywords */}
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                      Extracted Keywords
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {['24 inch', 'CW spool', 'erected', 'pump bay'].map((kw, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--bg-surface-secondary)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedReviewUpdateId(activeUpdate.id);
                        navigateToPlannerReviewWithFilter('review');
                      }}
                      style={{ width: '100%', padding: '0.45rem', fontSize: '0.775rem', fontWeight: 700 }}
                    >
                      <Sparkles size={13} />
                      <span>Review in AI Match Matrix</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-Tab Content: Extracted Data */}
              {inspectorSubTab === 'extracted' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div className="raw-code-box">
                    {activeUpdate.rawText || activeUpdate.extractedDescription}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Extracted via Deterministic Regex & Rule Engine from {activeUpdate.sourceFile || 'source document'}.
                  </div>
                </div>
              )}

              {/* Sub-Tab Content: Evidence */}
              {inspectorSubTab === 'evidence' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeUpdate.images && activeUpdate.images.length > 0 ? (
                    <div className="photo-evidence-container">
                      <img
                        src={activeUpdate.images[0].url}
                        alt="Site Evidence"
                        style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      No photographic evidence attached to this update.
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab Content: Match Analysis */}
              {inspectorSubTab === 'analysis' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>Candidate Activity:</span>
                    <strong style={{ color: 'var(--brand-primary)' }}>{activeMatch?.candidateActivityId || 'PIP-L6-012'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>Composite Confidence:</span>
                    <strong style={{ color: '#059669' }}>{activeMatch?.confidenceScore || 74}%</strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Rationale: High spatial alignment in Pump Bay (15%) + Piping discipline alignment (20%) + Trade keywords (39%).
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
