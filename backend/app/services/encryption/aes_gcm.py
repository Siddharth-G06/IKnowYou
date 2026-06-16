import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings
from pathlib import Path
import base64
import logging

logger = logging.getLogger(__name__)

def _load_or_generate_key() -> bytes:
    key_path = Path(settings.SECRET_KEY_PATH)
    key_path.parent.mkdir(parents=True, exist_ok=True)
    if key_path.exists():
        return key_path.read_bytes()
    key = AESGCM.generate_key(bit_length=256)
    key_path.write_bytes(key)
    key_path.chmod(0o600)
    logger.info(f"Generated new AES-256 key at {key_path}")
    return key

_KEY = _load_or_generate_key()
_AESGCM = AESGCM(_KEY)

def encrypt_text(plaintext: str) -> str:
    nonce = os.urandom(12)
    ciphertext = _AESGCM.encrypt(nonce, plaintext.encode(), None)
    payload = nonce + ciphertext
    return base64.b64encode(payload).decode()

def decrypt_text(encrypted: str) -> str:
    payload = base64.b64decode(encrypted.encode())
    nonce, ciphertext = payload[:12], payload[12:]
    return _AESGCM.decrypt(nonce, ciphertext, None).decode()
