// Camera types
export interface Camera {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  username?: string;
  password?: string;
  rtsp_path: string;
  location?: string;
  brand: string;
  channels: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  stream_url?: string;
}

export interface CameraCreate {
  name: string;
  ip_address: string;
  port?: number;
  username?: string;
  password?: string;
  rtsp_path?: string;
  location?: string;
  brand?: string;
  channels?: number;
}

export interface CameraDiscovery {
  ip_address: string;
  port: number;
  brand: string;
  name?: string;
  is_dahua: boolean;
  mac_address?: string;
}

// Device types
export interface Device {
  id: number;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  ip_address?: string;
  room?: string;
  status: string;
  integration_type?: string;
  integration_config?: Record<string, unknown>;
  last_updated: string;
  created_at: string;
}

export interface DeviceCreate {
  name: string;
  type: string;
  brand?: string;
  model?: string;
  ip_address?: string;
  room?: string;
  integration_type?: string;
  integration_config?: Record<string, unknown>;
}

// Task types
export interface Task {
  id: number;
  title: string;
  description?: string;
  category: string;
  priority: string;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  due_date?: string;
}

// Shopping types
export interface ShoppingItem {
  id: number;
  item: string;
  quantity: number;
  unit?: string;
  category: string;
  estimated_price?: number;
  notes?: string;
  purchased: boolean;
  purchased_at?: string;
  added_at: string;
}

export interface ShoppingItemCreate {
  item: string;
  quantity?: number;
  unit?: string;
  category?: string;
  estimated_price?: number;
  notes?: string;
}

// Stats
export interface Stats {
  cameras: {
    total: number;
    active: number;
    streaming: number;
  };
  devices: {
    total: number;
  };
  tasks: {
    total: number;
    pending: number;
    completed: number;
  };
  shopping: {
    total: number;
    pending: number;
  };
}
