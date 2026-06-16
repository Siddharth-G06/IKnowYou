from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database.neo4j_client import neo4j_client
from app.database.sqlite_client import sqlite_client
from app.database.vector_store import vector_store
from app.api.routes import memories, people, relationships, search
import logging

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await sqlite_client.initialize()
    vector_store.initialize()
    await neo4j_client.connect()
    yield
    # Shutdown
    await neo4j_client.close()

app = FastAPI(title="IKnowYou API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(memories.router, prefix="/api/memories", tags=["memories"])
app.include_router(people.router, prefix="/api/people", tags=["people"])
app.include_router(relationships.router, prefix="/api/relationships", tags=["relationships"])
app.include_router(search.router, prefix="/api/search", tags=["search"])

@app.get("/health")
async def health():
    return {"status": "ok"}
