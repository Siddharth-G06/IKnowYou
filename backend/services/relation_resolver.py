from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, List


class RelationResolver:
    def __init__(self) -> None:
        data_dir = Path(__file__).resolve().parent.parent / "data" / "relation_maps"
        self.tamil_map = self._load_map(data_dir / "tamil.json")
        self.hindi_map = self._load_map(data_dir / "hindi.json")

    @staticmethod
    def _load_map(path: Path) -> dict:
        if not path.exists():
            return {}
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    @staticmethod
    def _normalize_path(path: Iterable[str]) -> str:
        return ".".join(part.strip().lower() for part in path if part and part.strip())

    def resolve(self, relation_path: List[str]) -> dict:
        key = self._normalize_path(relation_path)
        tamil_entry = self.tamil_map.get(key, {})
        hindi_entry = self.hindi_map.get(key, {})
        english = tamil_entry.get("english") or hindi_entry.get("english") or self._fallback_english(relation_path)
        note_parts = [part for part in [tamil_entry.get("note"), hindi_entry.get("note")] if part]
        return {
            "path": relation_path,
            "relation": english,
            "english": english,
            "tamil": tamil_entry.get("name"),
            "hindi": hindi_entry.get("name"),
            "note": " | ".join(note_parts) if note_parts else None,
        }

    @staticmethod
    def _fallback_english(relation_path: List[str]) -> str:
        if not relation_path:
            return "Self"
        cleaned = [part.replace("_", " ").title() for part in relation_path]
        if len(cleaned) == 1:
            return cleaned[0]
        return "'s ".join(cleaned)


resolver = RelationResolver()
