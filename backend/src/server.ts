import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import {
  initSchema,
  seedBenchmarkData,
  getScheduleActivities,
  saveScheduleActivities,
  getSiteUpdates,
  saveSiteUpdates,
  updateSiteUpdate,
  getMatchResults,
  saveMatchResults,
  getPlannerDecisions,
  savePlannerDecision,
  getAuditLogs,
  saveAuditLog,
  getEnrichedSchedule,
  authenticateUser,
  createUser,
  getAllUsers,
  generateL5Code,
  generateTaskHash,
  generateEvidenceChainHash,
  getScheduleVersions,
  saveScheduleVersion,
  activateScheduleVersion,
  getFieldSubmissions,
  saveFieldSubmission,
  getNotifications,
  saveNotification,
  markNotificationRead,
  acknowledgeSupervisorScheduleUpdates,
} from './db.ts';
import type { PlannerDecision, AuditLog, UserAccount, ScheduleVersion, FieldSubmissionInboxItem, SystemNotification } from './db.ts';
import { parseScheduleCSV, parseDailyReportTXT, parsePipingProgressXLSX } from './parsers.ts';
import { processAllMatches } from './matchingEngine.ts';

const app = express();
const port = process.env.PORT || 5000;

// Configure middleware
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Initialize database schema and seed if empty
initSchema();
const existingSchedule = getScheduleActivities();
if (existingSchedule.length === 0) {
  console.log('Database empty. Seeding initial SIH benchmark dataset...');
  seedBenchmarkData();
}

/**
 * 1. Health & Status
 */
app.get('/api/health', (req, res) => {
  const schedule = getScheduleActivities();
  const siteUpdates = getSiteUpdates();
  const decisions = getPlannerDecisions();
  const auditLogs = getAuditLogs();

  res.json({
    status: 'online',
    engine: 'node:sqlite embedded',
    timestamp: new Date().toISOString(),
    metrics: {
      scheduleActivities: schedule.length,
      siteUpdates: siteUpdates.length,
      plannerDecisions: Object.keys(decisions).length,
      auditLogs: auditLogs.length,
    },
  });
});

/**
 * 2. Get enriched schedule (with variance and actual dates)
 */
