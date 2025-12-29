/**
 * Sidebar Component
 * Main navigation for the application
 */
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Map,
  Video,
  Sparkles,
  Settings,
  Rocket,
} from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/25'
            : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
        }`
      }
    >
      {icon}
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold gradient-text">Validator</h1>
            <p className="text-xs text-dark-400">Funding Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavItem
          to="/"
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Dashboard"
        />
        <NavItem
          to="/chat"
          icon={<MessageSquare className="w-5 h-5" />}
          label="Sahayak AI"
        />
        <NavItem
          to="/route-map"
          icon={<Map className="w-5 h-5" />}
          label="Funding Route"
        />
        <NavItem
          to="/pitch"
          icon={<Video className="w-5 h-5" />}
          label="Pitch Analyzer"
        />
        <NavItem
          to="/opportunities"
          icon={<Sparkles className="w-5 h-5" />}
          label="Opportunities"
        />
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-700/50">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </NavLink>
        <div className="mt-4 px-4">
          <div className="flex items-center gap-2">
            <div className="pulse-dot" />
            <span className="text-xs text-dark-400">System Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
