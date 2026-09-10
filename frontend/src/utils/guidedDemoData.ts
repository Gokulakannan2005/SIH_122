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
    code: 'CW-101',
    name: 'Install Cooling Water Line',
    wbs: '2.1.4.1',
    discipline: 'Piping',
    area: 'Unit-01 Pump Bay',
    plannedProgress: 80,
    actualProgress: 60,
    status: 'Behind Schedule',
  },
  {
    code: 'CW-102',
    name: 'Align Cooling Water Pipeline',
    wbs: '2.1.4.2',
    discipline: 'Piping',
    area: 'Unit-01 Pump Bay',
    plannedProgress: 45,
    actualProgress: 30,
    status: 'Behind Schedule',
  },
  {
    code: 'PMP-201',
    name: 'Install Pump Assembly',
    wbs: '2.2.1.0',
    discipline: 'Mechanical',
    area: 'Pump Bay South',
    plannedProgress: 90,
    actualProgress: 90,
    status: 'On Track',
  },
  {
    code: 'ELE-301',
    name: 'Cable Installation',
    wbs: '3.1.2.0',
    discipline: 'Electrical',
    area: 'Substation Bay 2',
    plannedProgress: 20,
    actualProgress: 20,
    status: 'Pending Verification',
  },
];

export const DEMO_SCENARIO_1 = {
  updateText: 'Cooling water pipe section near Pump Bay was erected today. Alignment work is still in progress.',
  source: 'Daily Site Log #09-122 (09:10 AM)',
  supervisor: 'Rajesh Kumar (Field Lead)',
  location: 'Unit-01 Pump Bay',
  candidates: [
    {
      rank: 1,
      activityCode: 'CW-101',
      activityName: 'Install Cooling Water Line',
      confidence: 91,
      isTopMatch: true,
      reasons: [
        'Cooling Water — Strong terminology match',
        'Pipeline / Pipe — Activity context match',
        'Pump Bay — Location context match',
        'Erected — Installation activity context',
      ],
    },
    {
      rank: 2,
      activityCode: 'CW-102',
      activityName: 'Align Cooling Water Pipeline',
      confidence: 74,
      isTopMatch: false,
      reasons: [
        'Cooling Water — Terminology match',
        'Alignment — Subordinate activity context in progress',
      ],
    },
    {
      rank: 3,
      activityCode: 'PMP-201',
      activityName: 'Install Pump Assembly',
      confidence: 18,
      isTopMatch: false,
      reasons: ['Pump Bay — Location match only; differing equipment scope'],
    },
  ],
  verifiedActivity: {
    code: 'CW-101',
    name: 'Install Cooling Water Line',
    wbs: '2.1.4.1',
    planned: 80,
    actual: 60,
    variance: -20,
    status: 'BEHIND SCHEDULE',
  },
};

export const DEMO_SCENARIO_2 = {
  updateText: 'Piping work continued today.',
  source: 'Daily Site Shift Log #09-140',
  question: 'Can this update be confidently linked to one schedule activity?',
  statusText: 'REVIEW REQUIRED',
  candidates: [
    {
      rank: 1,
      activityCode: 'CW-101',
      activityName: 'Install Cooling Water Line',
      confidence: 52,
      isTopMatch: false,
      reasons: ['Generic keyword overlap ("Piping")', 'Missing equipment code', 'Missing location descriptor'],
    },
    {
      rank: 2,
      activityCode: 'CW-102',
      activityName: 'Align Cooling Water Pipeline',
      confidence: 48,
      isTopMatch: false,
      reasons: ['Generic keyword overlap ("Piping")', 'Unspecified work stage'],
    },
    {
      rank: 3,
      activityCode: 'FW-105',
      activityName: 'Install Fire Water Line',
      confidence: 44,
      isTopMatch: false,
      reasons: ['Piping discipline category overlap', 'Ambiguous scope context'],
    },
  ],
};

export const DEMO_SCENARIO_3 = {
  updateText: 'Temporary bypass pipeline was installed due to an unexpected field obstruction.',
  source: 'Incident & Site Progress Report #09-188',
  statusText: 'UNPLANNED WORK',
  causePoints: [
    'Scope change in response to physical obstruction',
    'Additional work outside initial project baseline',
    'Rework / temporary diversion required',
    'Missing schedule activity in current WBS baseline',
  ],
};

