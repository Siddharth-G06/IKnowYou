# IKnowYou

> Privacy-first, fully local personal relationship memory system.
> Built for people who want to remember the humans in their life — without giving that data to anyone.

## What it does

- Log memories as text or voice
- Automatically extracts people and relationships using local LLM (Ollama) with spaCy/rule-based fallback
- Stores a knowledge graph of your relationships (Neo4j)
- Semantic search over your memories (SQLite-VSS)
- Encrypts all content at rest with AES-256-GCM
- Full Indian relationship cultural context mapping

## Stack
- FastAPI + Neo4j + SQLite-VSS
- Next.js 14 frontend

## Setup

```bash
./scripts/setup.sh
docker compose up -d neo4j
cd backend && uv run uvicorn app.main:app --reload
cd frontend && pnpm run dev
```
