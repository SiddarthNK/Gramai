"""
Voice processing using central AI service.
"""

import io
from services.ai_service import transcribe_audio

def transcribe_audio(audio_bytes: bytes, language: str = "en") -> str:
    """
    Transcribe audio bytes to text using AI service.
    """
    try:
        return transcribe_audio(audio_bytes, filename="audio.webm")
    except Exception as e:
        print(f"Transcription Error: {e}")
        return "Something went wrong. Please try again."


def synthesize_speech(text: str, language: str = "en") -> bytes:
    """
    Convert text to speech audio bytes using gTTS.
    Returns MP3 bytes.
    """
    try:
        from gtts import gTTS

        # gTTS language codes
        lang_map = {"en": "en", "kn": "kn"}
        tts_lang = lang_map.get(language, "en")

        # gTTS has limited Kannada support; fall back to English if needed
        try:
            tts = gTTS(text=text, lang=tts_lang, slow=False)
        except Exception:
            tts = gTTS(text=text, lang="en", slow=False)

        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        return buf.read()

    except ImportError:
        return b""
    except Exception:
        return b""
