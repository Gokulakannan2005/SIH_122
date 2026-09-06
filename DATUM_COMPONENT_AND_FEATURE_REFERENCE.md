# Datum — Component & Feature Technical Reference
**Industrial Project Controls Architecture, Component Catalogue & Control Dictionary**

*Official Technical Reference for Product Engineers, Evaluators, and Systems Architects*

---

## 1. System Architecture & Topology

Datum is built on a decoupled, resilient architecture designed for high availability on industrial jobsites with intermittent network connectivity:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + TypeScript)                         │
│                                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────────┐  │
│  │   Sidebar & Layout   │  │   AppHeader / Mode   │  │     Drawers/Modals    │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └───────────┬───────────┘  │
│             │                         │                          │              │
│  ┌──────────▼─────────────────────────▼──────────────────────────▼───────────┐  │
│  │                            ProjectContext                                 │  │
│  │  - State Management       - Ingestion Handler      - Audit Trail Handler │  │
│  │  - Offline Sync Queue     - Planner Actions        - Notification System  │  │
│  └──────────┬─────────────────────────┬──────────────────────────┬───────────┘  │
│             │                         │                          │              │
│  ┌──────────▼───────────┐  ┌──────────▼───────────┐  ┌───────────▼───────────┐  │
│  │  matchingEngine.ts   │  │    ocrService.ts     │  │ scheduleSimulator.ts  │  │
│  │  (NLP Multi-Factor)  │  │ (Tesseract.js/Crypto)│  │ (Forward Propagation) │  │
│  └──────────────────────┘  └──────────────────────┘  └───────────────────────┘  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ REST API / Local Fallback
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express + SQLite Embedded)                │
│                                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────────┐  │
│  │      server.ts       │  │      parsers.ts      │  │         db.ts         │  │
│  │ (REST Endpoints/Cors)│  │ (CSV, TXT, Excel)    │  │ (SQLite Tables/Seed)  │  │
│  └──────────────────────┘  └──────────────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Feature Catalogue

### Feature 1: Multi-Source Field Ingestion
- **Location**: `SupervisorEntryView.tsx`, `UploadDemoView.tsx`
- **Purpose**: Ingests unstructured daily progress text, single entries, CSV schedules, TXT logs, and Excel piping spreadsheets.
- **Intended Role**: Site Supervisor (single entry) & Lead Planner (batch upload).
- **Source Files**: `SupervisorEntryView.tsx`, `UploadDemoView.tsx`, `parsers.ts`, `server.ts`.
- **Inputs**: Text fields, files (`.csv`, `.txt`, `.xlsx`, `.jpg`, `.png`, `.webp`).
- **Outputs/State Changes**: Adds new `SiteUpdate` to `siteUpdates`, generates `MatchResult`, creates `AuditLog`.
- **Backend/API Dependency**: `POST /api/upload`, `POST /api/site-updates`, fallback to browser in-memory state.
- **Offline Behavior**: Queues entry in `offlineSyncQueue` in local storage; syncs when online.
- **Status**: **Working**.

### Feature 2: Photo Evidence & SHA-256 Integrity Fingerprinting
- **Location**: `SupervisorEntryView.tsx`, `InspectorDrawer.tsx`
- **Purpose**: Attaches construction photo proof with client-side SHA-256 integrity hash verification.
- **Intended Role**: Site Supervisor & Lead Planner.
- **Source Files**: `ocrService.ts`, `ProjectContext.tsx`, `SupervisorEntryView.tsx`, `InspectorDrawer.tsx`.
- **Inputs**: Image file (JPEG, PNG, WebP $\le$ 8 MB).
- **Outputs/State Changes**: Computes SHA-256 string, generates thumbnail URL, attaches to `ImageEvidence`.
- **Backend/API Dependency**: Client-side Web Crypto API (`crypto.subtle.digest`).
- **Offline Behavior**: Fully operational client-side; persists in local session state.
- **Status**: **Working**.

