/**
 * Datum Speech Parser: Multilingual Spoken Field & Intent Extractor
 * Deterministically parses continuous spoken field transcripts (English, Hindi, Tamil)
 * into structured Datum field updates (Discipline, Area, Tag, Status, Quantity, Blocker).
 */

import { EventStatus, SpokenParseResult } from '../types';
import { extractCandidateTags, normalizeEquipmentTag } from './ocrService';

// Spoken number to digits word mapping
const SPOKEN_NUMBERS: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
  thirteen: '13',
  fourteen: '14',
  fifteen: '15',
  sixteen: '16',
  seventeen: '17',
  eighteen: '18',
  nineteen: '19',
  twenty: '20',
  'twenty one': '21',
  'twenty two': '22',
  'twenty three': '23',
  'twenty four': '24',
  'twenty five': '25',
  thirty: '30',
  forty: '40',
  'four fifteen': '415',
  'four hundred fifteen': '415',
  fifty: '50',
  hundred: '100',
  thousand: '1000',
};

/**
 * Normalizes spoken number words, dashes, and acronym spaces into standard tag format.
 * e.g., "twenty four dash c w dash zero seventeen" -> "24-CW-017"
 */
export function normalizeSpokenText(transcript: string): string {
  let text = transcript.toLowerCase();

  // Replace spoken punctuation words
  text = text
    .replace(/\b(dash|hyphen|minus)\b/gi, '-')
    .replace(/\b(dot|point)\b/gi, '.')
    .replace(/\b(slash)\b/gi, '/');

  // Replace common spoken numbers
  Object.keys(SPOKEN_NUMBERS).forEach(word => {
    const num = SPOKEN_NUMBERS[word];
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    text = text.replace(regex, num);
  });

  // Re-join spoken letters with numbers (e.g., "24 - cw - 017" -> "24-CW-017")
  text = text.replace(/(\d+)\s*-\s*([a-z]+)\s*-\s*(\d+)/gi, '$1-$2-$3');
  text = text.replace(/([a-z]+)\s*-\s*(\d+)/gi, '$1-$2');

  return text.trim();
}

/**
 * Parses spoken speech transcript into structured Datum fields.
 */
