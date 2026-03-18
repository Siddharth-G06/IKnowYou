from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from neo4j import GraphDatabase
from pydantic import BaseModel

from models.memory import ExtractionResult, MemoryCreate, MemoryResponse, SearchResult
from services import llm_extraction, vector_store
from db.neo4j_client import create_memory_node, link_persons_to_memory
from db import sqlite_client
import time
from collections import defaultdict

router = APIRouter(prefix="/memories", tags=["memories"])

RATE_LIMIT_DURATION = 60
MAX_REQUESTS_PER_MINUTE = 20
_rate_limits = defaultdict(list)

def _check_rate_limit(client_id: str) -> bool:
    now = time.time()
    _rate_limits[client_id] = [t for t in _rate_limits[client_id] if now - t < RATE_LIMIT_DURATION]
    if len(_rate_limits[client_id]) >= MAX_REQUESTS_PER_MINUTE:
        return False
    _rate_limits[client_id].append(now)
    return True


class MemorySearchRequest(BaseModel):
    query: str
    limit: int = 5


def _get_db_driver():
    """Simple helper mirroring graph.get_db_driver."""
    from dotenv import load_dotenv
    import os

    load_dotenv()
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "kinledger123")
    try:
        return GraphDatabase.driver(uri, auth=(user, password))
    except Exception as e:
        print(f"Error connecting to Neo4j: {e}")
        return None


@router.post("/log", response_model=MemoryResponse)
def log_memory(body: MemoryCreate, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Maximum 20 memories per minute.")

    raw_text = (body.raw_text or "").strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="raw_text cannot be empty")
    if len(raw_text) < 10:
        raise HTTPException(status_code=400, detail="raw_text must be at least 10 characters")

    extraction: ExtractionResult = llm_extraction.extract_memory(raw_text)
    memory_uuid = uuid.uuid4()
    memory_id = str(memory_uuid)
    created_at_dt = datetime.now(timezone.utc)
    created_at_str = created_at_dt.isoformat()

    # Metadata for vector store
    metadata: Dict[str, Any] = {
        "person_ids": [],
        "event": extraction.event,
        "date_mentioned": extraction.date_mentioned,
        "created_at": created_at_str,
    }

    # Store in ChromaDB (best-effort; if it fails we still proceed but mark error)
    warnings = []
    vs_ok = vector_store.store_memory(memory_id, raw_text, metadata)
    if not vs_ok:
        print("Warning: failed to store memory in vector store")
        warnings.append("Failed to store memory in vector store")

    driver = _get_db_driver()
    if not driver:
        raise HTTPException(status_code=500, detail="Database connection failed")

    person_ids: List[str] = []
    pending_confirmations: List[Dict[str, Any]] = []
    conflicts = []

    try:
        with driver.session() as session:
            # 4. For each extracted person, match/create Person
            for person in extraction.persons:
                name = (person.name or "").strip()
                nickname = (person.nickname or "").strip()
                if not name and not nickname:
                    continue

                params = {
                    "name": name.lower() if name else None,
                    "nickname": nickname.lower() if nickname else None,
                }

                query_find = """
                MATCH (p:Person)
                WHERE (
                    ($name IS NOT NULL AND toLower(p.name) = $name)
                    OR
                    ($nickname IS NOT NULL AND p.nickname IS NOT NULL AND toLower(p.nickname) = $nickname)
                )
                RETURN p.id AS id
                LIMIT 1
                """
                result = session.run(query_find, **params)
                record = result.single()

                if record and record.get("id"):
                    person_id = record["id"]
                else:
                    person_id = str(uuid.uuid4())
                    # Create new Person node
                    occ = person.occupation or None
                    loc = person.location or None
                    notes_parts: List[str] = []
                    if occ:
                        notes_parts.append(f"Occupation: {occ}")
                    if loc:
                        notes_parts.append(f"Location: {loc}")
                    notes = "; ".join(notes_parts) if notes_parts else None

                    session.run(
                        """
                        CREATE (p:Person {
                            id: $id,
                            name: $name,
                            nickname: $nickname,
                            gender: $gender,
                            categories: $categories,
                            notes: $notes,
                            created_at: $created_at
                        })
                        """,
                        id=person_id,
                        name=name or nickname or "Unknown",
                        nickname=nickname or None,
                        gender="unknown",
                        categories=[],
                        notes=notes,
                        created_at=created_at_str,
                    )

                person_ids.append(person_id)

                # 7. Collect pending relations and check for conflicts
                if person.relation_raw:
                    # Check for conflicts
                    from services.conflict_detector import ConflictDetector
                    detector = ConflictDetector()
                    person_conflicts = detector.check_for_conflicts(person_id, name or nickname or "Unknown", person.relation_raw)
                    conflicts.extend(person_conflicts)
                    
                    confirmation_id = str(uuid.uuid4())
                    from_person_name = "You"
                    to_person_name = name or nickname or "Unknown"
                    sqlite_client.create_pending_confirmation(
                        id=confirmation_id,
                        memory_id=memory_id,
                        from_person_name=from_person_name,
                        to_person_name=to_person_name,
                        relation_raw=person.relation_raw,
                        from_person_id=None,
                        to_person_id=person_id,
                    )
                    pending_confirmations.append(
                        {
                            "id": confirmation_id,
                            "person_id": person_id,
                            "person_name": to_person_name,
                            "relation_raw": person.relation_raw,
                        }
                    )

            # Manual person links provided in request
            if body.manual_person_ids:
                for pid in body.manual_person_ids:
                    pid_str = str(pid)
                    if pid_str not in person_ids:
                        person_ids.append(pid_str)

        # 5. Create Memory node
        created = create_memory_node(
            memory_id=memory_id,
            raw_text=raw_text,
            event=extraction.event,
            date_mentioned=extraction.date_mentioned,
            created_at=created_at_str,
        )
        if not created:
            raise HTTPException(status_code=500, detail="Failed to create Memory node")

        # 6. Link persons to memory
        if person_ids:
            ok_links = link_persons_to_memory(person_ids, memory_id)
            if not ok_links:
                print("Warning: failed to link persons to memory")

    finally:
        driver.close()

    # Build MemoryResponse (extended with pending_confirmations via dict)
    base = MemoryResponse(
        id=memory_uuid,
        raw_text=raw_text,
        extraction=extraction,
        person_ids=[uuid.UUID(pid) for pid in person_ids],
        created_at=created_at_dt,
        warnings=warnings if warnings else None,
        conflicts=conflicts,
    ).model_dump()
    base["pending_confirmations"] = pending_confirmations
    return base


