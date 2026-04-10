from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from db.neo4j_client import _get_driver
from services import vector_store

from models.memory import Conflict

class ConflictDetector:
    def __init__(self):
        pass

    def check_for_conflicts(self, person_id: str, person_name: str, proposed_relation: str) -> List[Conflict]:
        """
        Before writing a new relationship, check for contradictions.
        """
        conflicts = []
        
        # 1. Check Neo4j for existing relationship
        existing = self._get_existing_relation_neo4j(person_id)
        if existing and existing.lower() != proposed_relation.lower():
            conflicts.append(Conflict(
                person_id=person_id,
                person_name=person_name,
                existing_relation=existing,
                proposed_relation=proposed_relation,
                conflict_type="relationship"
            ))
            
        # 2. Search ChromaDB for contradicting memories
        contradicting_memories = self.find_contradicting_memories(person_id, person_name, proposed_relation)
        for mem in contradicting_memories:
            conflicts.append(Conflict(
                person_id=person_id,
                person_name=person_name,
                existing_relation="Unknown (based on memory)",
                proposed_relation=proposed_relation,
                source_memory_id=mem["memory_id"],
                conflict_type="relationship",
                memory_snippet=mem["snippet"]
            ))
            
        return conflicts

    def _get_existing_relation_neo4j(self, person_id: str) -> Optional[str]:
        """
        Finds the current relation from the root user to this person.
        """
        driver = _get_driver()
        if not driver:
            return None
            
        try:
            with driver.session() as session:
                query = """
                MATCH (me:Person) WHERE me.name IN ['You', 'you', 'Me', 'me', 'root']
                MATCH p=shortestPath((me)-[*]-(target:Person {id: $person_id}))
                RETURN [r IN relationships(p) | type(r)] AS path,
                       [r IN relationships(p) | r.age_relative] AS ages
                """
                result = session.run(query, person_id=person_id)
                record = result.single()
                if record and record["path"]:
                    path_parts = []
                    for i, rel_type in enumerate(record["path"]):
                        age = record["ages"][i]
                        if age:
                            path_parts.append(f"{rel_type}({age})")
                        else:
                            path_parts.append(rel_type)
                    return " -> ".join(path_parts)
            return None
        except Exception:
            return None
        # Note: do NOT close the driver here — it is the shared singleton from
        # db.neo4j_client and must remain open for the lifetime of the process.

    def find_contradicting_memories(self, person_id: str, person_name: str, proposed_relation: str) -> List[Dict[str, Any]]:
        """
        Search ChromaDB for memories mentioning this person with different relation context.
        """
        # Search query: "PersonName relation"
        query = f"{person_name}"
        try:
            search_results = vector_store.search_memories(query, n_results=10)
        except Exception:
            # If embeddings/vector search is unavailable, skip contradiction checks.
            return []
        
        contradictions = []
        
        # Keywords that indicate a relationship
        relation_keywords = ["father", "mother", "uncle", "aunt", "cousin", "brother", "sister", "dad", "mom"]
        proposed_norm = proposed_relation.lower()
        
        for res in search_results:
            # If the person_id is in metadata
            if person_id in res.metadata.get("person_ids", []):
                text = res.raw_text.lower()
                
                # Check if text contains ANY relation keyword that is NOT the proposed one
                found_rels = [kw for kw in relation_keywords if kw in text]
                
                # If we find a relation keyword that contradicts the category of the proposed one
                # e.g. proposed is 'mom', found 'dad'
                is_contradiction = False
                if "mom" in proposed_norm or "mother" in proposed_norm:
                    if "dad" in found_rels or "father" in found_rels:
                        is_contradiction = True
                elif "dad" in proposed_norm or "father" in proposed_norm:
                    if "mom" in found_rels or "mother" in found_rels:
                        is_contradiction = True
                
                # Broad check: if it mentions a different specific relation word
                if found_rels and not any(kw in proposed_norm for kw in found_rels):
                    # Higher similarity score means it's more likely a real mention
                    if res.similarity_score > 0.6:
                        is_contradiction = True
                
                if is_contradiction:
                    contradictions.append({
                        "memory_id": res.memory_id,
                        "snippet": res.raw_text[:200] + "..."
                    })
                        
        return contradictions
