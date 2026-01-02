from .cameras import router as cameras_router
from .devices import router as devices_router
from .tasks import router as tasks_router
from .shopping import router as shopping_router

__all__ = ["cameras_router", "devices_router", "tasks_router", "shopping_router"]
