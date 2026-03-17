from __future__ import annotations

import json
import os
import urllib.request
from typing import Optional

from langchain_ollama import ChatOllama

_llm: Optional[ChatOllama] = None


def get_llm() -> ChatOllama:
    """
    Returns a cached ChatOllama client.
    Model is taken from env OLLAMA_MODEL.
    """
    global _llm
    if _llm is not None:
        return _llm

    model = os.getenv("OLLAMA_MODEL")
    if not model:
        raise RuntimeError("OLLAMA_MODEL env var is required for LLM extraction")

    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    _llm = ChatOllama(
        model=model,
        temperature=0,
        base_url=base_url,
    )
    return _llm


def check_ollama_connection() -> bool:
    """
    Lightweight ping used by a /health endpoint.
    Returns True if Ollama responds, otherwise False.
    """
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    url = f"{base_url}/api/version"

    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            if resp.status != 200:
                return False
            # Ensure response is valid JSON and has a version field (best effort)
            payload = json.loads(resp.read().decode("utf-8"))
            return isinstance(payload, dict) and bool(payload.get("version"))
    except Exception:
        return False

