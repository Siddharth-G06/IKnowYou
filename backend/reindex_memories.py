"""Re-index all memories from Neo4j into ChromaDB using local SentenceTransformer embedder."""
import sys
import os

sys.path.insert(0, ".")
from dotenv import load_dotenv
load_dotenv()

from db.neo4j_client import run_query
from services import vector_store

rows = run_query(
    """
    MATCH (m:Memory)
    RETURN m.id AS id, m.raw_text AS raw_text,
           m.event AS event, m.date_mentioned AS date_mentioned,
           m.created_at AS created_at
    """
)

print(f"Found {len(rows)} memories to re-index")
for row in rows:
    mid = row["id"]
    text = row["raw_text"]
    metadata = {
        "event": row.get("event") or "",
        "date_mentioned": row.get("date_mentioned") or "",
        "created_at": row.get("created_at") or "",
        "person_ids": [],
    }
    ok = vector_store.store_memory(mid, text, metadata)
    status = "OK" if ok else "FAIL"
    print(f"  [{status}] {mid}: {text[:70]}")

print()
print("ChromaDB count after re-index:", vector_store.get_memory_count())
print()
print("Testing search: 'coffee shop'")
results = vector_store.search_memories("coffee shop", 5)
for r in results:
    print(f"  score={r.similarity_score:.3f}  text={r.raw_text[:70]}")

print()
print("Testing search: 'Who did I meet last week'")
results2 = vector_store.search_memories("Who did I meet last week", 5)
for r in results2:
    print(f"  score={r.similarity_score:.3f}  text={r.raw_text[:70]}")
