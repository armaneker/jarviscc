import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Loader2, AlertCircle, Camera as CameraIcon, X, Grid3X3, Grid2X2, Eye, EyeOff, CheckCircle, XCircle, Lock, Clock, Trash2, Check, Minus, PlayCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import CameraCard from '../components/CameraCard';
import { cameraApi, API_BASE_URL } from '../services/api';
import type { Camera, CameraCreate } from '../types';

type GridSize = '2x2' | '3x3' | '4x4';

export default function Cameras() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>('3x3');
  const [expandedCamera, setExpandedCamera] = useState<Camera | null>(null);
  const [playAllTrigger, setPlayAllTrigger] = useState(0);

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
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Security Cameras"
        subtitle={`${cameras?.length || 0} cameras configured`}
        action={
          <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3">
            {/* Grid Size Selector */}
            <div className="order-last flex w-full justify-center rounded-lg bg-slate-800 p-1 sm:order-none sm:w-auto sm:justify-start">
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

            {cameras && cameras.length > 0 && (
              <button
                onClick={() => setPlayAllTrigger((t) => t + 1)}
                className="flex min-h-10 items-center gap-2 px-3 py-2 sm:px-4 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                title="Start all camera streams"
              >
                <PlayCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Play All</span>
              </button>
            )}

            <button
              onClick={() => setShowDiscoverModal(true)}
              className="flex min-h-10 items-center gap-2 px-3 py-2 sm:px-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              title="Discover cameras"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Discover</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex min-h-10 items-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              title="Add camera"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Camera</span>
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
        <div className="bg-slate-800 rounded-xl p-8 sm:p-12 text-center">
          <CameraIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No cameras configured</h3>
          <p className="text-slate-400 mb-6">
            Add your Dahua cameras to start monitoring your home security.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <button
              onClick={() => setShowDiscoverModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Discover Cameras</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
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
              autoStartTrigger={playAllTrigger}
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
          existingIps={cameras?.map((c) => c.ip_address) || []}
          onAddCamera={async (camera) => {
            await addCameraMutation.mutateAsync(camera);
          }}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['cameras'] });
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="bg-slate-800 rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[92vh] overflow-y-auto">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
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
  existingIps: string[];
  onAddCamera: (camera: CameraCreate) => Promise<void>;
  onComplete: () => void;
}

interface AddResult {
  ip: string;
  status: 'pending' | 'adding' | 'success' | 'error' | 'skipped';
  error?: string;
}

