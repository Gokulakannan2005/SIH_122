export type NavigationTab = 'dashboard' | 'site-updates' | 'schedule-activities' | 'planner-review' | 'upload';

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
}

export type EventStatus = 'Started' | 'Completed' | 'In Progress';

export interface SiteUpdate {
  id: string;
  sourceFile: 'daily_report.txt' | 'piping_progress.xlsx' | string;
  sourceType: 'text_report' | 'excel_sheet';
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
}

export type WorkbenchViewMode = 'table' | 'kanban' | 'gantt' | 'ingestion';

export type WorkbenchSortOption = 'confidence-desc' | 'confidence-asc' | 'date-desc' | 'date-asc' | 'discipline' | 'wbs';

