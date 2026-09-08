export type NavigationTab = 'home' | 'dashboard' | 'site-updates' | 'schedule-activities' | 'planner-review' | 'upload' | 'supervisor-entry' | 'copilot';

export type AppSystemMode = 'enterprise' | 'executive';

export type UserRole = 'admin' | 'supervisor';

export type DensityMode = 'comfortable' | 'compact';

export type ThemeMode = 'light' | 'dark';

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'planner' | 'supervisor' | 'admin' | 'guest';
  department: string;
  employeeId: string;
  avatarLetter: string;
  createdAt: string;
  lastLogin?: string;
}

export interface ScheduleVersion {
  versionId: string; // 'Rev-01', 'Rev-02', 'Rev-03'
  projectId: string;
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

export interface AuthCredentials {
  username: string;
  password?: string;
  role?: string;
  fullName?: string;
}

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
  l5Code?: string; // e.g. "IOCL.P4.UNIT01.PIP.L5.012"
  taskHash?: string; // e.g. "D7A9F4B2"
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
  taskHash?: string;
  l5Code?: string;
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
  originalCategory: MatchCategory;
  finalActivityId: string | null;
  plannerNote?: string;
  userRole?: UserRole | string;
  userId?: string;
  userName?: string;
  l5Code?: string;
  taskHash?: string;
  evidenceHash?: string;
  digitalSignature?: string;
}

export interface ApprovalHistoryItem extends PlannerDecision {
  supervisor?: string;
  reportDate?: string;
  discipline?: string;
  extractedDescription?: string;
  rawText?: string;
  activityName?: string;
  area?: string;
}

export type WorkbenchViewMode = 'table' | 'kanban' | 'gantt' | 'ingestion';

export type GanttTimescale = 'days' | 'weeks' | 'months';

export interface EVMAnalytics {
  plannedValue: number; // PV (0 - 100%)
  earnedValue: number; // EV (0 - 100%)
  actualCostProgress: number; // AC
  spi: number; // EV / PV
  cpi: number; // EV / AC
  scheduleVarianceDays: number; // SV in days
  eacForecastDate: string; // Estimate at Completion date
  criticalPathSlipDays: number;
  totalFloatAvailable: number; // days
  freeFloatAvailable: number; // days
}

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
  delayDays: number;
  simulatedDelayDays: number;
  targetBaselineFinish: string;
  baselineStart: string;
  baselineFinish: string;
  scenarioStart: string;
  scenarioFinish: string;
  targetScenarioFinish: string;
  maxShiftDays: number;
  impactedCount: number;
  totalImpactedCount: number;
  criticalMilestoneImpacted: boolean;
  overallRiskLevel: 'Low' | 'Medium' | 'High';
  impactedActivities: ImpactedActivityScenario[];
  upstreamActivities: ScheduleActivity[];
  executiveSummary: string;
  executiveBriefing: string;
}

export interface ExtractedHandwrittenTask {
  id: string;
  taskName: string;
  discipline: string;
  area: string;
  status: EventStatus;
  detectedTag?: string;
  quantity?: string;
  unit?: string;
  isIssue?: boolean;
  issueNote?: string;
  rawText: string;
  confidence: number;
}

export interface SpokenParseResult {
  rawTranscript: string;
  normalizedTranscript?: string;
  cleanDescription: string;
  extractedDescription?: string;
  discipline: string;
  extractedDiscipline?: string;
  area: string;
  extractedArea?: string;
  eventStatus: EventStatus;
  extractedStatus?: EventStatus;
  detectedTag?: string;
  extractedTag?: string;
  quantity?: string;
  extractedQuantity?: string;
  unit?: string;
  extractedUnit?: string;
  isIssue?: boolean;
  issueFlag?: string;
  issueDescription?: string;
  issueSeverity?: 'low' | 'medium' | 'critical';
  confidenceScore: number;
  confidence?: number;
  language: 'en-IN' | 'hi-IN' | 'ta-IN';
}

export type GuidedDemoStepId =
  | 'welcome'
  | 'step-1-schedule-upload'
  | 'step-2-parsed-milestones'
  | 'step-3-assigned-tasks'
  | 'step-4-evidence-submission'
  | 'step-5-field-reality'
  | 'step-6-field-inbox'
  | 'step-7-ai-matching'
  | 'step-8-schedule-versions'
  | 'step-9-field-sync'
  | 'step-10-delay-intelligence'
  | 'step-1-baseline'
  | 'step-2-field-reality'
  | 'step-3-understand'
  | 'step-4-match'
  | 'step-5-explain'
  | 'step-6-governance'
  | 'step-7-intelligence'
  | 'complete'
  | string;

export interface GuidedDemoStep {
  id: GuidedDemoStepId;
  stepNumber: number;
  totalSteps: number;
  title: string;
  tagline?: string;
  description: string;
  explanationWhy?: string;
  targetTab: NavigationTab;
  targetSelector: string;
  cardPlacement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'right' | 'left' | 'center';
  actionLabel?: string;
}
