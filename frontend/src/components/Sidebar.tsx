import React from 'react';
import {
  LayoutDashboard,
  Network,
  Cpu,
  Activity,
  Sliders,
  AlertTriangle,
  FileText,
  Settings,
  Building2,
  Users,
  Shield,
  Layers,
  ChevronRight,
  HeartPulse,
  History,
  Terminal,
  Zap,
  Info,
} from 'lucide-react';
import { UserProfile } from '../types';

export type NavSection =
  | 'dashboard'
  | 'organization'
  | 'operations'
  | 'devices'
  | 'ai_models'
  | 'policies'
  | 'live_monitor'
  | 'runs'
  | 'faults'
  | 'commands'
  | 'events'
  | 'reports'
  | 'acceptance'
  | 'companies'
  | 'users_roles'
  | 'system_health'
  | 'about';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  user: UserProfile | null;
  openFaultsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  user,
  openFaultsCount = 0,
}) => {
  const isSuper = user?.is_super_admin ?? false;

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard' as NavSection, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'live_monitor' as NavSection, label: 'Live Monitor', icon: <Activity className="w-4 h-4 text-blue-600" /> },
      ],
    },
    {
      title: 'Operations',
      items: [
        { id: 'organization' as NavSection, label: 'Org Hierarchy', icon: <Network className="w-4 h-4" /> },
        { id: 'operations' as NavSection, label: 'Sites & Assets', icon: <Layers className="w-4 h-4" /> },
        { id: 'devices' as NavSection, label: 'BLE Devices', icon: <Cpu className="w-4 h-4" /> },
      ],
    },
    {
      title: 'AI & Safety',
      items: [
        { id: 'ai_models' as NavSection, label: 'AI Models', icon: <Zap className="w-4 h-4" /> },
        { id: 'policies' as NavSection, label: 'Decision Policies', icon: <Sliders className="w-4 h-4" /> },
        {
          id: 'faults' as NavSection,
          label: 'Fault Center',
          icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
          badge: openFaultsCount > 0 ? openFaultsCount : undefined,
        },
        { id: 'commands' as NavSection, label: 'Command Center', icon: <Terminal className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Analytics & Audit',
      items: [
        { id: 'events' as NavSection, label: 'Event Traces', icon: <History className="w-4 h-4" /> },
        { id: 'reports' as NavSection, label: 'Reports', icon: <FileText className="w-4 h-4" /> },
        { id: 'acceptance' as NavSection, label: 'Acceptance Tests', icon: <Shield className="w-4 h-4 text-emerald-600" /> },
      ],
    },
    {
      title: 'Administration',
      items: [
        ...(isSuper ? [{ id: 'companies' as NavSection, label: 'Companies (Multi-Tenant)', icon: <Building2 className="w-4 h-4 text-blue-600" /> }] : []),
        { id: 'users_roles' as NavSection, label: 'Users & RBAC', icon: <Users className="w-4 h-4" /> },
        { id: 'system_health' as NavSection, label: 'System Health', icon: <HeartPulse className="w-4 h-4" /> },
        { id: 'about' as NavSection, label: 'About & Credits', icon: <Info className="w-4 h-4 text-blue-600" /> },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-50/70 border-r border-gray-200 flex flex-col shrink-0 h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="p-3 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                      active
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">
                        {item.badge}
                      </span>
                    ) : (
                      active && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-3 border-t border-gray-200 bg-white/50 text-[11px] text-gray-400 flex items-center justify-between">
        <span>Aperture v1.0.0</span>
        <span className="font-mono">Local-First</span>
      </div>
    </aside>
  );
};
