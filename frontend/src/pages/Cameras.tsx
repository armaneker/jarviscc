import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Loader2, AlertCircle, Camera as CameraIcon, X, Grid3X3, Grid2X2, Eye, EyeOff, CheckCircle, XCircle, Lock, Clock, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import CameraCard from '../components/CameraCard';
import { cameraApi } from '../services/api';
import type { Camera, CameraCreate, CameraDiscovery } from '../types';

type GridSize = '2x2' | '3x3' | '4x4';

export default function Cameras() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>('3x3');
  const [expandedCamera, setExpandedCamera] = useState<Camera | null>(null);

  const { data: cameras, isLoading, error } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => cameraApi.getAll(),
  });

  const addCameraMutation = useMutation({
    mutationFn: cameraApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      setShowAddModal(false);
    },
  });

  const updateCameraMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CameraCreate> }) =>
      cameraApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      setEditingCamera(null);
    },
  });

  const deleteCameraMutation = useMutation({
    mutationFn: (id: number) => cameraApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      setEditingCamera(null);
    },
  });

  const gridClasses = {
    '2x2': 'grid-cols-1 md:grid-cols-2',
    '3x3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4x4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Security Cameras"
        subtitle={`${cameras?.length || 0} cameras configured`}
        action={
          <div className="flex items-center gap-3">
            {/* Grid Size Selector */}
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setGridSize('2x2')}
                className={`p-2 rounded ${gridSize === '2x2' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
                title="2x2 Grid"
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridSize('3x3')}
                className={`p-2 rounded ${gridSize === '3x3' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
                title="3x3 Grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridSize('4x4')}
                className={`p-2 rounded ${gridSize === '4x4' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
                title="4x4 Grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowDiscoverModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Discover</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Camera</span>
            </button>
          </div>
        }
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-200">Failed to load cameras. Is the backend running?</span>
        </div>
      )}

      {/* Empty State */}
      {cameras && cameras.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-12 text-center">
          <CameraIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No cameras configured</h3>
          <p className="text-slate-400 mb-6">
            Add your Dahua cameras to start monitoring your home security.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowDiscoverModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Discover Cameras</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* Camera Grid */}
      {cameras && cameras.length > 0 && (
        <div className={`grid ${gridClasses[gridSize]} gap-4`}>
          {cameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              onExpand={setExpandedCamera}
              onSettings={setEditingCamera}
            />
          ))}
        </div>
      )}

      {/* Add Camera Modal */}
      {showAddModal && (
        <AddCameraModal
          onClose={() => setShowAddModal(false)}
          onAdd={(camera) => addCameraMutation.mutate(camera)}
          isLoading={addCameraMutation.isPending}
        />
      )}

      {/* Discover Modal */}
      {showDiscoverModal && (
        <DiscoverModal
          onClose={() => setShowDiscoverModal(false)}
          onAdd={(camera) => {
            addCameraMutation.mutate(camera);
            setShowDiscoverModal(false);
          }}
        />
      )}

      {/* Edit Camera Modal */}
      {editingCamera && (
        <EditCameraModal
          camera={editingCamera}
          onClose={() => setEditingCamera(null)}
          onSave={(data) => updateCameraMutation.mutate({ id: editingCamera.id, data })}
          onDelete={() => deleteCameraMutation.mutate(editingCamera.id)}
          isLoading={updateCameraMutation.isPending}
          isDeleting={deleteCameraMutation.isPending}
        />
      )}

      {/* Expanded Camera View */}
      {expandedCamera && (
        <ExpandedCameraView
          camera={expandedCamera}
          onClose={() => setExpandedCamera(null)}
        />
      )}
    </div>
  );
}

// Add Camera Modal Component
interface AddCameraModalProps {
  onClose: () => void;
  onAdd: (camera: CameraCreate) => void;
  isLoading: boolean;
}

function AddCameraModal({ onClose, onAdd, isLoading }: AddCameraModalProps) {
  const [formData, setFormData] = useState<CameraCreate>({
    name: '',
    ip_address: '',
    port: 554,
    username: '',
    password: '',
    rtsp_path: '/cam/realmonitor?channel=1&subtype=1',
    location: '',
    brand: 'Dahua',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Add Camera</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="Front Door Camera"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">IP Address</label>
              <input
                type="text"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                placeholder="192.168.1.100"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="Front Yard"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Camera'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Discover Modal Component
interface DiscoverModalProps {
  onClose: () => void;
  onAdd: (camera: CameraCreate) => void;
}

function DiscoverModal({ onClose, onAdd }: DiscoverModalProps) {
  const [network, setNetwork] = useState('192.168.1.0/24');

  const { data: discovered, isLoading, refetch } = useQuery({
    queryKey: ['discover-cameras', network],
    queryFn: () => cameraApi.discover(network),
    enabled: false,
  });

  const handleDiscover = () => {
    refetch();
  };

  const handleAddCamera = (camera: CameraDiscovery) => {
    onAdd({
      name: camera.name || `Camera ${camera.ip_address}`,
      ip_address: camera.ip_address,
      port: camera.port,
      brand: camera.brand,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Discover Cameras</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            placeholder="192.168.1.0/24"
          />
          <button
            onClick={handleDiscover}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan'}
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {discovered && discovered.length === 0 && (
            <p className="text-slate-400 text-center py-8">No cameras found on this network</p>
          )}

          {discovered && discovered.length > 0 && (
            <div className="space-y-2">
              {discovered.map((camera, index) => (
                <div
                  key={index}
                  className="bg-slate-700 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium">{camera.ip_address}:{camera.port}</p>
                    <p className="text-slate-400 text-sm">
                      {camera.brand} {camera.is_dahua && '(Dahua)'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddCamera(camera)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Camera Modal Component
interface EditCameraModalProps {
  camera: Camera;
  onClose: () => void;
  onSave: (data: Partial<CameraCreate>) => void;
  onDelete: () => void;
  isLoading: boolean;
  isDeleting: boolean;
}

function EditCameraModal({ camera, onClose, onSave, onDelete, isLoading, isDeleting }: EditCameraModalProps) {
  const [formData, setFormData] = useState({
    name: camera.name,
    port: camera.port,
    username: camera.username || '',
    password: '',
    rtsp_path: camera.rtsp_path,
    location: camera.location || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error' | 'locked'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [lockTimeRemaining, setLockTimeRemaining] = useState<number | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Countdown timer for locked accounts
  useEffect(() => {
    if (lockTimeRemaining && lockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setLockTimeRemaining((prev) => {
          if (prev && prev > 1) return prev - 1;
          setTestStatus('idle');
          setTestMessage('');
          return null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockTimeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTestConnection = async () => {
    if (!formData.username || !formData.password) {
      setTestStatus('error');
      setTestMessage('Username and password are required');
      return;
    }

    setTestStatus('testing');
    setTestMessage('');
    setLockTimeRemaining(null);
    setAttemptsRemaining(null);

    try {
      const response = await fetch(`http://localhost:8101/api/cameras/test-rtsp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: camera.ip_address,
          port: formData.port,
          username: formData.username,
          password: formData.password,
          rtsp_path: formData.rtsp_path,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestStatus('success');
        setTestMessage(result.message || 'Connection successful!');
      } else if (result.locked) {
        setTestStatus('locked');
        setTestMessage(result.message || 'Account is locked');
        if (result.lock_time) {
          setLockTimeRemaining(result.lock_time);
        }
      } else {
        setTestStatus('error');
        setTestMessage(result.message || 'Connection failed');
        if (result.attempts_remaining !== undefined) {
          setAttemptsRemaining(result.attempts_remaining);
        }
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage('Failed to test connection');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<CameraCreate> = {
      name: formData.name,
      port: formData.port,
      rtsp_path: formData.rtsp_path,
      location: formData.location || undefined,
    };
    if (formData.username) data.username = formData.username;
    if (formData.password) data.password = formData.password;
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Edit Camera</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-slate-700 rounded-lg">
          <p className="text-slate-400 text-sm">IP Address</p>
          <p className="text-white font-mono">{camera.ip_address}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
                setTestStatus('idle');
              }}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setTestStatus('idle');
                }}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 pr-10 text-white"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">RTSP Path</label>
            <input
              type="text"
              value={formData.rtsp_path}
              onChange={(e) => {
                setFormData({ ...formData, rtsp_path: e.target.value });
                setTestStatus('idle');
              }}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-sm"
            />
            <p className="text-slate-500 text-xs mt-1">
              Common paths: /cam/realmonitor?channel=1&subtype=0 (main) or subtype=1 (sub)
            </p>
          </div>

          {/* Test Connection Button */}
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing' || testStatus === 'locked' || !formData.username || !formData.password}
              className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {testStatus === 'testing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : testStatus === 'locked' ? (
                <>
                  <Lock className="w-4 h-4" />
                  Account Locked
                </>
              ) : (
                'Test Connection'
              )}
            </button>

            {/* Success */}
            {testStatus === 'success' && (
              <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                {testMessage}
              </div>
            )}

            {/* Locked with countdown */}
            {testStatus === 'locked' && (
              <div className="mt-3 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 font-medium">
                  <Lock className="w-4 h-4" />
                  Account Locked
                </div>
                {lockTimeRemaining && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-lg">{formatTime(lockTimeRemaining)}</span>
                    <span className="text-slate-400 text-sm">until unlock</span>
                  </div>
                )}
                <p className="text-slate-400 text-xs mt-2">
                  Too many failed login attempts. Wait for the timer or access the device web UI to unlock.
                </p>
              </div>
            )}

            {/* Error with attempts remaining */}
            {testStatus === 'error' && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <XCircle className="w-4 h-4" />
                  {testMessage}
                </div>
                {attemptsRemaining !== null && (
                  <div className={`mt-2 p-2 rounded text-sm ${
                    attemptsRemaining <= 1
                      ? 'bg-red-900/30 border border-red-500/50 text-red-300'
                      : attemptsRemaining <= 3
                        ? 'bg-yellow-900/30 border border-yellow-500/50 text-yellow-300'
                        : 'bg-slate-700 text-slate-300'
                  }`}>
                    <span className="font-medium">{attemptsRemaining}</span> attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lock
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="Front Yard"
            />
          </div>

          {/* Delete Section */}
          <div className="border-t border-slate-700 pt-4 mt-4">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Camera
              </button>
            ) : (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-300 text-sm mb-3">
                  Are you sure you want to delete "{camera.name}"? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Expanded Camera View
interface ExpandedCameraViewProps {
  camera: Camera;
  onClose: () => void;
}

function ExpandedCameraView({ camera, onClose }: ExpandedCameraViewProps) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-slate-900">
        <h2 className="text-xl font-semibold text-white">{camera.name}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
      <div className="flex-1 p-4">
        <CameraCard camera={camera} />
      </div>
    </div>
  );
}
