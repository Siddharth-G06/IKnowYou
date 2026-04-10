from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from db import sqlite_client
from db.neo4j_client import get_driver
from services.relation_resolver import resolver
from services.conflict_detector import Conflict

router = APIRouter(prefix="/corrections", tags=["corrections"])

def _sanitize_relation_type(rel_type: str) -> str:
    """
    Restrict relation_type to a safe label for Cypher relationship types.
    """
    import re
    cleaned = re.sub(r"[^A-Za-z0-9_]", "_", rel_type.strip().replace(".", "_"))
    if not cleaned:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid relation_type")
    return cleaned.upper()

class RelationshipCorrectionRequest(BaseModel):
    person_id: str
    old_relation_type: str
    new_from_person_id: str
    new_relation_type: str
    reason: Optional[str] = None



@router.post("/relationship")
def preview_relationship_correction(req: RelationshipCorrectionRequest):
    driver = get_driver()

    current_description = "Unknown relation"
    affected_paths = []

    with driver.session() as session:
        # 1. Find existing relationship info
        find_query = """
        MATCH (target:Person {id: $person_id})
        MATCH (source:Person)-[r]->(target)
        RETURN source.id AS source_id, source.name AS source_name, type(r) AS rel_type
        """
        res = session.run(find_query, person_id=req.person_id)
        record = res.single()
        if record:
            current_description = f"{req.person_id} is currently {record['rel_type']} of {record['source_name']}"

        # 2. Find affected paths (persons who relate through this person)
        affected_query = """
        MATCH (target:Person {id: $person_id})
        MATCH (target)-[r*1..3]->(affected:Person)
        RETURN DISTINCT affected.name AS name
        """
        aff_res = session.run(affected_query, person_id=req.person_id)
        affected_paths = [r["name"] for r in aff_res]

    # Store as pending
    corr_id = str(uuid.uuid4())
    sanitized_rel = _sanitize_relation_type(req.new_relation_type)
    sqlite_client.create_pending_correction(
        id=corr_id,
        person_id=req.person_id,
        old_relation_type=req.old_relation_type,
        new_from_person_id=req.new_from_person_id,
        new_relation_type=sanitized_rel,
        reason=req.reason,
        status="preview"
    )

    return {
        "id": corr_id,
        "current": current_description,
        "proposed": f"Set relationship to {req.new_relation_type} from person {req.new_from_person_id}",
        "affected_paths": affected_paths
    }

@router.post("/{id}/apply")
def apply_correction(id: str):
    corr = sqlite_client.get_correction_by_id(id)
    if not corr:
        raise HTTPException(status_code=404, detail="Correction not found")

    if corr["status"] != "preview":
        raise HTTPException(status_code=400, detail="Correction already applied or cancelled")

    driver = get_driver()
    try:
        with driver.session() as session:
            # 1. Delete old relationships to this person
            delete_query = """
            MATCH (p:Person {id: $person_id})
            MATCH (source:Person)-[r]->(p)
            DELETE r
            """
            session.run(delete_query, person_id=corr["person_id"])

            # 2. Create new relationship
            create_query = f"""
            MATCH (a:Person {{id: $from_id}}), (b:Person {{id: $to_id}})
            CREATE (a)-[r:{corr['new_relation_type']}]->(b)
            RETURN r
            """
            session.run(create_query, from_id=corr["new_from_person_id"], to_id=corr["person_id"])

            # 3. Add a correction note to related Memory nodes
            update_memory_query = """
            MATCH (p:Person {id: $person_id})-[:MENTIONED_IN]->(m:Memory)
            SET m.notes = COALESCE(m.notes, '') + '\n[Correction Applied: ' + $reason + ']'
            """
            session.run(update_memory_query, person_id=corr["person_id"], reason=corr["reason"] or "Relationship updated")

            # 4. Mark as applied
            sqlite_client.update_correction_status(id, "applied")

        return {"message": "Correction applied successfully", "person_id": corr["person_id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/cancel")
def cancel_correction(id: str):
    corr = sqlite_client.get_correction_by_id(id)
    if not corr:
        raise HTTPException(status_code=404, detail="Correction not found")
    
    sqlite_client.update_correction_status(id, "cancelled")
    return {"message": "Correction cancelled"}

@router.get("/history")
def get_correction_history():
    return sqlite_client.get_pending_corrections()