@router.get("", response_model=List[Dict[str, Any]])
def list_memories():
    """
    Returns all memories, newest first, including person names.
    """
    driver = _get_db_driver()
    if not driver:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with driver.session() as session:
            result = session.run(
                """
                MATCH (m:Memory)
                OPTIONAL MATCH (p:Person)-[:MENTIONED_IN]->(m)
                WITH m, collect(DISTINCT {id: p.id, name: p.name, nickname: p.nickname}) AS persons
                RETURN m.id AS id,
                       m.raw_text AS raw_text,
                       m.event AS event,
                       m.date_mentioned AS date_mentioned,
                       m.created_at AS created_at,
                       persons
                ORDER BY m.created_at DESC
                """
            )
            out: List[Dict[str, Any]] = []
            for record in result:
                out.append(
                    {
                        "id": record["id"],
                        "raw_text": record["raw_text"],
                        "event": record["event"],
                        "date_mentioned": record["date_mentioned"],
                        "created_at": record["created_at"],
                        "persons": record["persons"],
                    }
                )
        return out
    finally:
        driver.close()


@router.get("/stats", response_model=Dict[str, Any])
def memory_stats_inline():
    """
    Alias that keeps /stats before /{memory_id} for correct FastAPI routing.
    Delegates to the real implementation below.
    """
    return memory_stats()


