import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ScheduleActivity,
  SiteUpdate,
  MatchResult,
  PlannerDecision,
  AuditLog,
  PlannerActionType,
  WorkbenchViewMode,
  WorkbenchSortOption,
  NavigationTab,
  UserRole,
  DensityMode,
  ImageEvidence,
  AppSystemMode,
  OfflineSyncItem,
  ToastNotification,
  ThemeMode,
  UserAccount,
  ApprovalHistoryItem,
  ScheduleVersion,
  FieldSubmissionInboxItem,
  SystemNotification,
} from '../types';
import { parseScheduleCSV, parseDailyReportTXT, parsePipingProgressXLSX } from '../utils/parsers';
import { processAllMatches } from '../utils/matchingEngine';
import { api, HealthResponse } from '../services/api';
import { SAMPLE_EVIDENCE_IMAGES } from '../utils/sampleImages';
import { calculateImageFingerprint } from '../utils/ocrService';
import { parseUTCDateMs } from '../utils/scheduleSimulator';
import { GUIDED_DEMO_STEPS } from '../utils/guidedDemoData';

export type BackendConnectionStatus = 'connected' | 'offline' | 'checking';

export interface SiteUpdatesFilterState {
  discipline: string;
  status: string;
  source: string;
  search: string;
}

interface ProjectContextType {
  schedule: ScheduleActivity[];
  enrichedSchedule: ScheduleActivity[];
  siteUpdates: SiteUpdate[];
  matchResults: Record<string, MatchResult>;
  plannerDecisions: Record<string, PlannerDecision>;
  auditLogs: AuditLog[];
  approvalHistory: ApprovalHistoryItem[];
  refreshApprovalHistory: () => Promise<void>;

  // Schedule Versions & Version Control
  scheduleVersions: ScheduleVersion[];
  activeScheduleVersion: ScheduleVersion | null;
  activateScheduleVersion: (versionId: string) => Promise<void>;
  uploadNewScheduleVersion: (file: File, versionName?: string) => Promise<void>;

  // Field Submissions Inbox
  fieldSubmissions: FieldSubmissionInboxItem[];
  refreshSubmissionsInbox: () => Promise<void>;

  // System Notifications
  systemNotifications: SystemNotification[];
  acknowledgeScheduleUpdates: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;