export const DEMO_AUDIT_TRAIL: DemoAuditLogEntry[] = [
  {
    time: '09:10 AM',
    title: 'Site update submitted',
    detail: 'Field Supervisor submitted raw progress log: "Cooling water pipe section near Pump Bay was erected today..."',
    badge: 'Raw Input',
    badgeType: 'info',
  },
  {
    time: '09:10 AM',
    title: 'System analyzed update',
    detail: 'AI Hybrid Ingestion Engine matched terminology, discipline, location (Pump Bay), and action verbs.',
    badge: 'Analysis Complete',
    badgeType: 'primary',
  },
  {
    time: '09:10 AM',
    title: 'Suggested: CW-101 — Install Cooling Water Line',
    detail: 'Top candidate ranked at 91% confidence based on 4 verifiable matching factors.',
    badge: '91% Confidence',
    badgeType: 'success',
  },
  {
    time: '09:12 AM',
    title: 'Planner verified link',
    detail: 'Lead Planning Engineer verified link to activity CW-101. Decision cryptographically committed to audit log.',
    badge: 'Human Approved',
    badgeType: 'success',
  },
  {
    time: '09:12 AM',
    title: 'Schedule activity updated',
    detail: 'CW-101 actual progress updated to 60%. Schedule intelligence recalculates Planned vs Actual variance.',
    badge: 'Schedule Synced',
    badgeType: 'primary',
  },
];

