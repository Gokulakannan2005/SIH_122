import React, { useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { useLiveISTClock } from '../utils/istTimeService';
import {
  Layers,
  ArrowRight,
  HardHat,
  CheckSquare,
  FileText,
  Mic,
  Camera,
  FileCheck2,
  UploadCloud,
  Sliders,
  Compass,
  Sparkles,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Building2,
  Check,
  Flame,
  ExternalLink,
} from 'lucide-react';

export const HomeIntroductionView: React.FC = () => {
  const {
    currentRole,
    currentUser,
    currentProject,
    setActiveTab,
    startGuidedDemo,
    schedule,
    enrichedSchedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    handlePlannerAction,
    addToast,
    setSelectedScheduleActivityId,
  } = useProject();

  const istClock = useLiveISTClock();
  const isSupervisor = currentRole === 'supervisor';

  // Helper to accurately extract progress percentage
  const getActProgress = (a: any): number => {
    if (a.status === 'Completed' || a.progressPercent === 100) return 100;
    if (typeof a.progressPercent === 'number') return a.progressPercent;
    if (typeof a.actualProgress === 'number') return a.actualProgress;
    return 0;
  };

  // Metrics incorporating live reconciled actuals
  const metrics = useMemo(() => {
    const list = enrichedSchedule && enrichedSchedule.length > 0 ? enrichedSchedule : schedule;
    const total = list.length;
    const completed = list.filter(a => a.status === 'Completed' || getActProgress(a) >= 100).length;
    const delayed = list.filter(a => (a.varianceDays || 0) > 0 || a.status === 'Delayed').length;
    const inProgress = list.filter(a => a.status === 'In Progress' || (getActProgress(a) > 0 && getActProgress(a) < 100)).length;
    const overallProgress = total > 0
      ? Math.round(list.reduce((acc, a) => acc + getActProgress(a), 0) / total)
      : 0;

    let pendingReview = 0;
    siteUpdates.forEach(u => {
      const dec = plannerDecisions[u.id];
      const match = matchResults[u.id];
      const isApproved = dec?.status === 'approved' || (!dec && match?.category === 'ready' && (match?.confidenceScore || 0) >= 90);
      const isUnplanned = dec?.status === 'unplanned' || (!dec && match?.category === 'unplanned');
      if (!isApproved && !isUnplanned) pendingReview++;
    });

    return { total, completed, delayed, inProgress, overallProgress, pendingReview };
  }, [enrichedSchedule, schedule, siteUpdates, plannerDecisions, matchResults]);

  // Top pending items for planner quick triage
  const pendingUpdates = useMemo(() => {
    return siteUpdates
      .filter(u => {
        const dec = plannerDecisions[u.id];
        const match = matchResults[u.id];
        return !dec && match?.category !== 'ready';
      })
      .slice(0, 4);
  }, [siteUpdates, plannerDecisions, matchResults]);

  // Supervisor shift assigned tasks
  const shiftTasks = useMemo(() => {
    const list = enrichedSchedule && enrichedSchedule.length > 0 ? enrichedSchedule : schedule;
    return list.filter(a => getActProgress(a) < 100 && a.status !== 'Completed').slice(0, 5);
  }, [enrichedSchedule, schedule]);

  // Recent submissions
  const recentSubmissions = useMemo(() => {
    return siteUpdates.slice(0, 4);
  }, [siteUpdates]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* Executive Role Header */}
      <div
        className="card"
        style={{
          background: isSupervisor
            ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(14, 165, 233, 0.04))'
            : 'linear-gradient(135deg, rgba(4, 120, 87, 0.12), rgba(16, 185, 129, 0.04))',
          border: `1px solid ${isSupervisor ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: '0.675rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '2px 8px',
                borderRadius: 4,
                background: isSupervisor ? 'rgba(2, 132, 199, 0.2)' : 'rgba(4, 120, 87, 0.2)',
                color: isSupervisor ? '#0284c7' : '#047857',
              }}
            >
              {isSupervisor ? 'FIELD SUPERVISOR PORTAL • SHIFT COMMAND' : 'LEAD PLANNING ENGINEER • EXECUTIVE DESK'}
            </span>
            <span className="mono-pill" style={{ fontSize: '0.7rem' }}>
              {currentProject?.name || 'Active Project'}
            </span>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {isSupervisor
              ? `Welcome, ${currentUser?.username || 'Field Supervisor'}`
              : `Project Control Center: ${currentProject?.name || 'Enterprise Project'}`}
          </h2>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, marginTop: 4 }}>
            {isSupervisor
              ? 'Log daily site work, upload audio/photo evidence, and track assigned workfront tasks in real-time.'
              : 'Primavera baseline governance, automated field reconciliation, and downstream delay forecasting.'}
          </p>
        </div>

        {/* IST Telemetry Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--bg-surface)',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--brand-surface)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Indian Standard Time (IST)
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {istClock.formattedIST}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>
              ● {istClock.shiftName} Active
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROLE SCREEN 1: SUPERVISOR HOME
          ========================================================================= */}
      {isSupervisor ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Field Ingestion Hub (3 Primary Cards) */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>
              Quick Upload & Field Ingestion
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Card 1: Daily Field Log */}
              <div
                className="card card-interactive"
                onClick={() => setActiveTab('supervisor-entry')}
                style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', borderLeft: '4px solid #0284c7' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} />
                  </div>
                  <span className="badge badge-ready" style={{ fontSize: '0.65rem' }}>Text Ingestion</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Daily Field Log</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Submit progress updates, equipment hours, contractor manpower, and relative dates like "today" or "yesterday".
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', marginTop: 'auto' }}>
                  <span>Open Form</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              {/* Card 2: Voice Memo */}
              <div
                className="card card-interactive"
                onClick={() => setActiveTab('supervisor-entry')}
                style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', borderLeft: '4px solid #7c3aed' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mic size={20} />
                  </div>
                  <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', fontSize: '0.65rem' }}>Speech to Text</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Voice Audio Memo</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Dictate field status hands-free on site. AI automatically transcribes and aligns spool numbers and equipment tags.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', marginTop: 'auto' }}>
                  <span>Record Memo</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              {/* Card 3: Site Photo OCR */}
              <div
                className="card card-interactive"
                onClick={() => setActiveTab('supervisor-entry')}
                style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', borderLeft: '4px solid #f59e0b' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={20} />
                  </div>
                  <span className="badge badge-review" style={{ fontSize: '0.65rem' }}>Visual Evidence</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Site Photo OCR</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Upload photographs of inspection tags, joint stamps, or shift handover whiteboards for automated extraction.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: '#d97706', marginTop: 'auto' }}>
                  <span>Upload Photo</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Layout: Today's Shift Tasks & Recent Submissions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1rem' }}>
            {/* Left: Today's Shift Assigned Tasks */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckSquare size={16} style={{ color: '#0284c7' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Today's Assigned Shift Tasks
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('schedule-activities')}
                  style={{ fontSize: '0.7rem' }}
                >
                  View All Tasks
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {shiftTasks.map(task => (
                  <div
                    key={task.activityId}
                    style={{
                      background: 'var(--bg-surface-secondary)',
                      padding: '0.75rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span className="mono-pill" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                          {task.activityId}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          WBS {task.wbs}
                        </span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0284c7' }}>
                          {task.discipline}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.activityName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div style={{ flex: 1, height: 5, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${getActProgress(task)}%`, height: '100%', background: getActProgress(task) >= 100 ? '#10b981' : '#0284c7' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                          {getActProgress(task)}%
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedScheduleActivityId(task.activityId);
                        setActiveTab('supervisor-entry');
                      }}
                      style={{ fontSize: '0.675rem', padding: '0.35rem 0.6rem', flexShrink: 0 }}
                    >
                      Log Update
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: My Recent Field Submissions */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} style={{ color: '#047857' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    My Recent Field Submissions
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('site-updates')}
                  style={{ fontSize: '0.7rem' }}
                >
                  View All Reports
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentSubmissions.map(sub => {
                  const dec = plannerDecisions[sub.id];
                  const match = matchResults[sub.id];
                  const status = dec?.status === 'approved' ? 'Approved' : dec?.status === 'unplanned' ? 'Unplanned' : 'Pending Review';
                  const badgeClass = status === 'Approved' ? 'badge-ready' : status === 'Unplanned' ? 'badge-unplanned' : 'badge-review';

                  return (
                    <div
                      key={sub.id}
                      style={{
                        background: 'var(--bg-surface-secondary)',
                        padding: '0.75rem 0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono-pill" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                          {sub.id}
                        </span>
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '0.65rem' }}>
                          {status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                        {sub.extractedDescription}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        <span>Area: {sub.area || 'General Site'}</span>
                        <span>Candidate: <strong>{match?.candidateActivityId || 'UNPLANNED'}</strong> ({match?.confidenceScore || 0}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Help Banner */}
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(16, 185, 129, 0.06))',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Compass size={20} style={{ color: 'var(--brand-primary)' }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  New to DATUM? Explore the Interactive Tour
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Step through voice ingestion, OCR photo capture, and automated Primavera schedule alignment.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={startGuidedDemo}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              <Sparkles size={13} />
              <span>Launch Tour</span>
            </button>
          </div>
        </div>
      ) : (
        /* =========================================================================
            ROLE SCREEN 2: LEAD PLANNER HOME
            ========================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Executive KPI Summary Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
            <div className="card" style={{ padding: '0.85rem 1rem', borderLeft: '4px solid #047857' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Master Tasks</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {metrics.total}
              </div>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Primavera baseline</div>
            </div>

            <div className="card" style={{ padding: '0.85rem 1rem', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tasks Completed</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {metrics.completed}
              </div>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Verified against actuals</div>
            </div>

            <div className="card" style={{ padding: '0.85rem 1rem', borderLeft: '4px solid #e11d48' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Delayed Tasks</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e11d48', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {metrics.delayed}
              </div>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Variance against baseline</div>
            </div>

            <div className="card" style={{ padding: '0.85rem 1rem', borderLeft: '4px solid #d97706' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Pending Approvals</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {metrics.pendingReview}
              </div>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Awaiting planner sign-off</div>
            </div>

            <div className="card" style={{ padding: '0.85rem 1rem', borderLeft: '4px solid var(--brand-primary)' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Overall Progress</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {metrics.overallProgress}%
              </div>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Earned value progress</div>
            </div>
          </div>

          {/* Planner QoL Action Cards (4 Cards) */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>
              Planner Control Suite
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {/* Card 1: Re-baseline / Ingest */}
              <div
                className="card card-interactive"
                onClick={() => setActiveTab('upload')}
                style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadCloud size={18} />
                  </div>
                  <span className="badge" style={{ background: 'var(--bg-subtle)', fontSize: '0.65rem' }}>XER / MPP</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Baseline Ingestion</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Upload Primavera P6 XML/XER or MS Project baselines to establish master WBS nodes.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.725rem', fontWeight: 700, color: '#3b82f6', marginTop: 'auto' }}>
                  <span>Ingest Schedule</span>
                  <ArrowRight size={13} />
                </div>
              </div>

              {/* Card 2: Review Queue */}
              <div
                className="card card-interactive"
                onClick={() => setActiveTab('planner-review')}
                style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileCheck2 size={18} />
                  </div>
                  <span className="badge badge-review" style={{ fontSize: '0.65rem' }}>{metrics.pendingReview} Pending</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Reconcile & Review</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Human-in-the-loop verification desk for out-of-baseline updates and ambiguous trade logs.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.725rem', fontWeight: 700, color: '#d97706', marginTop: 'auto' }}>
                  <span>Open Review Queue</span>
                  <ArrowRight size={13} />
                </div>
              </div>

              {/* Card 3: 4D Gantt Suite */}
              <div
                className="card card-interactive"
                onClick={() => setActiveTab('schedule-activities')}
                style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(4, 120, 87, 0.15)', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={18} />
                  </div>
                  <span className="badge badge-ready" style={{ fontSize: '0.65rem' }}>Digital Twin</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>4D Gantt & Digital Twin</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Physical workfront velocity, milestone roadmaps, and EVM S-Curves linked to site actuals.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.725rem', fontWeight: 700, color: '#047857', marginTop: 'auto' }}>
                  <span>Launch 4D Gantt</span>
                  <ArrowRight size={13} />
                </div>
              </div>

              {/* Card 4: Delay Simulator */}
              <div
                className="card card-interactive"
                onClick={() => setActiveTab('copilot')}
                style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(225, 29, 72, 0.15)', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sliders size={18} />
                  </div>
                  <span className="badge badge-unplanned" style={{ fontSize: '0.65rem' }}>Forecasting</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>Delay & What-If Engine</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Simulate contractor delays, rain interruptions, and downstream float consumption.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.725rem', fontWeight: 700, color: '#e11d48', marginTop: 'auto' }}>
                  <span>Simulate Impact</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Field Reports Needing Verification */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileCheck2 size={16} style={{ color: '#d97706' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Verification Inbox: Unresolved Site Submissions ({metrics.pendingReview})
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('planner-review')}
                style={{ fontSize: '0.7rem' }}
              >
                Go to Review Queue
              </button>
            </div>

            {pendingUpdates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                ✓ All field submissions have been reviewed and aligned to the schedule!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {pendingUpdates.map(u => {
                  const match = matchResults[u.id];
                  return (
                    <div
                      key={u.id}
                      style={{
                        background: 'var(--bg-surface-secondary)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ minWidth: 260, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span className="mono-pill" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                            {u.id}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {u.reportDate}
                          </span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                            {u.discipline}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {u.extractedDescription}
                        </div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Candidate: <strong>{match?.candidateActivityId || 'UNPLANNED'}</strong> • Confidence: <strong>{match?.confidenceScore || 0}%</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {match?.candidateActivityId && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              handlePlannerAction(u.id, 'approve', match.candidateActivityId, 'Quick approved from Planner Home');
                              addToast({ type: 'success', title: 'Approved', message: `Approved ${u.id} to ${match.candidateActivityId}` });
                            }}
                            style={{ fontSize: '0.675rem', padding: '0.35rem 0.65rem' }}
                          >
                            <Check size={12} />
                            <span>Quick Approve</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setActiveTab('planner-review')}
                          style={{ fontSize: '0.675rem', padding: '0.35rem 0.65rem' }}
                        >
                          <ExternalLink size={12} />
                          <span>Review</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Help Banner */}
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(16, 185, 129, 0.06))',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Compass size={20} style={{ color: 'var(--brand-primary)' }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Looking for Complete Architectural Guidance?
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Launch the 11-stage system tour explaining fuzzy NLP parsing, spatial heuristics, and out-of-baseline detection.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={startGuidedDemo}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              <Sparkles size={13} />
              <span>System Tour</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
