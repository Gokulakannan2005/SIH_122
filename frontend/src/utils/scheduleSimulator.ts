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

// Helper Date Functions (Pure & deterministic)
export const addDaysToDateString = (dateStr: string, days: number): string => {
  if (!dateStr) return dateStr;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
};

export const diffDaysBetweenDates = (dateStrLater: string, dateStrEarlier: string): number => {
  if (!dateStrLater || !dateStrEarlier) return 0;
  const p1 = dateStrLater.split('-').map(Number);
  const p2 = dateStrEarlier.split('-').map(Number);
  const d1 = new Date(Date.UTC(p1[0], p1[1] - 1, p1[2]));
  const d2 = new Date(Date.UTC(p2[0], p2[1] - 1, p2[2]));
  const diffMs = d1.getTime() - d2.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

export const calculateDuration = (startStr: string, finishStr: string): number => {
  const diff = diffDaysBetweenDates(finishStr, startStr);
  return Math.max(1, diff + 1);
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
  const upstreamActivities = upstreamDeps
    .map(dep => schedule.find(a => a.activityId === dep.predecessorId))
    .filter((a): a is ScheduleActivity => a !== undefined);

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

        const impactedObj: ImpactedActivityScenario = {
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
          impactExplanation: `${dep.description} Forecast start pushed from ${succActivity.plannedStart} to ${newScenarioStart}.`,
        };

        if (existingIdx >= 0) {
          impactedList[existingIdx] = impactedObj;
        } else {
          impactedList.push(impactedObj);
        }
      }

      if (!visited.has(succActivity.activityId)) {
        visited.add(succActivity.activityId);
        queue.push(succActivity.activityId);
      }
    }
  }

  // 4. Calculate Risk Metrics
  const downstreamImpacted = impactedList.filter(i => !i.isDirectTarget && i.shiftDays > 0);
  const maxShiftDays = impactedList.reduce((max, i) => Math.max(max, i.shiftDays), validDelay);
  const criticalMilestoneImpacted = impactedList.some(
    i => (i.activityId.includes('014') || i.activityId.includes('023') || i.activityId.includes('031')) && i.shiftDays > 0
  );

  const overallRiskLevel: 'Low' | 'Medium' | 'High' =
    validDelay === 0
      ? 'Low'
      : maxShiftDays >= 4 || criticalMilestoneImpacted
      ? 'High'
      : maxShiftDays >= 2
      ? 'Medium'
      : 'Low';

  // 5. Generate Grounded Executive Briefing
  const briefing = generateExecutiveBriefing({
    target,
    delayDays: validDelay,
    targetScenarioFinish,
    downstreamImpacted,
    maxShiftDays,
    overallRiskLevel,
    criticalMilestoneImpacted,
  });

  return {
    targetActivityId: target.activityId,
    targetActivityName: target.activityName,
    targetDiscipline: target.discipline,
    targetArea: target.area,
    simulatedDelayDays: validDelay,
    baselineStart: target.plannedStart,
    baselineFinish: target.plannedFinish,
    scenarioStart: targetScenarioStart,
    scenarioFinish: targetScenarioFinish,
    maxShiftDays,
    impactedCount: downstreamImpacted.length,
    criticalMilestoneImpacted,
    overallRiskLevel,
    impactedActivities: impactedList,
    upstreamActivities,
    executiveBriefing: briefing,
  };
};

/**
 * Generate factual, data-grounded Plain-English Executive Briefing
 */
const generateExecutiveBriefing = (params: {
  target: ScheduleActivity;
  delayDays: number;
  targetScenarioFinish: string;
  downstreamImpacted: ImpactedActivityScenario[];
  maxShiftDays: number;
  overallRiskLevel: 'Low' | 'Medium' | 'High';
  criticalMilestoneImpacted: boolean;
}): string => {
  const {
    target,
    delayDays,
    targetScenarioFinish,
    downstreamImpacted,
    maxShiftDays,
    overallRiskLevel,
    criticalMilestoneImpacted,
  } = params;

  if (delayDays === 0) {
    return `Scenario Summary: Baseline execution scenario for ${target.activityId} (${target.activityName}). All forecast dates align with planned completion on ${target.plannedFinish}. Zero downstream variance detected.`;
  }

  const impactedNames = downstreamImpacted.map(i => `${i.activityId} (${i.activityName})`).join(', ');

  let impactNarrative = '';
  if (downstreamImpacted.length === 0) {
    impactNarrative = 'No direct downstream schedule successors are impacted within this package window.';
  } else if (downstreamImpacted.length === 1) {
    impactNarrative = `Direct successor ${impactedNames} is shifted by +${downstreamImpacted[0].shiftDays} days.`;
  } else {
    impactNarrative = `${downstreamImpacted.length} downstream activities are shifted by up to +${maxShiftDays} days: ${impactedNames}.`;
  }

  if (criticalMilestoneImpacted) {
    impactNarrative += ` Critical commissioning and pressure testing milestones in ${target.area} are now at elevated risk.`;
  }

  // Recommended planning prompts
  let planningFocus = '';
  if (target.discipline === 'Piping') {
    planningFocus = `Confirm NDT inspection team schedule and spool availability with the ${target.area} piping supervisor to explore double-shift recovery before the revised completion on ${targetScenarioFinish}.`;
  } else if (target.discipline === 'Civil') {
    planningFocus = `Review shuttering and rapid-curing mix options with the civil contractor to minimize downstream mechanical handover delays in ${target.area}.`;
  } else if (target.discipline === 'Electrical') {
    planningFocus = `Coordinate cable pulling gang allocations with the electrical lead planner to accelerate feeder pulls once tray installation completes.`;
  } else {
    planningFocus = `Review subcontractor resource leveling and permit approvals for ${target.area} to recover the ${delayDays}-day delta before milestone freeze.`;
  }

  return `Scenario Summary: An assumed +${delayDays}-day operational slip on ${target.activityId}, ${target.activityName}, shifts its forecast completion from ${target.plannedFinish} to ${targetScenarioFinish}.

Cascade Impact: ${impactNarrative} Resulting package risk level is ${overallRiskLevel}.

Recommended Planning Focus: ${planningFocus}`;
};
