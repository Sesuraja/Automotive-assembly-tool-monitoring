import React, { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, Check, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { Fault } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { OperatorResetModal } from '../components/OperatorResetModal';

interface FaultsProps {
  selectedCompanyId: string | null;
}

export const FaultsPage: React.FC<FaultsProps> = ({ selectedCompanyId }) => {
  const [faults, setFaults] = useState<Fault[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    loadFaults();
  }, [selectedCompanyId]);

  const loadFaults = async () => {
    setLoading(true);
    try {
      const fList = await api.getFaults(selectedCompanyId || undefined);
      setFaults(fList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeFault(id, 'Acknowledged by operator');
      loadFaults();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenReset = (fault: Fault) => {
    setSelectedFault(fault);
    setResetModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Fault &amp; Safety Interlock Center</h2>
          <p className="text-xs text-gray-500 mt-1">
            Trip latch tracking, operator acknowledgment, and explicit non-automatic safety recovery protocols
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            {faults.filter((f) => f.is_latched).length} Latched Trips Active
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-medium">
              <th className="p-3 pl-4">Category</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Trip Reason</th>
              <th className="p-3">Detected At</th>
              <th className="p-3">Safety Latch</th>
              <th className="p-3">Acknowledgment</th>
              <th className="p-3 pr-4 text-right">Interlock Reset</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {faults.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  No active or historical equipment faults. All safety interlocks are healthy.
                </td>
              </tr>
            ) : (
              faults.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 pl-4 font-mono font-bold text-gray-900">{f.category}</td>
                  <td className="p-3">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                        f.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {f.severity}
                    </span>
                  </td>
                  <td className="p-3 text-gray-700 max-w-[240px] truncate">{f.reason}</td>
                  <td className="p-3 font-mono text-gray-400">
                    {new Date(f.detected_at).toLocaleTimeString()}
                  </td>
                  <td className="p-3">
                    {f.is_latched ? (
                      <span className="font-bold text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> LATCHED
                      </span>
                    ) : (
                      <span className="text-gray-400">Resolved</span>
                    )}
                  </td>
                  <td className="p-3">
                    {f.is_acknowledged ? (
                      <span className="text-emerald-700 flex items-center gap-1 font-medium">
                        <Check className="w-3.5 h-3.5" /> {f.acknowledged_by || 'Ack'}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(f.id)}
                        className="px-2.5 py-1 text-xs border border-gray-200 rounded hover:bg-gray-100 text-gray-600 font-medium cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                  <td className="p-3 pr-4 text-right">
                    {f.is_latched ? (
                      <button
                        onClick={() => handleOpenReset(f)}
                        className="px-3 py-1 bg-red-600 text-white font-bold rounded text-xs hover:bg-red-700 cursor-pointer shadow-xs"
                      >
                        Reset Trip
                      </button>
                    ) : (
                      <span className="text-gray-400 font-mono text-[11px]">Unlatched</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <OperatorResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        fault={selectedFault}
        onSuccess={loadFaults}
      />
    </div>
  );
};
