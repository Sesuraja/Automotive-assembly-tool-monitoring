import React, { useEffect, useState } from 'react';
import { Cpu, Plus, Wifi, WifiOff, Battery, ShieldCheck, RefreshCw, Radio } from 'lucide-react';
import { Device, Asset, Station } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { DeviceCommissionWizardModal } from '../components/DeviceCommissionWizardModal';

interface DevicesPageProps {
  selectedCompanyId: string | null;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({ selectedCompanyId }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionOpen, setCommissionOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCompanyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dList, aList, sList] = await Promise.all([
        api.getDevices(selectedCompanyId || undefined),
        api.getAssets(selectedCompanyId || undefined),
        api.getStations(selectedCompanyId || undefined),
      ]);
      setDevices(dList);
      setAssets(aList);
      setStations(sList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConnection = async (dev: Device) => {
    try {
      if (dev.connection_status === 'CONNECTED') {
        await api.disconnectDevice(dev.device_id);
      } else {
        await api.connectDevice(dev.device_id);
      }
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">BLE Hardware Devices</h2>
          <p className="text-xs text-gray-500 mt-1">
            Industrial triaxial vibration sensors and hardware controller interfaces behind adapter boundary
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
            title="Refresh devices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setCommissionOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Commission Device</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-medium">
              <th className="p-3 pl-4">Device ID</th>
              <th className="p-3">Device Name & Type</th>
              <th className="p-3">BLE MAC Address</th>
              <th className="p-3">Mapped Tool Asset</th>
              <th className="p-3">Firmware / Rev</th>
              <th className="p-3">Battery</th>
              <th className="p-3">Status</th>
              <th className="p-3 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {devices.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-3 pl-4 font-mono font-semibold text-gray-900">{d.device_id}</td>
                <td className="p-3">
                  <div className="font-semibold text-gray-900">{d.name}</div>
                  <div className="text-[11px] text-gray-400">{d.device_type}</div>
                </td>
                <td className="p-3 font-mono text-gray-500">{d.ble_address || 'Internal Adapter'}</td>
                <td className="p-3">
                  <span className="font-medium text-gray-900">
                    {d.mapped_asset_name || 'Unmapped'}
                  </span>
                </td>
                <td className="p-3 font-mono text-gray-500">
                  {d.firmware_version} ({d.hardware_revision})
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1 font-semibold text-gray-700">
                    <Battery className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{d.battery_pct}%</span>
                  </div>
                </td>
                <td className="p-3">
                  <StatusBadge status={d.connection_status} size="sm" />
                </td>
                <td className="p-3 pr-4 text-right">
                  <button
                    onClick={() => handleToggleConnection(d)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer transition-colors ${
                      d.connection_status === 'CONNECTED'
                        ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {d.connection_status === 'CONNECTED' ? 'Disconnect' : 'Connect'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeviceCommissionWizardModal
        isOpen={commissionOpen}
        onClose={() => setCommissionOpen(false)}
        onSuccess={loadData}
        assets={assets}
        stations={stations}
      />
    </div>
  );
};
