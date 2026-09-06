/**
 * Datum Speech Parser: Multilingual Spoken Field & Intent Extractor
 * Deterministically parses continuous spoken field transcripts (English, Hindi, Tamil)
 * in both Latin/Romanized and Native scripts (Devanagari & Tamil)
 * into structured Datum field updates (Discipline, Area, Tag, Status, Quantity, Blocker).
 */

import { EventStatus, SpokenParseResult } from '../types';
import { extractCandidateTags, normalizeEquipmentTag } from './ocrService';

// Spoken number to digits word mapping (English, Hindi, Tamil, Devanagari, Tamil numerals)
const SPOKEN_NUMBERS: Record<string, string> = {
  // English words
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

  // Hindi (Devanagari) numbers & words
  'शून्य': '0',
  'एक': '1',
  'दो': '2',
  'तीन': '3',
  'चार': '4',
  'पांच': '5',
  'पाँच': '5',
  'छह': '6',
  'सात': '7',
  'आठ': '8',
  'नौ': '9',
  'दस': '10',
  'ग्यारह': '11',
  'बारह': '12',
  'तेरह': '13',
  'चौदह': '14',
  'पंद्रह': '15',
  'सोलह': '16',
  'सत्रह': '17',
  'अठारह': '18',
  'उन्नीस': '19',
  'बीस': '20',
  'चौबीस': '24',
  'पच्चीस': '25',
  'तीस': '30',
  'चालीस': '40',
  'पैंतालीस': '45',
  'पचास': '50',
  'सौ': '100',
  'हजार': '1000',

  // Devanagari digits
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',

  // Tamil words & numerals
  'பூஜ்ஜியம்': '0',
  'ஒன்று': '1',
  'இரண்டு': '2',
  'மூன்று': '3',
  'நான்கு': '4',
  'ஐந்து': '5',
  'ஆறு': '6',
  'ஏழு': '7',
  'எட்டு': '8',
  'ஒன்பது': '9',
  'பத்து': '10',
  'இருபத்து நான்கு': '24',
  'இருபத்தி நான்கு': '24',
  'இருபது': '20',
  'நாற்பத்து ஐந்து': '45',
  'ஐம்பது': '50',
  'நூறு': '100',
  'ஆயிரம்': '1000',
};

/**
 * Normalizes spoken number words, dashes, and acronym spaces into standard tag format.
 * e.g., "twenty four dash c w dash zero seventeen" -> "24-CW-017"
 */
