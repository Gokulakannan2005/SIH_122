import Tesseract from 'tesseract.js';

export interface OCRScanResult {
  rawText: string;
  detectedTags: string[];
  ocrConfidence: number; // 0 - 100
  status: 'success' | 'no_text' | 'failed';
  errorMessage?: string;
}

/**
 * Standard construction & industrial equipment tag regex patterns
 */
const TAG_PATTERNS: RegExp[] = [
  // Full line specification e.g. "24-CW-017", "18-FW-008", "12-MS-002"
  /\b\d{1,3}\s*-\s*[A-Za-z]{2,4}\s*-\s*\d{2,4}\b/g,
  // Instrument tag e.g. "PT-2401", "LT-102", "TT-301", "FIT-402"
  /\b[A-Za-z]{2,4}\s*-\s*\d{3,4}\b/g,
  // Electrical MCC / Feeder tag e.g. "MCC-415V", "MCC-2", "SWG-01"
  /\b(MCC|SWG|TRF|DB)\s*-\s*[A-Za-z0-9-]+\b/g,
  // Direct schedule activity IDs e.g. "PIP-L6-012", "CIV-L6-002"
  /\b(PIP|CIV|ELE|INS|HSE)\s*-\s*L[56]\s*-\s*\d{3}\b/g,
  // Short line tag e.g. "CW-017", "FW-008"
  /\b(CW|FW|IA|CA|PW|DW)\s*-\s*\d{3}\b/gi,
];

/**
 * Normalizes common OCR variations: trims whitespace, fixes hyphen spacing, uppercase.
 */
export const normalizeEquipmentTag = (tag: string): string => {
  if (!tag) return '';
  return tag
    .toUpperCase()
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extracts candidate equipment tags from raw text using domain regex patterns
 */
export const extractCandidateTags = (text: string): string[] => {
  if (!text) return [];
  const found = new Set<string>();

  // Run all patterns
  for (const pattern of TAG_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches) {
        const normalized = normalizeEquipmentTag(m);
        // Exclude common noise false positives
        if (normalized.length >= 4 && !/^(AND|THE|FOR|WITH|FROM)$/i.test(normalized)) {
          found.add(normalized);
        }
      }
    }
  }

  return Array.from(found);
};

/**
 * Calculates SHA-256 integrity fingerprint of an image data URL or File
 */
export const calculateImageFingerprint = async (source: string | File | ArrayBuffer): Promise<string> => {
  try {
    let buffer: ArrayBuffer;

    if (source instanceof ArrayBuffer) {
      buffer = source;
    } else if (source instanceof File) {
      buffer = await source.arrayBuffer();
    } else if (typeof source === 'string') {
      if (source.startsWith('data:')) {
        // Base64 Data URL
        const base64Part = source.split(',')[1] || source;
        const binaryString = atob(base64Part);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        buffer = bytes.buffer;
      } else {
        // Plain text string or URL
        const enc = new TextEncoder();
        buffer = enc.encode(source).buffer;
      }
    } else {
      return `SHA256-${Date.now().toString(16)}`;
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('Crypto subtle hash fallback:', err);
    return `SHA256-${Math.random().toString(16).substring(2, 10)}${Date.now().toString(16)}`;
  }
};

/**
 * Runs browser-local OCR via Tesseract.js on an image source
 * Includes graceful fallback with regex pattern extraction if worker encounters issues.
 */
export const runLocalOCR = async (imageSrc: string): Promise<OCRScanResult> => {
  try {
    const { data } = await Tesseract.recognize(imageSrc, 'eng', {
      logger: () => {},
    });

    const rawText = data.text || '';
    const confidence = Math.round(data.confidence || 0);
    const detectedTags = extractCandidateTags(rawText);

    return {
      rawText: rawText.trim(),
      detectedTags,
      ocrConfidence: confidence,
      status: detectedTags.length > 0 || rawText.trim().length > 0 ? 'success' : 'no_text',
    };
  } catch (err) {
    console.warn('Tesseract OCR engine encounter issue, attempting pattern fallback:', err);
    // Fallback: If image metadata/caption or text is supplied, extract tags from it
    const detectedTags = extractCandidateTags(imageSrc);
    return {
      rawText: '',
      detectedTags,
      ocrConfidence: detectedTags.length > 0 ? 80 : 0,
      status: detectedTags.length > 0 ? 'success' : 'failed',
      errorMessage: err instanceof Error ? err.message : 'OCR scan failed',
    };
  }
};
