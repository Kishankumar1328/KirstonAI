import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Sparkles } from 'lucide-react';

export interface ChartWidgetSpec {
  id: string;
  chartType: 'bar' | 'horizontal_bar' | 'line' | 'area' | 'pie' | 'kpi' | 'scatter';
  title: string;
  xAxisColumn: string;
  yAxisColumn: string;
  aggregate: string;
  insight?: string;
  data: Array<{ name: string; value: number }>;
}

interface ChartGridProps {
  widgets: ChartWidgetSpec[];
}

const COLORS = [
  '#76B900', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
  '#F59E0B', '#14B8A6', '#6366F1', '#F43F5E', '#06B6D4'
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const categoryName = item.payload?.name || item.name || 'Category';
    const val = item.value;
    const formattedVal = typeof val === 'number' ? val.toLocaleString() : val;
    return (
      <div className="bg-[#0B0D0E] border border-[#76B900]/70 p-3 rounded-xl shadow-2xl font-mono text-xs text-white space-y-1 z-50">
        <div className="font-bold text-[#76B900]">{categoryName}</div>
        <div className="text-gray-300">
          Value: <span className="text-white font-bold">{formattedVal}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Render clean percentage labels directly on Pie slices
const renderPieLabel = ({ percent }: any) => {
  if (!percent || percent < 0.04) return null;
  return `${(percent * 100).toFixed(0)}%`;
};

export const AnalyticsChartGrid: React.FC<ChartGridProps> = ({ widgets }) => {
  if (widgets.length === 0) {
    return (
      <div className="p-8 text-center bg-[#15191C]/70 border border-[#242A2E] rounded-2xl space-y-3">
        <BarChart3 className="w-10 h-10 text-gray-500 mx-auto" />
        <h4 className="text-sm font-bold text-gray-300">No chart widgets generated yet</h4>
        <p className="text-xs text-gray-500 font-mono">Ask a question in the search bar above to create dynamic AI charts.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {widgets.map((w) => (
        <div
          key={w.id}
          className="p-4 rounded-2xl bg-[#15191C]/90 dark:bg-[#15191C]/90 light:bg-white border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] shadow-sm space-y-3 font-sans"
        >
          {/* Widget Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#76B900]/20 border border-[#76B900]/40 flex items-center justify-center text-[#76B900]">
                {w.chartType === 'line' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : w.chartType === 'pie' ? (
                  <PieIcon className="w-4 h-4" />
                ) : (
                  <BarChart3 className="w-4 h-4" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white dark:text-white light:text-[#0F172A] font-sans">{w.title}</h4>
                <p className="text-[10px] text-gray-400 dark:text-gray-400 light:text-gray-600 font-mono">
                  {w.yAxisColumn} by {w.xAxisColumn} ({w.aggregate.toUpperCase()})
                </p>
              </div>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#76B900]/20 text-[#76B900] font-mono uppercase font-bold">
              {w.chartType}
            </span>
          </div>

          {/* Chart Graphic Render */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {w.chartType === 'line' ? (
                <LineChart data={w.data} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242A2E" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#76B900" strokeWidth={3} dot={{ fill: '#76B900', r: 4 }} />
                </LineChart>
              ) : w.chartType === 'area' ? (
                <AreaChart data={w.data} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242A2E" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#76B900" fill="#76B900" fillOpacity={0.25} strokeWidth={2} />
                </AreaChart>
              ) : w.chartType === 'horizontal_bar' ? (
                <BarChart data={w.data} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242A2E" />
                  <XAxis type="number" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#10B981" radius={[0, 6, 6, 0]} />
                </BarChart>
              ) : w.chartType === 'pie' ? (
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 10 }}>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={w.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={38}
                    outerRadius={70}
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {w.data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 10, fontFamily: 'sans-serif', paddingTop: 8 }}
                  />
                </PieChart>
              ) : (
                <BarChart data={w.data} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#242A2E" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#76B900" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* AI Insight Footer */}
          {w.insight && (
            <div className="p-2.5 rounded-xl bg-[#0B0D0E] dark:bg-[#0B0D0E] light:bg-[#F8FAFC] border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] text-xs text-gray-300 dark:text-gray-300 light:text-[#0F172A] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#76B900] shrink-0" />
              <span className="truncate">{w.insight}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
