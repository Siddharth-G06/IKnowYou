import sqlite3
import numpy as np
from app.config import settings
from pathlib import Path
import json

class VectorStore:
    def __init__(self):
        self.db_path = settings.SQLITE_PATH
        self.dim = settings.EMBEDDING_DIM

    def _get_conn(self):
        return sqlite3.connect(self.db_path)

    def initialize(self):
        conn = self._get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS memory_vectors (
                rowid INTEGER PRIMARY KEY,
                embedding TEXT
            )
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
        cursor = conn.execute("SELECT rowid, embedding FROM memory_vectors")
        results = cursor.fetchall()
        conn.close()

        if not results:
            return []

        # Python-based cosine similarity since sqlite-vss is unavailable
        q_vec = np.array(query_embedding)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []

        distances = []
        for rowid, emb_str in results:
            emb = np.array(json.loads(emb_str))
            emb_norm = np.linalg.norm(emb)
            if emb_norm == 0:
                continue
            sim = np.dot(q_vec, emb) / (q_norm * emb_norm)
            distances.append((rowid, -sim)) # Sort by max similarity (min negative sim)

        distances.sort(key=lambda x: x[1])
        return [rowid for rowid, _ in distances[:k]]

vector_store = VectorStore()
