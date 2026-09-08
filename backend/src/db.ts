import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
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

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  email: string;
  role: 'planner' | 'supervisor' | 'admin' | 'guest';
  department: string;
  employeeId: string;
  avatarLetter: string;
  createdAt: string;
  lastLogin?: string;
}

export interface PlannerDecision {
  updateId: string;
  linkedActivityId: string | null;
  status: 'approved' | 'modified' | 'unplanned' | 'rejected';
  actionType: 'approve' | 'relink' | 'mark_unplanned' | 'reject' | 'edit_update';
  plannerNote?: string;
  updatedAt: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  l5Code?: string;
  taskHash?: string;
  evidenceHash?: string;
  digitalSignature?: string;
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
  userId?: string;
  userName?: string;
  userRole?: string;
  l5Code?: string;
  taskHash?: string;
  evidenceHash?: string;
  digitalSignature?: string;
}

export interface ScheduleVersion {
  versionId: string; // 'Rev-01', 'Rev-02', 'Rev-03'
  projectId: string; // 'IOCL-P4-REFINERY'
  versionName: string;
  uploadedAt: string;
  uploadedBy: string;
  fileType: string;
  activitiesCount: number;
  isActive: boolean;
  changeSummary: {
    newCount: number;
    modCount: number;
    dateChanges: number;
    removedCount: number;
  };
  rawScheduleJson?: string;
}

export interface FieldSubmissionInboxItem {
  id: string;
  projectId: string;
  submittedAt: string;
  submittedBy: string;
  userId: string;
  sourceType: string;
  fileName: string;
  extractedCount: number;
  autoMatchedCount: number;
  reviewCount: number;
  status: 'pending_review' | 'reviewed' | 'approved';
  notes?: string;
}

export interface SystemNotification {
  id: string;
  targetRole: 'planner' | 'supervisor' | 'all';
  type: 'action_required' | 'update' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  deepLinkTab?: string;
  acknowledged?: boolean;
}

/**
 * Generate a standardized Level-5 (L5) identification code
 * Format: IOCL.P4.<AREA>.<DISCIPLINE>.L5.<SEQ>
 */
export function generateL5Code(activityId: string, area: string, discipline: string, wbs: string): string {
  const cleanArea = (area || 'UNIT01').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanDisc = (discipline || 'GEN').substring(0, 3).toUpperCase();
  const numMatch = activityId.match(/\d+$/);
  const seq = numMatch ? numMatch[0].padStart(3, '0') : '001';
  return `IOCL.P4.${cleanArea}.${cleanDisc}.L5.${seq}`;
}

/**
 * Generate a cryptographic 8-character verification hash fingerprint for a task
 */
export function generateTaskHash(activityId: string, name: string, start: string, finish: string, discipline: string): string {
  const payload = `${activityId}|${name}|${start}|${finish}|${discipline}|IOCL-P4`;
  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 8).toUpperCase();
}

/**
 * Generate evidence chain custody hash
 */
export function generateEvidenceChainHash(taskHash: string, updateId: string, userId: string): string {
  const payload = `${taskHash}|${updateId}|${userId}|${Date.now()}`;
  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 12).toUpperCase();
}

/**
 * Initialize SQLite schema with users and L5 tracking
 */
