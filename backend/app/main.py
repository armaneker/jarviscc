from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import init_db
from .routers import cameras_router, devices_router, tasks_router, shopping_router
from .services.stream_manager import stream_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    init_db()
    print(f"Database initialized")
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
