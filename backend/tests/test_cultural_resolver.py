import pytest
from app.services.cultural.indian_resolver import indian_resolver

def test_tamil_mother_resolution():
    extraction = {
        "people": [{"name": "Kavitha", "aliases": [], "role": "amma"}],
        "relationships": [],
        "facts": []
    }
    result = indian_resolver.resolve(extraction)
    assert result["people"][0]["cultural_tags"]["canonical_relationship"] == "mother"
    assert result["people"][0]["cultural_tags"]["language"] == "tamil"

def test_hindi_grandfather_resolution():
    extraction = {
        "people": [{"name": "Ramesh", "aliases": [], "role": "dada"}],
        "relationships": [],
        "facts": []
    }
    result = indian_resolver.resolve(extraction)
    person = result["people"][0]
    assert person["cultural_tags"]["canonical_relationship"] == "paternal_grandfather"
    assert person["cultural_tags"]["generation_delta"] == 2

def test_language_detection():
    text = "I spoke with mama today and maami made lunch"
    langs = indian_resolver.detect_language_hints(text)
    assert "tamil" in langs or "hindi" in langs

def test_unknown_term_passthrough():
    extraction = {
        "people": [{"name": "Raj", "aliases": [], "role": "friend"}],
        "relationships": [],
        "facts": []
    }
    result = indian_resolver.resolve(extraction)
    assert result["people"][0]["cultural_tags"] == {}
