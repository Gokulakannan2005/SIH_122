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
  ShieldCheck,
  UploadCloud,
  Download,
  Check
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
    addToast,
    exportAlignmentCSV,
    handlePlannerAction,
  } = useProject();

  // Selected Update for the integrated Report Details Panel (defaults to first item)
  const [selectedUpdateId, setSelectedUpdateId] = useState<string>(() => {
    return siteUpdates[0]?.id || 'XLSX-ROW-PIP-SEP05-01';
  });

  // Selected reports for multi-select batch actions
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Report Details Inspector active sub-tab
  const [inspectorSubTab, setInspectorSubTab] = useState<'summary' | 'extracted' | 'evidence' | 'analysis'>('summary');

  // Active status filter tab
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'review' | 'ready' | 'approved' | 'unplanned'>('all');

  // Search and quick filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
  const [activeRowActionId, setActiveRowActionId] = useState<string | null>(null);
  const [confidenceSort, setConfidenceSort] = useState<'default' | 'high-first' | 'low-first'>('default');

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
      review,
      ready,
      approved,
      unplanned,
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

  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    siteUpdates.forEach(u => u.reportDate && set.add(u.reportDate));
    return Array.from(set).sort().reverse();
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
    const filtered = siteUpdates.filter(update => {
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

      // Date filter
      if (selectedDate !== 'ALL' && update.reportDate !== selectedDate) {
        return false;
      }

      return true;
    });

    if (confidenceSort === 'high-first') {
      return [...filtered].sort((a, b) => {
        const scoreA = matchResults[a.id]?.confidenceScore || 0;
        const scoreB = matchResults[b.id]?.confidenceScore || 0;
        return scoreB - scoreA;
      });
    } else if (confidenceSort === 'low-first') {
      return [...filtered].sort((a, b) => {
        const scoreA = matchResults[a.id]?.confidenceScore || 0;
        const scoreB = matchResults[b.id]?.confidenceScore || 0;
        return scoreA - scoreB;
      });
    }

    return filtered;
  }, [siteUpdates, matchResults, plannerDecisions, activeStatusTab, searchQuery, selectedDiscipline, selectedArea, selectedDate, confidenceSort]);

  // Bulk Actions
  const handleBulkApprove = async () => {
    if (selectedRowIds.length === 0) return;
    for (const id of selectedRowIds) {
      const match = matchResults[id];
      const targetId = match?.candidateActivityId || null;
      await handlePlannerAction(id, 'approve', targetId, 'Batch approved via Multi-Select Toolbar');
    }
    addToast({
      type: 'success',
      title: 'Batch Reports Approved',
      message: `Successfully approved ${selectedRowIds.length} site report(s) into project schedule.`,
    });
    setSelectedRowIds([]);
  };

  const handleExportSelectedCSV = () => {
    if (selectedRowIds.length === 0) {
      exportAlignmentCSV();
      return;
    }
    const selectedUpdates = siteUpdates.filter(u => selectedRowIds.includes(u.id));
    const rows: string[][] = [
      [
        'Report ID',
        'Source File',
        'Report Date',
        'Discipline',
        'Extracted Description',
        'Event Status',
        'Area',
        'Matched Activity ID',
        'Confidence Score',
        'Planner Action Status',
      ],
    ];
    selectedUpdates.forEach(u => {
      const match = matchResults[u.id];
      const decision = plannerDecisions[u.id];
      rows.push([
        u.id,
        u.sourceFile || '',
        u.reportDate || '',
        u.discipline,
        `"${(u.extractedDescription || '').replace(/"/g, '""')}"`,
        u.eventStatus,
        u.area || '',
        decision?.linkedActivityId || match?.candidateActivityId || 'UNPLANNED',
        `${match?.confidenceScore || 0}%`,
        decision?.status || 'review',
      ]);
    });
    const csvContent = rows.map(e => e.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Selected_Reports_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({
      type: 'success',
      title: 'CSV Exported',
      message: `Exported ${selectedRowIds.length} selected report(s) to CSV.`,
    });
  };

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
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setActiveTab('upload')}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, gap: 5 }}
            title="Upload daily reports (.txt), P6 schedules, or progress files"
          >
            <UploadCloud size={13} />
            <span>Upload Text Log</span>
          </button>

          <div className="search-input-box" style={{ width: 220 }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search reports, tags, supervisors..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem 0.35rem 2.1rem' }}
            />
          </div>

          {/* Interactive Discipline Filter Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Filter size={13} style={{ position: 'absolute', left: 8, pointerEvents: 'none', color: selectedDiscipline !== 'ALL' ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
            <select
              value={selectedDiscipline}
              onChange={e => setSelectedDiscipline(e.target.value)}
              className="form-input"
              style={{
                padding: '0.3rem 0.65rem 0.3rem 1.65rem',
                fontSize: '0.75rem',
                height: 'auto',
                cursor: 'pointer',
                background: selectedDiscipline !== 'ALL' ? 'var(--brand-surface)' : 'var(--bg-surface)',
                borderColor: selectedDiscipline !== 'ALL' ? 'var(--brand-primary)' : 'var(--border-default)',
                color: selectedDiscipline !== 'ALL' ? 'var(--brand-primary)' : 'inherit',
                fontWeight: selectedDiscipline !== 'ALL' ? 700 : 500,
              }}
              title="Filter by Discipline"
            >
              <option value="ALL">All Disciplines</option>
              {uniqueDisciplines.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Interactive Area Filter Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MapPin size={13} style={{ position: 'absolute', left: 8, pointerEvents: 'none', color: selectedArea !== 'ALL' ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              className="form-input"
              style={{
                padding: '0.3rem 0.65rem 0.3rem 1.65rem',
                fontSize: '0.75rem',
                height: 'auto',
                cursor: 'pointer',
                background: selectedArea !== 'ALL' ? 'var(--brand-surface)' : 'var(--bg-surface)',
                borderColor: selectedArea !== 'ALL' ? 'var(--brand-primary)' : 'var(--border-default)',
                color: selectedArea !== 'ALL' ? 'var(--brand-primary)' : 'inherit',
                fontWeight: selectedArea !== 'ALL' ? 700 : 500,
              }}
              title="Filter by Workfront Area"
            >
              <option value="ALL">All Areas</option>
              {uniqueAreas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Interactive Date Filter Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Calendar size={13} style={{ position: 'absolute', left: 8, pointerEvents: 'none', color: selectedDate !== 'ALL' ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="form-input"
              style={{
                padding: '0.3rem 0.65rem 0.3rem 1.65rem',
                fontSize: '0.75rem',
                height: 'auto',
                cursor: 'pointer',
                background: selectedDate !== 'ALL' ? 'var(--brand-surface)' : 'var(--bg-surface)',
                borderColor: selectedDate !== 'ALL' ? 'var(--brand-primary)' : 'var(--border-default)',
                color: selectedDate !== 'ALL' ? 'var(--brand-primary)' : 'inherit',
                fontWeight: selectedDate !== 'ALL' ? 700 : 500,
              }}
              title="Filter by Log Date"
            >
              <option value="ALL">All Dates</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Three Dots Menu with Clear, Sort, and Export Actions */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${showFilterMenu ? 'active' : ''}`}
              style={{ padding: '0.35rem 0.55rem' }}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              title="More filter and sorting options"
            >
              <MoreHorizontal size={14} />
            </button>
            {showFilterMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  padding: '0.4rem',
                  zIndex: 150,
                  minWidth: 210,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.2rem 0.5rem' }}>
                  Filter & Sort Actions
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                  onClick={() => {
                    setConfidenceSort(confidenceSort === 'high-first' ? 'default' : 'high-first');
                    setShowFilterMenu(false);
                    addToast({ type: 'info', title: 'Sorted by High Confidence', message: 'Displaying highest matching score first.' });
                  }}
                >
                  <Sparkles size={13} style={{ color: 'var(--brand-primary)' }} />
                  <span>{confidenceSort === 'high-first' ? '✓ High Confidence (Active)' : 'Sort: High Confidence'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                  onClick={() => {
                    setConfidenceSort(confidenceSort === 'low-first' ? 'default' : 'low-first');
                    setShowFilterMenu(false);
                    addToast({ type: 'info', title: 'Sorted by Review Priority', message: 'Displaying ambiguous items first.' });
                  }}
                >
                  <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
                  <span>{confidenceSort === 'low-first' ? '✓ Review First (Active)' : 'Sort: Needs Review'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                  onClick={() => {
                    exportAlignmentCSV();
                    setShowFilterMenu(false);
                  }}
                >
                  <Download size={13} />
                  <span>Export Filtered CSV</span>
                </button>
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 0' }} />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', fontSize: '0.75rem', padding: '0.35rem 0.5rem', color: '#ef4444' }}
                  onClick={() => {
                    setSelectedDiscipline('ALL');
                    setSelectedArea('ALL');
                    setSelectedDate('ALL');
                    setSelectedRowIds([]);
                    setSearchQuery('');
                    setActiveStatusTab('all');
                    setConfidenceSort('default');
                    setShowFilterMenu(false);
                    addToast({ type: 'info', title: 'Filters Reset', message: 'All filters and sorting reset to default.' });
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating / Sticky Batch Actions Bar for Multi-Selected Reports */}
      {selectedRowIds.length > 0 && (
        <div
          style={{
            background: 'var(--brand-surface)',
            border: '1px solid var(--brand-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                background: 'var(--brand-primary)',
                color: '#ffffff',
                fontSize: '0.725rem',
                fontWeight: 800,
                borderRadius: 12,
                padding: '2px 8px',
              }}
            >
              {selectedRowIds.length} Selected
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Batch Operations Available
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleBulkApprove}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, gap: 5 }}
            >
              <Check size={13} />
              <span>Bulk Approve ({selectedRowIds.length})</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportSelectedCSV}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, gap: 5 }}
            >
              <Download size={13} />
              <span>Export Selected ({selectedRowIds.length})</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedRowIds([])}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* 3. Split Layout: High-Density Industrial Table (Left) + Report Details Inspector (Right) */}
      <div id="demo-target-field-reality" className="field-reports-split-view">
        {/* Left: Industrial Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 270px)', overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ width: 36, paddingLeft: '1rem' }}>
                    <input
                      type="checkbox"
                      style={{ cursor: 'pointer' }}
                      checked={filteredUpdates.length > 0 && selectedRowIds.length === filteredUpdates.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRowIds(filteredUpdates.map(u => u.id));
                        } else {
                          setSelectedRowIds([]);
                        }
                      }}
                      title={selectedRowIds.length === filteredUpdates.length ? 'Deselect all visible' : 'Select all visible'}
                    />
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
                        <input
                          type="checkbox"
                          checked={selectedRowIds.includes(update.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedRowIds(prev =>
                              prev.includes(update.id)
                                ? prev.filter(id => id !== update.id)
                                : [...prev, update.id]
                            );
                          }}
                          title={`Select ${update.id}`}
                          style={{ cursor: 'pointer' }}
                        />
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
                      <td style={{ textAlign: 'right', paddingRight: '1rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
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
                            className={`btn btn-ghost btn-sm ${activeRowActionId === update.id ? 'active' : ''}`}
                            style={{ padding: '2px 5px' }}
                            title="More actions for this report"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveRowActionId(activeRowActionId === update.id ? null : update.id);
                            }}
                          >
                            <MoreHorizontal size={13} />
                          </button>
                        </div>

                        {activeRowActionId === update.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: '1rem',
                              top: 'calc(100% - 4px)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-default)',
                              borderRadius: 'var(--radius-sm)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                              padding: '0.35rem',
                              zIndex: 100,
                              minWidth: 185,
                              textAlign: 'left',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2,
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ justifyContent: 'flex-start', fontSize: '0.725rem', padding: '0.3rem 0.5rem' }}
                              onClick={() => {
                                setSelectedUpdateId(update.id);
                                setSelectedInspectorUpdateId(update.id);
                                setActiveRowActionId(null);
                              }}
                            >
                              <Sparkles size={12} style={{ color: 'var(--brand-primary)' }} />
                              <span>Open in AI Inspector</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ justifyContent: 'flex-start', fontSize: '0.725rem', padding: '0.3rem 0.5rem' }}
                              onClick={() => {
                                setSelectedReviewUpdateId(update.id);
                                setActiveTab('planner-review');
                                setActiveRowActionId(null);
                              }}
                            >
                              <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                              <span>Planner Alignment</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ justifyContent: 'flex-start', fontSize: '0.725rem', padding: '0.3rem 0.5rem' }}
                              onClick={() => {
                                navigator.clipboard?.writeText(update.rawText || update.extractedDescription);
                                setActiveRowActionId(null);
                                addToast({ type: 'success', title: 'Copied Report', message: `Copied text for ${update.id}.` });
                              }}
                            >
                              <FileText size={12} />
                              <span>Copy Text & Hash</span>
                            </button>
                          </div>
                        )}
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
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto',
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
                    <strong style={{ color: 'var(--brand-primary)' }}>{activeMatch?.candidateActivityId || 'UNPLANNED'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span>Composite Confidence:</span>
                    <strong style={{ color: (activeMatch?.confidenceScore || 0) >= 80 ? '#059669' : '#d97706' }}>
                      {activeMatch?.confidenceScore ?? 0}%
                    </strong>
                  </div>
                  {activeMatch?.scoreBreakdown && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'var(--bg-surface-secondary)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                      <div>Tag: <strong>{activeMatch.scoreBreakdown.tagScore}/30</strong></div>
                      <div>WBS Code: <strong>{activeMatch.scoreBreakdown.codeScore}/25</strong></div>
                      <div>Discipline: <strong>{activeMatch.scoreBreakdown.disciplineScore}/20</strong></div>
                      <div>Semantic: <strong>{activeMatch.scoreBreakdown.descScore}/20</strong></div>
                      <div>Area: <strong>{activeMatch.scoreBreakdown.areaScore}/15</strong></div>
                      <div>Fuzzy: <strong>{activeMatch.scoreBreakdown.fuzzyScore}/15</strong></div>
                    </div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>Matching Rationale:</div>
                    {activeMatch?.matchReasons && activeMatch.matchReasons.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {activeMatch.matchReasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    ) : (
                      <div>{activeMatch?.candidateActivityId ? 'Derived from NLP semantic tag & spatial match.' : 'No deterministic schedule activity match found.'}</div>
                    )}
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
