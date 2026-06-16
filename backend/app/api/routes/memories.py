from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.memory import MemoryCreate
from app.services.memory_service import memory_service
from app.services.stt.whisper_service import whisper_service
from app.database.sqlite_client import sqlite_client

router = APIRouter()

@router.post("/")
async def log_memory(memory: MemoryCreate):
    result = await memory_service.process_and_store(memory.content, source=memory.source)
    return result

@router.post("/voice")
async def log_voice_memory(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    text = await whisper_service.transcribe(audio_bytes)
    result = await memory_service.process_and_store(text, source="voice")
    return {"transcribed": text, **result}

@router.get("/recent")
async def get_recent_memories(limit: int = 20):
    return await sqlite_client.get_recent_memories(limit=limit)