export function parseSpokenUpdate(
  rawTranscript: string,
  language: 'en-IN' | 'hi-IN' | 'ta-IN' = 'en-IN'
): SpokenParseResult {
  const normalized = normalizeSpokenText(rawTranscript);
  const lower = normalized.toLowerCase();

  // 1. Discipline Extraction
  let discipline = 'Piping';
  let disciplineConfidence = 60;

  if (/(pipe|piping|spool|flange|weld|hydrotest|pipe rack|fittings|valve|inch-dia|joint|paiping)/i.test(lower)) {
    discipline = 'Piping';
    disciplineConfidence = 95;
  } else if (/(civil|concrete|rebar|shuttering|foundation|raft|pcc|rcc|excavation|earthwork|slab|sivil)/i.test(lower)) {
    discipline = 'Civil';
    disciplineConfidence = 95;
  } else if (/(electrical|cable|cable tray|transformer|mcc|switchgear|earthing|lighting|switchyard|panel|wire)/i.test(lower)) {
    discipline = 'Electrical';
    disciplineConfidence = 95;
  } else if (/(instrumentation|instrument|transmitter|sensor|junction box|jb|loop check|tubing|calibration|pt-)/i.test(lower)) {
    discipline = 'Instrumentation';
    disciplineConfidence = 95;
  } else if (/(hse|safety|scaffolding|fire|ppe|toolbox|hazard|safety inspection|permit)/i.test(lower)) {
    discipline = 'HSE';
    disciplineConfidence = 95;
  }

  // 2. Spatial Area Extraction
  let area = 'Utility Yard';
  if (/(utility yard|utility area)/i.test(lower)) {
    area = 'Utility Yard';
  } else if (/(pump bay|pump house|cw pump)/i.test(lower)) {
    area = 'Pump Bay';
  } else if (/(substation|sub station|electrical building)/i.test(lower)) {
    area = 'Substation';
  } else if (/(switchyard|switch yard|transformer yard)/i.test(lower)) {
    area = 'Switchyard';
  } else if (/(pipe rack|rack area)/i.test(lower)) {
    area = 'Pipe Rack Area';
  } else if (/(cooling tower|ct basin)/i.test(lower)) {
    area = 'Cooling Tower Basin';
  } else if (/(turbine building|turbine hall)/i.test(lower)) {
    area = 'Turbine Building';
  } else if (/(battery limit|isbl|osbl)/i.test(lower)) {
    area = 'ISBL Workfront';
  }

  // 3. Equipment / Line Tag Detection
  const candidateTags = extractCandidateTags(normalized);
  let detectedTag: string | undefined = candidateTags.length > 0 ? candidateTags[0] : undefined;

  // Additional check for spoken tags like "24 CW 017" or "CW 017"
  if (!detectedTag) {
    const spokenTagMatch = lower.match(/\b(\d{2})?\s*[- ]?(cw|fw|rw|pt|mcc|tk|p)\s*[- ]?(\d{2,4}[a-z]?)\b/i);
    if (spokenTagMatch) {
      detectedTag = normalizeEquipmentTag(spokenTagMatch[0]);
    }
  }

  // 4. Event Status Extraction (Multilingual: English, Hindi, Tamil)
  let eventStatus: EventStatus = 'Completed';

  // Completed signals
  if (
    /(completed|finished|erected|done|purna|ho gaya|ho chuka|mudinjadhu|mudinthathu|khatam|tested|cleared)/i.test(lower)
  ) {
    eventStatus = 'Completed';
  }
  // In Progress signals
  else if (
    /(in progress|ongoing|continuing|chal raha|nadanthukittu|working on|underway|aligning|pulling|fitting)/i.test(lower)
  ) {
    eventStatus = 'In Progress';
  }
  // Started signals
  else if (
    /(started|initiated|began|shuru|aaramichachu|commenced)/i.test(lower)
  ) {
    eventStatus = 'Started';
  }

  // 5. Quantity Metric Extraction
  let quantity: string | undefined;
  const quantityMatch = lower.match(/\b(\d+(\.\d+)?)\s*(joints|spools|meters|m|cubic meters|m3|percent|%|units|nos|tons|kg|coils)\b/i);
  if (quantityMatch) {
    quantity = quantityMatch[0];
  } else if (/100\s*(percent|%)/i.test(lower)) {
    quantity = '100%';
  }

  // 6. Blocker / Issue Flag Extraction
  let issueFlag: string | undefined;
  let issueSeverity: 'low' | 'medium' | 'critical' | undefined;

  if (/(blocker|blocked|crane breakdown|crane issue|leak|hydro leak|access hold|permit hold|scaffold missing|delay|rukaavat|thadai|hazard)/i.test(lower)) {
    if (/crane|breakdown|leak|hazard|stop/i.test(lower)) {
      issueFlag = 'Reported on-site equipment / access blocker from voice log';
      issueSeverity = 'critical';
    } else {
      issueFlag = 'Field delay flag noted in voice dictation';
      issueSeverity = 'medium';
    }
  }

  // 7. Clean Formatted Task Description
  let cleanDescription = rawTranscript.trim();
  // Capitalize first letter
  if (cleanDescription.length > 0) {
    cleanDescription = cleanDescription.charAt(0).toUpperCase() + cleanDescription.slice(1);
  }

  const confidenceScore = Math.min(
    100,
    disciplineConfidence + (detectedTag ? 25 : 10) + (area ? 15 : 0)
  );

  return {
    rawTranscript,
    cleanDescription,
    discipline,
    area,
    eventStatus,
    detectedTag,
    quantity,
    issueFlag,
    issueSeverity,
    confidenceScore,
    language,
  };
}