export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password_hash TEXT,
      full_name TEXT,
      email TEXT,
      role TEXT,
      department TEXT,
      employee_id TEXT,
      avatar_letter TEXT,
      created_at TEXT,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS schedule_activities (
      activity_id TEXT PRIMARY KEY,
      wbs TEXT,
      activity_name TEXT,
      discipline TEXT,
      planned_start TEXT,
      planned_finish TEXT,
      area TEXT,
      aliases TEXT,
      raw_aliases TEXT,
      l5_code TEXT,
      task_hash TEXT
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
      is_explicit_unplanned INTEGER,
      task_hash TEXT,
      l5_code TEXT
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
      updated_at TEXT,
      user_id TEXT,
      user_name TEXT,
      user_role TEXT,
      l5_code TEXT,
      task_hash TEXT,
      evidence_hash TEXT,
      digital_signature TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      updateId TEXT,
      raw_text TEXT,
      source_file TEXT,
      action TEXT,
      original_confidence REAL,
      original_category TEXT,
      final_activity_id TEXT,
      planner_note TEXT,
      user_id TEXT,
      user_name TEXT,
      user_role TEXT,
      l5_code TEXT,
      task_hash TEXT,
      evidence_hash TEXT,
      digital_signature TEXT
    );

    CREATE TABLE IF NOT EXISTS schedule_versions (
      version_id TEXT PRIMARY KEY,
      project_id TEXT,
      version_name TEXT,
      uploaded_at TEXT,
      uploaded_by TEXT,
      file_type TEXT,
      activities_count INTEGER,
      is_active INTEGER,
      change_summary_json TEXT,
      raw_schedule_json TEXT
    );

    CREATE TABLE IF NOT EXISTS field_submissions (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      submitted_at TEXT,
      submitted_by TEXT,
      user_id TEXT,
      source_type TEXT,
      file_name TEXT,
      extracted_count INTEGER,
      auto_matched_count INTEGER,
      review_count INTEGER,
      status TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      target_role TEXT,
      type TEXT,
      title TEXT,
      message TEXT,
      timestamp TEXT,
      is_read INTEGER,
      deep_link_tab TEXT,
      acknowledged INTEGER
    );
  `);
}

/**
 * Seed initial user accounts
 */
export function seedUsers() {
  const users: UserAccount[] = [
    {
      id: 'usr-planner-gokul',
      username: 'gokul',
      passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
      fullName: 'Gokulakannan P.',
      email: 'gokul@datum.enterprise',
      role: 'planner',
      department: 'Project Controls & Lead Planning',
      employeeId: 'IOCL-EPCC-P4-001',
      avatarLetter: 'G',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-supervisor-rajesh',
      username: 'rajesh',
      passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
      fullName: 'Rajesh Kumar',
      email: 'rajesh.k@iocl-refinery.in',
      role: 'supervisor',
      department: 'Mechanical & Field Erection',
      employeeId: 'IOCL-EPCC-P4-SUP04',
      avatarLetter: 'R',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-guest-planner',
      username: 'guest_planner',
      passwordHash: crypto.createHash('sha256').update('guest').digest('hex'),
      fullName: 'Guest Lead Planner (Demo)',
      email: 'guest.planner@datum.demo',
      role: 'planner',
      department: 'Lead Planning Decision Suite',
      employeeId: 'DEMO-PLN-01',
      avatarLetter: 'P',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-guest-supervisor',
      username: 'guest_supervisor',
      passwordHash: crypto.createHash('sha256').update('guest').digest('hex'),
      fullName: 'Guest Field Supervisor (Demo)',
      email: 'guest.supervisor@datum.demo',
      role: 'supervisor',
      department: 'Site OCR & Evidence Ingestion',
      employeeId: 'DEMO-SUP-02',
      avatarLetter: 'S',
      createdAt: new Date().toISOString(),
    },
  ];

  const insert = db.prepare(`
    INSERT OR REPLACE INTO users 
    (id, username, password_hash, full_name, email, role, department, employee_id, avatar_letter, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    insert.run(
      u.id,
      u.username,
      u.passwordHash,
      u.fullName,
      u.email,
      u.role,
      u.department,
      u.employeeId,
      u.avatarLetter,
      u.createdAt
    );
  }
}

/**
 * Authenticate user credentials
 */
export function authenticateUser(username: string, passwordPlain: string): UserAccount | null {
  const hash = crypto.createHash('sha256').update(passwordPlain).digest('hex');
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password_hash = ?');
  const row = stmt.get(username, hash) as any;
  if (!row) return null;

  // Update last login
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(now, row.id);

  return {
    id: row.id,
    username: row.username,
    passwordHash: '',
    fullName: row.full_name,
    email: row.email,
    role: row.role as any,
    department: row.department,
    employeeId: row.employee_id,
    avatarLetter: row.avatar_letter,
    createdAt: row.created_at,
    lastLogin: now,
  };
}

/**
 * Get all users list
 */
export function getAllUsers(): Omit<UserAccount, 'passwordHash'>[] {
  const stmt = db.prepare('SELECT id, username, full_name, email, role, department, employee_id, avatar_letter, created_at, last_login FROM users');
  const rows = stmt.all() as any[];
  return rows.map(r => ({
    id: r.id,
    username: r.username,
    fullName: r.full_name,
    email: r.email,
    role: r.role,
    department: r.department,
    employeeId: r.employee_id,
    avatarLetter: r.avatar_letter,
    createdAt: r.created_at,
    lastLogin: r.last_login,
  }));
}

/**
 * Register a new user
 */
