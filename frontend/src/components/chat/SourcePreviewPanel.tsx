import React from 'react';
import { RAGSource } from '../../types/chat';
import { X, FileText, BookOpen, Layers, ExternalLink } from 'lucide-react';

interface SourcePreviewPanelProps {
  source: RAGSource | null;
  onClose: () => void;
}

export const SourcePreviewPanel: React.FC<SourcePreviewPanelProps> = ({ source, onClose }) => {
  if (!source) return null;

  return (
    <aside className="w-80 md:w-96 bg-surface border-l border-border/80 h-full flex flex-col z-30 shadow-2xl animate-in slide-in-from-right duration-200 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-accent-green">
          <BookOpen className="w-4 h-4" />
          <span>Source Document Preview</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-surface-hover text-gray-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Document Info Card */}
        <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-white font-medium text-xs">
            <FileText className="w-4 h-4 text-accent-green" />
            <span className="truncate">{source.filename}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-1 border-t border-border/40">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" /> RAG Similarity Score
            </span>
            <span className="text-accent-green font-bold">{source.score}</span>
          </div>
        </div>

        {/* Retrieved Snippet */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider text-[10px]">
            Retrieved Text Chunk
          </h4>
          <div className="bg-background/80 border border-border/60 rounded-xl p-3.5 text-xs text-gray-200 leading-relaxed font-mono whitespace-pre-wrap select-text">
            {source.snippet}
          </div>
        </div>
      </div>
    </aside>
  );
};
