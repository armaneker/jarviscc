from __future__ import annotations

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from ..database import Base
from ..services.crypto import decrypt_secret


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=False, unique=True)
    port = Column(Integer, default=554)
    username = Column(String(100), nullable=True)
    password = Column(String(255), nullable=True)  # Encrypted
    rtsp_path = Column(String(255), default="/cam/realmonitor?channel=1&subtype=1")
    location = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    brand = Column(String(50), default="Dahua")
    channels = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def has_password(self) -> bool:
        return bool(self.password)

    @property
    def decrypted_password(self) -> str | None:
        return decrypt_secret(self.password)

    @property
    def rtsp_url(self) -> str:
        """Generate the full RTSP URL for this camera."""
        auth = ""
        password = self.decrypted_password
        if self.username and password:
            auth = f"{self.username}:{password}@"
        return f"rtsp://{auth}{self.ip_address}:{self.port}{self.rtsp_path}"

    def __repr__(self):
        return f"<Camera(id={self.id}, name='{self.name}', ip='{self.ip_address}')>"
