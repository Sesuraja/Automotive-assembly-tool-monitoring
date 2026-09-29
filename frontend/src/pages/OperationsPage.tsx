import React, { useEffect, useState } from 'react';
import { Layers, MapPin, Briefcase, Cpu, Plus, CheckCircle, Sliders } from 'lucide-react';
import { Site, Station, Asset } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

interface OperationsProps {
  selectedCompanyId: string | null;
}

export const OperationsPage: React.FC<OperationsProps> = ({ selectedCompanyId }) => {
  const [activeTab, setActiveTab] = useState<'sites' | 'stations' | 'assets'>('assets');
  const [sites, setSites] = useState<Site[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // New modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedCompanyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sList, stList, aList] = await Promise.all([
        api.getSites(selectedCompanyId || undefined),
        api.getStations(selectedCompanyId || undefined),
        api.getAssets(selectedCompanyId || undefined),
      ]);
      setSites(sList);
      setStations(stList);
      setAssets(aList);
      if (stList.length > 0) setSelectedStationId(stList[0].id);
      if (sList.length > 0) setSelectedSiteId(sList[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newItemName) return;
    try {
      if (activeTab === 'sites') {
        await api.createSite({
          company_id: selectedCompanyId,
          name: newItemName,
          code: newItemCode || 'SITE-02',
          location: 'Ontario Facility',
        });
      } else if (activeTab === 'stations') {
        await api.createStation({
          company_id: selectedCompanyId,
          site_id: selectedSiteId,
          name: newItemName,
          code: newItemCode || 'ST-02',
        });
      } else if (activeTab === 'assets') {
        await api.createAsset({
          company_id: selectedCompanyId,
          station_id: selectedStationId,
          name: newItemName,
          asset_type: 'Motor Spindle',
          rated_rpm: 1800,
          max_rpm: 3000,
        });
      }
      setModalOpen(false);
      setNewItemName('');
      setNewItemCode('');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Operations Management</h2>
          <p className="text-xs text-gray-500 mt-1">
            Physical assembly sites, production stations, and monitored spindle assets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'assets' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Assets ({assets.length})
            </button>
            <button
              onClick={() => setActiveTab('stations')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'stations' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Stations ({stations.length})
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'sites' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sites ({sites.length})
            </button>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeTab.slice(0, -1)}</span>
          </button>
        </div>
      </div>

      {/* Main Table / Grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        {activeTab === 'assets' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-medium">
                <th className="p-3 pl-4">Asset Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Station</th>
                <th className="p-3">Rated RPM</th>
                <th className="p-3">Max Safety RPM</th>
                <th className="p-3">Current State</th>
                <th className="p-3 pr-4">Active Latch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map((a) => {
                const st = stations.find((s) => s.id === a.station_id);
                return (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 pl-4 font-semibold text-gray-900">{a.name}</td>
                    <td className="p-3 text-gray-600">{a.asset_type}</td>
                    <td className="p-3 text-gray-600">{st?.name || a.station_id}</td>
                    <td className="p-3 font-mono text-gray-700">{a.rated_rpm} RPM</td>
                    <td className="p-3 font-mono text-gray-700">{a.max_rpm} RPM</td>
                    <td className="p-3">
                      <StatusBadge status={a.current_state} size="sm" />
                    </td>
                    <td className="p-3 pr-4">
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          a.active_latch !== 'NONE' ? 'text-red-600' : 'text-gray-400'
                        }`}
                      >
                        {a.active_latch}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'stations' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-medium">
                <th className="p-3 pl-4">Station Name</th>
                <th className="p-3">Code</th>
                <th className="p-3">Facility Site</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4">Latch Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stations.map((s) => {
                const site = sites.find((site) => site.id === s.site_id);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 pl-4 font-semibold text-gray-900">{s.name}</td>
                    <td className="p-3 font-mono text-gray-600">{s.code}</td>
                    <td className="p-3 text-gray-600">{site?.name || s.site_id}</td>
                    <td className="p-3">
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                    <td className="p-3 pr-4 font-mono text-gray-500">{s.is_latched}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'sites' && (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-medium">
                <th className="p-3 pl-4">Site / Facility Name</th>
                <th className="p-3">Code</th>
                <th className="p-3">Location</th>
                <th className="p-3">Timezone</th>
                <th className="p-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 pl-4 font-semibold text-gray-900">{site.name}</td>
                  <td className="p-3 font-mono text-gray-600">{site.code}</td>
                  <td className="p-3 text-gray-600">{site.location || 'N/A'}</td>
                  <td className="p-3 text-gray-500 font-mono">{site.timezone}</td>
                  <td className="p-3 pr-4">
                    <StatusBadge status={site.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Add New ${activeTab.slice(0, -1).toUpperCase()}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. Spindle Motor B"
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Code / Identifier</label>
            <input
              type="text"
              value={newItemCode}
              onChange={(e) => setNewItemCode(e.target.value)}
              placeholder="e.g. MOT-B-01"
              className="w-full border border-gray-200 rounded-lg p-2.5 uppercase"
            />
          </div>

          {activeTab === 'assets' && (
            <div>
              <label className="block font-medium text-gray-700 mb-1">Station Mapping</label>
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
          )}

          {activeTab === 'stations' && (
            <div>
              <label className="block font-medium text-gray-700 mb-1">Facility Site</label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2.5"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => setModalOpen(false)}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer shadow-xs"
            >
              Confirm Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
