import { ScheduleActivity, ScheduleDependency, ImpactedActivityScenario, ScenarioSimulationResult } from '../types';

/**
 * Realistic Finish-to-Start (FS) dependencies across Civil, Piping, Electrical, Instrumentation, and HSE packages.
 */
export const DEMO_SCHEDULE_DEPENDENCIES: ScheduleDependency[] = [
  // Civil Foundation to Piping & Mechanical
  {
    predecessorId: 'CIV-L6-001',
    successorId: 'CIV-L6-002',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Foundation excavation must complete before casting concrete.',
  },
  {
    predecessorId: 'CIV-L6-002',
    successorId: 'PIP-L6-012',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Pump foundation curing verified before line erection begins.',
  },
  {
    predecessorId: 'CIV-L6-003',
    successorId: 'PIP-L6-015',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Pipe rack pedestal curing required before firewater line erection.',
  },
  {
    predecessorId: 'CIV-L6-004',
    successorId: 'ELE-L6-021',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Cable trench civil works must be ready before cable tray installation.',
  },

  // Cooling Water (CW) Piping Package Critical Chain
  {
    predecessorId: 'PIP-L6-011',
    successorId: 'PIP-L6-012',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Spool fabrication & QC release required before line erection.',
  },
  {
    predecessorId: 'HSE-L6-041',
    successorId: 'PIP-L6-012',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Lifting safety clearance permit mandatory prior to pipe erection.',
  },
  {
    predecessorId: 'PIP-L6-012',
    successorId: 'PIP-L6-013',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Pipe spool must be erected in place before welding field joints.',
  },
  {
    predecessorId: 'PIP-L6-012',
    successorId: 'PIP-L6-016',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Header line erection alignment precedes suction piping fitting.',
  },
  {
    predecessorId: 'PIP-L6-013',
    successorId: 'PIP-L6-014',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'All field welds and NDT inspection cleared before hydrotest pressurization.',
  },
  {
    predecessorId: 'PIP-L6-014',
    successorId: 'INS-L6-031',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Hydrotest line release required before final inline instrument installation.',
  },

  // Electrical & Substation Feeder Chain
  {
    predecessorId: 'ELE-L6-021',
    successorId: 'ELE-L6-022',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Cable trays installed and bolted before cable pulling starts.',
  },
  {
    predecessorId: 'ELE-L6-022',
    successorId: 'ELE-L6-023',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Feeder cable pulled to switchgear before terminal glanding and lugging.',
  },
  {
    predecessorId: 'ELE-L6-024',
    successorId: 'ELE-L6-023',
    relationshipType: 'FS',
    lagDays: 0,
    description: 'Earthing grid connection verified before MCC termination energization.',
  },
];

/**
 * Parses date string (YYYY-MM-DD) into pure UTC Timestamp in milliseconds
 */
