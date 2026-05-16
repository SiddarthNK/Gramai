from fastapi import APIRouter, UploadFile, File
from services.ai_service import scan_disease_with_ai

router = APIRouter(prefix="/api/scan", tags=["scan"])

@router.post("/disease")
async def scan_disease(file: UploadFile = File(...)):
    try:
        # Read image bytes
        image_bytes = await file.read()
        print(f"[ROUTE] Image received: {file.filename}, size: {len(image_bytes)} bytes")
        
        if len(image_bytes) == 0:
            return {"success": False, "error": "Empty file received"}
        
        # Call AI
        result = await scan_disease_with_ai(image_bytes)
        return {"success": True, "data": result}
        
    except Exception as e:
        print(f"[ROUTE ERROR] {str(e)}")
        return {"success": False, "error": str(e)}
