import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, AlertCircle, Plug, X, Power, PowerOff } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { deviceApi } from '../services/api';
import type { Device, DeviceCreate } from '../types';

const deviceTypes = [
  { value: 'dishwasher', label: 'Dishwasher' },
  { value: 'refrigerator', label: 'Refrigerator' },
  { value: 'washer', label: 'Washer' },
  { value: 'dryer', label: 'Dryer' },
  { value: 'oven', label: 'Oven' },
  { value: 'ac', label: 'Air Conditioner' },
  { value: 'smart_plug', label: 'Smart Plug' },
  { value: 'light', label: 'Light' },
  { value: 'other', label: 'Other' },
];

const statusColors: Record<string, string> = {
  on: 'bg-green-500',
  off: 'bg-slate-500',
  running: 'bg-blue-500',
  idle: 'bg-yellow-500',
  unknown: 'bg-slate-600',
};

export default function Devices() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const { data: devices, isLoading, error } = useQuery({
    queryKey: ['devices', selectedRoom],
    queryFn: () => deviceApi.getAll(selectedRoom || undefined),
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: deviceApi.getRooms,
  });

  const addDeviceMutation = useMutation({
    mutationFn: deviceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setShowAddModal(false);
    },
  });

  const controlMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) => deviceApi.control(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  // Group devices by room
  const devicesByRoom = devices?.reduce((acc, device) => {
    const room = device.room || 'Unassigned';
    if (!acc[room]) acc[room] = [];
    acc[room].push(device);
    return acc;
  }, {} as Record<string, Device[]>);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Smart Devices"
        subtitle={`${devices?.length || 0} devices connected`}
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex w-full items-center justify-center gap-2 px-4 py-2 sm:w-auto bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Device</span>
          </button>
        }
      />

      {/* Room Filter */}
      {rooms && rooms.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedRoom(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedRoom === null
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Rooms
          </button>
          {rooms.map((room) => (
            <button
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedRoom === room
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {room}
            </button>
          ))}
        </div>
      )}

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
          <span className="text-red-200">Failed to load devices.</span>
        </div>
      )}

      {/* Empty State */}
      {devices && devices.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-8 sm:p-12 text-center">
          <Plug className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No devices configured</h3>
          <p className="text-slate-400 mb-6">
            Add your smart devices to control them from here.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Device</span>
          </button>
        </div>
      )}

      {/* Devices by Room */}
      {devicesByRoom && Object.keys(devicesByRoom).length > 0 && (
        <div className="space-y-8">
          {Object.entries(devicesByRoom).map(([room, roomDevices]) => (
            <div key={room}>
              <h2 className="text-lg font-semibold text-white mb-4">{room}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roomDevices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    onControl={(action) => controlMutation.mutate({ id: device.id, action })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <AddDeviceModal
          onClose={() => setShowAddModal(false)}
          onAdd={(device) => addDeviceMutation.mutate(device)}
          isLoading={addDeviceMutation.isPending}
        />
      )}
    </div>
  );
}

// Device Card Component
interface DeviceCardProps {
  device: Device;
  onControl: (action: string) => void;
}

function DeviceCard({ device, onControl }: DeviceCardProps) {
  const isOn = device.status === 'on' || device.status === 'running';

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${statusColors[device.status] || statusColors.unknown}`} />
          <div className="min-w-0">
            <h3 className="truncate text-white font-medium">{device.name}</h3>
            <p className="text-slate-400 text-sm capitalize">{device.type}</p>
          </div>
        </div>
        {device.brand && (
          <span className="text-xs text-slate-500">{device.brand}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-400 capitalize">{device.status}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onControl(isOn ? 'off' : 'on')}
            className={`p-2 rounded-lg transition-colors ${
              isOn
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            {isOn ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Device Modal
interface AddDeviceModalProps {
  onClose: () => void;
  onAdd: (device: DeviceCreate) => void;
  isLoading: boolean;
}

function AddDeviceModal({ onClose, onAdd, isLoading }: AddDeviceModalProps) {
  const [formData, setFormData] = useState<DeviceCreate>({
    name: '',
    type: 'smart_plug',
    brand: '',
    room: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="bg-slate-800 rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Add Device</h2>
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
              placeholder="Living Room Lamp"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              {deviceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                placeholder="Samsung"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Room</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                placeholder="Kitchen"
              />
            </div>
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
