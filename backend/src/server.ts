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
} from './db.ts';
import type { PlannerDecision, AuditLog } from './db.ts';
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
app.post('/api/planner/action', (req, res) => {
  try {
    const { updateId, actionType, targetActivityId, note } = req.body;
    const siteUpdates = getSiteUpdates();
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

    const decision: PlannerDecision = {
      updateId,
      linkedActivityId: finalActivityId,
      status: statusStr,
      actionType,
      plannerNote: note || '',
      updatedAt: new Date().toISOString(),
    };

    savePlannerDecision(decision);

    // Record in immutable audit log
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
 * 11. Speech-to-Text Audio Transcription Endpoint
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const pythonProcess = spawn('python', [scriptPath, tempFilePath, lang]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', data => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', data => {
      stderrData += data.toString();
    });

    pythonProcess.on('close', code => {
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
