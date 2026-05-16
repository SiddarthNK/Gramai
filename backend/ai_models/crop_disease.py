"""
Crop Disease Detection using central AI service.
"""

from services.ai_service import scan_disease_with_ai

async def analyze_crop_image(image_bytes: bytes, filename: str = "") -> dict:
    """
    Analyze crop image for disease detection using AI service.
    """
    try:
        return await scan_disease_with_ai(image_bytes)
    except Exception as e:
        print(f"Vision API Error: {e}")
        return {
            "is_plant": True,
            "crop_detected": "Unknown",
            "disease_detected": "Unable to process - please try again",
            "confidence": 0,
            "severity": "Unknown",
            "symptoms": "Could not analyze image properly",
            "causes": "N/A",
            "organic_treatment": "Please upload a clearer image",
            "chemical_treatment": "N/A",
            "fertilizer_tip": "N/A",
            "prevention": "N/A",
            "recovery_estimate": "N/A",
            "farmer_advice": "Please take a clear photo of the plant leaf and try again"
        }
