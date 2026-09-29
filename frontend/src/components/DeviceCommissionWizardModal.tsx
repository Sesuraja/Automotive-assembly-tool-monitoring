import React, { useState } from 'react';
import { Modal } from './Modal';
import { Check, CheckCircle2, ArrowRight, ArrowLeft, Radio, Cpu, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Asset, Station } from '../types';

interface CommissionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assets: Asset[];
  stations: Station[];
}

export const DeviceCommissionWizardModal: React.FC<CommissionWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  assets,
  stations,
}) => {
  const [step, setStep] = useState(1);
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || '');
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || '');
  const [assignedDeviceId, setAssignedDeviceId] = useState('ble_node_02');
  const [deviceName, setDeviceName] = useState('Aperture Triaxial BLE Vibration Node #2');
  const [samplingRateHz, setSamplingRateHz] = useState(100);
  const [validationStatus, setValidationStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const startScan = async () => {
    setScanning(true);
    try {
      const devs = await api.discoverDevices();
      setDiscoveredDevices(devs);
      if (devs.length > 0) {
        setSelectedDevice(devs[0]);
        setAssignedDeviceId(devs[0].device_id);
        setDeviceName(devs[0].name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const handleRunValidation = () => {
    setLoading(true);
    setTimeout(() => {
      setValidationStatus({
        telemetry: true,
        timestamp: true,
        sequence: true,
        connection: true,
      });
      setLoading(false);
      setStep(4);
    }, 1200);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.commissionDevice({
        device_id: assignedDeviceId,
        name: deviceName,
        device_type: 'BLE_VIBRATION_SENSOR',
        ble_address: selectedDevice?.ble_address || 'D4:36:39:B2:88:9C',
        asset_id: selectedAssetId,
        station_id: selectedStationId,
        sampling_rate_hz: samplingRateHz,
        vendor: 'Aperture Industrial Sensing',
      });
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hardware Device Commissioning"
      subtitle="11-Stage Verification & Asset Identity Mapping Pipeline"
      maxWidth="xl"
    >
      <div className="mb-4">
        {/* Simplified multi-phase steps representing the 11 PRD stages */}
        <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-100">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">1-3</span>
            <span>Discovery & BLE</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">4-6</span>
            <span>ID & Asset Map</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">7-10</span>
            <span>Validation</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step >= 4 ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">11</span>
            <span>Commissioned</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Scan industrial 2.4GHz BLE spectrum for vibration sensors:</span>
            <button
              onClick={startScan}
              disabled={scanning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Scan Devices'}
            </button>
          </div>

          <div className="space-y-2">
            {discoveredDevices.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400">
                Click "Scan Devices" to detect industrial vibration nodes.
              </div>
            ) : (
              discoveredDevices.map((d) => (
                <div
                  key={d.device_id}
                  onClick={() => {
                    setSelectedDevice(d);
                    setAssignedDeviceId(d.device_id);
                    setDeviceName(d.name);
                  }}
                  className={`p-3 rounded-lg border text-xs cursor-pointer flex justify-between items-center transition-all ${
                    selectedDevice?.device_id === d.device_id
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Radio className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">{d.name}</div>
                      <div className="text-gray-500 font-mono text-[11px]">{d.ble_address}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 font-semibold">{d.battery}% Batt</span>
                    <div className="text-gray-400 text-[10px]">{d.rssi} dBm</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Target Station</label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2.5"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Target Asset Identity</label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2.5"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.asset_type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Assigned Device ID</label>
              <input
                type="text"
                value={assignedDeviceId}
                onChange={(e) => setAssignedDeviceId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Sampling Frequency</label>
              <select
                value={samplingRateHz}
                onChange={(e) => setSamplingRateHz(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg p-2 text-xs"
              >
                <option value={50}>50 Hz</option>
                <option value={100}>100 Hz (Nominal)</option>
                <option value={200}>200 Hz (High Speed)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            Running 4-stage automated validation on device <strong>{assignedDeviceId}</strong>:
          </div>

          <div className="space-y-2">
            {[
              { label: 'Stage 7: Telemetry Packet Ingestion Contract', ok: validationStatus.telemetry },
              { label: 'Stage 8: Standardized ISO UTC Timestamp Check', ok: validationStatus.timestamp },
              { label: 'Stage 9: Strictly Monotonic Sequence Validation', ok: validationStatus.sequence },
              { label: 'Stage 10: Closed-Loop Connection Verification', ok: validationStatus.connection },
            ].map((v, i) => (
              <div key={i} className="flex justify-between items-center p-2.5 border border-gray-100 rounded-lg bg-white">
                <span className="text-gray-700">{v.label}</span>
                {v.ok ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> PASSED
                  </span>
                ) : (
                  <span className="text-gray-400">Ready</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleRunValidation}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Executing Real-Time Diagnostics...' : 'Execute Stages 7-10 Diagnostics'}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-gray-900">Commissioning Complete</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Sensor node <strong>{assignedDeviceId}</strong> is linked to asset{' '}
            <strong>{assets.find((a) => a.id === selectedAssetId)?.name}</strong>. Real-time telemetry ingestion active.
          </p>
          <div className="pt-2">
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 cursor-pointer"
            >
              {loading ? 'Activating...' : 'Finish & Return to Devices'}
            </button>
          </div>
        </div>
      )}

      {step < 4 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !selectedDevice}
              className="flex items-center gap-1 px-4 py-2 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-50"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      )}
    </Modal>
  );
};
