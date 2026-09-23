import React, { useState } from 'react';
import {
  History,
  Box,
  Download,
  Trash2,
  Search,
  ChevronRight,
  Clock,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { Object3DItem } from '../../types/object3d';

interface HistoryDrawerProps {
  history: Object3DItem[];
  activeModelId?: string | null;
  onSelectModel: (model: Object3DItem) => void;
  onDeleteModel: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  activeModelId,
  onSelectModel,
  onDeleteModel,
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) =>
    item.prompt.toLowerCase().includes(search.toLowerCase()) ||
    item.model_engine.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-[#0B0D0E]/95 backdrop-blur-xl border-l border-[#242A2E] z-40 flex flex-col shadow-2xl animate-fade-in font-mono">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#242A2E] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#76B900]" />
          <h2 className="text-sm font-bold text-white font-sans">3D Generation History</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#15191C] border border-[#242A2E] text-[#76B900] font-bold">
            {history.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#181C20] transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-[#242A2E]/60">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#14181B] border border-[#242A2E] rounded-xl text-xs">
          <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past 3D assets..."
            className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none"
          />
        </div>
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xs space-y-2">
            <Box className="w-8 h-8 mx-auto text-gray-600 stroke-[1.5]" />
            <p>No 3D generations found.</p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isActive = activeModelId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectModel(item)}
                className={`p-3.5 rounded-xl border transition cursor-pointer group space-y-2.5 relative ${
                  isActive
                    ? 'bg-[#151B18] border-[#76B900] shadow-md shadow-[#76B900]/10'
                    : 'bg-[#121619] border-[#202529] hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-[#76B900] text-black font-bold' : 'bg-[#1C2227] text-[#76B900]'
                      }`}
                    >
                      <Box className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-[#76B900] transition line-clamp-1 font-sans">
                      {item.prompt}
                    </span>
                  </div>

                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#181E22] text-gray-400 shrink-0 uppercase">
                    GLB
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#1C2226]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#76B900] font-semibold">{item.vertex_count?.toLocaleString()} v</span>
                    <span>•</span>
                    <span>{(item.file_size_bytes / 1024).toFixed(1)} KB</span>
                  </div>

                  {/* Actions: Download & Delete */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <a
                      href={item.download_url}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded text-gray-400 hover:text-[#76B900] transition"
                      title="Download .GLB"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteModel(item.id);
                      }}
                      className="p-1 rounded text-gray-500 hover:text-red-400 transition"
                      title="Delete Model"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
