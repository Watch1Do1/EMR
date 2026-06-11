import { Activity, Calendar, ClipboardList, LayoutDashboard, Search, Settings, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Patients', path: '/patients' },
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
  { icon: ClipboardList, label: 'Tasks', path: '/tasks' },
  { icon: Activity, label: 'System status', path: '/admin' },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col h-screen sticky top-0 no-print">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Activity className="text-blue-600" size={24} />
          <span>Narrative EMR</span>
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
          <Settings size={18} />
          Settings
        </button>
        <div className="px-3 py-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
              JS
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-slate-900 truncate">Dr. John Smith</p>
              <p className="text-xs text-slate-500 truncate">Attending Physician</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
