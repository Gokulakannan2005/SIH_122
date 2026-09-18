/**
 * Datum Speech Service: Browser-Native Multilingual Voice & Real Audio Transcription Engine
 * Features:
 *  1. Hardware Microphone Stream via navigator.mediaDevices.getUserMedia (Works on Opera, Chrome, Edge, Safari, Firefox).
 *  2. Real-Time Web Audio API VU / Frequency Level Analyzer for responsive visual feedback.
 *  3. Direct Pure PCM Float32 WAV Encoder: Records physical voice samples directly into standard 16-bit PCM WAV.
 *     Guarantees 100% compliance with Python speech_recognition without webm decoding issues.
 *  4. Direct Speech-to-Text API (/api/transcribe): Resilient multi-port routing with auto-fallback to ports 5000, 5001, 5002, 5050.
 *  5. Dual Web Speech API fallback for Chrome/Edge with seamless server-side fallback for Opera/Firefox.
 */

export type SpeechLanguage = 'en-IN' | 'hi-IN' | 'ta-IN';

export interface RecordedAudioData {
  blob: Blob;
  url: string;
  durationSec: number;
}

export interface SpeechRecognitionHandlers {
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: 'idle' | 'listening' | 'transcribing' | 'processing' | 'error') => void;
  onAudioLevel?: (level: number) => void; // 0 to 100 volume level
  onMicConnected?: (connected: boolean) => void;
  onAudioRecorded?: (audio: RecordedAudioData) => void;
}

// Check if browser is Opera / Opera GX
export function isOperaBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /OPR\//i.test(navigator.userAgent) || /Opera/i.test(navigator.userAgent);
}

// Check if browser supports Web Speech API
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

// Sample Voice Presets for instant evaluation & offline testing
export interface VoicePreset {
  id: string;
  label: string;
  language: SpeechLanguage;
  langLabel: string;
  transcript: string;
  description: string;
}

export const SAMPLE_VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'pipe-cw017-en',
    label: 'Pipe Spool 24-CW-017 (English)',
    language: 'en-IN',
    langLabel: 'English (India)',
    transcript: 'Piping utility yard line 24-CW-017 spool erection and flange fit-up completed 100 percent',
    description: 'Erection of cooling water pipe spool with confirmed tag',
  },
  {
    id: 'pipe-cw017-hi',
    label: 'Line 24-CW-017 (Hindi / Hinglish)',
    language: 'hi-IN',
    langLabel: 'हिन्दी (Hindi)',
    transcript: 'Piping utility yard line 24-CW-017 spool erection aur alignment completed ho gaya',
    description: 'Hinglish supervisor log with completion signal',
  },
  {
    id: 'civil-raft-ta',
    label: 'Civil Raft Foundation (Tamil / Tanglish)',
    language: 'ta-IN',
    langLabel: 'தமிழ் (Tamil)',
    transcript: 'Civil pump bay foundation raft concrete pouring started 45 cubic meters',
    description: 'Civil trade concrete pour with quantity metrics',
  },
  {
    id: 'blocker-fw008-en',
    label: 'Hydrotest Blocker Flag (English)',
    language: 'en-IN',
    langLabel: 'English (India)',
    transcript: 'Piping pump bay line 18-FW-008 hydrotest in progress blocker crane breakdown critical hold',
    description: 'Emergency crane breakdown site obstacle flag',
  },
];

/**
 * Direct Float32 PCM to Standard 16-bit Mono RIFF WAVE Encoder
 */
export function encodeFloat32PcmToWav(chunks: Float32Array[], sampleRate: number): Blob {
  let totalLength = 0;
  for (const chunk of chunks) {
    totalLength += chunk.length;
  }

  const numChannels = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalLength * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM 16-bit samples
  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      const s = Math.max(-1, Math.min(1, chunk[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Candidate backend host ports for resilient routing
 */
const CANDIDATE_PORTS = [5000, 5001, 5002, 5050];
let activeBackendPortUrl: string | null = null;

function getCandidateEndpoints(path: string): string[] {
  const endpoints = [path];
  if (activeBackendPortUrl) {
    endpoints.push(`${activeBackendPortUrl}${path}`);
  }
  for (const p of CANDIDATE_PORTS) {
    endpoints.push(`http://localhost:${p}${path}`);
  }
  return Array.from(new Set(endpoints));
}

/**
 * Check backend Speech-to-Text engine readiness across candidate ports
 */
export async function checkSTTEngineStatus(): Promise<{
  success: boolean;
  status: 'ready' | 'offline' | 'error';
  engine?: string;
  srVersion?: string;
  error?: string;
}> {
  const endpoints = getCandidateEndpoints('/api/transcribe/status');
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // Remember working backend base
        if (endpoint.startsWith('http://localhost:')) {
          const match = endpoint.match(/^http:\/\/localhost:\d+/);
          if (match) activeBackendPortUrl = match[0];
        }
        return data;
      }
    } catch {
      // try next candidate
    }
  }
  return { success: false, status: 'offline', error: 'Backend transcription service is offline.' };
}

/**
 * Send recorded audio blob to backend Speech-to-Text API
 */
export async function transcribeAudioBlob(
  blob: Blob,
  lang: SpeechLanguage = 'en-IN'
): Promise<{ success: boolean; text?: string; error?: string; language?: string; fallback?: boolean }> {
  try {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.wav');
    formData.append('language', lang);

    const endpoints = getCandidateEndpoints('/api/transcribe');
    let lastError = '';

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (endpoint.startsWith('http://localhost:')) {
            const match = endpoint.match(/^http:\/\/localhost:\d+/);
            if (match) activeBackendPortUrl = match[0];
          }
          return data;
        } else {
          const errJson = await res.json().catch(() => null);
          lastError = errJson?.error || `Server returned HTTP ${res.status}`;
        }
      } catch (fetchErr: any) {
        lastError = fetchErr?.message || 'Network request failed';
      }
    }

    return { success: false, error: lastError || 'Audio transcription error' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Audio transcription error' };
  }
}

