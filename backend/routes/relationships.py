from __future__ import annotations

from typing import Any, Dict, List
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from db.neo4j_client import run_query
from models.relationship import RelationshipCreate, RelationshipResponse


router = APIRouter(prefix="/relationships", tags=["relationships"])


def _serialize_relationship(record: Dict[str, Any]) -> Dict[str, Any]:
    relation = record.get("r") if "r" in record else record
    return {
        "id": relation["id"],
        "from_person_id": record.get("from_person_id") or relation.get("from_person_id"),
        "to_person_id": record.get("to_person_id") or relation.get("to_person_id"),
        "relation_type": relation.get("relation_type"),
        "relation_label": relation.get("relation_label"),
        "from_person_name": record.get("from_person_name"),
        "to_person_name": record.get("to_person_name"),
    }


@router.post("", response_model=RelationshipResponse)
def create_relationship(relationship: RelationshipCreate) -> Dict[str, Any]:
    rows = run_query(
        """
        MATCH (from:Person {id: $from_person_id}), (to:Person {id: $to_person_id})
        CREATE (from)-[r:RELATED_TO {
            id: $id,
            relation_type: $relation_type,
            relation_label: $relation_label,
            from_person_id: $from_person_id,
            to_person_id: $to_person_id
        }]->(to)
        RETURN r,
               from.name AS from_person_name,
               to.name AS to_person_name,
               from.id AS from_person_id,
               to.id AS to_person_id
        """,
        {
            "id": str(uuid4()),
            "from_person_id": relationship.from_person_id,
            "to_person_id": relationship.to_person_id,
            "relation_type": relationship.relation_type.lower().strip(),
            "relation_label": relationship.relation_label,
        },
    )
    if not rows:
        raise HTTPException(status_code=404, detail="One or both persons were not found")
    return _serialize_relationship(rows[0])


@router.get("", response_model=List[RelationshipResponse])
def list_relationships() -> List[Dict[str, Any]]:
    rows = run_query(
        """
        MATCH (from:Person)-[r:RELATED_TO]->(to:Person)
        RETURN r,
               from.name AS from_person_name,
               to.name AS to_person_name,
               from.id AS from_person_id,
               to.id AS to_person_id
        ORDER BY from_person_name, to_person_name
        """
    )
    return [_serialize_relationship(row) for row in rows]


@router.delete("/{relationship_id}")
def delete_relationship(relationship_id: str) -> Dict[str, str]:
    rows = run_query(
        """
        MATCH ()-[r:RELATED_TO {id: $id}]->()
        WITH r, count(r) AS existing
        DELETE r
        RETURN existing
        """,
        {"id": relationship_id},
    )
    if not rows or rows[0].get("existing", 0) == 0:
        raise HTTPException(status_code=404, detail="Relationship not found")
    return {"message": "Relationship deleted"}
