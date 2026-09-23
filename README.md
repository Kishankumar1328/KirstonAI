# 🚀 KirstonAI — Agentic AI Coding & Multimodal RAG Platform

**Repository:** [https://github.com/Kishankumar1328/KirstonAI](https://github.com/Kishankumar1328/KirstonAI)
**KirstonAI** is a production-grade, autonomous agentic AI software engineering and multimodal Retrieval-Augmented Generation (RAG) platform. Driven by **NVIDIA Nemotron LLM reasoning models**, **LangGraph query orchestrator routing**, **PostgreSQL + pgvector vector search**, and **FastAPI streaming execution**, KirstonAI acts as an autonomous software engineer, researcher, debugger, and multimodal assistant.

---

## 🌟 Architecture & Core Capabilities

- **LangGraph Query Orchestrator**: Dynamic intent classification and routing across 6 agent execution pathways:
  1. **Direct Chat Agent**: High-performance conversational response and conceptual explanations.
  2. **RAG Agent**: Document-grounded retrieval across PDF, DOCX, TXT, Markdown, CSV, JSON, and code files.
  3. **Code Engineer Agent**: Autonomous software engineering, file modification, planning, and execution.
  4. **Debugging Agent**: Code inspection, stack trace analysis, root cause diagnosis, and auto-correction.
  5. **Tool Agent**: Real-time system measurements, computations, and metric evaluations.
  6. **Multimodal Agent**: Visual processing, image generation (FLUX.1 NIM), and speech synthesis (TTS).
- **Text-to-Speech (TTS) Engine**: Dedicated asynchronous `POST /api/v1/tts` pipeline supporting `gTTS`, `OpenAI`, and `ElevenLabs` with persistent background synthesis across conversation switches.
- **PostgreSQL + pgvector**: Vector embedding storage (`vector(1536)`) with HNSW cosine distance indexing for ultra-fast document search.
- **Real-Time Token Streaming**: Low-latency Server-Sent Events (SSE) via `POST /api/v1/chat/stream`.
- **Thread Isolation & State Management**: Fully independent conversation threads with persistent state in Zustand and PostgreSQL.
- **Production Infrastructure**: Rate limiting (SlowAPI), `X-Request-ID` tracing, structured error handlers, CORS protection, and Render native blueprint configuration.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Python 3.11+ | FastAPI | Uvicorn
- **Orchestration**: LangGraph | LangChain Core
- **LLM Reasoning Engine**: NVIDIA Nemotron API (`NVIDIA_API_KEY`)
- **TTS Engine**: gTTS | OpenAI Audio | ElevenLabs
- **Database & Vector Search**: Supabase PostgreSQL / PostgreSQL | `pgvector` | SQLAlchemy
- **Security & Rate Limits**: PyJWT | Passlib (Bcrypt) | SlowAPI
- **Testing**: Pytest | TestClient | Pytest-Asyncio

### Frontend
- **Framework**: React 18 | TypeScript | Vite
- **Styling**: Tailwind CSS | Lucide React Icons
- **State Management**: Zustand (`chatStore`, `themeStore`, `ttsStore`)
- **Routing & Markdown**: React Router v6 | ReactMarkdown | Remark-GFM

---

## 📂 Project Structure

```text
KirstonAI/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point & middleware stack
│   │   ├── api/                    # Versioned REST endpoints (chat, tts, search, docs, health)
│   │   ├── agents/                 # LangGraph Query Orchestrator, AgentState, and nodes
│   │   ├── ai/                     # NVIDIA Nemotron provider & streaming logic
│   │   ├── rag/                    # Ingestion, chunking, and pgvector retriever
│   │   ├── services/               # Chat, TTS, Conversation, Search, and Analytics services
│   │   ├── models/                 # SQLAlchemy ORM schemas
│   │   ├── schemas/                # Pydantic validation schemas
│   │   ├── middleware/             # Logging, Request ID, Error Handler & Auth
│   │   └── core/                   # System configuration & exceptions
│   ├── tests/                      # Pytest suite (unit, API, TTS tests)
│   ├── requirements.txt            # Backend Python dependencies
│   ├── pytest.ini                  # Pytest runner config
│   └── .env.example                # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/             # Chat, AudioPlayer, MessageList, MessageBubble, Sidebar
│   │   ├── services/               # API client & streaming fetch handlers
│   │   ├── store/                  # Zustand stores (chatStore, themeStore, ttsStore)
│   │   ├── pages/                  # ChatPage, KnowledgePage, ModelsPage
│   │   └── types/                  # TypeScript interface contracts
│   ├── package.json                # Frontend Node dependencies & scripts
│   ├── vite.config.ts              # Vite bundle configuration
│   └── tailwind.config.js          # Tailwind CSS styling
├── db/
│   ├── schema.sql                  # PostgreSQL + pgvector schema script
│   ├── migrations/                 # Versioned SQL migrations
│   ├── seed.sql                    # Development seed data
│   └── README.md                   # Database setup guide
├── .env.example                    # Global environment setup reference
├── render.yaml                     # Render platform deployment manifest
└── README.md                       # Product documentation
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `backend/.env`:

```env
APP_NAME=KirstonAI
APP_ENV=development
PORT=8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/kirstonai

# AI & LLM Engine
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b

# Text-to-Speech (TTS) Config
TTS_PROVIDER=gtts
TTS_VOICE=default
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# Security & CORS
JWT_SECRET=antigravity_secret_key_32bytes_minimum_length_required
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limits
CHAT_RATE_LIMIT=30/minute
SEARCH_RATE_LIMIT=60/minute
LOG_LEVEL=INFO
```

---

## 🚀 Local Development Setup

### 1. Database Setup
```bash
# Enable pgvector and create schema in PostgreSQL
psql $DATABASE_URL -f db/schema.sql
psql $DATABASE_URL -f db/seed.sql
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Interactive API docs available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access UI at `http://localhost:5173`.

---

## 🧪 Running Automated Tests

Run backend tests:
```bash
cd backend
python -m pytest tests/api/test_tts.py -v
python -m pytest
```

Run frontend build check:
```bash
cd frontend
npm run build
```

---

## ☁️ Deployment (Render)

Deploy on Render using `render.yaml`:

1. Connect GitHub repository to Render Dashboard.
2. Select **New Blueprint Instance**.
3. Render automatically provisions the web service (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`) and static frontend build.