export const GUIDED_DEMO_STEPS: GuidedDemoStep[] = [
  {
    id: 'step-1-baseline-schedule',
    stepNumber: 1,
    totalSteps: 11,
    title: 'Step 1 — Introduce the Problem',
    tagline: 'THIS IS THE PLANNED PROJECT WORLD',
    description:
      'Large infrastructure projects contain thousands of structured schedule activities. Before work starts, the planned schedule is organized into precise codes, WBS hierarchy, and baseline targets.',
    explanationWhy:
      'This establishes the structured project world (Primavera P6 / MS Project baseline). Every planned activity has an ID, planned start/finish, and scope.',
    whatIsHappening: 'Viewing the official structured baseline schedule with activities CW-101, CW-102, PMP-201, and ELE-301.',
    whyItMatters: 'Planners live in this structured world, but site teams work in the physical world.',
    whatToInteract: 'Review the planned schedule list and click "Next" to see what comes from the field.',
    whatToNotice: 'Notice the structured codes (CW-101, CW-102) and planned progress percentages.',
    targetTab: 'schedule-activities',
    targetSelector: '#demo-target-schedule-list, .schedule-table-container, .page-body',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-2-unstructured-update',
    stepNumber: 2,
    totalSteps: 11,
    title: 'Step 2 — Show Real-World Site Update',
    tagline: 'UNSTRUCTURED FIELD REALITY',
    description:
      'Actual progress from the site is reported through unstructured daily updates, text logs, or WhatsApp messages. For example: "Cooling water pipe section near Pump Bay was erected today. Alignment work is still in progress."',
    explanationWhy:
      'Demonstrates the core friction: Which exact schedule activity does this real-world unstructured update belong to?',
    whatIsHappening: 'A real-world site supervisor submitted a descriptive progress sentence.',
    whyItMatters: 'Manual matching across 5,000+ activities causes delays, mistakes, and lost visibility.',
    whatToInteract: 'Observe the text report, then proceed to run ProjectPulse analysis.',
    whatToNotice: 'The unstructured text contains mentions of "cooling water", "pump bay", and "erected".',
    targetTab: 'site-updates',
    targetSelector: '#demo-target-unstructured-report, #demo-target-site-update-box, .page-body',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-3-start-analysis',
    stepNumber: 3,
    totalSteps: 11,
    title: 'Step 3 — Start AI Hybrid Analysis',
    tagline: 'TRANSPARENT HYBRID MATCHING',
    description:
      'Click "Analyze Update" to launch the deterministic hybrid engine. Watch the 6-stage analysis extract terminology, detect location, query activities, and calculate confidence.',
    explanationWhy:
      'ProjectPulse does not use a black-box prompt. It uses transparent hybrid matching combining domain terminology, spatial location, and activity context.',
    whatIsHappening: 'The system runs a fast, controlled 2–4s analysis pipeline.',
    whyItMatters: 'Judges see that ProjectPulse is fast, explainable, and purpose-built for engineering workflows.',
    whatToInteract: 'Click the spotlighted "Analyze Update" button or click "Next".',
    whatToNotice: 'The live checkmark sequence verifying each analytical stage.',
    targetTab: 'site-updates',
    targetSelector: '#demo-target-analyze-btn, .analyze-action-button, .page-body',
    cardPlacement: 'bottom-right',
    actionLabel: 'Analyze Update ⚡',
  },
  {
    id: 'step-4-candidate-matches',
    stepNumber: 4,
    totalSteps: 11,
    title: 'Step 4 — Ranked Candidate Matches',
    tagline: 'EXPLAINABLE EVIDENCE BREAKDOWN',
    description:
      'ProjectPulse ranks schedule candidates and provides transparent mathematical evidence for WHY the match was chosen: Terminology (Cooling Water), Context (Pipeline), Location (Pump Bay), and Action (Erected).',
    explanationWhy:
      'ProjectPulse combines semantic understanding with structured project context rather than returning an unexplainable black-box score.',
    whatIsHappening: 'Top candidates: 1. CW-101 (91%), 2. CW-102 (74%), 3. PMP-201 (18%).',
    whyItMatters: 'Engineers require transparent proof before trusting any automated recommendation.',
    whatToInteract: 'Review the "WHY THIS MATCH?" evidence breakdown card.',
    whatToNotice: 'The 4 green checkmarks proving terminology, location, and activity context matches.',
    targetTab: 'site-updates',
    targetSelector: '#demo-target-candidate-matches, .candidate-match-card, .page-body',
    cardPlacement: 'bottom-left',
  },
  {
    id: 'step-5-high-confidence-decision',
    stepNumber: 5,
    totalSteps: 11,
    title: 'Step 5 — High-Confidence Decision',
    tagline: 'SUGGEST WITH VERIFIABLE CONFIDENCE',
    description:
      'With 91% confidence and verified multi-factor evidence, ProjectPulse suggests CW-101 (Install Cooling Water Line) and offers a 1-click verification gate.',
    explanationWhy:
      'When sufficient evidence exists, ProjectPulse confidently suggests the most relevant schedule activity and invites human verification.',
    whatIsHappening: 'The system highlights CW-101 with a "HIGH CONFIDENCE" badge.',
    whyItMatters: 'Planners save 90% of search time while retaining full governance.',
    whatToInteract: 'Click the spotlighted "Verify Link" button to link the field update to the schedule.',
    whatToNotice: 'The confidence score (91%) and the clear "Verify Link" action.',
    targetTab: 'planner-review',
    targetSelector: '#demo-target-verify-btn, .verify-action-button, .page-body',
    cardPlacement: 'bottom-right',
    actionLabel: 'Verify Link ✓',
  },
  {
    id: 'step-6-verified-connection',
    stepNumber: 6,
    totalSteps: 11,
    title: 'Step 6 — The Verified Connection',
    tagline: 'FIELD REALITY CONNECTED TO SCHEDULE',
    description:
      '✓ LINK VERIFIED. ProjectPulse has bridged real-world field information to the structured project schedule baseline.',
    explanationWhy:
      'This is the central moment of the demo: turning an unstructured text sentence into a structured, verified schedule node.',
    whatIsHappening: 'Visual connection between the site report and activity CW-101.',
    whyItMatters: 'The system has successfully eliminated manual activity searching.',
    whatToInteract: 'Observe the visual connection bridge and click "Next" to see progress intelligence.',
    whatToNotice: 'The green "✓ LINK VERIFIED" indicator and bidirectional connection.',
    targetTab: 'planner-review',
    targetSelector: '#demo-target-verified-bridge, .verified-connection-card, .page-body',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-7-planned-vs-actual',
    stepNumber: 7,
    totalSteps: 11,
    title: 'Step 7 — Planned vs Actual Progress',
    tagline: 'TURNING UPDATES INTO SCHEDULE INTELLIGENCE',
    description:
      'Once field updates are connected to schedule activities, actual progress can be compared against the original plan: Planned 80% vs Actual 60% → STATUS: BEHIND SCHEDULE.',
    explanationWhy:
      'ProjectPulse is far more than text matching. It converts field updates into real-time schedule intelligence and variance tracking.',
    whatIsHappening: 'Showing the updated activity progress comparison and schedule variance.',
    whyItMatters: 'Project managers instantly spot delays weeks before monthly reports are compiled.',
    whatToInteract: 'Inspect the progress bar comparison (80% planned vs 60% actual).',
    whatToNotice: 'The red "BEHIND SCHEDULE" alert and 20% progress gap.',
    targetTab: 'dashboard',
    targetSelector: '#demo-target-progress-intelligence, .planned-vs-actual-card, .page-body',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-8-ambiguous-update',
    stepNumber: 8,
    totalSteps: 11,
    title: 'Step 8 — Ambiguous Update (Recognizing Uncertainty)',
    tagline: 'WHEN CONTEXT IS INSUFFICIENT',
    description:
      'What happens with a vague update like: "Piping work continued today."? Can this be confidently linked? Matches: CW-101 (52%), CW-102 (48%), FW-105 (44%) → STATUS: REVIEW REQUIRED.',
    explanationWhy:
      'ProjectPulse recognizes uncertainty. Instead of hallucinating a false match, it routes ambiguous updates to the human planner.',
    whatIsHappening: 'The system encounters low-confidence candidates (52%, 48%, 44%).',
    whyItMatters: 'Zero tolerance for AI hallucinations in critical infrastructure projects.',
    whatToInteract: 'Observe how the system flags "REVIEW REQUIRED" rather than auto-linking.',
    whatToNotice: 'The close match scores and the system refusal to guess blindly.',
    targetTab: 'planner-review',
    targetSelector: '#demo-target-ambiguous-card, .review-required-card, .page-body',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-9-human-review-workbench',
    stepNumber: 9,
    totalSteps: 11,
    title: 'Step 9 — Human Review Workbench',
    tagline: 'AI RECOMMENDS. HUMAN DECIDES.',
    description:
      'The planner review workbench gives human planners 4 unambiguous controls: [Approve Suggested Match], [Select Different Activity], [Mark as Unplanned Work], or [Reject Update].',
    explanationWhy:
      'Human-in-the-loop governance ensures project managers retain 100% control over official project records.',
    whatIsHappening: 'Planner reviewing the ambiguous update with 4 clear action buttons.',
    whyItMatters: 'Demonstrates clear division of responsibility: AI automates the search; humans make the decision.',
    whatToInteract: 'Click any action button to test deterministic response, then click "Next".',
    whatToNotice: 'The 4 clear action buttons in the decision matrix.',
    targetTab: 'planner-review',
    targetSelector: '#demo-target-review-workbench, .planner-action-bar, .page-body',
    cardPlacement: 'bottom-left',
  },
  {
    id: 'step-10-unplanned-work',
    stepNumber: 10,
    totalSteps: 11,
    title: 'Step 10 — Unplanned Work Detection',
    tagline: 'NO MATCH IS ALSO A MEANINGFUL RESULT',
    description:
      'Site update: "Temporary bypass pipeline was installed due to an unexpected field obstruction." Result: NO RELIABLE SCHEDULE MATCH FOUND → ⚠ UNPLANNED WORK.',
    explanationWhy:
      'Instead of forcing every update into an existing activity, ProjectPulse identifies scope changes, rework, or missing activities outside the plan.',
    whatIsHappening: 'Detection of work outside the baseline with root-cause categorization.',
    whyItMatters: 'Unplanned work is the #1 cause of hidden budget overruns in megaprojects.',
    whatToInteract: 'Review the unplanned work classification and click "Next" for the audit trail.',
    whatToNotice: 'The 4 possible causes (Scope change, Additional work, Rework, Missing WBS item).',
    targetTab: 'planner-review',
    targetSelector: '#demo-target-unplanned-work, .unplanned-work-card, .page-body',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-11-audit-trail',
    stepNumber: 11,
    totalSteps: 11,
    title: 'Step 11 — Complete Audit Trail',
    tagline: 'FULL TRACEABILITY & PROVENANCE',
    description:
      'Every step is preserved in a tamper-evident audit history: 09:10 AM Update Submitted → 09:10 AM Analyzed → 09:10 AM CW-101 Suggested (91%) → 09:12 AM Planner Verified → 09:12 AM Schedule Updated.',
    explanationWhy:
      'ProjectPulse converts fragmented field updates into structured, traceable schedule intelligence with complete regulatory compliance.',
    whatIsHappening: 'Chronological timeline linking raw update → AI analysis → confidence → planner decision → schedule sync.',
    whyItMatters: 'Disputes, claims, and delay audits can be resolved with cryptographic proof.',
    whatToInteract: 'Inspect the chronological audit timeline and click "Finish Tour" for the summary.',
    whatToNotice: 'The timestamped progression from raw text to verified schedule link.',
    targetTab: 'audit-trail',
    targetSelector: '#demo-target-audit-timeline, .audit-trail-container, .page-body',
    cardPlacement: 'bottom-right',
    actionLabel: 'View Summary 🏆',
  },
];
