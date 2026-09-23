import React, { useState } from 'react';
import { Table as TableIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface ColumnSchema {
  name: string;
  type: string;
}

interface DataTableProps {
  columns: ColumnSchema[];
  rows: Record<string, any>[];
}

export const AnalyticsDataTable: React.FC<DataTableProps> = ({ columns, rows }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredRows = rows.filter((row) =>
    Object.values(row).some((val) =>
      String(val ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-[#15191C]/90 border border-[#242A2E] rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#242A2E] pb-3">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-[#76B900]" />
          <h3 className="text-sm font-bold text-white font-sans">Dynamic Dataset Grid ({rows.length} Preview Records)</h3>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search dataset rows..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#0B0D0E] border border-[#242A2E] focus:border-[#76B900] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Table Graphic Grid */}
      <div className="overflow-x-auto border border-[#242A2E] rounded-xl">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead className="bg-[#0B0D0E] text-gray-400 border-b border-[#242A2E]">
            <tr>
              {columns.map((c) => (
                <th key={c.name} className="p-3 font-semibold whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span>{c.name}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#15191C] text-[#76B900] uppercase font-bold">
                      {c.type}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242A2E] text-gray-200">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center text-gray-500">
                  No matching dataset records found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#15191C] transition">
                  {columns.map((c) => (
                    <td key={c.name} className="p-3 whitespace-nowrap max-w-[200px] truncate">
                      {String(row[c.name] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-2">
        <span>
          Page {currentPage} of {totalPages} ({filteredRows.length} items)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-[#0B0D0E] border border-[#242A2E] hover:border-[#76B900] disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-[#0B0D0E] border border-[#242A2E] hover:border-[#76B900] disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
