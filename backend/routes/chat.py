import time
import json
import os
from datetime import datetime
import pytz
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database.models import User, Conversation, Message, AnalyticsEvent, get_db
from authentication.auth import get_current_user
from agents.orchestrator import OrchestratorAgent

router     = APIRouter(prefix="/api/chat", tags=["chat"])
orchestrator = OrchestratorAgent()

def get_realtime_context(message: str) -> str:
    """Add real-time context to messages that need it"""
    context = ""
    message_lower = message.lower()

    # Add current time and date for time questions
    time_keywords = [
        "time", "date", "today", "day",
        "week", "month", "year", "now",
        "tomorrow", "yesterday", "schedule"
    ]
    if any(keyword in message_lower for keyword in time_keywords):
        india_tz = pytz.timezone("Asia/Kolkata")
        now = datetime.now(india_tz)
        context += f"""
[REAL-TIME DATA]
Current Date: {now.strftime("%A, %d %B %Y")}
Current Time: {now.strftime("%I:%M %p")} IST
Day of Week: {now.strftime("%A")}
Week Number: {now.strftime("%W")}
[END REAL-TIME DATA]

"""

    # Add weather context for weather questions
    weather_keywords = [
        "weather", "rain", "temperature", "hot",
        "cold", "humid", "forecast", "climate",
        "sunny", "cloudy", "storm"
    ]
    if any(keyword in message_lower for keyword in weather_keywords):
        try:
            weather_key = os.getenv("OPENWEATHER_API_KEY")
            if weather_key:
                weather_url = f"https://api.openweathermap.org/data/2.5/weather?q=Bangalore,IN&appid={weather_key}&units=metric"
                response = httpx.get(weather_url, timeout=5)
                if response.status_code == 200:
                    weather_data = response.json()
                    context += f"""
[WEATHER DATA - Bangalore, Karnataka]
Temperature: {weather_data['main']['temp']}°C
Feels Like: {weather_data['main']['feels_like']}°C
Condition: {weather_data['weather'][0]['description']}
Humidity: {weather_data['main']['humidity']}%
Wind: {weather_data['wind']['speed']} m/s
[END WEATHER DATA]

"""
        except:
            pass
    return context

def detect_agent_from_message(message: str) -> str:
    """Automatically detect the best agent for the message"""
    message_lower = message.lower()

    agriculture_words = [
        "crop", "farm", "soil", "plant", "disease",
        "fertilizer", "pest", "harvest", "seed",
        "irrigation", "tomato", "rice", "wheat",
        "paddy", "field", "kisan", "farmer"
    ]
    medical_words = [
        "fever", "pain", "sick", "hospital",
        "medicine", "doctor", "symptom", "health",
        "headache", "cold", "cough", "disease",
        "treatment", "tablet", "injection"
    ]
    education_words = [
        "explain", "what is", "how does",
        "teach", "learn", "study", "exam",
        "question", "answer", "chapter",
        "math", "science", "history", "english"
    ]
    grammar_words = [
        "correct this", "grammar", "spelling",
        "fix my", "check this", "rewrite",
        "improve my", "is this correct",
        "mistake", "error in"
    ]
    planning_words = [
        "plan my day", "schedule", "routine",
        "time table", "to do", "todo",
        "plan for today", "organize my",
        "daily plan", "timetable"
    ]

    if any(word in message_lower for word in grammar_words):
        return "grammar"
    if any(word in message_lower for word in planning_words):
        return "planner"
    if any(word in message_lower for word in agriculture_words):
        return "agriculture"
    if any(word in message_lower for word in medical_words):
        return "medical"
    if any(word in message_lower for word in education_words):
        return "education"

    return "assistant"


class ChatRequest(BaseModel):
    message:    str
    session_id: str
    language:   str = "en"
    topic:      Optional[str] = None


@router.post("/message")
async def send_message(req: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        if not req.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        if len(req.message) > 2000:
            raise HTTPException(status_code=400, detail="Message too long (max 2000 chars)")

        # Get or create conversation
        convo = db.query(Conversation).filter(
            Conversation.session_id == req.session_id,
            Conversation.user_id == current_user.id,
        ).first()
        if not convo:
            convo = Conversation(user_id=current_user.id, session_id=req.session_id)
            db.add(convo)
            db.commit()
            db.refresh(convo)

        # Build history for context
        recent_msgs = db.query(Message).filter(Message.conversation_id == convo.id).order_by(Message.created_at.desc()).limit(10).all()
        history = [{"role": m.role, "content": m.content} for m in reversed(recent_msgs)]

        # Route via orchestrator
        routing = orchestrator.route(req.message, history, req.language, forced_agent=req.topic)
        agent   = routing["agent"]
        is_emergency = routing["is_emergency"]
        language = routing["language"]

        # Save user message
        user_msg = Message(conversation_id=convo.id, role="user", content=req.message)
        db.add(user_msg)
        db.commit()

        # Generate response
        start = time.time()
        lang_map = {"en": "english", "kn": "kannada", "hi": "hindi", "english": "english", "kannada": "kannada", "hindi": "hindi"}
        final_lang = lang_map.get(language, "english")

        # Get real-time context
        realtime_context = get_realtime_context(req.message)
        enhanced_message = realtime_context + req.message

        import asyncio
        from services.model_service import chat_with_ai_hybrid
        
        # Auto-detect agent from message if general
        if agent == "general":
            agent = detect_agent_from_message(req.message)
            
        response_text = await asyncio.to_thread(
            chat_with_ai_hybrid,
            message=enhanced_message,
            agent_type=agent,
            language=final_lang,
            use_local_first=True,
            prefer_lightweight=False
        )
        elapsed_ms = int((time.time() - start) * 1000)

        # Save AI message
        ai_msg = Message(
            conversation_id=convo.id, role="assistant",
            content=response_text, agent=agent,
            confidence=routing["confidence"],
            response_time_ms=elapsed_ms,
        )
        db.add(ai_msg)

        # Log analytics event
        event = AnalyticsEvent(
            event_type="query", agent=agent,
            user_id=current_user.id,
            event_metadata=json.dumps({"is_emergency": is_emergency, "lang": language, "response_ms": elapsed_ms}),
        )
        db.add(event)
        db.commit()

        return {
            "response":   response_text,
            "agent":      agent,
            "confidence": routing["confidence"],
            "language":   language,
            "is_emergency": is_emergency,
            "response_ms": elapsed_ms,
        }
    except Exception as e:
        print(f"EXACT ERROR: {str(e)}")
        print(f"ERROR TYPE: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/history/{session_id}")
def get_history(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convo = db.query(Conversation).filter(
        Conversation.session_id == session_id,
        Conversation.user_id == current_user.id,
    ).first()
    if not convo:
        return {"messages": []}

    messages = db.query(Message).filter(Message.conversation_id == convo.id).order_by(Message.created_at).all()
    return {
        "messages": [
            {
                "id":         m.id,
                "role":       m.role,
                "content":    m.content,
                "agent":      m.agent,
                "confidence": m.confidence,
                "timestamp":  m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ]
    }


@router.delete("/history/{session_id}")
def clear_history(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convo = db.query(Conversation).filter(
        Conversation.session_id == session_id,
        Conversation.user_id == current_user.id,
    ).first()
    if convo:
        db.query(Message).filter(Message.conversation_id == convo.id).delete()
        db.delete(convo)
        db.commit()
    return {"status": "cleared"}
