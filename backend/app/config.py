from __future__ import annotations
from typing import List
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "Jarvis Home Automation"
    debug: bool = True
    secret_key: str = "jarvis-dev-secret-change-me"

    # Database
    database_url: str = "sqlite:///./jarvis.db"

    # Camera settings
    default_rtsp_port: int = 554
    hls_segment_duration: int = 2
    hls_playlist_size: int = 5

    # Network scanning
    network_scan_timeout: float = 1.0
    dahua_ports: List[int] = [80, 443, 554, 37777]

    # Paths
    base_dir: Path = Path(__file__).parent.parent
    hls_output_dir: Path = base_dir / "streams"

    class Config:
        env_file = ".env"


settings = Settings()

# Ensure HLS output directory exists
settings.hls_output_dir.mkdir(exist_ok=True)
