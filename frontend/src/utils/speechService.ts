/**
 * Datum Speech Service: Browser-Native Multilingual Voice & Real Audio Transcription Engine
 * Features:
 *  1. Hardware Microphone Stream via navigator.mediaDevices.getUserMedia (Works on Opera, Chrome, Edge, Safari, Firefox).
 *  2. Real-Time Web Audio API VU / Frequency Level Analyzer for responsive visual feedback.
 *  3. MediaRecorder Audio Capture: Records physical voice into audio blobs.
 *  4. Browser-side PCM WAV Encoder: Converts audio buffer to standard 16-bit WAV for accurate transcription.
 *  5. Direct Speech-to-Text API (/api/transcribe): Accurately transcribes the exact spoken words in English, Hindi, and Tamil.
 *  6. Dual Web Speech API fallback for Chrome/Edge with seamless server-side fallback for Opera/Firefox.
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
 * Convert AudioBuffer to standard 16-bit PCM WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const channelData = buffer.getChannelData(0);
  const dataLength = channelData.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Check backend Speech-to-Text engine readiness
 */
export async function checkSTTEngineStatus(): Promise<{
  success: boolean;
  status: 'ready' | 'offline' | 'error';
  engine?: string;
  srVersion?: string;
  error?: string;
}> {
  const endpoints = ['/api/transcribe/status', 'http://localhost:5000/api/transcribe/status'];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // try next endpoint
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
    let wavBlob: Blob = blob;

    // Convert audio buffer to standard 16-bit PCM WAV if needed
    if (blob.type !== 'audio/wav') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          wavBlob = audioBufferToWav(audioBuffer);
          ctx.close();
        }
      } catch (decodeErr) {
        console.warn('Audio decoding fallback to raw blob:', decodeErr);
        wavBlob = blob;
      }
    }

    const formData = new FormData();
    formData.append('audio', wavBlob, 'recording.wav');
    formData.append('language', lang);

    const endpoints = ['/api/transcribe', 'http://localhost:5000/api/transcribe'];
    let lastError = '';

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
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
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime = 0;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private currentHandlers: SpeechRecognitionHandlers | null = null;
  private hasReceivedNativeTranscript = false;
  private currentLanguage: SpeechLanguage = 'en-IN';

  /**
   * Start hardware microphone, audio recorder, and speech recognition
   */
  public async start(
    language: SpeechLanguage = 'en-IN',
    handlers: SpeechRecognitionHandlers
  ): Promise<boolean> {
    this.stop(); // Clean up any active session

    this.currentHandlers = handlers;
    this.currentLanguage = language;
    this.hasReceivedNativeTranscript = false;
    this.recordedChunks = [];
    const isOpera = isOperaBrowser();
    let micOk = false;

    // 1. Request hardware microphone access (works on Opera, Chrome, Edge, Safari, Firefox)
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        handlers.onMicConnected?.(true);
        micOk = true;
        this.startAudioAnalyzer(handlers.onAudioLevel);

        // Start MediaRecorder to capture real audio bytes
        try {
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : '';

          this.mediaRecorder = mimeType
            ? new MediaRecorder(this.mediaStream, { mimeType })
            : new MediaRecorder(this.mediaStream);

          this.recordingStartTime = Date.now();
          this.mediaRecorder.ondataavailable = e => {
            if (e.data && e.data.size > 0) {
              this.recordedChunks.push(e.data);
            }
          };

          this.mediaRecorder.start(200); // 200ms slice
        } catch (recErr) {
          console.warn('MediaRecorder error:', recErr);
        }
      } catch (err: any) {
        handlers.onMicConnected?.(false);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          handlers.onError?.(
            'Microphone access was denied in browser permissions. Please allow microphone access in Opera site settings.'
          );
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          handlers.onError?.('No hardware microphone found on this device.');
        } else {
          handlers.onError?.(`Microphone initialization error: ${err.message || err.name}`);
        }
      }
    }

    // 2. Initialize Web Speech API (active in Chrome/Edge; fallback for Opera)
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      this.isListening = micOk;
      if (micOk) {
        handlers.onStateChange?.('listening');
      }
      return micOk;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = language;
      this.recognition.maxAlternatives = 1;

      handlers.onStateChange?.('listening');
      this.isListening = true;

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

        let message = 'Voice capture notice.';
        if (err === 'not-allowed') {
          message = 'Microphone permission was denied. Please allow microphone access in browser settings.';
          handlers.onError?.(message);
        } else if (err === 'audio-capture') {
          message = 'No microphone device found on system.';
          handlers.onError?.(message);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Keep active if recording
        }
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      if (!micOk) {
        this.isListening = false;
        handlers.onStateChange?.('error');
        handlers.onError?.(err?.message || 'Failed to initialize speech recognition.');
        return false;
      }
      return true;
    }
  }

  /**
   * Real-time audio volume level analyzer using Web Audio API
   */
  private startAudioAnalyzer(onAudioLevel?: (level: number) => void): void {
    if (!this.mediaStream || !onAudioLevel) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const tick = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize to 0-100 scale
        const level = Math.min(100, Math.round((average / 128) * 100));
        onAudioLevel(level);

        this.animFrameId = requestAnimationFrame(tick);
      };

      tick();
    } catch (e) {
      console.warn('Audio analyzer could not be initialized:', e);
    }
  }

  /**
   * Stop both recognition and media stream, and return recorded audio data
   */
  public async stop(): Promise<RecordedAudioData | null> {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
    }

    let recordedData: RecordedAudioData | null = null;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        const durationSec = Math.max(0.5, Number(((Date.now() - this.recordingStartTime) / 1000).toFixed(1)));
        
        // Wait for final chunk
        await new Promise<void>(resolve => {
          if (!this.mediaRecorder) return resolve();
          this.mediaRecorder.onstop = () => resolve();
          this.mediaRecorder.stop();
        });

        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        recordedData = { blob, url, durationSec };

        if (this.currentHandlers?.onAudioRecorded) {
          this.currentHandlers.onAudioRecorded(recordedData);
        }

        // If native browser STT didn't return text (e.g. in Opera / Firefox), transcribe via backend API
        if (!this.hasReceivedNativeTranscript && durationSec >= 0.8) {
          this.currentHandlers?.onStateChange?.('transcribing');
          const result = await transcribeAudioBlob(blob, this.currentLanguage);
          if (result.success && result.text) {
            this.currentHandlers?.onFinalTranscript?.(result.text);
          } else if (result.error) {
            this.currentHandlers?.onError?.(result.error);
          }
        }
      } catch (e) {
        console.warn('Error stopping mediaRecorder:', e);
      }
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
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
