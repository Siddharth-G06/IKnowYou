import sqlite3
import aiosqlite
from app.config import settings
import json
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS people (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    aliases TEXT DEFAULT '[]',
    cultural_tags TEXT DEFAULT '{}',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    content_encrypted TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    person_ids TEXT DEFAULT '[]',
    source TEXT DEFAULT 'text',
    created_at INTEGER DEFAULT (unixepoch()),
    embedding_id TEXT
);

CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    from_person_id TEXT NOT NULL,
    to_person_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    cultural_type TEXT,
    confidence REAL DEFAULT 1.0,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY(from_person_id) REFERENCES people(id),
    FOREIGN KEY(to_person_id) REFERENCES people(id)
);

CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
CREATE INDEX IF NOT EXISTS idx_relationships_from ON relationships(from_person_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON relationships(to_person_id);
"""

class SQLiteClient:
    def __init__(self):
        self.db_path = settings.SQLITE_PATH

    async def initialize(self):
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        async with aiosqlite.connect(self.db_path) as db:
            await db.executescript(SCHEMA)
            await db.commit()

    async def insert_person(self, person_id: str, name: str, aliases: list, cultural_tags: dict):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT OR REPLACE INTO people (id, name, aliases, cultural_tags)
                VALUES (?, ?, ?, ?)
                """,
                (person_id, name, json.dumps(aliases), json.dumps(cultural_tags))
            )
            await db.commit()

    async def insert_memory(self, memory_id: str, content_encrypted: str, content_hash: str,
                             person_ids: list, source: str = "text"):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO memories (id, content_encrypted, content_hash, person_ids, source)
                VALUES (?, ?, ?, ?, ?)
                """,
                (memory_id, content_encrypted, content_hash, json.dumps(person_ids), source)
            )
            await db.commit()

    async def get_recent_memories(self, limit: int = 20):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM memories ORDER BY created_at DESC LIMIT ?", (limit,)
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

sqlite_client = SQLiteClient()
