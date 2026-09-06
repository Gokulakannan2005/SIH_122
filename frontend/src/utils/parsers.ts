import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ScheduleActivity, SiteUpdate, EventStatus } from '../types';

/**
 * Parse baseline schedule CSV file
 */
export function parseScheduleCSV(csvText: string): ScheduleActivity[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map((row: any) => {
    const rawAliases = row['Aliases'] || row['aliases'] || '';
    const aliases = rawAliases
      .split(';')
      .map((a: string) => a.trim().toLowerCase())
      .filter(Boolean);

    return {
      activityId: (row['Activity ID'] || row['activityId'] || '').trim(),
      wbs: (row['WBS'] || row['wbs'] || '').trim(),
      activityName: (row['Activity name'] || row['activityName'] || '').trim(),
      discipline: (row['Discipline'] || row['discipline'] || '').trim(),
      plannedStart: (row['Planned start'] || row['plannedStart'] || '').trim(),
      plannedFinish: (row['Planned finish'] || row['plannedFinish'] || '').trim(),
      area: (row['Area'] || row['area'] || '').trim(),
      aliases,
      rawAliases,
    };
  }).filter(act => act.activityId);
}

/**
 * Parse daily_report.txt free text file
 */
export function parseDailyReportTXT(txtText: string): SiteUpdate[] {
  const lines = txtText.split(/\r?\n/);
  const updates: SiteUpdate[] = [];

  let reportDate = '2026-09-05';
  let currentDiscipline = 'General';

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check for report date
    const dateMatch = trimmed.match(/Date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
    if (dateMatch) {
      reportDate = dateMatch[1];
      return;
    }

    // Check for discipline section header (e.g., "Civil", "Piping", "Electrical", "HSE")
    if (/^(Civil|Piping|Electrical|Instrumentation|HSE)$/i.test(trimmed)) {
      currentDiscipline = trimmed;
      return;
    }

    // Check for numbered item e.g. "3. CW 24-inch spool was erected near Pump Bay today..."
    const itemMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
    if (itemMatch) {
      const itemNum = itemMatch[1];
      const content = itemMatch[2].trim();

      // Check if explicit [Not in baseline] marker exists
      const isExplicitUnplanned = /\[Not in baseline\]/i.test(content);
      const cleanContent = content.replace(/\[Not in baseline\]/gi, '').trim();

      // Infer event status
      let eventStatus: EventStatus = 'In Progress';
      if (/completed|done|installed|finished/i.test(cleanContent)) {
        eventStatus = 'Completed';
      } else if (/started|erected|poured|excavated/i.test(cleanContent)) {
        eventStatus = 'Started';
      }

      // Infer area from common keywords
      let area = 'Unspecified';
      if (/Pump Bay/i.test(cleanContent)) area = 'Pump Bay';
      else if (/Filter Bay/i.test(cleanContent)) area = 'Filter Bay';
      else if (/Yard|fabrication/i.test(cleanContent)) area = 'Fabrication Yard';
      else if (/Substation|trench/i.test(cleanContent)) area = 'Substation';
      else if (/Pipe Rack/i.test(cleanContent)) area = 'Pipe Rack A';

      updates.push({
        id: `TXT-LINE-${itemNum}`,
        sourceFile: 'daily_report.txt',
        sourceType: 'text_report',
        discipline: currentDiscipline,
        reportDate,
        rawText: trimmed,
        extractedDescription: cleanContent,
        eventStatus,
        area,
        lineEvidence: index + 1,
        isExplicitUnplanned,
      });
    }
  });

  return updates;
}

/**
 * Parse piping_progress.xlsx buffer or array buffer
 */
export function parsePipingProgressXLSX(data: ArrayBuffer | Uint8Array): SiteUpdate[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map((row, index) => {
    const rawText = `${row['Entry ID'] || ''}: ${row['Site description'] || ''} (${row['Status'] || ''})`;
    const statusRaw = String(row['Status'] || '').toLowerCase();
    let eventStatus: EventStatus = 'In Progress';
    if (statusRaw.includes('completed')) eventStatus = 'Completed';
    else if (statusRaw.includes('started')) eventStatus = 'Started';

    let dateStr = '2026-09-05';
    if (row['Report date']) {
      if (typeof row['Report date'] === 'string') {
        dateStr = row['Report date'];
      } else if (typeof row['Report date'] === 'number') {
        // Excel date serial number conversion
        const excelDate = new Date(Math.round((row['Report date'] - 25569) * 86400 * 1000));
        dateStr = excelDate.toISOString().split('T')[0];
      }
    }

    return {
      id: `XLSX-ROW-${row['Entry ID'] || index + 1}`,
      sourceFile: 'piping_progress.xlsx',
      sourceType: 'excel_sheet',
      entryId: String(row['Entry ID'] || ''),
      discipline: String(row['Discipline'] || 'Piping'),
      reportDate: dateStr,
      rawText,
      extractedDescription: String(row['Site description'] || ''),
      eventStatus,
      area: String(row['Area'] || 'Unspecified'),
      quantity: row['Quantity'],
      unit: String(row['Unit'] || ''),
      supervisor: String(row['Supervisor'] || ''),
      lineEvidence: index + 2, // Excel 1-based header + 1
    };
  });
}