function DiscoverModal({ onClose, existingIps, onAddCamera, onComplete }: DiscoverModalProps) {
  const [network, setNetwork] = useState('192.168.1.0/24');
  const [selectedIps, setSelectedIps] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [addResults, setAddResults] = useState<AddResult[]>([]);

  const { data: discovered, isLoading, refetch } = useQuery({
    queryKey: ['discover-cameras', network],
    queryFn: () => cameraApi.discover(network),
    enabled: false,
  });

  // Filter out already existing cameras
  const existingSet = new Set(existingIps);
  const availableCameras = discovered?.filter((c) => !existingSet.has(c.ip_address)) || [];
  const existingCameras = discovered?.filter((c) => existingSet.has(c.ip_address)) || [];

  const handleDiscover = () => {
    setSelectedIps(new Set());
    setAddResults([]);
    refetch();
  };

  const toggleSelection = (ip: string) => {
    if (existingSet.has(ip)) return; // Can't select existing cameras
    setSelectedIps((prev) => {
      const next = new Set(prev);
      if (next.has(ip)) {
        next.delete(ip);
      } else {
        next.add(ip);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIps.size === availableCameras.length) {
      setSelectedIps(new Set());
    } else {
      setSelectedIps(new Set(availableCameras.map((c) => c.ip_address)));
    }
  };

  const handleAddSelected = async () => {
    if (!discovered) return;

    const camerasToAdd = discovered
      .filter((c) => selectedIps.has(c.ip_address))
      .map((camera) => ({
        name: camera.name || `Camera ${camera.ip_address}`,
        ip_address: camera.ip_address,
        port: camera.port,
        brand: camera.brand,
      }));

    setIsAdding(true);
    setAddResults(camerasToAdd.map((c) => ({ ip: c.ip_address, status: 'pending' })));
    const successfulIps = new Set<string>();

    for (let i = 0; i < camerasToAdd.length; i++) {
      const camera = camerasToAdd[i];

      // Update status to adding
      setAddResults((prev) =>
        prev.map((r) => (r.ip === camera.ip_address ? { ...r, status: 'adding' } : r))
      );

      try {
        await onAddCamera(camera);
        setAddResults((prev) =>
          prev.map((r) => (r.ip === camera.ip_address ? { ...r, status: 'success' } : r))
        );
        successfulIps.add(camera.ip_address);
      } catch (error: unknown) {
        let errorMsg = 'Failed to add';
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMsg = String(error.message);
        }
        setAddResults((prev) =>
          prev.map((r) => (r.ip === camera.ip_address ? { ...r, status: 'error', error: errorMsg } : r))
        );
      }
    }

    setIsAdding(false);
    onComplete();

    // Clear selection for successfully added cameras
    setSelectedIps((prev) => {
      const next = new Set(prev);
      successfulIps.forEach((ip) => next.delete(ip));
      return next;
    });
  };

  const allSelected = availableCameras.length > 0 && selectedIps.size === availableCameras.length;
  const someSelected = selectedIps.size > 0;
  const addResultsMap = new Map(addResults.map((r) => [r.ip, r]));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="bg-slate-800 rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Discover Cameras</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            placeholder="192.168.1.0/24"
          />
          <button
            onClick={handleDiscover}
            disabled={isLoading || isAdding}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan'}
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-1">
          {discovered && discovered.length === 0 && (
            <p className="text-slate-400 text-center py-8">No cameras found on this network</p>
          )}

          {discovered && discovered.length > 0 && (
            <div className="space-y-2">
              {/* Select All Header */}
              {availableCameras.length > 0 && (
                <div
                  className={`flex items-center gap-3 p-2 border-b border-slate-700 mb-2 rounded-lg transition-colors ${
                    isAdding ? 'opacity-50' : 'cursor-pointer hover:bg-slate-700/50'
                  }`}
                  onClick={isAdding ? undefined : toggleSelectAll}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                      allSelected
                        ? 'bg-blue-600 border-blue-600'
                        : someSelected
                          ? 'bg-blue-600/50 border-blue-500'
                          : 'bg-slate-700 border-2 border-slate-500 hover:border-slate-400'
                    }`}
                  >
                    {allSelected ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : someSelected ? (
                      <Minus className="w-3.5 h-3.5 text-white" />
                    ) : null}
                  </div>
                  <span className="text-slate-300 text-sm">
                    {selectedIps.size > 0
                      ? `${selectedIps.size} of ${availableCameras.length} selected`
                      : `Select all new (${availableCameras.length})`}
                  </span>
                </div>
              )}

              {/* Available cameras */}
              {availableCameras.map((camera) => {
                const result = addResultsMap.get(camera.ip_address);
                return (
                  <div
                    key={camera.ip_address}
                    onClick={isAdding ? undefined : () => toggleSelection(camera.ip_address)}
                    className={`rounded-lg p-3 flex items-start gap-3 transition-all ${
                      isAdding ? '' : 'cursor-pointer'
                    } ${
                      result?.status === 'success'
                        ? 'bg-green-600/20 border-2 border-green-500'
                        : result?.status === 'error'
                          ? 'bg-red-600/20 border-2 border-red-500'
                          : selectedIps.has(camera.ip_address)
                            ? 'bg-blue-600/20 border-2 border-blue-500'
                            : 'bg-slate-700 border-2 border-transparent hover:bg-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0 ${
                        result?.status === 'success'
                          ? 'bg-green-600'
                          : result?.status === 'error'
                            ? 'bg-red-600'
                            : result?.status === 'adding'
                              ? 'bg-blue-600'
                              : selectedIps.has(camera.ip_address)
                                ? 'bg-blue-600'
                                : 'bg-slate-600 border-2 border-slate-500'
                      }`}
                    >
                      {result?.status === 'adding' ? (
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                      ) : result?.status === 'success' ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : result?.status === 'error' ? (
                        <X className="w-3.5 h-3.5 text-white" />
                      ) : selectedIps.has(camera.ip_address) ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{camera.ip_address}:{camera.port}</p>
                      <p className="text-slate-400 text-sm">
                        {result?.status === 'success' ? (
                          <span className="text-green-400">Added successfully</span>
                        ) : result?.status === 'error' ? (
                          <span className="text-red-400">{result.error || 'Failed to add'}</span>
                        ) : (
                          <>
                            {camera.brand} {camera.is_dahua && '(Dahua)'}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Already added cameras */}
              {existingCameras.length > 0 && (
                <>
                  <div className="text-slate-500 text-xs uppercase tracking-wide mt-4 mb-2 px-2">
                    Already Added ({existingCameras.length})
                  </div>
                  {existingCameras.map((camera) => (
                    <div
                      key={camera.ip_address}
                      className="rounded-lg p-3 flex items-center gap-3 bg-slate-700/50 border-2 border-transparent opacity-60"
                    >
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-green-600/50 flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-green-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 font-medium">{camera.ip_address}:{camera.port}</p>
                        <p className="text-slate-500 text-sm">Already in your cameras</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            {addResults.some((r) => r.status === 'success') ? 'Done' : 'Close'}
          </button>
          {availableCameras.length > 0 && (
            <button
              onClick={handleAddSelected}
              disabled={!someSelected || isAdding}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Selected ({selectedIps.size})
                </>
              )}
            </button>
          )}
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
  const hasExistingCredentials = Boolean(camera.username && camera.has_password);
  const [formData, setFormData] = useState({
    name: camera.name,
    ip_address: camera.ip_address,
    port: camera.port,
    username: camera.username || '',
    password: '',
    rtsp_path: camera.rtsp_path,
    location: camera.location || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(!hasExistingCredentials);
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
    const requiresPasswordInput = !hasExistingCredentials || changePassword;
    if (!formData.username || (requiresPasswordInput && !formData.password)) {
      setTestStatus('error');
      setTestMessage(
        requiresPasswordInput
          ? 'Username and password are required'
          : 'Username is required'
      );
      return;
    }

    setTestStatus('testing');
    setTestMessage('');
    setLockTimeRemaining(null);
    setAttemptsRemaining(null);

    try {
      const payload: {
        ip: string;
        port: number;
        username: string;
        rtsp_path: string;
        password?: string;
      } = {
        ip: formData.ip_address,
        port: formData.port,
        username: formData.username,
        rtsp_path: formData.rtsp_path,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(`${API_BASE_URL}/api/cameras/${camera.id}/test-rtsp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    } catch {
      setTestStatus('error');
      setTestMessage('Failed to test connection');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<CameraCreate> = {
      name: formData.name,
      ip_address: formData.ip_address,
      port: formData.port,
      rtsp_path: formData.rtsp_path,
      location: formData.location || undefined,
    };
    if (formData.username) data.username = formData.username;
    if (formData.password) data.password = formData.password;
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="bg-slate-800 rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Edit Camera</h2>
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
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">IP Address <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={formData.ip_address}
              onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono"
              placeholder="192.168.1.100"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Username <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
                setTestStatus('idle');
              }}
              className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white ${
                !formData.username ? 'border-yellow-500/50' : 'border-slate-600'
              }`}
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Password {!hasExistingCredentials && <span className="text-red-400">*</span>}
            </label>
            {hasExistingCredentials && !changePassword ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-400">
                  ••••••••••••
                </div>
                <button
                  type="button"
                  onClick={() => setChangePassword(true)}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setTestStatus('idle');
                    }}
                    className={`w-full bg-slate-700 border rounded-lg px-3 py-2 pr-10 text-white ${
                      (!hasExistingCredentials || changePassword) && !formData.password ? 'border-yellow-500/50' : 'border-slate-600'
                    }`}
                    placeholder={hasExistingCredentials ? "Enter new password" : "Enter password"}
                    required={!hasExistingCredentials}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {hasExistingCredentials && (
                  <button
                    type="button"
                    onClick={() => {
                      setChangePassword(false);
                      setFormData({ ...formData, password: '' });
                    }}
                    className="text-slate-400 hover:text-slate-300 text-sm"
                  >
                    Cancel password change
                  </button>
                )}
              </div>
            )}
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
              disabled={
                testStatus === 'testing' ||
                testStatus === 'locked' ||
                !formData.ip_address ||
                !formData.username ||
                ((!hasExistingCredentials || changePassword) && !formData.password)
              }
              className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              title={
                (!hasExistingCredentials || changePassword) && !formData.password
                  ? "Enter password to test connection"
                  : "Test camera connection"
              }
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="w-full sm:w-auto px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full sm:w-auto px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.ip_address || !formData.username || (!hasExistingCredentials && !formData.password) || (changePassword && !formData.password)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
          {!formData.ip_address && (
            <p className="text-yellow-500 text-xs mt-2 text-right">
              IP address is required
            </p>
          )}
          {!formData.username && (
            <p className="text-yellow-500 text-xs mt-2 text-right">
              Username is required
            </p>
          )}
          {!hasExistingCredentials && !formData.password && (
            <p className="text-yellow-500 text-xs mt-2 text-right">
              Password is required for new cameras
            </p>
          )}
          {changePassword && !formData.password && hasExistingCredentials && (
            <p className="text-yellow-500 text-xs mt-2 text-right">
              Enter a new password or cancel the change
            </p>
          )}
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
      <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-900">
        <h2 className="text-base sm:text-xl font-semibold text-white truncate pr-3">{camera.name}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
      <div className="flex-1 min-h-0 p-2 sm:p-4">
        <CameraCard camera={camera} autoStartOnMount fitContainer />
      </div>
    </div>
  );
}
