from __future__ import annotations

from base64 import urlsafe_b64encode
from hashlib import sha256
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from ..config import settings


def _build_cipher() -> Fernet:
    """Build a stable Fernet key from the configured secret value."""
    key_bytes = sha256(settings.secret_key.encode("utf-8")).digest()
    return Fernet(urlsafe_b64encode(key_bytes))


_cipher = _build_cipher()


def encrypt_secret(value: Optional[str]) -> Optional[str]:
    """Encrypt a secret for storage."""
    if not value:
        return None
    return _cipher.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_secret(value: Optional[str]) -> Optional[str]:
    """
    Decrypt a stored secret.

    Returns the original value if it's not encrypted, so old plaintext rows
    remain usable until rewritten.
    """
    if not value:
        return None
    try:
        return _cipher.decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return value


def is_encrypted_secret(value: Optional[str]) -> bool:
    """Return True when a value is a valid encrypted token."""
    if not value:
        return False
    try:
        _cipher.decrypt(value.encode("utf-8"))
        return True
    except InvalidToken:
        return False
