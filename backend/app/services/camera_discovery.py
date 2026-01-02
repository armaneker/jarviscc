from __future__ import annotations

import asyncio
import socket
from typing import List, Optional
from ipaddress import ip_network

from ..schemas.camera import CameraDiscovery
from ..config import settings


async def check_port(ip: str, port: int, timeout: float) -> bool:
    """Check if a port is open on a given IP address."""
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(ip, port),
            timeout=timeout
        )
        writer.close()
        await writer.wait_closed()
        return True
    except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
        return False


async def check_dahua_camera(ip: str, timeout: float) -> CameraDiscovery | None:
    """Check if IP is a Dahua camera by checking known Dahua ports."""
    dahua_ports = settings.dahua_ports

    # Check common ports
    port_checks = await asyncio.gather(
        *[check_port(ip, port, timeout) for port in dahua_ports]
    )

    results = dict(zip(dahua_ports, port_checks))

    # If port 37777 (Dahua proprietary) is open, it's likely a Dahua camera
    is_dahua = results.get(37777, False)

    # If RTSP port or HTTP port is open, could be a camera
    has_rtsp = results.get(554, False)
    has_http = results.get(80, False) or results.get(443, False)

    if is_dahua or (has_rtsp and has_http):
        return CameraDiscovery(
            ip_address=ip,
            port=554 if has_rtsp else 80,
            brand="Dahua" if is_dahua else "Unknown",
            is_dahua=is_dahua,
            name=f"Camera at {ip}"
        )

    return None


async def discover_cameras(
    network: str = "192.168.1.0/24",
    timeout: float = 2.0
) -> List[CameraDiscovery]:
    """
    Scan a network for potential cameras.

    Args:
        network: CIDR notation network to scan (e.g., "192.168.1.0/24")
        timeout: Connection timeout in seconds

    Returns:
        List of discovered cameras
    """
    try:
        net = ip_network(network, strict=False)
    except ValueError as e:
        raise ValueError(f"Invalid network format: {e}")

    # Get all host IPs (excluding network and broadcast)
    hosts = [str(ip) for ip in net.hosts()]

    # Limit concurrent connections to avoid overwhelming the network
    semaphore = asyncio.Semaphore(50)

    async def check_with_semaphore(ip: str):
        async with semaphore:
            return await check_dahua_camera(ip, timeout)

    # Check all hosts concurrently
    results = await asyncio.gather(
        *[check_with_semaphore(ip) for ip in hosts]
    )

    # Filter out None results
    cameras = [cam for cam in results if cam is not None]

    return cameras


async def test_rtsp_connection(
    ip: str,
    port: int = 554,
    username: str = None,
    password: str = None,
    path: str = "/cam/realmonitor?channel=1&subtype=1"
) -> dict:
    """
    Test if RTSP connection to camera works.

    Returns dict with status and any error message.
    """
    # Build RTSP URL
    auth = ""
    if username and password:
        auth = f"{username}:{password}@"

    rtsp_url = f"rtsp://{auth}{ip}:{port}{path}"

    try:
        # Just check if RTSP port is open for now
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(ip, port),
            timeout=5.0
        )
        writer.close()
        await writer.wait_closed()

        return {
            "success": True,
            "message": "RTSP port is accessible",
            "rtsp_url": rtsp_url.replace(password, "****") if password else rtsp_url
        }
    except asyncio.TimeoutError:
        return {"success": False, "message": "Connection timed out"}
    except ConnectionRefusedError:
        return {"success": False, "message": "Connection refused"}
    except Exception as e:
        return {"success": False, "message": str(e)}
