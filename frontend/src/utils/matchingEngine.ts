import type { ScheduleActivity, SiteUpdate, MatchResult, MatchCategory, ScoreBreakdown } from '../types/index.ts';

/**
 * Tokenize and normalize text for keyword matching
 */
function getTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !['and', 'the', 'for', 'was', 'were', 'near', 'with', 'at', 'in', 'on', 'of', 'today', 'is'].includes(t))
  );
}

/**
 * Infer true discipline from text if update.discipline is mismatched or generic
 */
export function inferDisciplineFromText(text: string, fallbackDiscipline: string = 'Piping'): string {
  const lower = text.toLowerCase();
  if (/excavat|curing|concrete|pour|foundat|grout|rebar|civil|slab|footing|ring wall|tank pad|backfill/i.test(lower)) {
    return 'Civil';
  }
  if (/cable|transformer|switchgear|conduit|substation|electr|breaker|motor|feeder|busbar|ht|lt/i.test(lower)) {
    return 'Electrical';
  }
  if (/sensor|transmitter|plc|scada|dcs|instrument|loop|calibration|pt-|lt-|tt-|gauge/i.test(lower)) {
    return 'Instrumentation';
  }
  if (/safety|scaffold|harness|hazard|permit|hse|spill|incident|loto/i.test(lower)) {
    return 'HSE';
  }
  if (/pipe|spool|flange|hydro|weld|valve|piping|tie-in|isometrics|cw|fw|header/i.test(lower)) {
    return 'Piping';
  }
  return fallbackDiscipline;
}

/**
 * Calculate similarity & matching confidence between a SiteUpdate and a ScheduleActivity
 */
