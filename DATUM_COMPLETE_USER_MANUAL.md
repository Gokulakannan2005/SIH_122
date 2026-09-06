# Datum — Complete User Manual
**Industrial Schedule-Evidence Linker & Execution Intelligence Platform**

*Official Documentation for Site Supervisors, Lead Planners, Project Managers, and Evaluators*

---

## 1. What Datum Is

### The Problem It Solves
In modern industrial megaprojects (oil and gas refineries, petrochemical complexes, thermal/nuclear power plants, and metro rail networks), project progress is formally planned down to Level 5 and Level 6 (L5/L6) milestone activities in Oracle Primavera P6 or Microsoft Project. However, daily field progress is reported by site supervisors through informal free-text Daily Progress Reports (DPR), discipline spreadsheets, and field logs using colloquial construction slang, partial tag numbers, and local jargon.

Consequently, project controls teams spend 15–25 hours every week manually reading field logs, hunting for matching schedule activity IDs, and hand-keying progress. This manual friction causes:
1. **Reporting Latency**: Project managers discover delays 3–7 days late.
2. **Ghost Scope & Out-of-Scope Work**: Unplanned rework and undocumented field tasks go untracked.
3. **Audit Vulnerability**: When contractor claims or delay disputes arise, there is no immutable evidence trail connecting the original field record to the schedule update.

### The Evidence-to-Schedule Workflow
Datum provides a deterministic, explainable link between raw field evidence and master schedule milestones:

```text
[Field Report + Photo Proof]
         │
         ▼
[Browser-Local SHA-256 Fingerprint + OCR Tag Detection]
         │
         ▼
[Human Verification / Confirmation of Equipment Tag]
         │
         ▼
[Deterministic Multi-Factor Matching (Keyword + Discipline + Spatial + Fuzzy)]
         │
         ▼
[Planner Review & Decision Workbench (Approve / Relink / Unplanned / Reject)]
         │
         ▼
[Enriched Schedule Baseline (Actual Dates, % Complete, Variance Tracking)]
         │
         ▼
[Forward Delay Propagation & What-If Scenario Risk Simulator]
```

### Who Uses Datum?
- **Site Supervisors**: Field foremen and discipline leads who capture daily construction progress, pipe spool erections, equipment installations, and site photos.
- **Lead Planners / Project Controls Engineers**: Scheduling professionals who verify matching evidence, confirm activity links, manage scope variances, and simulate schedule risks.
- **Project Managers & Executives**: Leadership teams monitoring overall portfolio critical paths, contractor claims, and milestone delays.
- **Auditors & Evaluators**: Reviewers verifying that every schedule progression is backed by verifiable text, timestamp, and photo integrity proof.

---

## 2. Core Project Controls Terminology

To help non-technical users, here are the essential definitions used throughout Datum:

| Term | Plain-Language Definition |
|---|---|
| **L5 / L6 Activities** | **Level 5 / Level 6 Schedule Activities**: The most granular, day-to-day deliverables in a project schedule (e.g., `PIP-L6-012: Erect Line 24-CW-017 Spool & Flanges`). |
| **WBS** | **Work Breakdown Structure**: A hierarchical decomposition of total project scope into manageable sections (e.g., `1.2.4.1: Cooling Water Piping`). |
| **Schedule Baseline** | The approved, frozen project plan containing planned start dates, finish dates, and durations against which all actual execution is measured. |
| **Variance (Days)** | The difference between actual execution dates and planned dates. A negative variance (e.g., `-5 days`) indicates execution finished ahead of plan; a positive variance (e.g., `+7 days`) indicates delay. |
| **Confidence Score (%)** | A contextual metric (0–100%) indicating how strongly a specific field report matches a schedule activity based on keywords, tags, discipline, spatial area, and wording similarity. |
| **Unplanned Work** | Field activities or scope performed on site that do not map to any approved baseline milestone, requiring planner investigation or change order authorization. |
| **Integrity Fingerprint (SHA-256)** | A unique 64-character digital fingerprint computed directly in the browser from an attached photo file to guarantee provenance and audit integrity without legal overclaiming. |
| **Audit Trail** | An immutable chronological log recording every ingestion, OCR scan, tag confirmation, planner approval, parameter edit, and relinking decision. |