export function createUser(userData: {
  username: string;
  passwordPlain: string;
  fullName: string;
  email: string;
  role: 'planner' | 'supervisor' | 'admin';
  department?: string;
  employeeId?: string;
}): UserAccount {
  const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const passwordHash = crypto.createHash('sha256').update(userData.passwordPlain).digest('hex');
  const createdAt = new Date().toISOString();
  const avatarLetter = (userData.fullName || userData.username).charAt(0).toUpperCase();

  const insert = db.prepare(`
    INSERT INTO users (id, username, password_hash, full_name, email, role, department, employee_id, avatar_letter, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    id,
    userData.username,
    passwordHash,
    userData.fullName,
    userData.email,
    userData.role,
    userData.department || 'Project Controls',
    userData.employeeId || `IOCL-EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    avatarLetter,
    createdAt
  );

  return {
    id,
    username: userData.username,
    passwordHash: '',
    fullName: userData.fullName,
    email: userData.email,
    role: userData.role,
    department: userData.department || 'Project Controls',
    employeeId: userData.employeeId || '',
    avatarLetter,
    createdAt,
  };
}

/**
 * Get all baseline schedule activities with L5 & Task Hashes
 */
export function getScheduleActivities(): ScheduleActivity[] {
  const stmt = db.prepare('SELECT * FROM schedule_activities ORDER BY wbs ASC');
  const rows = stmt.all() as any[];
  return rows.map(r => {
    const l5Code = r.l5_code || generateL5Code(r.activity_id, r.area, r.discipline, r.wbs);
    const taskHash = r.task_hash || generateTaskHash(r.activity_id, r.activity_name, r.planned_start, r.planned_finish, r.discipline);

    return {
      activityId: r.activity_id,
      wbs: r.wbs,
      activityName: r.activity_name,
      discipline: r.discipline,
      plannedStart: r.planned_start,
      plannedFinish: r.planned_finish,
      area: r.area,
      aliases: JSON.parse(r.aliases || '[]'),
      rawAliases: r.raw_aliases,
      l5Code,
      taskHash,
    };
  });
}

/**
 * Save schedule activities with deterministic L5 codes and SHA-256 fingerprints
 */
export function saveScheduleActivities(activities: ScheduleActivity[]) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO schedule_activities 
    (activity_id, wbs, activity_name, discipline, planned_start, planned_finish, area, aliases, raw_aliases, l5_code, task_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const act of activities) {
    const l5Code = act.l5Code || generateL5Code(act.activityId, act.area, act.discipline, act.wbs);
    const taskHash = act.taskHash || generateTaskHash(act.activityId, act.activityName, act.plannedStart, act.plannedFinish, act.discipline);

    insert.run(
      act.activityId,
      act.wbs,
      act.activityName,
      act.discipline,
      act.plannedStart,
      act.plannedFinish,
      act.area,
      JSON.stringify(act.aliases || []),
      act.rawAliases || '',
      l5Code,
      taskHash
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
    taskHash: r.task_hash,
    l5Code: r.l5_code,
  }));
}

/**
 * Save site updates
 */
export function saveSiteUpdates(updates: SiteUpdate[]) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO site_updates 
    (id, source_file, source_type, entry_id, discipline, report_date, raw_text, extracted_description, event_status, area, quantity, unit, supervisor, line_evidence, is_explicit_unplanned, task_hash, l5_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      u.isExplicitUnplanned ? 1 : 0,
      u.taskHash || null,
      u.l5Code || null
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
      userId: r.user_id,
      userName: r.user_name,
      userRole: r.user_role,
      l5Code: r.l5_code,
      taskHash: r.task_hash,
      evidenceHash: r.evidence_hash,
      digitalSignature: r.digital_signature,
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
    (update_id, linked_activity_id, status, action_type, planner_note, updated_at, user_id, user_name, user_role, l5_code, task_hash, evidence_hash, digital_signature)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    decision.updateId,
    decision.linkedActivityId || null,
    decision.status,
    decision.actionType,
    decision.plannerNote || '',
    decision.updatedAt,
    decision.userId || 'usr-planner-gokul',
    decision.userName || 'Gokulakannan P.',
    decision.userRole || 'Lead Planner',
    decision.l5Code || '',
    decision.taskHash || '',
    decision.evidenceHash || '',
    decision.digitalSignature || ''
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
    userId: r.user_id,
    userName: r.user_name,
    userRole: r.user_role,
    l5Code: r.l5_code,
    taskHash: r.task_hash,
    evidenceHash: r.evidence_hash,
    digitalSignature: r.digital_signature,
  }));
}