### Feature 3: Browser-Local OCR Equipment Tag Extraction
- **Location**: `SupervisorEntryView.tsx`, `InspectorDrawer.tsx`
- **Purpose**: Runs local OCR on demand to extract candidate equipment and activity tags.
- **Intended Role**: Site Supervisor & Lead Planner.
- **Source Files**: `ocrService.ts`, `SupervisorEntryView.tsx`.
- **Inputs**: User click on **Run OCR Tag Scan**.
- **Outputs/State Changes**: Extracts candidate tags (`24-CW-017`, `18-FW-008`), calculates OCR confidence %, provides raw OCR text.
- **Backend/API Dependency**: Browser-local `tesseract.js` engine (zero external API calls).
- **Offline Behavior**: Fully client-side.
- **Status**: **Working**.

### Feature 4: Human-in-the-Loop Equipment Tag Verification
- **Location**: `SupervisorEntryView.tsx`, `InspectorDrawer.tsx`
- **Purpose**: Allows supervisor or planner to confirm or manually enter an equipment tag.
- **Intended Role**: Site Supervisor & Lead Planner.
- **Source Files**: `ProjectContext.tsx`, `InspectorDrawer.tsx`.
- **Inputs**: Candidate tag chip click or manual tag input submission.
- **Outputs/State Changes**: Sets `confirmedTag`, `confirmedBy`, updates matching engine scores, creates audit record.
- **Backend/API Dependency**: Updates local state and triggers re-match evaluation.
- **Offline Behavior**: Fully client-side.
- **Status**: **Working**.

### Feature 5: Deterministic Multi-Factor Schedule Matching Engine
- **Location**: `matchingEngine.ts` (frontend and backend)
- **Purpose**: Computes explainable match scores between field updates and L5/L6 schedule activities.
- **Intended Role**: System background engine.
- **Source Files**: `frontend/src/utils/matchingEngine.ts`, `backend/src/matchingEngine.ts`.
- **Inputs**: `SiteUpdate` and `ScheduleActivity[]`.
- **Outputs/State Changes**: Generates `MatchResult` with confidence score, category (`ready`, `review`, `unplanned`), and score breakdown.
- **Backend/API Dependency**: `GET /api/matches` or local `processAllMatches`.
- **Status**: **Working**.

### Feature 6: Planner Review Workbench & Decision Engine
- **Location**: `PlannerReviewView.tsx`
- **Purpose**: Lead Planner command center for approving links, relinking, marking unplanned, or rejecting reports.
- **Intended Role**: Lead Planner only.
- **Source Files**: `PlannerReviewView.tsx`, `ProjectContext.tsx`.
- **Inputs**: Selection of target activity, planner justification note, action button click.
- **Outputs/State Changes**: Updates `plannerDecisions`, triggers schedule actual date recalculation, logs audit event, advances queue.
- **Backend/API Dependency**: `POST /api/planner/action` or local state.
- **Status**: **Working**.

### Feature 7: Scenario-Based Schedule Risk Simulator
- **Location**: `CopilotView.tsx`, `scheduleSimulator.ts`
- **Purpose**: Deterministic forward delay propagation simulating downstream domino impacts across Finish-to-Start dependency chains.
- **Intended Role**: Lead Planner & Project Manager.
- **Source Files**: `frontend/src/utils/scheduleSimulator.ts`, `frontend/src/components/CopilotView.tsx`.
- **Inputs**: Target milestone selection, delay duration slider (+1 to +60 days).
- **Outputs/State Changes**: Calculates shifted start/finish dates, incremental delay days, impacted milestone count, critical path impact flag, and executive briefing.
- **Backend/API Dependency**: Client-side dependency graph engine.
- **Status**: **Working**.

