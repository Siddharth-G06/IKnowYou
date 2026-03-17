import pytest
import unittest.mock as mock
from services.conflict_detector import ConflictDetector, Conflict

def test_conflict_model():
    conflict = Conflict(
        person_id="123",
        person_name="Ramesh",
        existing_relation="Father's cousin",
        proposed_relation="Mother's cousin",
        conflict_type="relationship"
    )
    assert conflict.person_name == "Ramesh"
    assert conflict.proposed_relation == "Mother's cousin"

def test_check_for_conflicts_no_data():
    # Mocking vector_store.search_memories to avoid external service dependency
    # Mocking _get_driver to avoid Neo4j dependency
    with mock.patch("services.vector_store.search_memories", return_value=[]), \
         mock.patch("services.conflict_detector._get_driver", return_value=None):
        
        detector = ConflictDetector()
        conflicts = detector.check_for_conflicts("non-existent-id", "Ramesh", "Cousin")
        assert isinstance(conflicts, list)
        assert len(conflicts) == 0

def test_conflict_detection_logic():
    # Test the logic of finding contradictions in memory
    from models.memory import SearchResult
    
    mock_results = [
        SearchResult(
            memory_id="m1",
            raw_text="Met Ramesh, my dad's cousin.",
            metadata={"person_ids": ["123"]},
            similarity_score=0.9
        )
    ]
    
    with mock.patch("services.vector_store.search_memories", return_value=mock_results), \
         mock.patch("services.conflict_detector._get_driver", return_value=None):
        
        detector = ConflictDetector()
        # Proposed is 'mom's cousin'
        conflicts = detector.check_for_conflicts("123", "Ramesh", "mother's cousin")
        
        assert len(conflicts) > 0
        assert conflicts[0].source_memory_id == "m1"
