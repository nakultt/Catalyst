import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageCircle,
  MapIcon,
  Radar,
  Presentation,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Catalyst AI', to: '/sahayak-ai', icon: MessageCircle },
  { name: 'Funding Route Map', to: '/route-map', icon: MapIcon },
  { name: 'Opportunities Radar', to: '/opportunities', icon: Radar },
  { name: 'Pitch Analyzer', to: '/pitch-analyzer', icon: Presentation },
];

export default function Sidebar() {
  return (
    <div className="w-64 h-screen glass-panel fixed left-0 top-0 flex flex-col border-r border-slate-200 z-50">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Catalyst</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className={`w-5 h-5 transition-colors duration-200`} />
              <span className="tracking-wide">{item.name}</span>
            </NavLink>
        ))}
      </nav>

      
    </div>
  );
}