### Feature 8: Cross-Discipline Field Reports Board & Table
- **Location**: `SiteUpdatesView.tsx`
- **Purpose**: Multi-view feed for exploring field updates with multi-attribute search and coordinated filters.
- **Intended Role**: All users (read-only for supervisors; quick-review access for planners).
- **Source Files**: `SiteUpdatesView.tsx`, `InspectorDrawer.tsx`.
- **Inputs**: Search text, discipline chips, status dropdowns, view mode toggle.
- **Outputs/State Changes**: Filtered list of updates, opens `InspectorDrawer`.
- **Status**: **Working**.

### Feature 9: Milestone Baseline & Schedule Activity Inspector
- **Location**: `ScheduleActivitiesView.tsx`, `ScheduleActivityDrawer.tsx`
- **Purpose**: Displays master schedule deliverables with actual execution overlays and dependency chains.
- **Intended Role**: All users.
- **Source Files**: `ScheduleActivitiesView.tsx`, `ScheduleActivityDrawer.tsx`.
- **Inputs**: Search query, discipline filter, row click.
- **Outputs/State Changes**: Opens `ScheduleActivityDrawer` with linked updates and variance metrics.
- **Status**: **Working**.

### Feature 10: Global Action-Feedback Notification System
- **Location**: `ToastContainer.tsx`, `ProjectContext.tsx`
- **Purpose**: Non-blocking pop-up toast alerts confirming system state changes without disorienting the user.
- **Intended Role**: All users.
- **Source Files**: `ToastContainer.tsx`, `ProjectContext.tsx`.
- **Inputs**: Ingestion, approval, relinking, OCR scanning, tag confirmation, demo reset events.
- **Outputs/State Changes**: Auto-dismissing toast notifications (3000–4000ms duration).
- **Status**: **Working**.

---

## 3. Comprehensive Button and Control Reference

The following table documents every interactive UI control across the Datum application:

