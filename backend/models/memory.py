from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PersonMention(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    relation_raw: Optional[str] = None
    occupation: Optional[str] = None
    location: Optional[str] = None


class Conflict(BaseModel):
    person_id: str
    person_name: str
    existing_relation: str
    proposed_relation: str
    source_memory_id: Optional[str] = None
    conflict_type: str = "relationship"  # relationship, occupation, location
    memory_snippet: Optional[str] = None


class ExtractionResult(BaseModel):
    persons: List[PersonMention] = Field(default_factory=list)
    event: Optional[str] = None
    date_mentioned: Optional[str] = None
    notes: Optional[str] = None

    raw_text: str
    extraction_success: bool


class MemoryCreate(BaseModel):
    raw_text: str
    manual_person_ids: Optional[List[UUID]] = None


class MemoryResponse(BaseModel):
    id: UUID
    raw_text: str
    extraction: ExtractionResult
    person_ids: List[UUID] = Field(default_factory=list)
    created_at: datetime
    warnings: Optional[List[str]] = None
    conflicts: List[Conflict] = Field(default_factory=list)
    # Extended at runtime with pending_confirmations in memory routes


class SearchResult(BaseModel):
    memory_id: str
    raw_text: str
    metadata: dict
    similarity_score: float

