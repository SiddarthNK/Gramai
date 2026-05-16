from fastapi import APIRouter, UploadFile, File
from services.ai_service import transcribe_audio

router = APIRouter(prefix="/api/audio", tags=["audio"])

@router.post("/transcribe")
async def transcribe_audio_route(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()
        print(f"[AUDIO ROUTE] Received: {file.filename}, {len(audio_bytes)} bytes")
        
        if len(audio_bytes) == 0:
            return {"success": False, "error": "Empty audio file"}
        
        text = await transcribe_audio(audio_bytes, file.filename)
        return {"success": True, "text": text}
        
    except Exception as e:
        print(f"[AUDIO ROUTE ERROR] {str(e)}")
        return {"success": False, "error": str(e)}
