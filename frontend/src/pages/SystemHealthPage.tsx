import React, { useEffect, useState } from 'react';
import { HeartPulse, CheckCircle2, RefreshCw, Cpu, Activity, Database, Radio, Terminal, Zap } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const SystemHealthPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const data = await api.getSystemHealth();
      setHealthData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">System Infrastructure Health</h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time status of hardware adapters, local execution loops, ML pipelines, and databases
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={healthData?.overall_status || 'HEALTHY'} size="md" />
          <button
            onClick={loadHealth}
            className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
            title="Refresh Health"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {healthData?.services?.map((svc: any) => (
          <div
            key={svc.name}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-gray-300 transition-all text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">{svc.name}</span>
              <StatusBadge status={svc.status} size="sm" />
            </div>

            <div className="text-gray-500">{svc.details}</div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between font-mono text-[11px] text-gray-400">
              <span>Response Latency:</span>
              <span className="font-bold text-gray-700">{svc.latency_ms}ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
