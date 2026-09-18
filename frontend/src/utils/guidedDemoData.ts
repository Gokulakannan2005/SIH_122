import { GuidedDemoStep, NavigationTab } from '../types';

export interface DemoScheduleItem {
  code: string;
  name: string;
  wbs: string;
  discipline: string;
  area: string;
  plannedProgress: number;
  actualProgress: number;
  status: 'Behind Schedule' | 'On Track' | 'Pending Verification';
}

export interface DemoCandidateMatch {
  rank: number;
  activityCode: string;
  activityName: string;
  confidence: number;
  isTopMatch: boolean;
  reasons: string[];
}

export interface DemoAuditLogEntry {
  time: string;
  title: string;
  detail: string;
  badge?: string;
  badgeType?: 'primary' | 'success' | 'warning' | 'info';
}

export const DEMO_BASELINE_SCHEDULE: DemoScheduleItem[] = [
  {
    code: 'PIP-L6-012',
    name: 'Erect Line 24-CW-017',
    wbs: '2.1.2',
    discipline: 'Piping',
    area: 'Pump Bay',
    plannedProgress: 100,
    actualProgress: 60,
    status: 'Behind Schedule',
  },
  {
    code: 'PIP-L6-011',
    name: 'Fabricate Line 24-CW-017 spool',
    wbs: '2.1.1',
    discipline: 'Piping',
    area: 'Fabrication Yard',
    plannedProgress: 100,
    actualProgress: 100,
    status: 'On Track',
  },
  {
    code: 'CIV-L6-002',
    name: 'Cast pump foundation concrete',
    wbs: '1.1.2',
    discipline: 'Civil',
    area: 'Pump Bay',
    plannedProgress: 100,
    actualProgress: 100,
    status: 'On Track',
  },
  {
    code: 'ELE-L6-022',
    name: 'Pull MCC feeder cable',
    wbs: '3.1.2',
    discipline: 'Electrical',
    area: 'Pump Bay',
    plannedProgress: 40,
    actualProgress: 20,
    status: 'Pending Verification',
  },
];

export const DEMO_SCENARIO_1 = {
  updateText: 'CW 24-inch spool was erected near Pump Bay today; alignment is in progress.',
  source: 'daily_report.txt (Item 3, Piping Section)',
  supervisor: 'Rajesh Kumar (Field Lead)',
  location: 'Pump Bay',
  candidates: [
    {
      rank: 1,
      activityCode: 'PIP-L6-012',
      activityName: 'Erect Line 24-CW-017',
      confidence: 92,
      isTopMatch: true,
      reasons: [
        'Equipment Tag 24-CW-017 — Exact tag & alias match (+40 pts)',
        'Discipline Piping — Strict WBS discipline consistency (+20 pts)',
        'Area Pump Bay — Workfront location proximity (+15 pts)',
        'Action "Erected spool" ≈ "Erect Line" — Token similarity (+17 pts)',
      ],
    },
    {
      rank: 2,
      activityCode: 'PIP-L6-011',
      activityName: 'Fabricate Line 24-CW-017 spool',
      confidence: 54,
      isTopMatch: false,
      reasons: [
        'Tag 24-CW-017 matched, but location is Fabrication Yard (not Pump Bay)',
        'Erection verb does not match fabrication lifecycle stage',
      ],
    },
    {
      rank: 3,
      activityCode: 'PIP-L6-015',
      activityName: 'Erect Line 18-FW-008',
      confidence: 32,
      isTopMatch: false,
      reasons: ['Piping trade match only; conflicting equipment tag (18-FW vs 24-CW) and area (Filter Bay)'],
    },
  ],
  verifiedActivity: {
    code: 'PIP-L6-012',
    name: 'Erect Line 24-CW-017',
    wbs: '2.1.2',
    planned: 100,
    actual: 60,
    variance: -40,
    status: 'DELAYED (+2 DAYS)',
  },
};

export const DEMO_SCENARIO_2 = {
  updateText: 'Crew reported cable pulling, but feeder number was not mentioned.',
  source: 'daily_report.txt (Item 9, Electrical Section)',
  question: 'Can this update be confidently linked to one schedule activity?',
  statusText: 'REVIEW REQUIRED',
  candidates: [
    {
      rank: 1,
      activityCode: 'ELE-L6-022',
      activityName: 'Pull MCC feeder cable',
      confidence: 63,
      isTopMatch: false,
      reasons: ['Electrical discipline match', 'Cable pulling action verb overlap', 'Missing feeder tag confirmation'],
    },
    {
      rank: 2,
      activityCode: 'ELE-L6-023',
      activityName: 'Terminate MCC feeder cable',
      confidence: 59,
      isTopMatch: false,
      reasons: ['Electrical trade overlap', 'Pump Bay location match', 'Cable termination sequence dependency'],
    },
  ],
};

