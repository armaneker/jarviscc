from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class DeviceBase(BaseModel):
    name: str
    type: str
    brand: Optional[str] = None
    model: Optional[str] = None
    ip_address: Optional[str] = None
    room: Optional[str] = None
    integration_type: Optional[str] = None
    integration_config: Optional[dict[str, Any]] = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    ip_address: Optional[str] = None
    room: Optional[str] = None
    status: Optional[str] = None
    integration_type: Optional[str] = None
    integration_config: Optional[dict[str, Any]] = None


class DeviceResponse(DeviceBase):
    id: int
    status: str
    last_updated: datetime
    created_at: datetime

    class Config:
        from_attributes = True