| Screen / Component | Control Label | Who Can Use | What It Does | Result / State Change | Notes / Limitations |
|---|---|---|---|---|---|
| **AppHeader** | Role Toggle (`Lead Planner Mode` / `Supervisor Mode`) | All Users | Toggles active operational role | Switches `currentRole`; hides/shows planner tabs | Supervisor role redirects out of planner-only tabs |
| **AppHeader** | `Export CSV` | All Users | Exports alignment matrix and execution log | Triggers browser download of `datum_execution_alignment.csv` | Generates standard UTF-8 CSV |
| **AppHeader** | `Restart Demo` | All Users | Resets dataset to pristine demo state | Calls `loadDemoData()`, restores benchmark schedule, reports, and photos | Displays green confirmation toast |
| **Sidebar** | Navigation Items (`Dashboard`, `Daily Field Reports`, `Milestone Baseline`, `AI Auto-Match`, `Supervisor Entry`, `AI Copilot`, `Data Ingestion`) | All Users (role-gated) | Switches active viewport tab | Updates `activeTab` | Planner tabs hidden when in Supervisor mode |
| **Sidebar** | `Audit Trail & Governance` | All Users | Opens full audit history modal | Sets `selectedAuditUpdateId` | Displays complete tabular audit log |
| **Sidebar** | `Offline / Sync Queue Badge` | All Users | Displays local offline queue count | Opens sync indicator / triggers queue sync | Active when offline mode is enabled |
| **Dashboard** | KPI Metric Cards (`Total Updates`, `Approved Links`, `Pending Review`, `Blockers`) | All Users | Navigates to filtered view | Updates `activeTab` and sets filter criteria | 1-click drilldown |
| **SiteUpdatesView** | `Kanban / Table Toggle` | All Users | Switches display mode | Updates `viewMode` (`kanban` or `table`) | Retains active search and filter state |
| **SiteUpdatesView** | Search Input | All Users | Filters updates by keyword | Updates `searchQuery` in filter state | Matches across ID, text, area, and tags |
| **SiteUpdatesView** | Discipline Filter Chips (`All`, `Piping`, `Civil`, `Electrical`, `Instrumentation`, `HSE`) | All Users | Filters updates by discipline | Sets `selectedDiscipline` | Highlights active chip |
| **SiteUpdatesView** | Status Filter Select | All Users | Filters by match status | Sets `selectedStatus` (`ALL`, `approved`, `review`, `unplanned`) | Native select dropdown |
| **SiteUpdatesView** | `Clear all` / `Reset All Filters` | All Users | Clears all active filters | Resets filter state to defaults | Restores full update list |
| **SiteUpdatesView** | Kanban Card / Table Row Click | All Users | Opens record inspector | Sets `selectedInspectorUpdateId` | Opens slide-over `InspectorDrawer` |
| **SiteUpdatesView** | `Review →` Button | Lead Planner | Jumps directly to review workbench | Sets `selectedReviewUpdateId` and navigates to `planner-review` | Only visible on pending review items |
| **PlannerReviewView** | Queue Search Input | Lead Planner | Filters left review queue | Filters `queueItems` | Fast local fuzzy filtering |
| **PlannerReviewView** | Queue Filter Chips (`Pending Review`, `Unplanned`, `Approved`, `All`) | Lead Planner | Filters review items by category | Sets `plannerQueueFilter` | Preserves active item selection |
| **PlannerReviewView** | Queue Item Card Click | Lead Planner | Focuses update in review pane | Sets `selectedReviewUpdateId` | Loads details into workbench |
| **PlannerReviewView** | `Inspect Metadata` Button | Lead Planner | Opens side drawer for raw provenance | Sets `selectedInspectorUpdateId` | Opens `InspectorDrawer` |
| **PlannerReviewView** | Photo Proof Badge Click | Lead Planner | Opens photo evidence in drawer | Sets `selectedInspectorUpdateId` | Shows enlarged image and tag status |
| **PlannerReviewView** | Alternative Candidate Chip Click | Lead Planner | Selects suggested milestone | Sets `selectedActivityId` | Updates action button to "Relink" |
| **PlannerReviewView** | Browse Schedule Search Box | Lead Planner | Searches full master baseline | Filters `filteredSchedule` list | Allows picking any L5/L6 activity |
| **PlannerReviewView** | Planner Justification Input | Lead Planner | Enters audit rationale text | Updates `plannerNote` state | Logged into immutable audit log |
| **PlannerReviewView** | `Confirm Link` / `Relink to [ID]` (Green/Blue) | Lead Planner | Approves or relinks activity | Saves decision, recalculates dates, advances queue | Non-blocking toast feedback |
| **PlannerReviewView** | `Mark Unplanned` (Amber) | Lead Planner | Classifies update as unplanned | Sets status to `unplanned`, logs note, advances queue | Surfaced on blocker/unplanned lists |
| **PlannerReviewView** | `Reject` (Red) | Lead Planner | Rejects invalid field report | Sets status to `rejected`, logs note, advances queue | Preserves original report for audit |
| **SupervisorEntryView** | Discipline Dropdown | Site Supervisor | Selects trade discipline | Updates form discipline | `Piping`, `Civil`, `Electrical`, etc. |
| **SupervisorEntryView** | Area / Location Input | Site Supervisor | Specifies physical location | Updates form area | e.g., `Utility Yard Pump Bay` |
| **SupervisorEntryView** | Event Status Select | Site Supervisor | Selects execution state | Updates `eventStatus` (`Started`, `In Progress`, `Completed`) | Influences schedule actual dates |
| **SupervisorEntryView** | Blocker Toggle & Severity | Site Supervisor | Flags site obstruction | Toggles blocker state and severity level | Triggers warning indicators |
| **SupervisorEntryView** | Photo Drag & Drop Zone | Site Supervisor | Attaches construction photo | Reads file buffer, computes SHA-256, generates preview | Validates $\le$ 8 MB and JPEG/PNG/WebP |
| **SupervisorEntryView** | `Run OCR Tag Scan` Button | Site Supervisor | Executes browser-local OCR | Calls `runLocalOCR()`, extracts candidate tags | Shows loading spinner and confidence |
| **SupervisorEntryView** | Candidate Tag Chip Click | Site Supervisor | Selects detected equipment tag | Sets `confirmedTag` state | Adds checkmark to selected chip |
| **SupervisorEntryView** | Manual Tag Confirm Input | Site Supervisor | Manually enters equipment tag | Sets `confirmedTag` state | Auto-uppercases input |
| **SupervisorEntryView** | `Remove Photo` Button | Site Supervisor | Detaches attached photo | Clears image, hash, and OCR state | Reversible before submit |
| **SupervisorEntryView** | `Ingest Field Record` Button | Site Supervisor | Submits report into pipeline | Adds `SiteUpdate`, runs matching engine, adds audit record | Non-blocking success toast |
| **SupervisorEntryView** | `Reset Form` Button | Site Supervisor | Clears all form fields | Resets form state to default values | Clean form reset |
| **CopilotView** | Target Milestone Select | Lead Planner | Chooses activity to simulate | Sets `selectedTargetActivityId` | Lists all baseline activities |
| **CopilotView** | Simulated Delay Slider | Lead Planner | Sets delay slippage days | Updates `delayDays` (+1 to +60 working days) | Real-time numeric feedback |
| **CopilotView** | `Simulate Risk Scenario` Button | Lead Planner | Runs forward delay propagation | Calls `simulateScheduleDelay()`, updates impact table | Deterministic Finish-to-Start math |
| **CopilotView** | `Reset Scenario` Button | Lead Planner | Clears active simulation | Resets scenario state to baseline | Restores pristine view |
| **UploadDemoView** | Dropzones (Schedule, DPR, Piping) | Lead Planner | Attaches files for batch upload | Reads file contents into upload state | Schema-validated dropzones |
| **UploadDemoView** | `Execute Ingestion Batch` Button | Lead Planner | Executes batch ingestion | Calls backend API or local parser pipeline | Full project reload |
| **InspectorDrawer** | Close `X` Button / Backdrop | All Users | Closes inspector drawer | Sets `selectedInspectorUpdateId(null)` | Smooth slide-out |
| **InspectorDrawer** | `Copy Hash` Button | All Users | Copies SHA-256 hash | Writes hash to system clipboard | Displays "✓ Copied" feedback |
| **InspectorDrawer** | Candidate Tag Chips | All Users | Confirms equipment tag | Calls `handleConfirmImageTag()` | Immediately updates matching scores |
| **InspectorDrawer** | Manual Tag Confirm Input | All Users | Confirms custom tag | Calls `handleConfirmImageTag()` | Updates matching scores |
| **InspectorDrawer** | `Remove` (Photo) Button | All Users | Detaches photo from record | Calls `handleRemoveImageFromUpdate()` | Updates audit log |
| **InspectorDrawer** | `Save Parameters` Button | Lead Planner | Saves parameter edits | Calls `handleEditUpdate()`, persists changes | Displays "Saved!" feedback |
| **InspectorDrawer** | Schedule Search Box | Lead Planner | Searches linker activities | Filters drawer schedule list | Fast activity selection |
| **InspectorDrawer** | Action Buttons (`Confirm`, `Unplanned`, `Reject`) | Lead Planner | Submits planner decision | Calls `handlePlannerAction()` | Closes drawer on submit |
| **ScheduleActivityDrawer** | Close `X` Button / Backdrop | All Users | Closes milestone drawer | Sets `selectedScheduleActivityId(null)` | Slide-out drawer |
| **ScheduleActivityDrawer** | Linked Update Click | All Users | Switches focus to field update | Sets `selectedInspectorUpdateId` | 1-click evidence inspection |
| **AuditTrailModal** | Close `X` Button / Close Button | All Users | Closes audit log modal | Sets `selectedAuditUpdateId(null)` | Closes overlay |