@router.get("/{memory_id}", response_model=Dict[str, Any])
def get_memory(memory_id: str):
    """
    Returns a single memory with full extraction data (recomputed from raw_text).
    """
    driver = _get_db_driver()
    if not driver:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with driver.session() as session:
            rec = session.run(
                """
                MATCH (m:Memory {id: $id})
                OPTIONAL MATCH (p:Person)-[:MENTIONED_IN]->(m)
                WITH m, collect(DISTINCT {id: p.id, name: p.name, nickname: p.nickname}) AS persons
                RETURN m.raw_text AS raw_text,
                       m.event AS event,
                       m.date_mentioned AS date_mentioned,
                       m.created_at AS created_at,
                       persons
                """,
                id=memory_id,
            ).single()

            if not rec:
                raise HTTPException(status_code=404, detail="Memory not found")

            raw_text = rec["raw_text"]
            extraction = llm_extraction.extract_memory(raw_text)

            return {
                "id": memory_id,
                "raw_text": raw_text,
                "event": rec["event"],
                "date_mentioned": rec["date_mentioned"],
                "created_at": rec["created_at"],
                "persons": rec["persons"],
                "extraction": extraction.model_dump(),
            }
    finally:
        driver.close()


@router.delete("/{memory_id}")
def delete_memory(memory_id: str):
    """
    Deletes memory from ChromaDB and Neo4j.
    """
    # Delete from vector store (best effort)
    vector_store.delete_memory(memory_id)

    driver = _get_db_driver()
    if not driver:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with driver.session() as session:
            result = session.run(
                """
                MATCH (m:Memory {id: $id})
                DETACH DELETE m
                RETURN count(m) AS deleted_count
                """,
                id=memory_id,
            ).single()
            if not result or result["deleted_count"] == 0:
                raise HTTPException(status_code=404, detail="Memory not found")
    finally:
        driver.close()

    return {"message": "Memory deleted"}


@router.post("/search", response_model=List[Dict[str, Any]])
def search_memories_endpoint(body: MemorySearchRequest):
    results: List[SearchResult] = vector_store.search_memories(
        body.query, n_results=body.limit
    )

    if not results:
        return []

    driver = _get_db_driver()
    if not driver:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with driver.session() as session:
            enriched: List[Dict[str, Any]] = []
            for r in results:
                rec = session.run(
                    """
                    MATCH (m:Memory {id: $id})
                    OPTIONAL MATCH (p:Person)-[:MENTIONED_IN]->(m)
                    WITH m, collect(DISTINCT {id: p.id, name: p.name, nickname: p.nickname}) AS persons
                    RETURN persons
                    """,
                    id=r.memory_id,
                ).single()
                persons = rec["persons"] if rec else []
                enriched.append(
                    {
                        "memory_id": r.memory_id,
                        "raw_text": r.raw_text,
                        "metadata": r.metadata,
                        "similarity_score": r.similarity_score,
                        "persons": persons,
                    }
                )
        return enriched
    finally:
        driver.close()


@router.get("/stats/_impl", response_model=Dict[str, Any], include_in_schema=False)
def memory_stats():
    driver = _get_db_driver()
    if not driver:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with driver.session() as session:
            # total_memories
            rec_mem = session.run(
                "MATCH (m:Memory) RETURN count(m) AS c"
            ).single()
            total_memories = rec_mem["c"] if rec_mem else 0

            # total_persons_mentioned (distinct persons that appear in at least one memory)
            rec_persons = session.run(
                """
                MATCH (p:Person)-[:MENTIONED_IN]->(:Memory)
                RETURN count(DISTINCT p) AS c
                """
            ).single()
            total_persons_mentioned = rec_persons["c"] if rec_persons else 0

            # most_active_event
            rec_event = session.run(
                """
                MATCH (m:Memory)
                WHERE m.event IS NOT NULL
                RETURN m.event AS event, count(*) AS c
                ORDER BY c DESC
                LIMIT 1
                """
            ).single()
            most_active_event = rec_event["event"] if rec_event else None

        return {
            "total_memories": total_memories,
            "total_persons_mentioned": total_persons_mentioned,
            "most_active_event": most_active_event,
        }
    finally:
        driver.close()

