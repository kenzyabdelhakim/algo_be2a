import { useState } from 'react';
import {
  LayoutDashboard,
  Route,
  AlertTriangle,
  Bus,
  Network,
  GitCompare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'route-planner', label: 'Route Planner', icon: Route },
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
    { id: 'public-transport', label: 'Public Transport', icon: Bus },
    { id: 'infrastructure', label: 'Infrastructure (MST)', icon: Network },
    { id: 'compare', label: 'Compare Algorithms', icon: GitCompare },
  ];

  return (
    <div
      className={`relative h-full bg-gradient-to-b from-[#0a0a1e] to-[#1a0a2e] border-r border-white/10 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && (
            <div>
              <h1 className="text-3xl mb-1 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent" style={{ fontFamily: 'Arial, sans-serif' }}>
                مسار
              </h1>
              <p className="text-xs text-gray-400">Masar – Smart Traffic System</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 shadow-lg shadow-blue-500/20'
                    : 'hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                {!isCollapsed && (
                  <span className={`${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
