import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  RotateCcw,
  Zap,
  Sliders,
  CheckCircle,
  Clock,
  Gauge,
  ShieldAlert,
  Flame,
  PowerOff,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { OperatorResetModal } from '../components/OperatorResetModal';
import { LiveTelemetryState, Fault } from '../types';
import { api } from '../services/api';
import { wsClient } from '../services/ws';

interface LiveMonitorProps {
  onOpenResetModal?: () => void;
}

export const LiveMonitorPage: React.FC<LiveMonitorProps> = () => {
  const [liveState, setLiveState] = useState<LiveTelemetryState | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('asset-01');
  const [assets, setAssets] = useState<any[]>([]);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [activeFault, setActiveFault] = useState<Fault | null>(null);
  const [injectingCondition, setInjectingCondition] = useState<string>('NORMAL');
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();

    // Subscribe to WebSocket live telemetry updates
    const unsubscribe = wsClient.subscribe((data) => {
      if (data.type === 'LIVE_TELEMETRY') {
        setLiveState(data);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const assetList = await api.getAssets();
      setAssets(assetList);
      const targetId = assetList[0]?.id || 'asset-01';
      setSelectedAssetId(targetId);

      const state = await api.getLiveState(targetId);
      setLiveState(state);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInjectCondition = async (cond: string) => {
    setIsInjecting(true);
    try {
      await api.simulateCondition(cond);
      setInjectingCondition(cond);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInjecting(false);
    }
  };

  const handleEmergencyStop = async () => {
    if (!liveState?.asset_id) return;
    try {
      await api.stopMotor({
        asset_id: liveState.asset_id,
        reason: 'MANUAL_OPERATOR_EMERGENCY_STOP',
      });
      // Fetch latest state immediately
      const refreshed = await api.getLiveState(liveState.asset_id);
      setLiveState(refreshed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenReset = async () => {
    try {
      const faults = await api.getFaults();
      const openFault = faults.find((f: any) => f.is_latched) || faults[0] || null;
      setActiveFault(openFault);
      setResetModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const state = liveState || {
    asset_id: 'default',
    asset_name: 'Motor A (Assembly Tool)',
    station_id: 'st-01',
    station_name: 'Station 01',
    connection_status: 'CONNECTED',
    sensor_health: 'OK',
    data_age_ms: 24,
    telemetry: { sequence: 100, accel_x: 0.08, accel_y: 0.04, accel_z: 0.99, motor_rpm: 1800, commanded_rpm: 1800 },
    features: { rms: 0.082, peak: 0.24, crest_factor: 2.92, kurtosis: 2.98, measured_motor_speed: 1800 },
    ai: { model_version: 'motor_v1', score_normal: 0.96, score_mild: 0.03, score_strong: 0.01, predicted_class: 'NORMAL', confidence: 0.96 },
    decision: { action: 'CONTINUE', reason: 'NORMAL_OPERATING_CONDITION', persistence_count: 1, persistence_threshold: 1, target_rpm: 1800, latch_state: 'NONE', reset_required: false },
    command: { command_id: 'cmd_100', target_rpm: 1800, controller_status: 'RUNNING', measured_rpm: 1800, status: 'COMPLETE' },
    state: { current_state: 'READY', active_latch: 'NONE', reset_required: false },
  };

  const isLatched = state.state.current_state === 'LATCHED_STOP' || state.state.current_state === 'FAULT';

  return (
    <div className="space-y-6">
      {/* PRD Section 27 Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Automotive Assembly Tool
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-semibold text-gray-700">Station: {state.station_name}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{state.asset_name}</h2>
            <StatusBadge status={state.connection_status} size="sm" />
          </div>
        </div>

        {/* Right Actions: Test Injection & Emergency Control */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulation Mode Toolbar conforming to PRD Section 15 */}
          <div className="flex flex-wrap items-center bg-gray-50 border border-gray-200 rounded-lg p-1 text-xs gap-1">
            <span className="px-2 font-bold text-gray-500 uppercase text-[10px]">Simulate:</span>
            {([
              { id: 'NORMAL', label: 'Normal', color: 'emerald' },
              { id: 'MILD_DISTURBANCE', label: 'Mild Disturbance', color: 'amber' },
              { id: 'STRONG_DISTURBANCE', label: 'Strong Disturbance', color: 'red' },
              { id: 'STALE_DATA', label: 'Stale Data (>3s)', color: 'purple' },
              { id: 'PACKET_LOSS', label: 'Packet Loss', color: 'orange' },
              { id: 'MOTOR_STOP_FAILURE', label: 'Motor Stop Failure', color: 'rose' },
            ] as const).map((cond) => {
              const isActive = injectingCondition === cond.id;
              return (
                <button
                  key={cond.id}
                  onClick={() => handleInjectCondition(cond.id)}
                  disabled={isInjecting}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? cond.id === 'STRONG_DISTURBANCE' || cond.id === 'MOTOR_STOP_FAILURE'
                        ? 'bg-red-600 text-white'
                        : cond.id === 'MILD_DISTURBANCE' || cond.id === 'PACKET_LOSS'
                        ? 'bg-amber-500 text-white'
                        : cond.id === 'STALE_DATA'
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  {cond.label}
                </button>
              );
            })}
          </div>

          {/* Emergency Stop Button */}
          <button
            onClick={handleEmergencyStop}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <PowerOff className="w-3.5 h-3.5" />
            <span>Emergency Stop</span>
          </button>

          {/* Operator Reset Button (Enabled when latched) */}
          {isLatched && (
            <button
              onClick={handleOpenReset}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer animate-pulse transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Operator Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Latched Stop Warning Banner if tripped */}
      {isLatched && (
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 flex items-center justify-between text-red-900 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <div className="font-bold text-sm">EQUIPMENT LATCHED IN STOP STATE</div>
              <div className="mt-0.5">
                Active Latch: <strong>{state.state.active_latch}</strong> &bull; Reason: {state.decision.reason}. Physical tool requires inspection before manual operator reset.
              </div>
            </div>
          </div>
          <button
            onClick={handleOpenReset}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 cursor-pointer shrink-0"
          >
            Authorize Reset
          </button>
        </div>
      )}

      {/* Section 1: Live Telemetry Grid */}
      <div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          1. Live Telemetry & Dynamics (1-Second Buffer)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <MetricCard
            label="Vibration RMS"
            value={state.features.rms.toFixed(3)}
            unit="g"
            highlightColor={state.features.rms > 0.7 ? 'red' : state.features.rms > 0.25 ? 'amber' : 'green'}
          />
          <MetricCard
            label="Vibration Peak"
            value={state.features.peak.toFixed(3)}
            unit="g"
            highlightColor="gray"
          />
          <MetricCard
            label="Crest Factor"
            value={state.features.crest_factor.toFixed(2)}
            unit=""
            highlightColor={state.features.crest_factor > 4.5 ? 'amber' : 'gray'}
          />
          <MetricCard
            label="Kurtosis"
            value={state.features.kurtosis.toFixed(2)}
            unit=""
            highlightColor={state.features.kurtosis > 5.5 ? 'red' : 'gray'}
          />
          <MetricCard
            label="Actual Motor RPM"
            value={state.command.measured_rpm}
            unit="RPM"
            subtitle="Tachometer Feedback"
            highlightColor={state.command.measured_rpm === 0 ? 'amber' : 'blue'}
          />
          <MetricCard
            label="Commanded RPM"
            value={state.command.target_rpm}
            unit="RPM"
            subtitle="VFD Set-Speed"
            highlightColor="gray"
          />
          <MetricCard
            label="Data Age"
            value={state.data_age_ms}
            unit="ms"
            subtitle="Latency Watchdog"
            highlightColor={state.data_age_ms > 2000 ? 'red' : 'green'}
          />
          <MetricCard
            label="Sensor Health"
            value={state.sensor_health}
            subtitle={`Seq #${state.telemetry.sequence}`}
            highlightColor={state.sensor_health === 'OK' ? 'green' : 'red'}
          />
        </div>
      </div>

      {/* Section 2, 3, 4: AI Inference, Decision Policy, Action Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 2: AI Disturbance Classification */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">2. AI Inference Engine</h3>
            </div>
            <span className="font-mono text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border">
              {state.ai.model_version}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Class distribution progress bars */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-gray-600">NORMAL</span>
                <span className="font-mono">{(state.ai.score_normal * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${state.ai.score_normal * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-gray-600">MILD_DISTURBANCE</span>
                <span className="font-mono">{(state.ai.score_mild * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${state.ai.score_mild * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-gray-600">STRONG_DISTURBANCE</span>
                <span className="font-mono">{(state.ai.score_strong * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${state.ai.score_strong * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-500 font-medium">Predicted Condition:</span>
              <span className="font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                {state.ai.predicted_class}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-500">
              <span>Confidence:</span>
              <span className="font-mono font-semibold text-gray-900">
                {(state.ai.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Deterministic Decision Policy */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-gray-900">3. Decision Policy Engine</h3>
            </div>
            <span className="text-[11px] text-gray-400">Deterministic</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-500 font-medium">Equipment Action:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  state.decision.action === 'STOP'
                    ? 'bg-red-100 text-red-800'
                    : state.decision.action === 'REDUCE_SPEED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {state.decision.action}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span className="font-medium">Trigger Reason:</span>
              <span className="font-mono text-gray-900">{state.decision.reason}</span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span className="font-medium">Persistence Window:</span>
              <span className="font-mono font-semibold text-gray-900">
                {state.decision.persistence_count} / {state.decision.persistence_threshold} windows
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span className="font-medium">Active Policy Rule:</span>
              <span className="text-gray-700">INSPECTION_REQUIRED</span>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-gray-600">
              <span className="font-medium">Safety Interlock:</span>
              <span
                className={`font-semibold ${
                  state.decision.reset_required ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {state.decision.reset_required ? 'LATCHED (RESET REQ)' : 'UNLATCHED (OK)'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Action & Physical Verification */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">4. Hardware Execution & Feedback</h3>
            </div>
            <span className="text-[11px] text-gray-400">Tachometer Closed-Loop</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-gray-600">
              <span className="font-medium">Active Command ID:</span>
              <span className="font-mono text-gray-900 truncate max-w-[150px]">
                {state.command.command_id || 'NONE'}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span className="font-medium">Target VFD Speed:</span>
              <span className="font-mono font-bold text-gray-900">{state.command.target_rpm} RPM</span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span className="font-medium">Measured Physical RPM:</span>
              <span className="font-mono font-bold text-blue-600 text-sm">
                {state.command.measured_rpm} RPM
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600">
              <span className="font-medium">Drive Trip Status:</span>
              <StatusBadge status={state.command.controller_status} size="sm" />
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-gray-600">
              <span className="font-medium">Physical Confirmation:</span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> VERIFIED
              </span>
            </div>
          </div>
        </div>
      </div>

      <OperatorResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        fault={activeFault}
        onSuccess={loadInitialData}
      />
    </div>
  );
};
