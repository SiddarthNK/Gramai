import re
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.chat_models import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from config import get_settings
from rag.memory import get_memory

settings = get_settings()


def get_llm():
    """Return appropriate LLM based on configured API keys."""
    if settings.google_api_key:
        return ChatGoogleGenerativeAI(
            model=settings.llm_model,
            google_api_key=settings.google_api_key,
            temperature=0.7,
            convert_system_message_to_human=True,
        )
    if settings.openai_api_key:
        return ChatOpenAI(
            model="gpt-4o-mini",
            openai_api_key=settings.openai_api_key,
            temperature=0.7,
        )
    return None


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
    Returns: { agent: str, confidence: float, is_emergency: bool }
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
    """Routes queries to specialized agents with memory-aware context."""

    def __init__(self):
        self.llm = get_llm()

    def route(self, message: str, history: list[dict], language: str = "en", forced_agent: Optional[str] = None) -> dict:
        """
        Classify intent, detect emergency, route to best agent.
        If forced_agent is provided, it skips classification (except for emergency check).
        """
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
        """Generate agent response using LLM, with fallback for no API key."""
        if not self.llm:
            return self._fallback_response(message, agent, language, is_emergency)

        system_prompt = self._build_system_prompt(agent, language, is_emergency)
        context = self._build_context(history[-6:])  # last 3 turns

        # RAG retrieval
        memory = get_memory()
        docs = memory.search(message, k=2)
        rag_context = "\n".join([d.page_content for d in docs])
        if rag_context:
            system_prompt += f"\n\nRelevant Knowledge Base Information:\n{rag_context}"

        messages = [
            SystemMessage(content=system_prompt),
            *context,
            HumanMessage(content=message),
        ]

        try:
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            return self._fallback_response(message, agent, language, is_emergency)

    def _build_system_prompt(self, agent: str, language: str, is_emergency: bool) -> str:
        lang_instruction = (
            "Respond in Kannada (ಕನ್ನಡ). Keep language simple and rural-friendly."
            if language == "kn"
            else "Respond in clear, simple English suitable for rural users."
        )

        base = f"""You are GramAI, a highly specialized AI assistant dedicated to serving rural communities in Karnataka, India.
{lang_instruction}
Keep responses concise, practical, and immediately actionable. Use local context and avoid technical jargon.
"""
        if is_emergency:
            base += "\n⚠️ EMERGENCY DETECTED: Prioritize safety. Advise calling 108 immediately.\n"

        agent_prompts = {
            "agriculture": base + """You are the Senior Agriculture Expert. 
Your goal is to maximize crop yield and farmer prosperity.
Expertise areas:
- Precision farming: Advice on paddy, sugarcane, ragi, jowar, and horticultural crops like tomato and mango.
- Integrated Pest Management (IPM): Suggest organic (neem, yellow traps) and safe chemical solutions.
- Soil Health: Explain NPK balance and organic manuring.
- Weather-Smart Farming: Give advice based on current Karnataka seasons (Kharif/Rabi).
- Government Schemes: Mention Krishi Bhagya or Raitha Siri if relevant.
ALWAYS recommend the Crop Scanner for visual symptoms. If a disease is mentioned, provide clear 'Treatment' and 'Prevention' steps.""",

            "medical": base + """You are the Medical Health Officer.
Your goal is to provide accurate health guidance while ensuring safety.
Expertise areas:
- Common Rural Ailments: Fever, Malaria, Dengue, Typhoid, snake bites, and healthstroke.
- Maternal & Child Health: Nutrition, vaccinations, and prenatal care.
- First Aid: Step-by-step guidance for injuries, burns, or bites.
CRITICAL RULES:
1. ALWAYS start/end with: "⚠️ General health info only. Consult a PHC doctor."
2. DO NOT prescribe specific drug dosages. Suggest common safe practices (rest, hydration, paracetamol for fever if appropriate).
3. If symptoms sound severe (e.g. chest pain, high fever for 4 days), urge immediate visit to the nearest PHC or Taluk hospital.""",

            "education": base + """You are the Lead Education Tutor.
Your goal is to simplify complex concepts for students (Class 1-12) and lifelong learners.
Expertise areas:
- Core Subjects: Math (step-by-step), Science (experiments/concepts), English (grammar/vocab), and Social Studies.
- Competitive Exams: Help with CET, KPSC basics, or general knowledge.
- Career Guidance: Explain options after SSLC/PUC in Karnataka.
Pedagogy Style:
- Use local analogies (e.g., explaining interest using a village loan example).
- Encourage the student with positive feedback.
- If asked a math problem, show the logical steps clearly.
- For language, provide meanings in both English and Kannada.""",
        }
        return agent_prompts.get(agent, base)

    def _build_context(self, history: list[dict]) -> list:
        from langchain_core.messages import HumanMessage, AIMessage
        ctx = []
        for msg in history:
            if msg["role"] == "user":
                ctx.append(HumanMessage(content=msg["content"]))
            else:
                ctx.append(AIMessage(content=msg["content"]))
        return ctx

    def _fallback_response(self, message: str, agent: str, language: str, is_emergency: bool) -> str:
        """Pre-built responses when LLM is unavailable."""
        if is_emergency:
            return ("🚨 EMERGENCY: Please call 108 (ambulance) immediately! "
                    "Do not delay medical attention. Stay calm and keep the patient comfortable." if language == "en"
                    else "🚨 ತುರ್ತು: ತಕ್ಷಣ 108 (ಆಂಬ್ಯುಲೆನ್ಸ್) ಗೆ ಕರೆ ಮಾಡಿ!")

        fallbacks = {
            "agriculture": {
                "en": ("🌾 I can help with your farming query. For accurate crop disease diagnosis, "
                       "please upload a photo using the Crop Scanner. Common issues in Karnataka: "
                       "Early blight (tomato), leaf blast (paddy), powdery mildew (grape). "
                       "Connect to AI for personalized advice. [No API key configured]"),
                "kn": "🌾 ನಿಮ್ಮ ಕೃಷಿ ಸಮಸ್ಯೆಗೆ ಸಹಾಯ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. AI ಸಲಹೆಗಾಗಿ Google API ಕೀ ಸಂಪರ್ಕಿಸಿ.",
            },
            "medical": {
                "en": ("🩺 ⚠️ This is general health information only — consult a qualified doctor. "
                       "For basic fever: rest, stay hydrated, monitor temperature. "
                       "If severe or persistent for >3 days, visit PHC immediately. "
                       "Emergency: Call 108. [No API key configured]"),
                "kn": "🩺 ⚠️ ಇದು ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ಮಾಹಿತಿ ಮಾತ್ರ. ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ. ತುರ್ತು: 108 ಕರೆ ಮಾಡಿ.",
            },
            "education": {
                "en": ("📚 I'm here to help you learn! Please ask me about any school subject — "
                       "Math, Science, English, History. I'll explain clearly with examples. "
                       "[Connect Google API key for full AI tutoring]"),
                "kn": "📚 ನಾನು ನಿಮಗೆ ಕಲಿಯಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ! ಗಣಿತ, ವಿಜ್ಞಾನ ಅಥವಾ ಯಾವುದಾದರೂ ವಿಷಯ ಕೇಳಿ.",
            },
        }
        resp = fallbacks.get(agent, fallbacks["agriculture"])
        return resp.get(language, resp["en"])
