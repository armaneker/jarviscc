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
  X,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
  { path: '/cameras', label: 'Security', icon: <Camera size={20} /> },
  { path: '/devices', label: 'Devices', icon: <Plug size={20} /> },
  { path: '/tasks', label: 'Tasks', icon: <ListTodo size={20} /> },
  { path: '/shopping', label: 'Shopping', icon: <ShoppingCart size={20} /> },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const isCollapsed = collapsed && !mobileOpen;

  return (
    <aside
      className={`
        fixed left-0 top-0 z-50 h-full w-64 border-r border-slate-700 bg-slate-900
        flex flex-col transform transition-all duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <span className="text-white font-semibold text-lg">JARVIS</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">J</span>
          </div>
        )}
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `
                }
                title={isCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings & Collapse */}
      <div className="p-2 border-t border-slate-700">
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-2
            ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }
            ${isCollapsed ? 'justify-center' : ''}
          `
          }
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings size={20} />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>

        <button
          type="button"
          onClick={onToggleCollapse}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-slate-400 hover:bg-slate-800 hover:text-white transition-colors
            ${isCollapsed ? 'justify-center' : ''}
            hidden lg:flex
          `}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
