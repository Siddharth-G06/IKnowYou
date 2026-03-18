from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


PersonGender = Literal["male", "female", "other"]
PersonTag = Literal["family", "friend", "professional", "colleague"]


class PersonCreate(BaseModel):
    name: str = Field(min_length=1)
    nickname: Optional[str] = None
    gender: Optional[PersonGender] = None
    tags: List[PersonTag] = Field(default_factory=list)
    notes: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("name cannot be empty")
        return stripped


class PersonUpdate(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    gender: Optional[PersonGender] = None
    tags: Optional[List[PersonTag]] = None
    notes: Optional[str] = None


class PersonResponse(BaseModel):
    id: str
    name: str
    nickname: Optional[str] = None
    gender: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    created_at: datetime

