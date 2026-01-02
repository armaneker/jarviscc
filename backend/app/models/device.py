from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func

from ..database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # dishwasher, refrigerator, washer, etc.
    brand = Column(String(50), nullable=True)  # Samsung, LG, Tuya, etc.
    model = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)
    room = Column(String(100), nullable=True)
    status = Column(String(50), default="unknown")  # on, off, running, idle, etc.
    integration_type = Column(String(50), nullable=True)  # tuya, kasa, smartthings, thinq, manual
    integration_config = Column(JSON, nullable=True)  # Store integration-specific data
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Device(id={self.id}, name='{self.name}', type='{self.type}')>"
