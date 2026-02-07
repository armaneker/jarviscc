import asyncio
import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.camera import Camera
from ..schemas.camera import CameraCreate, CameraUpdate, CameraResponse, CameraDiscovery
from ..services.camera_discovery import discover_cameras
from ..services.crypto import encrypt_secret

router = APIRouter(prefix="/cameras", tags=["cameras"])


@router.get("/", response_model=List[CameraResponse])
def get_cameras(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all cameras."""
    query = db.query(Camera)
    if active_only:
        query = query.filter(Camera.is_active == True)
    cameras = query.offset(skip).limit(limit).all()
    return cameras


@router.get("/discover", response_model=List[CameraDiscovery])
async def discover_network_cameras(
    network: str = "192.168.1.0/24",
    timeout: float = 2.0
):
    """Scan network for Dahua cameras."""
    cameras = await discover_cameras(network, timeout)
    return cameras


@router.get("/{camera_id}", response_model=CameraResponse)
def get_camera(camera_id: int, db: Session = Depends(get_db)):
    """Get a specific camera by ID."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera


@router.post("/", response_model=CameraResponse, status_code=201)
def create_camera(camera: CameraCreate, db: Session = Depends(get_db)):
    """Add a new camera."""
    # Check if camera with same IP already exists
    existing = db.query(Camera).filter(Camera.ip_address == camera.ip_address).first()
    if existing:
        raise HTTPException(status_code=400, detail="Camera with this IP already exists")

    camera_data = camera.model_dump()
    if camera_data.get("password"):
        camera_data["password"] = encrypt_secret(camera_data["password"])

    db_camera = Camera(**camera_data)
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera


@router.put("/{camera_id}", response_model=CameraResponse)
def update_camera(
    camera_id: int,
    camera: CameraUpdate,
    db: Session = Depends(get_db)
):
    """Update a camera."""
    db_camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    update_data = camera.model_dump(exclude_unset=True)

    if "ip_address" in update_data and update_data["ip_address"] != db_camera.ip_address:
        existing = db.query(Camera).filter(
            Camera.ip_address == update_data["ip_address"],
            Camera.id != camera_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Camera with this IP already exists")

    if "password" in update_data:
        update_data["password"] = encrypt_secret(update_data["password"])

    for key, value in update_data.items():
        setattr(db_camera, key, value)

    db.commit()
    db.refresh(db_camera)
    return db_camera


@router.delete("/{camera_id}", status_code=204)
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    """Delete a camera."""
    db_camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    db.delete(db_camera)
    db.commit()


@router.post("/{camera_id}/test")
async def test_camera_connection(camera_id: int, db: Session = Depends(get_db)):
    """Test if camera is reachable and credentials work."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    # TODO: Implement actual connection test
    return {"status": "ok", "message": "Camera connection test successful"}


from pydantic import BaseModel


class RTSPTestRequest(BaseModel):
    ip: str
    port: int = 554
    username: str
    password: str
    rtsp_path: str = "/cam/realmonitor?channel=1&subtype=1"


class CameraRTSPTestRequest(BaseModel):
    ip: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    rtsp_path: Optional[str] = None


async def test_dahua_http_auth(ip: str, username: str, password: str) -> dict:
    """Test authentication via Dahua HTTP API to get detailed error messages."""
    import aiohttp

    try:
        timeout = aiohttp.ClientTimeout(total=5)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            # First, try to access the login page to check status
            try:
                async with session.get(f"http://{ip}/RPC2_Login") as resp:
                    text = await resp.text()

                    # Check for lock message in response
                    if "locked" in text.lower():
                        # Try to extract lock time
                        lock_match = re.search(r'(\d+)\s*second', text, re.IGNORECASE)
                        lock_time = lock_match.group(1) if lock_match else "300"
                        return {
                            "success": False,
                            "locked": True,
                            "lock_time": int(lock_time),
                            "message": f"Account is LOCKED! Unlock time: {lock_time} seconds"
                        }
            except:
                pass

            # Try Dahua digest auth login
            auth = aiohttp.BasicAuth(username, password)

            # Try multiple Dahua endpoints
            endpoints = [
                f"http://{ip}/cgi-bin/magicBox.cgi?action=getSystemInfo",
                f"http://{ip}/cgi-bin/configManager.cgi?action=getConfig&name=General",
            ]

            for endpoint in endpoints:
                try:
                    async with session.get(endpoint, auth=auth) as resp:
                        text = await resp.text()

                        # Check for successful response
                        if resp.status == 200 and "error" not in text.lower():
                            return {"success": True, "message": "HTTP authentication successful!"}

                        # Check for lock message
                        if "locked" in text.lower() or "lock" in text.lower():
                            lock_match = re.search(r'(\d+)\s*second', text, re.IGNORECASE)
                            lock_time = lock_match.group(1) if lock_match else "300"
                            return {
                                "success": False,
                                "locked": True,
                                "lock_time": int(lock_time),
                                "message": f"Account is LOCKED! Unlock time: {lock_time} seconds"
                            }

                        # Check for attempts remaining
                        if "attempt" in text.lower():
                            attempt_match = re.search(r'(\d+)\s*attempt', text, re.IGNORECASE)
                            attempts = attempt_match.group(1) if attempt_match else "?"
                            return {
                                "success": False,
                                "locked": False,
                                "attempts_remaining": int(attempts) if attempts.isdigit() else None,
                                "message": f"Invalid username or password! {attempts} attempt(s) remaining"
                            }

                        # Generic auth failure
                        if resp.status == 401:
                            return {
                                "success": False,
                                "locked": False,
                                "message": "Authentication failed - invalid username or password"
                            }

                except aiohttp.ClientError:
                    continue

            return {"success": None, "message": "Could not determine HTTP auth status"}

    except asyncio.TimeoutError:
        return {"success": None, "message": "HTTP connection timed out"}
    except Exception as e:
        return {"success": None, "message": f"HTTP test error: {str(e)}"}


async def run_rtsp_connection_test(
    ip: str,
    port: int,
    username: str,
    password: str,
    rtsp_path: str
) -> dict:
    """Run detailed RTSP and Dahua auth checks for given connection settings."""
    http_result = await test_dahua_http_auth(ip, username, password)

    # If HTTP detected a lock, return immediately
    if http_result.get("locked"):
        return {
            "success": False,
            "message": http_result["message"],
            "locked": True,
            "lock_time": http_result.get("lock_time")
        }

    # If HTTP auth failed with attempts info, include that
    if http_result.get("success") is False and http_result.get("attempts_remaining"):
        return {
            "success": False,
            "message": http_result["message"],
            "attempts_remaining": http_result.get("attempts_remaining")
        }

    rtsp_url = f"rtsp://{username}:{password}@{ip}:{port}{rtsp_path}"

    try:
        process = await asyncio.create_subprocess_exec(
            "ffprobe",
            "-v", "error",
            "-rtsp_transport", "tcp",
            "-i", rtsp_url,
            "-show_entries", "stream=codec_type",
            "-of", "default=noprint_wrappers=1",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=10.0)
        except asyncio.TimeoutError:
            process.kill()
            # If HTTP auth succeeded but RTSP times out, it might be path issue
            if http_result.get("success"):
                return {"success": False, "message": "HTTP auth OK but RTSP timed out - check RTSP path"}
            return {"success": False, "message": "Connection timed out - camera may be unreachable"}

        if process.returncode == 0:
            output = stdout.decode()
            if "video" in output or "audio" in output:
                return {"success": True, "message": "Connection successful! Stream is accessible."}
            return {"success": True, "message": "Connected but no video/audio stream detected"}

        error = stderr.decode().lower()

        # If we have HTTP auth info, use that for better error messages
        if http_result.get("success") is False:
            return {
                "success": False,
                "message": http_result["message"],
                "attempts_remaining": http_result.get("attempts_remaining")
            }

        # Fallback to parsing RTSP errors
        if "401" in error or "unauthorized" in error:
            return {"success": False, "message": "Authentication failed - invalid username or password"}
        if "connection refused" in error:
            return {"success": False, "message": "Connection refused - camera may be offline or RTSP disabled"}
        if "no route to host" in error or "network is unreachable" in error:
            return {"success": False, "message": "Cannot reach camera - check IP address"}
        if "timeout" in error or "timed out" in error:
            return {"success": False, "message": "Connection timed out - camera may be busy or network issue"}
        if "invalid data" in error or "invalid argument" in error:
            return {"success": False, "message": "Invalid RTSP path - try /cam/realmonitor?channel=1&subtype=0"}
        return {"success": False, "message": f"Connection failed: {stderr.decode()[:200]}"}

    except FileNotFoundError:
        return {"success": False, "message": "FFmpeg/ffprobe not installed on server"}
    except Exception as e:
        return {"success": False, "message": f"Test failed: {str(e)}"}


@router.post("/{camera_id}/test-rtsp")
async def test_saved_camera_rtsp_connection(
    camera_id: int,
    request: CameraRTSPTestRequest,
    db: Session = Depends(get_db)
):
    """
    Test RTSP connection for an existing camera.

    Uses stored credentials by default, with optional request overrides.
    """
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    ip = request.ip or camera.ip_address
    port = request.port or camera.port
    username = request.username or camera.username
    password = request.password or camera.decrypted_password
    rtsp_path = request.rtsp_path or camera.rtsp_path

    if not username or not password:
        return {
            "success": False,
            "message": "Camera credentials not configured. Edit the camera and set username/password."
        }

    return await run_rtsp_connection_test(ip, port, username, password, rtsp_path)


@router.post("/test-rtsp")
async def test_rtsp_connection(request: RTSPTestRequest):
    """Test RTSP connection with provided credentials using ffprobe and HTTP auth."""
    return await run_rtsp_connection_test(
        request.ip,
        request.port,
        request.username,
        request.password,
        request.rtsp_path,
    )
