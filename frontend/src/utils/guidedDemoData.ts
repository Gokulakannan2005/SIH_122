import { GuidedDemoStep } from '../types';

export const GUIDED_DEMO_STEPS: GuidedDemoStep[] = [
  {
    id: 'step-1-schedule-upload',
    stepNumber: 1,
    totalSteps: 10,
    title: 'Project Schedule Baseline',
    tagline: 'Lead Planner Schedule Control & Ingestion',
    description:
      'Lead Planner uploads the official project schedule (Primavera P6, MS Project, XLSX, or CSV).',
    explanationWhy:
      'Every project starts with an official baseline. The ingestion engine parses activity IDs, WBS hierarchies, planned dates, disciplines, and equipment tags.',
    targetTab: 'upload',
    targetSelector: '#demo-target-project-schedule, .banner-card, .page-body',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-2-parsed-milestones',
    stepNumber: 2,
    totalSteps: 10,
    title: 'Parsed L5/L6 Milestones',
    tagline: 'Deterministic task coding & cryptographic fingerprints',
    description:
      'The schedule is parsed and stored persistently with standardized L5 identification codes and SHA-256 task fingerprints.',
    explanationWhy:
      'Standardized task hierarchy (WBS Level 5) ensures unambiguous traceability across thousands of engineering deliverables.',
    targetTab: 'schedule-activities',
    targetSelector: '#demo-target-parsed-activities, .table-responsive, .card',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-3-assigned-tasks',
    stepNumber: 3,
    totalSteps: 10,
    title: 'Assigned Field Activities',
    tagline: 'Role-based field supervisor workfront view',
    description:
      'Field Supervisor views planned activities for the current shift with locations, planned percentages, and confirmation statuses.',
    explanationWhy:
      'Supervisors see clear answers to "What am I supposed to do?" without being overwhelmed by unrelated administrative controls.',
    targetTab: 'supervisor-entry',
    targetSelector: '#demo-target-supervisor-tasks, .card',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-4-evidence-submission',
    stepNumber: 4,
    totalSteps: 10,
    title: 'Submit Daily Field Progress',
    tagline: 'Multimodal entry: Text, voice logs, and OCR photo proof',
    description:
      'Supervisor submits actual progress, attaches photo evidence, or speaks a voice report with 5-stage human-in-the-loop OCR verification.',
    explanationWhy:
      'Unstructured site evidence is captured right at the workfront and converted into verifiable equipment tags and progress logs.',
    targetTab: 'supervisor-entry',
    targetSelector: '#demo-target-photo-ocr, .card',
    cardPlacement: 'right',
  },
  {
    id: 'step-5-field-reality',
    stepNumber: 5,
    totalSteps: 10,
    title: 'Field Reality Stream',
    tagline: 'Persistent storage of multi-source site updates',
    description:
      'Submitted field reports are parsed and stored in the unified SQLite database with line-level evidence and timestamps.',
    explanationWhy:
      'Eliminates fragmented paperwork and lost WhatsApp updates by consolidating all field records into a persistent audit trail.',
    targetTab: 'site-updates',
    targetSelector: '#demo-target-field-reality, .field-reports-split-view, .card',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-6-field-inbox',
    stepNumber: 6,
    totalSteps: 10,
    title: 'Planner Submissions Inbox',
    tagline: 'Incoming supervisor updates queued for reconciliation',
    description:
      'Lead Planner receives real-time field submissions with instant auto-matched counts and flagged review items.',
    explanationWhy:
      'Creates a clean operational bridge between the field execution team and project management office.',
    targetTab: 'upload',
    targetSelector: '#demo-target-field-inbox, .card',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-7-ai-matching',
    stepNumber: 7,
    totalSteps: 10,
    title: 'Deterministic AI Matching',
    tagline: '4-factor confidence scoring & human verification gate',
    description:
      'The engine matches site evidence against planned milestones using Keywords (50%), Discipline (20%), Area (15%), and Fuzzy Similarity (15%).',
    explanationWhy:
      'Transparent mathematical scoring eliminates black-box AI errors while empowering planners to approve or relink with cryptographic sign-off.',
    targetTab: 'planner-review',
    targetSelector: '#demo-target-ai-matching, .review-detail-pane, .card',
    cardPlacement: 'bottom-left',
  },
  {
    id: 'step-8-schedule-versions',
    stepNumber: 8,
    totalSteps: 10,
    title: 'Schedule Version Control',
    tagline: 'Scope differentials, revisions, and baseline activation',
    description:
      'Lead Planner uploads a revised schedule, reviews the change summary (+12 new, ~27 modified, ↔41 date shifts), and activates Rev-03.',
    explanationWhy:
      'Preserves full historical baseline versions without silently overwriting previous project state.',
    targetTab: 'upload',
    targetSelector: '#demo-target-version-control, .card',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-9-field-sync',
    stepNumber: 9,
    totalSteps: 10,
    title: 'Field Synchronization',
    tagline: 'Supervisor receives schedule change notification',
    description:
      'Field Supervisor receives a focused "What\'s Changed" notification and 1-click acknowledgement for their specific workfront.',
    explanationWhy:
      'Ensures site crews are immediately synchronized with the latest approved engineering milestones.',
    targetTab: 'supervisor-entry',
    targetSelector: '#demo-target-schedule-update-banner, #demo-target-supervisor-tasks, .card',
    cardPlacement: 'bottom-right',
  },
  {
    id: 'step-10-delay-intelligence',
    stepNumber: 10,
    totalSteps: 10,
    title: 'Synchronized Intelligence',
    tagline: 'Non-destructive forward delay simulation & project control',
    description:
      'Simulate supply chain delays, calculate critical path slippage, and view Earned Value metrics on shared persistent data.',
    explanationWhy:
      'Both roles operate on one shared reality — turning field updates into actionable predictive intelligence.',
    targetTab: 'copilot',
    targetSelector: '#demo-target-delay-simulation, .card',
    cardPlacement: 'bottom-right',
    actionLabel: 'Finish Tour →',
  },
];

