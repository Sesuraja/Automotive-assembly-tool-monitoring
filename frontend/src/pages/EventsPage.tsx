import React, { useEffect, useState } from 'react';
import { History, ArrowRight, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { EventTrace } from '../types';
import { api } from '../services/api';

interface EventsProps {
  selectedCompanyId: string | null;
}

export const EventsPage: React.FC<EventsProps> = ({ selectedCompanyId }) => {
  const [events, setEvents] = useState<EventTrace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [selectedCompanyId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const eList = await api.getEvents(selectedCompanyId || undefined);
      setEvents(eList);
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
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Traceability &amp; Event Chain</h2>
          <p className="text-xs text-gray-500 mt-1">
            Complete physical audit chain: Sensor &rarr; Telemetry &rarr; ML Inference &rarr; Policy Decision &rarr; Controller Command &rarr; Tachometer Verification
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-xs text-gray-400 shadow-xs">
            No event traces recorded yet. Active monitoring will automatically capture full physical traces.
          </div>
        ) : (
          events.map((trace) => (
            <div
              key={trace.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-gray-300 transition-all text-xs"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600">{trace.trace_id}</span>
                  <span className="text-gray-300">&bull;</span>
                  <span className="font-semibold text-gray-900">{trace.summary || 'Physical Action'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400 font-mono text-[11px]">
                  <span>Execution Latency: {trace.duration_ms}ms</span>
                  <span>&bull;</span>
                  <span>{new Date(trace.timestamp_utc).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Event Trace Sequence Pipeline Visualizer */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[10px] uppercase font-bold text-gray-400">1. Sensor Event</div>
                  <div className="font-mono font-semibold text-gray-900 mt-0.5">{trace.sensor_event_id || 'Frame'}</div>
                </div>

                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[10px] uppercase font-bold text-gray-400">2. Telemetry</div>
                  <div className="font-mono font-semibold text-gray-900 mt-0.5">Normalized</div>
                </div>

                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[10px] uppercase font-bold text-gray-400">3. ML Inference</div>
                  <div className="font-mono font-semibold text-blue-600 mt-0.5">RF Predict</div>
                </div>

                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[10px] uppercase font-bold text-gray-400">4. Decision Policy</div>
                  <div className="font-mono font-semibold text-emerald-600 mt-0.5">Evaluated</div>
                </div>

                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[10px] uppercase font-bold text-gray-400">5. Controller Cmd</div>
                  <div className="font-mono font-semibold text-gray-900 mt-0.5">Dispatched</div>
                </div>

                <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-200">
                  <div className="text-[10px] uppercase font-bold text-blue-600">6. Physical Result</div>
                  <div className="font-mono font-bold text-gray-900 mt-0.5">
                    {trace.physical_result_rpm !== undefined ? `${trace.physical_result_rpm} RPM` : 'OK'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
