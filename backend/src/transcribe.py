import sys
import json
import speech_recognition as sr

def transcribe_audio(wav_path, lang='en-IN'):
    r = sr.Recognizer()
    try:
        with sr.AudioFile(wav_path) as source:
            audio = r.record(source)
        text = r.recognize_google(audio, language=lang)
        return {"success": True, "text": text}
    except sr.UnknownValueError:
        return {"success": False, "error": "No speech detected or audio unclear"}
    except sr.RequestError as e:
        return {"success": False, "error": f"Speech API error: {e}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing audio file path"}))
        sys.exit(1)
    
    wav_path = sys.argv[1]
    lang = sys.argv[2] if len(sys.argv) > 2 else 'en-IN'
    
    result = transcribe_audio(wav_path, lang)
    print(json.dumps(result))
