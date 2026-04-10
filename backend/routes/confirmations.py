from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db import sqlite_client
from db.neo4j_client import get_driver


router = APIRouter(prefix="/confirmations", tags=["confirmations"])


class ConfirmRequest(BaseModel):
    from_person_id: str
    to_person_id: str
    relation_type: str
    relation_label: Optional[str] = None




def _sanitize_relation_type(rel_type: str) -> str:
    """
    Restrict relation_type to a safe label for Cypher relationship types.
    """
    cleaned = re.sub(r"[^A-Za-z0-9_]", "_", rel_type.strip())
    if not cleaned:
        raise HTTPException(status_code=400, detail="Invalid relation_type")
    return cleaned.upper()


@router.get("/pending", response_model=List[Dict[str, Any]])
def list_pending_confirmations():
    """
    Returns all pending confirmations.
    Person names are already stored in the row; IDs (if present) indicate resolved persons.
    """
    rows = sqlite_client.get_pending_confirmations(status="pending")
    return rows


@router.post("/{conf_id}/confirm", response_model=Dict[str, Any])
def confirm_relationship(conf_id: str, body: ConfirmRequest):
    row = sqlite_client.get_confirmation_by_id(conf_id)
    if not row or row.get("status") != "pending":
        raise HTTPException(status_code=404, detail="Pending confirmation not found")

    rel_type = _sanitize_relation_type(body.relation_type)
    from_id = body.from_person_id
    to_id = body.to_person_id

    driver = get_driver()

    with driver.session() as session:
        query = f"""
        MATCH (a:Person {{id: $from_id}}), (b:Person {{id: $to_id}})
        CREATE (a)-[r:{rel_type} {{label: $label}}]->(b)
        RETURN type(r) AS type, a.id AS from_id, b.id AS to_id, r.label AS label
        """
        rec = session.run(
            query,
            from_id=from_id,
            to_id=to_id,
            label=body.relation_label or row.get("relation_raw"),
        ).single()

        if not rec:
            raise HTTPException(status_code=500, detail="Failed to create relationship")

    # Update confirmation status in SQLite
    sqlite_client.update_confirmation_status(
        conf_id,
        status="confirmed",
        from_person_id=from_id,
        to_person_id=to_id,
    )

    return {
        "confirmation_id": conf_id,
        "relationship": {
            "type": rec["type"],
            "from_id": rec["from_id"],
            "to_id": rec["to_id"],
            "label": rec["label"],
        },
    }


@router.post("/{conf_id}/reject", response_model=Dict[str, Any])
def reject_relationship(conf_id: str):
    row = sqlite_client.get_confirmation_by_id(conf_id)
    if not row or row.get("status") != "pending":
        raise HTTPException(status_code=404, detail="Pending confirmation not found")

    sqlite_client.update_confirmation_status(conf_id, status="rejected")
    return {"confirmation_id": conf_id, "status": "rejected"}

