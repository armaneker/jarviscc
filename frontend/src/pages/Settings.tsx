import { useState } from 'react';
import { Settings as SettingsIcon, Server, Database, Info } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { healthApi, API_BASE_URL } from '../services/api';

const readSavedApiUrl = (): string => {
  try {
    return localStorage.getItem('jarvis_api_url') || API_BASE_URL;
  } catch {
    return API_BASE_URL;
  }
};

export default function Settings() {
  const [apiUrl, setApiUrl] = useState(readSavedApiUrl);

  const { data: health, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
    refetchInterval: 10000,
  });

  const handleSaveApiUrl = () => {
    try {
      localStorage.setItem('jarvis_api_url', apiUrl.trim().replace(/\/+$/, ''));
    } catch {
      // Ignore storage errors on restricted browsers.
    }
    window.location.reload();
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Settings"
        subtitle="Configure your Jarvis system"
      />

      <div className="max-w-3xl space-y-6">
        {/* Backend Status */}
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Backend Status</h2>
          </div>

          {isLoading && (
            <div className="text-slate-400">Checking connection...</div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Backend not reachable</span>
            </div>
          )}

          {health && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Backend connected</span>
              </div>
              <div className="text-slate-400 text-sm">
                Active streams: {health.active_streams.length}
              </div>
            </div>
          )}
        </div>

        {/* API Configuration */}
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">API Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Backend URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                placeholder="http://localhost:8101"
              />
            </div>
            <button
              onClick={handleSaveApiUrl}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              Save & Reload
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">About</h2>
          </div>

          <div className="space-y-2 text-slate-400">
            <p>
              <strong className="text-white">Jarvis Home Automation</strong>
            </p>
            <p>Version 1.0.0</p>
            <p className="text-sm mt-4">
              A comprehensive home automation system with camera monitoring,
              device control, and task management.
            </p>
          </div>
        </div>

        {/* Camera Configuration Tips */}
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Dahua Camera Setup</h2>
          </div>

          <div className="space-y-4 text-slate-400 text-sm">
            <div>
              <h3 className="text-white font-medium mb-1">Default Credentials</h3>
              <p>Most Dahua cameras use:</p>
              <ul className="list-disc list-inside ml-2">
                <li>Username: admin</li>
                <li>Password: admin (or your custom password)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-medium mb-1">RTSP URL Format</h3>
              <code className="block overflow-x-auto rounded bg-slate-900 p-2 text-xs text-green-400">
                rtsp://username:password@ip:554/cam/realmonitor?channel=1&subtype=1
              </code>
              <p className="mt-1">
                subtype=0 for main stream (HD), subtype=1 for sub stream (lower bandwidth)
              </p>
            </div>

            <div>
              <h3 className="text-white font-medium mb-1">FFmpeg Requirement</h3>
              <p>
                Camera streaming requires FFmpeg installed on your system.
                Install with: <code className="bg-slate-900 px-1 rounded">brew install ffmpeg</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