export const DEMO_SCENARIO_3 = {
  updateText: 'A small-bore drain line was installed near the pump. [Not in baseline]',
  source: 'daily_report.txt (Item 6, Piping Section)',
  statusText: 'POTENTIAL OUT-OF-BASELINE ACTIVITY',
  causePoints: [
    'No matching L5/L6 activity found in Primavera P6 schedule baseline',
    'Unplanned auxiliary piping scope installed to handle pit drain overflow',
    'Flagged for Lead Planner classification — never silently discarded',
    'Supports contractor variation claim and change-order tracking',
  ],
};

export const DEMO_AUDIT_TRAIL: DemoAuditLogEntry[] = [
  {
    time: '10:31 AM',
    title: 'Field report ingested',
    detail: 'Heterogeneous Daily Progress Report (daily_report.txt) ingested with 10 discipline items.',
    badge: 'Raw Evidence',
    badgeType: 'info',
  },
  {
    time: '10:32 AM',
    title: 'Activity extracted',
    detail: 'Extracted: Discipline: Piping • Activity: Spool Erection • Tag: 24-CW-017 • Area: Pump Bay • Status: In Progress.',
    badge: 'Structured Event',
    badgeType: 'primary',
  },
  {
    time: '10:32 AM',
    title: 'Candidate L6 identified',
    detail: 'Top match: PIP-L6-012 (Erect Line 24-CW-017) at 92% confidence (Operating Threshold: 75%).',
    badge: '92% Confidence',
    badgeType: 'success',
  },
  {
    time: '10:33 AM',
    title: 'Planner confirmed link',
    detail: 'Lead Planning Engineer verified link to PIP-L6-012. SHA-256 evidence fingerprint committed to audit trail.',
    badge: 'Planner Verified',
    badgeType: 'success',
  },
  {
    time: '10:33 AM',
    title: 'Actual progress updated',
    detail: 'Actual Start recorded as 03 Sep, progress updated to 60%, schedule variance recalculated to +2 days.',
    badge: 'Schedule Synced',
    badgeType: 'primary',
  },
];

