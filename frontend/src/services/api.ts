import type {
  ScheduleActivity,
  SiteUpdate,
  MatchResult,
  PlannerDecision,
  AuditLog,
  PlannerActionType,
  UserAccount,
  ApprovalHistoryItem,
} from '../types';

let cachedApiBase = '/api';

export const getApiBase = async (): Promise<string> => {
  const candidates = [cachedApiBase, '/api', 'http://localhost:5000/api', 'http://localhost:5001/api', 'http://localhost:5002/api', 'http://localhost:5050/api'];
  const unique = Array.from(new Set(candidates));
  for (const c of unique) {
    try {
      const res = await fetch(`${c}/health`, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        cachedApiBase = c;
        return c;
      }
    } catch {}
  }
  return cachedApiBase;
};

async function apiFetch(endpoint: string, init?: RequestInit): Promise<Response> {
  const base = await getApiBase();
  try {
    const res = await fetch(`${base}${endpoint}`, init);
    return res;
  } catch (err) {
    // If request failed, try candidate ports in case backend shifted port
    const freshBase = await getApiBase();
    if (freshBase !== base) {
      return await fetch(`${freshBase}${endpoint}`, init);
    }
    throw err;
  }
}

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
   * Check if backend REST API is responsive across candidate ports
   */
  async checkHealth(): Promise<HealthResponse | null> {
    const candidates = [cachedApiBase, '/api', 'http://localhost:5000/api', 'http://localhost:5001/api', 'http://localhost:5002/api', 'http://localhost:5050/api'];
    const unique = Array.from(new Set(candidates));
    for (const c of unique) {
      try {
        const res = await fetch(`${c}/health`, { method: 'GET', cache: 'no-store' });
        if (res.ok) {
          cachedApiBase = c;
          return await res.json();
        }
      } catch {}
    }
    return null;
  },

  /**
   * User login against SQLite backend
   */
  async login(username: string, passwordPlain: string): Promise<AuthResponse> {
    try {
      const res = await apiFetch('/auth/login', {
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
      const res = await apiFetch('/auth/register', {
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
      const res = await apiFetch('/auth/users');
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
      const res = await apiFetch('/approvals/history');
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Fetch all projects from SQLite database
   */
  async fetchProjects(): Promise<import('../types').ProjectOption[]> {
    try {
      const res = await apiFetch('/projects');
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Create new project in SQLite database
   */
  async createProject(project: import('../types').ProjectOption): Promise<{ success: boolean; project?: import('../types').ProjectOption }> {
    try {
      const res = await apiFetch('/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!res.ok) return { success: false };
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  /**
   * Delete project and its scoped data from SQLite database
   */
  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const res = await apiFetch(`/projects/${projectId}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Fetch all initial state from SQLite backend for a given project
   */
  async fetchInitialData(projectId?: string): Promise<{
    schedule: ScheduleActivity[];
    siteUpdates: SiteUpdate[];
    matchResults: Record<string, MatchResult>;
    plannerDecisions: Record<string, PlannerDecision>;
    auditLogs: AuditLog[];
  } | null> {
    try {
      const pParam = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
      const [scheduleRes, updatesRes, matchesRes, decisionsRes, auditRes] = await Promise.all([
        apiFetch(`/schedule${pParam}`),
        apiFetch(`/site-updates${pParam}`),
        apiFetch(`/matches${pParam}`),
        apiFetch(`/planner/decisions${pParam}`),
        apiFetch(`/audit-trail${pParam}`),
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
      console.error('Error fetching data from DATUM backend:', err);
      return null;
    }
  },

  /**
   * Submit planner action (approve, relink, mark_unplanned, reject) with cryptographically verified decision
   */
  async submitPlannerAction(
    updateId: string,
    actionType: string,
    targetActivityId?: string | null,
    note?: string,
    userContext?: { userId?: string; userName?: string; userRole?: string },
    projectId?: string
  ): Promise<{ success: boolean; decision: PlannerDecision; auditLog: AuditLog } | null> {
    try {
      const res = await apiFetch('/planner/action', {
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
          projectId: projectId || 'iocl-p4',
        }),
      });

      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Error submitting planner action to backend:', err);
      return null;
    }
  },

  /**
   * Save planner decision & audit log
   */
  async recordPlannerDecision(params: {
    updateId: string;
    actionType: PlannerActionType;
    linkedActivityId?: string;
    plannerNote?: string;
    newActivityName?: string;
    newDiscipline?: string;
    userId?: string;
    userName?: string;
    userRole?: string;
    l5Code?: string;
    taskHash?: string;
    evidenceHash?: string;
    digitalSignature?: string;
  }): Promise<boolean> {
    try {
      const res = await apiFetch('/planner/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      return res.ok;
    } catch (err) {
      console.error('Error saving decision to backend:', err);
      return false;
    }
  },

  /**
   * Update site update details (e.g. status, quantity)
   */
  async updateSiteUpdate(updateId: string, fields: Partial<SiteUpdate>): Promise<{ siteUpdate: SiteUpdate; matchResult: MatchResult } | null> {
    try {
      const res = await apiFetch(`/site-updates/${updateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });

      if (!res.ok) return null;
      const data = await res.json();
      return {
        siteUpdate: data.siteUpdate,
        matchResult: data.matchResult,
      };
    } catch (err) {
      console.error('Error updating site update:', err);
      return null;
    }
  },

  /**
   * Upload site raw files to backend for ingestion
   */
  async uploadFiles(
    files: {
      dailyReportTxt?: File | string;
      pipingProgressXlsx?: File | ArrayBuffer;
    },
    projectId?: string
  ): Promise<boolean> {
    try {
      const formData = new FormData();
      if (projectId) {
        formData.append('projectId', projectId);
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

      const res = await apiFetch('/ingest/upload', {
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
      const res = await apiFetch('/reset-demo', { method: 'POST' });
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
    return `${cachedApiBase}/export/csv`;
  },

  /**
   * Get schedule versions list
   */
  async getScheduleVersions(): Promise<import('../types').ScheduleVersion[]> {
    try {
      const res = await apiFetch('/schedule/versions');
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
      const res = await apiFetch('/schedule/activate-version', {
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

      const res = await apiFetch('/schedule/upload-version', {
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
      const res = await apiFetch('/submissions/inbox');
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
      const res = await apiFetch('/submissions/create', {
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
      const res = await apiFetch(`/notifications${role ? `?role=${role}` : ''}`);
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
      const res = await apiFetch('/notifications/acknowledge-updates', { method: 'POST' });
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
      const res = await apiFetch('/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Initialize a fresh, clean project session
   */
  async initNewProject(): Promise<boolean> {
    try {
      const res = await apiFetch('/projects/new', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Re-verify single match result with AI
   */
  async reverifyMatch(updateId: string): Promise<any> {
    try {
      const res = await apiFetch('/match/reverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateId }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
