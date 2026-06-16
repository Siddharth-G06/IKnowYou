import re
from typing import Optional

# Minimal rule-based fallback for <2GB RAM devices
PERSON_PATTERNS = [
    r"\b([A-Z][a-z]+ (?:[A-Z][a-z]+ )?[A-Z][a-z]+)\b",  # Full names
    r"\bmy (\w+(?:'s)?)\b",  # "my [relationship]"
]

RELATIONSHIP_MAP = {
    r"my (?:older |younger )?brother": "SIBLING",
    r"my (?:older |younger )?sister": "SIBLING",
    r"my (?:mom|mother|amma|amma)": "PARENT",
    r"my (?:dad|father|appa|anna)": "PARENT",
    r"my (?:friend|buddy|pal)": "FRIEND",
    r"my (?:colleague|coworker|teammate)": "COLLEAGUE",
    r"my (?:boss|manager|lead)": "MANAGER",
    r"my (?:wife|husband|spouse|partner)": "SPOUSE",
}

class RuleExtractor:
    def extract(self, text: str) -> dict:
        people = []
        for pattern in PERSON_PATTERNS:
            matches = re.findall(pattern, text)
            for match in matches:
                people.append({"name": match, "aliases": [], "role": ""})

        relationships = []
        text_lower = text.lower()
        for pattern, rel_type in RELATIONSHIP_MAP.items():
            if re.search(pattern, text_lower):
                relationships.append({
                    "from": "user",
                    "to": "inferred",
                    "type": rel_type,
                    "description": f"rule match: {pattern}"
                })

        return {
            "people": list({p["name"]: p for p in people}.values()),
            "relationships": relationships,
            "facts": []
        }

rule_extractor = RuleExtractor()
