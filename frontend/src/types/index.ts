export type NavigationTab = 'dashboard' | 'site-updates' | 'schedule-activities' | 'planner-review' | 'upload' | 'supervisor-entry' | 'copilot';

export type UserRole = 'admin' | 'supervisor';

export type DensityMode = 'comfortable' | 'compact';

export interface ImageEvidence {
  id: string;
  url: string;
  type: 'completion' | 'issue' | 'progress';
  caption: string;
  timestamp: string;
  supervisor: string;
  filename?: string;
  fileSize?: number; // bytes
  sha256Hash?: string; // Integrity fingerprint (Web Crypto SHA-256)
  ocrStatus?: 'idle' | 'scanning' | 'success' | 'failed' | 'no_text';
  ocrConfidence?: number; // 0 to 100
  ocrRawText?: string;
  ocrDetectedTags?: string[];
  confirmedTag?: string; // e.g. "24-CW-017"
  confirmedBy?: 'supervisor' | 'planner' | 'unconfirmed';
  confirmedAt?: string;
}

export interface ScheduleActivity {
  activityId: string; // e.g. "PIP-L6-012"
  wbs: string; // e.g. "2.1.2"
  activityName: string; // e.g. "Erect Line 24-CW-017"
  discipline: string; // "Civil" | "Piping" | "Electrical" | "Instrumentation" | "HSE"
  plannedStart: string; // YYYY-MM-DD
  plannedFinish: string; // YYYY-MM-DD
  area: string; // e.g. "Pump Bay"
  aliases: string[]; // parsed array of alias strings
  rawAliases: string; // raw string from CSV
  // Progress & Variance
  actualStart?: string;
  actualFinish?: string;
  progressPercent?: number;
  varianceDays?: number;
  status?: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  criticalPath?: boolean;
}

export type EventStatus = 'Started' | 'Completed' | 'In Progress';

export interface SiteUpdate {
  id: string;
  sourceFile: 'daily_report.txt' | 'piping_progress.xlsx' | 'field_mobile_entry' | string;
  sourceType: 'text_report' | 'excel_sheet' | 'supervisor_upload';
  entryId?: string;
  discipline: string;
  reportDate: string;
  rawText: string;
  extractedDescription: string;
  eventStatus: EventStatus;
  area: string;
  quantity?: string | number;
  unit?: string;
  supervisor?: string;
  lineEvidence?: string | number; // line number or row number
  isExplicitUnplanned?: boolean;
  images?: ImageEvidence[];
  confirmedTag?: string; // Confirmed equipment/line tag (e.g. "24-CW-017")
  issueFlag?: string; // Optional site blocker / obstacle note
  issueSeverity?: 'low' | 'medium' | 'critical';
}

export type MatchCategory = 'ready' | 'review' | 'unplanned' | 'rejected';

export interface ScoreBreakdown {
  keywordScore: number; // max 50
  disciplineScore: number; // max 20
  areaScore: number; // max 15
  fuzzyScore: number; // max 15
}

export interface MatchResult {
  updateId: string;
  candidateActivityId: string | null;
  confidenceScore: number; // 0 to 100
  category: MatchCategory;
  matchReasons: string[];
  scoreBreakdown: ScoreBreakdown;
  suggestedActivities?: { activity: ScheduleActivity; score: number; reasons: string[] }[];
}

export type PlannerActionType = 'approve' | 'relink' | 'mark_unplanned' | 'reject' | 'edit_update';

export interface PlannerDecision {
  updateId: string;
  linkedActivityId: string | null; // null if unplanned or rejected
  status: 'approved' | 'modified' | 'unplanned' | 'rejected';
  actionType: PlannerActionType;
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
  originalCategory: MatchCategory;
  finalActivityId: string | null;
  plannerNote?: string;
  userRole?: UserRole;
}

export type WorkbenchViewMode = 'table' | 'kanban' | 'gantt' | 'ingestion';

export type WorkbenchSortOption = 'confidence-desc' | 'confidence-asc' | 'date-desc' | 'date-asc' | 'discipline' | 'wbs';

export interface OfflineSyncItem {
  id: string;
  timestamp: string;
  type: 'new_update' | 'planner_action' | 'image_upload';
  summary: string;
  synced: boolean;
}

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  timestamp: string;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ScheduleDependency {
  predecessorId: string;
  successorId: string;
  relationshipType: 'FS'; // Finish-to-Start
  lagDays?: number;
  description?: string;
}

export interface ImpactedActivityScenario {
  activityId: string;
  activityName: string;
  discipline: string;
  area: string;
  wbs: string;
  baselineStart: string;
  baselineFinish: string;
  durationDays: number;
  scenarioStart: string;
  scenarioFinish: string;
  shiftDays: number;
  incrementalShiftDays: number;
  isDirectTarget: boolean;
  predecessorIds: string[];
  severity: 'low' | 'medium' | 'critical';
  impactExplanation: string;
}

export interface ScenarioSimulationResult {
  targetActivityId: string;
  targetActivityName: string;
  targetDiscipline: string;
  targetArea: string;
  simulatedDelayDays: number;
  baselineStart: string;
  baselineFinish: string;
  scenarioStart: string;
  scenarioFinish: string;
  maxShiftDays: number;
  impactedCount: number;
  criticalMilestoneImpacted: boolean;
  overallRiskLevel: 'Low' | 'Medium' | 'High';
  impactedActivities: ImpactedActivityScenario[];
  upstreamActivities: ScheduleActivity[];
  executiveBriefing: string;
}


