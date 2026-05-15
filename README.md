# GramAI — Rural AI Assistant Platform

> AI-powered multi-agent assistant for agriculture, medical, and education support in rural Karnataka.

![GramAI Dashboard](./gramai_dashboard.html)

## ✨ Features

| Feature | Status |
|---|---|
| Multi-Agent Orchestration (Agriculture · Medical · Education) | ✅ |
| Intent Classification & Dynamic Routing | ✅ |
| Crop Disease Detection (Image AI) | ✅ |
| Voice Assistant (Whisper STT + gTTS TTS) | ✅ |
| Kannada + English multilingual support | ✅ |
| JWT Authentication (Login / Signup / Demo) | ✅ |
| Analytics Dashboard (Recharts) | ✅ |
| Offline Fallback Mode | ✅ |
| PostgreSQL + SQLite DB | ✅ |
| Docker Compose deployment | ✅ |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **PostgreSQL** (or use SQLite for dev — no setup needed)

---

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env — add your GOOGLE_API_KEY (or OPENAI_API_KEY)

# Start server
uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → API docs: http://localhost:8000/api/docs
```

### 3. Demo Login

Without any backend running, the frontend works in **demo mode**:
- Click **"Try Demo Account"** on the login page
- All UI features work with static data
- Chat shows intelligent fallback responses

---

## 🔑 API Keys (Optional but Recommended)

Edit `backend/.env`:

```env
# Google Gemini (free tier available)
GOOGLE_API_KEY=your_key_here

# Or OpenAI
OPENAI_API_KEY=your_key_here

# Weather API (OpenWeatherMap — free)
OPENWEATHER_API_KEY=your_key_here
```

**Without an API key**, the system runs in demo mode with pre-built intelligent responses for all three agents.

---

## 🐳 Docker Deployment

```bash
# Copy and configure env
cp backend/.env.example backend/.env
# Edit backend/.env with your keys

# Start all services
docker-compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/api/docs
```

## 🚀 Local Manual Deployment

If Docker is not available, you can run the services manually:

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Demo Credentials
- **Email**: `demo@gramai.in`
- **Password**: `demo1234`

---

## 📁 Project Structure

```
GRAM_AI/
├── frontend/                  # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── contexts/          # AuthContext, ChatContext
│   │   ├── pages/             # Dashboard, Chat, Voice, Analytics, CropUpload, Settings
│   │   ├── components/        # ChatBubble, ChatInput, StatCard, VoiceBar, ActivityFeed
│   │   ├── layouts/           # AppLayout (sidebar + topbar)
│   │   ├── services/          # Axios API layer
│   │   └── utils/             # Helpers, formatters
│   └── Dockerfile
│
├── backend/                   # FastAPI + Python
│   ├── agents/                # Orchestrator with LangChain routing
│   ├── ai_models/             # Crop disease detection (CNN heuristic)
│   ├── voice/                 # Whisper STT + gTTS TTS
│   ├── routes/                # auth, chat, crop, voice, analytics
│   ├── database/              # SQLAlchemy models
│   ├── authentication/        # JWT auth
│   ├── main.py                # FastAPI entry point
│   ├── config.py              # Pydantic settings
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 🤖 AI Agents

### Orchestrator
- Keyword + regex intent classification
- Kannada language detection
- Emergency symptom detection → escalation
- Routes to Agriculture / Medical / Education agent
- Context-aware conversation history

### Agriculture Agent
- Crop disease advice with treatment + prevention
- Fertilizer and irrigation guidance
- Karnataka-specific crop knowledge (paddy, ragi, sugarcane)
- Image-based disease detection (CNN heuristic)

### Medical Agent
- Symptom explanation with severity estimation
- Always includes safety disclaimer
- Emergency detection → 108 ambulance alert
- Never prescribes specific medicines

### Education Agent
- Subject explanations (Math, Science, English, Kannada)
- Quiz generation
- Step-by-step problem solving
- Supports Kannada language

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `users` | Accounts with role, location, language preference |
| `conversations` | Chat sessions by session_id |
| `messages` | All messages with agent type, confidence |
| `crop_reports` | Disease scan history with images |
| `voice_logs` | Voice session transcriptions |
| `analytics_events` | Platform usage events |

---

## 🔒 Security

- JWT tokens with 7-day expiry
- bcrypt password hashing
- CORS configured for specific origins
- Input validation on all endpoints
- File type and size limits on uploads
- SQL injection prevention via SQLAlchemy ORM

---

## 📊 Analytics

The Analytics dashboard tracks:
- Query volume over time (7d / 30d / 90d)
- Agent distribution (Agriculture / Medical / Education)
- Top crop diseases detected
- Voice session counts
- User registrations

---

## 🌐 Multilingual Support

| Language | Chat | Voice | UI |
|---|---|---|---|
| English | ✅ | ✅ | ✅ |
| Kannada (ಕನ್ನಡ) | ✅ | ✅ (Whisper) | ✅ (Toggle) |

---

## 📱 PWA Support

Add `public/manifest.json` to enable installable PWA on mobile devices.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend | FastAPI (Python 3.11) |
| AI Framework | LangChain + Google Gemini / OpenAI |
| Database | PostgreSQL / SQLite |
| Vector DB | ChromaDB (RAG memory) |
| Auth | JWT + bcrypt |
| Voice STT | OpenAI Whisper |
| Voice TTS | gTTS |
| Image AI | Pillow + NumPy heuristic |
| Containers | Docker + Docker Compose |

---

*Built for hackathon · Production-ready architecture · Karnataka rural communities*
