# IKnowYou 🧠

A personal memory and relationship management system. Keep track of everyone you meet, how they relate to you, and what you know about them — all visualised as an interactive graph.

---

## 🏗️ Architecture

```
┌─────────────────────┐      API       ┌──────────────────────┐
│  Next.js Frontend   │ ─────────────► │  FastAPI Backend     │
│  (localhost:3000)   │                │  (localhost:8000)    │
└─────────────────────┘                └──────────┬───────────┘
                                                  │
                          ┌───────────────────────┼──────────────────┐
                          ▼                       ▼                  ▼
                   ┌────────────┐       ┌──────────────┐    ┌──────────────┐
                   │   Neo4j    │       │   ChromaDB   │    │    Ollama    │
                   │  :7687     │       │  (embedded)  │    │   :11434     │
                   └────────────┘       └──────────────┘    └──────────────┘
```

---

## 📋 Prerequisites

Install these before anything else:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | https://nodejs.org |
| Python | v3.10+ | https://python.org |
| Docker Desktop | Latest | https://docker.com/products/docker-desktop |
| Ollama | Latest | https://ollama.com |

---

## 🚀 Running Locally (Step-by-Step)

> **Important:** These must be started **in order**. The backend depends on Neo4j, and the frontend depends on the backend.

### Step 1 — Start Neo4j (via Docker)

Open a terminal in the **project root** (`IKnowYou/`) and run:

```powershell
docker compose up -d neo4j
```

Wait ~15 seconds for Neo4j to fully initialise, then verify it is healthy:

```powershell
docker ps
```

You should see `iknowyou-neo4j` with status `Up`. The Neo4j Browser is accessible at **http://localhost:7474**.

> **Credentials:** username `neo4j` / password `IKnowYou123`

---

### Step 2 — Start Ollama & Pull Models

Make sure Ollama is running in the background (it auto-starts after install on Windows/Mac). Then pull the required AI models once:

```powershell
ollama pull mistral
ollama pull nomic-embed-text
```

Verify Ollama is reachable:

```powershell
# Should print {"models":[...]}
Invoke-RestMethod http://localhost:11434/api/tags
```

---

### Step 3 — Start the Backend

Open a **new terminal** and run:

```powershell
# Navigate into the backend folder
cd backend

# Create and activate a virtual environment (first time only)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Copy environment file (first time only)
copy .env.example .env
```

Your `backend/.env` should look like this (adjust if needed):

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=IKnowYou123

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
EMBEDDING_MODEL=nomic-embed-text
CHROMA_PERSIST_DIR=../data/chroma
```

Then start the server:

```powershell
# Make sure your venv is active — you should see (venv) in the prompt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend is ready when you see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Verify at **http://localhost:8000/health** — you should see `"neo4j": true`.

---

### Step 4 — Start the Frontend

Open a **new terminal** (keep the backend terminal running) and run:

```powershell
# Navigate into the frontend folder  
cd frontend

# Install dependencies (first time only)
npm install

# Copy environment file (first time only)
copy .env.local.example .env.local
```

Your `frontend/.env.local` should contain:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then start the dev server:

```powershell
npm run dev
```

✅ Frontend is ready when you see:
```
▲ Next.js
- Local: http://localhost:3000
```

Open **http://localhost:3000** in your browser. 🎉

---

## ⚠️ Common Problems & Fixes

### Backend crashes with `ServiceUnavailable: Couldn't connect to localhost:7687`
Neo4j is not running. Fix:
```powershell
# From project root
docker compose up -d neo4j
# Wait 15 seconds, then start the backend again
```

### Backend shows `Authentication failure`
Password mismatch. Make sure `backend/.env` has `NEO4J_PASSWORD=IKnowYou123` and that `docker-compose.yml` has `NEO4J_AUTH=neo4j/IKnowYou123`.

### Frontend shows "Could not load people"
The backend is not running or crashed. Check the backend terminal for errors and restart it.

### `neo4j is already running (pid:...)` in Docker logs
The container exited uncleanly. Fix:
```powershell
docker rm iknowyou-neo4j -f
docker compose up -d neo4j
```

---

## 🐳 Full Docker Stack (Alternative)

To run everything in Docker instead of locally:

```powershell
# From project root
docker compose up -d
```

Services:
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Neo4j Browser | http://localhost:7474 |

---

## ✨ Features

- **People Graph** — Add people and map their relationships visually via an interactive D3 force graph
- **Relationship Engine** — Define family, friend, and professional relationships with full Indian relation name support (Tamil & Hindi)
- **Memory Logger** — Log conversations/events in plain English; AI extracts people and relationships automatically
- **Semantic Search** — Find people and memories using natural language
- **Recent People** — Dashboard shows who you most recently added to your network

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, Tailwind CSS v4, Radix UI, D3.js |
| Backend | FastAPI, Pydantic v2, LangChain |
| Graph DB | Neo4j 5.x |
| Vector DB | ChromaDB |
| AI | Ollama (Mistral + Nomic Embeddings) |
| Status Store | SQLite |

---

## 📄 License
MIT
