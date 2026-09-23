# ANTIGRAVITY — Architecture Specification & Diagrams

ANTIGRAVITY is built on a clean layer-decoupled architecture designed for high performance, real-time SSE streaming, database history persistence, stateful agent workflows via **LangGraph**, and document retrieval (**RAG**) powered by **NVIDIA Nemotron API** models.

## High-Level Topology

```mermaid
graph TD
    Client[React + TS Frontend] -->|HTTP / SSE Stream| FastAPI[FastAPI Backend]
    FastAPI --> AuthMiddleware[Auth & RequestID Middleware]
    AuthMiddleware --> ChatService[Chat Service]
    ChatService --> LangGraph[LangGraph Agent Graph]
    LangGraph --> RAG[RAG Vector Retriever]
    RAG --> DocumentStore[(Document Index)]
    LangGraph --> Nemotron[NVIDIA Nemotron 70B LLM]
    ChatService -->|SSE Tokens| Client
    ChatService --> Repository[SQLAlchemy Repositories]
    Repository --> Database[(Supabase PostgreSQL / SQLite)]
```

## LangGraph Execution Graph

```mermaid
graph LR
    START --> ValidateInput[Validate Input Node]
    ValidateInput --> RAGRetriever[RAG Retriever Node]
    RAGRetriever --> PreparePrompt[Prepare Prompt Node]
    PreparePrompt --> StreamLLM[Stream Nemotron LLM]
    StreamLLM --> PersistResponse[Persist Response]
    PersistResponse --> END
```

## Real-Time SSE Token Streaming Flow

```mermaid
sequenceDiagram
    participant User as Client (React UI)
    participant API as FastAPI Router
    participant Service as ChatService
    participant Agent as LangGraph Workflow
    participant LLM as NVIDIA Nemotron API
    participant DB as Database (PostgreSQL/SQLite)

    User->>API: POST /api/v1/chat/stream
    API->>Service: stream_chat(thread_id, message)
    Service->>DB: Save User Message
    Service->>DB: Create Assistant Message (streaming)
    Service->>Agent: Invoke LangGraph (State)
    Agent->>Agent: Retrieve RAG Documents
    Service font-->>User: event: message_start
    Service->>LLM: Stream completion (messages)
    loop Token Generator
        LLM-->>Service: Yield token chunk
        Service-->>User: event: token {content: "..."}
    end
    Service->>DB: Update Assistant Message (completed)
    Service font-->>User: event: message_complete
```
