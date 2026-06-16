from typing import Optional

# Indian relationship term → normalized type mapping
# Format: {term: (canonical_type, direction, language)}
INDIAN_RELATIONSHIP_VOCAB = {
    # Tamil
    "amma": ("mother", "parent", "tamil"),
    "appa": ("father", "parent", "tamil"),
    "anna": ("elder_brother", "sibling", "tamil"),
    "akka": ("elder_sister", "sibling", "tamil"),
    "thambi": ("younger_brother", "sibling", "tamil"),
    "thangachi": ("younger_sister", "sibling", "tamil"),
    "thatha": ("grandfather", "grandparent", "tamil"),
    "paati": ("grandmother", "grandparent", "tamil"),
    "periappa": ("father's_elder_brother", "extended", "tamil"),
    "chithappa": ("father's_younger_brother", "extended", "tamil"),
    "athai": ("father's_sister", "extended", "tamil"),
    "mama": ("mother's_brother", "extended", "tamil"),
    "maami": ("mama's_wife", "extended", "tamil"),
    "chithi": ("mother's_younger_sister", "extended", "tamil"),
    "periyamma": ("mother's_elder_sister", "extended", "tamil"),

    # Hindi
    "maa": ("mother", "parent", "hindi"),
    "pitaji": ("father", "parent", "hindi"),
    "bhaiya": ("elder_brother", "sibling", "hindi"),
    "didi": ("elder_sister", "sibling", "hindi"),
    "bhai": ("brother", "sibling", "hindi"),
    "behan": ("sister", "sibling", "hindi"),
    "dada": ("paternal_grandfather", "grandparent", "hindi"),
    "dadi": ("paternal_grandmother", "grandparent", "hindi"),
    "nana": ("maternal_grandfather", "grandparent", "hindi"),
    "nani": ("maternal_grandmother", "grandparent", "hindi"),
    "chacha": ("father's_younger_brother", "extended", "hindi"),
    "chachi": ("chacha's_wife", "extended", "hindi"),
    "tau": ("father's_elder_brother", "extended", "hindi"),
    "tayi": ("tau's_wife", "extended", "hindi"),
    "mama": ("mother's_brother", "extended", "hindi"),
    "maami": ("mama's_wife", "extended", "hindi"),
    "mausi": ("mother's_sister", "extended", "hindi"),
    "phuphi": ("father's_sister", "extended", "hindi"),

    # Common cross-language
    "bhabhi": ("brother's_wife", "extended", "common"),
    "jiju": ("sister's_husband", "extended", "common"),
    "saali": ("wife's_younger_sister", "extended", "common"),
    "sala": ("wife's_brother", "extended", "common"),
}

GENERATION_MAP = {
    "grandparent": 2,
    "parent": 1,
    "sibling": 0,
    "extended": 0,
    "child": -1,
    "grandchild": -2,
}

class IndianRelationshipResolver:
    def resolve(self, extraction: dict) -> dict:
        """
        Takes raw extraction output and enriches it with Indian cultural context.
        """
        enriched_people = []
        for person in extraction.get("people", []):
            enriched = self._enrich_person(person, extraction.get("facts", []))
            enriched_people.append(enriched)

        enriched_relationships = []
        for rel in extraction.get("relationships", []):
            enriched_rel = self._resolve_relationship(rel)
            enriched_relationships.append(enriched_rel)

        return {
            **extraction,
            "people": enriched_people,
            "relationships": enriched_relationships
        }

    def _enrich_person(self, person: dict, facts: list) -> dict:
        cultural_tags = {}
        role = person.get("role", "").lower()
        term_match = INDIAN_RELATIONSHIP_VOCAB.get(role)
        if term_match:
            canonical, direction, language = term_match
            cultural_tags = {
                "canonical_relationship": canonical,
                "direction": direction,
                "language": language,
                "generation_delta": GENERATION_MAP.get(direction, 0)
            }
        return {**person, "cultural_tags": cultural_tags}

    def _resolve_relationship(self, rel: dict) -> dict:
        rel_type = rel.get("type", "").lower()
        term_match = INDIAN_RELATIONSHIP_VOCAB.get(rel_type)
        if term_match:
            canonical, direction, language = term_match
            return {
                **rel,
                "type": canonical.upper(),
                "cultural_type": rel_type,
                "language": language,
                "direction": direction
            }
        return rel

    def detect_language_hints(self, text: str) -> list[str]:
        text_lower = text.lower()
        detected = set()
        for term, (_, _, lang) in INDIAN_RELATIONSHIP_VOCAB.items():
            if f" {term} " in f" {text_lower} " or f" {term}," in text_lower:
                detected.add(lang)
        return list(detected)

indian_resolver = IndianRelationshipResolver()
