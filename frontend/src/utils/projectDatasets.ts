/**
 * Multi-Project Datasets Engine
 * Generates realistic schedule activities, WBS codes, equipment tags, site updates,
 * version revisions, and field submissions for IOCL-P4, ONGC-D9, and BPCL-Kochi.
 */
import {
  ScheduleActivity,
  SiteUpdate,
  ScheduleVersion,
  FieldSubmissionInboxItem,
  SystemNotification,
  MatchResult,
  PlannerDecision,
  AuditLog,
} from '../types';
import { SAMPLE_EVIDENCE_IMAGES } from './sampleImages';

export interface ProjectDatasetBundle {
  schedule: ScheduleActivity[];
  siteUpdates: SiteUpdate[];
  matchResults: Record<string, MatchResult>;
  plannerDecisions: Record<string, PlannerDecision>;
  auditLogs: AuditLog[];
  scheduleVersions: ScheduleVersion[];
  fieldSubmissions: FieldSubmissionInboxItem[];
  systemNotifications: SystemNotification[];
}

// ---------------------------------------------------------------------------
// PROJECT 1: IOCL Refinery Expansion - P4 (IOCL-P4)
// ---------------------------------------------------------------------------
const IOCL_SCHEDULE: ScheduleActivity[] = [
  {
    activityId: 'CIV-L6-001',
    wbs: '1.1.1',
    activityName: 'Excavate Main Pump Foundation Bay',
    discipline: 'Civil',
    plannedStart: '2026-08-15',
    plannedFinish: '2026-08-25',
    area: 'Unit-01 Pump Bay',
    aliases: ['pump foundation excavation', 'civil pit excavation', 'pump bay soil cut'],
    rawAliases: 'pump foundation excavation, civil pit excavation',
    l5Code: 'IOCL.P4.U01.CIV.L5.001',
    taskHash: 'A1B2C3D4',
    progressPercent: 100,
    status: 'Completed',
    varianceDays: 0,
  },
  {
    activityId: 'CIV-L6-002',
    wbs: '1.1.2',
    activityName: 'Cast & Grout Pump Foundation Plinths',
    discipline: 'Civil',
    plannedStart: '2026-08-26',
    plannedFinish: '2026-09-04',
    area: 'Unit-01 Pump Bay',
    aliases: ['concrete pour', 'pump foundation curing', 'plinth casting', 'baseplate grout'],
    rawAliases: 'concrete pour, pump foundation curing, plinth casting',
    l5Code: 'IOCL.P4.U01.CIV.L5.002',
    taskHash: 'C4D5E6F7',
    progressPercent: 100,
    status: 'Completed',
    varianceDays: 0,
  },
  {
    activityId: 'PIP-L6-011',
    wbs: '2.1.1',
    activityName: 'Fabricate Spool Line 24-CW-017 in Yard',
    discipline: 'Piping',
    plannedStart: '2026-08-28',
    plannedFinish: '2026-09-02',
    area: 'Fabrication Yard',
    aliases: ['spool fabrication', 'cw spool welding', '24-cw-017 fabrication'],
    rawAliases: 'spool fabrication, cw spool welding, 24-cw-017 fabrication',
    l5Code: 'IOCL.P4.FAB.PIP.L5.011',
    taskHash: 'E7F8A1B2',
    progressPercent: 100,
    status: 'Completed',
    varianceDays: 0,
  },
  {
    activityId: 'PIP-L6-012',
    wbs: '2.1.2',
    activityName: 'Erect & Align Line 24-CW-017 Cooling Water Spool',
    discipline: 'Piping',
    plannedStart: '2026-09-03',
    plannedFinish: '2026-09-06',
    area: 'Unit-01 Pump Bay',
    aliases: ['erect 24-cw-017', 'cw spool erection', 'cooling water header placement', 'spool alignment'],
    rawAliases: 'erect 24-cw-017, cw spool erection, cooling water header placement',
    l5Code: 'IOCL.P4.U01.PIP.L5.012',
    taskHash: 'D7A9F4B2',
    progressPercent: 75,
    status: 'In Progress',
    varianceDays: 2,
    criticalPath: true,
  },
  {
    activityId: 'PIP-L6-013',
    wbs: '2.1.3',
    activityName: 'Weld Field Joints & NDT Clearance Line 24-CW-017',
    discipline: 'Piping',
    plannedStart: '2026-09-07',
    plannedFinish: '2026-09-10',
    area: 'Unit-01 Pump Bay',
    aliases: ['weld field joints 24-cw-017', 'radiography test cw line', 'ndt clearance'],
    rawAliases: 'weld field joints 24-cw-017, radiography test cw line',
    l5Code: 'IOCL.P4.U01.PIP.L5.013',
    taskHash: 'F3B9D1A2',
    progressPercent: 30,
    status: 'In Progress',
    varianceDays: 1,
  },
  {
    activityId: 'PIP-L6-015',
    wbs: '2.2.1',
    activityName: 'Modular Pipe Rack Tier-2 Spool Tie-ins',
    discipline: 'Piping',
    plannedStart: '2026-09-01',
    plannedFinish: '2026-09-08',
    area: 'Unit-02 Utility Corridor',
    aliases: ['pipe rack tie-ins', 'tier-2 spool placement', 'utility rack piping'],
    rawAliases: 'pipe rack tie-ins, tier-2 spool placement',
    l5Code: 'IOCL.P4.U02.PIP.L5.015',
    taskHash: 'B2C3D4E5',
    progressPercent: 85,
    status: 'In Progress',
    varianceDays: -3,
  },
  {
    activityId: 'ELE-L6-021',
    wbs: '3.1.1',
    activityName: 'Install 415V Switchgear Feeder Cable Tray Tier-2',
    discipline: 'Electrical',
    plannedStart: '2026-09-04',
    plannedFinish: '2026-09-09',
    area: 'Unit-04 Substation',
    aliases: ['cable tray installation', '415v switchgear feed', 'mcc-415v tray pull'],
    rawAliases: 'cable tray installation, 415v switchgear feed, mcc-415v',
    l5Code: 'IOCL.P4.U04.ELE.L5.021',
    taskHash: 'C3D4E5F6',
    progressPercent: 60,
    status: 'In Progress',
    varianceDays: 0,
  },
  {
    activityId: 'ELE-L6-022',
    wbs: '3.1.2',
    activityName: 'Transformer Substation Heavy Lift & Busbar Alignment',
    discipline: 'Electrical',
    plannedStart: '2026-09-05',
    plannedFinish: '2026-09-08',
    area: 'Unit-04 Substation',
    aliases: ['transformer placement', 'crane lift transformer', '50t-crane-01 heavy lift'],
    rawAliases: 'transformer placement, crane lift transformer, 50t-crane-01',
    l5Code: 'IOCL.P4.U04.ELE.L5.022',
    taskHash: 'E5F6A1B2',
    progressPercent: 35,
    status: 'Delayed',
    varianceDays: 4,
    criticalPath: true,
  },
  {
    activityId: 'INS-L6-031',
    wbs: '4.1.1',
    activityName: 'Calibrate & Install Pump Bay Suction Pressure Transmitters',
    discipline: 'Instrumentation',
    plannedStart: '2026-09-08',
    plannedFinish: '2026-09-12',
    area: 'Unit-01 Pump Bay',
    aliases: ['pressure transmitter calibration', 'pt-101a loop test', 'instrument impulse line'],
    rawAliases: 'pressure transmitter calibration, pt-101a loop test',
    l5Code: 'IOCL.P4.U01.INS.L5.031',
    taskHash: 'A9B8C7D6',
    progressPercent: 20,
    status: 'In Progress',
    varianceDays: 0,
  },
  {
    activityId: 'HSE-L6-041',
    wbs: '5.1.1',
    activityName: 'Perform Scaffolding & Heavy Lift Safety Audit',
    discipline: 'HSE',
    plannedStart: '2026-09-01',
    plannedFinish: '2026-09-08',
    area: 'All Refinery Workfronts',
    aliases: ['crane safety inspection', 'scaffolding green tag audit', 'lifting permit clearance'],
    rawAliases: 'crane safety inspection, scaffolding green tag audit',
    l5Code: 'IOCL.P4.HSE.L5.041',
    taskHash: 'B8C7D6E5',
    progressPercent: 100,
    status: 'Completed',
    varianceDays: 0,
  },
];

