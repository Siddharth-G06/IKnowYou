"""
Re-indexes all existing Neo4j Memory nodes into ChromaDB.
Run this once after a ChromaDB reset:
    .\\venv\\Scripts\\python reindex_memories.py
"""
from dotenv import load_dotenv
load_dotenv()

from db.neo4j_client import run_query
from services.vector_store import store_memory, get_memory_count

print("ChromaDB count before:", get_memory_count())

rows = run_query(
    """
    MATCH (m:Memory)
    RETURN m.id AS id,
           m.raw_text AS raw_text,
           m.event AS event,
           m.date_mentioned AS date_mentioned,
           m.created_at AS created_at
    ORDER BY m.created_at ASC
    """
)

print(f"Found {len(rows)} memories in Neo4j to re-index...")

success = 0
failed = 0
for row in rows:
    memory_id = row["id"]
    raw_text = row.get("raw_text") or ""
    if not raw_text.strip():
        print(f"  Skipping {memory_id} — empty raw_text")
        failed += 1
        continue

    metadata = {
        "event": row.get("event") or "",
        "date_mentioned": row.get("date_mentioned") or "",
        "created_at": row.get("created_at") or "",
        "person_ids": "",  # already sanitized as scalar
    }

    ok = store_memory(memory_id, raw_text, metadata)
    if ok:
        print(f"  ✓ Indexed: {raw_text[:60]}")
        success += 1
    else:
        print(f"  ✗ Failed:  {raw_text[:60]}")
        failed += 1

print(f"\nDone. {success} indexed, {failed} failed.")
print("ChromaDB count after:", get_memory_count())
