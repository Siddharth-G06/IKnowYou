import pytest
from ml.relation_maps.resolver import RelationResolver

@pytest.fixture
def resolver():
    return RelationResolver()

def test_path_to_key(resolver):
    path = [
        {"relation_type": "father", "direction": "outgoing"},
        {"relation_type": "brother", "direction": "outgoing"},
        {"age_relative": "elder"}
    ]
    assert resolver.path_to_key(path) == "father.brother.elder"

def test_resolve_exact_match(resolver):
    path = [
        {"relation_type": "father", "direction": "outgoing"},
        {"relation_type": "brother", "direction": "outgoing"},
        {"age_relative": "elder"}
    ]
    result = resolver.resolve(path)
    assert result.english == "Father's Elder Brother"
    assert result.tamil_script == "பெரியப்பா"
    assert result.hindi_script == "ताऊजी"
    assert result.found_in_map is True

def test_resolve_fallback(resolver):
    path = [
        {"relation_type": "father", "direction": "outgoing"},
        {"relation_type": "mother", "direction": "outgoing"},
        {"relation_type": "brother", "direction": "outgoing"}
    ]
    result = resolver.resolve(path)
    assert result.english == "Your father's mother's brother"
    assert result.found_in_map is False

def test_get_all_names(resolver):
    names = resolver.get_all_names("father.sister")
    assert names["tamil"] == "Athai"
    assert names["hindi"] == "Bua"