  // Authentication & User Identity State
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  login: (username: string, passwordPlain: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: (guestRole: 'planner' | 'supervisor') => Promise<void>;
  logout: () => void;

  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  systemMode: AppSystemMode;
  setSystemMode: (mode: AppSystemMode) => void;
  loadScenarioPreset: (scenarioKey: string) => Promise<void>;
  // Backwards compatibility aliases
  demoMode: AppSystemMode;
  setDemoMode: (mode: AppSystemMode) => void;
  loadJudgeDemoScenario: (scenarioKey: string) => Promise<void>;

  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;

  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  densityMode: DensityMode;
  setDensityMode: (mode: DensityMode) => void;

  offlineMode: boolean;
  toggleOfflineMode: () => void;
  offlineSyncQueue: OfflineSyncItem[];
  syncOfflineQueue: () => Promise<void>;

  backendStatus: BackendConnectionStatus;
  backendMetrics: HealthResponse['metrics'] | null;

  workbenchViewMode: WorkbenchViewMode;
  setWorkbenchViewMode: (mode: WorkbenchViewMode) => void;

  sortOption: WorkbenchSortOption;
  setSortOption: (option: WorkbenchSortOption) => void;

  selectedInspectorUpdateId: string | null;
  setSelectedInspectorUpdateId: (id: string | null) => void;

  selectedScheduleActivityId: string | null;
  setSelectedScheduleActivityId: (id: string | null) => void;

  selectedReviewUpdateId: string | null;
  setSelectedReviewUpdateId: (id: string | null) => void;
  selectedAuditUpdateId: string | null;
  setSelectedAuditUpdateId: (id: string | null) => void;

  // Global Action-Feedback Toast Notifications
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;

  // Coordinated Filter Drilldowns
  siteUpdatesFilter: SiteUpdatesFilterState;
  setSiteUpdatesFilter: React.Dispatch<React.SetStateAction<SiteUpdatesFilterState>>;
  plannerQueueFilter: 'review' | 'unplanned' | 'approved' | 'all';
  setPlannerQueueFilter: React.Dispatch<React.SetStateAction<'review' | 'unplanned' | 'approved' | 'all'>>;
  navigateToSiteUpdatesWithFilter: (filter: Partial<SiteUpdatesFilterState>) => void;
  navigateToPlannerReviewWithFilter: (filter: 'review' | 'unplanned' | 'approved' | 'all') => void;
  // Guided Demo Mode & Onboarding
  isGuidedDemoActive: boolean;
  guidedDemoStepIndex: number;
  currentGuidedDemoStep: import('../types').GuidedDemoStep | null;
  startGuidedDemo: () => void;
  nextGuidedDemoStep: () => void;
  prevGuidedDemoStep: () => void;
  jumpToGuidedDemoStep: (stepIndex: number) => void;
  exitGuidedDemo: () => void;
  isWelcomeModalOpen: boolean;
  setIsWelcomeModalOpen: (open: boolean) => void;
  isDemoCompletionModalOpen: boolean;
  setIsDemoCompletionModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  isLoading: boolean;
  loadDemoData: () => Promise<void>;
  handleCustomUpload: (files: { scheduleCsv?: string; dailyReportTxt?: string; pipingProgressXlsx?: ArrayBuffer }) => Promise<void>;
  handleAddNewFieldEntry: (entry: {
    discipline: string;
    description: string;
    rawText: string;
    area: string;
    eventStatus: 'Started' | 'Completed' | 'In Progress';
    quantity?: string;
    supervisor?: string;
    imageFile?: string; // base64 / svg / url
    imageType?: 'completion' | 'issue' | 'progress';
    caption?: string;
    filename?: string;
    fileSize?: number;
    sha256Hash?: string;
    ocrStatus?: 'idle' | 'scanning' | 'success' | 'failed' | 'no_text';
    ocrConfidence?: number;
    ocrRawText?: string;
    ocrDetectedTags?: string[];
    confirmedTag?: string;
    confirmedBy?: 'supervisor' | 'planner' | 'unconfirmed';
    issueFlag?: string;
    issueSeverity?: 'low' | 'medium' | 'critical';
  }) => Promise<void>;
  handleConfirmImageTag: (
    updateId: string,
    imageId: string,
    confirmedTag: string,
    confirmedBy?: 'supervisor' | 'planner'
  ) => Promise<void>;
  handleRemoveImageFromUpdate: (updateId: string, imageId: string) => Promise<void>;
  handlePlannerAction: (
    updateId: string,
    actionType: PlannerActionType,
    targetActivityId?: string | null,
    note?: string
  ) => Promise<void>;
  handleEditUpdate: (updateId: string, updatedFields: Partial<SiteUpdate>) => Promise<void>;
  exportAlignmentCSV: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState<ScheduleActivity[]>([]);
  const [siteUpdates, setSiteUpdates] = useState<SiteUpdate[]>([]);
  const [matchResults, setMatchResults] = useState<Record<string, MatchResult>>({});
  const [plannerDecisions, setPlannerDecisions] = useState<Record<string, PlannerDecision>>({});
  const [isGuidedDemoActive, setIsGuidedDemoActive] = useState<boolean>(false);
  const [activeTabState, setActiveTabState] = useState<NavigationTab>('home');

  const setActiveTab = (tab: NavigationTab) => {
    // If guided demo is running, allow all tour steps without role restrictions or toasts
    if (isGuidedDemoActive) {
      setActiveTabState(tab);
      return;
    }

    // Normal mode: Supervisors can view home, supervisor-entry, site-updates, schedule-activities, dashboard
    // If supervisor manually accesses planner-only administration (planner-review, copilot), gently guide them
    if (currentRole === 'supervisor' && (tab === 'planner-review' || tab === 'copilot')) {
      addToast({
        type: 'info',
        title: 'Lead Planner Perspective',
        message: 'This module is restricted to Lead Planning Engineers.',
      });
      setActiveTabState('supervisor-entry');
      return;
    }
    setActiveTabState(tab);
  };

  const activeTab = activeTabState;
  const [systemMode, setSystemMode] = useState<AppSystemMode>('executive');
  const demoMode = systemMode;
  const setDemoMode = setSystemMode;
  const [workbenchViewMode, setWorkbenchViewMode] = useState<WorkbenchViewMode>('kanban');
  const [sortOption, setSortOption] = useState<WorkbenchSortOption>('confidence-desc');
  const [selectedInspectorUpdateId, setSelectedInspectorUpdateId] = useState<string | null>(null);
  const [selectedScheduleActivityId, setSelectedScheduleActivityId] = useState<string | null>(null);

  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [densityMode, setDensityMode] = useState<DensityMode>('comfortable');
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [offlineSyncQueue, setOfflineSyncQueue] = useState<OfflineSyncItem[]>([]);

  // User Authentication & SQLite Identity State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('datum_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(currentUser);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>([]);

  // Schedule Versions & Version Control State
  const [scheduleVersions, setScheduleVersions] = useState<ScheduleVersion[]>([
    {
      versionId: 'Rev-01',
      projectId: 'IOCL-P4-REFINERY',
      versionName: 'Rev-01 (Contract Award Baseline)',
      uploadedAt: '2026-08-01T09:00:00Z',
      uploadedBy: 'Gokulakannan P. (Lead Planner)',
      fileType: 'Primavera P6 XLSX',
      activitiesCount: 30,
      isActive: false,
      changeSummary: { newCount: 0, modCount: 0, dateChanges: 0, removedCount: 0 },
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
      changeSummary: { newCount: 4, modCount: 8, dateChanges: 12, removedCount: 0 },
    },
    {
      versionId: 'Rev-03',
      projectId: 'IOCL-P4-REFINERY',
      versionName: 'Rev-03 (Active Approved Production Schedule)',
      uploadedAt: '2026-09-08T08:00:00Z',
      uploadedBy: 'Gokulakannan P. (Lead Planner)',
      fileType: 'Primavera P6 Export XLSX',
      activitiesCount: 34,
      isActive: true,
      changeSummary: { newCount: 12, modCount: 27, dateChanges: 41, removedCount: 3 },
    },
  ]);

  const activeScheduleVersion = useMemo(() => {
    return scheduleVersions.find(v => v.isActive) || scheduleVersions[scheduleVersions.length - 1] || null;
  }, [scheduleVersions]);

  // Field Submissions Inbox State
  const [fieldSubmissions, setFieldSubmissions] = useState<FieldSubmissionInboxItem[]>([
    {
      id: 'SUB-2026-0908-01',
      projectId: 'IOCL-P4-REFINERY',
      submittedAt: '2026-09-08T10:42:00Z',
      submittedBy: 'Rajesh Kumar (Field Supervisor)',
      userId: 'usr-supervisor-rajesh',
      sourceType: 'Daily Field Report',
      fileName: 'daily_report.txt',
      extractedCount: 7,
      autoMatchedCount: 5,
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
      extractedCount: 10,
      autoMatchedCount: 10,
      reviewCount: 0,
      status: 'approved',
      notes: 'Piping spool fabrication & hydrostatic test clearance logs.',
    },
  ]);

  // System Notifications State
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([
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
  ]);

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('datum_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('datum_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>('checking');
  const [backendMetrics, setBackendMetrics] = useState<HealthResponse['metrics'] | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedReviewUpdateId, setSelectedReviewUpdateId] = useState<string | null>(null);
  const [selectedAuditUpdateId, setSelectedAuditUpdateId] = useState<string | null>(null);

  // Global Toast Notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Coordinated Filter States
  const [siteUpdatesFilter, setSiteUpdatesFilter] = useState<SiteUpdatesFilterState>({
    discipline: 'ALL',
    status: 'ALL',
    source: 'ALL',
    search: '',
  });
  const [plannerQueueFilter, setPlannerQueueFilter] = useState<'review' | 'unplanned' | 'approved' | 'all'>('review');

  const addToast = (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const id = `TOAST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duration = toast.durationMs ?? (toast.type === 'error' || toast.type === 'warning' ? 6000 : 3800);
    const newToast: ToastNotification = {
      ...toast,
      id,
      timestamp: new Date().toISOString(),
      durationMs: duration,
    };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setToasts(current => current.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const navigateToSiteUpdatesWithFilter = (filter: Partial<SiteUpdatesFilterState>) => {
    setSiteUpdatesFilter(prev => ({
      ...prev,
      ...filter,
    }));
    setActiveTab('site-updates');
  };

  const navigateToPlannerReviewWithFilter = (filter: 'review' | 'unplanned' | 'approved' | 'all') => {
    setPlannerQueueFilter(filter);
    setActiveTab('planner-review');
  };

  // Guided Demo Mode & Welcome Modal State
  const [guidedDemoStepIndex, setGuidedDemoStepIndex] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    // Show welcome modal once on initial visit unless dismissed
    return !localStorage.getItem('datum_onboarding_dismissed');
  });
  const [isDemoCompletionModalOpen, setIsDemoCompletionModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const toggleCommandPalette = () => {
    setIsCommandPaletteOpen(prev => !prev);
  };

  const currentGuidedDemoStep = useMemo(() => {
    if (!isGuidedDemoActive) return null;
    return GUIDED_DEMO_STEPS[guidedDemoStepIndex] || null;
  }, [isGuidedDemoActive, guidedDemoStepIndex]);

  const startGuidedDemo = () => {
    localStorage.setItem('datum_onboarding_dismissed', 'true');
    setIsWelcomeModalOpen(false);
    setIsDemoCompletionModalOpen(false);
    setGuidedDemoStepIndex(0);
    setIsGuidedDemoActive(true);
    const firstStep = GUIDED_DEMO_STEPS[0];
    if (firstStep) {
      setActiveTab(firstStep.targetTab);
    }
  };

  const nextGuidedDemoStep = () => {
    if (guidedDemoStepIndex < GUIDED_DEMO_STEPS.length - 1) {
      const nextIndex = guidedDemoStepIndex + 1;
      setGuidedDemoStepIndex(nextIndex);
      const step = GUIDED_DEMO_STEPS[nextIndex];
      setActiveTab(step.targetTab);
    } else {
      setIsGuidedDemoActive(false);
      setIsDemoCompletionModalOpen(true);
    }
  };

  const prevGuidedDemoStep = () => {
    if (guidedDemoStepIndex > 0) {
      const prevIndex = guidedDemoStepIndex - 1;
      setGuidedDemoStepIndex(prevIndex);
      const step = GUIDED_DEMO_STEPS[prevIndex];
      setActiveTab(step.targetTab);
    }
  };

  const jumpToGuidedDemoStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < GUIDED_DEMO_STEPS.length) {
      setIsGuidedDemoActive(true);
      setIsDemoCompletionModalOpen(false);
      setGuidedDemoStepIndex(stepIndex);
      const step = GUIDED_DEMO_STEPS[stepIndex];
      setActiveTab(step.targetTab);
    }
  };

  const exitGuidedDemo = () => {
    setIsGuidedDemoActive(false);
  };

  // Auto-check backend connection and load dataset on mount
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setIsLoading(true);
    setBackendStatus('checking');

    // 1. Check if backend REST API is available
    const health = await api.checkHealth();
    if (health) {
      setBackendStatus('connected');
      setBackendMetrics(health.metrics);

      // Fetch from backend SQLite
      const backendData = await api.fetchInitialData();
      if (backendData) {
        setSchedule(backendData.schedule);
        setSiteUpdates(backendData.siteUpdates);
        setMatchResults(backendData.matchResults);
        setPlannerDecisions(backendData.plannerDecisions);
        setAuditLogs(backendData.auditLogs);

        const [versions, submissions, notifs] = await Promise.all([
          api.getScheduleVersions(),
          api.getFieldSubmissions(),
          api.getNotifications(),
        ]);
        if (versions && versions.length > 0) setScheduleVersions(versions);
        if (submissions && submissions.length > 0) setFieldSubmissions(submissions);
        if (notifs && notifs.length > 0) setSystemNotifications(notifs);

        setIsLoading(false);
        return;
      }
    }

    // 2. Fallback to client-side standalone mode
    setBackendStatus('offline');
    await loadClientDemoData();
    setIsLoading(false);
  };

  const loadClientDemoData = async () => {
    try {
      const [scheduleRes, txtRes, xlsxRes] = await Promise.all([
        fetch('/demo-data/schedule.csv'),
        fetch('/demo-data/daily_report.txt'),
        fetch('/demo-data/piping_progress.xlsx'),
      ]);

      const csvText = await scheduleRes.text();
      const txtText = await txtRes.text();
      const xlsxBuffer = await xlsxRes.arrayBuffer();

      const parsedSchedule = parseScheduleCSV(csvText);
      const parsedTxtUpdates = parseDailyReportTXT(txtText);
      const parsedXlsxUpdates = parsePipingProgressXLSX(xlsxBuffer);

      let allUpdates = [...parsedXlsxUpdates, ...parsedTxtUpdates];

      // Attach rich sample photo evidence, OCR candidates, confirmed tags & SHA-256 integrity fingerprints
      allUpdates = allUpdates.map(u => {
        if (u.id.includes('PIP-') || u.extractedDescription.toLowerCase().includes('weld') || u.extractedDescription.toLowerCase().includes('spool')) {
          return {
            ...u,
            confirmedTag: '24-CW-017',
            images: [
              {
                id: `IMG-${u.id}-1`,
                url: SAMPLE_EVIDENCE_IMAGES.pipeWeld,
                type: 'completion' as const,
                caption: 'Visual QA Inspection: Weld seam 24-CW-017 completed with full penetration.',
                timestamp: '2026-09-05 14:22',
                supervisor: u.supervisor || 'R. Sharma',
                filename: 'PHOTO_CW_017_WELD_QA.jpg',
                fileSize: 2450890,
                sha256Hash: 'a7c3f910e52b89d412c091ea28f73b6490e21bc08192a543881efac99d428901',
                ocrStatus: 'success' as const,
                ocrConfidence: 94,
                ocrRawText: 'LINE 24-CW-017 SPOOL WELD SEAM #03 NDT CLEARED PUMP BAY',
                ocrDetectedTags: ['24-CW-017', 'CW-017'],
                confirmedTag: '24-CW-017',
                confirmedBy: 'supervisor' as const,
                confirmedAt: '2026-09-05T14:25:00Z',
              },
            ],
          };
        }
        if (u.id.includes('CIV-') || u.extractedDescription.toLowerCase().includes('foundation') || u.extractedDescription.toLowerCase().includes('concrete')) {
          return {
            ...u,
            confirmedTag: 'CIV-L6-002',
            images: [
              {
                id: `IMG-${u.id}-1`,
                url: SAMPLE_EVIDENCE_IMAGES.pumpFoundation,
                type: 'completion' as const,
                caption: 'Concrete Pour & Curing Checklist Verified for Pump Foundation.',
                timestamp: '2026-09-04 11:15',
                supervisor: u.supervisor || 'K. Verma',
                filename: 'CIV_FDN_CONCRETE_POUR_04.jpg',
                fileSize: 3120400,
                sha256Hash: 'bc4190ea3810f274a01c9b4e72a819d40e1bc09a827364810feac88d92718290',
                ocrStatus: 'success' as const,
                ocrConfidence: 89,
                ocrRawText: 'PUMP BAY RAFT FOUNDATION CIV-L6-002 M35 GRADE CONCRETE',
                ocrDetectedTags: ['CIV-L6-002'],
                confirmedTag: 'CIV-L6-002',
                confirmedBy: 'supervisor' as const,
                confirmedAt: '2026-09-04T11:20:00Z',
              },
            ],
          };
        }
        if (u.id.includes('ELE-') || u.extractedDescription.toLowerCase().includes('cable') || u.extractedDescription.toLowerCase().includes('tray')) {
          return {
            ...u,
            confirmedTag: 'MCC-415V',
            images: [
              {
                id: `IMG-${u.id}-1`,
                url: SAMPLE_EVIDENCE_IMAGES.cableTray,
                type: 'progress' as const,
                caption: '415V Switchgear feeder cable pull in progress.',
                timestamp: '2026-09-05 16:45',
                supervisor: u.supervisor || 'A. Patel',
                filename: 'ELE_TRAY_PULL_SWG01.jpg',
                fileSize: 1980320,
                sha256Hash: 'd821ea9401bf89274c0a1b9e72f8190d40e1bc09a827364810feac88d9271801',
                ocrStatus: 'success' as const,
                ocrConfidence: 86,
                ocrRawText: '415V FEEDER CABLE TRAY TIER-2 MCC-415V PUMP BAY',
                ocrDetectedTags: ['MCC-415V', 'ELE-L6-021'],
                confirmedTag: 'MCC-415V',
                confirmedBy: 'supervisor' as const,
                confirmedAt: '2026-09-05T16:50:00Z',
              },
            ],
          };
        }
        if (u.extractedDescription.toLowerCase().includes('crane') || u.rawText.toLowerCase().includes('delay') || u.rawText.toLowerCase().includes('breakdown')) {
          return {
            ...u,
            issueFlag: '50T Mobile Crane breakdown on site - hydraulic oil seal replacement in progress.',
            issueSeverity: 'critical' as const,
            confirmedTag: '50T-CRANE-01',
            images: [
              {
                id: `IMG-${u.id}-1`,
                url: SAMPLE_EVIDENCE_IMAGES.craneIssue,
                type: 'issue' as const,
                caption: 'CRITICAL BLOCKER: Crane hydraulic line ruptured. Erection paused.',
                timestamp: '2026-09-05 09:30',
                supervisor: u.supervisor || 'M. Khan',
                filename: 'CRANE_HYDRAULIC_RUPTURE.jpg',
                fileSize: 2840190,
                sha256Hash: 'f910ea3810f274a01c9b4e72a819d40e1bc09a827364810feac88d92718290fa',
                ocrStatus: 'success' as const,
                ocrConfidence: 96,
                ocrRawText: 'EQUIPMENT TAG: 50T-CRANE-01 HYDRAULIC LEAK HAZARD',
                ocrDetectedTags: ['50T-CRANE-01'],
                confirmedTag: '50T-CRANE-01',
                confirmedBy: 'supervisor' as const,
                confirmedAt: '2026-09-05T09:35:00Z',
              },
            ],
          };
        }
        return u;
      });

      const matchesMap = processAllMatches(allUpdates, parsedSchedule);

      const matchesRecord: Record<string, MatchResult> = {};
      matchesMap.forEach((val, key) => {
        matchesRecord[key] = val;
      });

      setSchedule(parsedSchedule);
      setSiteUpdates(allUpdates);
      setMatchResults(matchesRecord);

      const initialDecisions: Record<string, PlannerDecision> = {};
      const initialAuditLogs: AuditLog[] = [];

      allUpdates.forEach(update => {
        const match = matchesRecord[update.id];
        if (match && match.category === 'ready' && match.candidateActivityId) {
          initialDecisions[update.id] = {
            updateId: update.id,
            linkedActivityId: match.candidateActivityId,
            status: 'approved',
            actionType: 'approve',
            plannerNote: `Auto-linked with high confidence score (${match.confidenceScore}%)`,
            updatedAt: new Date().toISOString(),
          };

          initialAuditLogs.push({
            id: `AUDIT-INIT-${update.id}`,
            timestamp: new Date().toISOString(),
            updateId: update.id,
            rawText: update.rawText,
            sourceFile: update.sourceFile,
            action: 'Auto High-Confidence Link',
            originalConfidence: match.confidenceScore,
            originalCategory: match.category,
            finalActivityId: match.candidateActivityId,
            plannerNote: 'System deterministic match engine verified',
            userRole: 'admin',
          });
        }
      });

      setPlannerDecisions(initialDecisions);
      setAuditLogs(initialAuditLogs);
    } catch (err) {
      console.error('Error loading client demo data:', err);
    }
  };

  const loadDemoData = async () => {
    setIsLoading(true);
    setSelectedInspectorUpdateId(null);
    setSelectedReviewUpdateId(null);
    setSelectedScheduleActivityId(null);
    setSelectedAuditUpdateId(null);
    setOfflineSyncQueue([]);

    try {
      if (backendStatus === 'connected') {
        await api.resetDemo();
        const backendData = await api.fetchInitialData();
        if (backendData) {
          setSchedule(backendData.schedule);
          setSiteUpdates(backendData.siteUpdates);
          setMatchResults(backendData.matchResults);
          setPlannerDecisions(backendData.plannerDecisions);
          setAuditLogs(backendData.auditLogs);
          setIsLoading(false);
          addToast({
            type: 'info',
            title: 'Demo State Reset',
            message: 'Baseline schedule, daily reports, and piping tracker reloaded successfully.',
          });
          return;
        }
      }
      await loadClientDemoData();
      addToast({
        type: 'info',
        title: 'Demo State Reset',
        message: 'Loaded master baseline dataset with 34 milestone activities and verified field logs.',
      });
    } catch (err) {
      console.error('Failed to reset demo dataset:', err);
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: 'Unable to restore demo state. Please check network connection.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOfflineMode = () => {
    setOfflineMode(prev => {
      const next = !prev;
      addToast({
        type: next ? 'warning' : 'success',
        title: next ? 'Offline Mode Active' : 'Online Sync Active',
        message: next
          ? 'Network requests queued locally in IndexedDB cache.'
          : 'Reconnected to Datum industrial project server.',
      });
      return next;
    });
  };

  const syncOfflineQueue = async () => {
    if (offlineSyncQueue.length === 0) return;
    const count = offlineSyncQueue.length;
    setIsLoading(true);
    // Simulate synchronizing local queue with server
    await new Promise(resolve => setTimeout(resolve, 800));
    setOfflineSyncQueue([]);
    setIsLoading(false);
    addToast({
      type: 'success',
      title: 'Offline Queue Synchronized',
      message: `Pushed ${count} local field changes to central project controls database.`,
    });
  };

  // Add new field entry submitted by site supervisor
  const handleAddNewFieldEntry = async (entry: {
    discipline: string;
    description: string;
    rawText: string;
    area: string;
    eventStatus: 'Started' | 'Completed' | 'In Progress';
    quantity?: string;
    supervisor?: string;
    imageFile?: string; // base64 / svg / url
    imageType?: 'completion' | 'issue' | 'progress';
    caption?: string;
    filename?: string;
    fileSize?: number;
    sha256Hash?: string;
    ocrStatus?: 'idle' | 'scanning' | 'success' | 'failed' | 'no_text';
    ocrConfidence?: number;
    ocrRawText?: string;
    ocrDetectedTags?: string[];
    confirmedTag?: string;
    confirmedBy?: 'supervisor' | 'planner' | 'unconfirmed';
    issueFlag?: string;
    issueSeverity?: 'low' | 'medium' | 'critical';
  }) => {
    const newId = `FIELD-${Date.now().toString().slice(-4)}`;
    const newImages: ImageEvidence[] = [];

    if (entry.imageFile) {
      const hash = entry.sha256Hash || (await calculateImageFingerprint(entry.imageFile));
      newImages.push({
        id: `IMG-${newId}-1`,
        url: entry.imageFile,
        type: entry.imageType || 'completion',
        caption: entry.caption || 'Field supervisor photo proof attached',
        timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        supervisor: entry.supervisor || 'Site Supervisor',
        filename: entry.filename || `PHOTO_${newId}_PROOF.jpg`,
        fileSize: entry.fileSize || 1024000,
        sha256Hash: hash,
        ocrStatus: entry.ocrStatus || 'idle',
        ocrConfidence: entry.ocrConfidence,
        ocrRawText: entry.ocrRawText,
        ocrDetectedTags: entry.ocrDetectedTags,
        confirmedTag: entry.confirmedTag,
        confirmedBy: entry.confirmedBy || (entry.confirmedTag ? 'supervisor' : 'unconfirmed'),
        confirmedAt: entry.confirmedTag ? new Date().toISOString() : undefined,
      });
    }

    const newUpdate: SiteUpdate = {
      id: newId,
      sourceFile: 'field_mobile_entry',
      sourceType: 'supervisor_upload',
      discipline: entry.discipline,
      reportDate: new Date().toISOString().split('T')[0],
      rawText: entry.rawText || entry.description,
      extractedDescription: entry.description,
      eventStatus: entry.eventStatus,
      area: entry.area || 'Field Workfront',
      quantity: entry.quantity,
      supervisor: entry.supervisor || 'Field Supervisor',
      images: newImages.length > 0 ? newImages : undefined,
      confirmedTag: entry.confirmedTag,
      issueFlag: entry.issueFlag,
      issueSeverity: entry.issueSeverity,
    };

    // If in offline mode, queue it locally
    if (offlineMode) {
      setOfflineSyncQueue(prev => [
        ...prev,
        {
          id: `SYNC-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'new_update',
          summary: `Site Update ${newId} (${entry.description})`,
          synced: false,
        },
      ]);
    }

    const updatedSiteUpdates = [newUpdate, ...siteUpdates];
    setSiteUpdates(updatedSiteUpdates);

    // Compute NLP Match
    const matchMap = processAllMatches([newUpdate], schedule);
    const newMatch = matchMap.get(newId);
    if (newMatch) {
      setMatchResults(prev => ({ ...prev, [newId]: newMatch }));
    }

    // Add Audit Log
    const newAuditLog: AuditLog = {
      id: `AUDIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      updateId: newId,
      rawText: newUpdate.rawText,
      sourceFile: 'Supervisor Mobile Ingestion',
      action: entry.confirmedTag
        ? `Supervisor Ingested Progress Entry with Confirmed Photo Tag [${entry.confirmedTag}]`
        : 'Supervisor Ingested Progress Entry with Photo Proof',
      originalConfidence: newMatch ? newMatch.confidenceScore : 0,
      originalCategory: newMatch ? newMatch.category : 'review',
      finalActivityId: newMatch ? newMatch.candidateActivityId : null,
      plannerNote: `Submitted via Supervisor Field Portal ${entry.issueFlag ? `[ISSUE: ${entry.issueFlag}]` : ''} ${
        entry.confirmedTag ? `[CONFIRMED TAG: ${entry.confirmedTag}]` : ''
      }`,
      userRole: currentRole,
    };

    setAuditLogs(prev => [newAuditLog, ...prev]);

    // Record in Field Submissions Inbox
    const newSubmission: FieldSubmissionInboxItem = {
      id: `SUB-${Date.now()}`,
      projectId: 'IOCL-P4-REFINERY',
      submittedAt: new Date().toISOString(),
      submittedBy: entry.supervisor || currentUser?.fullName || 'Rajesh Kumar (Field Supervisor)',
      userId: currentUser?.id || 'usr-supervisor-rajesh',
      sourceType: entry.imageFile ? 'Field Photo OCR' : 'Daily Field Report',
      fileName: entry.filename || 'mobile_field_log.txt',
      extractedCount: 1,
      autoMatchedCount: newMatch?.category === 'ready' ? 1 : 0,
      reviewCount: newMatch?.category === 'review' || newMatch?.category === 'unplanned' ? 1 : 0,
      status: newMatch?.category === 'ready' ? 'approved' : 'pending_review',
      notes: entry.description,
    };
    setFieldSubmissions(prev => [newSubmission, ...prev]);

    if (backendStatus === 'connected' && !offlineMode) {
      api.createFieldSubmission(newSubmission);
    }

    const plannerNotif: SystemNotification = {
      id: `NOTIF-SUB-${Date.now()}`,
      targetRole: 'planner',
      type: newSubmission.reviewCount > 0 ? 'action_required' : 'info',
      title: 'New Field Submission Received',
      message: `${newSubmission.submittedBy} logged progress for ${entry.discipline} (${entry.area}).`,
      timestamp: new Date().toISOString(),
      isRead: false,
      deepLinkTab: 'planner-review',
    };
    setSystemNotifications(prev => [plannerNotif, ...prev]);

    addToast({
      type: entry.issueFlag ? 'warning' : 'success',
      title: entry.issueFlag ? 'Report Logged with Blocker' : 'Field Report Ingested',
      message: `Report ${newId} created (${entry.discipline} • ${entry.area}).${entry.confirmedTag ? ` Tag: ${entry.confirmedTag}.` : ''}`,
    });
  };

  // Confirm or correct equipment tag for an update's photo evidence
  const handleConfirmImageTag = async (
    updateId: string,
    imageId: string,
    confirmedTag: string,
    confirmedBy: 'supervisor' | 'planner' = currentRole === 'admin' ? 'planner' : 'supervisor'
  ) => {
    const normTag = confirmedTag.toUpperCase().trim();
    const update = siteUpdates.find(u => u.id === updateId);
    if (!update) return;

    const updatedImages = (update.images || []).map(img =>
      img.id === imageId
        ? {
            ...img,
            confirmedTag: normTag,
            confirmedBy,
            confirmedAt: new Date().toISOString(),
          }
        : img
    );

    const updatedUpdate: SiteUpdate = {
      ...update,
      confirmedTag: normTag,
      images: updatedImages,
    };

    const newSiteUpdates = siteUpdates.map(u => (u.id === updateId ? updatedUpdate : u));
    setSiteUpdates(newSiteUpdates);

    // Re-evaluate matches
    const reMatchMap = processAllMatches([updatedUpdate], schedule);
    const newMatch = reMatchMap.get(updateId);
    if (newMatch) {
      setMatchResults(prev => ({
        ...prev,
        [updateId]: newMatch,
      }));
    }

    const newAuditLog: AuditLog = {
      id: `AUDIT-TAG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      updateId,
      rawText: update.rawText,
      sourceFile: update.sourceFile,
      action: `Confirmed Photo Equipment Tag [${normTag}] (${confirmedBy})`,
      originalConfidence: newMatch ? newMatch.confidenceScore : 0,
      originalCategory: newMatch ? newMatch.category : 'review',
      finalActivityId: newMatch ? newMatch.candidateActivityId : null,
      plannerNote: `Photo evidence verified: equipment tag "${normTag}" assigned.`,
      userRole: currentRole,
    };

    setAuditLogs(prev => [newAuditLog, ...prev]);

    addToast({
      type: 'success',
      title: 'Equipment Tag Confirmed',
      message: `Confirmed tag "${normTag}" for ${updateId}. Schedule matching evidence updated.`,
    });
  };

  // Remove photo evidence from an update
  const handleRemoveImageFromUpdate = async (updateId: string, imageId: string) => {
    const update = siteUpdates.find(u => u.id === updateId);
    if (!update) return;

    const updatedImages = (update.images || []).filter(img => img.id !== imageId);
    const updatedUpdate: SiteUpdate = {
      ...update,
      images: updatedImages.length > 0 ? updatedImages : undefined,
      confirmedTag: updatedImages.length > 0 ? update.confirmedTag : undefined,
    };

    const newSiteUpdates = siteUpdates.map(u => (u.id === updateId ? updatedUpdate : u));
    setSiteUpdates(newSiteUpdates);

    const reMatchMap = processAllMatches([updatedUpdate], schedule);
    const newMatch = reMatchMap.get(updateId);
    if (newMatch) {
      setMatchResults(prev => ({
        ...prev,
        [updateId]: newMatch,
      }));
    }

    const newAuditLog: AuditLog = {
      id: `AUDIT-IMG-REM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      updateId,
      rawText: update.rawText,
      sourceFile: update.sourceFile,
      action: `Photo Evidence Removed from ${updateId}`,
      originalConfidence: newMatch ? newMatch.confidenceScore : 0,
      originalCategory: newMatch ? newMatch.category : 'review',
      finalActivityId: newMatch ? newMatch.candidateActivityId : null,
      plannerNote: 'Supervisor/Planner detached photo proof from field record.',
      userRole: currentRole,
    };

    setAuditLogs(prev => [newAuditLog, ...prev]);

    addToast({
      type: 'info',
      title: 'Photo Evidence Removed',
      message: `Removed photo proof from update ${updateId}.`,
    });
  };

  const handleCustomUpload = async (files: {
    scheduleCsv?: string;
    dailyReportTxt?: string;
    pipingProgressXlsx?: ArrayBuffer;
  }) => {
    setIsLoading(true);
    try {
      if (backendStatus === 'connected' && !offlineMode) {
        const success = await api.uploadFiles(files);
        if (success) {
          const backendData = await api.fetchInitialData();
          if (backendData) {
            setSchedule(backendData.schedule);
            setSiteUpdates(backendData.siteUpdates);
            setMatchResults(backendData.matchResults);
            setPlannerDecisions(backendData.plannerDecisions);
            setAuditLogs(backendData.auditLogs);
            setIsLoading(false);
            addToast({
              type: 'success',
              title: 'Batch Ingestion Complete',
              message: 'Processed project files and updated execution baseline.',
            });
            return;
          }
        }
      }

      // Standalone client processing
      let currentSchedule = schedule;
      let newUpdates = [...siteUpdates];

      if (files.scheduleCsv) {
        currentSchedule = parseScheduleCSV(files.scheduleCsv);
        setSchedule(currentSchedule);
      }

      const addedUpdates: SiteUpdate[] = [];
      if (files.dailyReportTxt) {
        const txtUpdates = parseDailyReportTXT(files.dailyReportTxt);
        addedUpdates.push(...txtUpdates);
      }
      if (files.pipingProgressXlsx) {
        const xlsxUpdates = parsePipingProgressXLSX(files.pipingProgressXlsx);
        addedUpdates.push(...xlsxUpdates);
      }

      if (addedUpdates.length > 0) {
        newUpdates = addedUpdates;
        setSiteUpdates(newUpdates);
      }

      const matchesMap = processAllMatches(newUpdates, currentSchedule);
      const matchesRecord: Record<string, MatchResult> = {};
      matchesMap.forEach((val, key) => {
        matchesRecord[key] = val;
      });
      setMatchResults(matchesRecord);

      const newDecisions: Record<string, PlannerDecision> = {};
      const newAuditLogs: AuditLog[] = [];
      newUpdates.forEach(update => {
        const match = matchesRecord[update.id];
        if (match && match.category === 'ready' && match.candidateActivityId) {
          newDecisions[update.id] = {
            updateId: update.id,
            linkedActivityId: match.candidateActivityId,
            status: 'approved',
            actionType: 'approve',
            plannerNote: `Auto-linked with confidence score (${match.confidenceScore}%)`,
            updatedAt: new Date().toISOString(),
          };
          newAuditLogs.push({
            id: `AUDIT-UPLOAD-${update.id}`,
            timestamp: new Date().toISOString(),
            updateId: update.id,
            rawText: update.rawText,
            sourceFile: update.sourceFile,
            action: 'Auto High-Confidence Link (Uploaded Batch)',
            originalConfidence: match.confidenceScore,
            originalCategory: match.category,
            finalActivityId: match.candidateActivityId,
            plannerNote: 'System classified match',
            userRole: currentRole,
          });
        }
      });
      setPlannerDecisions(newDecisions);
      setAuditLogs(newAuditLogs);

      addToast({
        type: 'success',
        title: 'Batch Files Ingested',
        message: `Parsed ${newUpdates.length} updates against ${currentSchedule.length} schedule activities.`,
      });
    } catch (err) {
      console.error('Error handling custom upload:', err);
      addToast({
        type: 'error',
        title: 'Upload Processing Failed',
        message: 'Could not parse execution files. Ensure standard CSV/TXT/XLSX structure.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Compute enriched schedule with actual dates, status, and variance
  const enrichedSchedule = useMemo(() => {
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
        const plannedFinishMs = parseUTCDateMs(act.plannedFinish);
        if (status === 'Completed' && actualFinish) {
          const actualFinishMs = parseUTCDateMs(actualFinish);
          varianceDays = Math.round((actualFinishMs - plannedFinishMs) / (1000 * 3600 * 24));
        } else if (status !== 'Completed') {
          const currentMs = parseUTCDateMs(maxDate);
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
        criticalPath: (varianceDays > 0) || act.wbs.startsWith('2.1') || act.wbs.startsWith('1.1'),
      };
    });
  }, [schedule, siteUpdates, plannerDecisions, matchResults]);

  const loadScenarioPreset = async (scenarioKey: string) => {
    setIsLoading(true);
    await loadDemoData();
    if (scenarioKey === 'cw-delay') {
      setActiveTab('copilot');
      addToast({
        type: 'info',
        title: 'Loaded: Critical Path Cooling Water Slip (+5d)',
        message: 'Simulating forward dependency delay propagation on Line 24-CW-017 (PIP-L6-012) across downstream packages.',
      });
    } else if (scenarioKey === 'unplanned-leak') {
      setActiveTab('planner-review');
      setPlannerQueueFilter('unplanned');
      addToast({
        type: 'warning',
        title: 'Loaded: Emergency HSE Obstacle / Blocker',
        message: 'Navigated to Planner Decision Hub: Crane hydraulic leak flagged for human-in-the-loop review.',
      });
    } else if (scenarioKey === 'civil-milestone') {
      setActiveTab('site-updates');
      setSiteUpdatesFilter(prev => ({ ...prev, discipline: 'Civil' }));
      addToast({
        type: 'success',
        title: 'Loaded: Civil Foundation Handover Verification',
        message: 'Navigated to Site Reports: CIV-L6-002 pump foundation pour verified with SHA-256 photo hash.',
      });
    } else if (scenarioKey === 'supervisor-voice-ocr') {
      setActiveTab('supervisor-entry');
      addToast({
        type: 'info',
        title: 'Loaded: Multimodal Field Studio',
        message: 'Voice dictation & canvas adaptive handwriting OCR ready for real-time field logging.',
      });
    }
    setIsLoading(false);
  };

  const loadJudgeDemoScenario = loadScenarioPreset;

  const refreshApprovalHistory = async () => {
    if (backendStatus === 'connected') {
      const history = await api.getApprovalHistory();
      if (history && history.length > 0) {
        setApprovalHistory(history);
        return;
      }
    }
    const fallbackHistory: ApprovalHistoryItem[] = Object.values(plannerDecisions).map(d => {
      const u = siteUpdates.find(up => up.id === d.updateId);
      const act = d.linkedActivityId ? schedule.find(s => s.activityId === d.linkedActivityId) : null;
      return {
        ...d,
        supervisor: u?.supervisor || 'Site Engineer',
        reportDate: u?.reportDate,
        discipline: u?.discipline,
        extractedDescription: u?.extractedDescription,
        rawText: u?.rawText,
        activityName: act?.activityName || 'Unlinked',
        area: act?.area || u?.area || 'Unit 01',
      };
    });
    setApprovalHistory(fallbackHistory);
  };

  const activateScheduleVersion = async (versionId: string) => {
    setIsLoading(true);
    try {
      if (backendStatus === 'connected' && !offlineMode) {
        await api.activateScheduleVersion(versionId);
      }
      setScheduleVersions(prev =>
        prev.map(v => ({ ...v, isActive: v.versionId === versionId }))
      );

      const activated = scheduleVersions.find(v => v.versionId === versionId);
      const newNotif: SystemNotification = {
        id: `NOTIF-REV-${Date.now()}`,
        targetRole: 'supervisor',
        type: 'update',
        title: `Schedule ${versionId} is now Active`,
        message: `Lead Planner activated ${activated?.versionName || versionId}. 4 activities assigned to your workfront were updated.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        deepLinkTab: 'supervisor-entry',
        acknowledged: false,
      };
      setSystemNotifications(prev => [newNotif, ...prev]);

      addToast({
        type: 'success',
        title: `Schedule ${versionId} Activated`,
        message: 'Official project baseline updated. Field Supervisor task assignments synchronized.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Activation Failed',
        message: err.message || 'Could not activate schedule version.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadNewScheduleVersion = async (file: File, versionName?: string) => {
    setIsLoading(true);
    try {
      if (backendStatus === 'connected' && !offlineMode) {
        const res = await api.uploadScheduleVersion(file, versionName, currentUser?.fullName || 'Lead Planner');
        if (res.success && res.version) {
          setScheduleVersions(prev => [res.version, ...prev]);
          addToast({
            type: 'success',
            title: `Schedule Version Ingested: ${res.version.versionId}`,
            message: `Parsed ${res.parsedCount} activities. Review change summary before activation.`,
          });
          setIsLoading(false);
          return;
        }
      }

      // Client fallback
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        const parsed = parseScheduleCSV(text);
        const nextNum = scheduleVersions.length + 1;
        const nextId = `Rev-0${nextNum}`;
        const newVersion: ScheduleVersion = {
          versionId: nextId,
          projectId: 'IOCL-P4-REFINERY',
          versionName: versionName || `${nextId} (Monsoon Update)`,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.fullName || 'Gokulakannan P. (Lead Planner)',
          fileType: file.name.endsWith('.xlsx') ? 'Primavera P6 XLSX' : 'Primavera P6 CSV',
          activitiesCount: parsed.length,
          isActive: false,
          changeSummary: {
            newCount: 4,
            modCount: 7,
            dateChanges: 11,
            removedCount: 0,
          },
        };
        setScheduleVersions(prev => [newVersion, ...prev]);
        addToast({
          type: 'success',
          title: `Schedule Version Uploaded: ${nextId}`,
          message: `Parsed ${parsed.length} activities. Review changes and activate when ready.`,
        });
        setIsLoading(false);
      };
      reader.readAsText(file);
    } catch (err: any) {
      setIsLoading(false);
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Could not parse schedule file.',
      });
    }
  };

  const acknowledgeScheduleUpdates = async () => {
    if (backendStatus === 'connected' && !offlineMode) {
      await api.acknowledgeSupervisorScheduleUpdates();
    }
    setSystemNotifications(prev =>
      prev.map(n => (n.targetRole === 'supervisor' && n.type === 'update' ? { ...n, acknowledged: true, isRead: true } : n))
    );
    addToast({
      type: 'success',
      title: 'Schedule Updates Acknowledged',
      message: 'Confirmed latest revisions for Unit 01 Field Workfront.',
    });
  };

  const markNotificationAsRead = async (id: string) => {
    if (backendStatus === 'connected' && !offlineMode) {
      await api.markNotificationRead(id);
    }
    setSystemNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const refreshSubmissionsInbox = async () => {
    if (backendStatus === 'connected' && !offlineMode) {
      const subs = await api.getFieldSubmissions();
      if (subs && subs.length > 0) setFieldSubmissions(subs);
    }
  };

  const login = async (username: string, passwordPlain: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (backendStatus === 'connected') {
        const res = await api.login(username, passwordPlain);
        if (res.success && res.user) {
          setCurrentUser(res.user);
          const isSup = res.user.role === 'supervisor';
          setCurrentRole(isSup ? 'supervisor' : 'admin');
          setActiveTabState(isSup ? 'supervisor-entry' : 'dashboard');
          localStorage.setItem('datum_current_user', JSON.stringify(res.user));
          if (res.token) localStorage.setItem('datum_auth_token', res.token);
          addToast({
            type: 'success',
            title: `Welcome, ${res.user.fullName}`,
            message: `Authenticated as ${res.user.role.toUpperCase()} (${res.user.department}).`,
          });
          setIsLoading(false);
          return { success: true };
        } else if (res.error) {
          setIsLoading(false);
          return { success: false, error: res.error };
        }
      }

      // Standalone / Offline Pre-Seeded Accounts
      const defaultUsers: Record<string, UserAccount> = {
        gokul: {
          id: 'usr-planner-gokul',
          username: 'gokul',
          fullName: 'Gokulakannan P.',
          email: 'gokul@datum.enterprise',
          role: 'planner',
          department: 'Project Controls & Lead Planning',
          employeeId: 'IOCL-EPCC-P4-001',
          avatarLetter: 'G',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        },
        rajesh: {
          id: 'usr-supervisor-rajesh',
          username: 'rajesh',
          fullName: 'Rajesh Kumar',
          email: 'rajesh.k@iocl-refinery.in',
          role: 'supervisor',
          department: 'Mechanical & Field Erection',
          employeeId: 'IOCL-EPCC-P4-SUP04',
          avatarLetter: 'R',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        },
        guest_planner: {
          id: 'usr-guest-planner',
          username: 'guest_planner',
          fullName: 'Lead Planning Engineer (Demo)',
          email: 'lead.planner@datum.enterprise',
          role: 'planner',
          department: 'Lead Planning Decision Suite',
          employeeId: 'DEMO-PLN-01',
          avatarLetter: 'P',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        },
        guest_supervisor: {
          id: 'usr-guest-supervisor',
          username: 'guest_supervisor',
          fullName: 'Field Site Supervisor (Demo)',
          email: 'site.supervisor@datum.enterprise',
          role: 'supervisor',
          department: 'Site OCR & Evidence Ingestion',
          employeeId: 'DEMO-SUP-02',
          avatarLetter: 'S',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        },
      };

      const user = defaultUsers[username.toLowerCase().trim()];
      if (user && (passwordPlain === 'password123' || passwordPlain === 'guest' || passwordPlain === 'admin')) {
        setCurrentUser(user);
        const isSup = user.role === 'supervisor';
        setCurrentRole(isSup ? 'supervisor' : 'admin');
        setActiveTabState(isSup ? 'supervisor-entry' : 'dashboard');
        localStorage.setItem('datum_current_user', JSON.stringify(user));
        addToast({
          type: 'success',
          title: `Welcome, ${user.fullName}`,
          message: `Logged in as ${user.role.toUpperCase()} (${user.department}).`,
        });
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Invalid credentials. Select a pre-configured demo account or enter valid credentials.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Authentication error' };
    }
  };

  const loginAsGuest = async (guestRole: 'planner' | 'supervisor') => {
    const isSup = guestRole === 'supervisor';
    const guestUser: UserAccount = guestRole === 'planner'
      ? {
          id: 'usr-guest-planner',
          username: 'guest_planner',
          fullName: 'Lead Planning Engineer (Demo)',
          email: 'lead.planner@datum.enterprise',
          role: 'planner',
          department: 'Project Controls & Schedule Analytics',
          employeeId: 'DEMO-PLN-01',
          avatarLetter: 'P',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        }
      : {
          id: 'usr-guest-supervisor',
          username: 'guest_supervisor',
          fullName: 'Field Site Supervisor (Demo)',
          email: 'site.supervisor@datum.enterprise',
          role: 'supervisor',
          department: 'Unit 01 Field OCR & Multimodal Ingestion',
          employeeId: 'DEMO-SUP-02',
          avatarLetter: 'S',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

    setCurrentUser(guestUser);
    setCurrentRole(isSup ? 'supervisor' : 'admin');
    setActiveTabState(isSup ? 'supervisor-entry' : 'dashboard');
    localStorage.setItem('datum_current_user', JSON.stringify(guestUser));
    addToast({
      type: 'info',
      title: `Guest Demo Session: ${guestUser.fullName}`,
      message: `Role: ${guestUser.role.toUpperCase()} • Direct access active.`,
    });
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('datum_current_user');
    localStorage.removeItem('datum_auth_token');
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'Logged out of project controls session.',
    });
  };

  const handlePlannerAction = async (
    updateId: string,
    actionType: PlannerActionType,
    targetActivityId?: string | null,
    note?: string
  ) => {
    const update = siteUpdates.find(u => u.id === updateId);
    const match = matchResults[updateId];

    if (!update || !match) return;

    const userContext = {
      userId: currentUser?.id || 'usr-planner-gokul',
      userName: currentUser?.fullName || 'Gokulakannan P.',
      userRole: currentUser?.role === 'supervisor' ? 'Site Supervisor' : 'Lead Planning Engineer',
    };

    // Send to backend if online
    if (backendStatus === 'connected' && !offlineMode) {
      const backendRes = await api.submitPlannerAction(updateId, actionType, targetActivityId, note, userContext);
      if (backendRes) {
        setPlannerDecisions(prev => ({
          ...prev,
          [updateId]: backendRes.decision,
        }));
        setAuditLogs(prev => [backendRes.auditLog, ...prev]);

        // Trigger toast
        if (actionType === 'approve') {
          addToast({
            type: 'success',
            title: 'Match Approved & Cryptographically Signed',
            message: `Linked ${updateId} to milestone ${backendRes.decision.linkedActivityId} [Sig: ${backendRes.decision.digitalSignature?.substring(0, 10) || 'VERIFIED'}].`,
          });
        } else if (actionType === 'relink') {
          addToast({
            type: 'info',
            title: 'Activity Re-Linked',
            message: `Re-linked ${updateId} to ${backendRes.decision.linkedActivityId}.`,
          });
        } else if (actionType === 'mark_unplanned') {
          addToast({
            type: 'warning',
            title: 'Marked Unplanned',
            message: `Classified ${updateId} as unplanned field activity.`,
          });
        } else if (actionType === 'reject') {
          addToast({
            type: 'error',
            title: 'Update Rejected',
            message: `Rejected site update ${updateId}.`,
          });
        }
        return;
      }
    }

    // Client fallback with deterministic L5 code & hash generation
    let finalActivityId: string | null = null;
    let statusStr: 'approved' | 'modified' | 'unplanned' | 'rejected' = 'approved';
    let actionDesc = '';

    switch (actionType) {
      case 'approve':
        finalActivityId = targetActivityId || match.candidateActivityId;
        statusStr = 'approved';
        actionDesc = `Planner Approved link to ${finalActivityId}`;
        addToast({
          type: 'success',
          title: 'Match Approved & Cryptographically Signed',
          message: `Linked ${updateId} to ${finalActivityId}.`,
        });
        break;
      case 'relink':
        finalActivityId = targetActivityId || null;
        statusStr = 'modified';
        actionDesc = `Planner Manual Re-linked to ${finalActivityId}`;
        addToast({
          type: 'info',
          title: 'Activity Re-Linked',
          message: `Re-linked ${updateId} to milestone ${finalActivityId}.`,
        });
        break;
      case 'mark_unplanned':
        finalActivityId = null;
        statusStr = 'unplanned';
        actionDesc = 'Planner Categorized as Unplanned Work';
        addToast({
          type: 'warning',
          title: 'Classified as Unplanned',
          message: `Classified ${updateId} as unplanned site work.`,
        });
        break;
      case 'reject':
        finalActivityId = null;
        statusStr = 'rejected';
        actionDesc = 'Planner Rejected site update';
        addToast({
          type: 'error',
          title: 'Update Rejected',
          message: `Rejected site update ${updateId}.`,
        });
        break;
      case 'edit_update':
        finalActivityId = targetActivityId || match.candidateActivityId;
        statusStr = 'modified';
        actionDesc = 'Planner Modified site update parameters';
        addToast({
          type: 'info',
          title: 'Parameters Updated',
          message: `Modified field parameters for ${updateId}.`,
        });
        break;
    }

    let l5Code = '';
    let taskHash = '';
    if (finalActivityId) {
      const act = schedule.find(a => a.activityId === finalActivityId);
      if (act) {
        l5Code = act.l5Code || `IOCL.P4.${(act.area || 'UNIT01').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}.${act.discipline.substring(0, 3).toUpperCase()}.L5.011`;
        taskHash = act.taskHash || 'D7A9F4B2';
      }
    }

    const digitalSignature = `SIG-${(taskHash || 'UNPLN').substring(0, 6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const decision: PlannerDecision = {
      updateId,
      linkedActivityId: finalActivityId,
      status: statusStr,
      actionType,
      plannerNote: note || '',
      updatedAt: new Date().toISOString(),
      userId: userContext.userId,
      userName: userContext.userName,
      userRole: userContext.userRole,
      l5Code,
      taskHash,
      digitalSignature,
    };

    setPlannerDecisions(prev => ({
      ...prev,
      [updateId]: decision,
    }));

    const newAuditLog: AuditLog = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      updateId,
      rawText: update.rawText,
      sourceFile: update.sourceFile,
      action: actionDesc,
      originalConfidence: match.confidenceScore,
      originalCategory: match.category,
      finalActivityId,
      plannerNote: note,
      userRole: currentRole,
      userId: userContext.userId,
      userName: userContext.userName,
      l5Code,
      taskHash,
      digitalSignature,
    };

    setAuditLogs(prev => [newAuditLog, ...prev]);

    if (offlineMode) {
      setOfflineSyncQueue(prev => [
        ...prev,
        {
          id: `SYNC-ACTION-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'planner_action',
          summary: `${actionDesc} for ${updateId}`,
          synced: false,
        },
      ]);
    }
  };

  const handleEditUpdate = async (updateId: string, updatedFields: Partial<SiteUpdate>) => {
    if (backendStatus === 'connected' && !offlineMode) {
      const res = await api.updateSiteUpdate(updateId, updatedFields);
      if (res) {
        setSiteUpdates(prev => prev.map(u => (u.id === updateId ? res.siteUpdate : u)));
        setMatchResults(prev => ({ ...prev, [updateId]: res.matchResult }));
        addToast({
          type: 'info',
          title: 'Update Saved',
          message: `Saved changes to site update ${updateId}.`,
        });
        return;
      }
    }

    setSiteUpdates(prev =>
      prev.map(u => (u.id === updateId ? { ...u, ...updatedFields } : u))
    );

    const updated = siteUpdates.find(u => u.id === updateId);
    if (updated) {
      const newUpdateObj = { ...updated, ...updatedFields };
      const reMatchMap = processAllMatches([newUpdateObj], schedule);
      const newMatch = reMatchMap.get(updateId);
      if (newMatch) {
        setMatchResults(prev => ({
          ...prev,
          [updateId]: newMatch,
        }));
      }
    }

    addToast({
      type: 'info',
      title: 'Update Saved',
      message: `Saved evidence modifications for ${updateId}.`,
    });
  };

  /**
   * Verified CSV Export using standard Blob & Object URL
   */
  const exportAlignmentCSV = () => {
    const rows = [
      [
        'Update ID',
        'Source File',
        'Report Date',
        'Discipline',
        'Extracted Description',
        'Event Status',
        'Area',
        'Matched Activity ID',
        'Confidence Score',
        'Match Category',
        'Planner Action Status',
        'Planner Note',
        'Confirmed Tag',
        'Has Photo Evidence',
        'Photo Fingerprint (SHA256)',
        'Issue Blocker',
      ],
    ];

    siteUpdates.forEach(update => {
      const match = matchResults[update.id];
      const decision = plannerDecisions[update.id];
      const linkedId = decision ? decision.linkedActivityId : (match?.category === 'ready' ? match?.candidateActivityId : '');
      const firstImage = update.images?.[0];

      rows.push([
        update.id,
        update.sourceFile,
        update.reportDate,
        update.discipline,
        `"${(update.extractedDescription || '').replace(/"/g, '""')}"`,
        update.eventStatus,
        update.area || '',
        linkedId || 'UNPLANNED',
        `${match?.confidenceScore || 0}%`,
        match?.category || 'unplanned',
        decision?.status || 'auto',
        `"${(decision?.plannerNote || '').replace(/"/g, '""')}"`,
        update.confirmedTag || firstImage?.confirmedTag || 'N/A',
        firstImage ? 'YES' : 'NO',
        firstImage?.sha256Hash || 'N/A',
        `"${(update.issueFlag || '').replace(/"/g, '""')}"`,
      ]);
    });

    const csvContent = rows.map(e => e.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Datum_Execution_Alignment_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Alignment Export Complete',
      message: `Exported alignment matrix with ${siteUpdates.length} verified records.`,
    });
  };

  return (
    <ProjectContext.Provider
      value={{
        schedule,
        enrichedSchedule,
        siteUpdates,
        matchResults,
        plannerDecisions,
        auditLogs,
        approvalHistory,
        refreshApprovalHistory,
        scheduleVersions,
        activeScheduleVersion,
        activateScheduleVersion,
        uploadNewScheduleVersion,
        fieldSubmissions,
        refreshSubmissionsInbox,
        systemNotifications,
        acknowledgeScheduleUpdates,
        markNotificationAsRead,
        currentUser,
        isAuthenticated,
        login,
        loginAsGuest,
        logout,
        activeTab,
        setActiveTab,
        systemMode,
        setSystemMode,
        loadScenarioPreset,
        demoMode,
        setDemoMode,
        loadJudgeDemoScenario,
        theme,
        toggleTheme,
        setTheme,
        currentRole,
        setCurrentRole,
        densityMode,
        setDensityMode,
        offlineMode,
        toggleOfflineMode,
        offlineSyncQueue,
        syncOfflineQueue,
        backendStatus,
        backendMetrics,
        workbenchViewMode,
        setWorkbenchViewMode,
        sortOption,
        setSortOption,
        selectedInspectorUpdateId,
        setSelectedInspectorUpdateId,
        selectedScheduleActivityId,
        setSelectedScheduleActivityId,
        selectedReviewUpdateId,
        setSelectedReviewUpdateId,
        selectedAuditUpdateId,
        setSelectedAuditUpdateId,
        toasts,
        addToast,
        removeToast,
        siteUpdatesFilter,
        setSiteUpdatesFilter,
        plannerQueueFilter,
        setPlannerQueueFilter,
        navigateToSiteUpdatesWithFilter,
        navigateToPlannerReviewWithFilter,
        isGuidedDemoActive,
        guidedDemoStepIndex,
        currentGuidedDemoStep,
        startGuidedDemo,
        nextGuidedDemoStep,
        prevGuidedDemoStep,
        jumpToGuidedDemoStep,
        exitGuidedDemo,
        isWelcomeModalOpen,
        setIsWelcomeModalOpen,
        isDemoCompletionModalOpen,
        setIsDemoCompletionModalOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        toggleCommandPalette,
        isLoading,
        loadDemoData,
        handleCustomUpload,
        handleAddNewFieldEntry,
        handleConfirmImageTag,
        handleRemoveImageFromUpdate,
        handlePlannerAction,
        handleEditUpdate,
        exportAlignmentCSV,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
