from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.api.models.Collection import Collection
from chromadb.utils.embedding_functions import OllamaEmbeddingFunction

from models.memory import SearchResult

_client: Optional[chromadb.PersistentClient] = None
_collection: Optional[Collection] = None
_embedder: Optional[OllamaEmbeddingFunction] = None


def _get_client() -> chromadb.PersistentClient:
    global _client
    if _client is not None:
        return _client

    persist_dir = os.getenv("CHROMA_PERSIST_DIR")
    if not persist_dir:
        raise RuntimeError("CHROMA_PERSIST_DIR env var is required for vector store")
    os.makedirs(persist_dir, exist_ok=True)

    _client = chromadb.PersistentClient(path=persist_dir)
    return _client


def _get_embedder() -> OllamaEmbeddingFunction:
    global _embedder
    if _embedder is not None:
        return _embedder

    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    _embedder = OllamaEmbeddingFunction(
        url=base_url,
        model_name="nomic-embed-text",
    )
    return _embedder


def _get_collection() -> Collection:
    global _collection
    if _collection is not None:
        return _collection

    client = _get_client()
    embedder = _get_embedder()

    _collection = client.get_or_create_collection(
        name="kinledger_memories",
        embedding_function=embedder,
    )
    return _collection


def store_memory(memory_id: str, raw_text: str, metadata: dict) -> bool:
    """
    Stores a memory in ChromaDB using an Ollama embedding (nomic-embed-text).
    metadata is expected to contain: {person_ids, event, date_mentioned, created_at}
    """
    try:
        collection = _get_collection()
        embedder = _get_embedder()

        # Explicitly generate embeddings (even though collection has embedding_function)
        embedding = embedder([raw_text])[0]

        collection.upsert(
            ids=[memory_id],
            documents=[raw_text],
            metadatas=[metadata],
            embeddings=[embedding],
        )
        return True
    except Exception:
        return False


def search_memories(query: str, n_results: int = 5) -> List[SearchResult]:
    collection = _get_collection()
    embedder = _get_embedder()

    query_embedding = embedder([query])[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )

    ids = (results.get("ids") or [[]])[0]
    docs = (results.get("documents") or [[]])[0]
    metas = (results.get("metadatas") or [[]])[0]
    dists = (results.get("distances") or [[]])[0]

    out: List[SearchResult] = []
    for i in range(min(len(ids), len(docs), len(metas), len(dists))):
        dist = float(dists[i])
        similarity = 1.0 / (1.0 + dist)  # monotonic transform; higher is better
        out.append(
            SearchResult(
                memory_id=str(ids[i]),
                raw_text=str(docs[i]),
                metadata=metas[i] if isinstance(metas[i], dict) else {},
                similarity_score=float(similarity),
            )
        )
    return out


def delete_memory(memory_id: str) -> bool:
    try:
        collection = _get_collection()
        collection.delete(ids=[memory_id])
        return True
    except Exception:
        return False


def get_memory_count() -> int:
    collection = _get_collection()
    try:
        return int(collection.count())
    except Exception:
        # older chromadb versions may not support count on collection
        try:
            items = collection.get(include=[])
            ids = items.get("ids") or []
            return int(len(ids))
        except Exception:
            return 0

