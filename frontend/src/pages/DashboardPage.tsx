import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  Cpu,
  Layers,
  AlertTriangle,
  Terminal,
  Activity,
  CheckCircle,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { UserProfile, Company } from '../types';
import { api } from '../services/api';

interface DashboardPageProps {
  user: UserProfile | null;
  companies: Company[];
  selectedCompanyId: string | null;
  onOpenCompanyWizard: () => void;
  onNavigateToLive: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  companies,
  selectedCompanyId,
  onOpenCompanyWizard,
  onNavigateToLive,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const isSuper = user?.is_super_admin && !selectedCompanyId;

  useEffect(() => {
    loadDashboardData();
  }, [selectedCompanyId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const compId = selectedCompanyId || (user?.company_id ?? undefined);
      if (compId) {
        const s = await api.getCompanyStats(compId);
        setStats(s);
      } else {
        const s = await api.getPlatformStats();
        setStats(s);
      }

      const events = await api.getEvents(compId);
      setRecentEvents(events.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {isSuper ? 'Platform Overview' : `${stats?.company_name || 'Enterprise'} Overview`}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {isSuper ? 'GLOBAL MULTI-TENANT' : 'COMPANY SCOPE'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Automotive Tool Assembly Physical Monitoring & Deterministic Safety Control
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.is_super_admin && (
            <button
              onClick={onOpenCompanyWizard}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Company</span>
            </button>
          )}

          <button
            onClick={onNavigateToLive}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Launch Live Monitor</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Section 17 & 18) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isSuper && (
          <MetricCard
            label="Total Companies"
            value={companies.length}
            subtitle={`${companies.filter((c) => c.status === 'ACTIVE').length} Active Tenants`}
            icon={<Building2 className="w-4 h-4" />}
            highlightColor="blue"
          />
        )}
        <MetricCard
          label="Active Users"
          value={stats?.total_users ?? 0}
          subtitle="Scoped Personnel"
          icon={<Users className="w-4 h-4" />}
          highlightColor="gray"
        />
        <MetricCard
          label="Connected Devices"
          value={stats?.connected_devices ?? 0}
          subtitle="Triaxial BLE Sensors"
          icon={<Cpu className="w-4 h-4" />}
          highlightColor="green"
        />
        <MetricCard
          label="Monitored Stations"
          value={stats?.total_stations ?? 0}
          subtitle={`${stats?.active_assets ?? 0} Motor Assets`}
          icon={<Layers className="w-4 h-4" />}
          highlightColor="gray"
        />
        <MetricCard
          label="Active Latched Faults"
          value={stats?.open_faults ?? 0}
          subtitle={stats?.open_faults > 0 ? 'Requires Operator Reset' : 'All Interlocks Clear'}
          icon={<AlertTriangle className="w-4 h-4" />}
          highlightColor={stats?.open_faults > 0 ? 'red' : 'green'}
        />
      </div>

      {/* System Status & Recent Event Trace Chain */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Operational Health */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-semibold text-gray-900">Execution Layer Status</h3>
            <span className="text-[11px] text-gray-400">Local Gateway</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="text-gray-600 font-medium">BLE Telemetry Bus</span>
              <StatusBadge status="HEALTHY" size="sm" />
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="text-gray-600 font-medium">Local Motor Controller</span>
              <StatusBadge status="READY" size="sm" />
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="text-gray-600 font-medium">ML Disturbance Model</span>
              <span className="font-mono text-gray-700 bg-white px-2 py-0.5 border rounded">motor_v1</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="text-gray-600 font-medium">Deterministic Safety Policy</span>
              <span className="text-emerald-700 font-semibold">2-Window Latch</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
              <span className="text-gray-600 font-medium">Watchdog Timeout</span>
              <span className="font-mono text-gray-700">&gt; 3.0s Auto-Trip</span>
            </div>
          </div>
        </div>

        {/* Right: Recent Physical Event Traces (Section 38) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Recent Physical Execution Traces</h3>
              <p className="text-[11px] text-gray-500">
                Full end-to-end chain: Sensor &rarr; Telemetry &rarr; ML &rarr; Policy &rarr; Command &rarr; RPM Feedback
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {recentEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Awaiting telemetry cycles. Run live monitoring to log event chains.
              </div>
            ) : (
              recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 bg-gray-50/70 border border-gray-200 rounded-lg text-xs flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-blue-600">{evt.trace_id}</span>
                      <span className="text-gray-400">&bull;</span>
                      <span className="font-medium text-gray-800">{evt.summary || 'Pipeline Cycle'}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">
                      Feedback: {evt.physical_result_rpm !== undefined ? `${evt.physical_result_rpm} RPM` : 'N/A'} &bull;{' '}
                      Duration: {evt.duration_ms}ms
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-gray-400 shrink-0">
                    {new Date(evt.timestamp_utc).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
