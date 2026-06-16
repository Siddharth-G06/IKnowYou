import httpx
import json
from app.config import settings
import logging

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """
Extract people, relationships, and key facts from the following text.
Return ONLY valid JSON in this exact format:
{
  "people": [{"name": "...", "aliases": [], "role": "..."}],
  "relationships": [{"from": "...", "to": "...", "type": "...", "description": "..."}],
  "facts": ["..."]
}
Do not include any text outside the JSON.

Text: {text}
"""

class OllamaExtractor:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False

    async def extract(self, text: str) -> dict:
        prompt = EXTRACTION_PROMPT.format(text=text)
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            result = response.json()
            raw = result.get("response", "{}")
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                logger.warning("Ollama returned invalid JSON, falling back")
                return {"people": [], "relationships": [], "facts": []}

ollama_extractor = OllamaExtractor()
