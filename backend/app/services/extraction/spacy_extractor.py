import spacy
from typing import Optional
import threading
import logging

logger = logging.getLogger(__name__)

RELATIONSHIP_KEYWORDS = {
    "mother", "father", "brother", "sister", "wife", "husband",
    "friend", "colleague", "boss", "manager", "uncle", "aunt",
    "grandfather", "grandmother", "son", "daughter", "cousin",
    # Indian relationship terms
    "mama", "maami", "chacha", "chachi", "nana", "nani",
    "dada", "dadi", "bhai", "didi", "anna", "akka",
    "thatha", "paati", "periappa", "chithappa", "athai"
}

class SpacyExtractor:
    """
    Lazy-loaded spaCy model. Does NOT load at import time.
    Model (en_core_web_sm) loads on first extract() call.
    Peak RAM: ~50MB. Stays resident once loaded.
    """
    def __init__(self):
        self._nlp: Optional[spacy.Language] = None
        self._lock = threading.Lock()
        self._unavailable = False  # set True if model missing, avoids retry spam

    def _load(self):
        if self._nlp is None and not self._unavailable:
            with self._lock:
                if self._nlp is None and not self._unavailable:
                    try:
                        logger.info("[SpacyExtractor] Loading en_core_web_sm")
                        self._nlp = spacy.load("en_core_web_sm", disable=["parser", "lemmatizer"])
                        logger.info("[SpacyExtractor] Model loaded")
                    except OSError:
                        self._unavailable = True
                        logger.warning(
                            "[SpacyExtractor] en_core_web_sm not found. "
                            "Run: python -m spacy download en_core_web_sm"
                        )

    def is_available(self) -> bool:
        self._load()
        return self._nlp is not None

    def extract(self, text: str) -> dict:
        self._load()
        if self._nlp is None:
            return {"people": [], "relationships": [], "facts": []}

        doc = self._nlp(text)
        people = []
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                people.append({"name": ent.text, "aliases": [], "role": ""})

        relationships = []
        text_lower = text.lower()
        for keyword in RELATIONSHIP_KEYWORDS:
            if keyword in text_lower:
                relationships.append({
                    "from": "user",
                    "to": "unknown",
                    "type": keyword,
                    "description": f"mentioned '{keyword}' in context"
                })

        return {
            "people": people,
            "relationships": relationships,
            "facts": []
        }

    def unload(self):
        """Free ~50MB if spaCy won't be needed again soon."""
        with self._lock:
            if self._nlp is not None:
                del self._nlp
                self._nlp = None
                self._unavailable = False
                logger.info("[SpacyExtractor] Model unloaded")

spacy_extractor = SpacyExtractor()
