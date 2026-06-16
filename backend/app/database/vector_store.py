import sqlite3
import numpy as np
from app.config import settings
from pathlib import Path
import json

# SQLite-VSS setup
# Requires sqlite-vss package: pip install sqlite-vss

class VectorStore:
    def __init__(self):
        self.db_path = settings.SQLITE_PATH
        self.dim = settings.EMBEDDING_DIM

    def _get_conn(self):
        import sqlite_vss
        conn = sqlite3.connect(self.db_path)
        sqlite_vss.load(conn)
        return conn

    def initialize(self):
        conn = self._get_conn()
        conn.execute(f"""
            CREATE VIRTUAL TABLE IF NOT EXISTS memory_vectors
            USING vss0(embedding({self.dim}))
        """)
        conn.commit()
        conn.close()

    def insert_vector(self, rowid: int, embedding: list[float]):
        conn = self._get_conn()
        conn.execute(
            "INSERT INTO memory_vectors(rowid, embedding) VALUES (?, ?)",
            (rowid, json.dumps(embedding))
        )
        conn.commit()
        conn.close()

    def search(self, query_embedding: list[float], k: int = 5) -> list[int]:
        conn = self._get_conn()
        cursor = conn.execute(
            """
            SELECT rowid, distance
            FROM memory_vectors
            WHERE vss_search(embedding, ?)
            LIMIT ?
            """,
            (json.dumps(query_embedding), k)
        )
        results = cursor.fetchall()
        conn.close()
        return [row[0] for row in results]

vector_store = VectorStore()
