/**
 * Datum Speech Service: Browser-Native Multilingual Voice & Audio Stream Engine
 * Features:
 *  1. Hardware Microphone Stream via navigator.mediaDevices.getUserMedia (Works in Opera, Chrome, Edge, Firefox).
 *  2. Real-Time Web Audio API VU / Frequency Level Analyzer for responsive visual feedback.
 *  3. Dual Web Speech API (SpeechRecognition / webkitSpeechRecognition) with multilingual profiles.
 *  4. Graceful Opera & restricted-environment detection and fallback handling.
 */

export type SpeechLanguage = 'en-IN' | 'hi-IN' | 'ta-IN';

export interface SpeechRecognitionHandlers {
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: 'idle' | 'listening' | 'processing' | 'error') => void;
  onAudioLevel?: (level: number) => void; // 0 to 100 volume level
  onMicConnected?: (connected: boolean) => void;
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

// Sample Voice Presets for instant evaluation & Opera/Firefox testing
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

class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  /**
   * Start hardware microphone and speech recognition
   */
  public async start(
    language: SpeechLanguage = 'en-IN',
    handlers: SpeechRecognitionHandlers
  ): Promise<boolean> {
    this.stop(); // Clean up any active session

    const isOpera = isOperaBrowser();
    let micOk = false;

    // 1. Request hardware microphone access (works on Opera, Chrome, Edge, Safari, Firefox)
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        handlers.onMicConnected?.(true);
        micOk = true;
        this.startAudioAnalyzer(handlers.onAudioLevel);
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

    // 2. Initialize Web Speech API
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      this.isListening = micOk;
      if (micOk) {
        handlers.onStateChange?.('listening');
      }
      handlers.onError?.(
        isOpera
          ? 'Opera Browser Notice: Native WebSpeech cloud recognition is restricted in Opera. Microphone audio is live, and you can dictate/test using the quick voice presets below.'
          : 'Web Speech API is not supported in this browser. You can use the Quick Voice Presets below to test instant voice structuring.'
      );
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
        handlers.onStateChange?.('error');

        let message = 'Voice capture error occurred.';
        if (err === 'not-allowed') {
          message = 'Microphone permission was denied. Please allow microphone access in browser settings.';
        } else if (err === 'no-speech') {
          message = 'No speech detected. Please speak closer to the microphone.';
        } else if (err === 'network') {
          message = isOpera
            ? 'Opera Speech Cloud Endpoint: Opera disables Google Cloud STT keys by default. Hardware mic is active; you can dictate with live presets or edit the voice prompt below.'
            : 'Speech recognition network service unavailable. You can click any Voice Preset below to test the full pipeline.';
        } else if (err === 'audio-capture') {
          message = 'No microphone device found on system.';
        }

        handlers.onError?.(message);
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // If ended unexpectedly while still marked active, reset state
          this.isListening = false;
          handlers.onStateChange?.('idle');
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
   * Stop both recognition and media stream
   */
  public stop(): void {
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
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechService = new SpeechService();
