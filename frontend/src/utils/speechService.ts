/**
 * Datum Speech Service: Browser-Native Multilingual Web Speech API Client
 * Wraps SpeechRecognition with streaming interim updates, error management,
 * and seamless fallback presets for Opera, Firefox, and offline testing.
 */

export type SpeechLanguage = 'en-IN' | 'hi-IN' | 'ta-IN';

export interface SpeechRecognitionHandlers {
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: 'idle' | 'listening' | 'processing' | 'error') => void;
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

  public start(
    language: SpeechLanguage = 'en-IN',
    handlers: SpeechRecognitionHandlers
  ): boolean {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      if (handlers.onError) {
        handlers.onError(
          'Web Speech API is not natively enabled in this browser. You can use the Quick Voice Presets below to test instant voice structuring.'
        );
      }
      return false;
    }

    try {
      this.stop(); // Stop any previous session
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
        this.isListening = false;
        handlers.onStateChange?.('error');

        let message = 'Voice capture error occurred.';
        if (err === 'not-allowed') {
          message = 'Microphone permission was denied. Please allow microphone access in browser settings.';
        } else if (err === 'no-speech') {
          message = 'No speech detected. Please speak closer to the microphone.';
        } else if (err === 'network') {
          message = 'Network speech recognition endpoint unavailable in this browser session. You can click any Voice Preset below to test the full pipeline.';
        } else if (err === 'audio-capture') {
          message = 'No microphone device found on system.';
        }

        handlers.onError?.(message);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        handlers.onStateChange?.('idle');
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      handlers.onStateChange?.('error');
      handlers.onError?.(err?.message || 'Failed to initialize speech recognition.');
      return false;
    }
  }

  public stop(): void {
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
