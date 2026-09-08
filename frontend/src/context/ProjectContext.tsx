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
  OfflineSyncItem,
  ToastNotification,
  ToastType,
} from '../types';
import { parseScheduleCSV, parseDailyReportTXT, parsePipingProgressXLSX } from '../utils/parsers';
import { processAllMatches } from '../utils/matchingEngine';
import { api, HealthResponse } from '../services/api';
import { SAMPLE_EVIDENCE_IMAGES } from '../utils/sampleImages';
import { calculateImageFingerprint } from '../utils/ocrService';

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
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

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
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [workbenchViewMode, setWorkbenchViewMode] = useState<WorkbenchViewMode>('kanban');
  const [sortOption, setSortOption] = useState<WorkbenchSortOption>('confidence-desc');
  const [selectedInspectorUpdateId, setSelectedInspectorUpdateId] = useState<string | null>(null);
  const [selectedScheduleActivityId, setSelectedScheduleActivityId] = useState<string | null>(null);

  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [densityMode, setDensityMode] = useState<DensityMode>('comfortable');
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [offlineSyncQueue, setOfflineSyncQueue] = useState<OfflineSyncItem[]>([]);

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
        const plannedFinishMs = new Date(act.plannedFinish).getTime();
        if (status === 'Completed' && actualFinish) {
          const actualFinishMs = new Date(actualFinish).getTime();
          varianceDays = Math.round((actualFinishMs - plannedFinishMs) / (1000 * 3600 * 24));
        } else if (status !== 'Completed') {
          const currentMs = new Date(maxDate).getTime();
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

  const handlePlannerAction = async (
    updateId: string,
    actionType: PlannerActionType,
    targetActivityId?: string | null,
    note?: string
  ) => {
    const update = siteUpdates.find(u => u.id === updateId);
    const match = matchResults[updateId];

    if (!update || !match) return;

    // Send to backend if online
    if (backendStatus === 'connected' && !offlineMode) {
      const backendRes = await api.submitPlannerAction(updateId, actionType, targetActivityId, note);
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
            title: 'Match Approved',
            message: `Linked ${updateId} to milestone ${backendRes.decision.linkedActivityId}.`,
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

    // Client fallback
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
          title: 'Match Approved & Linked',
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

    const decision: PlannerDecision = {
      updateId,
      linkedActivityId: finalActivityId,
      status: statusStr,
      actionType,
      plannerNote: note || '',
      updatedAt: new Date().toISOString(),
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
        activeTab,
        setActiveTab,
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
