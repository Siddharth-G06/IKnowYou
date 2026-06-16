from pydantic import BaseModel, Field
from typing import Optional
import uuid

class PersonCreate(BaseModel):
    name: str
    aliases: list[str] = []
    cultural_tags: dict = {}

class Person(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    aliases: list[str] = []
    cultural_tags: dict = {}
