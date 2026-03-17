from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes import confirmations, corrections, graph, memory, persons, relationships
from services.llm_client import check_ollama_connection
from services import vector_store
from db.sqlite_client import init_db
from db.neo4j_client import close_driver, get_driver, init_constraints
import os
from datetime import datetime, timezone

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    init_db()
    init_constraints()
    yield
    # Shutdown logic (optional)
    close_driver()

app = FastAPI(title="IKnowYou API", lifespan=lifespan)

cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env.strip():
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph.router)
app.include_router(persons.router)
app.include_router(relationships.router)
app.include_router(memory.router)
app.include_router(confirmations.router)
app.include_router(corrections.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to IKnowYou API"}


@app.get("/health")
def health():
    # Neo4j
    neo4j_ok = False
    try:
        driver = get_driver()
        with driver.session() as session:
            _ = session.run("RETURN 1 AS ok").single()
        neo4j_ok = True
    except Exception:
        neo4j_ok = False

    # Ollama
    ollama_ok = check_ollama_connection()

    # Chroma
    try:
        _ = vector_store.get_memory_count()
        chroma_ok = True
    except Exception:
        chroma_ok = False

    status = "healthy" if (neo4j_ok and ollama_ok and chroma_ok) else "degraded"

    return {
        "status": status,
        "neo4j": neo4j_ok,
        "ollama": ollama_ok,
        "chroma": chroma_ok,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
