import { ScheduleActivity, SiteUpdate, MatchResult, PlannerDecision, AuditLog, PlannerActionType } from '../types';

const API_BASE = 'http://localhost:5000/api';

export interface HealthResponse {
  status: string;
  engine: string;
  timestamp: string;
  metrics: {
    scheduleActivities: number;
    siteUpdates: number;
    plannerDecisions: number;
    auditLogs: number;
  };
}

export const api = {
  /**
   * Check if backend REST API is responsive
   */
  async checkHealth(): Promise<HealthResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET', cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Fetch all initial state from SQLite backend
   */
  async fetchInitialData(): Promise<{
    schedule: ScheduleActivity[];
    siteUpdates: SiteUpdate[];
    matchResults: Record<string, MatchResult>;
    plannerDecisions: Record<string, PlannerDecision>;
    auditLogs: AuditLog[];
  } | null> {
    try {
      const [scheduleRes, updatesRes, matchesRes, decisionsRes, auditRes] = await Promise.all([
        fetch(`${API_BASE}/schedule`),
        fetch(`${API_BASE}/site-updates`),
        fetch(`${API_BASE}/matches`),
        fetch(`${API_BASE}/planner/decisions`),
        fetch(`${API_BASE}/audit-trail`),
      ]);

      if (!scheduleRes.ok || !updatesRes.ok || !matchesRes.ok) {
        return null;
      }

      const schedule = await scheduleRes.json();
      const siteUpdates = await updatesRes.json();
      const matchResults = await matchesRes.json();
      const plannerDecisions = await decisionsRes.json();
      const auditLogs = await auditRes.json();

      return {
        schedule,
        siteUpdates,
        matchResults,
        plannerDecisions,
        auditLogs,
      };
    } catch (err) {
      console.warn('Could not fetch from backend REST API, will fall back to local mode:', err);
      return null;
    }
  },

  /**
   * Submit planner decision to backend
   */
  async submitPlannerAction(
    updateId: string,
    actionType: PlannerActionType,
    targetActivityId?: string | null,
    note?: string
  ): Promise<{ decision: PlannerDecision; auditLog: AuditLog } | null> {
    try {
      const res = await fetch(`${API_BASE}/planner/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateId,
          actionType,
          targetActivityId,
          note,
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      return {
        decision: data.decision,
        auditLog: data.auditLog,
      };
    } catch (err) {
      console.error('Error submitting planner action to backend:', err);
      return null;
    }
  },

  /**
   * Edit site update parameters in backend
   */
  async updateSiteUpdate(
    updateId: string,
    fields: Partial<SiteUpdate>
  ): Promise<{ siteUpdate: SiteUpdate; matchResult: MatchResult } | null> {
    try {
      const res = await fetch(`${API_BASE}/site-updates/${updateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });

      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Error updating site update in backend:', err);
      return null;
    }
  },

  /**
   * Upload custom files to backend
   */
  async uploadFiles(files: {
    scheduleCsv?: File | Blob | string;
    dailyReportTxt?: File | Blob | string;
    pipingProgressXlsx?: File | Blob | ArrayBuffer;
  }): Promise<boolean> {
    try {
      const formData = new FormData();

      if (files.scheduleCsv) {
        const blob = typeof files.scheduleCsv === 'string'
          ? new Blob([files.scheduleCsv], { type: 'text/csv' })
          : files.scheduleCsv;
        formData.append('scheduleCsv', blob as any, 'schedule.csv');
      }

      if (files.dailyReportTxt) {
        const blob = typeof files.dailyReportTxt === 'string'
          ? new Blob([files.dailyReportTxt], { type: 'text/plain' })
          : files.dailyReportTxt;
        formData.append('dailyReportTxt', blob as any, 'daily_report.txt');
      }

      if (files.pipingProgressXlsx) {
        const blob = files.pipingProgressXlsx instanceof ArrayBuffer
          ? new Blob([files.pipingProgressXlsx], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
          : files.pipingProgressXlsx;
        formData.append('pipingProgressXlsx', blob as any, 'piping_progress.xlsx');
      }

      const res = await fetch(`${API_BASE}/ingest/upload`, {
        method: 'POST',
        body: formData,
      });

      return res.ok;
    } catch (err) {
      console.error('Error uploading files to backend:', err);
      return false;
    }
  },

  /**
   * Reset database to SIH benchmark demo dataset
   */
  async resetDemo(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reset-demo`, { method: 'POST' });
      return res.ok;
    } catch (err) {
      console.error('Error resetting backend demo data:', err);
      return false;
    }
  },

  /**
   * Get server-side CSV export URL
   */
  getExportCsvUrl(): string {
    return `${API_BASE}/export/csv`;
  },
};
