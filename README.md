<div align="center">
  <img src="https://img.shields.io/badge/KirstonAI-Agentic_AI_Coding_%26_Multimodal_RAG-blue?style=for-the-badge" alt="KirstonAI Banner" />
  <br />
  <p><strong>A production-grade autonomous agentic AI software engineering and multimodal RAG platform.</strong></p>

  <p>
    <a href="https://github.com/Kishankumar1328/KirstonAI"><img src="https://img.shields.io/github/stars/Kishankumar1328/KirstonAI?style=flat-square&color=yellow" alt="Stars" /></a>
    <a href="https://github.com/Kishankumar1328/KirstonAI/network/members"><img src="https://img.shields.io/github/forks/Kishankumar1328/KirstonAI?style=flat-square&color=orange" alt="Forks" /></a>
    <img src="https://img.shields.io/badge/Python-3.11+-blue.svg?style=flat-square&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/React-18-blue.svg?style=flat-square&logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  </p>
</div>

---

## 🌟 Architecture & Core Capabilities

Driven by **NVIDIA Nemotron LLM reasoning models**, **LangGraph query orchestrator routing**, **PostgreSQL + pgvector vector search**, and **FastAPI streaming execution**, KirstonAI acts as an autonomous software engineer, researcher, debugger, and multimodal assistant.

- 🧠 **LangGraph Query Orchestrator**: Dynamic intent classification and routing across 6 agent execution pathways:
  1. **Direct Chat Agent**: High-performance conversational response and conceptual explanations.
  2. **RAG Agent**: Document-grounded retrieval across PDF, DOCX, TXT, Markdown, CSV, JSON, and code files.
  3. **Code Engineer Agent**: Autonomous software engineering, file modification, planning, and execution.
  4. **Debugging Agent**: Code inspection, stack trace analysis, root cause diagnosis, and auto-correction.
  5. **Tool Agent**: Real-time system measurements, computations, and metric evaluations.
  6. **Multimodal Agent**: Visual processing, image generation (FLUX.1 NIM), and speech synthesis (TTS).
- 🗣️ **Text-to-Speech (TTS) Engine**: Dedicated asynchronous `POST /api/v1/tts` pipeline supporting `gTTS`, `OpenAI`, and `ElevenLabs` with persistent background synthesis across conversation switches.
- 🗄️ **PostgreSQL + pgvector**: Vector embedding storage (`vector(1536)`) with HNSW cosine distance indexing for ultra-fast document search.
- ⚡ **Real-Time Token Streaming**: Low-latency Server-Sent Events (SSE) via `POST /api/v1/chat/stream`.
- 🧵 **Thread Isolation & State Management**: Fully independent conversation threads with persistent state in Zustand and PostgreSQL.
- 🛡️ **Production Infrastructure**: Rate limiting (SlowAPI), `X-Request-ID` tracing, structured error handlers, CORS protection, and Render native blueprint configuration.

---

## 🛠️ Technology Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Backend Framework** | Python 3.11+, FastAPI, Uvicorn |
| **AI / Orchestration** | LangGraph, LangChain Core, NVIDIA Nemotron API |
| **TTS Engine** | gTTS, OpenAI Audio, ElevenLabs |
| **Database / Vector Search** | Supabase PostgreSQL, `pgvector`, SQLAlchemy |
| **Security & Limits** | PyJWT, Passlib (Bcrypt), SlowAPI |
| **Frontend Framework** | React 18, TypeScript, Vite |
| **Styling & UI** | Tailwind CSS, Lucide React Icons |
| **State Management** | Zustand (`chatStore`, `themeStore`, `ttsStore`) |
| **Testing** | Pytest, TestClient, Pytest-Asyncio |

---

## 📂 Project Structure

```text
KirstonAI/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point & middleware stack
│   │   ├── api/                    # Versioned REST endpoints
│   │   ├── agents/                 # LangGraph Query Orchestrator & nodes
│   │   ├── ai/                     # NVIDIA Nemotron provider & streaming logic
│   │   ├── rag/                    # Ingestion, chunking, and pgvector retriever
│   │   ├── services/               # Core services (Chat, TTS, Search, etc.)
│   │   ├── models/                 # SQLAlchemy ORM schemas
│   │   ├── schemas/                # Pydantic validation schemas
│   │   ├── middleware/             # Logging, Request ID, Error Handler & Auth
│   │   └── core/                   # System configuration & exceptions
│   ├── tests/                      # Pytest suite
│   ├── requirements.txt            # Backend Python dependencies
│   └── .env.example                # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/             # React UI components
│   │   ├── services/               # API client & streaming fetch handlers
│   │   ├── store/                  # Zustand stores
│   │   ├── pages/                  # Application routing pages
│   │   └── types/                  # TypeScript interface contracts
│   ├── package.json                # Frontend Node dependencies & scripts
│   ├── vite.config.ts              # Vite bundle configuration
│   └── tailwind.config.js          # Tailwind CSS styling
├── db/
│   ├── schema.sql                  # PostgreSQL + pgvector schema script
│   ├── migrations/                 # Versioned SQL migrations
│   └── seed.sql                    # Development seed data
├── render.yaml                     # Render platform deployment manifest
└── README.md                       # Product documentation
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `backend/.env` and update the values:

```env
APP_NAME=KirstonAI
APP_ENV=development
PORT=8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/kirstonai

# AI & LLM Engine
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b
GEMINI_API_KEY=your_gemini_api_key_here

# Text-to-Speech (TTS) Config
TTS_PROVIDER=gtts
TTS_VOICE=default
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# 3D Object Generator & AI/ML API Config
AIMLAPI_KEY=your_aimlapi_key_here

# Security & CORS
JWT_SECRET=your_32_byte_secret_key
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

> [!WARNING]
> **Never commit your `.env` file to version control.** Always use `.env.example` as a template for other developers.

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
*Interactive API docs are available at `http://localhost:8000/docs`.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Access the UI at `http://localhost:5173`.*

---

## 🧪 Testing

**Run Backend Tests:**
```bash
cd backend
python -m pytest tests/api/test_tts.py -v
python -m pytest
```

**Run Frontend Build Check:**
```bash
cd frontend
npm run build
```

---

## ☁️ Deployment (Render)

KirstonAI is pre-configured for automated deployment on Render using `render.yaml`.

1. Connect your GitHub repository to the Render Dashboard.
2. Select **New Blueprint Instance**.
3. Render will automatically provision the web service (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`) and build the static frontend.

---

<div align="center">
  <i>Built with ❤️ using FastAPI, React, and NVIDIA AI</i>
</div>
