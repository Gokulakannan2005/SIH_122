import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { useLiveISTClock, resolveRelativeISTDate } from '../utils/istTimeService';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Layers,
  Calendar,
  ExternalLink,
  ChevronRight,
  FileText,
  Search,
  HardHat,
  Sparkles,
  Camera,
  Activity,
  Check,
  Compass,
  CheckSquare,
  UploadCloud,
  Sliders,
  Send,
  RotateCcw,
  Zap,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    enrichedSchedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    setActiveTab,
    startGuidedDemo,
    setSelectedScheduleActivityId,
    handleAddNewFieldEntry,
    addToast,
    updateTaskProgress,
    currentProject,
    currentRole,
  } = useProject();

  const istClock = useLiveISTClock();

  // Instant Text Ingestion Studio State
  const [quickUpdateText, setQuickUpdateText] = useState<string>('');
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestedResult, setIngestedResult] = useState<{
    id: string;
    text: string;
    discipline: string;
    area: string;
    equipmentTag?: string;
    candidateActivityId?: string;
    candidateActivityName?: string;
    confidence: number;
    resolvedDate: string;
    relativeDatePhrase: string;
    progressVal: number;
  } | null>(null);

  // Today's Tasks Filters
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>('ALL');

  // Key Baseline & Schedule Metrics
  const scheduleMetrics = useMemo(() => {
    const total = enrichedSchedule.length;
    const completed = enrichedSchedule.filter(
      s => s.status === 'Completed' || (typeof s.progressPercent === 'number' && s.progressPercent >= 100)
    ).length;
    const delayed = enrichedSchedule.filter(
      s => (s.varianceDays || 0) > 0 || s.status === 'Delayed'
    ).length;
    const inProgress = enrichedSchedule.filter(
      s => (s.progressPercent || 0) > 0 && (s.progressPercent || 0) < 100
    ).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const overallProgress = total > 0
      ? Math.round(enrichedSchedule.reduce((acc, act) => acc + (act.progressPercent || 0), 0) / total)
      : 0;

    return { total, completed, delayed, inProgress, completionPct, overallProgress };
  }, [enrichedSchedule]);

  // Live NLP Preview for Text Ingestion
  const nlpPreview = useMemo(() => {
    if (!quickUpdateText.trim()) return null;
    const text = quickUpdateText;

    // 1. Discipline
    let discipline = 'Piping';
    if (/excavat|curing|concrete|pour|foundat|grout|rebar|civil|slab|footing/i.test(text)) {
      discipline = 'Civil';
    } else if (/cable|transformer|switchgear|conduit|substation|electr|breaker|motor/i.test(text)) {
      discipline = 'Electrical';
    } else if (/sensor|transmitter|plc|scada|dcs|instrument|loop|calibration/i.test(text)) {
      discipline = 'Instrumentation';
    } else if (/safety|scaffold|harness|hazard|permit|hse|spill/i.test(text)) {
      discipline = 'HSE';
    }

    // 2. Equipment Tag
    const tagMatch = text.match(/\b([0-9]{2}-[A-Z]{2,4}-[0-9]{3,4}[A-Z]?|[A-Z]{2,4}-[0-9]{3,4}|[A-Z]-[0-9]{3,4}[A-Z]?)\b/i);
    const tag = tagMatch ? tagMatch[1].toUpperCase() : undefined;

    // 3. Date resolution using IST
    const dateResolution = resolveRelativeISTDate(text);

    // 4. Find candidate activity
    let matched = enrichedSchedule.find(act => {
      if (tag && (act.activityId.toUpperCase().includes(tag) || act.activityName.toUpperCase().includes(tag))) {
        return true;
      }
      return false;
    });

    if (!matched) {
      matched = enrichedSchedule.find(act => act.discipline === discipline);
    }
    if (!matched && enrichedSchedule.length > 0) {
      matched = enrichedSchedule[0];
    }

    // 5. Progress percent
    let progressVal = 65;
    const pctMatch = text.match(/([0-9]{1,3})%/);
    if (pctMatch) {
      progressVal = Math.min(100, parseInt(pctMatch[1], 10));
    } else if (/complete|finished|erected|done|installed/i.test(text)) {
      progressVal = 100;
    }

    return {
      discipline,
      tag: tag || 'Auto-Detected',
      candidate: matched,
      dateResolution,
      progressVal,
    };
  }, [quickUpdateText, enrichedSchedule]);

  // Handle Instant Text Ingestion
  const handleInstantIngest = async (textOverride?: string) => {
    const textToIngest = (textOverride || quickUpdateText).trim();
    if (!textToIngest) {
      addToast({
        type: 'warning',
        title: 'Input Required',
        message: 'Please enter a site execution update to analyze and ingest.',
      });
      return;
    }

    setIsIngesting(true);

    try {
      const preview = nlpPreview || {
        discipline: 'Piping',
        tag: 'Auto-Detected',
        candidate: enrichedSchedule[0],
        dateResolution: resolveRelativeISTDate(textToIngest),
        progressVal: 75,
      };

      const dateRes = resolveRelativeISTDate(textToIngest);
      const isComplete = preview.progressVal === 100 || /complete|finished|erected|done/i.test(textToIngest);

      // Ingest into ProjectContext
      await handleAddNewFieldEntry({
        discipline: preview.discipline,
        description: textToIngest,
        rawText: textToIngest,
        area: preview.candidate?.area || 'Refinery Workfront Unit-01',
        eventStatus: isComplete ? 'Completed' : 'In Progress',
        quantity: `${preview.progressVal}%`,
        supervisor: currentRole === 'supervisor' ? 'Site Supervisor' : 'Lead Planner',
        targetActivityId: preview.candidate?.activityId,
        confirmedTag: preview.tag !== 'Auto-Detected' ? preview.tag : undefined,
      });

      // Update task progress immediately
      if (preview.candidate) {
        updateTaskProgress(
          preview.candidate.activityId,
          preview.progressVal,
          isComplete ? 'Completed' : 'In Progress',
          `Instant Ingestion: "${textToIngest.slice(0, 45)}..."`
        );
      }

      setIngestedResult({
        id: `FIELD-${Date.now().toString().slice(-4)}`,
        text: textToIngest,
        discipline: preview.discipline,
        area: preview.candidate?.area || 'Unit-01',
        equipmentTag: preview.tag,
        candidateActivityId: preview.candidate?.activityId,
        candidateActivityName: preview.candidate?.activityName,
        confidence: preview.tag !== 'Auto-Detected' ? 95 : 82,
        resolvedDate: dateRes.resolvedDate,
        relativeDatePhrase: dateRes.matchedPhrase || 'today',
        progressVal: preview.progressVal,
      });

      setQuickUpdateText('');
      addToast({
        type: 'success',
        title: 'Instant Update Ingested & Schedule Synced',
        message: `Linked to ${preview.candidate?.activityId || 'Task'} (${preview.progressVal}%). Schedule updated.`,
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Ingestion Error',
        message: 'Could not process the text entry. Please try again.',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  // Filtered Today's Tasks
  const filteredTasks = useMemo(() => {
    return enrichedSchedule.filter(task => {
      if (selectedDisciplineFilter !== 'ALL' && task.discipline !== selectedDisciplineFilter) {
        return false;
      }
      if (taskSearchQuery.trim()) {
        const q = taskSearchQuery.toLowerCase();
        const matches =
          task.activityId.toLowerCase().includes(q) ||
          task.activityName.toLowerCase().includes(q) ||
          task.discipline.toLowerCase().includes(q) ||
          task.area.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [enrichedSchedule, selectedDisciplineFilter, taskSearchQuery]);

  // Discipline list for filter pills
  const disciplines = useMemo(() => {
    const set = new Set<string>();
    enrichedSchedule.forEach(t => t.discipline && set.add(t.discipline));
    return Array.from(set).sort();
  }, [enrichedSchedule]);

  // Handle Task Completion Toggle
  const handleToggleTask = (task: typeof enrichedSchedule[0]) => {
    const isComplete = task.status === 'Completed' || (task.progressPercent || 0) >= 100;
    const newProgress = isComplete ? 0 : 100;
    const newStatus = isComplete ? ('In Progress' as const) : ('Completed' as const);

    updateTaskProgress(
      task.activityId,
      newProgress,
      newStatus,
      `Toggled from Dashboard Task Checklist (${newStatus})`
    );

    addToast({
      type: 'success',
      title: isComplete ? `Task Re-opened: ${task.activityId}` : `Task Completed: ${task.activityId}`,
      message: `"${task.activityName}" progress updated to ${newProgress}%.`,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* 1. Executive Clean Header Strip */}
      <div
        className="card"
        style={{
          padding: '1.15rem 1.4rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-surface)',
          borderBottom: '2px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span className="brand-badge" style={{ fontSize: '0.675rem' }}>
              EXECUTIVE OPERATIONS DASHBOARD
            </span>
            <span className="mono-pill" style={{ fontSize: '0.7rem' }}>
              {currentProject?.name || 'Active Project'} • {currentProject?.code || 'P1'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Enterprise Planning & Field Telemetry
          </h2>
        </div>

        {/* Live IST Clock & Shift Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-surface-secondary)',
            padding: '0.5rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
          }}
        >
          <Clock size={16} style={{ color: 'var(--brand-primary)' }} />
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Indian Standard Time (IST)
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {istClock.formattedIST} • <span style={{ color: '#059669' }}>{istClock.shiftName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN FEATURE: Instant Text Ingestion Studio */}
      <div
        className="card"
        style={{
          padding: '1.35rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(16, 185, 129, 0.03))',
          border: '1.5px solid var(--brand-primary)',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Zap size={16} style={{ color: 'var(--brand-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Instant Text Quick Ingestion Studio
              </h3>
              <span className="badge badge-ready" style={{ fontSize: '0.65rem' }}>
                Main Ingestion Engine
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Type natural site progress in plain English. DATUM resolves relative dates ("today", "yesterday"), detects equipment tags, and updates Primavera schedule actuals instantly without page reloads.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleInstantIngest('Erected pipe spool 24-CW-017 today in pump bay. Hydrotest ready.')}
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
            >
              + Piping Sample
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleInstantIngest('Excavated crude storage tank ring wall foundation yesterday.')}
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
            >
              + Civil Sample
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleInstantIngest('Terminated 415V switchgear feeder cables in substation-03 today.')}
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
            >
              + Electrical Sample
            </button>
          </div>
        </div>

        {/* Ingestion Input Row */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Completed 85% welding on line 24-CW-017 yesterday with 14 pipe fitters in Unit-01..."
              value={quickUpdateText}
              onChange={e => setQuickUpdateText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleInstantIngest();
                }
              }}
              style={{
                width: '100%',
                resize: 'none',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                padding: '0.65rem 0.85rem',
                borderColor: nlpPreview ? 'var(--brand-primary)' : undefined,
              }}
            />

            {/* Live Parsing Preview Pill */}
            {nlpPreview && (
              <div
                style={{
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.725rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-surface)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 4,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span>Discipline: <strong style={{ color: 'var(--brand-primary)' }}>{nlpPreview.discipline}</strong></span>
                <span>Tag: <strong style={{ color: 'var(--brand-primary)' }}>{nlpPreview.tag}</strong></span>
                <span>Target: <strong>{nlpPreview.candidate?.activityId || 'Auto'}</strong></span>
                <span>Date: <strong style={{ color: '#059669' }}>{nlpPreview.dateResolution.resolvedDate} ({nlpPreview.dateResolution.matchedPhrase})</strong></span>
                <span>Progress: <strong style={{ color: '#059669' }}>{nlpPreview.progressVal}%</strong></span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleInstantIngest()}
            disabled={isIngesting || !quickUpdateText.trim()}
            style={{
              padding: '0.75rem 1.4rem',
              fontWeight: 800,
              fontSize: '0.85rem',
              height: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            {isIngesting ? (
              <span>Ingesting...</span>
            ) : (
              <>
                <Send size={15} />
                <span>Ingest & Sync</span>
              </>
            )}
          </button>
        </div>

        {/* Instant Ingestion Success Result Banner (stays right in place!) */}
        {ingestedResult && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 280, flex: 1 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={18} strokeWidth={3} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span className="mono-pill" style={{ color: 'var(--brand-primary)', fontWeight: 800, fontSize: '0.675rem' }}>
                    {ingestedResult.id}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>
                    Aligned to {ingestedResult.candidateActivityId} ({ingestedResult.progressVal}%)
                  </span>
                  <span className="badge badge-ready" style={{ fontSize: '0.625rem' }}>
                    {ingestedResult.confidence}% Confidence
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                  "{ingestedResult.text}"
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Resolved IST Date: <strong>{ingestedResult.resolvedDate}</strong> • Discipline: {ingestedResult.discipline} • Area: {ingestedResult.area}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('site-updates')}
                style={{ fontSize: '0.7rem' }}
              >
                <span>View in Site Reports</span>
                <ChevronRight size={12} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIngestedResult(null)}
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Schedule Baseline & Completed Tasks Overview (KPI Strip) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem' }}>
        <div className="card" style={{ padding: '0.9rem 1.15rem', borderLeft: '4px solid var(--brand-primary)' }}>
          <div style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Schedule Tasks
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {scheduleMetrics.total}
          </div>
          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
            Primavera Master WBS
          </div>
        </div>

        <div className="card" style={{ padding: '0.9rem 1.15rem', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Tasks Completed
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {scheduleMetrics.completed} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>({scheduleMetrics.completionPct}%)</span>
          </div>
          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
            Verified milestones
          </div>
        </div>

        <div className="card" style={{ padding: '0.9rem 1.15rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            In-Progress Tasks
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {scheduleMetrics.inProgress}
          </div>
          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
            Active physical workfronts
          </div>
        </div>

        <div className="card" style={{ padding: '0.9rem 1.15rem', borderLeft: '4px solid #e11d48' }}>
          <div style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Delayed Activities
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e11d48', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {scheduleMetrics.delayed}
          </div>
          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
            Critical path variances
          </div>
        </div>

        <div className="card" style={{ padding: '0.9rem 1.15rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Overall Baseline Progress
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {scheduleMetrics.overallProgress}%
          </div>
          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
            Earned value weighted
          </div>
        </div>
      </div>

      {/* 4. Redirection Hub to Important Tools (6 Clean & Beautiful Cards) */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>
          Engineering Suite & Navigation Hub
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
          {/* Card 1: 4D Gantt */}
          <div
            className="card card-interactive"
            onClick={() => setActiveTab('schedule-activities')}
            style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 34, height: 34, borderRadius: 6, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={17} />
              </div>
              <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>4D Gantt & Digital Twin</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>Physical plant execution, workfront velocity & EVM S-Curve</div>
            </div>
          </div>

          {/* Card 2: Field Timelines */}
          <div
            className="card card-interactive"
            onClick={() => setActiveTab('site-updates')}
            style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 34, height: 34, borderRadius: 6, background: 'rgba(16, 185, 129, 0.15)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={17} />
              </div>
              <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Field Timelines & Reports</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>Chronological updates, photo proof & explainable AI inspector</div>
            </div>
          </div>

          {/* Card 3: Delay Calculator */}
          <div
            className="card card-interactive"
            onClick={() => setActiveTab('copilot')}
            style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 34, height: 34, borderRadius: 6, background: 'rgba(225, 29, 72, 0.15)', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sliders size={17} />
              </div>
              <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Delay & Impact Calculator</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>Simulate weather delays, rig downtime & float consumption</div>
            </div>
          </div>

          {/* Card 4: Review Queue */}
          <div
            className="card card-interactive"
            onClick={() => setActiveTab('planner-review')}
            style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 34, height: 34, borderRadius: 6, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckSquare size={17} />
              </div>
              <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Matching & Approvals Queue</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>Human-in-the-loop verification desk for ambiguous updates</div>
            </div>
          </div>

          {/* Card 5: Guide Tour */}
          <div
            className="card card-interactive"
            onClick={startGuidedDemo}
            style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 34, height: 34, borderRadius: 6, background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Compass size={17} />
              </div>
              <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Interactive Guide Tour</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>11-stage deep-dive explaining fuzzy matching & spatial AI</div>
            </div>
          </div>

          {/* Card 6: Back to Role Home */}
          <div
            className="card card-interactive"
            onClick={() => setActiveTab('home')}
            style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 34, height: 34, borderRadius: 6, background: 'rgba(14, 165, 233, 0.15)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HardHat size={17} />
              </div>
              <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Role Home Portal</div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>Access your tailored {currentRole === 'supervisor' ? 'Supervisor' : 'Lead Planner'} workstation</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Today's Assigned Tasks & Progress Checklist (With Functional Custom Tick-Boxes) */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckSquare size={17} style={{ color: 'var(--brand-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Master Schedule Tasks & Today's Progress Checklist
              </h3>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click the check box on any task to instantly mark it completed or adjust progress. Synced to Primavera WBS baseline.
            </p>
          </div>

          {/* Filters & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={taskSearchQuery}
                onChange={e => setTaskSearchQuery(e.target.value)}
                style={{
                  padding: '0.3rem 0.6rem 0.3rem 1.6rem',
                  fontSize: '0.75rem',
                  borderRadius: 4,
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="filter-pill-group">
              <button
                type="button"
                className={`filter-pill ${selectedDisciplineFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedDisciplineFilter('ALL')}
                style={{ fontSize: '0.675rem', padding: '0.25rem 0.55rem' }}
              >
                All
              </button>
              {disciplines.map(disc => (
                <button
                  key={disc}
                  type="button"
                  className={`filter-pill ${selectedDisciplineFilter === disc ? 'active' : ''}`}
                  onClick={() => setSelectedDisciplineFilter(disc)}
                  style={{ fontSize: '0.675rem', padding: '0.25rem 0.55rem' }}
                >
                  {disc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task List Table with Custom-Styled Responsive Tick Boxes */}
        <div className="table-container" style={{ maxHeight: 380, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: 'center' }}>Done</th>
                <th>Activity ID & Name</th>
                <th>WBS / Discipline</th>
                <th>Location Area</th>
                <th>Planned Finish</th>
                <th style={{ width: 140 }}>Progress</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No tasks match your search filter.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const isComplete = task.status === 'Completed' || (task.progressPercent || 0) >= 100;
                  const progressVal = task.progressPercent || 0;
                  const isDelayed = (task.varianceDays || 0) > 0 || task.status === 'Delayed';

                  return (
                    <tr
                      key={task.activityId}
                      style={{
                        background: isComplete ? 'rgba(16, 185, 129, 0.03)' : undefined,
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Functional, Gorgeous Custom Tick Box */}
                      <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task)}
                          title={isComplete ? `Reset ${task.activityId}` : `Mark ${task.activityId} 100% complete`}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              border: `2px solid ${isComplete ? '#059669' : 'var(--border-default)'}`,
                              background: isComplete ? '#059669' : 'var(--bg-surface)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isComplete ? '0 2px 6px rgba(5, 150, 105, 0.35)' : 'none',
                              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            {isComplete && <Check size={14} strokeWidth={3} />}
                          </div>
                        </button>
                      </td>

                      {/* Task ID & Name */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)' }}>
                            {task.activityId}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {task.activityName}
                          </span>
                        </div>
                      </td>

                      {/* WBS / Discipline */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                            {task.discipline}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            WBS {task.wbs}
                          </span>
                        </div>
                      </td>

                      {/* Area */}
                      <td>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                          {task.area || 'Field'}
                        </span>
                      </td>

                      {/* Planned Finish */}
                      <td>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          {task.plannedFinish}
                        </span>
                      </td>

                      {/* Progress Bar & Number */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${progressVal}%`,
                                height: '100%',
                                background: isComplete ? '#059669' : isDelayed ? '#e11d48' : 'var(--brand-primary)',
                                borderRadius: 3,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: 32 }}>
                            {progressVal}%
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span
                          className={`badge ${
                            isComplete ? 'badge-ready' : isDelayed ? 'badge-unplanned' : 'badge-review'
                          }`}
                          style={{ fontSize: '0.65rem', padding: '2px 7px' }}
                        >
                          {isComplete ? 'Completed' : isDelayed ? 'Delayed' : 'In Progress'}
                        </span>
                      </td>

                      {/* Quick Action */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedScheduleActivityId(task.activityId);
                            setActiveTab('schedule-activities');
                          }}
                          style={{ fontSize: '0.675rem', padding: '0.25rem 0.55rem' }}
                        >
                          <ExternalLink size={11} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