class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private pcmChunks: Float32Array[] = [];
  private animFrameId: number | null = null;
  private currentHandlers: SpeechRecognitionHandlers | null = null;
  private hasReceivedNativeTranscript = false;
  private currentLanguage: SpeechLanguage = 'en-IN';
  private recordingStartTime = 0;

  /**
   * Start hardware microphone, direct PCM recorder, and speech recognition
   */
  public async start(
    language: SpeechLanguage = 'en-IN',
    handlers: SpeechRecognitionHandlers
  ): Promise<boolean> {
    await this.stop(); // Clean up any active session

    this.currentHandlers = handlers;
    this.currentLanguage = language;
    this.hasReceivedNativeTranscript = false;
    this.pcmChunks = [];
    let micOk = false;

    // 1. Request hardware microphone access
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        handlers.onMicConnected?.(true);
        micOk = true;

        // Initialize Web Audio API for analyzer and PCM recording
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }

          const source = this.audioContext.createMediaStreamSource(this.mediaStream);

          // Audio VU Analyzer
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 256;
          this.analyser.smoothingTimeConstant = 0.5;
          source.connect(this.analyser);
          this.startAudioAnalyzer(handlers.onAudioLevel);

          // Direct Float32 PCM recording node
          this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
          this.recordingStartTime = Date.now();

          this.processorNode.onaudioprocess = (e) => {
            if (!this.isListening) return;
            const inputData = e.inputBuffer.getChannelData(0);
            this.pcmChunks.push(new Float32Array(inputData));
          };

          source.connect(this.processorNode);
          this.processorNode.connect(this.audioContext.destination);
        }
      } catch (err: any) {
        handlers.onMicConnected?.(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          handlers.onError?.(
            'Microphone access was denied. Please allow microphone access in your browser settings.'
          );
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          handlers.onError?.('No hardware microphone found on this device.');
        } else {
          handlers.onError?.(`Microphone initialization error: ${err.message || err.name}`);
        }
      }
    }

    this.isListening = micOk;
    if (micOk) {
      handlers.onStateChange?.('listening');
    }

    // 2. Initialize Web Speech API (for real-time streaming text in Chrome / Edge)
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      // Browser does not have native Web Speech API (e.g. Opera, Firefox)
      // Will transcribe via backend PCM WAV on stop
      return micOk;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = language;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        this.hasReceivedNativeTranscript = true;
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        if (finalText.trim() && handlers.onFinalTranscript) {
          handlers.onFinalTranscript(finalText.trim());
        } else if (interimText.trim() && handlers.onInterimTranscript) {
          handlers.onInterimTranscript(interimText.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        const err = event.error;
        if (err !== 'no-speech' && err !== 'network') {
          handlers.onStateChange?.('error');
        }

        if (err === 'not-allowed') {
          handlers.onError?.('Microphone permission was denied.');
        } else if (err === 'audio-capture') {
          handlers.onError?.('No microphone device found on system.');
        }
      };

      this.recognition.onend = () => {
        // Recognition ended
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      // Fall back to backend audio transcription
      return micOk;
    }
  }

  /**
   * Real-time audio volume level analyzer using Web Audio API
   */
  private startAudioAnalyzer(onAudioLevel?: (level: number) => void): void {
    if (!this.analyser || !onAudioLevel) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const tick = () => {
      if (!this.analyser || !this.isListening) return;
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const level = Math.min(100, Math.round((average / 128) * 100));
      onAudioLevel(level);

      this.animFrameId = requestAnimationFrame(tick);
    };

    tick();
  }

  /**
   * Stop recognition, disconnect audio stream, and return recorded PCM WAV
   */
  public async stop(): Promise<RecordedAudioData | null> {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const durationSec = Math.max(
      0.5,
      Number(((Date.now() - this.recordingStartTime) / 1000).toFixed(1))
    );

    let recordedData: RecordedAudioData | null = null;

    // Disconnect processor
    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch (e) {}
      this.processorNode = null;
    }

    // Generate valid PCM 16-bit WAV blob from captured chunks
    if (this.pcmChunks.length > 0 && this.audioContext) {
      try {
        const sampleRate = this.audioContext.sampleRate || 44100;
        const wavBlob = encodeFloat32PcmToWav(this.pcmChunks, sampleRate);
        const url = URL.createObjectURL(wavBlob);
        recordedData = { blob: wavBlob, url, durationSec };

        if (this.currentHandlers?.onAudioRecorded) {
          this.currentHandlers.onAudioRecorded(recordedData);
        }

        // If native browser STT didn't produce text (e.g. in Opera / Firefox / offline), transcribe via backend
        if (!this.hasReceivedNativeTranscript && durationSec >= 0.8) {
          this.currentHandlers?.onStateChange?.('transcribing');
          const result = await transcribeAudioBlob(wavBlob, this.currentLanguage);
          if (result.success && result.text) {
            this.currentHandlers?.onFinalTranscript?.(result.text);
          } else if (result.error) {
            this.currentHandlers?.onError?.(result.error);
          }
        }
      } catch (encodeErr) {
        console.warn('WAV encoding error:', encodeErr);
      }
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }

    this.isListening = false;
    this.currentHandlers?.onStateChange?.('idle');
    return recordedData;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechService = new SpeechService();
