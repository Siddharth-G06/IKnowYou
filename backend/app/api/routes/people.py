from fastapi import APIRouter
from app.database.neo4j_client import neo4j_client
from app.database.sqlite_client import sqlite_client

router = APIRouter()

@router.get("/")
async def list_people():
    async with sqlite_client.db_path as db:
        pass  # implement
    return []

@router.get("/{person_id}/network")
async def get_network(person_id: str, depth: int = 2):
    return await neo4j_client.get_person_network(person_id, depth=depth)

@router.get("/search")
async def search_people(q: str):
    return await neo4j_client.search_people(q)
