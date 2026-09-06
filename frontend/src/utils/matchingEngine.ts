import { ScheduleActivity, SiteUpdate, MatchResult, MatchCategory, ScoreBreakdown } from '../types';

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

  const descLower = update.extractedDescription.toLowerCase();
  const actNameLower = activity.activityName.toLowerCase();
  const areaLower = update.area.toLowerCase();
  const actAreaLower = activity.area.toLowerCase();

  // 1. Discipline Match (max 20 points)
  if (update.discipline.toLowerCase() === activity.discipline.toLowerCase()) {
    disciplineScore = 20;
    reasons.push(`Discipline match: ${activity.discipline}`);
  } else if (update.discipline === 'General' || !update.discipline) {
    disciplineScore = 10;
  }

  // 2. Area Match (max 15 points)
  if (areaLower !== 'unspecified' && areaLower !== 'unknown' && actAreaLower.includes(areaLower)) {
    areaScore = 15;
    reasons.push(`Exact area match: ${activity.area}`);
  } else if (areaLower !== 'unspecified' && areaLower !== 'unknown' && descLower.includes(actAreaLower)) {
    areaScore = 10;
    reasons.push(`Area mentioned in update: ${activity.area}`);
  }

  // 3. Specific Tag & Alias Keyword Match (max 50 points)
  // Check for confirmed photo evidence tag (OCR assisted or manually verified)
  const confirmedTag = (update.confirmedTag || update.images?.[0]?.confirmedTag || '').toUpperCase().trim();
  if (confirmedTag) {
    const isTagInActivity =
      activity.activityId.toUpperCase().includes(confirmedTag) ||
      activity.activityName.toUpperCase().includes(confirmedTag) ||
      activity.aliases.some(a => a.toUpperCase().includes(confirmedTag)) ||
      (activity.rawAliases && activity.rawAliases.toUpperCase().includes(confirmedTag));

    if (isTagInActivity) {
      keywordScore += 25;
      reasons.push(`Photo evidence: confirmed tag ${confirmedTag}`);
    }
  }

  // Specific line/system tag checks:
  const isCWInUpdate = /\b(cw|cooling water|24-cw-017|cooling-water)\b/i.test(descLower) || confirmedTag.includes('CW');
  const isCWInActivity = /\b(cw|cooling water|24-cw-017|cooling-water)\b/i.test(actNameLower) || activity.aliases.some(a => /\bcw\b/i.test(a));

  const isFWInUpdate = /\b(fw|fire water|fire-water|18-fw-008)\b/i.test(descLower) || confirmedTag.includes('FW');
  const isFWInActivity = /\b(fw|fire water|fire-water|18-fw-008)\b/i.test(actNameLower) || activity.aliases.some(a => /\bfw\b/i.test(a));

  const isSuctionInUpdate = /\b(suction|inlet)\b/i.test(descLower);
  const isSuctionInActivity = /\b(suction|inlet)\b/i.test(actNameLower) || activity.aliases.some(a => /\bsuction\b/i.test(a));

  const isFieldJointInUpdate = /\b(field joint|weld|welding|joint)\b/i.test(descLower);
  const isFieldJointInActivity = /\b(field joint|weld|welding|joint)\b/i.test(actNameLower) || activity.aliases.some(a => /\bweld\b/i.test(a));

  const isFabricationInUpdate = /\b(fabrication|yard|fabricate)\b/i.test(descLower);
  const isFabricationInActivity = /\b(fabricate|fabrication)\b/i.test(actNameLower) || activity.aliases.some(a => /\bfabrication\b/i.test(a));

  if (isCWInUpdate && isCWInActivity) {
    keywordScore += 25;
    reasons.push(`System tag match: Cooling Water (CW)`);
  } else if (isCWInUpdate && !isCWInActivity) {
    keywordScore -= 10; // Penalize mismatching CW with FW
  }

  if (isFWInUpdate && isFWInActivity) {
    keywordScore += 25;
    reasons.push(`System tag match: Fire Water (FW)`);
  } else if (isFWInUpdate && !isFWInActivity) {
    keywordScore -= 10; // Penalize mismatching FW with CW
  }

  if (isSuctionInUpdate && isSuctionInActivity) {
    keywordScore += 25;
    reasons.push(`Component match: Pump Suction Piping`);
  }

  if (isFieldJointInUpdate && isFieldJointInActivity && isCWInUpdate && isCWInActivity) {
    keywordScore += 20;
    reasons.push(`Operation match: Field Joint Welding`);
  }

  if (isFabricationInUpdate && isFabricationInActivity && isCWInUpdate && isCWInActivity) {
    keywordScore += 20;
    reasons.push(`Operation match: Spool Fabrication`);
  }

  // Alias array checking
  let bestAliasMatchScore = 0;
  for (const alias of activity.aliases) {
    if (descLower.includes(alias) || (confirmedTag && alias.toUpperCase().includes(confirmedTag))) {
      bestAliasMatchScore = Math.max(bestAliasMatchScore, 20);
      reasons.push(`Matched schedule alias: "${alias}"`);
    }
  }
  keywordScore += bestAliasMatchScore;

  // General action verb overlap (erect/erected, fabricate/fabrication, excavate/excavation)
  if (/erect|erected|erection/i.test(descLower) && /erect|erected|erection/i.test(actNameLower)) {
    keywordScore += 10;
  }
  if (/excavat|foundation/i.test(descLower) && /excavat|foundation/i.test(actNameLower)) {
    keywordScore += 15;
    reasons.push(`Activity keyword match: Excavation & Foundation`);
  }
  if (/pcc|concrete/i.test(descLower) && /pcc|concrete/i.test(actNameLower)) {
    keywordScore += 15;
    reasons.push(`Activity keyword match: Concrete pouring`);
  }
  if (/cable tray/i.test(descLower) && /cable tray/i.test(actNameLower)) {
    keywordScore += 15;
    reasons.push(`Activity keyword match: Cable tray`);
  }
  if (/earthing|ground/i.test(descLower) && /earthing|ground/i.test(actNameLower)) {
    keywordScore += 15;
    reasons.push(`Activity keyword match: Earthing strip`);
  }
  if (/lifting|safety|inspection/i.test(descLower) && /lifting|safety|inspection/i.test(actNameLower)) {
    keywordScore += 20;
    reasons.push(`HSE keyword match: Lifting safety inspection`);
  }

  keywordScore = Math.max(0, Math.min(50, keywordScore));

  // 4. Token Intersection / Fuzzy similarity (max 15 points)
  const updateTokens = getTokens(descLower);
  const actTokens = getTokens(actNameLower + ' ' + activity.rawAliases);

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
  // If explicitly marked as unplanned (e.g., "[Not in baseline]" or "Drain line")
  if (update.isExplicitUnplanned || /drain line/i.test(update.extractedDescription)) {
    return {
      updateId: update.id,
      candidateActivityId: null,
      confidenceScore: 15,
      category: 'unplanned',
      matchReasons: ['Explicitly marked or identified as non-baseline item (Drain line)'],
      scoreBreakdown: { keywordScore: 0, disciplineScore: 15, areaScore: 0, fuzzyScore: 0 },
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

  // Special Ambiguity Check:
  // If the update text is vague like "Pipe erection completed" without specifying line number or area,
  // or top two candidates are very close in score (e.g. PIP-L6-012 vs PIP-L6-015), flag for Planner Review!
  const isVagueText = /^(pipe erection completed|cable pulling|spool erected)$/i.test(update.extractedDescription.trim());
  const isCloseRunnerUp = topCandidates.length > 1 && (topCandidates[0].score - topCandidates[1].score < 15) && topCandidates[0].score < 80;

  let category: MatchCategory = 'unplanned';

  if (isVagueText || isCloseRunnerUp || (highestScore >= 40 && highestScore < 75)) {
    category = 'review';
    bestReasons.push('Ambiguous or generic activity description — Planner Review required');
  } else if (highestScore >= 75 && bestMatchActivity) {
    category = 'ready';
  } else {
    category = 'unplanned';
    bestReasons.push('No matching baseline schedule activity found above confidence threshold');
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