/**
 * Save audit log
 */
export function saveAuditLog(log: AuditLog) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO audit_logs 
    (id, timestamp, update_id, raw_text, source_file, action, original_confidence, original_category, final_activity_id, planner_note, user_id, user_name, user_role, l5_code, task_hash, evidence_hash, digital_signature)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    log.plannerNote || '',
    log.userId || 'usr-planner-gokul',
    log.userName || 'Gokulakannan P.',
    log.userRole || 'Lead Planner',
    log.l5Code || '',
    log.taskHash || '',
    log.evidenceHash || '',
    log.digitalSignature || ''
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
      const pParts = act.plannedFinish.split('-').map(Number);
      const plannedFinishMs = Date.UTC(pParts[0], pParts[1] - 1, pParts[2]);

      if (status === 'Completed' && actualFinish) {
        const aParts = actualFinish.split('-').map(Number);
        const actualFinishMs = Date.UTC(aParts[0], aParts[1] - 1, aParts[2]);
        varianceDays = Math.round((actualFinishMs - plannedFinishMs) / (1000 * 3600 * 24));
      } else if (status !== 'Completed') {
        const mParts = maxDate.split('-').map(Number);
        const currentMs = Date.UTC(mParts[0], mParts[1] - 1, mParts[2]);
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

  seedUsers();

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
      const act = parsedSchedule.find(a => a.activityId === match.candidateActivityId);
      const l5Code = act ? generateL5Code(act.activityId, act.area, act.discipline, act.wbs) : '';
      const taskHash = act ? generateTaskHash(act.activityId, act.activityName, act.plannedStart, act.plannedFinish, act.discipline) : '';
      const evidenceHash = generateEvidenceChainHash(taskHash, update.id, 'usr-planner-gokul');
      const digitalSig = `SIG-${taskHash}-${evidenceHash.substring(0, 6)}`;

      savePlannerDecision({
        updateId: update.id,
        linkedActivityId: match.candidateActivityId,
        status: 'approved',
        actionType: 'approve',
        plannerNote: `Auto-linked with high confidence score (${match.confidenceScore}%)`,
        updatedAt: new Date().toISOString(),
        userId: 'usr-planner-gokul',
        userName: 'Gokulakannan P.',
        userRole: 'Lead Planning Engineer',
        l5Code,
        taskHash,
        evidenceHash,
        digitalSignature: digitalSig,
      });

      saveAuditLog({
        id: `AUDIT-INIT-${update.id}`,
        timestamp: new Date().toISOString(),
        updateId: update.id,
        rawText: update.rawText,
        sourceFile: update.sourceFile,
        action: 'Auto High-Confidence Link & Verify',
        originalConfidence: match.confidenceScore,
        originalCategory: match.category,
        finalActivityId: match.candidateActivityId,
        plannerNote: 'System verified high-confidence OCR alignment with L5 task hash',
        userId: 'usr-planner-gokul',
        userName: 'Gokulakannan P.',
        userRole: 'Lead Planning Engineer',
        l5Code,
        taskHash,
        evidenceHash,
        digitalSignature: digitalSig,
      });
    }
  }

  // Seed initial Schedule Versions (Rev-01, Rev-02, Rev-03)
  db.exec(`
    DELETE FROM schedule_versions;
    DELETE FROM field_submissions;
    DELETE FROM notifications;
  `);

  const versions: ScheduleVersion[] = [
    {
      versionId: 'Rev-01',
      projectId: 'IOCL-P4-REFINERY',
      versionName: 'Rev-01 (Contract Award Baseline)',
      uploadedAt: '2026-08-01T09:00:00Z',
      uploadedBy: 'Gokulakannan P. (Lead Planner)',
      fileType: 'Primavera P6 XLSX',
      activitiesCount: 30,
      isActive: false,
      changeSummary: {
        newCount: 0,
        modCount: 0,
        dateChanges: 0,
        removedCount: 0,
      },
    },
    {
      versionId: 'Rev-02',
      projectId: 'IOCL-P4-REFINERY',
      versionName: 'Rev-02 (Monsoon Revised Schedule)',
      uploadedAt: '2026-08-25T14:30:00Z',
      uploadedBy: 'Gokulakannan P. (Lead Planner)',
      fileType: 'Primavera P6 XLSX',
      activitiesCount: 34,
      isActive: false,
      changeSummary: {
        newCount: 4,
        modCount: 8,
        dateChanges: 12,
        removedCount: 0,
      },
    },
    {
      versionId: 'Rev-03',
      projectId: 'IOCL-P4-REFINERY',
      versionName: 'Rev-03 (Active Approved Production Schedule)',
      uploadedAt: '2026-09-08T08:00:00Z',
      uploadedBy: 'Gokulakannan P. (Lead Planner)',
      fileType: 'Primavera P6 Export XLSX',
      activitiesCount: parsedSchedule.length,
      isActive: true,
      changeSummary: {
        newCount: 12,
        modCount: 27,
        dateChanges: 41,
        removedCount: 3,
      },
    },
  ];

  for (const v of versions) {
    saveScheduleVersion(v);
  }

  // Seed Field Submissions Inbox
  const initialSubmissions: FieldSubmissionInboxItem[] = [
    {
      id: 'SUB-2026-0908-01',
      projectId: 'IOCL-P4-REFINERY',
      submittedAt: '2026-09-08T10:42:00Z',
      submittedBy: 'Rajesh Kumar (Field Supervisor)',
      userId: 'usr-supervisor-rajesh',
      sourceType: 'Daily Field Report',
      fileName: 'daily_report.txt',
      extractedCount: parsedTxt.length,
      autoMatchedCount: parsedTxt.length - 2,
      reviewCount: 2,
      status: 'pending_review',
      notes: 'Unit-01 Pump Bay daily shift progress with welding and foundation pour records.',
    },
    {
      id: 'SUB-2026-0908-02',
      projectId: 'IOCL-P4-REFINERY',
      submittedAt: '2026-09-08T11:15:00Z',
      submittedBy: 'Rajesh Kumar (Field Supervisor)',
      userId: 'usr-supervisor-rajesh',
      sourceType: 'Piping Progress XLSX',
      fileName: 'piping_progress.xlsx',
      extractedCount: parsedXlsx.length,
      autoMatchedCount: parsedXlsx.length,
      reviewCount: 0,
      status: 'approved',
      notes: 'Piping spool fabrication & hydrostatic test clearance logs.',
    },
  ];

  for (const sub of initialSubmissions) {
    saveFieldSubmission(sub);
  }

  // Seed System Notifications
  const initialNotifications: SystemNotification[] = [
    {
      id: 'NOTIF-01',
      targetRole: 'planner',
      type: 'action_required',
      title: '2 Field Submissions Require Review',
      message: 'New progress entries from Rajesh Kumar in Unit-01 require human-in-the-loop schedule reconciliation.',
      timestamp: '2026-09-08T10:45:00Z',
      isRead: false,
      deepLinkTab: 'planner-review',
    },
    {
      id: 'NOTIF-02',
      targetRole: 'supervisor',
      type: 'update',
      title: 'Active Schedule Version: Rev-03',
      message: 'Lead Planner Gokulakannan P. activated Rev-03. 4 activities assigned to your workfront were updated.',
      timestamp: '2026-09-08T08:05:00Z',
      isRead: false,
      deepLinkTab: 'supervisor-entry',
      acknowledged: false,
    },
    {
      id: 'NOTIF-03',
      targetRole: 'all',
      type: 'info',
      title: 'Synchronized Project Database',
      message: 'Central SQLite embedded engine is active and synchronized across Field & Planning roles.',
      timestamp: '2026-09-08T08:00:00Z',
      isRead: true,
      deepLinkTab: 'dashboard',
    },
  ];

  for (const notif of initialNotifications) {
    saveNotification(notif);
  }

  console.log('✓ Database seeded successfully with benchmark dataset, L5 task hashes, schedule versions, and field submissions.');
}