---

## 3. Roles and Permissions

Datum enforces strict role-based operational boundaries between field data capture and schedule management. The active role can be toggled using the header pill button (**Lead Planner Mode** / **Supervisor Mode**).

```
┌────────────────────────────────────────────────────────┐
│                   GLOBAL APP HEADER                    │
│ Datum > [Section Name]        [Role Switcher] [Export] │
└────────────────────────────────────────────────────────┘
```

### Site Supervisor Capabilities & Restrictions
- **Can Do**:
  - Ingest new daily progress records through the Supervisor Hub (`SupervisorEntryView`).
  - Attach construction photos (JPEG, PNG, WebP $\le$ 8 MB) and run browser-local OCR scans.
  - Select or manually enter equipment tags (`24-CW-017`, `18-FW-008`, `PT-2401`, etc.).
  - Flag site blockers, access holds, or safety hazards with severity levels (`Low`, `Medium`, `Critical`).
  - View the Daily Field Reports board/table and inspect full record provenance in read-only mode.
- **Cannot Do**:
  - Cannot approve, relink, or reject schedule matches.
  - Cannot alter baseline milestone dates, WBS items, or schedule dependencies.
  - Cannot access the Lead Planner Review Workbench, Data Ingestion schemas, or Executive Risk Simulator.

### Lead Planner Capabilities & Responsibilities
- **Can Do**:
  - Full authority to approve, relink to alternative milestones, classify as unplanned, or reject field reports.
  - Edit site report parameters (extracted description, area, event status, report date) in the Inspector Drawer.
  - Confirm or correct OCR equipment tags directly from the review workbench or inspector.
  - Filter the review queue by confidence level, discipline, or status.
  - Simulate delay propagation scenarios on critical path activities in the **AI Predictive Risk & Copilot**.
  - Batch ingest Primavera P6 schedule CSVs, supervisor DPR TXT logs, and contractor Excel spreadsheets.
  - Export the complete alignment matrix and audit log to standard CSV format.

---

## 4. Navigation & Screen-by-Screen Guide

### A. Project Control Center (`Dashboard.tsx`)
- **Purpose**: Executive dashboard providing real-time KPI metrics across field ingestion, matching categories, schedule variances, and discipline breakdowns.
- **What You See**:
  - Top summary metric cards: **Total Site Updates**, **Approved Baseline Links**, **Pending Planner Review**, and **Flagged Blockers**.
  - **Match Status Distribution**: Visual progress bar breaking down items into Ready (High Confidence), Review Required, and Unplanned Scope.
  - **Schedule Execution Health**: Breakdown of Critical Path, Delayed, and On-Track milestones.
  - **Discipline Breakdown**: Item counts across Piping, Civil, Electrical, Instrumentation, and HSE.
  - **Recent Audit Activity**: Live stream of latest planner decisions and supervisor entries.
- **How to Use**: Click any metric card or category pill to automatically navigate with pre-filtered context.

### B. Daily Field Reports Feed (`SiteUpdatesView.tsx`)
- **Purpose**: Operational command view for browsing, filtering, searching, and inspecting all field reports ingested into Datum.
- **What You See**:
  - Toggle between **Kanban Board** (columns for *Ready to Link*, *Needs Review*, *Approved Link*, and *Unplanned Scope*) and **Table List View**.
  - Search bar supporting multi-attribute search across Update ID, text, discipline, area, supervisor, blocker flags, and matched activities.
  - Filter chips for **Discipline** (`Piping`, `Civil`, `Electrical`, `Instrumentation`, `HSE`), **Status**, and **Source File**.
  - Compact badges indicating photo proof attachments with confirmed equipment tag tooltips (`[📷 24-CW-017]`).
- **How to Use**: Click any card or row to open the **Inspector Drawer**. Planners can click **Review →** to jump directly to the Planner Review Workbench.