export function evaluateMatch(
  update: SiteUpdate,
  activity: ScheduleActivity
): { score: number; scoreBreakdown: ScoreBreakdown; reasons: string[] } {
  let keywordScore = 0;
  let disciplineScore = 0;
  let areaScore = 0;
  let fuzzyScore = 0;
  const reasons: string[] = [];

  const descLower = (update.extractedDescription || update.rawText || '').toLowerCase();
  const actNameLower = activity.activityName.toLowerCase();
  const actAreaLower = activity.area.toLowerCase();

  // Inferred discipline accounts for user input typos or mismatches
  const inferredDiscipline = inferDisciplineFromText(descLower, update.discipline);

  // 1. Discipline Match (max 20 points)
  if (inferredDiscipline.toLowerCase() === activity.discipline.toLowerCase()) {
    disciplineScore = 20;
    reasons.push(`Discipline match: ${activity.discipline}`);
  } else if (update.discipline && update.discipline.toLowerCase() === activity.discipline.toLowerCase()) {
    disciplineScore = 20;
    reasons.push(`Discipline match: ${activity.discipline}`);
  }

  // 2. Area Match (max 15 points)
  const areaKeywords: Record<string, RegExp> = {
    'pump bay': /\b(pump bay|unit-01|main pump)\b/i,
    'pipe rack': /\b(pipe rack|utility corridor|tier-2|unit-02)\b/i,
    'tank farm': /\b(tank farm|storage tank|ring wall|tank pad|crude storage|unit-05)\b/i,
    'substation': /\b(substation|switchgear room|transformer yard|unit-04)\b/i,
    'fabrication yard': /\b(fabrication yard|fab yard|yard bay|weld bay)\b/i,
  };

  let matchedArea = false;
  for (const [areaKey, regex] of Object.entries(areaKeywords)) {
    if (regex.test(descLower) && actAreaLower.includes(areaKey)) {
      areaScore = 15;
      matchedArea = true;
      reasons.push(`Exact area match: ${activity.area}`);
      break;
    }
  }

  if (!matchedArea) {
    const areaLower = (update.area || '').toLowerCase();
    if (areaLower && areaLower !== 'unspecified' && areaLower !== 'unknown') {
      if (actAreaLower.includes(areaLower) || areaLower.includes(actAreaLower)) {
        areaScore = 15;
        reasons.push(`Exact area match: ${activity.area}`);
      } else if (descLower.includes(actAreaLower)) {
        areaScore = 10;
        reasons.push(`Area mentioned in update: ${activity.area}`);
      }
    }
  }

  // 3. Specific Tag & Keyword Match (max 50 points)
  const confirmedTag = (update.confirmedTag || update.images?.[0]?.confirmedTag || '').toUpperCase().trim();
  if (confirmedTag) {
    const isTagInActivity =
      activity.activityId.toUpperCase().includes(confirmedTag) ||
      activity.activityName.toUpperCase().includes(confirmedTag) ||
      activity.aliases.some(a => a.toUpperCase().includes(confirmedTag)) ||
      (activity.rawAliases && activity.rawAliases.toUpperCase().includes(confirmedTag));

    if (isTagInActivity) {
      keywordScore += 30;
      reasons.push(`Photo/Tag evidence: confirmed tag ${confirmedTag}`);
    }
  }

  // A. Piping Tag Checks (24-CW-017, 18-FW-008, etc.)
  const isCWInUpdate = /\b(24-cw-017|cooling water|24-cw|cw-017|cooling-water)\b/i.test(descLower) || confirmedTag.includes('CW');
  const isCWInActivity = /\b(24-cw-017|cooling water|cw|cooling-water)\b/i.test(actNameLower) || activity.aliases.some(a => /\bcw\b/i.test(a));

  const isFWInUpdate = /\b(18-fw-008|fire water|18-fw|fw-008|fire-water)\b/i.test(descLower) || confirmedTag.includes('FW');
  const isFWInActivity = /\b(18-fw-008|fire water|fw|fire-water)\b/i.test(actNameLower) || activity.aliases.some(a => /\bfw\b/i.test(a));

  if (isCWInUpdate && isCWInActivity) {
    keywordScore += 30;
    reasons.push(`System tag match: Cooling Water (24-CW-017)`);
  }
  if (isFWInUpdate && isFWInActivity) {
    keywordScore += 30;
    reasons.push(`System tag match: Fire Water (18-FW-008)`);
  }

  // Piping specific operations
  if (/\b(erect|erected|erection|placement|align|alignment)\b/i.test(descLower) && /\b(erect|erection|alignment)\b/i.test(actNameLower)) {
    keywordScore += 15;
    reasons.push(`Operation match: Spool Erection & Alignment`);
  }
  if (/\b(weld|welding|joint|ndt|radiography)\b/i.test(descLower) && /\b(weld|joint|ndt)\b/i.test(actNameLower)) {
    keywordScore += 15;
    reasons.push(`Operation match: Field Joint Welding & NDT`);
  }
  if (/\b(fabricat|fabrication|beveling|yard)\b/i.test(descLower) && /\b(fabricat|yard)\b/i.test(actNameLower)) {
    keywordScore += 15;
    reasons.push(`Operation match: Yard Spool Fabrication`);
  }
  if (/\b(pipe rack|tier-2|tie-in|tie in)\b/i.test(descLower) && /\b(pipe rack|tier-2|tie-in)\b/i.test(actNameLower)) {
    keywordScore += 25;
    reasons.push(`Operation match: Modular Pipe Rack Tie-ins`);
  }

  // B. Civil Tag & Component Checks (Crude Storage, Ring Wall, Pump Foundation, Plinths)
  const isTankRingInUpdate = /\b(crude storage|ring wall|tank pad|tank foundation|storage tank|tk-01)\b/i.test(descLower);
  const isTankRingInActivity = /\b(crude storage|ring wall|tank pad|tank foundation|storage tank|tk-01)\b/i.test(actNameLower);
  if (isTankRingInUpdate && isTankRingInActivity) {
    keywordScore += 35;
    reasons.push(`Component match: Crude Storage Tank Ring Wall`);
  }

  const isPumpFdnInUpdate = /\b(pump foundation|pump plinth|pump bay foundation|pit excavation)\b/i.test(descLower);
  const isPumpFdnInActivity = /\b(pump foundation|pump plinth|pump bay foundation|pit excavation)\b/i.test(actNameLower);
  if (isPumpFdnInUpdate && isPumpFdnInActivity) {
    keywordScore += 30;
    reasons.push(`Component match: Main Pump Foundation`);
  }

  if (/\b(excavat|excavation|earthwork|digging|soil cut)\b/i.test(descLower) && /\b(excavat|earthwork)\b/i.test(actNameLower)) {
    keywordScore += 15;
    reasons.push(`Activity keyword match: Excavation & Earthwork`);
  }
  if (/\b(concrete|plinths|curing|grout|cast|pour)\b/i.test(descLower) && /\b(concrete|plinths|curing|grout|cast)\b/i.test(actNameLower)) {
    keywordScore += 15;
    reasons.push(`Activity keyword match: Concrete Plinth Casting`);
  }

  // C. Electrical Checks (Switchgear, Cable Tray, Transformer, Crane Lift)
  const isSwitchgearInUpdate = /\b(switchgear|415v|mcc-415v|feeder|cable tray)\b/i.test(descLower);
  const isSwitchgearInActivity = /\b(switchgear|415v|mcc-415v|feeder|cable tray)\b/i.test(actNameLower);
  if (isSwitchgearInUpdate && isSwitchgearInActivity) {
    keywordScore += 35;
    reasons.push(`System match: 415V Switchgear Feeder Tray`);
  }

  const isTransformerInUpdate = /\b(transformer|substation heavy lift|busbar|trf-01|50t-crane)\b/i.test(descLower);
  const isTransformerInActivity = /\b(transformer|substation heavy lift|busbar|trf-01|50t-crane)\b/i.test(actNameLower);
  if (isTransformerInUpdate && isTransformerInActivity) {
    keywordScore += 35;
    reasons.push(`System match: Substation Transformer Heavy Lift`);
  }

  // D. Instrumentation Checks (Transmitters, Calibration)
  const isTransmitterInUpdate = /\b(pressure transmitter|pt-101a|calibrate|calibration|impulse line)\b/i.test(descLower);
  const isTransmitterInActivity = /\b(pressure transmitter|pt-101a|calibrate|calibration|impulse line)\b/i.test(actNameLower);
  if (isTransmitterInUpdate && isTransmitterInActivity) {
    keywordScore += 35;
    reasons.push(`System match: Pressure Transmitter PT-101A Calibration`);
  }

  // E. HSE Checks
  if (/\b(safety|scaffold|scaffolding|green tag|audit|lifting permit)\b/i.test(descLower) && activity.discipline === 'HSE') {
    keywordScore += 35;
    reasons.push(`HSE Protocol match: Safety Audit & Inspection`);
  }

  // Alias array checking
  let bestAliasMatchScore = 0;
  for (const alias of activity.aliases) {
    if (descLower.includes(alias.toLowerCase())) {
      bestAliasMatchScore = Math.max(bestAliasMatchScore, 20);
      reasons.push(`Matched schedule alias: "${alias}"`);
    }
  }
  keywordScore += bestAliasMatchScore;

  keywordScore = Math.max(0, Math.min(50, keywordScore));

  // 4. Token Intersection / Fuzzy similarity (max 15 points)
  const updateTokens = getTokens(descLower);
  const actTokens = getTokens(actNameLower + ' ' + (activity.rawAliases || ''));

  let matchCount = 0;
  updateTokens.forEach(t => {
    if (actTokens.has(t)) matchCount++;
  });

  if (updateTokens.size > 0) {
    const ratio = matchCount / updateTokens.size;
    fuzzyScore = Math.round(ratio * 15);
  }

  const totalScore = Math.min(100, Math.max(0, disciplineScore + areaScore + keywordScore + fuzzyScore));

  return {
    score: totalScore,
    scoreBreakdown: {
      keywordScore,
      disciplineScore,
      areaScore,
      fuzzyScore,
    },
    reasons: Array.from(new Set(reasons)),
  };
}

