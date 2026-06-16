import pytest
from app.services.memory_service import memory_service

def test_memory_service_stub():
    assert memory_service is not None