/**
 * Schedule Versioning Management
 */
export function getScheduleVersions(): ScheduleVersion[] {
  const stmt = db.prepare('SELECT * FROM schedule_versions ORDER BY uploaded_at DESC');
  const rows = stmt.all() as any[];
  return rows.map(r => ({
    versionId: r.version_id,
    projectId: r.project_id,
    versionName: r.version_name,
    uploadedAt: r.uploaded_at,
    uploadedBy: r.uploaded_by,
    fileType: r.file_type,
    activitiesCount: r.activities_count,
    isActive: Boolean(r.is_active),
    changeSummary: JSON.parse(r.change_summary_json || '{"newCount":0,"modCount":0,"dateChanges":0,"removedCount":0}'),
    rawScheduleJson: r.raw_schedule_json,
  }));
}

export function saveScheduleVersion(version: ScheduleVersion) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO schedule_versions 
    (version_id, project_id, version_name, uploaded_at, uploaded_by, file_type, activities_count, is_active, change_summary_json, raw_schedule_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    version.versionId,
    version.projectId,
    version.versionName,
    version.uploadedAt,
    version.uploadedBy,
    version.fileType,
    version.activitiesCount,
    version.isActive ? 1 : 0,
    JSON.stringify(version.changeSummary || {}),
    version.rawScheduleJson || null
  );
}

