from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.api.models.Collection import Collection

from models.memory import SearchResult

_client: Optional[chromadb.PersistentClient] = None
_collection: Optional[Collection] = None
_embedder = None  # SentenceTransformer instance


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


def _get_embedder():
    """
    Returns a local SentenceTransformer embedder (all-MiniLM-L6-v2).
    This works completely offline — no Ollama required.
    """
    global _embedder
    if _embedder is not None:
        return _embedder

    try:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
        print("VectorStore: using local SentenceTransformer (all-MiniLM-L6-v2)")
    except Exception as e:
        raise RuntimeError(f"Failed to load SentenceTransformer: {e}") from e

    return _embedder


def _embed(texts: List[str]) -> List[List[float]]:
    """Embed a list of texts and return list of float vectors."""
    model = _get_embedder()
    embeddings = model.encode(texts, convert_to_numpy=True)
    return [emb.tolist() for emb in embeddings]


def _get_collection() -> Collection:
    global _collection
    if _collection is not None:
        return _collection

    client = _get_client()
    # NOTE: Do NOT pass embedding_function here — we generate embeddings
    # explicitly via _embed() and pass them in every upsert/query call.
    _collection = client.get_or_create_collection(
        name="kinledger_memories",
    )
    return _collection


def _reset_collection() -> Collection:
    """Delete and recreate the collection to recover from a corrupt HNSW index."""
    global _collection
    client = _get_client()
    try:
        client.delete_collection("kinledger_memories")
        print("Warning: deleted corrupt ChromaDB collection, starting fresh.")
    except Exception:
        pass
    _collection = client.get_or_create_collection(
        name="kinledger_memories",
    )
    return _collection


def _sanitize_metadata(metadata: dict) -> dict:
    """
    ChromaDB only accepts scalar values (str, int, float, bool) in metadata.
    Convert lists and None values to safe scalar types.
    """
    clean: dict = {}
    for k, v in metadata.items():
        if v is None:
            clean[k] = ""
        elif isinstance(v, list):
            clean[k] = ",".join(str(x) for x in v)
        elif isinstance(v, (str, int, float, bool)):
            clean[k] = v
        else:
            clean[k] = str(v)
    return clean


def store_memory(memory_id: str, raw_text: str, metadata: dict) -> bool:
    """
    Stores a memory in ChromaDB using a local sentence-transformers embedding.
    metadata is expected to contain: {person_ids, event, date_mentioned, created_at}
    """
    try:
        collection = _get_collection()
        embedding = _embed([raw_text])[0]

        collection.upsert(
            ids=[memory_id],
            documents=[raw_text],
            metadatas=[_sanitize_metadata(metadata)],
            embeddings=[embedding],
        )
        return True
    except Exception:
        import traceback
        traceback.print_exc()
        return False


def search_memories(query: str, n_results: int = 5) -> List[SearchResult]:
    """
    Searches ChromaDB for memories semantically similar to `query`.
    Handles corrupt HNSW index by resetting the collection and returning empty results.
    """
    for attempt in range(2):
        try:
            collection = _get_collection()

            # Guard: querying an empty collection crashes ChromaDB's HNSW reader
            count = 0
            try:
                count = collection.count()
            except Exception:
                pass
            if count == 0:
                return []

            query_embedding = _embed([query])[0]

            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=min(n_results, count),
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

        except Exception as e:
            err_str = str(e)
            is_corrupt = "Nothing found on disk" in err_str or "hnsw" in err_str.lower()
            if attempt == 0 and is_corrupt:
                print(f"Warning: ChromaDB HNSW index corrupt, resetting. Detail: {err_str}")
                _reset_collection()
                continue  # retry once with fresh collection
            import traceback
            traceback.print_exc()
            return []

    return []


def delete_memory(memory_id: str) -> bool:
    try:
        collection = _get_collection()
        collection.delete(ids=[memory_id])
        return True
    except Exception:
        return False


def get_memory_count() -> int:
    try:
        collection = _get_collection()
        return int(collection.count())
    except Exception:
        try:
            items = _get_collection().get(include=[])
            ids = items.get("ids") or []
            return int(len(ids))
        except Exception:
            return 0
