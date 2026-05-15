"""
GramAI Backend — FastAPI Application Entry Point
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles

from config import get_settings
from database.models import create_tables
from routes import auth, chat, voice, crop, analytics

settings = get_settings()

# ─── Create FastAPI app ──────────────────────────────────────────────────────
app = FastAPI(
    title="GramAI API",
    description="AI-powered Rural Multi-Agent Assistant Platform for Karnataka",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include routers ─────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(voice.router)
app.include_router(crop.router)
app.include_router(analytics.router)

# ─── Serve uploaded files ────────────────────────────────────────────────────
os.makedirs("./uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")


# ─── Startup ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    """Initialize database tables and seed demo data."""
    create_tables()
    _seed_demo_user()


def _seed_demo_user():
    """Create demo user if not exists."""
    from database.models import SessionLocal, User
    from authentication.auth import hash_password
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "demo@gramai.in").first():
            demo = User(
                name="Raju Kumar",
                email="demo@gramai.in",
                password_hash=hash_password("demo1234"),
                location="Kolar, Karnataka",
                role="Farmer",
            )
            db.add(demo)
            db.commit()
            print("✅ Demo user created: demo@gramai.in / demo1234")
    finally:
        db.close()


# ─── Health check ────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "status":  "healthy",
        "version": "1.0.0",
        "agents":  ["agriculture", "medical", "education"],
        "llm":     settings.llm_model if (settings.google_api_key or settings.openai_api_key) else "no-api-key (demo mode)",
    }


@app.get("/")
def root():
    return {"message": "GramAI API — Rural AI Assistant Platform", "docs": "/api/docs"}


if __name__ == "__main__":
    import uvicorn
    import sys
    try:
        print("Starting GramAI Backend...")
        uvicorn.run(app, host="0.0.0.0", port=8001)
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        sys.exit(1)
