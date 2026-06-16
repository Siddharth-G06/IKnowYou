from pydantic import BaseModel, Field
from typing import Optional
import uuid

class RelationshipCreate(BaseModel):
    from_person_id: str
    to_person_id: str
    relationship_type: str
    cultural_type: Optional[str] = None
    confidence: float = 1.0

class Relationship(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_person_id: str
    to_person_id: str
    relationship_type: str
    cultural_type: Optional[str] = None
    confidence: float = 1.0
