import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ScheduleActivity, SiteUpdate } from './parsers.ts';
import { parseScheduleCSV, parseDailyReportTXT, parsePipingProgressXLSX } from './parsers.ts';
import type { MatchResult } from './matchingEngine.ts';
import { processAllMatches } from './matchingEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file in backend folder
const dbPath = path.resolve(__dirname, '../database.sqlite');
export const db = new DatabaseSync(dbPath);

export interface PlannerDecision {
  updateId: string;
  linkedActivityId: string | null;
  status: 'approved' | 'modified' | 'unplanned' | 'rejected';
  actionType: 'approve' | 'relink' | 'mark_unplanned' | 'reject' | 'edit_update';
  plannerNote?: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  updateId: string;
  rawText: string;
  sourceFile: string;
  action: string;
  originalConfidence: number;
  originalCategory: string;
  finalActivityId: string | null;
  plannerNote?: string;
}

/**
 * Initialize SQLite schema
 */
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedule_activities (
      activity_id TEXT PRIMARY KEY,
      wbs TEXT,
      activity_name TEXT,
      discipline TEXT,
      planned_start TEXT,
      planned_finish TEXT,
      area TEXT,
      aliases TEXT,
      raw_aliases TEXT
    );

    CREATE TABLE IF NOT EXISTS site_updates (
      id TEXT PRIMARY KEY,
      source_file TEXT,
      source_type TEXT,
      entry_id TEXT,
      discipline TEXT,
      report_date TEXT,
      raw_text TEXT,
      extracted_description TEXT,
      event_status TEXT,
      area TEXT,
      quantity TEXT,
      unit TEXT,
      supervisor TEXT,
      line_evidence TEXT,
      is_explicit_unplanned INTEGER
    );

    CREATE TABLE IF NOT EXISTS match_results (
      update_id TEXT PRIMARY KEY,
      candidate_activity_id TEXT,
      confidence_score REAL,
      category TEXT,
      match_reasons TEXT,
      score_breakdown TEXT,
      suggested_activities TEXT
    );

    CREATE TABLE IF NOT EXISTS planner_decisions (
      update_id TEXT PRIMARY KEY,
      linked_activity_id TEXT,
      status TEXT,
      action_type TEXT,
      planner_note TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      update_id TEXT,
      raw_text TEXT,
      source_file TEXT,
      action TEXT,
      original_confidence REAL,
      original_category TEXT,
      final_activity_id TEXT,
      planner_note TEXT
    );
  `);
}

/**
 * Get all baseline schedule activities
 */
export function getScheduleActivities(): ScheduleActivity[] {
  const stmt = db.prepare('SELECT * FROM schedule_activities ORDER BY wbs ASC');
  const rows = stmt.all() as any[];
  return rows.map(r => ({
    activityId: r.activity_id,
    wbs: r.wbs,
    activityName: r.activity_name,
    discipline: r.discipline,
    plannedStart: r.planned_start,
    plannedFinish: r.planned_finish,
    area: r.area,
    aliases: JSON.parse(r.aliases || '[]'),
    rawAliases: r.raw_aliases,
  }));
}

/**
 * Save schedule activities
 */
export function saveScheduleActivities(activities: ScheduleActivity[]) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO schedule_activities 
    (activity_id, wbs, activity_name, discipline, planned_start, planned_finish, area, aliases, raw_aliases)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const act of activities) {
    insert.run(
      act.activityId,
      act.wbs,
      act.activityName,
      act.discipline,
      act.plannedStart,
      act.plannedFinish,
      act.area,
      JSON.stringify(act.aliases || []),
      act.rawAliases || ''
    );
  }
}

/**
 * Get all site updates
 */
export function getSiteUpdates(): SiteUpdate[] {
  const stmt = db.prepare('SELECT * FROM site_updates ORDER BY report_date DESC');
  const rows = stmt.all() as any[];
  return rows.map(r => ({
    id: r.id,
    sourceFile: r.source_file,
    sourceType: r.source_type as any,
    entryId: r.entry_id,
    discipline: r.discipline,
    reportDate: r.report_date,
    rawText: r.raw_text,
    extractedDescription: r.extracted_description,
    eventStatus: r.event_status as any,
    area: r.area,
    quantity: r.quantity,
    unit: r.unit,
    supervisor: r.supervisor,
    lineEvidence: r.line_evidence,
    isExplicitUnplanned: Boolean(r.is_explicit_unplanned),
  }));
}

/**
 * Save site updates
 */
export function saveSiteUpdates(updates: SiteUpdate[]) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO site_updates 
    (id, source_file, source_type, entry_id, discipline, report_date, raw_text, extracted_description, event_status, area, quantity, unit, supervisor, line_evidence, is_explicit_unplanned)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of updates) {
    insert.run(
      u.id,
      u.sourceFile,
      u.sourceType,
      u.entryId || null,
      u.discipline,
      u.reportDate,
      u.rawText,
      u.extractedDescription,
      u.eventStatus,
      u.area,
      u.quantity !== undefined ? String(u.quantity) : null,
      u.unit || null,
      u.supervisor || null,
      u.lineEvidence ? String(u.lineEvidence) : null,
      u.isExplicitUnplanned ? 1 : 0
    );
  }
}

/**
 * Update single site update parameters
 */
export function updateSiteUpdate(id: string, fields: Partial<SiteUpdate>) {
  const existing = getSiteUpdates().find(u => u.id === id);
  if (!existing) return null;

  const merged = { ...existing, ...fields };
  saveSiteUpdates([merged]);

  // Recalculate match for this item
  const schedule = getScheduleActivities();
  const matchesMap = processAllMatches([merged], schedule);
  const newMatch = matchesMap.get(id);
  if (newMatch) {
    saveMatchResults({ [id]: newMatch });
  }

  return merged;
}

/**
 * Get match results
 */
export function getMatchResults(): Record<string, MatchResult> {
  const stmt = db.prepare('SELECT * FROM match_results');
  const rows = stmt.all() as any[];
  const result: Record<string, MatchResult> = {};
  for (const r of rows) {
    result[r.update_id] = {
      updateId: r.update_id,
      candidateActivityId: r.candidate_activity_id || null,
      confidenceScore: r.confidence_score,
      category: r.category as any,
      matchReasons: JSON.parse(r.match_reasons || '[]'),
      scoreBreakdown: JSON.parse(r.score_breakdown || '{}'),
      suggestedActivities: JSON.parse(r.suggested_activities || '[]'),
    };
  }
  return result;
}

/**
 * Save match results
 */
export function saveMatchResults(matches: Record<string, MatchResult>) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO match_results 
    (update_id, candidate_activity_id, confidence_score, category, match_reasons, score_breakdown, suggested_activities)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const [updateId, m] of Object.entries(matches)) {
    insert.run(
      updateId,
      m.candidateActivityId || null,
      m.confidenceScore,
      m.category,
      JSON.stringify(m.matchReasons || []),
      JSON.stringify(m.scoreBreakdown || {}),
      JSON.stringify(m.suggestedActivities || [])
    );
  }
}

/**
 * Get planner decisions
 */
export function getPlannerDecisions(): Record<string, PlannerDecision> {
  const stmt = db.prepare('SELECT * FROM planner_decisions');
  const rows = stmt.all() as any[];
  const result: Record<string, PlannerDecision> = {};
  for (const r of rows) {
    result[r.update_id] = {
      updateId: r.update_id,
      linkedActivityId: r.linked_activity_id || null,
      status: r.status as any,
      actionType: r.action_type as any,
      plannerNote: r.planner_note || '',
      updatedAt: r.updated_at,
    };
  }
  return result;
}

/**
 * Save planner decision
 */
export function savePlannerDecision(decision: PlannerDecision) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO planner_decisions 
    (update_id, linked_activity_id, status, action_type, planner_note, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    decision.updateId,
    decision.linkedActivityId || null,
    decision.status,
    decision.actionType,
    decision.plannerNote || '',
    decision.updatedAt
  );
}

/**
 * Get audit logs
 */
export function getAuditLogs(): AuditLog[] {
  const stmt = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC');
  const rows = stmt.all() as any[];
  return rows.map(r => ({
    id: r.id,
    timestamp: r.timestamp,
    updateId: r.update_id,
    rawText: r.raw_text,
    sourceFile: r.source_file,
    action: r.action,
    originalConfidence: r.original_confidence,
    originalCategory: r.original_category,
    finalActivityId: r.final_activity_id || null,
    plannerNote: r.planner_note || '',
  }));
}

/**
 * Save audit log
 */
export function saveAuditLog(log: AuditLog) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO audit_logs 
    (id, timestamp, update_id, raw_text, source_file, action, original_confidence, original_category, final_activity_id, planner_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    log.id,
    log.timestamp,
    log.updateId,
    log.rawText,
    log.sourceFile,
    log.action,
    log.originalConfidence,
    log.originalCategory,
    log.finalActivityId || null,
    log.plannerNote || ''
  );
}

/**
 * Get enriched schedule with actual dates, progress percentage, and delay variance
 */
export function getEnrichedSchedule(): ScheduleActivity[] {
  const schedule = getScheduleActivities();
  const siteUpdates = getSiteUpdates();
  const plannerDecisions = getPlannerDecisions();
  const matchResults = getMatchResults();

  let maxDate = '2026-09-05';
  siteUpdates.forEach(u => {
    if (u.reportDate && u.reportDate > maxDate) maxDate = u.reportDate;
  });

  return schedule.map(act => {
    const linked = siteUpdates.filter(u => {
      const dec = plannerDecisions[u.id];
      if (dec && dec.linkedActivityId) {
        return dec.linkedActivityId === act.activityId && dec.status !== 'rejected';
      }
      const match = matchResults[u.id];
      return match?.category === 'ready' && match.candidateActivityId === act.activityId;
    });

    let status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed' = 'Not Started';
    let actualStart: string | undefined = undefined;
    let actualFinish: string | undefined = undefined;
    let progressPercent = 0;
    let varianceDays = 0;

    if (linked.length > 0) {
      const hasCompleted = linked.some(u => u.eventStatus === 'Completed');
      const hasStarted = linked.some(u => u.eventStatus === 'Started' || u.eventStatus === 'In Progress');

      const dates = linked.map(u => u.reportDate).filter(Boolean).sort();
      actualStart = dates[0];

      if (hasCompleted) {
        status = 'Completed';
        actualFinish = dates[dates.length - 1];
        progressPercent = 100;
      } else if (hasStarted) {
        status = 'In Progress';
        progressPercent = Math.min(85, Math.max(25, linked.length * 25));
      }
    }

    if (act.plannedFinish) {
      const plannedFinishMs = new Date(act.plannedFinish).getTime();
      if (status === 'Completed' && actualFinish) {
        const actualFinishMs = new Date(actualFinish).getTime();
        varianceDays = Math.round((actualFinishMs - plannedFinishMs) / (1000 * 3600 * 24));
      } else if (status !== 'Completed') {
        const currentMs = new Date(maxDate).getTime();
        if (currentMs > plannedFinishMs) {
          status = 'Delayed';
          varianceDays = Math.round((currentMs - plannedFinishMs) / (1000 * 3600 * 24));
        }
      }
    }

    return {
      ...act,
      actualStart,
      actualFinish,
      status,
      progressPercent,
      varianceDays,
    };
  });
}

/**
 * Seed database with benchmark dataset
 */
export function seedBenchmarkData() {
  const demoDataDir = path.resolve(__dirname, '../../demo-data');
  const scheduleCsvPath = path.join(demoDataDir, 'schedule.csv');
  const dailyReportTxtPath = path.join(demoDataDir, 'daily_report.txt');
  const pipingProgressXlsxPath = path.join(demoDataDir, 'piping_progress.xlsx');

  if (!fs.existsSync(scheduleCsvPath)) {
    console.warn('Demo data directory not found at', demoDataDir);
    return;
  }

  const csvText = fs.readFileSync(scheduleCsvPath, 'utf8');
  const txtText = fs.readFileSync(dailyReportTxtPath, 'utf8');
  const xlsxBuffer = fs.readFileSync(pipingProgressXlsxPath);

  const parsedSchedule = parseScheduleCSV(csvText);
  const parsedTxt = parseDailyReportTXT(txtText);
  const parsedXlsx = parsePipingProgressXLSX(xlsxBuffer);

  const allUpdates = [...parsedXlsx, ...parsedTxt];
  const matchesMap = processAllMatches(allUpdates, parsedSchedule);

  const matchesRecord: Record<string, MatchResult> = {};
  matchesMap.forEach((val, key) => {
    matchesRecord[key] = val;
  });

  // Clear existing tables
  db.exec(`
    DELETE FROM schedule_activities;
    DELETE FROM site_updates;
    DELETE FROM match_results;
    DELETE FROM planner_decisions;
    DELETE FROM audit_logs;
  `);

  saveScheduleActivities(parsedSchedule);
  saveSiteUpdates(allUpdates);
  saveMatchResults(matchesRecord);

  // Initialize auto-approved decisions for high-confidence items
  for (const update of allUpdates) {
    const match = matchesRecord[update.id];
    if (match && match.category === 'ready' && match.candidateActivityId) {
      savePlannerDecision({
        updateId: update.id,
        linkedActivityId: match.candidateActivityId,
        status: 'approved',
        actionType: 'approve',
        plannerNote: `Auto-linked with high confidence score (${match.confidenceScore}%)`,
        updatedAt: new Date().toISOString(),
      });

      saveAuditLog({
        id: `AUDIT-INIT-${update.id}`,
        timestamp: new Date().toISOString(),
        updateId: update.id,
        rawText: update.rawText,
        sourceFile: update.sourceFile,
        action: 'Auto High-Confidence Link',
        originalConfidence: match.confidenceScore,
        originalCategory: match.category,
        finalActivityId: match.candidateActivityId,
        plannerNote: 'System classified high confidence match',
      });
    }
  }

  console.log('✓ Database seeded successfully with benchmark dataset.');
}
