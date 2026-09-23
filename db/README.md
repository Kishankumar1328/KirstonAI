# KirstonAI Database Management Guide

This directory contains database schemas, migrations, and seed scripts for KirstonAI using PostgreSQL and the `pgvector` extension (compatible with Supabase PostgreSQL or standalone PostgreSQL).

## Database Structure

The database consists of the following primary tables:

1. **`users`**: Platform user accounts and authentication.
2. **`conversations`**: Conversation threads associated with users.
3. **`messages`**: Dialogue history per conversation.
4. **`documents`**: Uploaded RAG files (PDF, DOCX, TXT, Markdown, etc.).
5. **`document_chunks`**: Chunked text snippets with `pgvector` embeddings (`vector(1536)`) and HNSW index.
6. **`sources`**: Grounded source citations linked to assistant responses.
7. **`generation_jobs`**: Asynchronous image, video, audio background tasks.
8. **`tool_calls`**: Audit logs for tool execution.
9. **`agent_runs`**: LangGraph execution trace logs.

## Setup Instructions

### 1. Enable `pgvector` Extension
Run in your PostgreSQL query console or Supabase SQL editor:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Run Schema Initialization
Execute `schema.sql` against your PostgreSQL database:
```bash
psql $DATABASE_URL -f db/schema.sql
```

### 3. Seed Development Data
To populate seed data:
```bash
psql $DATABASE_URL -f db/seed.sql
```
