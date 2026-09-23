import React, { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  Play,
  RotateCcw,
  Copy,
  Calendar,
  Layers,
  Check,
  Zap,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  runScenarioSimulation,
  DEMO_SCHEDULE_DEPENDENCIES,
} from '../utils/scheduleSimulator';
import { ScenarioSimulationResult } from '../types';

const formatDisplayDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const CopilotView: React.FC = () => {
  const {
    enrichedSchedule,
    setSelectedScheduleActivityId,
    addToast,
  } = useProject();

  // Simulator State
  const [selectedActivityId, setSelectedActivityId] = useState<string>('PIP-L6-012');
  const [simulatedDelayDays, setSimulatedDelayDays] = useState<number>(3);
  const [isScenarioActive, setIsScenarioActive] = useState<boolean>(true);
  const [briefingCopied, setBriefingCopied] = useState<boolean>(false);
  const [showFullTable, setShowFullTable] = useState<boolean>(false);

  // Selected Activity Object
  const selectedActivityObj = useMemo(() => {
    return enrichedSchedule.find(a => a.activityId === selectedActivityId) || enrichedSchedule[0];
  }, [enrichedSchedule, selectedActivityId]);

  // Compute Deterministic Simulation Result
  const simulationResult: ScenarioSimulationResult | null = useMemo(() => {
    if (!selectedActivityObj) return null;
    const delay = isScenarioActive ? simulatedDelayDays : 0;
    return runScenarioSimulation(
      selectedActivityObj.activityId,
      delay,
      enrichedSchedule,
      DEMO_SCHEDULE_DEPENDENCIES
    );
  }, [selectedActivityObj, simulatedDelayDays, isScenarioActive, enrichedSchedule]);

  const handleRunScenario = () => {
    setIsScenarioActive(true);
    addToast({
      type: 'info',
      title: 'Simulation Updated',
      message: `Calculated forward propagation for ${selectedActivityId} with +${simulatedDelayDays}d slip.`,
    });
  };

  const handleResetScenario = () => {
    setSimulatedDelayDays(0);
    setIsScenarioActive(false);
    addToast({
      type: 'info',
      title: 'Simulator Reset',
      message: 'Restored baseline schedule dates.',
    });
  };

  const handleCopyBriefing = () => {
    if (!simulationResult) return;
    navigator.clipboard.writeText(simulationResult.executiveBriefing);
    setBriefingCopied(true);
    setTimeout(() => setBriefingCopied(false), 2500);
    addToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: 'Executive prediction briefing copied.',
    });
  };

  const handleSelectPreset = (activityId: string, days: number) => {
    setSelectedActivityId(activityId);
    setSimulatedDelayDays(days);
    setIsScenarioActive(true);
    addToast({
      type: 'info',
      title: 'Scenario Preset Loaded',
      message: `Loaded ${activityId} (+${days}d).`,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Compact Top Header with Quick Presets */}
      <div
        className="card"
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderLeft: '4px solid var(--brand-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Delay Risk Simulator & Predictor
              </h2>
              <span className="brand-badge" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                Deterministic CPM
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Forward delay propagation across critical path dependencies
            </div>
          </div>
        </div>

        {/* Quick Standard Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 2 }}>
            Presets:
          </span>
          <button
            type="button"
            className={`filter-pill ${selectedActivityId === 'PIP-L6-012' && simulatedDelayDays === 3 ? 'active' : ''}`}
            onClick={() => handleSelectPreset('PIP-L6-012', 3)}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            ⚡ CW Erection (+3d)
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedActivityId === 'CIV-L6-002' && simulatedDelayDays === 4 ? 'active' : ''}`}
            onClick={() => handleSelectPreset('CIV-L6-002', 4)}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            🏗️ Foundation Cure (+4d)
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedActivityId === 'ELE-L6-021' && simulatedDelayDays === 5 ? 'active' : ''}`}
            onClick={() => handleSelectPreset('ELE-L6-021', 5)}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            🔌 Cable Tray (+5d)
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleResetScenario}
            title="Reset to 0-day baseline"
            style={{ fontSize: '0.7rem', padding: '3px 6px', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Command Deck: No Manual Scrolling Needed */}
      {simulationResult && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(310px, 350px) minmax(0, 1fr)',
            gap: '1rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT COLUMN: Controls & Selected Target Activity */}
          <div
            className="card"
            style={{
              padding: '0.95rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1. Target Activity
              </span>
              <span className="mono-pill" style={{ fontSize: '0.65rem' }}>
                {selectedActivityObj.discipline}
              </span>
            </div>

            {/* Target Activity Dropdown */}
            <select
              className="form-select"
              value={selectedActivityId}
              onChange={e => {
                setSelectedActivityId(e.target.value);
                setIsScenarioActive(true);
              }}
              style={{ width: '100%', fontSize: '0.8rem', fontWeight: 600, padding: '0.45rem' }}
            >
              {enrichedSchedule.map(a => (
                <option key={a.activityId} value={a.activityId}>
                  [{a.activityId}] {a.activityName}
                </option>
              ))}
            </select>

            {/* Compact Info Pill */}
            <div
              style={{
                background: 'var(--bg-surface-secondary)',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.725rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Planned Window:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {formatDisplayDate(selectedActivityObj.plannedStart)} &rarr; {formatDisplayDate(selectedActivityObj.plannedFinish)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Area & Status:</span>
                <span style={{ fontWeight: 700, color: selectedActivityObj.status === 'Completed' ? '#10b981' : selectedActivityObj.status === 'Delayed' ? '#ef4444' : 'var(--brand-primary)' }}>
                  {selectedActivityObj.area} &bull; {selectedActivityObj.status || 'In Progress'} ({selectedActivityObj.progressPercent || 0}%)
                </span>
              </div>
            </div>

            {/* Slider & Quick Days Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  2. Assumed Slip:
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: simulatedDelayDays > 0 ? (simulatedDelayDays >= 7 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)') : 'rgba(255,255,255,0.06)',
                    color: simulatedDelayDays > 0 ? (simulatedDelayDays >= 7 ? '#ef4444' : '#f59e0b') : 'var(--text-muted)',
                    border: `1px solid ${simulatedDelayDays > 0 ? (simulatedDelayDays >= 7 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)') : 'var(--border-subtle)'}`,
                  }}
                >
                  {simulatedDelayDays === 0 ? '0d (Baseline)' : `+${simulatedDelayDays} Days`}
                </span>
              </div>

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
                style={{ width: '100%', height: 6 }}
              />

              {/* Quick Preset Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                {[0, 2, 3, 5, 7].map(d => {
                  const isActive = simulatedDelayDays === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        fontSize: '0.68rem',
                        padding: '3px 2px',
                        justifyContent: 'center',
                        fontWeight: isActive ? 700 : 500,
                      }}
                      onClick={() => {
                        setSimulatedDelayDays(d);
                        setIsScenarioActive(true);
                      }}
                    >
                      {d === 0 ? '0d' : `+${d}d`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ flex: 1, justifyContent: 'center', padding: '0.45rem', fontSize: '0.75rem', fontWeight: 700 }}
                onClick={handleRunScenario}
              >
                <Play size={13} />
                <span>Simulate Delay</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetScenario}
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem' }}
                title="Reset to 0d"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Immediate Live Prediction Output */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            
            {/* 4 Compact Prediction KPI Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.55rem' }}>
              <div className="card kpi-card" style={{ padding: '0.65rem 0.75rem' }}>
                <div className="kpi-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', width: 28, height: 28 }}>
                  <Calendar size={14} />
                </div>
                <div>
                  <div className="kpi-title" style={{ fontSize: '0.65rem' }}>Forecast Finish</div>
                  <div className="kpi-value" style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>
                    {formatDisplayDate(simulationResult.scenarioFinish)}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    Plan: {formatDisplayDate(simulationResult.baselineFinish)}
                  </div>
                </div>
              </div>

              <div className="card kpi-card" style={{ padding: '0.65rem 0.75rem' }}>
                <div
                  className="kpi-icon"
                  style={{
                    background: simulationResult.maxShiftDays > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: simulationResult.maxShiftDays > 0 ? '#ef4444' : '#10b981',
                    width: 28,
                    height: 28,
                  }}
                >
                  <TrendingDown size={14} />
                </div>
                <div>
                  <div className="kpi-title" style={{ fontSize: '0.65rem' }}>Cumulative Slip</div>
                  <div
                    className="kpi-value"
                    style={{
                      fontSize: '0.88rem',
                      color: simulationResult.maxShiftDays > 0 ? '#ef4444' : '#10b981',
                    }}
                  >
                    {simulationResult.maxShiftDays > 0 ? `+${simulationResult.maxShiftDays}d` : '0d On Plan'}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    Schedule variance
                  </div>
                </div>
              </div>

              <div className="card kpi-card" style={{ padding: '0.65rem 0.75rem' }}>
                <div
                  className="kpi-icon"
                  style={{
                    background: simulationResult.impactedCount > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: simulationResult.impactedCount > 0 ? '#f59e0b' : '#10b981',
                    width: 28,
                    height: 28,
                  }}
                >
                  <Layers size={14} />
                </div>
                <div>
                  <div className="kpi-title" style={{ fontSize: '0.65rem' }}>Impacted Tasks</div>
                  <div className="kpi-value" style={{ fontSize: '0.88rem' }}>
                    {simulationResult.impactedCount}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    Downstream chain
                  </div>
                </div>
              </div>

              <div className="card kpi-card" style={{ padding: '0.65rem 0.75rem' }}>
                <div
                  className="kpi-icon"
                  style={{
                    background: simulationResult.overallRiskLevel === 'High' ? 'rgba(239, 68, 68, 0.12)' : simulationResult.overallRiskLevel === 'Medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: simulationResult.overallRiskLevel === 'High' ? '#ef4444' : simulationResult.overallRiskLevel === 'Medium' ? '#f59e0b' : '#10b981',
                    width: 28,
                    height: 28,
                  }}
                >
                  <AlertTriangle size={14} />
                </div>
                <div>
                  <div className="kpi-title" style={{ fontSize: '0.65rem' }}>Package Risk</div>
                  <div
                    className="kpi-value"
                    style={{
                      fontSize: '0.88rem',
                      color: simulationResult.overallRiskLevel === 'High' ? '#ef4444' : simulationResult.overallRiskLevel === 'Medium' ? '#f59e0b' : '#10b981',
                    }}
                  >
                    {simulationResult.overallRiskLevel}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    {simulationResult.criticalMilestoneImpacted ? 'Critical path' : 'Buffer absorptive'}
                  </div>
                </div>
              </div>
            </div>

            {/* Instant Synthesis Briefing Box */}
            <div className="card" style={{ padding: '0.75rem 0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Zap size={14} style={{ color: 'var(--brand-primary)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    Prediction Synthesis & Actionable Guidance
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyBriefing}
                  style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                >
                  {briefingCopied ? <Check size={11} style={{ color: '#047857' }} /> : <Copy size={11} />}
                  <span>{briefingCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div
                style={{
                  background: 'var(--bg-surface-secondary)',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '3px solid var(--brand-primary)',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                }}
              >
                {simulationResult.executiveBriefing}
              </div>
            </div>

            {/* Compact Impacted Successors Deck */}
            <div className="card" style={{ padding: '0.75rem 0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <TrendingDown size={14} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    Downstream Cascade Shifts ({simulationResult.impactedActivities.filter(a => !a.isDirectTarget).length})
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowFullTable(!showFullTable)}
                  style={{ fontSize: '0.68rem', padding: '2px 5px' }}
                >
                  {showFullTable ? 'Hide Table ▴' : 'View Full Table ▾'}
                </button>
              </div>

              {simulationResult.impactedActivities.filter(a => !a.isDirectTarget).length === 0 ? (
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.25rem 0' }}>
                  No downstream milestones are shifted. Remaining schedule float absorbs this variation.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {simulationResult.impactedActivities
                    .filter(a => !a.isDirectTarget)
                    .slice(0, 3)
                    .map(act => (
                      <div
                        key={act.activityId}
                        onClick={() => setSelectedScheduleActivityId(act.activityId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.4rem 0.6rem',
                          background: 'var(--bg-surface-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-xs)',
                          cursor: 'pointer',
                          fontSize: '0.725rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-primary)' }}>
                            {act.activityId}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {act.activityName}
                          </span>
                          <span className="mono-pill" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                            {act.discipline}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            Forecast: <strong style={{ color: act.shiftDays > 0 ? '#ef4444' : 'inherit' }}>{formatDisplayDate(act.scenarioFinish)}</strong>
                          </span>
                          <span className={`variance-badge ${act.shiftDays > 0 ? 'delayed' : 'on-track'}`} style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                            +{act.shiftDays}d Slip
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Collapsible Forensic Table */}
              {showFullTable && (
                <div style={{ marginTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                  <div className="table-responsive">
                    <table className="industrial-table" style={{ fontSize: '0.7rem' }}>
                      <thead>
                        <tr>
                          <th>Activity ID</th>
                          <th>Name</th>
                          <th>Discipline</th>
                          <th>Plan Finish</th>
                          <th>Forecast Finish</th>
                          <th>Shift</th>
                          <th>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulationResult.impactedActivities.map(act => (
                          <tr key={act.activityId} onClick={() => setSelectedScheduleActivityId(act.activityId)} style={{ cursor: 'pointer' }}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{act.activityId}</td>
                            <td>{act.activityName}</td>
                            <td>{act.discipline}</td>
                            <td>{formatDisplayDate(act.baselineFinish)}</td>
                            <td style={{ fontWeight: 700, color: act.shiftDays > 0 ? '#ef4444' : 'inherit' }}>{formatDisplayDate(act.scenarioFinish)}</td>
                            <td><span className={`variance-badge ${act.shiftDays > 0 ? 'delayed' : 'on-track'}`}>+{act.shiftDays}d</span></td>
                            <td><span className={`status-badge ${act.severity === 'critical' ? 'unplanned' : act.severity === 'medium' ? 'review' : 'ready'}`}>{act.severity}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
