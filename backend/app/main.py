from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import init_db, SessionLocal
from .models import Camera
from .routers import cameras_router, devices_router, tasks_router, shopping_router
from .services.crypto import encrypt_secret, is_encrypted_secret
from .services.stream_manager import stream_manager

FRONTEND_DIST_DIR = settings.base_dir.parent / "frontend" / "dist"
FRONTEND_INDEX_FILE = FRONTEND_DIST_DIR / "index.html"


def _latest_asset(pattern: str) -> Optional[Path]:
    """Return the latest matching asset by modification time."""
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if not assets_dir.exists():
        return None

    matches = sorted(assets_dir.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    return matches[0] if matches else None


def _frontend_index_response():
    """
    Serve a compatibility-focused index shell.

    We intentionally force the legacy bundle path to support older tablet
    browsers that may fail to execute modern module builds.
    """
    if not FRONTEND_INDEX_FILE.exists():
        return None

    legacy_polyfills = _latest_asset("polyfills-legacy-*.js")
    legacy_bundle = _latest_asset("index-legacy-*.js")
    css_bundle = _latest_asset("index-*.css")

    if legacy_polyfills and legacy_bundle and css_bundle:
        html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/jarvis.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Jarvis Command Center</title>
    <link rel="stylesheet" href="/assets/{css_bundle.name}">
  </head>
  <body>
    <div id="root" style="padding:12px;font-family:system-ui,sans-serif;color:#94a3b8;">Loading Jarvis...</div>
    <script>
      window.addEventListener('error', function (event) {{
        var el = document.getElementById('root');
        if (el) {{
          el.style.whiteSpace = 'pre-wrap';
          el.style.color = '#ef4444';
          el.textContent = 'Runtime error: ' + (event && event.message ? event.message : 'Unknown error');
        }}
      }});
    </script>
    <script src="/assets/{legacy_polyfills.name}"></script>
    <script>
      if (window.System && typeof window.System.import === 'function') {{
        window.System.import('/assets/{legacy_bundle.name}').catch(function (err) {{
          var el = document.getElementById('root');
          if (el) {{
            el.style.whiteSpace = 'pre-wrap';
            el.style.color = '#ef4444';
            el.textContent = 'Failed to load app bundle: ' + (err && err.message ? err.message : String(err));
          }}
        }});
      }} else {{
        var el = document.getElementById('root');
        if (el) {{
          el.style.whiteSpace = 'pre-wrap';
          el.style.color = '#ef4444';
          el.textContent = 'Compatibility loader unavailable (SystemJS missing).';
        }}
      }}
    </script>
  </body>
</html>
"""
        return HTMLResponse(content=html)

    return FileResponse(FRONTEND_INDEX_FILE)


def migrate_legacy_camera_passwords() -> int:
    """
    Encrypt any legacy plaintext camera passwords already in the database.

    Returns:
        Number of migrated camera rows.
    """
    db = SessionLocal()
    migrated_count = 0
    try:
        cameras = db.query(Camera).filter(Camera.password.isnot(None)).all()
        for camera in cameras:
            if camera.password and not is_encrypted_secret(camera.password):
                camera.password = encrypt_secret(camera.password)
                migrated_count += 1

        if migrated_count:
            db.commit()

        return migrated_count
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    init_db()
    migrated = migrate_legacy_camera_passwords()
    print(f"Database initialized")
    if migrated:
        print(f"Migrated {migrated} legacy camera password(s) to encrypted storage")
    print(f"HLS streams will be saved to: {settings.hls_output_dir}")

    yield

    # Shutdown
    print("Stopping all streams...")
    stream_manager.stop_all_streams()


app = FastAPI(
    title=settings.app_name,
    description="Home automation system with camera monitoring, device control, and task management",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5501", "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5501"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for HLS streams
app.mount("/streams", StaticFiles(directory=str(settings.hls_output_dir)), name="streams")

# Include routers
app.include_router(cameras_router, prefix="/api")
app.include_router(devices_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(shopping_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint."""
    if FRONTEND_INDEX_FILE.exists():
        response = _frontend_index_response()
        if response is not None:
            return response

    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "active_streams": stream_manager.get_active_streams()
    }


@app.get("/api/stats")
async def get_stats():
    """Get system statistics."""
    from .database import SessionLocal
    from .models import Camera, Device, Task, ShoppingItem

    db = SessionLocal()
    try:
        return {
            "cameras": {
                "total": db.query(Camera).count(),
                "active": db.query(Camera).filter(Camera.is_active == True).count(),
                "streaming": len(stream_manager.get_active_streams())
            },
            "devices": {
                "total": db.query(Device).count()
            },
            "tasks": {
                "total": db.query(Task).count(),
                "pending": db.query(Task).filter(Task.completed == False).count(),
                "completed": db.query(Task).filter(Task.completed == True).count()
            },
            "shopping": {
                "total": db.query(ShoppingItem).count(),
                "pending": db.query(ShoppingItem).filter(ShoppingItem.purchased == False).count()
            }
        }
    finally:
        db.close()


# Stream management endpoints
@app.post("/api/streams/{camera_id}/start")
async def start_camera_stream(camera_id: int):
    """Start HLS stream for a camera."""
    from fastapi.responses import JSONResponse
    from .database import SessionLocal
    from .models import Camera

    db = SessionLocal()
    try:
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        if not camera:
            return JSONResponse(
                status_code=404,
                content={"error": "Camera not found"}
            )

        # Check if camera has credentials
        if not camera.username or not camera.password:
            return JSONResponse(
                status_code=400,
                content={"error": "Camera credentials not configured. Edit the camera to add username and password."}
            )

        print(f"[API] Starting stream for camera {camera_id} ({camera.name})")
        success, error = stream_manager.start_stream(camera_id, camera.rtsp_url)

        if success:
            return {
                "status": "started",
                "stream_url": stream_manager.get_playlist_url(camera_id)
            }
        else:
            # Parse error for user-friendly message
            error_msg = error or "Unknown error"
            if "401" in error_msg or "Unauthorized" in error_msg.lower():
                error_msg = "Authentication failed - check camera credentials"
            elif "Connection refused" in error_msg:
                error_msg = "Camera refused connection - check IP and port"
            elif "timeout" in error_msg.lower():
                error_msg = "Connection timed out - camera may be offline"

            return JSONResponse(
                status_code=500,
                content={"error": error_msg}
            )
    finally:
        db.close()


@app.post("/api/streams/{camera_id}/stop")
async def stop_camera_stream(camera_id: int):
    """Stop HLS stream for a camera."""
    stream_manager.stop_stream(camera_id)
    return {"status": "stopped"}


@app.get("/api/streams/{camera_id}/status")
async def get_stream_status(camera_id: int):
    """Get stream status for a camera."""
    is_active = stream_manager.is_streaming(camera_id)
    return {
        "camera_id": camera_id,
        "streaming": is_active,
        "stream_url": stream_manager.get_playlist_url(camera_id) if is_active else None
    }


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve frontend files and SPA routes when build assets are present."""
    if full_path.startswith("api") or full_path.startswith("streams"):
        raise HTTPException(status_code=404, detail="Not found")

    if not FRONTEND_INDEX_FILE.exists():
        raise HTTPException(status_code=404, detail="Frontend build not found")

    requested_path = (FRONTEND_DIST_DIR / full_path).resolve()
    try:
        requested_path.relative_to(FRONTEND_DIST_DIR.resolve())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Invalid path") from exc

    if requested_path.is_file():
        return FileResponse(requested_path)

    response = _frontend_index_response()
    if response is not None:
        return response

    raise HTTPException(status_code=404, detail="Frontend build not found")
