from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from db.neo4j_client import run_query
from models.person import PersonCreate, PersonResponse, PersonUpdate


router = APIRouter(prefix="/persons", tags=["persons"])


def _serialize_person(record: Dict[str, Any]) -> Dict[str, Any]:
    person = record.get("p") if "p" in record else record
    tags = person.get("tags") or person.get("categories") or []
    created_at = person.get("created_at") or datetime.now(timezone.utc).isoformat()
    return {
        "id": person["id"],
        "name": person["name"],
        "nickname": person.get("nickname"),
        "gender": person.get("gender"),
        "tags": tags,
        "notes": person.get("notes"),
        "created_at": created_at,
    }


@router.post("", response_model=PersonResponse)
def create_person(person: PersonCreate) -> Dict[str, Any]:
    rows = run_query(
        """
        CREATE (p:Person {
            id: $id,
            name: $name,
            nickname: $nickname,
            gender: $gender,
            tags: $tags,
            notes: $notes,
            created_at: $created_at
        })
        RETURN p
        """,
        {
            "id": str(uuid4()),
            "name": person.name,
            "nickname": person.nickname,
            "gender": person.gender,
            "tags": person.tags,
            "notes": person.notes,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    return _serialize_person(rows[0])


@router.get("", response_model=List[PersonResponse])
def list_persons() -> List[Dict[str, Any]]:
    rows = run_query("MATCH (p:Person) RETURN p ORDER BY toLower(p.name)")
    return [_serialize_person(row) for row in rows]


@router.get("/{person_id}", response_model=PersonResponse)
def get_person(person_id: str) -> Dict[str, Any]:
    rows = run_query("MATCH (p:Person {id: $id}) RETURN p", {"id": person_id})
    if not rows:
        raise HTTPException(status_code=404, detail="Person not found")
    return _serialize_person(rows[0])


@router.put("/{person_id}", response_model=PersonResponse)
def update_person(person_id: str, person: PersonUpdate) -> Dict[str, Any]:
    existing = get_person(person_id)
    rows = run_query(
        """
        MATCH (p:Person {id: $id})
        SET p.name = $name,
            p.nickname = $nickname,
            p.gender = $gender,
            p.tags = $tags,
            p.notes = $notes
        RETURN p
        """,
        {
            "id": person_id,
            "name": person.name if person.name is not None else existing["name"],
            "nickname": person.nickname if person.nickname is not None else existing.get("nickname"),
            "gender": person.gender if person.gender is not None else existing.get("gender"),
            "tags": person.tags if person.tags is not None else existing.get("tags", []),
            "notes": person.notes if person.notes is not None else existing.get("notes"),
        },
    )
    return _serialize_person(rows[0])


@router.delete("/{person_id}")
def delete_person(person_id: str) -> Dict[str, str]:
    rows = run_query(
        """
        MATCH (p:Person {id: $id})
        WITH p, count(p) AS existing
        DETACH DELETE p
        RETURN existing
        """,
        {"id": person_id},
    )
    if not rows or rows[0].get("existing", 0) == 0:
        raise HTTPException(status_code=404, detail="Person not found")
    return {"message": "Person deleted"}
