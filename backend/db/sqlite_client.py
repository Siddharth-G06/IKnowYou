from __future__ import annotations

import os
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional


DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "sqlite", "kinledger.db")


def _get_conn() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if they do not exist."""
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS pending_confirmations (
                id TEXT PRIMARY KEY,
                memory_id TEXT NOT NULL,
                from_person_name TEXT,
                to_person_name TEXT,
                relation_raw TEXT NOT NULL,
                from_person_id TEXT,
                to_person_id TEXT,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS pending_corrections (
                id TEXT PRIMARY KEY,
                person_id TEXT NOT NULL,
                old_relation_type TEXT NOT NULL,
                new_from_person_id TEXT NOT NULL,
                new_relation_type TEXT NOT NULL,
                reason TEXT,
                status TEXT NOT NULL, -- preview, applied, cancelled
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def create_pending_confirmation(
    *,
    id: str,
    memory_id: str,
    from_person_name: Optional[str],
    to_person_name: Optional[str],
    relation_raw: str,
    from_person_id: Optional[str],
    to_person_id: Optional[str],
    status: str = "pending",
    created_at: Optional[str] = None,
) -> None:
    if created_at is None:
        created_at = datetime.utcnow().isoformat()

    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO pending_confirmations (
                id, memory_id, from_person_name, to_person_name,
                relation_raw, from_person_id, to_person_id, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                id,
                memory_id,
                from_person_name,
                to_person_name,
                relation_raw,
                from_person_id,
                to_person_id,
                status,
                created_at,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def get_pending_confirmations(status: str = "pending") -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, memory_id, from_person_name, to_person_name,
                   relation_raw, from_person_id, to_person_id, status, created_at
            FROM pending_confirmations
            WHERE status = ?
            ORDER BY created_at DESC
            """,
            (status,),
        )
        rows = cur.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_confirmation_by_id(conf_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, memory_id, from_person_name, to_person_name,
                   relation_raw, from_person_id, to_person_id, status, created_at
            FROM pending_confirmations
            WHERE id = ?
            """,
            (conf_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def update_confirmation_status(
    conf_id: str,
    *,
    status: str,
    from_person_id: Optional[str] = None,
    to_person_id: Optional[str] = None,
) -> None:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE pending_confirmations
            SET status = ?,
                from_person_id = COALESCE(?, from_person_id),
                to_person_id = COALESCE(?, to_person_id)
            WHERE id = ?
            """,
            (status, from_person_id, to_person_id, conf_id),
        )
        conn.commit()
    finally:
        conn.close()

def create_pending_correction(
    *,
    id: str,
    person_id: str,
    old_relation_type: str,
    new_from_person_id: str,
    new_relation_type: str,
    reason: Optional[str] = None,
    status: str = "preview",
) -> None:
    created_at = datetime.utcnow().isoformat()
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO pending_corrections (
                id, person_id, old_relation_type, new_from_person_id,
                new_relation_type, reason, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                id,
                person_id,
                old_relation_type,
                new_from_person_id,
                new_relation_type,
                reason,
                status,
                created_at,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def get_pending_corrections(status: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        if status:
            cur.execute(
                "SELECT * FROM pending_corrections WHERE status = ? ORDER BY created_at DESC",
                (status,),
            )
        else:
            cur.execute("SELECT * FROM pending_corrections ORDER BY created_at DESC")
        rows = cur.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_correction_by_id(corr_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM pending_corrections WHERE id = ?", (corr_id,))
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def update_correction_status(corr_id: str, status: str) -> None:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE pending_corrections SET status = ? WHERE id = ?",
            (status, corr_id),
        )
        conn.commit()
    finally:
        conn.close()
