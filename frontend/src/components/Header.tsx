import React, { useState } from 'react';
import {
  Activity,
  Building2,
  ChevronDown,
  Bell,
  LogOut,
  ShieldCheck,
  Radio,
  Wifi,
  WifiOff,
  User,
  Sliders,
} from 'lucide-react';
import { UserProfile, Company } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  companies: Company[];
  selectedCompanyId: string | null;
  onSelectCompany: (id: string | null) => void;
  breadcrumbs: string[];
  wsConnected: boolean;
  onLogout: () => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  companies,
  selectedCompanyId,
  onSelectCompany,
  breadcrumbs,
  wsConnected,
  onLogout,
  demoMode,
  onToggleDemoMode,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Branding & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-semibold text-gray-900 text-sm tracking-tight hidden md:inline">
            Aperture AIoT
          </span>
        </div>

        <div className="h-5 w-px bg-gray-200" />

        {/* Global Company Switcher (Super Admin) or Static Tenant Badge */}
        {user?.is_super_admin ? (
          <div className="relative">
            <select
              value={selectedCompanyId || ''}
              onChange={(e) => onSelectCompany(e.target.value || null)}
              className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Companies (Platform)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-700">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{user?.company_name || 'My Company'}</span>
          </div>
        )}

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500">
          <span>/</span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span className={idx === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : 'text-gray-500'}>
                {crumb}
              </span>
              {idx < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Environment, WS Status, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Environment toggle */}
        <button
          onClick={onToggleDemoMode}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
            demoMode
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
          title="Toggle Simulation / Demo Mode"
        >
          {demoMode ? 'DEMO ENVIRONMENT' : 'PRODUCTION'}
        </button>

        {/* Real-time WebSocket connection state */}
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
            wsConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}
          title={wsConnected ? 'WebSocket live stream connected' : 'WebSocket reconnecting...'}
        >
          {wsConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-gray-400" />}
          <span className="hidden sm:inline">{wsConnected ? 'LIVE' : 'CONNECTING'}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs z-50 animate-in fade-in">
              <div className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-2 flex justify-between items-center">
                <span>System Notifications</span>
                <span className="text-[10px] text-gray-400 font-normal">Real-time</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="p-2 bg-blue-50 border border-blue-100 rounded-md">
                  <div className="font-medium text-blue-900">Safety State Ready</div>
                  <div className="text-blue-700 text-[11px] mt-0.5">Automotive Tool Spindle A monitoring active.</div>
                </div>
                <div className="p-2 bg-gray-50 border border-gray-100 rounded-md">
                  <div className="font-medium text-gray-800">Model Deployment v1.0</div>
                  <div className="text-gray-500 text-[11px] mt-0.5">motor_v1 calibrated and running inference.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-2 hover:bg-gray-100 rounded-lg text-left cursor-pointer transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-xs">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-xs">
              <div className="font-medium text-gray-900 leading-tight truncate max-w-[120px]">
                {user?.full_name || 'Operator'}
              </div>
              <div className="text-[10px] text-gray-500 leading-tight">
                {user?.is_super_admin ? 'SUPER ADMIN' : user?.roles[0] || 'USER'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-2 text-xs z-50 animate-in fade-in">
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <div className="font-medium text-gray-900">{user?.full_name}</div>
                <div className="text-gray-500 text-[11px] truncate">{user?.email}</div>
                <div className="mt-1">
                  <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded border border-blue-200">
                    {user?.is_super_admin ? 'GLOBAL SUPER ADMIN' : user?.roles[0]}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-left cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