export const parseUTCDateMs = (dateStr: string): number => {
  if (!dateStr) return 0;
  const parts = dateStr.trim().split(/[-/]/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  return Date.UTC(parts[0], parts[1] - 1, parts[2]);
};

/**
 * Pure UTC-safe date addition
 */
export const addDaysToDateString = (dateStr: string, days: number): string => {
  if (!dateStr) return dateStr;
  const parts = dateStr.trim().split(/[-/]/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
};

/**
 * Pure UTC-safe difference in calendar days (dateLater - dateEarlier)
 */
export const diffDaysBetweenDates = (dateStrLater: string, dateStrEarlier: string): number => {
  if (!dateStrLater || !dateStrEarlier) return 0;
  const msLater = parseUTCDateMs(dateStrLater);
  const msEarlier = parseUTCDateMs(dateStrEarlier);
  if (!msLater || !msEarlier) return 0;
  const diffMs = msLater - msEarlier;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

export const calculateDuration = (startStr: string, finishStr: string): number => {
  const diff = diffDaysBetweenDates(finishStr, startStr);
  return Math.max(1, diff + 1);
};

/**
 * User-friendly Date Display (e.g. "Sep 05, 2026")
 */
export const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const parts = dateStr.trim().split(/[-/]/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[parts[1] - 1] || '';
  const day = String(parts[2]).padStart(2, '0');
  const year = parts[0];
  return `${month} ${day}, ${year}`;
};

/**
 * User-friendly Variance Badge Text (e.g. "+3d Slip", "-1d Ahead", "On Time")
 */
export const formatVarianceBadge = (varianceDays: number = 0): { label: string; type: 'delayed' | 'ahead' | 'ontrack' } => {
  if (varianceDays > 0) {
    return { label: `+${varianceDays}d Slip`, type: 'delayed' };
  }
  if (varianceDays < 0) {
    return { label: `${varianceDays}d Ahead`, type: 'ahead' };
  }
  return { label: 'On Schedule', type: 'ontrack' };
};

/**
 * Get direct predecessor activities for a given activity
 */
export const getPredecessors = (activityId: string, dependencies = DEMO_SCHEDULE_DEPENDENCIES): ScheduleDependency[] => {
  return dependencies.filter(dep => dep.successorId === activityId);
};

/**
 * Get direct successor activities for a given activity
 */
export const getSuccessors = (activityId: string, dependencies = DEMO_SCHEDULE_DEPENDENCIES): ScheduleDependency[] => {
  return dependencies.filter(dep => dep.predecessorId === activityId);
};

/**
 * Deterministic Forward Propagation Scenario Simulator
 * Does NOT mutate actual schedule or project state.
 */
export const runScenarioSimulation = (
  targetActivityId: string,
  delayDays: number,
  schedule: ScheduleActivity[],
  dependencies = DEMO_SCHEDULE_DEPENDENCIES
): ScenarioSimulationResult | null => {
  const target = schedule.find(a => a.activityId === targetActivityId);
  if (!target) return null;

  const validDelay = Math.max(0, Math.min(60, Number(delayDays) || 0));

  // 1. Calculate Target Activity Scenario Dates
  const targetDuration = calculateDuration(target.plannedStart, target.plannedFinish);
  const targetScenarioStart = target.plannedStart;
  const targetScenarioFinish = addDaysToDateString(target.plannedFinish, validDelay);

  // 2. Identify Upstream Predecessors
  const upstreamDeps = getPredecessors(targetActivityId, dependencies);

  // Map to hold simulated scenario dates for all activities
  const scenarioMap = new Map<string, { start: string; finish: string; shiftDays: number; incrementalShift: number }>();
  scenarioMap.set(targetActivityId, {
    start: targetScenarioStart,
    finish: targetScenarioFinish,
    shiftDays: validDelay,
    incrementalShift: validDelay,
  });

  const impactedList: ImpactedActivityScenario[] = [];

  // Add Target as first item in impacted list
  impactedList.push({
    activityId: target.activityId,
    activityName: target.activityName,
    discipline: target.discipline,
    area: target.area,
    wbs: target.wbs,
    baselineStart: target.plannedStart,
    baselineFinish: target.plannedFinish,
    durationDays: targetDuration,
    scenarioStart: targetScenarioStart,
    scenarioFinish: targetScenarioFinish,
    shiftDays: validDelay,
    incrementalShiftDays: validDelay,
    isDirectTarget: true,
    predecessorIds: upstreamDeps.map(d => d.predecessorId),
    severity: validDelay >= 5 ? 'critical' : validDelay >= 2 ? 'medium' : 'low',
    impactExplanation: `Direct simulation target subjected to an assumed ${validDelay}-day operational slip.`,
  });

  // 3. Breadth-first Forward Propagation through Downstream Dependency Graph
  const queue: string[] = [targetActivityId];
  const visited = new Set<string>();
  visited.add(targetActivityId);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentScenario = scenarioMap.get(currentId)!;
    const directSuccessors = getSuccessors(currentId, dependencies);

    for (const dep of directSuccessors) {
      const succActivity = schedule.find(a => a.activityId === dep.successorId);
      if (!succActivity) continue;

      const succDuration = calculateDuration(succActivity.plannedStart, succActivity.plannedFinish);

      // Finish-to-Start rule: Earliest successor start date is 1 day after predecessor scenario finish
      const requiredEarliestStart = addDaysToDateString(currentScenario.finish, 1 + (dep.lagDays || 0));

      let newScenarioStart = succActivity.plannedStart;
      let newScenarioFinish = succActivity.plannedFinish;
      let shiftDays = 0;

      // If predecessor finishes on or after successor's planned start date, successor is pushed
      if (diffDaysBetweenDates(requiredEarliestStart, succActivity.plannedStart) > 0) {
        newScenarioStart = requiredEarliestStart;
        newScenarioFinish = addDaysToDateString(newScenarioStart, succDuration - 1);
        shiftDays = diffDaysBetweenDates(newScenarioFinish, succActivity.plannedFinish);
      }

      const prevScenario = scenarioMap.get(succActivity.activityId);
      if (!prevScenario || shiftDays > prevScenario.shiftDays) {
        scenarioMap.set(succActivity.activityId, {
          start: newScenarioStart,
          finish: newScenarioFinish,
          shiftDays: Math.max(0, shiftDays),
          incrementalShift: Math.max(0, shiftDays),
        });

        // Update or insert into impactedList
        const existingIdx = impactedList.findIndex(i => i.activityId === succActivity.activityId);
        const succPredecessors = getPredecessors(succActivity.activityId, dependencies).map(d => d.predecessorId);
        
        const isCriticalMilestone =
          succActivity.activityId.includes('014') || // Hydrotest
          succActivity.activityId.includes('023') || // MCC Terminate
          succActivity.activityId.includes('031');   // Transmitter

        const severity: 'low' | 'medium' | 'critical' =
          shiftDays >= 5 || (shiftDays > 0 && isCriticalMilestone)
            ? 'critical'
            : shiftDays >= 2
            ? 'medium'
            : 'low';

        const item: ImpactedActivityScenario = {
          activityId: succActivity.activityId,
          activityName: succActivity.activityName,
          discipline: succActivity.discipline,
          area: succActivity.area,
          wbs: succActivity.wbs,
          baselineStart: succActivity.plannedStart,
          baselineFinish: succActivity.plannedFinish,
          durationDays: succDuration,
          scenarioStart: newScenarioStart,
          scenarioFinish: newScenarioFinish,
          shiftDays,
          incrementalShiftDays: shiftDays,
          isDirectTarget: false,
          predecessorIds: succPredecessors,
          severity,
          impactExplanation:
            shiftDays > 0
              ? `Shifted by +${shiftDays} days due to Finish-to-Start dependency on predecessor ${currentId}.`
              : `Buffered by schedule float: No forecast completion shift.`,
        };

        if (existingIdx >= 0) {
          impactedList[existingIdx] = item;
        } else {
          impactedList.push(item);
        }

        if (!visited.has(succActivity.activityId)) {
          visited.add(succActivity.activityId);
          queue.push(succActivity.activityId);
        }
      }
    }
  }

  // 4. Calculate Aggregate Metrics
  const downstreamImpacted = impactedList.filter(i => !i.isDirectTarget && i.shiftDays > 0);
  const maxShiftDays = impactedList.reduce((max, i) => Math.max(max, i.shiftDays), validDelay);
  const criticalMilestoneImpacted = impactedList.some(
    i => (i.activityId.includes('014') || i.activityId.includes('023') || i.activityId.includes('031')) && i.shiftDays > 0
  );

  const overallRiskLevel: 'low' | 'medium' | 'critical' =
    validDelay === 0
      ? 'low'
      : maxShiftDays >= 4 || criticalMilestoneImpacted
      ? 'critical'
      : maxShiftDays >= 2
      ? 'medium'
      : 'low';

  const executiveSummary = generateExecutiveSummary(
    target,
    validDelay,
    targetScenarioFinish,
    downstreamImpacted,
    maxShiftDays,
    overallRiskLevel
  );

  const upstreamActivities = upstreamDeps
    .map(dep => schedule.find(a => a.activityId === dep.predecessorId))
    .filter((a): a is ScheduleActivity => a !== undefined);

  return {
    targetActivityId,
    targetActivityName: target.activityName,
    targetDiscipline: target.discipline,
    targetArea: target.area,
    delayDays: validDelay,
    simulatedDelayDays: validDelay,
    targetBaselineFinish: target.plannedFinish,
    baselineStart: target.plannedStart,
    baselineFinish: target.plannedFinish,
    scenarioStart: targetScenarioStart,
    scenarioFinish: targetScenarioFinish,
    targetScenarioFinish,
    impactedActivities: impactedList,
    totalImpactedCount: downstreamImpacted.length,
    impactedCount: downstreamImpacted.length,
    maxShiftDays,
    criticalMilestoneImpacted,
    overallRiskLevel: overallRiskLevel === 'critical' ? 'High' : overallRiskLevel === 'medium' ? 'Medium' : 'Low',
    executiveSummary,
    executiveBriefing: executiveSummary,
    upstreamActivities,
  };
};

/**
 * Generates an executive narrative summary
 */
function generateExecutiveSummary(
  target: ScheduleActivity,
  delayDays: number,
  targetScenarioFinish: string,
  downstreamImpacted: ImpactedActivityScenario[],
  maxShiftDays: number,
  risk: 'low' | 'medium' | 'critical'
): string {
  if (delayDays === 0) {
    return `Simulation Status: Target activity ${target.activityId} (${target.activityName}) is evaluated with 0-day delay variance. All successor activities in ${target.area} remain aligned with the master baseline schedule.`;
  }

  let impactNarrative = '';
  if (downstreamImpacted.length === 0) {
    impactNarrative = 'No downstream successors are shifted due to available schedule float.';
  } else if (downstreamImpacted.length === 1) {
    const impactedNames = downstreamImpacted.map(i => `${i.activityId} (${i.activityName})`).join(', ');
    impactNarrative = `Direct successor ${impactedNames} is shifted by +${downstreamImpacted[0].shiftDays} days.`;
  } else {
    const impactedNames = downstreamImpacted.map(i => `${i.activityId} (${i.activityName})`).join(', ');
    impactNarrative = `${downstreamImpacted.length} downstream activities are shifted by up to +${maxShiftDays} days: ${impactedNames}.`;
  }

  let planningFocus = '';
  if (target.discipline === 'Civil') {
    planningFocus = `Expedite curing inspection and formwork stripping on ${target.area} to avoid halting mechanical line erection.`;
  } else if (target.discipline === 'Piping') {
    planningFocus = `Confirm NDT inspection team schedule and spool availability with the ${target.area} piping supervisor to explore double-shift recovery before the revised completion on ${targetScenarioFinish}.`;
  } else if (target.discipline === 'Electrical') {
    planningFocus = `Coordinate with cable pulling subcontractor to increase pull crew size in ${target.area} to compress successor durations.`;
  } else {
    planningFocus = `Re-evaluate milestone buffers and initiate schedule mitigation review in Planner Review Workbench.`;
  }

  return `Scenario Summary: An assumed +${delayDays}-day operational slip on ${target.activityId}, ${target.activityName}, shifts its forecast completion from ${target.plannedFinish} to ${targetScenarioFinish}. ${impactNarrative} Recommended Planner Action: ${planningFocus}`;
}
