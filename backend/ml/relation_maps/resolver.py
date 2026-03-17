import json
import os
from typing import List, Dict, Optional, Any
from pydantic import BaseModel

class RelationResult(BaseModel):
    path_key: str
    english: str
    tamil: Optional[str] = None
    tamil_script: Optional[str] = None
    hindi: Optional[str] = None
    hindi_script: Optional[str] = None
    note: Optional[str] = None
    found_in_map: bool = False

class RelationResolver:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.tamil_map = self._load_map("tamil.json")
        self.hindi_map = self._load_map("hindi.json")

    def _load_map(self, filename: str) -> Dict[str, Any]:
        path = os.path.join(self.base_dir, filename)
        try:
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            return {}
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return {}

    def path_to_key(self, path: List[Dict[str, Any]]) -> str:
        """
        Convert Neo4j path result to a dot-notation key.
        Normalizes relationship types by replacing underscores with dots and handling aliases.
        """
        parts = []
        aliases = {
            "mom": "mother",
            "dad": "father"
        }
        for segment in path:
            if "relation_type" in segment:
                # Normalize: brother_elder -> brother.elder, DAD_S_COUSIN -> dad.s.cousin
                rel = segment["relation_type"].lower().strip().replace("_", ".")
                # Handle aliases
                for alias, canonical in aliases.items():
                    if rel == alias or rel.startswith(alias + "."):
                        rel = rel.replace(alias, canonical, 1)
                parts.append(rel)
            if "age_relative" in segment and segment["age_relative"]:
                parts.append(segment["age_relative"].lower().strip())
        
        # Clean up double dots if any
        key = ".".join(parts).replace("..", ".")
        return key

    def describe_path_english(self, path: List[Dict[str, Any]]) -> str:
        """
        Fallback: convert path to readable English.
        """
        if not path:
            return "Self"
            
        parts = []
        for segment in path:
            rel_raw = segment.get("relation_type", "relative").lower().replace("_", " ")
            # Normalize to canonical for description
            rel = rel_raw
            if "mom" in rel: rel = rel.replace("mom", "mother")
            if "dad" in rel: rel = rel.replace("dad", "father")

            age = segment.get("age_relative")
            if age:
                parts.append(f"{age.lower()} {rel}")
            else:
                parts.append(rel)
            
        if len(parts) == 1:
            return f"Your {parts[0]}"
            
        description = "Your "
        for i, p in enumerate(parts):
            description += p
            if i < len(parts) - 1:
                description += "'s "
        
        return description

    def resolve(self, path: List[Dict[str, Any]], language: str = "both") -> RelationResult:
        """
        Look up the path key in mapping files.
        Returns RelationResult with english, tamil, hindi names.
        """
        path_key = self.path_to_key(path)
        
        tamil_data = self.tamil_map.get(path_key)
        hindi_data = self.hindi_map.get(path_key)
        
        english_name = self.describe_path_english(path)
        if tamil_data and "english" in tamil_data:
            english_name = tamil_data["english"]
        elif hindi_data and "english" in hindi_data:
            english_name = hindi_data["english"]
            
        found = bool(tamil_data or hindi_data)
        
        res = RelationResult(
            path_key=path_key,
            english=english_name,
            found_in_map=found
        )
        
        if tamil_data:
            res.tamil = tamil_data.get("tamil_transliteration")
            res.tamil_script = tamil_data.get("tamil")
            res.note = tamil_data.get("note")
            
        if hindi_data:
            res.hindi = hindi_data.get("hindi_transliteration")
            res.hindi_script = hindi_data.get("hindi")
            if not res.note:
                res.note = hindi_data.get("note")
            elif hindi_data.get("note"):
                res.note += " | " + hindi_data.get("note")
                
        return res

    def get_all_names(self, path_key: str) -> dict:
        """Returns {english, tamil, tamil_script, hindi, hindi_script, note}"""
        tamil_data = self.tamil_map.get(path_key, {})
        hindi_data = self.hindi_map.get(path_key, {})
        
        return {
            "english": tamil_data.get("english") or hindi_data.get("english") or path_key.replace(".", "'s "),
            "tamil": tamil_data.get("tamil_transliteration"),
            "tamil_script": tamil_data.get("tamil"),
            "hindi": hindi_data.get("hindi_transliteration"),
            "hindi_script": hindi_data.get("hindi"),
            "note": tamil_data.get("note") or hindi_data.get("note")
        }

# Singleton instance for easy import
resolver = RelationResolver()
