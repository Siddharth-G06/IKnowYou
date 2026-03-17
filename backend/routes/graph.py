from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from db import sqlite_client
from db.neo4j_client import run_query
from services.relation_resolver import resolver


router = APIRouter(prefix="/graph", tags=["graph"])


def _resolve_ids(
    from_id: Optional[str],
    to_id: Optional[str],
    from_alias: Optional[str],
    to_alias: Optional[str],
) -> tuple[str, str]:
    source = from_id or from_alias
    target = to_id or to_alias
    if not source or not target:
        raise HTTPException(status_code=400, detail="Both from and to person ids are required")
    return source, target


@router.get("/full")
def get_full_graph() -> Dict[str, List[Dict[str, Any]]]:
    node_rows = run_query(
        """
        MATCH (p:Person)
        RETURN p.id AS id,
               p.name AS name,
               p.gender AS gender,
               coalesce(p.tags, p.categories, []) AS tags,
               p.notes AS notes
        ORDER BY toLower(p.name)
        """
    )
    link_rows = run_query(
        """
        MATCH (a:Person)-[r:RELATED_TO]->(b:Person)
        RETURN a.id AS source,
               b.id AS target,
               r.relation_type AS relation,
               r.relation_label AS relation_label,
               r.id AS id
        """
    )
    nodes = [
        {
            "id": row["id"],
            "name": row["name"],
            "gender": row.get("gender"),
            "tags": row.get("tags", []),
            "categories": row.get("tags", []),
            "notes": row.get("notes"),
        }
        for row in node_rows
    ]
    return {"nodes": nodes, "links": link_rows}


@router.get("/path")
def get_relation_path(
    from_id: Optional[str] = Query(default=None),
    to_id: Optional[str] = Query(default=None),
    from_alias: Optional[str] = Query(default=None, alias="from"),
    to_alias: Optional[str] = Query(default=None, alias="to"),
) -> Dict[str, Any]:
    source, target = _resolve_ids(from_id, to_id, from_alias, to_alias)
    rows = run_query(
        """
        MATCH (a:Person {id: $from_id}), (b:Person {id: $to_id})
        MATCH p = shortestPath((a)-[:RELATED_TO*]-(b))
        RETURN [node IN nodes(p) | node.id] AS node_ids,
               [node IN nodes(p) | node.name] AS node_names,
               [rel IN relationships(p) | rel.relation_type] AS path
        """,
        {"from_id": source, "to_id": target},
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No path found between these persons")
    row = rows[0]
    return {
        "path": row.get("path", []),
        "node_ids": row.get("node_ids", []),
        "node_names": row.get("node_names", []),
        "relation_name": resolver.resolve(row.get("path", [])).get("english"),
    }


@router.get("/relation-name")
def get_relation_name(
    from_id: Optional[str] = Query(default=None),
    to_id: Optional[str] = Query(default=None),
    from_alias: Optional[str] = Query(default=None, alias="from"),
    to_alias: Optional[str] = Query(default=None, alias="to"),
) -> Dict[str, Any]:
    source, target = _resolve_ids(from_id, to_id, from_alias, to_alias)
    rows = run_query(
        """
        MATCH (a:Person {id: $from_id}), (b:Person {id: $to_id})
        MATCH p = shortestPath((a)-[:RELATED_TO*]-(b))
        RETURN [rel IN relationships(p) | rel.relation_type] AS path
        """,
        {"from_id": source, "to_id": target},
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No path found between these persons")
    return resolver.resolve(rows[0].get("path", []))


@router.get("/stats")
def graph_stats() -> Dict[str, Any]:
    total_persons = run_query("MATCH (p:Person) RETURN count(p) AS c")[0]["c"]
    total_relationships = run_query("MATCH ()-[r:RELATED_TO]->() RETURN count(r) AS c")[0]["c"]
    total_memories = run_query("MATCH (m:Memory) RETURN count(m) AS c")[0]["c"]
    recent_rows = run_query(
        """
        MATCH (p:Person)
        WHERE p.created_at IS NOT NULL
        RETURN p.id AS id, p.name AS name, p.created_at AS created_at
        ORDER BY p.created_at DESC
        LIMIT 3
        """
    )
    return {
        "total_persons": total_persons,
        "total_relationships": total_relationships,
        "total_memories": total_memories,
        "pending_confirmations": len(sqlite_client.get_pending_confirmations(status="pending")),
        "recent_persons": recent_rows,
    }
