import React from 'react';
import { Filter, SlidersHorizontal, Hash, Tag, Activity } from 'lucide-react';

interface ColumnSchema {
  name: string;
  type: string;
  null_count: number;
  null_pct: number;
  unique_count: number;
  samples: string[];
}

interface FilterSidebarProps {
  columns: ColumnSchema[];
  selectedColumn: string | null;
  onSelectColumn: (col: string) => void;
}

export const AnalyticsFilterSidebar: React.FC<FilterSidebarProps> = ({
  columns,
  selectedColumn,
  onSelectColumn,
}) => {
  return (
    <div className="w-full lg:w-80 shrink-0 bg-[#15191C]/90 border border-[#242A2E] rounded-2xl p-4 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#242A2E] pb-3">
        <Filter className="w-4 h-4 text-[#76B900]" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Dataset Inspector & Slicers</h3>
      </div>

      {/* Columns List */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-gray-400">Available Columns ({columns.length})</span>
        <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
          {columns.map((col) => (
            <button
              key={col.name}
              onClick={() => onSelectColumn(col.name)}
              className={`w-full text-left p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between transition ${
                selectedColumn === col.name
                  ? 'bg-[#76B900]/20 border-[#76B900] text-white'
                  : 'bg-[#0B0D0E] border-[#242A2E] text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {col.type === 'numeric' ? (
                  <Hash className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                )}
                <span className="truncate">{col.name}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#15191C] text-gray-400 uppercase">
                {col.type}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Column Detail Breakdown */}
      {selectedColumn && (
        <div className="p-3 rounded-xl bg-[#0B0D0E] border border-[#76B900]/40 space-y-2 font-mono text-xs text-gray-300">
          <div className="flex items-center gap-1.5 text-[#76B900] font-bold">
            <Activity className="w-3.5 h-3.5" />
            <span className="truncate">{selectedColumn}</span>
          </div>
          {(() => {
            const c = columns.find((x) => x.name === selectedColumn);
            if (!c) return null;
            return (
              <div className="space-y-1 text-[11px] text-gray-400">
                <div className="flex justify-between">
                  <span>Unique Values:</span>
                  <span className="text-white font-bold">{c.unique_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Missing Values:</span>
                  <span className="text-white font-bold">{c.null_count} ({c.null_pct}%)</span>
                </div>
                {c.samples.length > 0 && (
                  <div className="pt-1 border-t border-[#242A2E]">
                    <span className="text-gray-500">Sample Values:</span>
                    <div className="text-[10px] text-emerald-400 truncate">{c.samples.join(', ')}</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