export function activateScheduleVersion(versionId: string): ScheduleVersion | null {
  db.exec(`UPDATE schedule_versions SET is_active = 0 WHERE project_id = 'IOCL-P4-REFINERY'`);
  db.prepare(`UPDATE schedule_versions SET is_active = 1 WHERE version_id = ?`).run(versionId);

  const versions = getScheduleVersions();
  const activated = versions.find(v => v.versionId === versionId);

  if (activated) {
    // Notify field supervisor about schedule update
    saveNotification({
      id: `NOTIF-REV-${Date.now()}`,
      targetRole: 'supervisor',
      type: 'update',
      title: `Schedule ${versionId} is now Active`,
      message: `Lead Planner activated ${activated.versionName}. Changes affecting your workfront are available for review.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      deepLinkTab: 'supervisor-entry',
      acknowledged: false,
    });
  }

  return activated || null;
}

/**
 * Field Submissions Inbox Management
 */
export function getFieldSubmissions(): FieldSubmissionInboxItem[] {
  const stmt = db.prepare('SELECT * FROM field_submissions ORDER BY submitted_at DESC');
  const rows = stmt.all() as any[];
  return rows.map(r => ({
    id: r.id,
    projectId: r.project_id,
    submittedAt: r.submitted_at,
    submittedBy: r.submitted_by,
    userId: r.user_id,
    sourceType: r.source_type,
    fileName: r.file_name,
    extractedCount: r.extracted_count,
    autoMatchedCount: r.auto_matched_count,
    reviewCount: r.review_count,
    status: r.status,
    notes: r.notes || '',
  }));
}

export function saveFieldSubmission(submission: FieldSubmissionInboxItem) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO field_submissions
    (id, project_id, submitted_at, submitted_by, user_id, source_type, file_name, extracted_count, auto_matched_count, review_count, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    submission.id,
    submission.projectId || 'IOCL-P4-REFINERY',
    submission.submittedAt,
    submission.submittedBy,
    submission.userId || 'usr-supervisor-rajesh',
    submission.sourceType,
    submission.fileName,
    submission.extractedCount,
    submission.autoMatchedCount,
    submission.reviewCount,
    submission.status,
    submission.notes || ''
  );
}

/**
 * System Notifications Management
 */
export function getNotifications(targetRole?: string): SystemNotification[] {
  const rows = targetRole && targetRole !== 'all'
    ? (db.prepare('SELECT * FROM notifications WHERE target_role = ? OR target_role = "all" ORDER BY timestamp DESC').all(targetRole) as any[])
    : (db.prepare('SELECT * FROM notifications ORDER BY timestamp DESC').all() as any[]);

  return rows.map(r => ({
    id: r.id,
    targetRole: r.target_role,
    type: r.type,
    title: r.title,
    message: r.message,
    timestamp: r.timestamp,
    isRead: Boolean(r.is_read),
    deepLinkTab: r.deep_link_tab,
    acknowledged: Boolean(r.acknowledged),
  }));
}

export function saveNotification(notif: SystemNotification) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO notifications
    (id, target_role, type, title, message, timestamp, is_read, deep_link_tab, acknowledged)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    notif.id,
    notif.targetRole,
    notif.type,
    notif.title,
    notif.message,
    notif.timestamp,
    notif.isRead ? 1 : 0,
    notif.deepLinkTab || null,
    notif.acknowledged ? 1 : 0
  );
}

export function markNotificationRead(id: string) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
}

export function acknowledgeSupervisorScheduleUpdates() {
  db.exec('UPDATE notifications SET acknowledged = 1 WHERE target_role = "supervisor" AND type = "update"');
}


