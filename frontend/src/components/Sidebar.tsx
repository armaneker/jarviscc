import { NavLink } from 'react-router-dom';
import {
  Camera,
  Plug,
  ListTodo,
  ShoppingCart,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
  { path: '/cameras', label: 'Security', icon: <Camera size={20} /> },
  { path: '/devices', label: 'Devices', icon: <Plug size={20} /> },
  { path: '/tasks', label: 'Tasks', icon: <ListTodo size={20} /> },
  { path: '/shopping', label: 'Shopping', icon: <ShoppingCart size={20} /> },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-700
        flex flex-col transition-all duration-300 z-50
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <span className="text-white font-semibold text-lg">JARVIS</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">J</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `
                }
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings & Collapse */}
      <div className="p-2 border-t border-slate-700">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-2
            ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }
            ${collapsed ? 'justify-center' : ''}
          `
          }
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-slate-400 hover:bg-slate-800 hover:text-white transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
