/**
 * IST Time Service & Relative Date Resolver
 * Indian Standard Time (UTC +5:30) Telemetry & Shift Tracker
 */
import { useState, useEffect } from 'react';

export interface ISTTelemetry {
  currentISTDate: Date;
  dateIsoString: string; // YYYY-MM-DD
  dateFormatted: string; // e.g. "21 Sep 2026"
  timeFormatted: string; // e.g. "23:15:30 IST"
  formattedIST: string; // e.g. "21 Sep 2026 • 23:15:30 IST"
  shiftName: string; // e.g. "Shift B (16:00 - 00:00)"
  shiftCode: 'A' | 'B' | 'N';
  shiftHours: string;
  isWorkingHours: boolean;
}

/**
 * Returns current Date in Indian Standard Time (UTC +5:30)
 */
export function getNowIST(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 5.5 * 3600000);
}

/**
 * Computes full IST telemetry and current shift information
 */
export function getISTTelemetry(dateInput?: Date): ISTTelemetry {
  const istDate = dateInput ? dateInput : getNowIST();

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const dateIsoString = `${year}-${month}-${day}`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateFormatted = `${day} ${months[istDate.getMonth()]} ${year}`;

  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');
  const timeFormatted = `${hours}:${minutes}:${seconds} IST`;

  const hourNum = istDate.getHours();
  let shiftName = 'Shift A: Morning (08:00 - 16:00 IST)';
  let shiftCode: 'A' | 'B' | 'N' = 'A';
  let shiftHours = '08:00 - 16:00';
  let isWorkingHours = true;

  if (hourNum >= 8 && hourNum < 16) {
    shiftName = 'Shift A: Day Operations (08:00 - 16:00 IST)';
    shiftCode = 'A';
    shiftHours = '08:00 - 16:00';
  } else if (hourNum >= 16 && hourNum < 24) {
    shiftName = 'Shift B: Evening Handover (16:00 - 00:00 IST)';
    shiftCode = 'B';
    shiftHours = '16:00 - 00:00';
  } else {
    shiftName = 'Shift N: Night Maintenance (00:00 - 08:00 IST)';
    shiftCode = 'N';
    shiftHours = '00:00 - 08:00';
    isWorkingHours = false;
  }

  return {
    currentISTDate: istDate,
    dateIsoString,
    dateFormatted,
    timeFormatted,
    formattedIST: `${dateFormatted} • ${timeFormatted}`,
    shiftName,
    shiftCode,
    shiftHours,
    isWorkingHours,
  };
}

/**
 * Deterministically parses spoken or typed relative dates in English, Hindi, and Tamil:
 * "today", "yesterday", "tomorrow", "tmrw", "started yesterday", "2 days ago", "कल", "आज", "நேற்று"
 * and returns the exact IST ISO date (YYYY-MM-DD) and a relative label.
 */
export function resolveRelativeISTDate(
  rawText: string,
  baseDate?: Date
): { isoDate: string; label: string; offsetDays: number } {
  const ist = baseDate ? baseDate : getNowIST();
  const text = rawText.toLowerCase();

  let offsetDays = 0;
  let label = 'Today';

  // 1. Day before yesterday / 2 days ago
  if (
    /day before yesterday|2 days ago|two days ago|परसों|முந்தாநாள்/i.test(text)
  ) {
    offsetDays = -2;
    label = 'Day Before Yesterday';
  }
  // 2. Yesterday / started yesterday / last night
  else if (
    /yesterday|started yesterday|erected yesterday|last night|last shift|started kal|कल शुरू|நேற்று/i.test(text)
  ) {
    offsetDays = -1;
    label = 'Yesterday';
  }
  // 3. Tomorrow / tmrw / next shift
  else if (
    /tomorrow|tmrw|next day|next shift|कल होगा|நாளை/i.test(text)
  ) {
    offsetDays = 1;
    label = 'Tomorrow';
  }
  // 4. Specific past day offsets e.g. "3 days ago"
  else {
    const agoMatch = text.match(/(\d+)\s+days?\s+ago/i);
    if (agoMatch && agoMatch[1]) {
      const days = parseInt(agoMatch[1], 10);
      offsetDays = -days;
      label = `${days} Days Ago`;
    }
  }

  const targetDate = new Date(ist.getTime() + offsetDays * 86400000);
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;

  return {
    isoDate,
    label,
    offsetDays,
  };
}

/**
 * React hook to keep an active, updating IST clock
 */
export function useLiveISTClock(): ISTTelemetry {
  const [telemetry, setTelemetry] = useState<ISTTelemetry>(() => getISTTelemetry());

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(getISTTelemetry());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return telemetry;
}