### C. Milestone Baseline (L5/L6) (`ScheduleActivitiesView.tsx`)
- **Purpose**: Interactive master schedule viewer displaying all baseline Primavera P6 activities with real-time actual progress overlay.
- **What You See**:
  - Activity ID, WBS Deliverable, Activity Name, Discipline, Area, Planned Start/Finish, and Duration.
  - **Actual Execution Overlay**: Actual Start/Finish dates derived from approved site updates.
  - **Schedule Variance Badge**: Colored indicators showing On-Track (`0d`), Ahead (`-Nd`), or Delayed (`+Nd`).
  - **Linked Evidence Count**: Number of field updates confirmed against each activity.
- **How to Use**: Click any schedule activity row to open the **Schedule Activity Drawer**, displaying its predecessor dependencies, linked supervisor updates, and variance analysis.

### D. AI Auto-Match Matrix & Planner Workbench (`PlannerReviewView.tsx`)
- **Purpose**: Lead Planner decision center for resolving ambiguous field updates, verifying matching evidence, and approving schedule links.
- **What You See**:
  - **Left Queue**: List of pending updates ordered by uncertainty (lowest confidence first) with search and status filters.
  - **Section 1: Field Event Details**: Full verbatim field log, extracted summary, supervisor name, date, and attached photo indicator.
  - **Section 2: AI Match & Milestone Assignment**:
    - **Top AI Recommendation**: Suggested L5/L6 activity with confidence score badge and matching evidence breakdown chips (*Keyword Match*, *Discipline Match*, *Spatial Area Match*, *Photo Evidence Tag*).
    - **Alternative Candidate Suggestions**: 1-click alternative cards for rapid relinking.
    - **Browse Full Schedule**: Searchable activity picker for manual relinking across the entire baseline.
  - **Section 3: Prominent Action Bar**:
    - Justification note input (recorded to immutable audit log).
    - **Approve Link** (Green) / **Relink to Activity** (Blue).
    - **Mark Unplanned** (Amber).
    - **Reject Report** (Red).
- **How to Use**: Select a candidate, review the matching evidence breakdown, type a justification note if needed, and click the desired action button. The queue automatically advances smoothly to the next item.

### E. Field Progress & Photo Logs (`SupervisorEntryView.tsx`)
- **Purpose**: Dedicated site supervisor interface for capturing daily work logs, uploading construction photos, running OCR tag detection, and submitting progress.
- **What You See**:
  - Discipline dropdown, Area / Location text input, Event Status selector (`Started`, `In Progress`, `Completed`), Quantity field.
  - Extracted task description and verbatim supervisor log box.
  - Site blocker toggle with severity indicator.
  - **Photo Evidence Upload Zone**: Drag-and-drop box with file-picker fallback (JPEG, PNG, WebP $\le$ 8 MB).
  - **OCR Tag Scan Action**: Runs local OCR on demand, returning candidate tags (`24-CW-017`) with OCR recognition confidence.
  - **Tag Confirmation Box**: Candidate tag chips + manual tag input for confirming equipment tag before submission.
- **How to Use**: Fill out report details, drop a photo, click **Run OCR Tag Scan**, click the matching tag chip, and click **Ingest Field Record**.

### F. AI Predictive Risk & Copilot (`CopilotView.tsx`)
- **Purpose**: Risk simulation and decision-support workspace featuring Datum's deterministic **Scenario-Based Schedule Risk Simulator**.
- **What You See**:
  - **Target Milestone Selector**: Choose any baseline activity (e.g., `PIP-L6-012`).
  - **Simulated Delay Slider**: Adjust simulated slippage from +1 to +60 working days.
  - **Simulate Risk Scenario Button**: Executes Finish-to-Start forward delay propagation.
  - **Scenario Impact Summary**: Downstream milestone cascade count, max completion slip, critical milestone impact flag, and risk level (`Low`, `Medium`, `High`).
  - **Downstream Domino Activity Chain Table**: Exact activity-by-activity breakdown showing baseline window, new scenario window, incremental shift days, severity, and dependency relationship.
  - **Executive Risk Briefing**: Plain-language narrative ready for project controls reports.
