# IKnowYou

> Privacy-first, fully local personal relationship memory system.

## Status
🚧 Phase 0 — Repository bootstrap complete

## What this does
Helps you remember people, relationships, and conversations.
Fully local. No cloud. No API keys. Works on 2GB RAM.

## Stack
- FastAPI + Neo4j + SQLite-VSS
- Ollama (local LLM) with spaCy fallback
- Whisper STT (local)
- AES-256-GCM encryption at rest
- Next.js 14 frontend

## Setup
```bash
./scripts/setup.sh
```

## Phases
- [x] Phase 0 — Bootstrap
- [ ] Phase 1 — Core data layer
- [ ] Phase 2 — Extraction pipeline
- [ ] Phase 3 — API layer
- [ ] Phase 4 — Cultural resolver
- [ ] Phase 5 — STT integration
- [ ] Phase 6 — Frontend
- [ ] Phase 7 — Encryption
- [ ] Phase 8 — Polish & tests
