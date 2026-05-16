import re
from typing import Optional
from services.ai_service import chat_with_ai

# ─── Intent patterns ────────────────────────────────────────────────────────

AGRICULTURE_PATTERNS = [
    r'\b(crop|plant|leaf|seed|soil|farm|agricult|pest|disease|fertilizer|irrigation|harvest|yield|wheat|rice|tomato|potato|paddy|sugarcane|cotton|maize|sowing|drought|weed|spray|fungicide|insecticide|blight|rust|rot)\b',
    r'\b(ಬೆಳೆ|ಗಿಡ|ಎಲೆ|ಬೀಜ|ಮಣ್ಣು|ರೈತ|ಕೃಷಿ|ಕೀಟ|ರೋಗ|ಗೊಬ್ಬರ|ನೀರಾವರಿ|ಫಸಲು)\b',
]

MEDICAL_PATTERNS = [
    r'\b(fever|pain|sick|headache|cough|cold|vomit|diarrhea|blood|symptom|medicine|doctor|hospital|health|injury|burn|fracture|pregnant|child|malaria|typhoid|diabetes|pressure)\b',
    r'\b(ಜ್ವರ|ನೋವು|ಅನಾರೋಗ್ಯ|ತಲೆನೋವು|ಕೆಮ್ಮು|ವಾಂತಿ|ವೈದ್ಯ|ಆಸ್ಪತ್ರೆ|ರಕ್ತ)\b',
]

EDUCATION_PATTERNS = [
    r'\b(learn|study|explain|teach|quiz|question|exam|school|math|science|history|english|class|student|subject|formula|equation|chapter|lesson|homework|grade)\b',
    r'\b(ಕಲಿ|ಅಧ್ಯಯನ|ವಿವರಿಸು|ಶಾಲೆ|ಗಣಿತ|ವಿಜ್ಞಾನ|ಇತಿಹಾಸ|ಪ್ರಶ್ನೆ|ಪರೀಕ್ಷೆ)\b',
]

EMERGENCY_PATTERNS = [
    r'\b(emergency|urgent|critical|serious|unconscious|breathing|heart attack|stroke|severe|dying|accident|bleeding heavily|snake bite|electric shock)\b',
    r'\b(ತುರ್ತು|ಅಪಘಾತ|ತೀವ್ರ|ಉಸಿರು)\b',
]


def classify_intent(text: str) -> dict:
    """
    Classify user intent and return agent routing with confidence scores.
    """
    text_lower = text.lower()

    # Emergency check first
    is_emergency = any(
        re.search(p, text_lower, re.IGNORECASE)
        for p in EMERGENCY_PATTERNS
    )

    scores = {}
    for pattern in AGRICULTURE_PATTERNS:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        scores['agriculture'] = scores.get('agriculture', 0) + len(matches) * 2

    for pattern in MEDICAL_PATTERNS:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        scores['medical'] = scores.get('medical', 0) + len(matches) * 2

    for pattern in EDUCATION_PATTERNS:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        scores['education'] = scores.get('education', 0) + len(matches) * 2

    if not any(scores.values()):
        return {"agent": "agriculture", "confidence": 0.5, "is_emergency": is_emergency}

    total = sum(scores.values())
    best_agent = max(scores, key=scores.get)
    confidence = min(scores[best_agent] / max(total, 1), 0.99)
    confidence = max(confidence, 0.55)

    return {"agent": best_agent, "confidence": confidence, "is_emergency": is_emergency}


def detect_language(text: str) -> str:
    """Detect if text is Kannada or English."""
    kannada_chars = re.findall(r'[\u0C80-\u0CFF]', text)
    return "kn" if len(kannada_chars) > 2 else "en"


class OrchestratorAgent:
    """Routes queries to specialized agents with context."""

    def route(self, message: str, history: list[dict], language: str = "en", forced_agent: Optional[str] = None) -> dict:
        detected_lang = detect_language(message)
        final_lang    = detected_lang if detected_lang == "kn" else language

        routing = classify_intent(message)
        routing["language"] = final_lang
        
        if forced_agent and forced_agent in ["agriculture", "medical", "education"]:
            routing["agent"] = forced_agent
            routing["confidence"] = 1.0

        return routing

    async def respond(
        self,
        message: str,
        agent: str,
        history: list[dict],
        language: str,
        is_emergency: bool,
    ) -> str:
        """Generate agent response using central AI service."""
        try:
            # Map history to Groq format
            chat_history = []
            for msg in history:
                role = "user" if msg["role"] == "user" else "assistant"
                chat_history.append({"role": role, "content": msg["content"]})
                
            lang_map = {"en": "english", "kn": "kannada", "hi": "hindi", "english": "english", "kannada": "kannada", "hindi": "hindi"}
            final_lang = lang_map.get(language, "english")
            
            return chat_with_ai(message, agent_type=agent, language=final_lang, chat_history=chat_history)
        except Exception as e:
            print(f"Orchestrator Error: {e}")
            return "Something went wrong. Please try again."