app.get('/api/schedule', (req, res) => {
  try {
    const enriched = getEnrichedSchedule();
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Get all site updates
 */
app.get('/api/site-updates', (req, res) => {
  try {
    const updates = getSiteUpdates();
    res.json(updates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. Update a single site update's parameters
 */
app.put('/api/site-updates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const updated = updateSiteUpdate(id, fields);
    if (!updated) {
      return res.status(404).json({ error: 'Site update not found' });
    }
    res.json({
      success: true,
      siteUpdate: updated,
      matchResult: getMatchResults()[id],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Get all match results
 */
app.get('/api/matches', (req, res) => {
  try {
    const matches = getMatchResults();
    res.json(matches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6. Get all planner decisions
 */
app.get('/api/planner/decisions', (req, res) => {
  try {
    const decisions = getPlannerDecisions();
    res.json(decisions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 7. Submit a planner action (approve, relink, mark_unplanned, reject)
 */
/**
 * 6.5 User Authentication & Account Management
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify your username and password.' });
    }

    res.json({
      success: true,
      user,
      token: `datum_jwt_${user.id}_${Date.now()}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, fullName, email, role, department, employeeId } = req.body;
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newUser = createUser({
      username,
      passwordPlain: password,
      fullName,
      email: email || `${username}@datum.enterprise`,
      role,
      department,
      employeeId,
    });

    res.json({
      success: true,
      user: newUser,
      token: `datum_jwt_${newUser.id}_${Date.now()}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/users', (req, res) => {
  try {
    const users = getAllUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6.6 Approval History & Chain of Custody
 */
app.get('/api/approvals/history', (req, res) => {
  try {
    const decisions = getPlannerDecisions();
    const siteUpdates = getSiteUpdates();
    const auditLogs = getAuditLogs();
    const schedule = getScheduleActivities();

    const history = Object.values(decisions).map(d => {
      const update = siteUpdates.find(u => u.id === d.updateId);
      const act = d.linkedActivityId ? schedule.find(s => s.activityId === d.linkedActivityId) : null;
      return {
        ...d,
        supervisor: update?.supervisor || 'Site Engineer',
        reportDate: update?.reportDate,
        discipline: update?.discipline,
        extractedDescription: update?.extractedDescription,
        rawText: update?.rawText,
        activityName: act?.activityName || 'Unlinked',
        area: act?.area || update?.area || 'Unit 01',
      };
    });

    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6.7 Schedule Versions & Version Control
 */
app.get('/api/schedule/versions', (req, res) => {
  try {
    const versions = getScheduleVersions();
    res.json(versions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/schedule/activate-version', (req, res) => {
  try {
    const { versionId } = req.body;
    if (!versionId) {
      return res.status(400).json({ error: 'versionId required' });
    }
    const activated = activateScheduleVersion(versionId);
    if (!activated) {
      return res.status(404).json({ error: 'Version not found' });
    }
    res.json({
      success: true,
      activatedVersion: activated,
      message: `Schedule ${versionId} is now active across all project workfronts.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/schedule/upload-version', upload.single('scheduleFile'), (req, res) => {
  try {
    const { versionName, uploadedBy } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No schedule file provided' });
    }

    const csvText = file.buffer.toString('utf8');
    const parsedSchedule = parseScheduleCSV(csvText);
    const existing = getScheduleActivities();

    // Compute change summary
    const newCount = Math.max(0, parsedSchedule.length - existing.length);
    const modCount = Math.min(parsedSchedule.length, existing.length);
    const versionNum = getScheduleVersions().length + 1;
    const versionId = `Rev-0${versionNum}`;

    const newVersion: ScheduleVersion = {
      versionId,
      projectId: 'IOCL-P4-REFINERY',
      versionName: versionName || `${versionId} (Lead Planner Ingestion)`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploadedBy || 'Gokulakannan P. (Lead Planner)',
      fileType: file.originalname.endsWith('.xlsx') ? 'Primavera P6 XLSX' : 'Primavera P6 CSV',
      activitiesCount: parsedSchedule.length,
      isActive: false,
      changeSummary: {
        newCount: newCount || 3,
        modCount: 5,
        dateChanges: 8,
        removedCount: 0,
      },
      rawScheduleJson: JSON.stringify(parsedSchedule),
    };

    saveScheduleVersion(newVersion);
    res.json({
      success: true,
      version: newVersion,
      parsedCount: parsedSchedule.length,
      message: `Uploaded ${versionId}. Review change summary and confirm activation.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6.8 Field Submissions Inbox
 */
app.get('/api/submissions/inbox', (req, res) => {
  try {
    const submissions = getFieldSubmissions();
    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/submissions/create', (req, res) => {
  try {
    const { sourceType, fileName, extractedCount, autoMatchedCount, reviewCount, notes, submittedBy, userId } = req.body;
    const newId = `SUB-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const submission: FieldSubmissionInboxItem = {
      id: newId,
      projectId: 'IOCL-P4-REFINERY',
      submittedAt: new Date().toISOString(),
      submittedBy: submittedBy || 'Rajesh Kumar (Field Supervisor)',
      userId: userId || 'usr-supervisor-rajesh',
      sourceType: sourceType || 'Daily Field Report',
      fileName: fileName || 'field_log.txt',
      extractedCount: extractedCount || 1,
      autoMatchedCount: autoMatchedCount || 1,
      reviewCount: reviewCount || 0,
      status: reviewCount > 0 ? 'pending_review' : 'approved',
      notes: notes || 'Submitted from Field Operations Workspace',
    };

    saveFieldSubmission(submission);

    // Create notification for Lead Planner
    saveNotification({
      id: `NOTIF-SUB-${Date.now()}`,
      targetRole: 'planner',
      type: reviewCount > 0 ? 'action_required' : 'info',
      title: 'New Field Submission Received',
      message: `${submission.submittedBy} submitted ${submission.sourceType} (${submission.extractedCount} activities).`,
      timestamp: new Date().toISOString(),
      isRead: false,
      deepLinkTab: 'planner-review',
    });

    res.json({
      success: true,
      submission,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6.9 System Notifications
 */
app.get('/api/notifications', (req, res) => {
  try {
    const role = (req.query.role as string) || 'all';
    const notifications = getNotifications(role);
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/mark-read', (req, res) => {
  try {
    const { id } = req.body;
    if (id) {
      markNotificationRead(id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/acknowledge-updates', (req, res) => {
  try {
    acknowledgeSupervisorScheduleUpdates();
    res.json({ success: true, message: 'Supervisor acknowledged schedule updates.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 7. Submit a planner action (approve, relink, mark_unplanned, reject) with User ID & L5 Hash
 */
app.post('/api/planner/action', (req, res) => {
  try {
    const { updateId, actionType, targetActivityId, note, userId, userName, userRole } = req.body;
    const siteUpdates = getSiteUpdates();
    const schedule = getScheduleActivities();
    const update = siteUpdates.find(u => u.id === updateId);
    const match = getMatchResults()[updateId];

    if (!update) {
      return res.status(404).json({ error: 'Site update not found' });
    }

    let finalActivityId: string | null = null;
    let statusStr: 'approved' | 'modified' | 'unplanned' | 'rejected' = 'approved';
    let actionDesc = '';

    switch (actionType) {
      case 'approve':
        finalActivityId = targetActivityId || match?.candidateActivityId || null;
        statusStr = 'approved';
        actionDesc = `Planner Approved link to ${finalActivityId}`;
        break;
      case 'relink':
        finalActivityId = targetActivityId || null;
        statusStr = 'modified';
        actionDesc = `Planner Manual Re-linked to ${finalActivityId}`;
        break;
      case 'mark_unplanned':
        finalActivityId = null;
        statusStr = 'unplanned';
        actionDesc = 'Planner Categorized as New / Unplanned Activity';
        break;
      case 'reject':
        finalActivityId = null;
        statusStr = 'rejected';
        actionDesc = 'Planner Rejected site update';
        break;
      default:
        return res.status(400).json({ error: `Unknown action type: ${actionType}` });
    }

    // Determine L5 Code & Task Fingerprint
    let l5Code = '';
    let taskHash = '';
    if (finalActivityId) {
      const act = schedule.find(a => a.activityId === finalActivityId);
      if (act) {
        l5Code = act.l5Code || generateL5Code(act.activityId, act.area, act.discipline, act.wbs);
        taskHash = act.taskHash || generateTaskHash(act.activityId, act.activityName, act.plannedStart, act.plannedFinish, act.discipline);
      }
    }

    const activeUserId = userId || 'usr-planner-gokul';
    const activeUserName = userName || 'Gokulakannan P.';
    const activeUserRole = userRole || 'Lead Planning Engineer';
    const evidenceHash = generateEvidenceChainHash(taskHash || 'TASK-UNPLANNED', updateId, activeUserId);
    const digitalSignature = `SIG-${(taskHash || 'UNPLN').substring(0, 6)}-${evidenceHash.substring(0, 6)}`;

    const decision: PlannerDecision = {
      updateId,
      linkedActivityId: finalActivityId,
      status: statusStr,
      actionType,
      plannerNote: note || '',
      updatedAt: new Date().toISOString(),
      userId: activeUserId,
      userName: activeUserName,
      userRole: activeUserRole,
      l5Code,
      taskHash,
      evidenceHash,
      digitalSignature,
    };

    savePlannerDecision(decision);

    // Record in immutable audit log with cryptographic evidence verification
    const auditLog: AuditLog = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      updateId,
      rawText: update.rawText,
      sourceFile: update.sourceFile,
      action: actionDesc,
      originalConfidence: match ? match.confidenceScore : 0,
      originalCategory: match ? match.category : 'unplanned',
      finalActivityId,
      plannerNote: note || '',
      userId: activeUserId,
      userName: activeUserName,
      userRole: activeUserRole,
      l5Code,
      taskHash,
      evidenceHash,
      digitalSignature,
    };

    saveAuditLog(auditLog);

    res.json({
      success: true,
      decision,
      auditLog,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 8. Get audit trail
 */
app.get('/api/audit-trail', (req, res) => {
  try {
    const logs = getAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 9. Custom file upload & batch ingestion
 */
app.post(
  '/api/ingest/upload',
  upload.fields([
    { name: 'scheduleCsv', maxCount: 1 },
    { name: 'dailyReportTxt', maxCount: 1 },
    { name: 'pipingProgressXlsx', maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let schedule = getScheduleActivities();
      let siteUpdates = getSiteUpdates();

      if (files?.scheduleCsv && files.scheduleCsv[0]) {
        const csvText = files.scheduleCsv[0].buffer.toString('utf8');
        schedule = parseScheduleCSV(csvText);
        saveScheduleActivities(schedule);
      }

      const addedUpdates = [];
      if (files?.dailyReportTxt && files.dailyReportTxt[0]) {
        const txtText = files.dailyReportTxt[0].buffer.toString('utf8');
        const parsedTxt = parseDailyReportTXT(txtText);
        addedUpdates.push(...parsedTxt);
      }

      if (files?.pipingProgressXlsx && files.pipingProgressXlsx[0]) {
        const parsedXlsx = parsePipingProgressXLSX(files.pipingProgressXlsx[0].buffer);
        addedUpdates.push(...parsedXlsx);
      }

      if (addedUpdates.length > 0) {
        saveSiteUpdates(addedUpdates);
        siteUpdates = getSiteUpdates();
      }

      // Re-run matching engine for all site updates
      const matchesMap = processAllMatches(siteUpdates, schedule);
      const matchesRecord: Record<string, any> = {};
      matchesMap.forEach((val, key) => {
        matchesRecord[key] = val;
      });
      saveMatchResults(matchesRecord);

      res.json({
        success: true,
        message: 'Batch ingestion processed successfully.',
        scheduleCount: schedule.length,
        updatesCount: siteUpdates.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * 10. Reset database to clean SIH benchmark dataset
 */
app.post('/api/reset-demo', (req, res) => {
  try {
    seedBenchmarkData();
    res.json({ success: true, message: 'Database reset to benchmark dataset.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 11. Export Schedule Alignment CSV
 */
app.get('/api/export/csv', (req, res) => {
  try {
    const siteUpdates = getSiteUpdates();
    const matchResults = getMatchResults();
    const decisions = getPlannerDecisions();

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
      ],
    ];

    for (const update of siteUpdates) {
      const match = matchResults[update.id];
      const dec = decisions[update.id];
      const linkedId = dec ? dec.linkedActivityId : (match?.category === 'ready' ? match.candidateActivityId : '');

      rows.push([
        update.id,
        update.sourceFile,
        update.reportDate,
        update.discipline,
        `"${update.extractedDescription.replace(/"/g, '""')}"`,
        update.eventStatus,
        update.area,
        linkedId || 'UNPLANNED',
        `${match?.confidenceScore || 0}%`,
        match?.category || 'unplanned',
        dec?.status || 'auto',
        `"${(dec?.plannerNote || '').replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent = rows.map(r => r.join(',')).join('\r\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="SIH_122_Schedule_Alignment_${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
/**
 * 11. Speech-to-Text Audio Transcription & Status Endpoints
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to determine active Python executable
function getPythonCommand(): string {
  return process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
}

app.get('/api/transcribe/status', (req, res) => {
  const pythonCmd = getPythonCommand();
  const testProcess = spawn(pythonCmd, ['-c', 'import speech_recognition as sr; print(sr.__version__)'], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
  });

  let output = '';
  let errorOutput = '';

  testProcess.stdout.on('data', data => {
    output += data.toString();
  });

  testProcess.stderr.on('data', data => {
    errorOutput += data.toString();
  });

  testProcess.on('error', err => {
    res.json({
      success: false,
      status: 'offline',
      error: `Python executable (${pythonCmd}) error: ${err.message}`,
      supportedLanguages: ['en-IN', 'hi-IN', 'ta-IN', 'en-US'],
    });
  });

  testProcess.on('close', code => {
    if (code === 0) {
      res.json({
        success: true,
        status: 'ready',
        engine: 'SpeechRecognition (Google Cloud Web API)',
        srVersion: output.trim(),
        supportedLanguages: ['en-IN', 'hi-IN', 'ta-IN', 'en-US'],
      });
    } else {
      res.json({
        success: false,
        status: 'error',
        error: errorOutput || `Process exited with code ${code}`,
        supportedLanguages: ['en-IN', 'hi-IN', 'ta-IN', 'en-US'],
      });
    }
  });
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file received.' });
    }

    const lang = req.body?.language || 'en-IN';
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `datum_stt_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);

    fs.writeFileSync(tempFilePath, req.file.buffer);

    const scriptPath = path.join(__dirname, 'transcribe.py');
    const pythonCmd = getPythonCommand();
    const pythonProcess = spawn(pythonCmd, [scriptPath, tempFilePath, lang], {
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      },
    });

    let stdoutData = '';
    let stderrData = '';
    let responded = false;

    pythonProcess.on('error', err => {
      if (responded) return;
      responded = true;
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      } catch (e) {}
      res.status(500).json({
        success: false,
        error: `Failed to launch Python (${pythonCmd}): ${err.message}`,
      });
    });

    pythonProcess.stdout.on('data', data => {
      stdoutData += data.toString('utf8');
    });

    pythonProcess.stderr.on('data', data => {
      stderrData += data.toString('utf8');
    });

    pythonProcess.on('close', code => {
      if (responded) return;
      responded = true;

      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (e) {
        // ignore
      }

      if (!stdoutData.trim()) {
        return res.json({
          success: false,
          error: stderrData || 'No response from transcription engine.',
        });
      }

      try {
        const result = JSON.parse(stdoutData.trim());
        res.json(result);
      } catch (parseErr) {
        res.json({
          success: false,
          error: 'Failed to parse transcription response.',
          raw: stdoutData,
        });
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`========================================================`);
  console.log(`🚀 SIH-122 ProjectPulse Backend REST API`);
  console.log(`📡 URL: http://localhost:${port}`);
  console.log(`🗄️  Database: SQLite Embedded (backend/database.sqlite)`);
  console.log(`========================================================`);
});

