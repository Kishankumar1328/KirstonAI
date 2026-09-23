import React from 'react';
import { BarChart3, TrendingUp, Users, Layers, Database, FileSpreadsheet, ChevronRight } from 'lucide-react';

export interface DashboardPageTab {
  id: string;
  title: string;
  icon: string;
  description: string;
  kpis: any[];
  charts: any[];
}

interface PageSidebarProps {
  filename: string;
  rowCount: number;
  columnCount: number;
  pages: DashboardPageTab[];
  activePageId: string;
  onSelectPage: (pageId: string) => void;
}

export const AnalyticsPageSidebar: React.FC<PageSidebarProps> = ({
  filename,
  rowCount,
  columnCount,
  pages,
  activePageId,
  onSelectPage,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp':
        return <TrendingUp className="w-4 h-4" />;
      case 'Users':
        return <Users className="w-4 h-4" />;
      case 'Layers':
        return <Layers className="w-4 h-4" />;
      case 'Database':
        return <Database className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full lg:w-64 shrink-0 bg-[#15191C] dark:bg-[#15191C] light:bg-[#FFFFFF] border-r border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] flex flex-col justify-between p-3 select-none">
      <div className="space-y-4">
        {/* Active Dataset Pill */}
        <div className="p-3 rounded-2xl bg-[#0B0D0E] dark:bg-[#0B0D0E] light:bg-[#F8FAFC] border border-[#76B900]/40 space-y-1 font-mono text-xs shadow-sm">
          <div className="flex items-center gap-2 text-[#76B900] dark:text-[#76B900] light:text-[#3f6212] font-bold">
            <FileSpreadsheet className="w-4 h-4 shrink-0 text-[#76B900]" />
            <span className="truncate">{filename}</span>
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-400 light:text-gray-600 font-semibold">
            {rowCount.toLocaleString()} rows • {columnCount} cols
          </div>
        </div>

        {/* Dynamic Navigation Pages List */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider font-semibold px-2 pb-1">
            Dashboard Pages ({pages.length})
          </div>

          {pages.map((p) => {
            const isActive = activePageId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPage(p.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-sans font-medium transition ${
                  isActive
                    ? 'bg-[#76B900]/20 dark:bg-[#76B900]/20 light:bg-[#76B900]/25 border-[#76B900] text-white dark:text-white light:text-[#0F172A] font-bold shadow-sm'
                    : 'bg-[#0B0D0E]/50 dark:bg-[#0B0D0E]/50 light:bg-[#F1F5F9] border-transparent dark:border-transparent light:border-[#E2E8F0] text-gray-400 dark:text-gray-400 light:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-[#0F172A] hover:bg-[#0B0D0E]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-[#76B900]' : 'text-gray-500 light:text-gray-400'}>
                    {getIcon(p.icon)}
                  </span>
                  <span className="truncate">{p.title}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#76B900] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer System Pill */}
      <div className="p-2.5 rounded-xl bg-[#0B0D0E] dark:bg-[#0B0D0E] light:bg-[#F8FAFC] border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] text-[10px] font-mono text-gray-400 dark:text-gray-400 light:text-gray-600 text-center font-semibold">
        ⚡ Multi-Page Power BI Engine
      </div>
    </div>
  );
};
