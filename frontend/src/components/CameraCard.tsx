import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Camera, Play, Square, Maximize2, Settings, AlertCircle, Loader2 } from 'lucide-react';
import type { Camera as CameraType } from '../types';
import { streamApi, API_BASE_URL } from '../services/api';

interface CameraCardProps {
  camera: CameraType;
  onExpand?: (camera: CameraType) => void;
  onSettings?: (camera: CameraType) => void;
}

export default function CameraCard({ camera, onExpand, onSettings }: CameraCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  const startStream = async () => {
    if (!videoRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await streamApi.start(camera.id);
      const streamUrl = `${API_BASE_URL}${response.stream_url}`;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          // Low latency settings
          liveSyncDurationCount: 1,
          liveMaxLatencyDurationCount: 3,
          liveDurationInfinity: true,
          // Aggressive loading
          manifestLoadingMaxRetry: 10,
          manifestLoadingRetryDelay: 500,
          levelLoadingMaxRetry: 10,
          fragLoadingMaxRetry: 10,
          // Minimal buffering
          maxBufferLength: 2,
          maxMaxBufferLength: 4,
          maxBufferHole: 0.5,
          // Back buffer (how much past video to keep)
          backBufferLength: 0,
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play();
          setIsStreaming(true);
          setIsLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.log('HLS Event:', data.type, data.details, data.fatal);
          if (data.fatal) {
            console.error('HLS Fatal Error:', data);
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              // Try to recover from network errors
              console.log('Attempting network error recovery...');
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              // Try to recover from media errors
              console.log('Attempting media error recovery...');
              hls.recoverMediaError();
            } else {
              setError('Stream playback error');
              setIsLoading(false);
              setIsStreaming(false);
            }
          } else if (data.details === 'bufferStalledError') {
            // Non-fatal buffer stall - try to recover
            console.log('Buffer stalled, attempting recovery...');
            hls.startLoad();
          }
        });

        // Handle buffer stalls by trying to resume playback
        hls.on(Hls.Events.FRAG_BUFFERED, () => {
          if (videoRef.current && videoRef.current.paused && isStreaming) {
            videoRef.current.play().catch(() => {});
          }
        });

        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        videoRef.current.src = streamUrl;
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current?.play();
          setIsStreaming(true);
          setIsLoading(false);
        });
      }
    } catch (err: unknown) {
      // Extract error message from API response
      let errorMessage = 'Failed to start stream';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        }
      }
      console.error('Stream start error:', err);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const stopStream = async () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.src = '';
    }

    try {
      await streamApi.stop(camera.id);
    } catch {
      // Ignore stop errors
    }

    setIsStreaming(false);
  };

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden group">
      {/* Video Container */}
      <div className="relative aspect-video bg-slate-900">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />

        {/* Placeholder when not streaming */}
        {!isStreaming && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">{camera.name}</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <button
              onClick={isStreaming ? stopStream : startStream}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
              disabled={isLoading}
            >
              {isStreaming ? (
                <Square className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>

            <div className="flex gap-2">
              {onExpand && (
                <button
                  onClick={() => onExpand(camera)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                >
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
              )}
              {onSettings && (
                <button
                  onClick={() => onSettings(camera)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                >
                  <Settings className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute top-3 left-3">
          <div
            className={`w-2 h-2 rounded-full ${
              isStreaming
                ? 'bg-green-500 animate-pulse'
                : camera.is_active
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-3">
        <h3 className="text-white font-medium truncate">{camera.name}</h3>
        <p className="text-slate-400 text-sm truncate">
          {camera.location || camera.ip_address}
        </p>
      </div>
    </div>
  );
}