const IOCL_SITE_UPDATES: SiteUpdate[] = [
  {
    id: 'XLSX-ROW-PIP-SEP05-01',
    sourceFile: 'piping_progress.xlsx',
    sourceType: 'planner_batch',
    reportDate: '2026-09-05',
    extractedDescription: 'CW spool fabrication completed in yard for 24-CW-017',
    rawText: '24-CW-017 Spool fabrication and beveling completed at yard weld bay. NDT cleared.',
    discipline: 'Piping',
    area: 'Fabrication Yard',
    eventStatus: 'Completed',
    supervisor: 'R. Sharma',
    confirmedTag: '24-CW-017',
    images: [
      {
        id: 'IMG-XLSX-ROW-PIP-SEP05-01-1',
        url: SAMPLE_EVIDENCE_IMAGES.pipeWeld,
        type: 'completion',
        caption: 'Visual QA Inspection: Weld seam 24-CW-017 completed with full penetration.',
        timestamp: '2026-09-05 14:22',
        supervisor: 'R. Sharma',
        filename: 'PHOTO_CW_017_WELD_QA.jpg',
        sha256Hash: 'a7c3f910e52b89d412c091ea28f73b6490e21bc08192a543881efac99d428901',
        ocrStatus: 'success',
        ocrConfidence: 94,
        confirmedTag: '24-CW-017',
        confirmedBy: 'supervisor',
      },
    ],
  },
  {
    id: 'TXT-PARAGRAPH-01',
    sourceFile: 'daily_report.txt',
    sourceType: 'supervisor_upload',
    reportDate: '2026-09-06',
    extractedDescription: '24 inch CW spool erected near pump bay with alignment ongoing',
    rawText: 'Cooling water pipe section near Pump Bay was erected today. Alignment in progress.',
    discipline: 'Piping',
    area: 'Unit-01 Pump Bay',
    eventStatus: 'In Progress',
    supervisor: 'Rajesh Kumar',
    confirmedTag: '24-CW-017',
  },
  {
    id: 'TXT-PARAGRAPH-02',
    sourceFile: 'daily_report.txt',
    sourceType: 'supervisor_upload',
    reportDate: '2026-09-04',
    extractedDescription: 'Pump foundation excavation completed and raft concrete poured',
    rawText: 'Pump foundation excavation completed in morning shift. Concrete plinths cured.',
    discipline: 'Civil',
    area: 'Unit-01 Pump Bay',
    eventStatus: 'Completed',
    supervisor: 'K. Verma',
    confirmedTag: 'CIV-L6-002',
    images: [
      {
        id: 'IMG-TXT-PARAGRAPH-02-1',
        url: SAMPLE_EVIDENCE_IMAGES.pumpFoundation,
        type: 'completion',
        caption: 'Concrete Pour & Curing Checklist Verified for Pump Foundation.',
        timestamp: '2026-09-04 11:15',
        supervisor: 'K. Verma',
        filename: 'CIV_FDN_CONCRETE_POUR_04.jpg',
        sha256Hash: 'bc4190ea3810f274a01c9b4e72a819d40e1bc09a827364810feac88d92718290',
        ocrStatus: 'success',
        ocrConfidence: 89,
        confirmedTag: 'CIV-L6-002',
        confirmedBy: 'supervisor',
      },
    ],
  },
  {
    id: 'TXT-PARAGRAPH-03',
    sourceFile: 'daily_report.txt',
    sourceType: 'supervisor_upload',
    reportDate: '2026-09-05',
    extractedDescription: '50T Mobile crane hydraulic seal ruptured during transformer lift',
    rawText: 'Mobile crane 50T-CRANE-01 hydraulic line ruptured during substation lift. Erection paused.',
    discipline: 'Electrical',
    area: 'Unit-04 Substation',
    eventStatus: 'In Progress',
    supervisor: 'M. Khan',
    issueFlag: '50T Mobile Crane breakdown on site - hydraulic oil seal replacement in progress.',
    issueSeverity: 'critical',
    confirmedTag: '50T-CRANE-01',
    images: [
      {
        id: 'IMG-TXT-PARAGRAPH-03-1',
        url: SAMPLE_EVIDENCE_IMAGES.craneIssue,
        type: 'issue',
        caption: 'CRITICAL BLOCKER: Crane hydraulic line ruptured. Erection paused.',
        timestamp: '2026-09-05 09:30',
        supervisor: 'M. Khan',
        filename: 'CRANE_HYDRAULIC_RUPTURE.jpg',
        sha256Hash: 'f910ea3810f274a01c9b4e72a819d40e1bc09a827364810feac88d92718290fa',
        ocrStatus: 'success',
        ocrConfidence: 96,
        confirmedTag: '50T-CRANE-01',
        confirmedBy: 'supervisor',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// PROJECT 2: ONGC Deepwater Platform Delta D-9 (ONGC-D9)
// ---------------------------------------------------------------------------
const ONGC_SCHEDULE: ScheduleActivity[] = [
  {
    activityId: 'SUB-SEA-101',
    wbs: '1.1.1',
    activityName: 'Subsea Wellhead Manifold WHM-04 Tie-in',
    discipline: 'Piping',
    plannedStart: '2026-08-20',
    plannedFinish: '2026-09-02',
    area: 'Subsea Template Bay 4',
    aliases: ['wellhead tie-in', 'whm-04 connection', 'subsea jumper installation'],
    rawAliases: 'wellhead tie-in, whm-04 connection, subsea jumper installation',
    l5Code: 'ONGC.D9.SUB.L5.101',
    taskHash: 'D9A1B2C3',
    progressPercent: 100,
    status: 'Completed',
    varianceDays: 0,
  },
  {
    activityId: 'PRC-SEP-201',
    wbs: '2.1.1',
    activityName: 'Erect & Secure High Pressure Production Separator SEP-901',
    discipline: 'Civil',
    plannedStart: '2026-08-25',
    plannedFinish: '2026-09-05',
    area: 'Topside Process Deck',
    aliases: ['separator erection', 'sep-901 placement', 'topside separator vessel'],
    rawAliases: 'separator erection, sep-901 placement',
    l5Code: 'ONGC.D9.PRC.L5.201',
    taskHash: 'D9B2C3D4',
    progressPercent: 85,
    status: 'In Progress',
    varianceDays: 1,
    criticalPath: true,
  },
  {
    activityId: 'DRL-DCK-301',
    wbs: '3.1.1',
    activityName: 'Drilling Derrick Modular Mast Alignment & Pinning',
    discipline: 'Civil',
    plannedStart: '2026-09-01',
    plannedFinish: '2026-09-07',
    area: 'Drilling Substructure',
    aliases: ['derrick alignment', 'mast pinning', 'drilling rig structure'],
    rawAliases: 'derrick alignment, mast pinning',
    l5Code: 'ONGC.D9.DRL.L5.301',
    taskHash: 'D9C3D4E5',
    progressPercent: 70,
    status: 'In Progress',
    varianceDays: 0,
  },
  {
    activityId: 'GAS-CMP-401',
    wbs: '4.1.1',
    activityName: 'Install Centrifugal Gas Compressor K-301 Skid',
    discipline: 'Piping',
    plannedStart: '2026-09-04',
    plannedFinish: '2026-09-12',
    area: 'Compressor Module C-2',
    aliases: ['gas compressor skid', 'k-301 installation', 'compressor lube oil tie-in'],
    rawAliases: 'gas compressor skid, k-301 installation',
    l5Code: 'ONGC.D9.CMP.L5.401',
    taskHash: 'D9D4E5F6',
    progressPercent: 40,
    status: 'In Progress',
    varianceDays: 2,
    criticalPath: true,
  },
  {
    activityId: 'MAR-FLR-501',
    wbs: '5.1.1',
    activityName: 'Flare Boom Tip Flare-Tip-02 Rigging & Erection',
    discipline: 'Civil',
    plannedStart: '2026-09-06',
    plannedFinish: '2026-09-10',
    area: 'Flare Boom Structure',
    aliases: ['flare boom erection', 'flare tip installation', 'flare-tip-02 rigging'],
    rawAliases: 'flare boom erection, flare tip installation',
    l5Code: 'ONGC.D9.FLR.L5.501',
    taskHash: 'D9E5F6A1',
    progressPercent: 25,
    status: 'In Progress',
    varianceDays: 0,
  },
  {
    activityId: 'ELE-GEN-601',
    wbs: '6.1.1',
    activityName: 'Emergency Diesel Generator EDG-01 Commissioning & Load Test',
    discipline: 'Electrical',
    plannedStart: '2026-09-02',
    plannedFinish: '2026-09-08',
    area: 'Emergency Power Module',
    aliases: ['edg-01 load test', 'emergency generator commissioning', 'diesel generator run'],
    rawAliases: 'edg-01 load test, emergency generator commissioning',
    l5Code: 'ONGC.D9.ELE.L5.601',
    taskHash: 'D9F6A1B2',
    progressPercent: 90,
    status: 'In Progress',
    varianceDays: -1,
  },
  {
    activityId: 'HSE-SEA-701',
    wbs: '7.1.1',
    activityName: 'Offshore Sea Survival & Lifeboat Launch Davit Clearance',
    discipline: 'HSE',
    plannedStart: '2026-08-30',
    plannedFinish: '2026-09-06',
    area: 'Escape Craft Stations',
    aliases: ['lifeboat davit test', 'marine safety inspection', 'offshore hse clearance'],
    rawAliases: 'lifeboat davit test, marine safety inspection',
    l5Code: 'ONGC.D9.HSE.L5.701',
    taskHash: 'D9A9B8C7',
    progressPercent: 100,
    status: 'Completed',
    varianceDays: 0,
  },
];

const ONGC_SITE_UPDATES: SiteUpdate[] = [
  {
    id: 'ONGC-LOG-01',
    sourceFile: 'offshore_shift_log.txt',
    sourceType: 'supervisor_upload',
    reportDate: '2026-09-05',
    extractedDescription: 'Subsea manifold WHM-04 jumper connected and pressure tested to 5000 PSI',
    rawText: 'Subsea wellhead manifold WHM-04 tie-in completed by dive team. Hydrostatic hold 5000 PSI verified.',
    discipline: 'Piping',
    area: 'Subsea Template Bay 4',
    eventStatus: 'Completed',
    supervisor: 'S. Ramanathan (Dive Supervisor)',
    confirmedTag: 'WHM-04',
  },
  {
    id: 'ONGC-LOG-02',
    sourceFile: 'offshore_shift_log.txt',
    sourceType: 'supervisor_upload',
    reportDate: '2026-09-06',
    extractedDescription: 'Separator SEP-901 vessel mounted on topside deck; torqueing hold-down bolts',
    rawText: 'Production separator SEP-901 lifted onto topside process deck. Alignment within 2mm tolerance.',
    discipline: 'Civil',
    area: 'Topside Process Deck',
    eventStatus: 'In Progress',
    supervisor: 'V. Naidu (Topside Lead)',
    confirmedTag: 'SEP-901',
  },
  {
    id: 'ONGC-LOG-03',
    sourceFile: 'offshore_shift_log.txt',
    sourceType: 'supervisor_upload',
    reportDate: '2026-09-06',
    extractedDescription: 'Gas compressor K-301 skid alignment delayed due to offshore sea swell',
    rawText: 'Compressor K-301 heavy lift deferred 24 hours due to 3.5m wave swell at Kakinada deepwater site.',
    discipline: 'Piping',
    area: 'Compressor Module C-2',
    eventStatus: 'In Progress',
    supervisor: 'V. Naidu (Topside Lead)',
    issueFlag: 'Heavy swell hold (>3m waves) delaying crane lift on compressor skid K-301.',
    issueSeverity: 'critical',
    confirmedTag: 'K-301',
  },
];

// ---------------------------------------------------------------------------
// PROJECT 3: BPCL Kochi Clean Fuel Extension (BPCL-CK4)
// ---------------------------------------------------------------------------
const BPCL_SCHEDULE: ScheduleActivity[] = [
  {
    activityId: 'CDU-CIV-001',
    wbs: '1.1.1',
    activityName: 'Driven Precast Piling for CDU-III Distillation Column Base',
    discipline: 'Civil',
    plannedStart: '2026-08-10',
    plannedFinish: '2026-08-28',
    area: 'CDU-III Column Bay',
    aliases: ['cdu piling', 'distillation column foundation', 'deep pile driving'],
    rawAliases: 'cdu piling, distillation column foundation',
    l5Code: 'BPCL.CK4.CDU.CIV.001',
    taskHash: 'BPC1A2B3',
    progressPercent: 100,
    status: 'Completed',
    varianceDays: 0,
  },
  {
    activityId: 'CDU-COL-012',
    wbs: '2.1.1',
    activityName: 'Heavy Tandem Crane Lift: Crude Column CDU-T201 (65m Height)',
    discipline: 'Civil',
    plannedStart: '2026-08-30',
    plannedFinish: '2026-09-06',
    area: 'CDU-III Column Bay',
    aliases: ['tandem lift cdu-t201', 'distillation column erection', 'cdu-t201 placement'],
    rawAliases: 'tandem lift cdu-t201, distillation column erection',
    l5Code: 'BPCL.CK4.CDU.MEC.012',
    taskHash: 'BPC2B3C4',
    progressPercent: 90,
    status: 'In Progress',
    varianceDays: 1,
    criticalPath: true,
  },
  {
    activityId: 'HCU-RCT-021',
    wbs: '3.1.1',
    activityName: 'Hydrocracker Heavy Reactor HCU-R101 Foundation Tie-in',
    discipline: 'Piping',
    plannedStart: '2026-09-02',
    plannedFinish: '2026-09-09',
    area: 'Hydrocracker Complex',
    aliases: ['hydrocracker reactor placement', 'hcu-r101 tie-in', 'heavy wall piping'],
    rawAliases: 'hydrocracker reactor placement, hcu-r101 tie-in',
    l5Code: 'BPCL.CK4.HCU.PIP.021',
    taskHash: 'BPC3C4D5',
    progressPercent: 65,
    status: 'In Progress',
    varianceDays: 0,
  },
  {
    activityId: 'FRN-PIP-031',
    wbs: '4.1.1',
    activityName: 'Pre-flash Furnace F-101 Radiant Coil Tube Fitting',
    discipline: 'Piping',
    plannedStart: '2026-09-04',
    plannedFinish: '2026-09-12',
    area: 'Furnace F-101 Area',
    aliases: ['furnace tube fitting', 'furnace-f101 coils', 'radiant coil welding'],
    rawAliases: 'furnace tube fitting, furnace-f101 coils',
    l5Code: 'BPCL.CK4.FRN.PIP.031',
    taskHash: 'BPC4D5E6',
    progressPercent: 45,
    status: 'In Progress',
    varianceDays: 2,
    criticalPath: true,
  },
  {
    activityId: 'ELE-SUB-041',
    wbs: '5.1.1',
    activityName: '11kV Substation Switchyard Transformer TR-11KV-02 Energization',
    discipline: 'Electrical',
    plannedStart: '2026-09-01',
    plannedFinish: '2026-09-07',
    area: 'Substation SS-04',
    aliases: ['11kv transformer test', 'tr-11kv-02 energization', 'switchyard cabling'],
    rawAliases: '11kv transformer test, tr-11kv-02 energization',
    l5Code: 'BPCL.CK4.ELE.041',
    taskHash: 'BPC5E6F7',
    progressPercent: 100,
    status: 'Completed',
    varianceDays: -1,
  },
  {
    activityId: 'INS-DCS-051',
    wbs: '6.1.1',
    activityName: 'Honeywell Experion DCS Marshalling Cabinet Loop Check',
    discipline: 'Instrumentation',
    plannedStart: '2026-09-05',
    plannedFinish: '2026-09-14',
    area: 'Central Control Building',
    aliases: ['dcs loop check', 'marshalling cabinet wiring', 'experion loop verification'],
    rawAliases: 'dcs loop check, marshalling cabinet wiring',
    l5Code: 'BPCL.CK4.INS.051',
    taskHash: 'BPC6F7A1',
    progressPercent: 30,
    status: 'In Progress',
    varianceDays: 0,
  },
];

const BPCL_SITE_UPDATES: SiteUpdate[] = [
  {
    id: 'BPCL-LOG-01',
    sourceFile: 'kochi_field_log.txt',
    sourceType: 'supervisor_upload',
    reportDate: '2026-09-05',
    extractedDescription: 'Crude column CDU-T201 tandem lift completed and plumb line verticality verified',
    rawText: 'Main distillation column CDU-T201 erected using 800T crawler crane. Verticality within API specs.',
    discipline: 'Civil',
    area: 'CDU-III Column Bay',
    eventStatus: 'Completed',
    supervisor: 'M. Varghese (Area Engineer)',
    confirmedTag: 'CDU-T201',
  },
  {
    id: 'BPCL-LOG-02',
    sourceFile: 'kochi_field_log.txt',
    sourceType: 'supervisor_upload',
    reportDate: '2026-09-06',
    extractedDescription: 'Furnace F-101 radiant coil welding in progress on west radiant bank',
    rawText: 'Radiant coil tubes on Furnace-F101 fitted. 14 alloy joints welded in today shift.',
    discipline: 'Piping',
    area: 'Furnace F-101 Area',
    eventStatus: 'In Progress',
    supervisor: 'M. Varghese (Area Engineer)',
    confirmedTag: 'FURNACE-F101',
  },
];

// ---------------------------------------------------------------------------
// Main Dataset Resolver
// ---------------------------------------------------------------------------
export function getProjectDatasetBundle(projectId: string): ProjectDatasetBundle {
  let schedule = IOCL_SCHEDULE;
  let siteUpdates = IOCL_SITE_UPDATES;
  let contractCode = 'IOCL-P4-REFINERY';

  if (projectId === 'ongc-delta' || projectId === 'ongc-d9') {
    schedule = ONGC_SCHEDULE;
    siteUpdates = ONGC_SITE_UPDATES;
    contractCode = 'ONGC-OFFSHORE-D9';
  } else if (projectId === 'bpcl-kochi' || projectId === 'lnt-metro-3') {
    schedule = BPCL_SCHEDULE;
    siteUpdates = BPCL_SITE_UPDATES;
    contractCode = 'BPCL-KOCHI-CK4';
  }

  // Pre-generate deterministic match results & planner decisions
  const matchResults: Record<string, MatchResult> = {};
  const plannerDecisions: Record<string, PlannerDecision> = {};
  const auditLogs: AuditLog[] = [];

  siteUpdates.forEach(update => {
    let candidateActivity = schedule.find(act => {
      const tag = update.confirmedTag?.toUpperCase();
      if (tag && (act.activityId.toUpperCase().includes(tag) || act.activityName.toUpperCase().includes(tag))) {
        return true;
      }
      return act.discipline === update.discipline && act.area === update.area;
    });

    if (!candidateActivity) {
      candidateActivity = schedule.find(act => act.discipline === update.discipline) || schedule[0];
    }

    const confidence = update.confirmedTag ? 94 : 78;
    const category = confidence >= 85 ? 'ready' : 'review';

    matchResults[update.id] = {
      updateId: update.id,
      candidateActivityId: candidateActivity.activityId,
      confidenceScore: confidence,
      category,
      matchReasons: [
        `Discipline match: ${update.discipline}`,
        `Spatial area match: ${update.area}`,
        ...(update.confirmedTag ? [`Confirmed equipment tag: ${update.confirmedTag}`] : []),
      ],
      scoreBreakdown: {
        keywordScore: update.confirmedTag ? 45 : 30,
        disciplineScore: 20,
        areaScore: 15,
        fuzzyScore: 14,
      },
    };

    if (category === 'ready') {
      plannerDecisions[update.id] = {
        updateId: update.id,
        linkedActivityId: candidateActivity.activityId,
        status: 'approved',
        actionType: 'approve',
        plannerNote: `Auto-verified against ${contractCode} schedule baseline`,
        updatedAt: '2026-09-08T08:00:00Z',
        l5Code: candidateActivity.l5Code,
        taskHash: candidateActivity.taskHash,
        digitalSignature: `SIG-${(candidateActivity.taskHash || 'BASE').substring(0, 6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      };

      auditLogs.push({
        id: `AUDIT-INIT-${update.id}`,
        timestamp: '2026-09-08T08:00:00Z',
        updateId: update.id,
        rawText: update.rawText,
        sourceFile: update.sourceFile,
        action: 'Baseline Execution Alignment Verified',
        originalConfidence: confidence,
        originalCategory: category,
        finalActivityId: candidateActivity.activityId,
        plannerNote: `Classified for active project ${contractCode}`,
        userRole: 'admin',
      });
    }
  });

  const scheduleVersions: ScheduleVersion[] = [
    {
      versionId: 'Rev-01',
      projectId: contractCode,
      versionName: 'Rev-01 (Contract Award Baseline)',
      uploadedAt: '2026-08-01T09:00:00Z',
      uploadedBy: 'Lead Planning Engineer',
      fileType: 'Primavera P6 XLSX',
      activitiesCount: schedule.length,
      isActive: false,
      changeSummary: { newCount: 0, modCount: 0, dateChanges: 0, removedCount: 0 },
    },
    {
      versionId: 'Rev-02',
      projectId: contractCode,
      versionName: 'Rev-02 (Mid-Term Execution Schedule)',
      uploadedAt: '2026-08-25T14:30:00Z',
      uploadedBy: 'Lead Planning Engineer',
      fileType: 'Primavera P6 XLSX',
      activitiesCount: schedule.length,
      isActive: false,
      changeSummary: { newCount: 2, modCount: 5, dateChanges: 8, removedCount: 0 },
    },
    {
      versionId: 'Rev-03',
      projectId: contractCode,
      versionName: 'Rev-03 (Active Approved Production Schedule)',
      uploadedAt: '2026-09-08T08:00:00Z',
      uploadedBy: 'Lead Planning Engineer',
      fileType: 'Primavera P6 Export XLSX',
      activitiesCount: schedule.length,
      isActive: true,
      changeSummary: { newCount: 4, modCount: 12, dateChanges: 16, removedCount: 0 },
    },
  ];

  const fieldSubmissions: FieldSubmissionInboxItem[] = [
    {
      id: `SUB-${contractCode}-01`,
      projectId: contractCode,
      submittedAt: '2026-09-08T10:42:00Z',
      submittedBy: 'Field Site Supervisor',
      userId: 'usr-supervisor-01',
      sourceType: 'Daily Field Report',
      fileName: 'daily_report.txt',
      extractedCount: siteUpdates.length,
      autoMatchedCount: Object.values(plannerDecisions).length,
      reviewCount: siteUpdates.length - Object.values(plannerDecisions).length,
      status: 'pending_review',
      notes: `${contractCode} daily shift progress and equipment inspection log.`,
    },
  ];

  const systemNotifications: SystemNotification[] = [
    {
      id: `NOTIF-${contractCode}-01`,
      targetRole: 'planner',
      type: 'action_required',
      title: `Field Submissions Active for ${contractCode}`,
      message: `Verified progress entries logged for active workfronts.`,
      timestamp: '2026-09-08T10:45:00Z',
      isRead: false,
      deepLinkTab: 'planner-review',
    },
    {
      id: `NOTIF-${contractCode}-02`,
      targetRole: 'supervisor',
      type: 'update',
      title: `Active Schedule Version: Rev-03`,
      message: `Lead Planner synchronized latest baseline milestones for ${contractCode}.`,
      timestamp: '2026-09-08T08:05:00Z',
      isRead: false,
      deepLinkTab: 'supervisor-entry',
      acknowledged: false,
    },
  ];

  return {
    schedule,
    siteUpdates,
    matchResults,
    plannerDecisions,
    auditLogs,
    scheduleVersions,
    fieldSubmissions,
    systemNotifications,
  };
}
