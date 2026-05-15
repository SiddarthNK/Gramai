import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.models import User, Message, CropReport, VoiceLog, AnalyticsEvent, Conversation, get_db
from authentication.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now      = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    total_queries   = db.query(Message).filter(Message.role == "user").count()
    crop_scans      = db.query(CropReport).count()
    active_users    = db.query(User).filter(User.is_active == True).count()
    voice_sessions  = db.query(VoiceLog).count()

    # Week-over-week queries
    this_week   = db.query(Message).filter(Message.created_at >= week_ago, Message.role == "user").count()
    prior_week  = db.query(Message).filter(
        Message.created_at >= week_ago - timedelta(days=7),
        Message.created_at < week_ago,
        Message.role == "user",
    ).count()
    query_delta = f"+{this_week - prior_week} this week" if this_week >= prior_week else f"{this_week - prior_week} this week"

    # Average response time
    avg_rt = db.query(func.avg(Message.response_time_ms)).filter(
        Message.response_time_ms.isnot(None)
    ).scalar()
    avg_rt_s = f"{round((avg_rt or 1400) / 1000, 1)}s"

    stats = [
        {"label": "Total queries",  "value": f"{total_queries:,}", "delta": query_delta,       "deltaPositive": True,  "icon": "ti-message-dots"},
        {"label": "Crop scans",     "value": str(crop_scans),      "delta": "+8% this week",   "deltaPositive": True,  "icon": "ti-leaf"        },
        {"label": "Avg response",   "value": avg_rt_s,             "delta": "vs last week",    "deltaPositive": True,  "icon": "ti-clock"       },
        {"label": "Active users",   "value": str(active_users),    "delta": "registered",      "deltaPositive": True,  "icon": "ti-users"       },
    ]

    # Live activity feed — last 10 events
    events = db.query(AnalyticsEvent).order_by(AnalyticsEvent.created_at.desc()).limit(10).all()
    activity = []
    for e in events:
        meta = {}
        try: meta = json.loads(e.event_metadata or "{}")
        except: pass

        label_map = {
            "query":      lambda m: f"{m.get('agent','').capitalize()} agent answered a query",
            "crop_scan":  lambda m: "Crop image analyzed by Agriculture Agent",
            "voice":      lambda m: "Voice interaction recorded",
            "login":      lambda m: "User logged in",
        }
        fn = label_map.get(e.event_type, lambda m: e.event_type)
        activity.append({
            "id":        e.id,
            "title":     fn(meta),
            "agent":     e.agent or "system",
            "timestamp": e.created_at.isoformat() if e.created_at else now.isoformat(),
        })

    return {"stats": stats, "activity": activity, "voice_sessions": voice_sessions}


@router.get("/agents")
def get_agent_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    agents = ["agriculture", "medical", "education"]
    stats  = {}
    for a in agents:
        count = db.query(Message).filter(Message.agent == a).count()
        avg_conf = db.query(func.avg(Message.confidence)).filter(Message.agent == a).scalar()
        stats[a] = {"count": count, "avg_confidence": round((avg_conf or 0), 3)}
    return {"agents": stats}


@router.get("/timeseries")
def get_timeseries(time_range: str = "7d", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days     = days_map.get(time_range, 7)
    now      = datetime.utcnow()

    result = []
    for i in range(days - 1, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)

        queries    = db.query(Message).filter(Message.role == "user", Message.created_at >= day_start, Message.created_at < day_end).count()
        crop_scans = db.query(CropReport).filter(CropReport.created_at >= day_start, CropReport.created_at < day_end).count()
        voice      = db.query(VoiceLog).filter(VoiceLog.created_at >= day_start, VoiceLog.created_at < day_end).count()

        result.append({
            "date":       day_start.strftime("%a" if days <= 7 else "%d/%m"),
            "queries":    queries,
            "crop_scans": crop_scans,
            "voice":      voice,
        })

    return {"timeseries": result, "range": time_range}
