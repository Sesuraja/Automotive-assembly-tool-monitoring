import React, { useEffect, useState } from 'react';
import { Terminal, Send, PowerOff, ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Command, Asset } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface CommandsProps {
  selectedCompanyId: string | null;
}

export const CommandsPage: React.FC<CommandsProps> = ({ selectedCompanyId }) => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [targetRpm, setTargetRpm] = useState(1800);
  const [reason, setReason] = useState('OPERATOR_MANUAL_CALIBRATION');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCompanyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cmdList, aList] = await Promise.all([
        api.getCommands(selectedCompanyId || undefined),
        api.getAssets(selectedCompanyId || undefined),
      ]);
      setCommands(cmdList);
      setAssets(aList);
      if (aList.length > 0) setSelectedAssetId(aList[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSetSpeed = async () => {
    if (!selectedAssetId) return;
    try {
      const res = await api.setSpeed({
        asset_id: selectedAssetId,
        target_rpm: targetRpm,
        reason: reason || 'OPERATOR_MANUAL_SPEED_COMMAND',
      });
      setActionMessage(`Command ${res.command_id} dispatched: Status ${res.status}`);
      loadData();
    } catch (e: any) {
      setActionMessage(`Command Blocked: ${e.message}`);
    }
  };

  const handleStop = async () => {
    if (!selectedAssetId) return;
    try {
      const res = await api.stopMotor({
        asset_id: selectedAssetId,
        reason: 'OPERATOR_MANUAL_STOP',
      });
      setActionMessage(`Stop Command ${res.command_id} dispatched: Status ${res.status}`);
      loadData();
    } catch (e: any) {
      setActionMessage(`Command Blocked: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Command Center</h2>
          <p className="text-xs text-gray-500 mt-1">
            Authenticated hardware actuator command dispatch with physical tachometer RPM closed-loop verification
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-blue-600 font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {/* Command Dispatch Panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          Issue Protected Controller Command
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Target Asset</label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2.5"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (Current: {a.current_state})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Target RPM (0 - 3500)</label>
            <input
              type="number"
              min="0"
              max="3500"
              step="50"
              value={targetRpm}
              onChange={(e) => setTargetRpm(parseInt(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-lg p-2 font-mono"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Audit Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Test Bench Speed Step"
              className="w-full border border-gray-200 rounded-lg p-2"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleSetSpeed}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Set Speed</span>
            </button>
            <button
              onClick={handleStop}
              className="px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
              title="Stop Drive"
            >
              <PowerOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Command Audit Log Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 font-semibold text-xs text-gray-900">
          Command Execution &amp; Feedback History
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-medium">
              <th className="p-3 pl-4">Command ID</th>
              <th className="p-3">Type</th>
              <th className="p-3">Target RPM</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Model Ref</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {commands.map((cmd) => (
              <tr key={cmd.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-3 pl-4 font-mono font-semibold text-gray-900">{cmd.command_id}</td>
                <td className="p-3 font-semibold text-gray-800">{cmd.command_type}</td>
                <td className="p-3 font-mono font-bold text-blue-600">{cmd.target_rpm} RPM</td>
                <td className="p-3 text-gray-600 truncate max-w-[200px]">{cmd.reason}</td>
                <td className="p-3 font-mono text-gray-500">{cmd.model_version || 'N/A'}</td>
                <td className="p-3 text-gray-400 font-mono">
                  {new Date(cmd.created_at).toLocaleTimeString()}
                </td>
                <td className="p-3 pr-4">
                  <StatusBadge status={cmd.status} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