- **How to Use**: Select an activity, set the delay days, click **Simulate Scenario**, and review the downstream cascade table.

### G. Data Ingestion & Schemas (`UploadDemoView.tsx`)
- **Purpose**: File upload hub for importing Primavera P6 schedule CSVs, supervisor daily text logs, and contractor Excel spreadsheets.
- **What You See**:
  - 3 dropzones for Schedule CSV (`schedule.csv`), Daily Report TXT (`daily_report.txt`), and Piping Progress XLSX (`piping_progress.xlsx`).
  - Expected column and format schemas.
  - **Execute Ingestion Batch Button**: Ingests files into backend SQLite or local browser engine.

### H. Slide-Over Drawers & Modals
- **Inspector Drawer (`InspectorDrawer.tsx`)**:
  - Opens when clicking any site update.
  - Shows attached photo with full zoom/contain fit, original filename, file size, SHA-256 integrity fingerprint with copy action, OCR confidence, candidate chips, confirmed tag status, and tag correction controls.
  - Displays original verbatim text, extracted parameters, algorithm score breakdown (Keyword: /50, Discipline: /20, Area: /15, Fuzzy: /15), and planner action buttons.
- **Schedule Activity Drawer (`ScheduleActivityDrawer.tsx`)**:
  - Opens when clicking any schedule milestone in the baseline view.
  - Shows milestone scope, WBS path, planned dates, actual dates, variance, predecessor/successor dependencies, and all linked site updates.
- **Audit Trail Modal (`AuditTrailModal.tsx`)**:
  - Accessible from the sidebar **Audit Trail & Governance** item.
  - Displays a complete tabular audit history of every ingestion, OCR scan, tag confirmation, planner decision, and manual edit with timestamp, user role, and justification notes.

---

## 5. Step-by-Step Workflows

### Workflow 1: Submitting a Field Report with Photo & OCR Tag Verification
1. Navigate to **Field Progress & Photo Logs** in the sidebar.
2. Select **Discipline** (e.g., `Piping`), enter **Area** (e.g., `Utility Yard - Cooling Water Pump Bay`), and choose **Status** (e.g., `In Progress`).
3. Enter the description: `Erected line 24-CW-017 spool and verified alignment.`
4. In the **Photo Evidence** upload box, drag and drop the photo file (e.g., `FIELD_CW017_SPOOL.jpg`).
5. Notice the computed **SHA-256 Fingerprint** badge (`7f83b1657ff1fc...`).
6. Click **Run OCR Tag Scan**.
7. In the detected candidate chips, click **24-CW-017**.
8. Notice the banner: *“✓ Confirmed Tag: 24-CW-017. Confirmed tag will be considered as matching evidence. It will not automatically approve the schedule link.”*
9. Click **Ingest Field Record**.
10. A non-blocking success toast confirms ingestion.

### Workflow 2: Reviewing an AI Match as Lead Planner
1. Switch to **Lead Planner Mode** using the top-right header button.
2. Navigate to **AI Auto-Match Matrix**.
3. In the left queue, click update `UPD-001` or any pending report.
4. Review the verbatim log text and verify the photo proof chip.
5. In Section 2, inspect the **Top AI Recommendation** (`PIP-L6-012: Erect Line 24-CW-017`) and the matching breakdown chips (*Keyword/Tag: 45/50*, *Discipline: 20/20*, *Spatial Area: 15/15*).
6. Enter an audit note in the justification box (e.g., `Verified pipe spool tag matches drawing CW-017`).
7. Click **Confirm Link** (Green button).
8. The decision is saved, the audit log is updated, and the queue automatically advances.

### Workflow 3: Relinking to an Alternative Milestone
1. If the top recommendation is not the intended deliverable, click one of the **Alternative Candidate Suggestions** (e.g., `PIP-L6-015`) or use the **Browse Full Schedule** search input.
2. The blue radio button highlights the new selection.
3. The button updates to **Relink to PIP-L6-015** (Blue button).
4. Enter an audit note explaining the re-assignment.
5. Click **Relink**.

