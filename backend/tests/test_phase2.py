import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import uuid
from main import app

client = TestClient(app)

@patch("routes.memory._get_db_driver")
@patch("routes.memory.vector_store.store_memory")
@patch("routes.memory.sqlite_client.create_pending_confirmation")
@patch("routes.memory.create_memory_node")
@patch("routes.memory.link_persons_to_memory")
def test_phase2_endpoints(mock_link, mock_create_node, mock_sqlite, mock_vs, mock_neo4j_driver):
    # Setup mocks
    mock_vs.return_value = True
    mock_create_node.return_value = True
    mock_link.return_value = True
    
    mock_session = MagicMock()
    mock_neo4j_driver.return_value.session.return_value.__enter__.return_value = mock_session
    # Mock some basic returns for Neo4j
    mock_session.run.return_value.single.return_value = None # Assume no person found
    
    # 1. POST /memories/log with sample text
    sample_text = "Met Ramesh uncle at Rohit's wedding. He's dad's cousin. Works in Dubai logistics."
    response = client.post(
        "/memories/log",
        json={"raw_text": sample_text}
    )
    assert response.status_code == 200, f"Logging memory failed: {response.text}"
    data = response.json()
    
    # Verify extraction part
    assert "extraction" in data
    assert "extraction_success" in data["extraction"] # Fallback might have set this to False, which is fine
    
    # 2. POST /memories/search with "uncle Dubai"
    with patch("routes.memory.vector_store.search_memories") as mock_search:
        mock_search.return_value = [
            MagicMock(memory_id=str(uuid.uuid4()), raw_text=sample_text, metadata={}, similarity_score=0.9)
        ]
        search_resp = client.post(
            "/memories/search",
            json={"query": "uncle Dubai", "limit": 5}
        )
        assert search_resp.status_code == 200, f"Memory search failed: {search_resp.text}"
        search_data = search_resp.json()
        assert isinstance(search_data, list)
        assert len(search_data) > 0
    
    # 3. GET /confirmations/pending
    with patch("routes.confirmations.sqlite_client.get_pending_confirmations") as mock_get_conf:
        mock_get_conf.return_value = [
            {"id": "123", "to_person_name": "Ramesh", "relation_raw": "uncle"}
        ]
        conf_resp = client.get("/confirmations/pending")
        assert conf_resp.status_code == 200, f"Pending confirmations failed: {conf_resp.text}"
        conf_data = conf_resp.json()
        assert isinstance(conf_data, list)
        assert len(conf_data) > 0
        assert any(c["to_person_name"] == "Ramesh" for c in conf_data)
