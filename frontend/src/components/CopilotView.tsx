import React, { useState, useMemo, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Play,
  RotateCcw,
  Copy,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
  Sliders,
  Check,
  FileText
} from 'lucide-react';
import {
  runScenarioSimulation,
  DEMO_SCHEDULE_DEPENDENCIES,
  getPredecessors,
  getSuccessors,
} from '../utils/scheduleSimulator';
import { ScenarioSimulationResult } from '../types';

export const CopilotView: React.FC = () => {
  const {
    enrichedSchedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    setActiveTab,
    setSelectedScheduleActivityId,
    setSelectedInspectorUpdateId,
    addToast,
  } = useProject();

  const [activeAnalysis, setActiveAnalysis] = useState<'simulator' | 'briefing' | 'provenance'>('simulator');

  // Simulator Configuration State
  const [selectedActivityId, setSelectedActivityId] = useState<string>('PIP-L6-012');
  const [simulatedDelayDays, setSimulatedDelayDays] = useState<number>(3);
  const [isScenarioActive, setIsScenarioActive] = useState<boolean>(true);
  const [briefingCopied, setBriefingCopied] = useState<boolean>(false);

  // Selected Activity Object & Linked Updates
  const selectedActivityObj = useMemo(() => {
    return enrichedSchedule.find(a => a.activityId === selectedActivityId) || enrichedSchedule[0];
  }, [enrichedSchedule, selectedActivityId]);

  const linkedUpdates = useMemo(() => {
    if (!selectedActivityObj) return [];
    return siteUpdates.filter(u => {
      const dec = plannerDecisions[u.id];
      if (dec && dec.linkedActivityId) {
        return dec.linkedActivityId === selectedActivityObj.activityId && dec.status !== 'rejected';
      }
      const match = matchResults[u.id];
      return match?.category === 'ready' && match.candidateActivityId === selectedActivityObj.activityId;
    });
  }, [selectedActivityObj, siteUpdates, plannerDecisions, matchResults]);

  // Compute Deterministic Simulation Result
  const simulationResult: ScenarioSimulationResult | null = useMemo(() => {
    if (!selectedActivityObj) return null;
    const delay = isScenarioActive ? simulatedDelayDays : 0;
    return runScenarioSimulation(selectedActivityObj.activityId, delay, enrichedSchedule, DEMO_SCHEDULE_DEPENDENCIES);
  }, [selectedActivityObj, simulatedDelayDays, isScenarioActive, enrichedSchedule]);

  // Handle Scenario Actions
  const handleRunScenario = () => {
    setIsScenarioActive(true);
    addToast({
      type: 'info',
      title: 'Scenario Simulation Executed',
      message: `Calculated deterministic delay propagation for ${selectedActivityId} (+${simulatedDelayDays}d slip).`,
    });
  };

  const handleResetScenario = () => {
    setSimulatedDelayDays(0);
    setIsScenarioActive(false);
    addToast({
      type: 'info',
      title: 'Simulator Reset to Baseline',
      message: 'Restored baseline schedule dates. Actual project data remains untouched.',
    });
  };

  const handleCopyBriefing = () => {
    if (!simulationResult) return;
    navigator.clipboard.writeText(simulationResult.executiveBriefing);
    setBriefingCopied(true);
    setTimeout(() => setBriefingCopied(false), 3000);
    addToast({
      type: 'success',
      title: 'Executive Briefing Copied',
      message: 'Briefing summary copied to clipboard for distribution.',
    });
  };

  // Quick Prompt helper
  const handleSelectPresetPrompt = (activityId: string, days: number) => {
    setSelectedActivityId(activityId);
    setSimulatedDelayDays(days);
    setIsScenarioActive(true);
    setActiveAnalysis('simulator');
    addToast({
      type: 'info',
      title: 'Scenario Loaded',
      message: `Loaded scenario for ${activityId} with +${days} days delay.`,
    });
  };

  // Briefing metrics
  const completedCount = enrichedSchedule.filter(a => a.status === 'Completed').length;
  const delayedItems = enrichedSchedule.filter(a => (a.varianceDays || 0) > 0 || a.status === 'Delayed');
  const pendingReviews = siteUpdates.filter(u => !plannerDecisions[u.id] && matchResults[u.id]?.category === 'review');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div className="banner-card" style={{ borderLeftColor: 'var(--brand-primary)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
            <span className="brand-badge" style={{ padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
              Project Controls Intelligence
            </span>
            <span className="mono-pill" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>
              Deterministic Forward Propagation
            </span>
          </div>
          <h2 className="banner-title" style={{ marginTop: 6, fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={22} style={{ color: 'var(--brand-primary)' }} />
            What-If Schedule Risk Simulator & Copilot
          </h2>
          <p className="banner-desc" style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '750px', marginTop: 4 }}>
            Simulate operational delays on L5/L6 milestone activities, analyze downstream critical path cascades, and generate data-grounded executive briefings with full mathematical traceability.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${activeAnalysis === 'simulator' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveAnalysis('simulator')}
            type="button"
          >
            What-If Schedule Simulator
          </button>
          <button
            className={`btn btn-sm ${activeAnalysis === 'briefing' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveAnalysis('briefing')}
            type="button"
          >
            Executive Progress Briefing
          </button>
          <button
            className={`btn btn-sm ${activeAnalysis === 'provenance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveAnalysis('provenance')}
            type="button"
          >
            Forensic Provenance Model
          </button>
        </div>
      </div>

      {/* Quick Scenario Inquiries Toolbar */}
      <div className="toolbar-card">
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Standard Scenarios:
        </div>
        <div className="filter-pill-group">
          <button
            className={`filter-pill ${selectedActivityId === 'PIP-L6-012' && simulatedDelayDays === 3 && activeAnalysis === 'simulator' ? 'active' : ''}`}
            onClick={() => handleSelectPresetPrompt('PIP-L6-012', 3)}
            type="button"
          >
            ⚡ Cooling Water Erection Slip (+3d)
          </button>
          <button
            className={`filter-pill ${selectedActivityId === 'CIV-L6-002' && simulatedDelayDays === 4 && activeAnalysis === 'simulator' ? 'active' : ''}`}
            onClick={() => handleSelectPresetPrompt('CIV-L6-002', 4)}
            type="button"
          >
            🏗️ Pump Foundation Curing Delay (+4d)
          </button>
          <button
            className={`filter-pill ${selectedActivityId === 'ELE-L6-021' && simulatedDelayDays === 5 && activeAnalysis === 'simulator' ? 'active' : ''}`}
            onClick={() => handleSelectPresetPrompt('ELE-L6-021', 5)}
            type="button"
          >
            🔌 Cable Tray Installation Hold (+5d)
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: WHAT-IF SCHEDULE RISK SIMULATOR (FLAGSHIP FEATURE)
          ========================================================================= */}
      {activeAnalysis === 'simulator' && simulationResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Non-Destructive Sandbox Notice */}
          <div
            style={{
              padding: '0.65rem 1rem',
              background: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '4px solid var(--brand-primary)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
              <span>
                <strong>Non-Destructive Simulation Mode:</strong> Calculated date shifts and risk metrics are computed in an isolated sandbox. Real Primavera/MS-Project baseline schedule and field evidence remain unaltered.
              </span>
            </div>
            {isScenarioActive && simulatedDelayDays > 0 && (
              <span className="mono-pill" style={{ background: 'var(--brand-badge-bg)', color: 'var(--brand-badge-fg)', borderColor: 'var(--brand-badge-border)', fontWeight: 700 }}>
                Scenario Active (+{simulatedDelayDays}d)
              </span>
            )}
          </div>

          {/* Configuration Grid: Activity Selection & Delay Parameter Slider */}
          <div id="demo-target-delay-simulation" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.25rem' }}>
            
            {/* Left Card: Target Activity Details */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: '0.8rem' }}>
                  <span>1. Select Baseline Activity to Simulate:</span>
                </label>
                <span className="mono-pill">{selectedActivityObj.discipline}</span>
              </div>

              <select
                className="form-select"
                value={selectedActivityId}
                onChange={e => {
                  setSelectedActivityId(e.target.value);
                  setIsScenarioActive(true);
                }}
                style={{ width: '100%', fontSize: '0.85rem', fontWeight: 600 }}
              >
                {enrichedSchedule.map(a => (
                  <option key={a.activityId} value={a.activityId}>
                    [{a.activityId}] {a.activityName} ({a.area} • WBS {a.wbs})
                  </option>
                ))}
              </select>

              {/* Activity Details Micro-Table */}
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '0.75rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  fontSize: '0.775rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Planned Baseline Dates:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {selectedActivityObj.plannedStart} &rarr; {selectedActivityObj.plannedFinish}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Actual Field Status:</span>
                  <span style={{ fontWeight: 700, color: selectedActivityObj.status === 'Completed' ? 'var(--status-ready-fg)' : selectedActivityObj.status === 'Delayed' ? 'var(--status-unplanned-fg)' : 'var(--brand-primary)' }}>
                    {selectedActivityObj.status || 'Not Started'} ({selectedActivityObj.progressPercent || 0}%)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Evidence Links:</span>
                  <span style={{ fontWeight: 600 }}>
                    {linkedUpdates.length} Verified Field Updates
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Workfront Area:</span>
                  <span style={{ fontWeight: 600 }}>{selectedActivityObj.area}</span>
                </div>
              </div>
            </div>

            {/* Right Card: Delay Parameters & Action Controls */}
            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span>2. Assumed Operational Delay (Days):</span>
                </label>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: simulatedDelayDays > 0 ? (simulatedDelayDays >= 7 ? 'var(--danger-soft)' : 'var(--warning-soft)') : 'var(--surface-secondary)',
                    color: simulatedDelayDays > 0 ? (simulatedDelayDays >= 7 ? 'var(--danger)' : 'var(--warning)') : 'var(--text-muted)',
                    border: `1px solid ${simulatedDelayDays > 0 ? (simulatedDelayDays >= 7 ? '#FECDD3' : '#FDE68A') : 'var(--border-default)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {simulatedDelayDays === 0 ? '0d (Baseline)' : `+${simulatedDelayDays} ${simulatedDelayDays === 1 ? 'Day' : 'Days'}`}
                </span>
              </div>

              {/* Enterprise Range Slider Control */}
              <div style={{ position: 'relative', width: '100%', padding: '0.15rem 0' }}>
                <input
                  type="range"
                  min="0"
                  max="21"
                  step="1"
                  value={simulatedDelayDays}
                  onChange={e => {
                    setSimulatedDelayDays(Number(e.target.value));
                    setIsScenarioActive(true);
                  }}
                  className="enterprise-range-slider"
                  style={{
                    background: `linear-gradient(to right, var(--primary, #2563EB) 0%, var(--primary, #2563EB) ${((simulatedDelayDays / 21) * 100).toFixed(1)}%, var(--border-default, #E2E8F0) ${((simulatedDelayDays / 21) * 100).toFixed(1)}%, var(--border-default, #E2E8F0) 100%)`,
                  }}
                  aria-label="Assumed Operational Delay (Days)"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.675rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  <span>0d (Baseline)</span>
                  <span>+7d</span>
                  <span>+14d</span>
                  <span>+21d (Max)</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[
                  { label: '0d (Baseline)', val: 0 },
                  { label: '+2 Days', val: 2 },
                  { label: '+3 Days', val: 3 },
                  { label: '+5 Days', val: 5 },
                  { label: '+7 Days', val: 7 },
                  { label: '+14 Days', val: 14 },
                ].map(preset => {
                  const isPresetActive = simulatedDelayDays === preset.val;
                  return (
                    <button
                      key={preset.val}
                      type="button"
                      className={`btn btn-sm ${isPresetActive ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        fontSize: '0.725rem',
                        padding: '4px 8px',
                        flex: 1,
                        fontWeight: isPresetActive ? 700 : 600,
                        boxShadow: isPresetActive ? '0 1px 3px rgba(37, 99, 235, 0.35)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => {
                        setSimulatedDelayDays(preset.val);
                        setIsScenarioActive(true);
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: Run & Reset */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleRunScenario}
                >
                  <Play size={14} />
                  <span>Run Scenario Propagation</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetScenario}
                  title="Reset simulation to baseline 0 days"
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* KPI Output Strip */}
          <div className="grid-kpi">
            <div className="card kpi-card">
              <div className="kpi-icon" style={{ background: '#f0f7fc', color: '#0284c7' }}>
                <Calendar size={20} />
              </div>
              <div>
                <div className="kpi-title">Forecast Finish</div>
                <div className="kpi-value" style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>
                  {simulationResult.scenarioFinish}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Baseline: {simulationResult.baselineFinish}
                </div>
              </div>
            </div>

            <div className="card kpi-card">
              <div
                className="kpi-icon"
                style={{
                  background: simulationResult.impactedCount > 0 ? 'var(--status-review-bg)' : 'var(--status-ready-bg)',
                  color: simulationResult.impactedCount > 0 ? 'var(--status-review-fg)' : 'var(--status-ready-fg)',
                }}
              >
                <Layers size={20} />
              </div>
              <div>
                <div className="kpi-title">Impacted Successors</div>
                <div
                  className="kpi-value"
                  style={{
                    color: simulationResult.impactedCount > 0 ? 'var(--status-review-fg)' : 'var(--status-ready-fg)',
                  }}
                >
                  {simulationResult.impactedCount}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Downstream Milestones
                </div>
              </div>
            </div>

            <div className="card kpi-card">
              <div
                className="kpi-icon"
                style={{
                  background: simulationResult.maxShiftDays > 0 ? '#fef2f2' : '#f0fdf4',
                  color: simulationResult.maxShiftDays > 0 ? '#b91c1c' : '#047857',
                }}
              >
                <TrendingDown size={20} />
              </div>
              <div>
                <div className="kpi-title">Max Schedule Slip</div>
                <div
                  className="kpi-value"
                  style={{
                    color: simulationResult.maxShiftDays > 0 ? '#b91c1c' : '#047857',
                  }}
                >
                  +{simulationResult.maxShiftDays}d
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Cumulative Project Delta
                </div>
              </div>
            </div>

            <div className="card kpi-card">
              <div
                className="kpi-icon"
                style={{
                  background:
                    simulationResult.overallRiskLevel === 'High'
                      ? '#fff1f2'
                      : simulationResult.overallRiskLevel === 'Medium'
                      ? '#fffbeb'
                      : '#ecfdf5',
                  color:
                    simulationResult.overallRiskLevel === 'High'
                      ? '#991b1b'
                      : simulationResult.overallRiskLevel === 'Medium'
                      ? '#b45309'
                      : '#047857',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="kpi-title">Package Risk Rating</div>
                <div
                  className="kpi-value"
                  style={{
                    color:
                      simulationResult.overallRiskLevel === 'High'
                        ? '#991b1b'
                        : simulationResult.overallRiskLevel === 'Medium'
                        ? '#b45309'
                        : '#047857',
                  }}
                >
                  {simulationResult.overallRiskLevel}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {simulationResult.criticalMilestoneImpacted ? 'Critical Milestone Touched' : 'Standard Buffer'}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Dependency Chain (Predecessors -> Target -> Successors) */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={16} style={{ color: 'var(--brand-primary)' }} />
                  Deterministic Dependency Chain & Date Shifts
                </h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Visualizes Finish-to-Start (FS) logical linkages and cascaded forecast adjustments.
                </p>
              </div>
              <span className="mono-pill">Finish-to-Start (FS)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {/* 1. Upstream Predecessor(s) */}
              {simulationResult.upstreamActivities.length > 0 ? (
                simulationResult.upstreamActivities.map(pred => (
                  <React.Fragment key={pred.activityId}>
                    <div
                      style={{
                        minWidth: 190,
                        padding: '0.75rem 0.85rem',
                        background: 'var(--bg-surface-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        flexShrink: 0,
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedScheduleActivityId(pred.activityId)}
                      title="Click to view activity in Master Schedule drawer"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {pred.activityId}
                        </span>
                        <span className="mono-pill" style={{ fontSize: '0.65rem' }}>Predecessor</span>
                      </div>
                      <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pred.activityName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Finish: {pred.plannedFinish} (Cleared)
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>&rarr;</span>
                  </React.Fragment>
                ))
              ) : (
                <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-xs)', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Package Root (No Predecessors)
                </div>
              )}

              {/* 2. Target Activity (Highlighted) */}
              <div
                style={{
                  minWidth: 230,
                  padding: '0.85rem 1rem',
                  background: 'var(--brand-surface)',
                  border: '2px solid var(--brand-primary)',
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.825rem', color: 'var(--brand-primary)' }}>
                    {simulationResult.targetActivityId}
                  </span>
                  <span style={{ background: 'var(--brand-primary)', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: 'var(--radius-xs)' }}>
                    Selected Target
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {simulationResult.targetActivityName}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginTop: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Forecast Finish:</span>
                  <strong style={{ color: simulationResult.simulatedDelayDays > 0 ? 'var(--status-unplanned-fg)' : 'var(--text-primary)' }}>
                    {simulationResult.scenarioFinish} (+{simulationResult.simulatedDelayDays}d)
                  </strong>
                </div>
              </div>

              {/* 3. Downstream Successor Chain */}
              {simulationResult.impactedActivities.filter(i => !i.isDirectTarget).length > 0 ? (
                simulationResult.impactedActivities
                  .filter(i => !i.isDirectTarget)
                  .map(succ => (
                    <React.Fragment key={succ.activityId}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>&rarr;</span>
                      <div
                        style={{
                          minWidth: 210,
                          padding: '0.75rem 0.85rem',
                          background: succ.shiftDays > 0 ? 'var(--status-unplanned-bg)' : 'var(--bg-surface-secondary)',
                          border: succ.shiftDays > 0 ? '1px solid var(--border-subtle)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          flexShrink: 0,
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedScheduleActivityId(succ.activityId)}
                        title="Click to inspect activity in schedule drawer"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.75rem', color: succ.shiftDays > 0 ? 'var(--status-unplanned-fg)' : 'var(--brand-primary)' }}>
                            {succ.activityId}
                          </span>
                          <span
                            className={`variance-badge ${succ.shiftDays > 0 ? 'delayed' : 'on-track'}`}
                            style={{ fontSize: '0.65rem', padding: '1px 5px' }}
                          >
                            +{succ.shiftDays}d Slip
                          </span>
                        </div>
                        <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {succ.activityName}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          <span>Forecast:</span>
                          <strong style={{ color: succ.shiftDays > 0 ? 'var(--status-unplanned-fg)' : 'var(--text-secondary)' }}>
                            {succ.scenarioFinish}
                          </strong>
                        </div>
                      </div>
                    </React.Fragment>
                  ))
              ) : (
                <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-xs)', fontSize: '0.725rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                  End of Chain (No Downstream Successors)
                </div>
              )}
            </div>
          </div>

          {/* Impacted Activities Table Breakdown */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingDown size={16} style={{ color: '#b91c1c' }} />
                Downstream Activity Variance Breakdown
              </h3>
              <span className="mono-pill">
                {simulationResult.impactedActivities.length} Activities Evaluated
              </span>
            </div>

            <div className="table-responsive">
              <table className="industrial-table">
                <thead>
                  <tr>
                    <th>Activity ID</th>
                    <th>Activity Name</th>
                    <th>Discipline</th>
                    <th>Baseline Finish</th>
                    <th>Scenario Forecast Finish</th>
                    <th>Calculated Shift</th>
                    <th>Risk Level</th>
                    <th>Dependency Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResult.impactedActivities.map(act => (
                    <tr
                      key={act.activityId}
                      style={{
                        background: act.isDirectTarget ? 'var(--bg-subtle)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedScheduleActivityId(act.activityId)}
                      title="Click to inspect activity details"
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)' }}>
                        {act.activityId}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {act.activityName}
                        {act.isDirectTarget && (
                          <span style={{ marginLeft: 6, fontSize: '0.675rem', background: '#0284c7', color: '#ffffff', padding: '1px 5px', borderRadius: 3 }}>
                            Target
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="mono-pill">{act.discipline}</span>
                      </td>
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        {act.baselineFinish}
                      </td>
                      <td style={{ fontSize: '0.775rem', fontWeight: 700, color: act.shiftDays > 0 ? '#b91c1c' : 'var(--text-primary)' }}>
                        {act.scenarioFinish}
                      </td>
                      <td>
                        <span className={`variance-badge ${act.shiftDays > 0 ? 'delayed' : 'on-track'}`}>
                          {act.shiftDays > 0 ? `+${act.shiftDays}d` : '0d (On Plan)'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            act.severity === 'critical' ? 'unplanned' : act.severity === 'medium' ? 'review' : 'ready'
                          }`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {act.severity.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: 260 }}>
                        {act.impactExplanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Plain-English Executive Briefing Section */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={16} style={{ color: 'var(--brand-primary)' }} />
                  Automated Executive Briefing & Planning Prompts
                </h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Grounded narrative derived strictly from deterministic dependency calculations.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyBriefing}
              >
                {briefingCopied ? <Check size={13} style={{ color: '#047857' }} /> : <Copy size={13} />}
                <span>{briefingCopied ? 'Copied!' : 'Copy Briefing'}</span>
              </button>
            </div>

            <div
              style={{
                background: 'var(--bg-surface-secondary)',
                padding: '1.25rem 1.4rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                borderLeft: '4px solid var(--brand-primary)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                lineHeight: 1.75,
                whiteSpace: 'pre-line',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.01em',
              }}
            >
              {simulationResult.executiveBriefing}
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 2: EXECUTIVE PROGRESS BRIEFING (OVERVIEW MODE)
          ========================================================================= */}
      {activeAnalysis === 'briefing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={16} style={{ color: 'var(--brand-primary)' }} />
                Live Project Execution Briefing
              </h3>
              <span className="mono-pill">L5 / L6 Baseline</span>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--brand-primary)', fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              <strong>Executive Overview:</strong> Project execution across <strong>{enrichedSchedule.length} L5/L6 milestone activities</strong> is currently <strong>{Math.round((completedCount / (enrichedSchedule.length || 1)) * 100)}% complete</strong>. A total of <strong>{siteUpdates.length} daily field records</strong> have been reconciled against Primavera WBS baselines.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--status-ready-bg)', color: 'var(--status-ready-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  ✓
                </div>
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Civil & Piping Erection Active in Pump Bay
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Civil pump foundations and CW pipe spool erection verified with supervisor photo proofs.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--status-review-bg)', color: 'var(--status-review-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  !
                </div>
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {pendingReviews.length} Supervisor Reports Awaiting Lead Planner Confirmation
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Field updates require 1-click confirmation in the Planner Reconciliation Workbench.
                  </div>
                </div>
              </div>

              {delayedItems.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--status-unplanned-bg)', color: 'var(--status-unplanned-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    ⚠
                  </div>
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--status-unplanned-fg)' }}>
                      Schedule Variance Alert: {delayedItems.length} Activities Behind Baseline
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Crane breakdown in Pump Bay workfront causing 3–5 days variance on downstream hydrotest.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab('planner-review')}
                type="button"
              >
                <span>Open Planner Review Queue</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Execution Reliability Indices
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span>Matching Engine Precision</span>
                  <span style={{ color: 'var(--status-ready-fg)' }}>94.2%</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 4 }}>
                  <div className="progress-bar-fill green" style={{ width: '94.2%' }} />
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span>Photo Evidence Coverage</span>
                  <span style={{ color: 'var(--brand-primary)' }}>87.5%</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 4 }}>
                  <div className="progress-bar-fill blue" style={{ width: '87.5%' }} />
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span>Baseline Adherence Score</span>
                  <span style={{ color: 'var(--status-review-fg)' }}>81.0%</span>
                </div>
                <div className="progress-bar-container" style={{ marginTop: 4 }}>
                  <div className="progress-bar-fill amber" style={{ width: '81%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: FORENSIC PROVENANCE MODEL
          ========================================================================= */}
      {activeAnalysis === 'provenance' && (
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} style={{ color: 'var(--brand-primary)' }} />
              Forensic Evidence Provenance & Audit Integrity
            </h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Verifiable chain of evidence connecting supervisor raw logs & photos directly to Primavera/MS-Project baseline deliverables.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div className="mono-pill" style={{ marginBottom: 4 }}>Step 1: Source Ingestion</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Raw Text & Photo Upload</div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Unstructured logs, piping Excel, and photo timestamps stored immutably.
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div className="mono-pill" style={{ marginBottom: 4 }}>Step 2: 4-Factor Matching</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Deterministic Multi-Score</div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Keyword (50%), Discipline (20%), Area (15%), and Fuzzy string matching (15%).
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div className="mono-pill" style={{ marginBottom: 4 }}>Step 3: Human Verification</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Planner Review Workbench</div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Lead planners inspect NLP breakdown and photo proofs with 1-click approve/relink.
              </p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div className="mono-pill" style={{ marginBottom: 4 }}>Step 4: Baseline Alignment</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>WBS Schedule Enrichment</div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Actual start/finish dates and delay variance updated in master Primavera baseline.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