export const GUIDED_DEMO_STEPS: GuidedDemoStep[] = [
  {
    id: 'step-1-baseline',
    stepNumber: 1,
    totalSteps: 17,
    title: '1. Project Baseline',
    tagline: 'THIS IS THE PLAN',
    description:
      'Primavera P6 baseline containing structured L5/L6 schedule activities, WBS hierarchy, planned start/finish dates, and trade disciplines. For example: PIP-L6-012 (Erect Line 24-CW-017).',
    explanationWhy: 'Establishes the formal planned project baseline before field execution starts.',
    whatIsHappening: 'Viewing the Primavera P6 schedule baseline with activity PIP-L6-012.',
    whyItMatters: 'Planners live in this structured world, while field contractors execute on the ground.',
    whatToInteract: 'Click on activity PIP-L6-012 in the baseline table to highlight its planned duration (3 days) and WBS 2.1.2 location.',
    whatToNotice: 'The baseline schedule has clean WBS codes and planned milestones, but zero direct connection to daily field execution.',
    targetTab: 'schedule-activities',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-2-inbox',
    stepNumber: 2,
    totalSteps: 17,
    title: '2. Field Data Inbox',
    tagline: 'HETEROGENEOUS CAPTURE',
    description:
      'Execution data arrives from varied sources: Daily Progress Reports (TXT), Piping Spreadsheets (XLSX), scanned diaries, and conversational voice notes.',
    explanationWhy: 'Proves DATUM ingests heterogeneous formats rather than requiring rigid proprietary forms.',
    whatIsHappening: 'Demonstrating multiple input streams: daily_report.txt, piping_progress.xlsx, and voice notes.',
    whyItMatters: 'Removes reporting barriers for site contractors across civil, piping, and electrical trades.',
    whatToInteract: 'Click between the source format chips (Daily Log TXT, Piping XLSX, Site Diary, Voice Note) to view incoming data.',
    whatToNotice: 'DATUM accepts real-world heterogeneous formats rather than forcing site contractors to use rigid proprietary forms.',
    targetTab: 'upload',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-3-daily-report',
    stepNumber: 3,
    totalSteps: 17,
    title: '3. Daily Progress Report',
    tagline: 'SOURCE A: FREE-TEXT LOG',
    description:
      'Unstructured field text: "CW 24-inch spool was erected near Pump Bay today; alignment is in progress. Work started on 03 Sep."',
    explanationWhy: 'Shows the real-world informal wording reported by site supervisors.',
    whatIsHappening: 'Reviewing unstructured daily_report.txt Item 3 from site supervisor.',
    whyItMatters: 'Manual matching of informal field notes against 5,000+ activities takes hours and leads to human error.',
    whatToInteract: 'Inspect the raw text quote and observe supervisor metadata (Rajesh Kumar, Unit-01 Pump Bay 2).',
    whatToNotice: 'Field text uses colloquial terms ("CW 24-inch spool", "alignment in progress") rather than formal P6 activity descriptions.',
    targetTab: 'site-updates',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-4-spreadsheet',
    stepNumber: 4,
    totalSteps: 17,
    title: '4. Discipline Spreadsheet',
    tagline: 'SOURCE B: PIPING SPREADSHEET',
    description:
      'Discipline-specific progress table (piping_progress.xlsx) with isometric numbers, cut lengths, spool IDs, and weld joints.',
    explanationWhy: 'Demonstrates simultaneous ingestion of tabular contractor spreadsheets.',
    whatIsHappening: 'Parsing structured XLSX rows alongside free-text daily reports.',
    whyItMatters: 'Reconciles granular engineering quantities with high-level schedule milestones.',
    whatToInteract: 'Hover over tabular spreadsheet rows to view line number (24-CW-017), spool tag (SP-04), and weld joint status (W-01).',
    whatToNotice: 'DATUM ingests contractor tabular sheets and aligns them to the same master execution pipeline.',
    targetTab: 'upload',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-5-extraction',
    stepNumber: 5,
    totalSteps: 17,
    title: '5. Structured Extraction',
    tagline: 'EVIDENCE UNDERSTANDING',
    description:
      'DATUM extracts: Discipline (Piping), Activity (Spool Erection), Equipment Tag (24-CW-017), Area (Pump Bay), Actual Start (03 Sep), and Status (In Progress, 60%).',
    explanationWhy: 'Visualizes the critical step: Raw Field Evidence → Structured Activity Event.',
    whatIsHappening: 'Entity and intent extraction structuring natural language into standardized fields.',
    whyItMatters: 'Prepares field evidence for deterministic schedule linking.',
    whatToInteract: 'Click the extracted entity badges (Discipline, Activity, Equipment Tag, Area, Actual Start) to verify extracted attributes.',
    whatToNotice: 'Raw unstructured text is cleanly converted into structured attributes with zero data loss.',
    targetTab: 'site-updates',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-left',
  },
  {
    id: 'step-6-talk-to-datum',
    stepNumber: 6,
    totalSteps: 17,
    title: '6. Talk to DATUM',
    tagline: 'CONVERSATIONAL VOICE/TEXT',
    description:
      'A site supervisor reports naturally: "CW line 24-CW-017 erection started at Pump Bay 2 this morning." DATUM extracts structured fields with Confirm/Edit dialog.',
    explanationWhy: 'Fulfills the core conversational field capture requirement for zero-friction reporting.',
    whatIsHappening: 'Conversational field assistant extracting structured activity parameters from natural speech or text.',
    whyItMatters: 'Provides a zero-friction mobile entry point for site supervisors without opening complex PM software.',
    whatToInteract: 'Click one of the quick prompt chips or type a message, then click [CONFIRM & LINK TO SCHEDULE].',
    whatToNotice: 'Talk to DATUM is not a generic chatbot—it extracts structured fields and injects them directly into the matching pipeline.',
    targetTab: 'supervisor-entry',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-7-l5-l6-match',
    stepNumber: 7,
    totalSteps: 17,
    title: '7. L5/L6 Schedule Matching',
    tagline: 'DETERMINISTIC LINKING',
    description:
      'DATUM matches the extracted event to PIP-L6-012 (Erect Line 24-CW-017) with a 92% operational evidence score.',
    explanationWhy: 'Bridges physical field progress to formal WBS activity node.',
    whatIsHappening: 'Ranking schedule activities and selecting the top candidate.',
    whyItMatters: 'Automates schedule linking in seconds instead of requiring tedious manual weekly reconciliation.',
    whatToInteract: 'Click the top match card [PIP-L6-012] to inspect candidate ranking and compare with alternative activities.',
    whatToNotice: 'DATUM isolates PIP-L6-012 with a 92% match score, well above the 75% operating threshold.',
    targetTab: 'planner-review',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-8-match-evidence',
    stepNumber: 8,
    totalSteps: 17,
    title: '8. Explainable Evidence Breakdown',
    tagline: 'OPERATIONAL EVIDENCE (NOT PROBABILITY)',
    description:
      'Transparent 4-factor proof: Equipment Tag (+40), Discipline (+25), Area (+20), and Text Similarity (+15). Operating Threshold: 75%.',
    explanationWhy: 'Engineers require transparent proof rather than an opaque black-box AI score.',
    whatIsHappening: 'Reviewing the explainability card behind the 92% match.',
    whyItMatters: 'Establishes defensibility and trust with planning engineers.',
    whatToInteract: 'Hover over the 4 factor progress bars (Tag 40/40, Discipline 25/25, Area 20/20, Text 7/15) and read the threshold tooltip.',
    whatToNotice: '75% is an explicit prototype operating threshold based on weighted evidence, NOT a statistical probability.',
    targetTab: 'planner-review',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-left',
  },
  {
    id: 'step-9-ambiguity',
    stepNumber: 9,
    totalSteps: 17,
    title: '9. Ambiguous Case',
    tagline: 'INSUFFICIENT EVIDENCE DETECTED',
    description:
      'Update: "Crew reported cable pulling in switchgear room, but feeder tag was obscured by dust." Competing candidates: ELE-L6-022 (63%) vs ELE-L6-023 (59%).',
    explanationWhy: 'Demonstrates handling of uncertain or partial field descriptions.',
    whatIsHappening: 'System flags update as REVIEW REQUIRED instead of making a blind guess.',
    whyItMatters: 'Prevents corrupting schedule baselines with incorrect auto-links.',
    whatToInteract: 'Compare the two close candidates (ELE-L6-022 at 63% vs ELE-L6-023 at 59%) in the side-by-side card.',
    whatToNotice: 'DATUM recognizes uncertainty and refuses to guess blindly—it flags REVIEW REQUIRED for human resolution.',
    targetTab: 'planner-review',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-10-verification',
    stepNumber: 10,
    totalSteps: 17,
    title: '10. Planner Verification',
    tagline: 'HUMAN-IN-THE-LOOP GOVERNANCE',
    description:
      'The Lead Planner clicks [CONFIRM LINK] to verify ELE-L6-022. State changes immediately, updating schedule actuals and audit logs.',
    explanationWhy: 'Automation for clear cases + Human judgment for ambiguous cases.',
    whatIsHappening: 'Planner executes human verification action.',
    whyItMatters: 'Maintains complete engineering authority over the master schedule: AI recommends, human decides.',
    whatToInteract: 'Click [CONFIRM LINK] to verify ELE-L6-022 or test [RELINK] / [CLASSIFY AS POTENTIAL OUT-OF-BASELINE].',
    whatToNotice: 'Verification is not cosmetic—clicking the button immediately mutates underlying state and logs an immutable audit event.',
    targetTab: 'planner-review',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-11-unplanned-work',
    stepNumber: 11,
    totalSteps: 17,
    title: '11. Potential Out-of-Baseline Work',
    tagline: 'NEVER SILENTLY DISCARDED',
    description:
      'Update: "A small-bore drain line was installed near the pump." No baseline activity matches. DATUM flags it as Potential Out-of-Baseline Activity.',
    explanationWhy: 'Surfaces unplanned contractor work for scope and variation management.',
    whatIsHappening: 'Flagging non-baseline execution for planner classification.',
    whyItMatters: 'Uncovers unauthorized or out-of-scope work early.',
    whatToInteract: 'Click [Route to Planner for Variation Assessment] or [Assign to Pending Scope Queue].',
    whatToNotice: 'DATUM never silently discards field execution—it highlights out-of-baseline work for commercial claim control.',
    targetTab: 'planner-review',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-12-actual-progress',
    stepNumber: 12,
    totalSteps: 17,
    title: '12. Real-Time Actual Progress',
    tagline: 'PLANNED VS ACTUAL DATES',
    description:
      'PIP-L6-012 updated: Planned Start: 01 Sep vs Actual Start: 03 Sep. Progress: 60%. Status: Delayed.',
    explanationWhy: 'Demonstrates immediate schedule synchronization upon verification.',
    whatIsHappening: 'Live recalculation of milestone progress percentage and dates.',
    whyItMatters: 'Provides real-time visibility into actual site performance.',
    whatToInteract: 'Inspect the dual progress bars (Planned 100% vs Actual 60%) and the highlighted start date deviation (01 Sep -> 03 Sep).',
    whatToNotice: 'Schedule dates and completion percentages are live, dynamic reflections of verified field logs.',
    targetTab: 'schedule-activities',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-13-schedule-variance',
    stepNumber: 13,
    totalSteps: 17,
    title: '13. Schedule Variance',
    tagline: '+2 DAYS VARIANCE DETECTED',
    description:
      'Schedule variance recalculated to +2 days. Slip on critical path cooling water spool propagates forward delay warning.',
    explanationWhy: 'Connects verified actual progress to critical path impact.',
    whatIsHappening: 'Displaying schedule variance and critical path indicators.',
    whyItMatters: 'Enables timely corrective intervention before delay cascades across packages.',
    whatToInteract: 'Click on the Variance Insight card (+2 Days / -40% Gap) to see affected successor activities.',
    whatToNotice: 'The system highlights critical path drag immediately when piping alignment slips, not weeks later at monthly review.',
    targetTab: 'schedule-activities',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-left',
  },
  {
    id: 'step-14-structured-dataset',
    stepNumber: 14,
    totalSteps: 17,
    title: '14. Structured Actual Dataset',
    tagline: 'DISCIPLINE-TAGGED ACTUALS TABLE',
    description:
      'Clean, queryable execution dataset: Date, Project, Discipline, Activity ID, L5 Code, L6 Description, Actual Dates, Progress, Status, Confidence, and Source.',
    explanationWhy: 'Fulfills the enterprise requirement to produce a clean structured actual-progress dataset.',
    whatIsHappening: 'Inspecting the structured execution table.',
    whyItMatters: 'Turns messy site updates into structured enterprise data.',
    whatToInteract: 'Filter the table by discipline (\'Piping\', \'Civil\', \'Electrical\') or click [Export Canonical CSV].',
    whatToNotice: 'Unstructured text from day 1 is now a structured, queryable database table with full provenance tags.',
    targetTab: 'site-updates',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-15-intelligence',
    stepNumber: 15,
    totalSteps: 17,
    title: '15. Execution Intelligence',
    tagline: 'DELAYS & RECURRING BOTTLENECKS',
    description:
      'Piping discipline performance: 6 activities, +1.8d average variance. Recurring bottleneck identified: Spool Alignment Delays (4 occurrences).',
    explanationWhy: 'Transforms actual execution data into operational performance intelligence.',
    whatIsHappening: 'Analyzing discipline trends and bottleneck patterns.',
    whyItMatters: 'Moves from reactive status reporting to proactive delay discovery.',
    whatToInteract: 'Click the \'Spool Alignment\' bottleneck card to view its 4 recurring occurrences and schedule drag analysis.',
    whatToNotice: 'Intelligence is derived directly from actual site records—identifying systemic fit-up delays before the next phase.',
    targetTab: 'dashboard',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-16-project-memory',
    stepNumber: 16,
    totalSteps: 17,
    title: '16. Project Memory',
    tagline: 'REUSABLE INSTITUTIONAL KNOWLEDGE',
    description:
      'Preserves execution lessons for future project planning: Duration learning (3d planned vs 5d actual), empirical productivity norms (18.5 inch-dia/day), and "Ask Project Memory" query box.',
    explanationWhy: 'Ensures execution knowledge is not lost when the project closes.',
    whatIsHappening: 'Querying institutional memory for future project baselines.',
    whyItMatters: 'The bridge from project data to institutional memory.',
    whatToInteract: 'Click any query chip (\'What is the actual duration of CW line erection?\' or \'What causes pump bay delays?\') to see instant dataset-backed answers.',
    whatToNotice: 'The system benchmarks planned estimates against observed field reality (5.2 days actual vs 3.0 days planned baseline).',
    targetTab: 'dashboard',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-left',
  },
  {
    id: 'step-17-audit-trail',
    stepNumber: 17,
    totalSteps: 17,
    title: '17. Traceable Audit Trail',
    tagline: 'IMMUTABLE PROVENANCE',
    description:
      'Chronological audit provenance: Source → Extraction → Match → Verification → Schedule Update with SHA-256 evidence fingerprints.',
    explanationWhy: 'Guarantees 100% auditability and legal defensibility for all linking decisions.',
    whatIsHappening: 'Reviewing immutable decision provenance logs.',
    whyItMatters: 'Essential for contract claims, delay dispute resolution, and forensic engineering.',
    whatToInteract: 'Click any audit log entry to expand the SHA-256 evidence fingerprint and actor attribution.',
    whatToNotice: 'Every change is traceable back to the raw source file and the verified planner decision—no unverified tampering.',
    targetTab: 'audit-trail',
    targetSelector: '.sih-presentation-view',
    cardPlacement: 'bottom-right',
  },
];
