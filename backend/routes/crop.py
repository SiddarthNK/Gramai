import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database.models import User, CropReport, AnalyticsEvent, get_db
from authentication.auth import get_current_user, get_optional_user
from ai_models.crop_disease import analyze_crop_image

router = APIRouter(prefix="/api/crop", tags=["crop"])

UPLOAD_DIR = "./uploads/crops"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_TYPES   = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


@router.post("/analyze")
async def analyze_crop(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and WebP images are supported")

    content = await image.read()
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10MB)")

    # Run analysis
    result = await analyze_crop_image(content, filename=image.filename or "")

    if "error" in result:
        return result

@router.post("/disease", tags=["scan"])
async def scan_disease_alias(file: UploadFile = File(...)):
    """Alias for /api/crop/analyze to match user requirement."""
    content = await file.read()
    result = await analyze_crop_image(content, filename=file.filename or "")
    return {"success": True, "data": result}

    # Save image
    fname = f"{uuid.uuid4().hex}.jpg"
    fpath = os.path.join(UPLOAD_DIR, fname)
    try:
        async with aiofiles.open(fpath, "wb") as f:
            await f.write(content)
    except Exception:
        fpath = None

    # Save report to DB
    if current_user:
        report = CropReport(
            user_id=current_user.id,
            image_path=fpath,
            disease=result["disease_detected"],
            confidence=float(result["confidence"]),
            severity=result.get("severity"),
            symptoms=result.get("symptoms"),
            causes=result.get("causes"),
            organic_treatment=result.get("organic_treatment"),
            chemical_treatment=result.get("chemical_treatment"),
            fertilizer_tip=result.get("fertilizer_tip"),
            prevention=result.get("prevention"),
            recovery_estimate=result.get("recovery_estimate"),
            farmer_advice=result.get("farmer_advice"),
            crop_type=result.get("crop_detected"),
        )
        db.add(report)
        db.add(AnalyticsEvent(
            event_type="crop_scan",
            agent="agriculture",
            user_id=current_user.id,
        ))
        db.commit()

    return result


@router.get("/reports")
def get_crop_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reports = (
        db.query(CropReport)
        .filter(CropReport.user_id == current_user.id)
        .order_by(CropReport.created_at.desc())
        .limit(20)
        .all()
    )
    return {
        "reports": [
            {
                "id":         r.id,
                "disease":    r.disease,
                "confidence": r.confidence,
                "treatment":  r.treatment,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reports
        ]
    }
