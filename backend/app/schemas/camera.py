from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CameraBase(BaseModel):
    name: str
    ip_address: str
    port: int = 554
    rtsp_path: str = "/cam/realmonitor?channel=1&subtype=1"
    location: Optional[str] = None
    brand: str = "Dahua"
    channels: int = 1


class CameraCreate(CameraBase):
    username: Optional[str] = None
    password: Optional[str] = None


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    rtsp_path: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None
    channels: Optional[int] = None


class CameraResponse(CameraBase):
    id: int
    username: Optional[str] = None
    has_password: bool = False
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    stream_url: Optional[str] = None  # HLS stream URL

    class Config:
        from_attributes = True


class CameraDiscovery(BaseModel):
    ip_address: str
    port: int
    brand: str
    name: Optional[str] = None
    is_dahua: bool = False
    mac_address: Optional[str] = None
