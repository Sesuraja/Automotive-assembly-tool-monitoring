import React, { useEffect, useState } from 'react';
import { Sliders, Shield, AlertTriangle, Save, Check } from 'lucide-react';
import { api } from '../services/api';

interface PoliciesProps {
  selectedCompanyId: string | null;
}

export const PoliciesPage: React.FC<PoliciesProps> = ({ selectedCompanyId }) => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [strongThresh, setStrongThresh] = useState(0.85);
  const [strongWindows, setStrongWindows] = useState(2);
  const [mildThresh, setMildThresh] = useState(0.80);
  const [mildWindows, setMildWindows] = useState(3);
  const [normalThresh, setNormalThresh] = useState(0.90);
  const [staleTimeout, setStaleTimeout] = useState(3.0);

  useEffect(() => {
    loadPolicies();
  }, [selectedCompanyId]);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const pList = await api.getPolicies(selectedCompanyId || undefined);
      setPolicies(pList);
      if (pList.length > 0 && pList[0].versions?.length > 0) {
        const v = pList[0].versions[0];
        setStrongThresh(v.strong_threshold);
        setStrongWindows(v.strong_persistence_windows);
        setMildThresh(v.mild_threshold);
        setMildWindows(v.mild_persistence_windows);
        setNormalThresh(v.normal_threshold);
        setStaleTimeout(v.stale_data_timeout_sec);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    try {
      await api.createPolicy({
        company_id: selectedCompanyId,
        name: 'Automotive Tool Assembly Safety Policy v1.1',
        strong_threshold: strongThresh,
        strong_persistence_windows: strongWindows,
        mild_threshold: mildThresh,
        mild_persistence_windows: mildWindows,
        normal_threshold: normalThresh,
        stale_data_timeout_sec: staleTimeout,
        reduced_speed_ratio: 0.50,
      });
      setSavedMessage('Deterministic decision thresholds successfully calibrated.');
      setTimeout(() => setSavedMessage(null), 4000);
      loadPolicies();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Deterministic Decision Policies</h2>
          <p className="text-xs text-gray-500 mt-1">
            Separation of concerns: ML Model predicts probabilities &rarr; Policy Engine evaluates thresholds &rarr; Controller executes
          </p>
        </div>

        <button
          onClick={handleSavePolicy}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Save Policy Calibration</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Threshold Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Disturbance Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <h3 className="text-sm font-semibold text-gray-900">Strong Disturbance Threshold</h3>
            </div>
            <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              TRIP &rarr; LATCH STOP
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-medium text-gray-700 mb-1">
                <span>Probability Threshold (score_strong &gt;=)</span>
                <span className="font-mono font-bold text-blue-600">{strongThresh.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={strongThresh}
                onChange={(e) => setStrongThresh(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-gray-700 mb-1">
                <span>Persistence Windows Required</span>
                <span className="font-mono font-bold text-blue-600">{strongWindows} windows</span>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={strongWindows}
                onChange={(e) => setStrongWindows(parseInt(e.target.value) || 2)}
                className="w-full border border-gray-200 rounded-lg p-2 font-mono"
              />
            </div>

            <div className="p-2.5 bg-gray-50 rounded-lg text-gray-500 text-[11px]">
              <strong>Enforcement:</strong> When strong vibration probability exceeds {strongThresh} for {strongWindows} consecutive windows, system commands STOP and engages <code>INSPECTION_REQUIRED</code> safety latch.
            </div>
          </div>
        </div>

        {/* Mild Disturbance Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-sm font-semibold text-gray-900">Mild Disturbance Threshold</h3>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              REDUCE SPEED (50%)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-medium text-gray-700 mb-1">
                <span>Probability Threshold (score_mild &gt;=)</span>
                <span className="font-mono font-bold text-blue-600">{mildThresh.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={mildThresh}
                onChange={(e) => setMildThresh(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-gray-700 mb-1">
                <span>Persistence Windows Required</span>
                <span className="font-mono font-bold text-blue-600">{mildWindows} windows</span>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={mildWindows}
                onChange={(e) => setMildWindows(parseInt(e.target.value) || 3)}
                className="w-full border border-gray-200 rounded-lg p-2 font-mono"
              />
            </div>

            <div className="p-2.5 bg-gray-50 rounded-lg text-gray-500 text-[11px]">
              <strong>Enforcement:</strong> When mild vibration persists for {mildWindows} windows, system cuts target RPM to 50% nominal and verifies speed decrease via tachometer feedback.
            </div>
          </div>
        </div>

        {/* Watchdog & Staleness Timeout */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Telemetry Staleness Watchdog</h3>
            </div>
            <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              DATA_FAULT &rarr; LATCH STOP
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-medium text-gray-700 mb-1">
                <span>Maximum Allowed Telemetry Silence</span>
                <span className="font-mono font-bold text-blue-600">{staleTimeout.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={staleTimeout}
                onChange={(e) => setStaleTimeout(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="p-2.5 bg-gray-50 rounded-lg text-gray-500 text-[11px]">
              <strong>PRD Requirement:</strong> Missing or stale telemetry beyond {staleTimeout}s triggers a fail-safe STOP and latches station into <code>DATA_FAULT</code>.
            </div>
          </div>
        </div>

        {/* Normal Operating Threshold */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold text-gray-900">Normal Operating Threshold</h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              CONTINUE (100% NOMINAL)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-medium text-gray-700 mb-1">
                <span>Normal Confidence (score_normal &gt;=)</span>
                <span className="font-mono font-bold text-blue-600">{normalThresh.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="0.99"
                step="0.01"
                value={normalThresh}
                onChange={(e) => setNormalThresh(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="p-2.5 bg-gray-50 rounded-lg text-gray-500 text-[11px]">
              <strong>Enforcement:</strong> Nominal tool operations continue uninterrupted provided no active hardware latch or safety trip is engaged.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
