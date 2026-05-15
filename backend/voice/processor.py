"""
Voice processing: Speech-to-Text (Whisper) and Text-to-Speech (gTTS).
Graceful fallback when libraries are not installed.
"""

import io
import os
import tempfile
from typing import Optional

from config import get_settings

settings = get_settings()


def transcribe_audio(audio_bytes: bytes, language: str = "en") -> str:
    """
    Transcribe audio bytes to text using OpenAI Whisper.
    Falls back to empty string if Whisper not available.
    """
    try:
        import whisper
        import numpy as np
        import soundfile as sf

        # Write audio to temp file
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        model = whisper.load_model(settings.whisper_model)

        # Whisper language codes
        lang_map = {"en": "en", "kn": "kn"}
        whisper_lang = lang_map.get(language, "en")

        result = model.transcribe(tmp_path, language=whisper_lang, fp16=False)
        os.unlink(tmp_path)
        return result.get("text", "").strip()

    except ImportError:
        # Whisper not installed — return placeholder for demo
        return "[Voice transcription requires whisper package. Run: pip install openai-whisper]"
    except Exception as e:
        return f"[Transcription error: {str(e)[:100]}]"


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
        # Return minimal valid MP3 silence bytes as placeholder
        return b""
    except Exception:
        return b""
