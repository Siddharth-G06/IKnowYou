from app.services.extraction.ollama_extractor import ollama_extractor
from app.services.extraction.spacy_extractor import spacy_extractor
from app.services.extraction.rule_extractor import rule_extractor
from app.services.cultural.indian_resolver import indian_resolver
from app.services.encryption.aes_gcm import encrypt_text
from app.utils.embeddings import embedding_service
from app.database.neo4j_client import neo4j_client
from app.database.sqlite_client import sqlite_client
from app.database.vector_store import vector_store
from app.models.memory import Memory
import hashlib, uuid, logging

logger = logging.getLogger(__name__)

class MemoryService:
    async def process_and_store(self, text: str, source: str = "text") -> dict:
        # 1. Extract
        extraction = await self._extract(text)

        # 2. Cultural resolution
        resolved = indian_resolver.resolve(extraction)

        # 3. Encrypt content
        content_encrypted = encrypt_text(text)
        content_hash = hashlib.sha256(text.encode()).hexdigest()
        memory_id = str(uuid.uuid4())

        # 4. Store in SQLite
        person_ids = []
        for person in resolved.get("people", []):
            pid = str(uuid.uuid4())
            person_ids.append(pid)
            await sqlite_client.insert_person(
                pid, person["name"], person.get("aliases", []),
                person.get("cultural_tags", {})
            )
            await neo4j_client.upsert_person(pid, person["name"], person)

        await sqlite_client.insert_memory(memory_id, content_encrypted, content_hash, person_ids, source)

        # 5. Store relationships in Neo4j
        for rel in resolved.get("relationships", []):
            if rel.get("from") and rel.get("to") and len(person_ids) >= 2:
                await neo4j_client.upsert_relationship(
                    person_ids[0], person_ids[1], rel["type"].upper().replace(" ", "_")
                )

        # 6. Embed and store vector
        embedding = embedding_service.encode(text)
        vector_store.insert_vector(hash(memory_id) % (2**31), embedding)

        return {"memory_id": memory_id, "people_extracted": len(person_ids), "extraction": resolved}

    async def _extract(self, text: str) -> dict:
        if await ollama_extractor.is_available():
            logger.info("Using Ollama extractor")
            return await ollama_extractor.extract(text)
        logger.info("Ollama unavailable, using spaCy")
        result = spacy_extractor.extract(text)
        if result["people"]:
            return result
        logger.info("Falling back to rule extractor")
        return rule_extractor.extract(text)

memory_service = MemoryService()
