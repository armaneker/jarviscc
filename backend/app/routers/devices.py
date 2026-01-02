from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.device import Device
from ..schemas.device import DeviceCreate, DeviceUpdate, DeviceResponse

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("/", response_model=List[DeviceResponse])
def get_devices(
    skip: int = 0,
    limit: int = 100,
    room: str = None,
    device_type: str = None,
    db: Session = Depends(get_db)
):
    """Get all devices."""
    query = db.query(Device)
    if room:
        query = query.filter(Device.room == room)
    if device_type:
        query = query.filter(Device.type == device_type)
    devices = query.offset(skip).limit(limit).all()
    return devices


@router.get("/rooms")
def get_rooms(db: Session = Depends(get_db)):
    """Get list of unique rooms."""
    rooms = db.query(Device.room).distinct().filter(Device.room.isnot(None)).all()
    return [room[0] for room in rooms]


@router.get("/types")
def get_device_types(db: Session = Depends(get_db)):
    """Get list of unique device types."""
    types = db.query(Device.type).distinct().all()
    return [t[0] for t in types]


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: int, db: Session = Depends(get_db)):
    """Get a specific device by ID."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("/", response_model=DeviceResponse, status_code=201)
def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    """Add a new device."""
    db_device = Device(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device


@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: int,
    device: DeviceUpdate,
    db: Session = Depends(get_db)
):
    """Update a device."""
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")

    update_data = device.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_device, key, value)

    db.commit()
    db.refresh(db_device)
    return db_device


@router.delete("/{device_id}", status_code=204)
def delete_device(device_id: int, db: Session = Depends(get_db)):
    """Delete a device."""
    db_device = db.query(Device).filter(Device.id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")

    db.delete(db_device)
    db.commit()


@router.post("/{device_id}/control")
async def control_device(
    device_id: int,
    action: str,
    db: Session = Depends(get_db)
):
    """Send control command to device (on, off, etc.)."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # TODO: Implement actual device control based on integration_type
    return {"status": "ok", "action": action, "device_id": device_id}
