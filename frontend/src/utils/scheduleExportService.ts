import { ScheduleActivity, SiteUpdate, PlannerDecision } from '../types';

/**
 * Downloads generated string content as a client-side file.
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an authentic Oracle Primavera P6 (.XER) format schedule export.
 * Includes updated actual dates, % progress, remaining duration, and WBS mapping.
 */
export function exportPrimaveraP6XER(
  activities: ScheduleActivity[],
  siteUpdates: SiteUpdate[],
  decisions: Record<string, PlannerDecision>,
  projectName: string = 'DATUM-SIH122-EXPANSION'
): void {
  const nowStr = new Date().toISOString().slice(0, 10);
  const xerLines: string[] = [];

  // 1. XER Header
  xerLines.push('ERMHDR\t8.3\t2026-09-08\tXER\tDATUM-P6-BRIDGE');
  xerLines.push('%T\tPROJECT');
  xerLines.push('%F\tproj_id\tproj_short_name\tproj_name\tstatus_code\tplan_start_date\tplan_end_date');
  xerLines.push(`%R\t1001\t${projectName}\tIndustrial EPC Refined Master Baseline\tActive\t2026-09-01\t2026-10-30`);

  // 2. WBS Table
  xerLines.push('%T\tPROJWBS');
  xerLines.push('%F\twbs_id\tproj_id\twbs_short_name\twbs_name\tparent_wbs_id');
  xerLines.push('%R\t2001\t1001\t1.0\tCivil & Structural Works\t');
  xerLines.push('%R\t2002\t1001\t2.0\tPiping & Mechanical Works\t');
  xerLines.push('%R\t2003\t1001\t3.0\tElectrical & Instrumentation\t');

  // 3. Task / Activity Table (%T TASK)
  xerLines.push('%T\tTASK');
  xerLines.push('%F\ttask_id\tproj_id\twbs_id\ttask_code\ttask_name\tstatus_code\ttarget_start_date\ttarget_end_date\tact_start_date\tact_end_date\tphys_complete_pct\trem_dur_hr_cnt');

  activities.forEach((act, index) => {
    const taskId = 3000 + index + 1;
    const wbsId = act.wbs.startsWith('1') ? 2001 : act.wbs.startsWith('2') ? 2002 : 2003;
    const statusCode = act.status === 'Completed' ? 'TK_Complete' : act.status === 'In Progress' ? 'TK_Active' : 'TK_NotStart';
    const progressPct = act.progressPercent || (act.status === 'Completed' ? 100 : act.status === 'In Progress' ? 50 : 0);
    const remDur = act.status === 'Completed' ? 0 : 40;

    xerLines.push(
      `%R\t${taskId}\t1001\t${wbsId}\t${act.activityId}\t${act.activityName}\t${statusCode}\t${act.plannedStart} 08:00\t${act.plannedFinish} 17:00\t${act.actualStart ? `${act.actualStart} 08:00` : ''}\t${act.actualFinish ? `${act.actualFinish} 17:00` : ''}\t${progressPct}\t${remDur}`
    );
  });

  // 4. Task Predecessor Relationships (%T TASKPRED)
  xerLines.push('%T\tTASKPRED');
  xerLines.push('%F\ttask_pred_id\ttask_id\tpred_task_id\tpred_type\tlag_hr_cnt');
  activities.forEach((act, index) => {
    if (index > 0) {
      const predId = 4000 + index;
      const taskId = 3000 + index + 1;
      const prevTaskId = 3000 + index;
      xerLines.push(`%R\t${predId}\t${taskId}\t${prevTaskId}\tPR_FS\t0`);
    }
  });

  xerLines.push('%E\tEND_OF_XER');

  const xerText = xerLines.join('\n');
  downloadFile(xerText, `Primavera_P6_Reconciled_${nowStr}.xer`, 'text/plain;charset=utf-8');
}

/**
 * Generates an authentic Microsoft Project (.XML) schedule export.
 */
export function exportMSProjectXML(
  activities: ScheduleActivity[],
  projectName: string = 'DATUM Industrial EPC'
): void {
  const nowStr = new Date().toISOString().slice(0, 10);
  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Project xmlns="http://schemas.microsoft.com/project">',
    `  <Name>${projectName}</Name>`,
    `  <StartDate>${nowStr}T08:00:00</StartDate>`,
    '  <Tasks>',
  ];

  activities.forEach((act, index) => {
    const uid = index + 1;
    const percentComplete = act.progressPercent || (act.status === 'Completed' ? 100 : act.status === 'In Progress' ? 50 : 0);

    xmlLines.push('    <Task>');
    xmlLines.push(`      <UID>${uid}</UID>`);
    xmlLines.push(`      <ID>${uid}</ID>`);
    xmlLines.push(`      <Name>${act.activityName.replace(/&/g, '&amp;')}</Name>`);
    xmlLines.push(`      <OutlineNumber>${act.wbs}</OutlineNumber>`);
    xmlLines.push(`      <Start>${act.plannedStart}T08:00:00</Start>`);
    xmlLines.push(`      <Finish>${act.plannedFinish}T17:00:00</Finish>`);
    if (act.actualStart) {
      xmlLines.push(`      <ActualStart>${act.actualStart}T08:00:00</ActualStart>`);
    }
    if (act.actualFinish) {
      xmlLines.push(`      <ActualFinish>${act.actualFinish}T17:00:00</ActualFinish>`);
    }
    xmlLines.push(`      <PercentComplete>${percentComplete}</PercentComplete>`);
    xmlLines.push(`      <Critical>${act.criticalPath ? 1 : 0}</Critical>`);
    xmlLines.push('    </Task>');
  });

  xmlLines.push('  </Tasks>');
  xmlLines.push('</Project>');

  const xmlText = xmlLines.join('\n');
  downloadFile(xmlText, `MS_Project_Reconciled_${nowStr}.xml`, 'application/xml;charset=utf-8');
}
