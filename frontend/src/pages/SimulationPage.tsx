import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Cpu,
  Server,
  Play,
  Square,
  Send,
  Plus,
  Copy,
  Check,
  Trash2,
  Activity,
  Layers,
  Terminal,
  Zap,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { api } from '../services/api';

export const SimulationPage: React.FC = () => {
  const [gateways, setGateways] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected for simulation
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('GW-001');
  const [selectedSensorId, setSelectedSensorId] = useState<string>('BLE-VIB-001');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [condition, setCondition] = useState<string>('NORMAL');

  // Streaming state
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [sequenceNumber, setSequenceNumber] = useState<number>(1000);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  // Modals
  const [addGatewayOpen, setAddGatewayOpen] = useState(false);
  const [addSensorOpen, setAddSensorOpen] = useState(false);

  // New Gateway form
  const [newGwId, setNewGwId] = useState('');
  const [newGwName, setNewGwName] = useState('');
  const [newGwIp, setNewGwIp] = useState('192.168.1.120');
  const [newGwMac, setNewGwMac] = useState('A4:C1:38:44:99:01');
  const [newGwProto, setNewGwProto] = useState('HTTP_REST');

  // New Sensor form
  const [newSensorId, setNewSensorId] = useState('');
  const [newSensorName, setNewSensorName] = useState('');
  const [newSensorMac, setNewSensorMac] = useState('D4:36:39:B2:88:44');
  const [newSensorRate, setNewSensorRate] = useState(3200);

  const streamTimerRef = useRef<any>(null);

  const ingestionApiUrl = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/gateways/telemetry`;

  useEffect(() => {
    loadData();
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gwList, devList, assetList] = await Promise.all([
        api.getGateways(),
        api.getDevices(),
        api.getAssets(),
      ]);
      setGateways(gwList);
      setSensors(devList);
      setAssets(assetList);

      if (assetList.length > 0 && !selectedAssetId) {
        setSelectedAssetId(assetList[0].id);
      }
      if (gwList.length > 0) {
        setSelectedGatewayId(gwList[0].gateway_id);
      } else {
        // Auto-seed default gateway if empty
        try {
          await api.createGateway({
            gateway_id: 'GW-001',
            name: 'Advantech Industrial BLE Gateway #1',
            ip_address: '192.168.1.100',
            mac_address: 'A4:C1:38:12:44:99',
            protocol: 'HTTP_REST',
          });
          const refreshed = await api.getGateways();
          setGateways(refreshed);
          if (refreshed.length > 0) setSelectedGatewayId(refreshed[0].gateway_id);
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(ingestionApiUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const sampleCurl = `curl -X POST "${ingestionApiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gateway_id": "${selectedGatewayId || 'GW-001'}",
    "sensor_id": "${selectedSensorId || 'BLE-VIB-001'}",
    "asset_id": "${selectedAssetId || 'asset-01'}",
    "sequence": 12345,
    "timestamp": "${new Date().toISOString()}",
    "sampling_rate_hz": 3200,
    "x": [0.082, 0.085, 0.079, 0.081],
    "y": [0.045, 0.048, 0.042, 0.046],
    "z": [0.989, 0.992, 0.985, 0.991]
  }'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(sampleCurl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleAddGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGwId || !newGwName) return;
    try {
      await api.createGateway({
        gateway_id: newGwId,
        name: newGwName,
        ip_address: newGwIp,
        mac_address: newGwMac,
        protocol: newGwProto,
      });
      setAddGatewayOpen(false);
      setNewGwId('');
      setNewGwName('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to add gateway');
    }
  };

  const handleDeleteGateway = async (gwId: string) => {
    if (!confirm(`Delete gateway ${gwId}?`)) return;
    try {
      await api.deleteGateway(gwId);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to delete gateway');
    }
  };

  const handleAddSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSensorId || !newSensorName) return;
    try {
      await api.addGatewaySensor({
        device_id: newSensorId,
        name: newSensorName,
        ble_address: newSensorMac,
        gateway_id: selectedGatewayId,
        sampling_rate_hz: newSensorRate,
        asset_id: selectedAssetId,
      });
      setAddSensorOpen(false);
      setNewSensorId('');
      setNewSensorName('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to add sensor');
    }
  };

  const generateTriaxialSamples = (cond: string, count = 32) => {
    const x: number[] = [];
    const y: number[] = [];
    const z: number[] = [];
    const omega = 2 * Math.PI * 30; // 30 Hz nominal

    for (let i = 0; i < count; i++) {
      const t = i / 3200;
      let ampX = 0, ampY = 0, ampZ = 0;

      if (cond === 'STRONG_DISTURBANCE') {
        ampX = 0.85 * Math.sin(omega * t) + 1.2 * Math.sin(3.5 * omega * t) + (Math.random() - 0.5) * 0.7;
        ampY = 0.75 * Math.cos(omega * t) + 1.1 * Math.sin(5.2 * omega * t) + (Math.random() - 0.5) * 0.6;
        ampZ = 1.0 + 1.4 * Math.sin(2.2 * omega * t) + (Math.random() - 0.5) * 0.9;
      } else if (cond === 'MILD_DISTURBANCE') {
        ampX = 0.35 * Math.sin(omega * t) + 0.30 * Math.sin(2.0 * omega * t) + (Math.random() - 0.5) * 0.25;
        ampY = 0.30 * Math.cos(omega * t) + 0.25 * Math.sin(2.0 * omega * t) + (Math.random() - 0.5) * 0.20;
        ampZ = 1.0 + 0.40 * Math.sin(omega * t) + (Math.random() - 0.5) * 0.30;
      } else {
        // NORMAL
        ampX = 0.08 * Math.sin(omega * t) + (Math.random() - 0.5) * 0.06;
        ampY = 0.06 * Math.cos(omega * t) + (Math.random() - 0.5) * 0.06;
        ampZ = 0.98 + 0.09 * Math.sin(omega * t) + (Math.random() - 0.5) * 0.08;
      }

      x.push(Number(ampX.toFixed(4)));
      y.push(Number(ampY.toFixed(4)));
      z.push(Number(ampZ.toFixed(4)));
    }

    return { x, y, z };
  };

  const sendSinglePacket = async (overrideCond?: string) => {
    const activeCond = overrideCond || condition;
    const currentSeq = sequenceNumber + 1;
    setSequenceNumber(currentSeq);

    const { x, y, z } = generateTriaxialSamples(activeCond);
    let pktTimestamp = new Date().toISOString();

    if (activeCond === 'STALE_DATA') {
      // 5 seconds ago
      pktTimestamp = new Date(Date.now() - 5000).toISOString();
    }

    const payload = {
      gateway_id: selectedGatewayId,
      sensor_id: selectedSensorId,
      asset_id: selectedAssetId || undefined,
      sequence: currentSeq,
      timestamp: pktTimestamp,
      sampling_rate_hz: 3200,
      x,
      y,
      z,
    };

    const startTime = performance.now();
    try {
      const result = await api.ingestGatewayTelemetry(payload);
      const latencyMs = Math.round(performance.now() - startTime);

      setLastResponse(result);
      setLogs((prev) => [
        {
          id: currentSeq,
          time: new Date().toLocaleTimeString(),
          seq: currentSeq,
          cond: activeCond,
          status: result.status,
          latency: latencyMs,
          rms: result.features?.rms?.toFixed(3),
          aiClass: result.ai_inference?.predicted_class,
          aiScore: ((result.ai_inference?.confidence || 0) * 100).toFixed(1) + '%',
          decision: result.policy_decision?.action,
        },
        ...prev.slice(0, 49),
      ]);
    } catch (e: any) {
      console.error(e);
      setLogs((prev) => [
        {
          id: currentSeq,
          time: new Date().toLocaleTimeString(),
          seq: currentSeq,
          cond: activeCond,
          status: 'ERROR',
          latency: Math.round(performance.now() - startTime),
          error: e.message,
        },
        ...prev.slice(0, 49),
      ]);
    }
  };

  const toggleStreaming = () => {
    if (isStreaming) {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      setIsStreaming(false);
    } else {
      setIsStreaming(true);
      sendSinglePacket();
      streamTimerRef.current = setInterval(() => {
        sendSinglePacket();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Industrial BLE Gateway Ingestion Endpoint */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                PRD Section 7 & 15
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-xs text-gray-500 font-medium">Gateway Ingestion API</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-600" />
              Industrial BLE Gateway & Sensor Simulation Hub
            </h1>
            <p className="text-xs text-gray-500">
              Configure physical or simulated BLE gateways and vibration sensors. Stream live telemetry or paste this API endpoint into external gateway firmware.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 cursor-pointer transition-colors"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied Ingestion URL!' : 'Copy Gateway API URL'}</span>
            </button>

            <button
              onClick={handleCopyCurl}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 cursor-pointer transition-colors"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Terminal className="w-3.5 h-3.5" />}
              <span>{copiedCurl ? 'Copied cURL!' : 'Copy cURL Example'}</span>
            </button>
          </div>
        </div>

        {/* Live URL Pill */}
        <div className="mt-4 p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[10px]">
              POST
            </span>
            <span className="text-slate-300 font-semibold">{ingestionApiUrl}</span>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0 ml-4">Content-Type: application/json</span>
        </div>
      </div>

      {/* Grid: Gateway Fleet & Sensor Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gateways Box */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-gray-900">1. Industrial BLE Gateways</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700">
                {gateways.length} Active
              </span>
            </div>
            <button
              onClick={() => setAddGatewayOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Gateway</span>
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {gateways.map((gw) => (
              <div
                key={gw.id || gw.gateway_id}
                onClick={() => setSelectedGatewayId(gw.gateway_id)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedGatewayId === gw.gateway_id
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-900 font-bold">{gw.gateway_id}</span>
                    <span className="text-gray-600 font-normal truncate max-w-[180px]">{gw.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      {gw.status || 'ONLINE'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGateway(gw.id || gw.gateway_id);
                      }}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-gray-400 flex items-center gap-4 font-mono">
                  <span>IP: {gw.ip_address}</span>
                  <span>MAC: {gw.mac_address || 'Default'}</span>
                  <span>Proto: {gw.protocol}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sensors Box */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-gray-900">2. BLE Vibration Sensors</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700">
                {sensors.length} Configured
              </span>
            </div>
            <button
              onClick={() => setAddSensorOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sensor</span>
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {sensors.map((sens) => (
              <div
                key={sens.id || sens.device_id}
                onClick={() => setSelectedSensorId(sens.device_id)}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedSensorId === sens.device_id
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-900 font-bold">{sens.device_id}</span>
                    <span className="text-gray-600 font-normal truncate max-w-[180px]">{sens.name}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                    {sens.battery_pct}% BAT
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-gray-400 flex items-center gap-4 font-mono">
                  <span>BLE: {sens.ble_address || 'D4:36:39:B2:11:04'}</span>
                  <span>Rate: {sens.sampling_rate_hz || 3200} Hz</span>
                  <span>Tool: {sens.mapped_asset_name || 'Assembly Motor'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Industrial Live Simulation Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              3. Live Industrial Stream Transmitter (Real-Time Ingestion)
            </h2>
            <p className="text-xs text-gray-500">
              Transmit synthesized high-frequency vibration waveform packets directly to the gateway ingestion engine.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => sendSinglePacket()}
              disabled={isStreaming}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Single Frame</span>
            </button>

            <button
              onClick={toggleStreaming}
              className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors ${
                isStreaming
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isStreaming ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isStreaming ? 'Stop Streaming' : 'Start Live Stream (1 Hz)'}</span>
            </button>
          </div>
        </div>

        {/* Condition Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Condition Profile Injection
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { id: 'NORMAL', label: 'Normal Baseline', desc: '0.08g RMS, stable' },
              { id: 'MILD_DISTURBANCE', label: 'Mild Disturbance', desc: '0.35g RMS wear' },
              { id: 'STRONG_DISTURBANCE', label: 'Strong Disturbance', desc: '1.4g RMS fault' },
              { id: 'STALE_DATA', label: 'Stale Data (>4s)', desc: 'Watchdog timeout' },
              { id: 'PACKET_LOSS', label: 'Packet Loss', desc: 'Radio drop rate' },
              { id: 'MOTOR_STOP_FAILURE', label: 'Stop Failure', desc: 'Brake runaway' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setCondition(c.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  condition === c.id
                    ? c.id === 'STRONG_DISTURBANCE' || c.id === 'MOTOR_STOP_FAILURE'
                      ? 'border-red-500 bg-red-50 text-red-900 font-bold ring-1 ring-red-500'
                      : c.id === 'MILD_DISTURBANCE'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-500'
                      : 'border-blue-500 bg-blue-50 text-blue-900 font-bold ring-1 ring-blue-500'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-xs font-bold">{c.label}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Latest Response Card */}
        {lastResponse && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Latest Ingestion Response: Seq #{lastResponse.sequence}
              </span>
              <span className="font-mono text-slate-500">Latency: {lastResponse.data_age_ms} ms</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Computed RMS</div>
                <div className="text-sm font-bold text-gray-900 font-mono mt-0.5">
                  {lastResponse.features?.rms?.toFixed(3)} g
                </div>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-200">
                <div className="text-[10px] font-bold text-gray-400 uppercase">AI Classification</div>
                <div className="text-sm font-bold text-blue-600 mt-0.5">
                  {lastResponse.ai_inference?.predicted_class}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-200">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Deterministic Action</div>
                <div className="text-sm font-bold text-emerald-600 mt-0.5">
                  {lastResponse.policy_decision?.action}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded border border-slate-200">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Safety Latch</div>
                <div className="text-sm font-bold text-gray-900 mt-0.5">
                  {lastResponse.policy_decision?.latch_state || 'NONE'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Transmission Feed Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-600">
            <span>Live Stream Log ({logs.length} Packets)</span>
            {logs.length > 0 && (
              <button
                onClick={() => setLogs([])}
                className="text-gray-400 hover:text-gray-600 cursor-pointer font-normal text-[11px]"
              >
                Clear Log
              </button>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Seq #</th>
                  <th className="py-2 px-3">Profile</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Latency</th>
                  <th className="py-2 px-3">RMS</th>
                  <th className="py-2 px-3">AI Pred</th>
                  <th className="py-2 px-3">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-400 italic font-sans text-xs">
                      No packets transmitted yet. Click "Send Single Frame" or "Start Live Stream".
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3 text-gray-500">{log.time}</td>
                      <td className="py-2 px-3 font-bold text-gray-900">#{log.seq}</td>
                      <td className="py-2 px-3 font-sans">
                        <span className="font-semibold text-gray-700">{log.cond}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600">{log.latency} ms</td>
                      <td className="py-2 px-3 text-gray-900">{log.rms || '-'}</td>
                      <td className="py-2 px-3 font-sans font-semibold text-blue-700">{log.aiClass || '-'}</td>
                      <td className="py-2 px-3 font-sans font-bold">
                        <span
                          className={
                            log.decision === 'STOP'
                              ? 'text-red-600'
                              : log.decision === 'REDUCE_SPEED'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }
                        >
                          {log.decision || '-'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Gateway Modal */}
      {addGatewayOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Register Industrial BLE Gateway</h3>
            <form onSubmit={handleAddGateway} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Gateway ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GW-002"
                  value={newGwId}
                  onChange={(e) => setNewGwId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Gateway Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Station 2 Gateway Node"
                  value={newGwName}
                  onChange={(e) => setNewGwName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">IP Address / Host</label>
                <input
                  type="text"
                  placeholder="192.168.1.120"
                  value={newGwIp}
                  onChange={(e) => setNewGwIp(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">BLE MAC Address</label>
                <input
                  type="text"
                  placeholder="A4:C1:38:44:99:01"
                  value={newGwMac}
                  onChange={(e) => setNewGwMac(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Protocol</label>
                <select
                  value={newGwProto}
                  onChange={(e) => setNewGwProto(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none"
                >
                  <option value="HTTP_REST">HTTP REST Webhook</option>
                  <option value="MQTT">MQTT Industrial Broker</option>
                  <option value="WEBSOCKET">WebSocket Stream</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAddGatewayOpen(false)}
                  className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Register Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sensor Modal */}
      {addSensorOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Add BLE Vibration Sensor</h3>
            <form onSubmit={handleAddSensor} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Sensor ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLE-VIB-002"
                  value={newSensorId}
                  onChange={(e) => setNewSensorId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Sensor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spindle Motor Triaxial Sensor"
                  value={newSensorName}
                  onChange={(e) => setNewSensorName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">BLE MAC Address</label>
                <input
                  type="text"
                  placeholder="D4:36:39:B2:88:44"
                  value={newSensorMac}
                  onChange={(e) => setNewSensorMac(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Sampling Rate (Hz)</label>
                <input
                  type="number"
                  value={newSensorRate}
                  onChange={(e) => setNewSensorRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg font-mono outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAddSensorOpen(false)}
                  className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
                >
                  Register Sensor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
