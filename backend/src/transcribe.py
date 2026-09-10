import sys
import os
import json
import wave
import speech_recognition as sr

# Ensure UTF-8 output encoding across all platforms (especially Windows cp1252 consoles)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def transcribe_audio(wav_path, lang='en-IN'):
    if not os.path.exists(wav_path):
        return {"success": False, "error": f"Audio file not found: {wav_path}"}
    
    file_size = os.path.getsize(wav_path)
    if file_size < 100:
        return {"success": False, "error": "Audio file is empty or too short"}

    r = sr.Recognizer()
    r.dynamic_energy_threshold = True
    r.pause_threshold = 0.8
    r.operation_timeout = 15

    try:
        with sr.AudioFile(wav_path) as source:
            # Calibrate slightly for ambient noise if audio is long enough
            try:
                r.adjust_for_ambient_noise(source, duration=0.2)
            except Exception:
                pass
            audio = r.record(source)
    except Exception as read_err:
        return {"success": False, "error": f"Failed to read WAV audio file: {read_err}"}

    # Primary transcription attempt with requested language
    primary_error = None
    try:
        text = r.recognize_google(audio, language=lang)
        if text and text.strip():
            return {"success": True, "text": text.strip(), "language": lang}
    except sr.UnknownValueError:
        primary_error = "No clear speech recognized in specified language"
    except sr.RequestError as e:
        primary_error = f"Speech API network error: {e}"
    except Exception as e:
        primary_error = str(e)

    # Secondary fallback attempt for Indian multilingual context (e.g. English <-> Hindi <-> Tamil)
    fallback_langs = []
    if lang == 'hi-IN':
        fallback_langs = ['en-IN', 'hi']
    elif lang == 'ta-IN':
        fallback_langs = ['en-IN', 'ta']
    elif lang == 'en-IN':
        fallback_langs = ['en-US', 'hi-IN']

    for fb_lang in fallback_langs:
        try:
            fb_text = r.recognize_google(audio, language=fb_lang)
            if fb_text and fb_text.strip():
                return {"success": True, "text": fb_text.strip(), "language": fb_lang, "fallback": True}
        except Exception:
            continue

    return {"success": False, "error": primary_error or "Could not recognize speech in audio"}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing audio file path"}, ensure_ascii=False))
        sys.exit(1)
    
    wav_path = sys.argv[1]
    lang = sys.argv[2] if len(sys.argv) > 2 else 'en-IN'
    
    result = transcribe_audio(wav_path, lang)
    print(json.dumps(result, ensure_ascii=False))

