import whisper
import tempfile
import os
import threading
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class WhisperService:
    """
    Lazy-loaded Whisper model. Does NOT load at import time.
    Default model: tiny (~250MB RAM). Loads on first transcribe() call.
    Model is UNLOADED after transcription to free RAM immediately —
    STT is a sporadic operation, not a hot path.
    """
    def __init__(self):
        self._model = None
        self._lock = threading.Lock()

    def _load(self):
        # Always acquire lock before checking — Whisper load is not thread-safe
        with self._lock:
            if self._model is None:
                logger.info(f"[WhisperService] Loading model: {settings.WHISPER_MODEL}")
                self._model = whisper.load_model(settings.WHISPER_MODEL, device="cpu")
                logger.info(f"[WhisperService] Model loaded ({settings.WHISPER_MODEL})")

    def _unload(self):
        with self._lock:
            if self._model is not None:
                del self._model
                self._model = None
                logger.info("[WhisperService] Model unloaded after transcription")

    async def transcribe(self, audio_bytes: bytes, language: str = "en") -> str:
        self._load()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name
        try:
            result = self._model.transcribe(
                tmp_path,
                language=language,
                fp16=False,        # fp16 unsupported on CPU; avoid warning
                verbose=False,
            )
            return result["text"].strip()
        finally:
            os.unlink(tmp_path)
            self._unload()  # free ~250MB immediately after use

    async def transcribe_multilingual(self, audio_bytes: bytes) -> dict:
        """Auto-detect language — useful for Hinglish or Tamil-English code-switching."""
        self._load()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name
        try:
            result = self._model.transcribe(
                tmp_path,
                fp16=False,
                verbose=False,
            )
            return {
                "text": result["text"].strip(),
                "language": result.get("language", "unknown")
            }
        finally:
            os.unlink(tmp_path)
            self._unload()

whisper_service = WhisperService()