export function normalizeSpokenText(transcript: string): string {
  let text = transcript.toLowerCase();

  // Replace spoken punctuation words
  text = text
    .replace(/\b(dash|hyphen|minus|डैश)\b/gi, '-')
    .replace(/\b(dot|point|डॉट)\b/gi, '.')
    .replace(/\b(slash|स्लैश)\b/gi, '/');

  // Replace common spoken numbers
  Object.keys(SPOKEN_NUMBERS).forEach(word => {
    const num = SPOKEN_NUMBERS[word];
    const regex = new RegExp(`\\b${word}\\b|${word}`, 'gi');
    text = text.replace(regex, ` ${num} `);
  });

  // Clean up extra spaces
  text = text.replace(/\s+/g, ' ').trim();

  // Re-join spoken letters with numbers (e.g., "24 - cw - 017" -> "24-CW-017")
  text = text.replace(/(\d+)\s*[- ]\s*([a-z]+)\s*[- ]\s*(\d+)/gi, '$1-$2-$3');
  text = text.replace(/([a-z]+)\s*[- ]\s*(\d+)/gi, '$1-$2');

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
  const rawLower = rawTranscript.toLowerCase();

  // 1. Discipline Extraction (Multilingual: English, Hindi/Devanagari, Tamil)
  let discipline = 'Piping';
  let disciplineConfidence = 60;

  if (
    /(pipe|piping|spool|flange|weld|hydrotest|pipe rack|fittings|valve|inch-dia|joint|paiping|पाइपिंग|पाइप|स्पूल|वेल्ड|वेल्डिंग|फ्लैंज|हाइड्रोटेस्ट|பைப்|குழாய்|இணைப்பு)/i.test(
      lower
    ) ||
    /(पाइपिंग|पाइप|स्पूल|वेल्ड|பைப்|குழாய்)/.test(rawLower)
  ) {
    discipline = 'Piping';
    disciplineConfidence = 95;
  } else if (
    /(civil|concrete|rebar|shuttering|foundation|raft|pcc|rcc|excavation|earthwork|slab|sivil|सिविल|कंक्रीट|फाउंडेशन|राफ्ट|सरिया|खुदाई|सिबिल|கான்கிரீட்|அடித்தளம்|சிவில்)/i.test(
      lower
    ) ||
    /(सिविल|कंक्रीट|फाउंडेशन|சிவில்|கான்கிரீட்)/.test(rawLower)
  ) {
    discipline = 'Civil';
    disciplineConfidence = 95;
  } else if (
    /(electrical|cable|cable tray|transformer|mcc|switchgear|earthing|lighting|switchyard|panel|wire|इलेक्ट्रिकल|केबल|ट्रांसफार्मर|वायरिंग|स्विचयार्ड|மின்சாரம்|கேபிள்)/i.test(
      lower
    ) ||
    /(इलेक्ट्रिकल|केबल|மின்சாரம்)/.test(rawLower)
  ) {
    discipline = 'Electrical';
    disciplineConfidence = 95;
  } else if (
    /(instrumentation|instrument|transmitter|sensor|junction box|jb|loop check|tubing|calibration|pt-|इंस्ट्रूमेंटेशन|सेंसर|ट्रांसमीटर|துல்லியக் கருவி|சென்சார்)/i.test(
      lower
    ) ||
    /(इंस्ट्रूमेंटेशन|सेंसर)/.test(rawLower)
  ) {
    discipline = 'Instrumentation';
    disciplineConfidence = 95;
  } else if (
    /(hse|safety|scaffolding|fire|ppe|toolbox|hazard|safety inspection|permit|सुरक्षा|एचएसई|खतरा|பாதுகாப்பு|அபாயம்)/i.test(
      lower
    ) ||
    /(सुरक्षा|एचएसई|பாதுகாப்பு)/.test(rawLower)
  ) {
    discipline = 'HSE';
    disciplineConfidence = 95;
  }

  // 2. Spatial Area Extraction
  let area = 'Utility Yard';
  if (/(utility yard|utility area|यूटिलिटी यार्ड|यूटिलिटी|பயன்பாட்டு)/i.test(lower)) {
    area = 'Utility Yard';
  } else if (/(pump bay|pump house|cw pump|पंप बे|पंप हाउस|पम्प|பம்ப்)/i.test(lower)) {
    area = 'Pump Bay';
  } else if (/(substation|sub station|electrical building|सबस्टेशन|துணை மின்நிலையம்)/i.test(lower)) {
    area = 'Substation';
  } else if (/(switchyard|switch yard|transformer yard|स्विचयार्ड|மின் மாற்றி)/i.test(lower)) {
    area = 'Switchyard';
  } else if (/(pipe rack|rack area|पाइप रैक|குழாய் அடுக்கு)/i.test(lower)) {
    area = 'Pipe Rack Area';
  } else if (/(cooling tower|ct basin|कूलिंग टॉवर|குளிரூட்டும்)/i.test(lower)) {
    area = 'Cooling Tower Basin';
  } else if (/(turbine building|turbine hall|टर्बाइन|சுழலி)/i.test(lower)) {
    area = 'Turbine Building';
  } else if (/(battery limit|isbl|osbl|बैटरी लिमिट)/i.test(lower)) {
    area = 'ISBL Workfront';
  }

  // 3. Equipment / Line Tag Detection
  const candidateTags = extractCandidateTags(normalized);
  let detectedTag: string | undefined = candidateTags.length > 0 ? candidateTags[0] : undefined;

  // Additional check for spoken tags like "24 CW 017" or "CW 017" or "लाइन 24-CW-017"
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
    /(completed|finished|erected|done|purna|ho gaya|ho chuka|mudinjadhu|mudinthathu|khatam|tested|cleared|हो गया|हो चुका|पूर्ण|पूरा|समाप्त|खत्म|முடிந்தது|நிறைவடைந்தது|முடிந்துவிட்டது)/i.test(
      lower
    ) ||
    /(हो गया|पूर्ण|पूरा|खत्म|முடிந்தது)/.test(rawLower)
  ) {
    eventStatus = 'Completed';
  }
  // In Progress signals
  else if (
    /(in progress|ongoing|continuing|chal raha|nadanthukittu|working on|underway|aligning|pulling|fitting|चल रहा|काम चालू|प्रगति पर|जारी है|செயல்பாட்டில்|நடக்கிறது)/i.test(
      lower
    ) ||
    /(चल रहा|काम चालू|जारी)/.test(rawLower)
  ) {
    eventStatus = 'In Progress';
  }
  // Started signals
  else if (
    /(started|initiated|began|shuru|aaramichachu|commenced|शुरू|आरंभ|प्रारंभ|ஆரம்பமானது|தொடங்கியது)/i.test(lower) ||
    /(शुरू|आरंभ|தொடங்கியது)/.test(rawLower)
  ) {
    eventStatus = 'Started';
  }

  // 5. Quantity Metric Extraction
  let quantity: string | undefined;
  const quantityMatch = lower.match(
    /\b(\d+(\.\d+)?)\s*(joints|spools|meters|m|cubic meters|m3|percent|%|units|nos|tons|kg|coils|प्रतिशत|मीटर|घन मीटर|சதவீதம்|மீட்டர்)\b/i
  );
  if (quantityMatch) {
    quantity = quantityMatch[0];
  } else if (/100\s*(percent|%|प्रतिशत|சதவீதம்)/i.test(lower)) {
    quantity = '100%';
  }

  // 6. Blocker / Issue Flag Extraction
  let issueFlag: string | undefined;
  let issueSeverity: 'low' | 'medium' | 'critical' | undefined;

  if (
    /(blocker|blocked|crane breakdown|crane issue|leak|hydro leak|access hold|permit hold|scaffold missing|delay|rukaavat|thadai|hazard|ब्लॉकर|रुकावट|क्रेन खराब|लीक|खतरा|தடை|பிரச்சினை|கிரேன்)/i.test(
      lower
    ) ||
    /(ब्लॉकर|रुकावट|क्रेन खराब|தடை)/.test(rawLower)
  ) {
    if (/crane|breakdown|leak|hazard|stop|क्रेन|खराब|लीक|கிரேன்|அபாயம்/i.test(lower)) {
      issueFlag = 'Reported on-site equipment / access blocker from voice log';
      issueSeverity = 'critical';
    } else {
      issueFlag = 'Field delay flag noted in voice dictation';
      issueSeverity = 'medium';
    }
  }

  // 7. Clean Formatted Task Description
  let cleanDescription = rawTranscript.trim();
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

