from fastapi import APIRouter
from app.utils.embeddings import embedding_service
from app.database.vector_store import vector_store
from app.database.sqlite_client import sqlite_client

router = APIRouter()

@router.get("/semantic")
async def semantic_search(q: str, k: int = 5):
    embedding = embedding_service.encode(q)
    rowids = vector_store.search(embedding, k=k)
    # TODO: Map rowids back to memory IDs and decrypt
    return {"query": q, "result_rowids": rowids}
