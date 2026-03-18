from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class RelationshipCreate(BaseModel):
    from_person_id: str = Field(min_length=1)
    to_person_id: str = Field(min_length=1)
    relation_type: str = Field(min_length=1)
    relation_label: Optional[str] = None


class RelationshipResponse(BaseModel):
    id: str
    from_person_id: str
    to_person_id: str
    relation_type: str
    relation_label: Optional[str] = None
    from_person_name: Optional[str] = None
    to_person_name: Optional[str] = None
