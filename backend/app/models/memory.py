from pydantic import BaseModel, Field
from typing import Optional
import uuid

class MemoryCreate(BaseModel):
    content: str
    person_ids: list[str] = []
    source: str = "text"

class Memory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    person_ids: list[str] = []
    source: str = "text"