---

## 4. Frontend Component Map

| Component File | Location | Responsibility |
|---|---|---|
| [`App.tsx`](file:///d:/SIH_122_AG/frontend/src/App.tsx) | `frontend/src/App.tsx` | Main application shell, router, and modal/drawer container. |
| [`ProjectContext.tsx`](file:///d:/SIH_122_AG/frontend/src/context/ProjectContext.tsx) | `frontend/src/context/ProjectContext.tsx` | Central state management, ingestion pipeline, planner decisions, offline sync, and notifications. |
| [`AppHeader.tsx`](file:///d:/SIH_122_AG/frontend/src/components/AppHeader.tsx) | `frontend/src/components/AppHeader.tsx` | Global top navigation header, role switcher, CSV export, and demo reset. |
| [`Sidebar.tsx`](file:///d:/SIH_122_AG/frontend/src/components/Sidebar.tsx) | `frontend/src/components/Sidebar.tsx` | Left application navigation menu with role-gated tabs and audit log trigger. |
| [`Dashboard.tsx`](file:///d:/SIH_122_AG/frontend/src/components/Dashboard.tsx) | `frontend/src/components/Dashboard.tsx` | Project Control Center metrics, progress distributions, and execution health. |
| [`SiteUpdatesView.tsx`](file:///d:/SIH_122_AG/frontend/src/components/SiteUpdatesView.tsx) | `frontend/src/components/SiteUpdatesView.tsx` | Daily Field Reports feed with Kanban board, table list, and coordinated filters. |
| [`ScheduleActivitiesView.tsx`](file:///d:/SIH_122_AG/frontend/src/components/ScheduleActivitiesView.tsx) | `frontend/src/components/ScheduleActivitiesView.tsx` | Master schedule baseline table with actual dates, variances, and progress overlay. |
| [`PlannerReviewView.tsx`](file:///d:/SIH_122_AG/frontend/src/components/PlannerReviewView.tsx) | `frontend/src/components/PlannerReviewView.tsx` | Lead Planner decision workbench for match verification and activity linking. |
| [`SupervisorEntryView.tsx`](file:///d:/SIH_122_AG/frontend/src/components/SupervisorEntryView.tsx) | `frontend/src/components/SupervisorEntryView.tsx` | Site supervisor portal for field entry, photo upload, OCR scan, and tag confirmation. |
| [`CopilotView.tsx`](file:///d:/SIH_122_AG/frontend/src/components/CopilotView.tsx) | `frontend/src/components/CopilotView.tsx` | AI risk advisor and Scenario-Based Schedule Risk Simulator. |
| [`UploadDemoView.tsx`](file:///d:/SIH_122_AG/frontend/src/components/UploadDemoView.tsx) | `frontend/src/components/UploadDemoView.tsx` | Batch data ingestion hub for CSV, TXT, and XLSX files. |
| [`InspectorDrawer.tsx`](file:///d:/SIH_122_AG/frontend/src/components/InspectorDrawer.tsx) | `frontend/src/components/InspectorDrawer.tsx` | Slide-over inspector for raw field text, photo proof, SHA-256 hash, and score breakdown. |
| [`ScheduleActivityDrawer.tsx`](file:///d:/SIH_122_AG/frontend/src/components/ScheduleActivityDrawer.tsx) | `frontend/src/components/ScheduleActivityDrawer.tsx` | Slide-over inspector for schedule milestone dependencies and linked evidence. |
| [`AuditTrailModal.tsx`](file:///d:/SIH_122_AG/frontend/src/components/AuditTrailModal.tsx) | `frontend/src/components/AuditTrailModal.tsx` | Full-screen tabular governance audit log. |
| [`ToastContainer.tsx`](file:///d:/SIH_122_AG/frontend/src/components/ToastContainer.tsx) | `frontend/src/components/ToastContainer.tsx` | Floating non-blocking action-feedback notification container. |
| [`matchingEngine.ts`](file:///d:/SIH_122_AG/frontend/src/utils/matchingEngine.ts) | `frontend/src/utils/matchingEngine.ts` | Multi-factor NLP matching algorithm (Keyword + Discipline + Spatial + Fuzzy). |
| [`ocrService.ts`](file:///d:/SIH_122_AG/frontend/src/utils/ocrService.ts) | `frontend/src/utils/ocrService.ts` | Browser-local OCR engine (Tesseract.js) and SHA-256 Web Crypto fingerprinting. |
| [`scheduleSimulator.ts`](file:///d:/SIH_122_AG/frontend/src/utils/scheduleSimulator.ts) | `frontend/src/utils/scheduleSimulator.ts` | Deterministic Finish-to-Start forward delay propagation simulator. |

---

## 5. Backend REST API Endpoint Map

| HTTP Method | Endpoint | Description | Request Body / Params | Response Format |
|---|---|---|---|---|
| `GET` | `/api/health` | Health status and metrics count | None | `{ status, engine, timestamp, metrics: { scheduleActivities, siteUpdates, plannerDecisions, auditLogs } }` |
| `GET` | `/api/schedule` | Enriched schedule activities | None | `ScheduleActivity[]` (with actual dates & variance) |
| `GET` | `/api/site-updates` | All ingested site updates | None | `SiteUpdate[]` |
| `PUT` | `/api/site-updates/:id` | Update site report parameters | `{ extractedDescription, area, eventStatus, reportDate }` | `{ success: true, siteUpdate, matchResult }` |
| `GET` | `/api/matches` | Algorithmic match results | None | `Record<string, MatchResult>` |
| `GET` | `/api/planner/decisions` | All submitted planner decisions | None | `Record<string, PlannerDecision>` |
| `POST` | `/api/planner/action` | Submit planner decision | `{ updateId, actionType, targetActivityId, note }` | `{ success: true, decision, auditLog }` |
| `GET` | `/api/audit-logs` | Immutable audit log history | None | `AuditLog[]` |
| `POST` | `/api/upload` | Multi-file batch ingestion | Multipart form (`scheduleCsv`, `dailyReportTxt`, `pipingProgressXlsx`) | `{ success: true, metrics }` |
| `POST` | `/api/reset` | Restore initial benchmark dataset | None | `{ success: true, message }` |

---

## 6. Core Data Model Glossary

```typescript
// 1. Master Schedule Activity
interface ScheduleActivity {
  activityId: string;           // e.g. "PIP-L6-012"
  wbs: string;                  // e.g. "1.2.4.1"
  activityName: string;         // e.g. "Erect Line 24-CW-017 Spool & Flanges"
  discipline: string;           // e.g. "Piping"
  area: string;                 // e.g. "Utility Yard"
  plannedStart: string;         // e.g. "2026-09-01"
  plannedFinish: string;        // e.g. "2026-09-08"
  duration: number;             // Planned duration in working days
  rawAliases: string;           // Keywords/aliases e.g. "24-CW-017, CW Spool, Cooling Water"
  actualStart?: string;         // Actual execution start derived from approved updates
  actualFinish?: string;        // Actual execution finish
  percentComplete?: number;     // 0 - 100%
  varianceDays?: number;        // Actual finish - Planned finish
  status?: 'not_started' | 'in_progress' | 'completed';
}

// 2. Attached Photo Proof Evidence
interface ImageEvidence {
  id: string;
  url: string;                  // Data URL / Blob URL
  type: 'completion' | 'issue' | 'progress';
  caption: string;
  timestamp: string;
  supervisor: string;
  filename?: string;            // e.g. "FIELD_CW017_SPOOL.jpg"
  fileSize?: number;            // Size in bytes
  sha256Hash?: string;          // 64-char hex integrity fingerprint
  ocrStatus?: 'idle' | 'scanning' | 'success' | 'failed' | 'no_text';
  ocrConfidence?: number;       // Approximate OCR text recognition confidence (0-100%)
  ocrRawText?: string;          // Raw extracted OCR text
  ocrDetectedTags?: string[];   // Candidate tags e.g. ["24-CW-017"]
  confirmedTag?: string;        // Human-confirmed equipment tag
  confirmedBy?: 'supervisor' | 'planner' | 'unconfirmed';
  confirmedAt?: string;
}

// 3. Field Progress Record
interface SiteUpdate {
  id: string;                   // e.g. "UPD-001"
  sourceFile: string;           // Source identifier e.g. "daily_report.txt"
  sourceType: 'text_dpr' | 'excel_log' | 'supervisor_upload';
  discipline: string;
  reportDate: string;           // YYYY-MM-DD
  rawText: string;              // Verbatim text from field supervisor
  extractedDescription: string; // Cleaned task summary
  eventStatus: 'Started' | 'In Progress' | 'Completed';
  area?: string;
  quantity?: string;
  supervisor?: string;
  images?: ImageEvidence[];
  confirmedTag?: string;        // Propagated confirmed tag for fast lookup
  issueFlag?: string;           // Blocker description
  issueSeverity?: 'low' | 'medium' | 'critical';
}

// 4. Deterministic Match Result
interface MatchResult {
  updateId: string;
  candidateActivityId: string | null;
  confidenceScore: number;      // 0 - 100%
  category: 'ready' | 'review' | 'unplanned';
  matchReasons: string[];       // Human-explainable matching reasons
  scoreBreakdown: {
    keywordScore: number;       // Max 50
    disciplineScore: number;    // Max 20
    areaScore: number;          // Max 15
    fuzzyScore: number;         // Max 15
  };
  suggestedActivities?: { activity: ScheduleActivity; score: number; reasons: string[] }[];
}

// 5. Planner Decision & Audit Provenance
interface PlannerDecision {
  updateId: string;
  status: 'approved' | 'modified' | 'unplanned' | 'rejected';
  linkedActivityId: string | null;
  plannerNote?: string;
  timestamp: string;
  plannerRole?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  updateId: string;
  rawText: string;
  sourceFile: string;
  action: string;
  originalConfidence: number;
  originalCategory: string;
  finalActivityId: string | null;
  plannerNote: string;
  userRole: string;
}
```

---

## 7. Demo Benchmark Dataset

The system includes pre-seeded benchmark data based on an industrial **Cooling Water Pump House & Piping Package**:

| Dataset File | Source Type | Contribution to Benchmark Scenario |
|---|---|---|
| `demo-data/schedule.csv` | Primavera P6 Schedule | Contains 12 Level-6 activities across Civil foundation pouring, equipment placement, piping spool erection, hydrotesting, cable pulling, and loop checks. |
| `demo-data/daily_report.txt` | Unstructured DPR Log | Free-text supervisor shift updates containing exact matches (`24-CW-017`), ambiguous records (`Pipe erection completed`), and unplanned rework (`fabricated temporary drain bypass`). |
| `demo-data/piping_progress.xlsx` | Contractor Weld Log | Tabular joint-by-joint welder spreadsheet tracking inch-dia completion and NDT inspection statuses. |
| Pre-seeded Photos | Photo Proof & OCR | Pre-loaded construction photos with pre-computed SHA-256 fingerprints demonstrating `24-CW-017` tag recognition on pipe spools. |

---

## 8. Legacy Notes & Non-Implemented Scope

### Legacy Branding Note
Earlier project specifications and hackathon submissions referenced the working title **ProjectPulse**. The production platform name is officially **Datum** (*"The record of execution"*).

### Intentionally Excluded Scope (Non-Claimed Features)
In accordance with honest engineering principles, the following capabilities are **not** present and must not be claimed:
1. **No Cloud Computer Vision / Paid AI APIs**: OCR is strictly browser-local using `tesseract.js`; no external cloud credentials or paid APIs are used.
2. **No Auto-Approval of Milestones**: OCR and matching algorithms only provide candidates; human planner confirmation is mandatory.
3. **No Automatic Defect / Face Recognition**: The image engine only extracts text tags; it does not claim to assess construction quality or detect defects visually.
4. **No Cryptographic Legal Certification**: The SHA-256 hash is an integrity fingerprint, not a legally binding digital signature.
