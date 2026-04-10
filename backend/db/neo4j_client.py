from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from neo4j import Driver, GraphDatabase


_driver: Optional[Driver] = None


def get_driver() -> Driver:
    global _driver
    if _driver is None:
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "IKnowYou123")
        _driver = GraphDatabase.driver(uri, auth=(user, password))
    return _driver


def _get_driver() -> Optional[Driver]:
    try:
        return get_driver()
    except Exception:
        return None


def close_driver() -> None:
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None


def run_query(query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    driver = get_driver()
    with driver.session() as session:
        result = session.run(query, params or {})
        return [record.data() for record in result]


def init_constraints() -> None:
    import warnings
    try:
        driver = get_driver()
        with driver.session() as session:
            session.run(
                "CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE"
            )
            session.run(
                "CREATE CONSTRAINT memory_id_unique IF NOT EXISTS FOR (m:Memory) REQUIRE m.id IS UNIQUE"
            )
    except Exception as e:
        warnings.warn(f"[neo4j_client] Could not initialise constraints — is Neo4j running? Error: {e}")


def create_memory_node(
    memory_id: str,
    raw_text: str,
    event: Optional[str],
    date_mentioned: Optional[str],
    created_at: str,
) -> bool:
    """
    Ensures a Memory node exists:
    (:Memory {id, raw_text, event, date_mentioned, created_at})
    """
    try:
        driver = get_driver()
        with driver.session() as session:
            session.run(
                """
                MERGE (m:Memory {id: $id})
                SET m.raw_text = $raw_text,
                    m.event = $event,
                    m.date_mentioned = $date_mentioned,
                    m.created_at = $created_at
                """,
                id=memory_id,
                raw_text=raw_text,
                event=event,
                date_mentioned=date_mentioned,
                created_at=created_at,
            )
        return True
    except Exception:
        return False
    finally:
        pass


def link_persons_to_memory(person_ids: List[str], memory_id: str) -> bool:
    """
    Creates relationships:
    (:Person {id})-[:MENTIONED_IN]->(:Memory {id})
    """
    try:
        driver = get_driver()
        with driver.session() as session:
            session.run(
                """
                MATCH (m:Memory {id: $memory_id})
                UNWIND $person_ids AS pid
                MATCH (p:Person {id: pid})
                MERGE (p)-[:MENTIONED_IN]->(m)
                """,
                memory_id=memory_id,
                person_ids=person_ids,
            )
        return True
    except Exception:
        return False
    finally:
        pass

