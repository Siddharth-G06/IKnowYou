from neo4j import AsyncGraphDatabase
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self._driver = None

    async def connect(self):
        self._driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )
        await self._create_constraints()
        logger.info("Neo4j connected")

    async def close(self):
        if self._driver:
            await self._driver.close()

    async def _create_constraints(self):
        async with self._driver.session() as session:
            await session.run(
                "CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE"
            )
            await session.run(
                "CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name)"
            )

    async def upsert_person(self, person_id: str, name: str, metadata: dict):
        async with self._driver.session() as session:
            await session.run(
                """
                MERGE (p:Person {id: $id})
                SET p.name = $name, p.metadata = $metadata, p.updated_at = timestamp()
                """,
                id=person_id, name=name, metadata=str(metadata)
            )

    async def upsert_relationship(
        self, from_id: str, to_id: str, rel_type: str, properties: dict = {}
    ):
        async with self._driver.session() as session:
            await session.run(
                f"""
                MATCH (a:Person {{id: $from_id}}), (b:Person {{id: $to_id}})
                MERGE (a)-[r:{rel_type}]->(b)
                SET r += $properties
                """,
                from_id=from_id, to_id=to_id, properties=properties
            )

    async def get_person_network(self, person_id: str, depth: int = 2):
        async with self._driver.session() as session:
            result = await session.run(
                """
                MATCH path = (p:Person {id: $id})-[*1..$depth]-(connected)
                RETURN path
                """,
                id=person_id, depth=depth
            )
            return await result.data()

    async def search_people(self, name_query: str):
        async with self._driver.session() as session:
            result = await session.run(
                """
                MATCH (p:Person)
                WHERE toLower(p.name) CONTAINS toLower($query)
                RETURN p.id as id, p.name as name
                LIMIT 10
                """,
                query=name_query
            )
            return await result.data()

neo4j_client = Neo4jClient()
