import axios from 'axios';
import type {
  Camera,
  CameraCreate,
  CameraDiscovery,
  Device,
  DeviceCreate,
  Task,
  TaskCreate,
  ShoppingItem,
  ShoppingItemCreate,
  Stats,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8101';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Camera API
export const cameraApi = {
  getAll: async (activeOnly = false): Promise<Camera[]> => {
    const { data } = await api.get('/cameras/', { params: { active_only: activeOnly } });
    return data;
  },

  getById: async (id: number): Promise<Camera> => {
    const { data } = await api.get(`/cameras/${id}`);
    return data;
  },

  create: async (camera: CameraCreate): Promise<Camera> => {
    const { data } = await api.post('/cameras/', camera);
    return data;
  },

  update: async (id: number, camera: Partial<CameraCreate>): Promise<Camera> => {
    const { data } = await api.put(`/cameras/${id}`, camera);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/cameras/${id}`);
  },

  discover: async (network = '192.168.1.0/24'): Promise<CameraDiscovery[]> => {
    const { data } = await api.get('/cameras/discover', { params: { network } });
    return data;
  },

  test: async (id: number): Promise<{ status: string; message: string }> => {
    const { data } = await api.post(`/cameras/${id}/test`);
    return data;
  },
};

// Stream API
export const streamApi = {
  start: async (cameraId: number): Promise<{ status: string; stream_url: string }> => {
    const { data } = await api.post(`/streams/${cameraId}/start`);
    return data;
  },

  stop: async (cameraId: number): Promise<{ status: string }> => {
    const { data } = await api.post(`/streams/${cameraId}/stop`);
    return data;
  },

  getStatus: async (cameraId: number): Promise<{ camera_id: number; streaming: boolean; stream_url?: string }> => {
    const { data } = await api.get(`/streams/${cameraId}/status`);
    return data;
  },
};

// Device API
export const deviceApi = {
  getAll: async (room?: string, type?: string): Promise<Device[]> => {
    const { data } = await api.get('/devices/', { params: { room, device_type: type } });
    return data;
  },

  getById: async (id: number): Promise<Device> => {
    const { data } = await api.get(`/devices/${id}`);
    return data;
  },

  create: async (device: DeviceCreate): Promise<Device> => {
    const { data } = await api.post('/devices/', device);
    return data;
  },

  update: async (id: number, device: Partial<DeviceCreate>): Promise<Device> => {
    const { data } = await api.put(`/devices/${id}`, device);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/devices/${id}`);
  },

  getRooms: async (): Promise<string[]> => {
    const { data } = await api.get('/devices/rooms');
    return data;
  },

  getTypes: async (): Promise<string[]> => {
    const { data } = await api.get('/devices/types');
    return data;
  },

  control: async (id: number, action: string): Promise<{ status: string; action: string }> => {
    const { data } = await api.post(`/devices/${id}/control`, null, { params: { action } });
    return data;
  },
};

// Task API
export const taskApi = {
  getAll: async (filters?: { category?: string; priority?: string; completed?: boolean }): Promise<Task[]> => {
    const { data } = await api.get('/tasks/', { params: filters });
    return data;
  },

  getById: async (id: number): Promise<Task> => {
    const { data } = await api.get(`/tasks/${id}`);
    return data;
  },

  create: async (task: TaskCreate): Promise<Task> => {
    const { data } = await api.post('/tasks/', task);
    return data;
  },

  update: async (id: number, task: Partial<TaskCreate & { completed: boolean }>): Promise<Task> => {
    const { data } = await api.put(`/tasks/${id}`, task);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  toggle: async (id: number): Promise<Task> => {
    const { data } = await api.post(`/tasks/${id}/toggle`);
    return data;
  },

  getCategories: async (): Promise<string[]> => {
    const { data } = await api.get('/tasks/categories');
    return data;
  },

  getPriorities: async (): Promise<string[]> => {
    const { data } = await api.get('/tasks/priorities');
    return data;
  },
};

// Shopping API
export const shoppingApi = {
  getAll: async (filters?: { category?: string; purchased?: boolean }): Promise<ShoppingItem[]> => {
    const { data } = await api.get('/shopping/', { params: filters });
    return data;
  },

  getById: async (id: number): Promise<ShoppingItem> => {
    const { data } = await api.get(`/shopping/${id}`);
    return data;
  },

  create: async (item: ShoppingItemCreate): Promise<ShoppingItem> => {
    const { data } = await api.post('/shopping/', item);
    return data;
  },

  update: async (id: number, item: Partial<ShoppingItemCreate & { purchased: boolean }>): Promise<ShoppingItem> => {
    const { data } = await api.put(`/shopping/${id}`, item);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/shopping/${id}`);
  },

  toggle: async (id: number): Promise<ShoppingItem> => {
    const { data } = await api.post(`/shopping/${id}/toggle`);
    return data;
  },

  clearPurchased: async (): Promise<void> => {
    await api.delete('/shopping/clear-purchased');
  },

  getCategories: async (): Promise<string[]> => {
    const { data } = await api.get('/shopping/categories');
    return data;
  },
};

// Stats API
export const statsApi = {
  get: async (): Promise<Stats> => {
    const { data } = await api.get('/stats');
    return data;
  },
};

// Health API
export const healthApi = {
  check: async (): Promise<{ status: string; active_streams: number[] }> => {
    const { data } = await api.get('/health');
    return data;
  },
};

export { API_BASE_URL };
export default api;
