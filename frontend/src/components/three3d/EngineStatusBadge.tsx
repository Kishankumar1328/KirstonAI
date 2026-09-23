import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, ShieldCheck, X, Info } from 'lucide-react';
import { EngineStatus } from '../../types/object3d';

interface EngineStatusBadgeProps {
  status: EngineStatus | null;
}

export const EngineStatusBadge: React.FC<EngineStatusBadgeProps> = ({ status }) => {
  const [showModal, setShowModal] = useState(false);

  if (!status) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14181B] border border-[#242A2E] hover:border-[#76B900]/60 text-xs font-mono transition group"
        title="View 3D Engines & Cloud API Status"
      >
        <div className="w-2 h-2 rounded-full bg-[#76B900] animate-pulse" />
        <span className="text-gray-300 group-hover:text-white font-medium">3D Engine:</span>
        <span className="text-[#76B900] font-bold uppercase">{status.default_engine}</span>
      </button>

      {/* Engine Status Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#0B0D0E] border border-[#242A2E] rounded-2xl max-w-lg w-full p-5 space-y-4 font-mono shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#242A2E] pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#76B900]" />
                <h3 className="text-sm font-bold text-white font-sans">3D Engine Pipeline Architecture</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cloud Status */}
            <div className="p-3.5 rounded-xl bg-[#14181B] border border-[#202529] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">AI/ML API Integration:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    status.aimlapi_connected
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                  }`}
                >
                  {status.aimlapi_connected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                {status.aimlapi_status_message}
              </p>
            </div>

            {/* Engines List */}
            <div className="space-y-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                Available Generation Engines
              </div>
              {status.engines.map((eng) => (
                <div
                  key={eng.id}
                  className="p-3 rounded-xl bg-[#121619] border border-[#202529] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{eng.name}</span>
                    <span className="text-[10px] text-[#76B900] uppercase font-bold">{eng.status}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-sans">{eng.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {eng.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 rounded text-[9px] bg-[#181E22] text-[#76B900] border border-[#76B900]/20"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