### Workflow 4: Marking Out-of-Scope Work as Unplanned
1. If a field report describes temporary work or rework (e.g., `UPD-005: Fabricated temporary drain bypass`), select the update in the review queue.
2. Enter an audit note (e.g., `Temporary drain line is out-of-scope rework; flagging for commercial change order review`).
3. Click **Unplanned** (Amber button).
4. The update is categorized as Unplanned Scope and surfaced on the Project Control Center blocker list.

### Workflow 5: Simulating a Schedule Delay Scenario
1. Navigate to **AI Predictive Risk & Copilot**.
2. Select target milestone `PIP-L6-012 (Erect Line 24-CW-017 Spool)`.
3. Move the **Simulated Delay Duration** slider to `+10 Days`.
4. Click **Simulate Risk Scenario**.
5. Inspect the **Downstream Domino Activity Chain** to see that `PIP-L6-013 (Hydrostatic Testing)` and `PIP-L6-014 (Pipe Insulation)` have shifted forward by 10 days.
6. Review the generated executive briefing for distribution to project leadership.

---

## 6. Understanding Confidence & Match Categories

Datum evaluates match confidence contextually for each individual field update using a deterministic multi-factor algorithm. Confidence is never presented as a single fixed project-wide number.

### Score Attribution Breakdown (Max 100 Points):
- **Keyword & Equipment Tag (Max 50 pts)**: Exact match of confirmed equipment tags (`24-CW-017`), isometric numbers, or construction keywords (`pipe`, `cable tray`, `concrete`).
- **Discipline Alignment (Max 20 pts)**: Exact match between report discipline (`Piping`) and activity discipline (`Piping`).
- **Spatial Area (Max 15 pts)**: Area/location keyword overlap (`Utility Yard`, `Pump Bay`, `Substation`).
- **Fuzzy Token Similarity (Max 15 pts)**: Textual similarity between supervisor text and activity name/aliases.

### Match Decision Thresholds:

| Score Range | Category | Color | Action Required |
|---|---|---|---|
| **$\ge$ 75%** | **Ready to Link** | Green | High-confidence candidate. Planner can approve with 1 click. |
| **40% – 74%** | **Review Required** | Amber | Ambiguous description, close runner-up, or partial match. Planner review mandatory. |
| **$<$ 40%** | **Unplanned Scope** | Rose | Low confidence or unmapped field activity. Routed to unplanned investigation. |

> **Critical Rule**: AI and OCR recommendations **never** auto-approve or auto-link activities. Final authority always rests with the human Lead Planner.

---

## 7. Troubleshooting & System Limitations

| Scenario / Issue | Cause | Solution |
|---|---|---|
| **Oversized photo error** | Uploaded photo exceeds 8 MB. | Compress or resize image below 8 MB (JPEG/PNG/WebP). |
| **OCR detects no tag** | Photo is blurry, low contrast, or tag is obscured. | Use the manual tag input box to enter the tag (`24-CW-017`) and click **Confirm Tag**. |
| **Backend offline indicator** | Node.js backend server (`localhost:5000`) is not running. | Datum automatically operates in client-side standalone fallback mode using local storage. To start backend, run `run_backend.bat`. |
| **Restarting fresh demo** | Testing completed and fresh baseline data is desired. | Click **Restart Demo** in the top-right header to restore baseline schedule, sample reports, and photo proofs. |

---

## 8. Quick Operational Reference

### For Site Supervisors:
1. Open **Field Progress & Photo Logs**.
2. Fill discipline, area, and status.
3. Attach construction photo and run **OCR Tag Scan**.
4. Confirm equipment tag chip.
5. Click **Ingest Field Record**.

### For Lead Planners:
1. Ensure **Lead Planner Mode** is active.
2. Open **AI Auto-Match Matrix**.
3. Inspect pending reports in the left queue.
4. Verify photo proof and matching reasons.
5. Click **Confirm Link**, **Relink**, **Unplanned**, or **Reject**.
6. Use **AI Copilot** to simulate downstream delay impacts.
7. Export alignment CSV when reporting to management.
