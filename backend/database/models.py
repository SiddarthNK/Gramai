from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import enum

from config import get_settings

settings = get_settings()

# Support both SQLite and PostgreSQL
connect_args = {"check_same_thread": False} if "sqlite" in settings.database_url else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Enums ─────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    farmer          = "Farmer"
    student         = "Student"
    healthcare      = "Healthcare Worker"
    teacher         = "Teacher"
    admin           = "Admin"

class AgentType(str, enum.Enum):
    agriculture = "agriculture"
    medical     = "medical"
    education   = "education"
    orchestrator= "orchestrator"


# ─── Models ────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(120), nullable=False)
    email         = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    location      = Column(String(200), nullable=True)
    role          = Column(String(50), default="Farmer")
    language      = Column(String(10), default="en")
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    conversations = relationship("Conversation", back_populates="user")
    crop_reports  = relationship("CropReport",   back_populates="user")


class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(String(100), index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user     = relationship("User",    back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id              = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role            = Column(String(20), nullable=False)   # user / assistant
    content         = Column(Text, nullable=False)
    agent           = Column(String(30), nullable=True)    # agriculture/medical/education
    confidence      = Column(Float, nullable=True)
    mode            = Column(String(20), default="text")   # text / voice
    response_time_ms= Column(Integer, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")


class CropReport(Base):
    __tablename__ = "crop_reports"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path   = Column(String(500), nullable=True)
    disease      = Column(String(200), nullable=True)
    confidence   = Column(Float, nullable=True)
    treatment    = Column(Text, nullable=True)
    prevention   = Column(Text, nullable=True)
    crop_type    = Column(String(100), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="crop_reports")


class VoiceLog(Base):
    __tablename__ = "voice_logs"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=True)
    transcribed_text= Column(Text, nullable=True)
    language        = Column(String(10), default="en")
    duration_secs   = Column(Float, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id         = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False)   # query / crop_scan / voice / login
    agent      = Column(String(30), nullable=True)
    user_id    = Column(Integer, nullable=True)
    event_metadata = Column(Text, nullable=True)           # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())


def create_tables():
    Base.metadata.create_all(bind=engine)
