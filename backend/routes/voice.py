import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database.models import User, VoiceLog, AnalyticsEvent, get_db
from authentication.auth import get_current_user, get_optional_user
from voice.processor import transcribe_audio, synthesize_speech

router = APIRouter(prefix="/api/voice", tags=["voice"])

MAX_AUDIO_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = "en",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    content = await audio.read()
    if len(content) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file too large (max 10MB)")

    text = transcribe_audio(content, language)

    # Log voice interaction
    log = VoiceLog(
        user_id=current_user.id if current_user else None,
        transcribed_text=text,
        language=language,
    )
    db.add(log)
    if current_user:
        db.add(AnalyticsEvent(event_type="voice", user_id=current_user.id))
    db.commit()

    return {"text": text, "language": language}


class TTSRequest(BaseModel):
    text:     str
    language: str = "en"


@router.post("/synthesize")
async def synthesize(
    req: TTSRequest,
    current_user: Optional[User] = Depends(get_optional_user),
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")
    if len(req.text) > 1000:
        raise HTTPException(status_code=400, detail="Text too long (max 1000 chars)")

    audio_bytes = synthesize_speech(req.text, req.language)

    if not audio_bytes:
        raise HTTPException(status_code=503, detail="TTS service unavailable. Install gTTS: pip install gTTS")

    return Response(content=audio_bytes, media_type="audio/mpeg")