/**
 * Match a single site update against all baseline activities
 */
export function matchUpdateToSchedule(
  update: SiteUpdate,
  schedule: ScheduleActivity[]
): MatchResult {
  const descLower = (update.extractedDescription || update.rawText || '').toLowerCase();

  // Out-of-baseline / Unplanned detection
  const isExplicitUnplanned =
    update.isExplicitUnplanned ||
    /\b(drain line|small-bore|small bore|bypass line|temporary jumper|not in baseline|unauthorized|unplanned)\b/i.test(descLower);

  if (isExplicitUnplanned) {
    return {
      updateId: update.id,
      candidateActivityId: null,
      confidenceScore: 12,
      category: 'unplanned',
      matchReasons: [
        'No matching baseline activity identified in approved Primavera master schedule',
        'Identified scope: Small-bore drain tie-in bypass (Out-of-Baseline work)',
        'Flagged for commercial contract claim & variation order control',
      ],
      scoreBreakdown: { keywordScore: 0, disciplineScore: 12, areaScore: 0, fuzzyScore: 0 },
      suggestedActivities: [],
    };
  }

  let bestMatchActivity: ScheduleActivity | null = null;
  let highestScore = 0;
  let bestBreakdown: ScoreBreakdown = { keywordScore: 0, disciplineScore: 0, areaScore: 0, fuzzyScore: 0 };
  let bestReasons: string[] = [];

  const candidatesWithScores: { activity: ScheduleActivity; score: number; reasons: string[] }[] = [];

  for (const activity of schedule) {
    const evalRes = evaluateMatch(update, activity);
    candidatesWithScores.push({
      activity,
      score: evalRes.score,
      reasons: evalRes.reasons,
    });

    if (evalRes.score > highestScore) {
      highestScore = evalRes.score;
      bestMatchActivity = activity;
      bestBreakdown = evalRes.scoreBreakdown;
      bestReasons = evalRes.reasons;
    }
  }

  // Sort candidates by score descending
  candidatesWithScores.sort((a, b) => b.score - a.score);
  const topCandidates = candidatesWithScores.slice(0, 3);

  // Ambiguity Check:
  // e.g. "Pipe erection completed near pump bay" without specific line tag (24-CW-017 vs 18-FW-008)
  const isMissingSpecificTag =
    /\b(pipe erection|spool erected|cable pulling|flange bolts)\b/i.test(descLower) &&
    !/\b(24-cw-017|18-fw-008|415v|pt-101a|tk-01|crude storage)\b/i.test(descLower);

  const isCloseRunnerUp =
    topCandidates.length > 1 &&
    topCandidates[0].score - topCandidates[1].score < 15 &&
    topCandidates[0].score < 80;

  let category: MatchCategory = 'unplanned';

  if (highestScore < 40) {
    category = 'unplanned';
    bestReasons.push('Low matching confidence (< 40%) — automatically categorized as Unplanned / Out-of-Baseline activity');
  } else if (isMissingSpecificTag || isCloseRunnerUp || (highestScore >= 40 && highestScore < 75)) {
    category = 'review';
    bestReasons.push('Ambiguous or generic activity description — Missing specific equipment tag — Lead Planner verification required');
    if (highestScore > 65) highestScore = 58; // Realistic ambiguous confidence
  } else if (highestScore >= 75 && bestMatchActivity) {
    category = 'ready';
  } else {
    category = 'unplanned';
    bestReasons.push('No matching baseline schedule activity found above operating confidence threshold');
  }

  return {
    updateId: update.id,
    candidateActivityId: bestMatchActivity ? bestMatchActivity.activityId : null,
    confidenceScore: highestScore,
    category,
    matchReasons: bestReasons.length > 0 ? bestReasons : ['Default score evaluation'],
    scoreBreakdown: bestBreakdown,
    suggestedActivities: topCandidates,
  };
}

/**
 * Match batch of site updates against baseline schedule
 */
export function processAllMatches(
  updates: SiteUpdate[],
  schedule: ScheduleActivity[]
): Map<string, MatchResult> {
  const resultMap = new Map<string, MatchResult>();
  for (const update of updates) {
    const res = matchUpdateToSchedule(update, schedule);
    resultMap.set(update.id, res);
  }
  return resultMap;
}
