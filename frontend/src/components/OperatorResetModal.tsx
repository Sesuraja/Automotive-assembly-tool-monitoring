import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { Fault } from '../types';

interface OperatorResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  fault: Fault | null;
  onSuccess: () => void;
}

export const OperatorResetModal: React.FC<OperatorResetModalProps> = ({
  isOpen,
  onClose,
  fault,
  onSuccess,
}) => {
  const [resetReason, setResetReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!fault) return;
    if (!resetReason || resetReason.length < 5) {
      setError('Please provide a descriptive engineering reason for safety recovery (minimum 5 characters).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.operatorResetFault({
        fault_id: fault.id,
        reset_reason: resetReason,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Safety reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Explicit Operator Safety Reset"
      subtitle="PRD Mandatory Human-in-the-Loop Trip Recovery Protocol"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2.5">
          <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Hardware Interlock Safety Invariant</div>
            <div className="mt-0.5 text-amber-800 text-[11px]">
              Automatic station restart is strictly prohibited. Unlatching restores equipment to <strong>READY</strong>{' '}
              state only. The drive will remain de-energized until a subsequent validated command is issued.
            </div>
          </div>
        </div>

        {fault && (
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/60 space-y-1 text-gray-700">
            <div><span className="font-medium text-gray-900">Fault Category:</span> {fault.category}</div>
            <div><span className="font-medium text-gray-900">Trip Reason:</span> {fault.reason}</div>
            <div><span className="font-medium text-gray-900">Detected:</span> {new Date(fault.detected_at).toLocaleString()}</div>
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block font-medium text-gray-700 mb-1">
            Engineering Verification & Reset Reason *
          </label>
          <textarea
            rows={3}
            value={resetReason}
            onChange={(e) => setResetReason(e.target.value)}
            placeholder="e.g. Mechanical vibration spindle inspected. Fastener tool cleared. Physical tachometer verified at zero RPM."
            className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Resetting Trip...' : 'Confirm Operator Reset'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
