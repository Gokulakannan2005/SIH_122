import {
  ScheduleActivity,
  SiteUpdate,
  MatchResult,
  PlannerDecision,
  AuditLog,
  PlannerActionType,
  UserAccount,
  ApprovalHistoryItem,
} from '../types';

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

export interface AuthResponse {
  success: boolean;
  user?: UserAccount;
  token?: string;
  error?: string;
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
   * User login against SQLite backend
   */
  async login(username: string, passwordPlain: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passwordPlain }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: 'Database connection failed. Please ensure the backend is running.' };
    }
  },

  /**
   * User registration into SQLite database
   */
  async register(userData: {
    username: string;
    passwordPlain: string;
    fullName: string;
    email?: string;
    role: 'planner' | 'supervisor' | 'admin';
    department?: string;
    employeeId?: string;
  }): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.username,
          password: userData.passwordPlain,
          fullName: userData.fullName,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          employeeId: userData.employeeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: 'Database connection failed.' };
    }
  },

  /**
   * Get all database registered users
   */
  async getUsers(): Promise<UserAccount[]> {
    try {
      const res = await fetch(`${API_BASE}/auth/users`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Get approval history & chain of custody records
   */
  async getApprovalHistory(): Promise<ApprovalHistoryItem[]> {
    try {
      const res = await fetch(`${API_BASE}/approvals/history`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
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
   * Submit planner decision to backend with digital signature & L5 tracking
   */
  async submitPlannerAction(
    updateId: string,
    actionType: PlannerActionType,
    targetActivityId?: string | null,
    note?: string,
    userContext?: { userId?: string; userName?: string; userRole?: string }
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
          userId: userContext?.userId,
          userName: userContext?.userName,
          userRole: userContext?.userRole,
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

  /**
   * Get schedule versions list
   */
  async getScheduleVersions(): Promise<import('../types').ScheduleVersion[]> {
    try {
      const res = await fetch(`${API_BASE}/schedule/versions`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Activate a schedule version
   */
  async activateScheduleVersion(versionId: string): Promise<{ success: boolean; activatedVersion?: import('../types').ScheduleVersion; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/schedule/activate-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Upload a new schedule version file
   */
  async uploadScheduleVersion(file: File, versionName?: string, uploadedBy?: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('scheduleFile', file);
      if (versionName) formData.append('versionName', versionName);
      if (uploadedBy) formData.append('uploadedBy', uploadedBy);

      const res = await fetch(`${API_BASE}/schedule/upload-version`, {
        method: 'POST',
        body: formData,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Get incoming field submissions inbox
   */
  async getFieldSubmissions(): Promise<import('../types').FieldSubmissionInboxItem[]> {
    try {
      const res = await fetch(`${API_BASE}/submissions/inbox`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Create field submission inbox record
   */
  async createFieldSubmission(sub: Partial<import('../types').FieldSubmissionInboxItem>): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/submissions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Get system notifications
   */
  async getNotifications(role?: string): Promise<import('../types').SystemNotification[]> {
    try {
      const res = await fetch(`${API_BASE}/notifications${role ? `?role=${role}` : ''}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Acknowledge schedule updates (Field Supervisor)
   */
  async acknowledgeSupervisorScheduleUpdates(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/notifications/acknowledge-updates`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
