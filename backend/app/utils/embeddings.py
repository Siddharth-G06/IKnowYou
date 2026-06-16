from sentence_transformers import SentenceTransformer
from app.config import settings
import threading
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Lazy-loaded embedding model. Does NOT load at import time.
    Model is loaded on first encode() call and stays resident.
    Peak RAM: ~90MB for all-MiniLM-L6-v2 (384-dim).
    """
    def __init__(self):
        self._model: SentenceTransformer | None = None
        self._lock = threading.Lock()  # prevent double-load under concurrent requests

    def _load(self):
        if self._model is None:
            with self._lock:
                if self._model is None:  # double-checked locking
                    logger.info(f"[EmbeddingService] Loading model: {settings.EMBEDDING_MODEL}")
                    self._model = SentenceTransformer(
                        settings.EMBEDDING_MODEL,
                        device="cpu",          # force CPU — no CUDA assumption
                    )
                    logger.info("[EmbeddingService] Model loaded")

    def encode(self, text: str) -> list[float]:
        self._load()
        return self._model.encode(
            text,
            normalize_embeddings=True,
            show_progress_bar=False,
            batch_size=1,              # memory-safe for single encode
        ).tolist()

    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        self._load()
        return self._model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
            batch_size=8,              # small batch to cap RAM spike
        ).tolist()

    def unload(self):
        """Call this to free ~90MB if the service won't be used for a while."""
        with self._lock:
            if self._model is not None:
                del self._model
                self._model = None
                logger.info("[EmbeddingService] Model unloaded")

embedding_service = EmbeddingService()
