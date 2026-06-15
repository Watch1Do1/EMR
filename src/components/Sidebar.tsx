import { 
  Activity, 
  Calendar, 
  ClipboardList, 
  LayoutDashboard, 
  Settings, 
  Users, 
  Contact, 
  ShieldAlert, 
  Smile, 
  UserCheck 
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Patients', path: '/patients' },
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
  { icon: Contact, label: 'Front Desk Hub', path: '/frontdesk' },
  { icon: Activity, label: 'Back Office (MA)', path: '/backoffice' },
  { icon: ClipboardList, label: 'Tasks', path: '/tasks' },
  { icon: ShieldAlert, label: 'System status', path: '/admin' },
];

export function Sidebar() {
  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('emr_active_role') || 'provider';
  });

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    setActiveRole(role);
    localStorage.setItem('emr_active_role', role);
    window.dispatchEvent(new Event('storage'));
    // Trigger quick page reload to re-route home dashboards smoothly
    window.location.reload();
  };

  const getProfileInfo = () => {
    switch (activeRole) {
      case 'front_desk':
        return {
          initials: 'SC',
          name: 'Sarah Connor',
          title: 'Front Office Lead',
          colorClass: 'bg-emerald-100 text-emerald-700'
        };
      case 'ma':
        return {
          initials: 'CM',
          name: 'Carey Mills, MA',
          title: 'Medical Assistant',
          colorClass: 'bg-indigo-100 text-indigo-700'
        };
      case 'provider':
      default:
        return {
          initials: 'JS',
          name: 'Dr. John Smith',
          title: 'Attending Physician',
          colorClass: 'bg-blue-100 text-blue-700'
        };
    }
  };

  const currentProfile = getProfileInfo();

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col h-screen sticky top-0 no-print">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Activity className="text-blue-600 animate-pulse" size={24} />
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

      <div className="p-4 border-t border-slate-200 space-y-3">
        {/* Active Role Quick Toggle selection */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
            Active EMR Role Log-In
          </label>
          <select
            value={activeRole}
            onChange={handleRoleChange}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xs"
          >
            <option value="provider">🧑‍⚕️ Provider (Clinician)</option>
            <option value="front_desk">📋 Front Office (Reception)</option>
            <option value="ma">🩺 Medical Assistant (MA)</option>
          </select>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3 px-1">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shadow-sm", currentProfile.colorClass)}>
              {currentProfile.initials}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-bold text-slate-900 truncate leading-tight">{currentProfile.name}</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{currentProfile.title}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
