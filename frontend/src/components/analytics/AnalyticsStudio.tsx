import React, { useState, useRef } from 'react';
import { Sparkles, UploadCloud, BarChart2, Loader2, Send } from 'lucide-react';
import { AnalyticsKpiCards } from './AnalyticsKpiCards';
import { AnalyticsChartGrid, ChartWidgetSpec } from './AnalyticsChartGrid';
import { AnalyticsFilterSidebar } from './AnalyticsFilterSidebar';
import { AnalyticsDataTable } from './AnalyticsDataTable';
import { AnalyticsPageSidebar, DashboardPageTab } from './AnalyticsPageSidebar';

interface ColumnSchema {
  name: string;
  type: string;
  null_count: number;
  null_pct: number;
  unique_count: number;
  samples: string[];
}

interface DatasetDetails {
  id: string;
  filename: string;
  row_count: number;
  column_count: number;
  schema_info: ColumnSchema[];
  summary_stats: any;
  preview_records: Record<string, any>[];
  pages: DashboardPageTab[];
}

export const AnalyticsStudio: React.FC = () => {
  const [dataset, setDataset] = useState<DatasetDetails | null>(null);
  const [activePageId, setActivePageId] = useState<string>('overview');
  const [customWidgets, setCustomWidgets] = useState<ChartWidgetSpec[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [promptText, setPromptText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${BASE_URL}/api/v1/analytics/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Dataset upload failed.');
      const data = await res.json();
      const struct = data.multi_page_dashboard || { pages: [] };

      setDataset({
        id: data.dataset_id,
        filename: data.filename,
        row_count: data.row_count,
        column_count: data.column_count,
        schema_info: data.schema_info,
        summary_stats: data.summary_stats,
        preview_records: data.preview_records,
        pages: struct.pages || [],
      });

      setCustomWidgets([]);
      if (struct.pages?.length > 0) {
        setActivePageId(struct.pages[0].id);
      }
      if (data.schema_info?.length > 0) {
        setSelectedColumn(data.schema_info[0].name);
      }
    } catch (err: any) {
      console.error('Analytics Upload Error:', err);
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAiQuery = async (queryStr?: string) => {
    const queryToRun = queryStr || promptText.trim();
    if (!queryToRun || !dataset || querying) return;

    setQuerying(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${BASE_URL}/api/v1/analytics/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: dataset.id,
          prompt: queryToRun,
        }),
      });

      if (!res.ok) throw new Error('AI Analytics query failed.');
      const newChartSpec = await res.json();

      const widgetObj: ChartWidgetSpec = {
        id: crypto.randomUUID(),
        chartType: newChartSpec.chartType || 'bar',
        title: newChartSpec.title || 'AI Analysis Chart',
        xAxisColumn: newChartSpec.xAxisColumn,
        yAxisColumn: newChartSpec.yAxisColumn,
        aggregate: newChartSpec.aggregate || 'sum',
        insight: newChartSpec.insight,
        data: newChartSpec.data || [],
      };

      setCustomWidgets((prev) => [widgetObj, ...prev]);
      setPromptText('');
    } catch (err: any) {
      console.error('AI Query Error:', err);
    } finally {
      setQuerying(false);
    }
  };

  const activePage = dataset?.pages.find((p) => p.id === activePageId) || dataset?.pages[0];
  const avgNullPct = dataset
    ? dataset.schema_info.reduce((acc, c) => acc + c.null_pct, 0) / (dataset.schema_info.length || 1)
    : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0D0E] relative overflow-hidden select-none">
      {/* Top Action Bar */}
      <header className="h-14 border-b border-[#242A2E] px-5 flex items-center justify-between bg-[#15191C]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#76B900] to-emerald-400 flex items-center justify-center text-black font-extrabold shadow-sm">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">AI Data Analytics & Visualization Studio</h2>
            <p className="text-[10px] text-[#76B900] font-mono">Multi-Page Power BI Suite & Automated Dataset Inspector</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#76B900] to-emerald-500 hover:from-[#84cc16] hover:to-emerald-400 text-black font-extrabold text-xs transition shadow-glow-nvidia disabled:opacity-40"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <UploadCloud className="w-4 h-4 text-black stroke-[2.5]" />
            )}
            <span>{dataset ? 'Switch / Upload Dataset' : 'Upload Data (CSV / Excel / JSON)'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout with Left Sub-Navigation Sidebar */}
      {!dataset ? (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-xl mx-auto my-16 text-center space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-[#76B900]/15 border border-[#76B900]/40 flex items-center justify-center text-[#76B900] mx-auto shadow-glow-nvidia">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">Multi-Page Power BI Analytics Suite</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Upload your structured dataset (CSV, Excel `.xlsx`, or JSON). Automatically generates up to 5 dynamic, dataset-tailored pages: Executive Overview, Performance, Segment Analysis, Product Breakdown, and Data Explorer.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#76B900] to-emerald-500 text-black font-extrabold text-sm hover:from-[#84cc16] hover:to-emerald-400 transition"
            >
              Upload Dataset Now
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Sub-Navigation Left Sidebar */}
          <AnalyticsPageSidebar
            filename={dataset.filename}
            rowCount={dataset.row_count}
            columnCount={dataset.column_count}
            pages={dataset.pages}
            activePageId={activePageId}
            onSelectPage={(id) => setActivePageId(id)}
          />

          {/* Active Page View Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between border-b border-[#242A2E] pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-white font-sans">{activePage?.title || 'Dashboard'}</h3>
                <p className="text-xs text-gray-400">{activePage?.description || 'Dataset analytics overview'}</p>
              </div>
            </div>

            {/* AI Natural Language Search Dock */}
            <div className="bg-[#15191C]/90 border border-[#76B900]/50 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#76B900]" />
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  AI Natural Language Charting Engine
                </span>
              </div>

              <div className="flex items-center gap-2 bg-[#0B0D0E] border border-[#242A2E] focus-within:border-[#76B900] rounded-xl p-2 transition">
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()}
                  placeholder="Ask any natural-language question e.g. 'show sales by category'..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
                />
                <button
                  onClick={() => handleAiQuery()}
                  disabled={!promptText.trim() || querying}
                  className="p-2 rounded-lg bg-[#76B900] hover:bg-[#84cc16] text-black font-bold transition disabled:opacity-40"
                >
                  {querying ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Send className="w-4 h-4 text-black" />}
                </button>
              </div>
            </div>

            {/* Dynamic Custom AI Charts */}
            {customWidgets.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-mono text-[#76B900] font-bold">✨ Custom AI Generated Visualizations</div>
                <AnalyticsChartGrid widgets={customWidgets} />
              </div>
            )}

            {/* Render Page Specific Content */}
            {activePageId === 'overview' && (
              <>
                <AnalyticsKpiCards
                  rowCount={dataset.row_count}
                  columnCount={dataset.column_count}
                  filename={dataset.filename}
                  nullPctAverage={avgNullPct}
                />
                {activePage?.kpis && activePage.kpis.length > 0 && <AnalyticsChartGrid widgets={activePage.kpis} />}
                <AnalyticsChartGrid widgets={activePage?.charts || []} />
              </>
            )}

            {activePageId === 'performance' && (
              <AnalyticsChartGrid widgets={activePage?.charts || []} />
            )}

            {activePageId === 'segmentation' && (
              <AnalyticsChartGrid widgets={activePage?.charts || []} />
            )}

            {activePageId === 'products' && (
              <AnalyticsChartGrid widgets={activePage?.charts || []} />
            )}

            {activePageId === 'explorer' && (
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex-1">
                  <AnalyticsDataTable columns={dataset.schema_info} rows={dataset.preview_records} />
                </div>
                <AnalyticsFilterSidebar
                  columns={dataset.schema_info}
                  selectedColumn={selectedColumn}
                  onSelectColumn={(col) => setSelectedColumn(col)}
                />
              </div>
            )}

            {/* Fallback rendering for single page datasets */}
            {dataset.pages.length === 1 && (
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex-1 space-y-5">
                  <AnalyticsChartGrid widgets={activePage?.charts || []} />
                  <AnalyticsDataTable columns={dataset.schema_info} rows={dataset.preview_records} />
                </div>
                <AnalyticsFilterSidebar
                  columns={dataset.schema_info}
                  selectedColumn={selectedColumn}
                  onSelectColumn={(col) => setSelectedColumn(col)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
