from __future__ import annotations

import json
from typing import Any, Dict, Optional

from langchain_core.messages import HumanMessage, SystemMessage

from models.memory import ExtractionResult
from services.llm_client import get_llm


SYSTEM_PROMPT = """You are a structured data extractor for a personal memory app. 
Extract information from the user's memory log and return ONLY valid JSON.
No explanation, no markdown, no backticks. Just raw JSON.

Extract these fields:
- persons: list of {name, nickname, relation_raw, occupation, location}
- event: string or null (wedding, birthday, conference, etc.)
- date_mentioned: string or null (any date reference)
- notes: any additional context not captured above

If a field is not mentioned, use null.
For persons array, include every person mentioned.

Example input: "Met Ramesh uncle at Rohit's wedding. He's dad's cousin. Works in Dubai logistics."
Example output:
{
  "persons": [
    {
      "name": "Ramesh",
      "nickname": "uncle",
      "relation_raw": "dad's cousin",
      "occupation": "Dubai logistics",
      "location": "Dubai"
    }
  ],
  "event": "Rohit's wedding",
  "date_mentioned": null,
  "notes": null
}"""


def _coerce_payload(payload: Dict[str, Any], raw_text: str) -> ExtractionResult:
    persons = payload.get("persons")
    if persons is None:
        persons_list = []
    elif isinstance(persons, list):
        persons_list = persons
    else:
        persons_list = []

    normalized: Dict[str, Any] = {
        "persons": persons_list,
        "event": payload.get("event", None),
        "date_mentioned": payload.get("date_mentioned", None),
        "notes": payload.get("notes", None),
        "raw_text": raw_text,
        "extraction_success": True,
    }

    # Validate/coerce using Pydantic (supports dict entries for PersonMention)
    return ExtractionResult.model_validate(normalized)


def _try_parse_json(text: str) -> Optional[Dict[str, Any]]:
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


import time
import logging
import re

logger = logging.getLogger(__name__)

def extract_memory(raw_text: str) -> ExtractionResult:
    llm = get_llm()

    def run_once(system_prompt: str, user_text: str) -> str:
        resp = llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_text),
            ]
        )
        content = getattr(resp, "content", "")
        return content if isinstance(content, str) else str(content)

    start_time = time.time()
    try:
        first = run_once(SYSTEM_PROMPT, raw_text)
        parsed = _try_parse_json(first)
        if parsed is not None:
            try:
                return _coerce_payload(parsed, raw_text)
            except Exception:
                pass

        stricter_prompt = (
            "You returned invalid or non-conforming JSON.\n"
            "Return ONLY valid JSON matching the required schema. No extra text.\n\n"
            + SYSTEM_PROMPT
        )
        repair_input = (
            "User memory:\n"
            f"{raw_text}\n\n"
            "Your previous response (fix it into valid JSON only):\n"
            f"{first}"
        )
        second = run_once(stricter_prompt, repair_input)
        parsed2 = _try_parse_json(second)
        elapsed = time.time() - start_time
        logger.info(f"LLM extraction successful in {elapsed:.2f}s")
        if parsed2 is not None:
            try:
                return _coerce_payload(parsed2, raw_text)
            except Exception:
                pass

    except Exception as e:
        elapsed = time.time() - start_time
        print(f"Extraction attempt failed after {elapsed:.2f}s: {str(e)}") # Log to console as requested
        logger.warning(f"LLM extraction failed after {elapsed:.2f}s: {str(e)}. Falling back to regex.")
        
        # Regex-based fallback extraction
        keywords = ["cousin", "uncle", "aunt", "wedding", "works in", "studies"]
        # Find capitalized words that might be names (ignore start of sentence ideally, but basic for now)
        words = raw_text.split()
        potential_names = [w.strip(".,!?\"'") for w in words if w and w[0].isupper() and w.lower() not in keywords]
        
        persons = []
        # Basic heuristic mapping
        for name in potential_names:
            if not name:
                continue
            relation_raw = None
            for kw in keywords[:3]: # family keywords
                if kw in raw_text.lower():
                    relation_raw = kw
                    break
            persons.append({
                "name": name,
                "nickname": None,
                "relation_raw": relation_raw,
                "occupation": None,
                "location": None
            })
            
        event = None
        if "wedding" in raw_text.lower():
            event = "wedding"
            
        return ExtractionResult(
            persons=persons,
            event=event,
            date_mentioned=None,
            notes=raw_text,
            raw_text=raw_text,
            extraction_success=False,
        )

    return ExtractionResult(
        persons=[],
        event=None,
        date_mentioned=None,
        notes=raw_text,
        raw_text=raw_text,
        extraction_success=False,
    )

