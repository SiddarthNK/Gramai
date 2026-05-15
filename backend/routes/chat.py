import time
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database.models import User, Conversation, Message, AnalyticsEvent, get_db
from authentication.auth import get_current_user
from agents.orchestrator import OrchestratorAgent

router     = APIRouter(prefix="/api/chat", tags=["chat"])
orchestrator = OrchestratorAgent()


class ChatRequest(BaseModel):
    message:    str
    session_id: str
    language:   str = "en"
    topic:      Optional[str] = None


@router.post("/message")
async def send_message(req: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
    response_text = await orchestrator.respond(
        message=req.message,
        agent=agent,
        history=history,
        language=language,
        is_emergency=is_emergency,
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
