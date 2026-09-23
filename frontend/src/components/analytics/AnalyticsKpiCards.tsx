import React from 'react';
import { Database, Layers, CheckCircle2, TrendingUp, BarChart2 } from 'lucide-react';

interface KpiCardsProps {
  rowCount: number;
  columnCount: number;
  filename: string;
  nullPctAverage: number;
}

export const AnalyticsKpiCards: React.FC<KpiCardsProps> = ({
  rowCount,
  columnCount,
  filename,
  nullPctAverage,
}) => {
  const healthScore = Math.max(0, 100 - nullPctAverage);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Records */}
      <div className="p-4 rounded-2xl bg-[#15191C]/90 border border-[#242A2E] hover:border-[#76B900]/50 transition shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-gray-400">Total Rows / Records</span>
          <div className="w-8 h-8 rounded-xl bg-[#76B900]/15 text-[#76B900] flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight">{rowCount.toLocaleString()}</div>
        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-[#76B900]" /> High-density structured dataset
        </div>
      </div>

      {/* Card 2: Column Attributes */}
      <div className="p-4 rounded-2xl bg-[#15191C]/90 border border-[#242A2E] hover:border-[#76B900]/50 transition shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-gray-400">Columns / Dimensions</span>
          <div className="w-8 h-8 rounded-xl bg-[#76B900]/15 text-[#76B900] flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight">{columnCount}</div>
        <div className="text-[10px] text-gray-400 font-mono truncate">Active schema ({filename})</div>
      </div>

      {/* Card 3: Data Quality Health */}
      <div className="p-4 rounded-2xl bg-[#15191C]/90 border border-[#242A2E] hover:border-[#76B900]/50 transition shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-gray-400">Data Quality Score</span>
          <div className="w-8 h-8 rounded-xl bg-[#76B900]/15 text-[#76B900] flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-[#76B900] tracking-tight">{healthScore.toFixed(1)}%</div>
        <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
          ✓ Verified completeness check
        </div>
      </div>

      {/* Card 4: AI Analysis Status */}
      <div className="p-4 rounded-2xl bg-[#15191C]/90 border border-[#242A2E] hover:border-[#76B900]/50 transition shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-gray-400">AI Analytics Pipeline</span>
          <div className="w-8 h-8 rounded-xl bg-[#76B900]/15 text-[#76B900] flex items-center justify-center">
            <BarChart2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white tracking-tight">Active</div>
        <div className="text-[10px] text-gray-400 font-mono">Dynamic Power BI grid layout</div>
      </div>
    </div>
  );
};
