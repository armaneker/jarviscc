from __future__ import annotations
import subprocess
import time
import threading
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from ..config import settings


class StreamManager:
    """
    Manages RTSP to HLS stream conversion using FFmpeg.

    Each camera gets its own FFmpeg process that converts the RTSP stream
    to HLS segments that can be played in web browsers.
    """

    def __init__(self):
        self._processes: Dict[int, subprocess.Popen] = {}
        self._errors: Dict[int, str] = {}
        self._playlist_tokens: Dict[int, int] = {}
        self._output_dir = settings.hls_output_dir

    def _get_stream_path(self, camera_id: int) -> Path:
        """Get the output directory for a camera's HLS stream."""
        path = self._output_dir / f"camera_{camera_id}"
        path.mkdir(parents=True, exist_ok=True)
        return path

    def get_playlist_url(self, camera_id: int) -> str:
        """Get the URL for a camera's HLS playlist."""
        token = self._playlist_tokens.get(camera_id)
        if token:
            return f"/streams/camera_{camera_id}/stream.m3u8?v={token}"
        return f"/streams/camera_{camera_id}/stream.m3u8"

    def get_stream_error(self, camera_id: int) -> Optional[str]:
        """Get the last error for a camera stream."""
        return self._errors.get(camera_id)

    def _monitor_ffmpeg(self, camera_id: int, process: subprocess.Popen):
        """Monitor FFmpeg process and capture errors."""
        stderr_output = []
        try:
            for line in process.stderr:
                decoded = line.decode('utf-8', errors='ignore').strip()
                stderr_output.append(decoded)
                # Keep only last 50 lines
                if len(stderr_output) > 50:
                    stderr_output.pop(0)
                # Log important errors
                if any(x in decoded.lower() for x in ['error', 'failed', '401', 'unauthorized', 'connection refused']):
                    print(f"[FFmpeg Camera {camera_id}] {decoded}")

            # Process ended
            return_code = process.wait()
            if return_code != 0:
                error_msg = '\n'.join(stderr_output[-10:])  # Last 10 lines
                self._errors[camera_id] = f"FFmpeg exited with code {return_code}: {error_msg}"
                print(f"[FFmpeg Camera {camera_id}] Stream ended with error: {error_msg[:500]}")
        except Exception as e:
            self._errors[camera_id] = str(e)

    def _cleanup_stream_files(self, camera_id: int) -> None:
        """Delete all existing HLS files for a camera."""
        output_path = self._get_stream_path(camera_id)
        for f in output_path.glob("*"):
            try:
                f.unlink()
            except Exception:
                pass

    def start_stream(self, camera_id: int, rtsp_url: str) -> Tuple[bool, Optional[str]]:
        """
        Start streaming from a camera.

        Args:
            camera_id: Database ID of the camera
            rtsp_url: Full RTSP URL including credentials

        Returns:
            Tuple of (success, error_message)
        """
        if camera_id in self._processes:
            self.stop_stream(camera_id)

        # Clear previous errors
        self._errors.pop(camera_id, None)
        self._playlist_tokens.pop(camera_id, None)

        output_path = self._get_stream_path(camera_id)
        playlist_path = output_path / "stream.m3u8"
        start_token = int(time.time() * 1000)
        self._playlist_tokens[camera_id] = start_token
        self._cleanup_stream_files(camera_id)

        # Log sanitized URL (hide password)
        safe_url = rtsp_url
        if '@' in rtsp_url:
            # Hide password in logs
            parts = rtsp_url.split('@')
            auth_part = parts[0].split('://')[-1]
            if ':' in auth_part:
                username = auth_part.split(':')[0]
                safe_url = f"rtsp://{username}:****@{parts[1]}"
        print(f"[StreamManager] Starting stream for camera {camera_id}: {safe_url}")

        # FFmpeg command to convert RTSP to HLS
        # Low-latency settings for real-time monitoring
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output files
            "-fflags", "+genpts+nobuffer+flush_packets",  # Low latency flags
            "-flags", "low_delay",
            "-rtsp_transport", "tcp",
            "-timeout", "5000000",  # Connection timeout (microseconds)
            "-i", rtsp_url,
            "-c:v", "copy",  # Copy video codec (no transcoding)
            "-an",  # No audio
            "-f", "hls",
            "-hls_time", "1",  # 1 second segments for lower latency
            "-hls_list_size", "3",  # Keep only 3 segments
            "-hls_flags", "delete_segments+append_list+omit_endlist",
            "-hls_segment_filename", str(output_path / f"segment_{start_token}_%03d.ts"),
            str(playlist_path),
        ]

        try:
            # Print command for debugging (hide password)
            debug_cmd = ' '.join(cmd).replace(rtsp_url, safe_url)
            print(f"[StreamManager] Running: {debug_cmd}")

            # Start FFmpeg process
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                stdin=subprocess.DEVNULL,  # Prevent FFmpeg from waiting for input
            )
            self._processes[camera_id] = process

            # Start monitoring thread
            monitor_thread = threading.Thread(
                target=self._monitor_ffmpeg,
                args=(camera_id, process),
                daemon=True
            )
            monitor_thread.start()

            # Wait for playlist file to be created (up to 30 seconds)
            # Dahua cameras can be slow to start streaming
            for i in range(60):
                time.sleep(0.5)
                if playlist_path.exists() and playlist_path.stat().st_size > 0:
                    # Ensure at least one segment from this specific start attempt exists
                    segments = list(output_path.glob(f"segment_{start_token}_*.ts"))
                    if segments:
                        print(f"[StreamManager] Stream ready for camera {camera_id} (took {(i+1)*0.5:.1f}s)")
                        return True, None
                # Check if process died
                if process.poll() is not None:
                    error = self._errors.get(camera_id, "FFmpeg process terminated unexpectedly")
                    return False, error
                # Log progress every 5 seconds
                if (i + 1) % 10 == 0:
                    print(f"[StreamManager] Waiting for stream... {(i+1)*0.5:.0f}s")

            # Timeout - check if process is still running
            if process.poll() is None:
                # Process running but no playlist yet - return success anyway and let HLS.js retry
                print(f"[StreamManager] Stream taking long but FFmpeg still running, allowing connection")
                return True, None
            else:
                error = self._errors.get(camera_id, "FFmpeg failed to start stream")
                self._playlist_tokens.pop(camera_id, None)
                return False, error

        except FileNotFoundError:
            error = "FFmpeg not found. Please install FFmpeg."
            print(f"[StreamManager] {error}")
            self._playlist_tokens.pop(camera_id, None)
            return False, error
        except Exception as e:
            error = f"Error starting stream: {e}"
            print(f"[StreamManager] {error}")
            self._playlist_tokens.pop(camera_id, None)
            return False, error

    def stop_stream(self, camera_id: int) -> bool:
        """
        Stop streaming from a camera.

        Args:
            camera_id: Database ID of the camera

        Returns:
            True if stream stopped successfully
        """
        if camera_id not in self._processes:
            return True

        process = self._processes[camera_id]
        try:
            process.terminate()
            process.wait(timeout=5)
        except Exception:
            try:
                process.kill()
            except Exception:
                pass

        del self._processes[camera_id]
        self._playlist_tokens.pop(camera_id, None)

        # Clean up HLS files
        self._cleanup_stream_files(camera_id)

        return True

    def is_streaming(self, camera_id: int) -> bool:
        """Check if a camera is currently streaming."""
        if camera_id not in self._processes:
            return False

        process = self._processes[camera_id]
        return process.poll() is None

    def get_active_streams(self) -> List[int]:
        """Get list of camera IDs that are currently streaming."""
        return [cid for cid in self._processes.keys() if self.is_streaming(cid)]

    def stop_all_streams(self):
        """Stop all active streams."""
        for camera_id in list(self._processes.keys()):
            self.stop_stream(camera_id)


# Global stream manager instance
stream_manager = StreamManager()
