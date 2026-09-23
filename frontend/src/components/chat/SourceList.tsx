import React, { useState } from 'react';
import { RAGSource } from '../../types/chat';
import { FileText, ChevronDown, ChevronUp, BookOpen, ExternalLink } from 'lucide-react';

interface SourceListProps {
  sources: RAGSource[];
  onSelectSource?: (source: RAGSource) => void;
}

export const SourceList: React.FC<SourceListProps> = ({ sources, onSelectSource }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mb-3 bg-card/80 border border-border/80 rounded-xl p-3 text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-accent-green font-medium hover:opacity-90 transition"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Retrieved {sources.length} RAG Grounding Source{sources.length > 1 ? 's' : ''}</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-2 border-t border-border/60 pt-2">
          {sources.map((src, idx) => (
            <div
              key={idx}
              onClick={() => onSelectSource && onSelectSource(src)}
              className="bg-background/80 hover:bg-surface-hover p-2.5 rounded-lg border border-border/50 text-gray-300 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between font-mono text-[11px] text-gray-400 mb-1">
                <span className="flex items-center gap-1 text-accent-green font-medium group-hover:underline">
                  <FileText className="w-3 h-3" />
                  [{idx + 1}] {src.filename}
                </span>
                <span className="text-gray-500 text-[10px] flex items-center gap-1">
                  Score: {src.score}
                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-white" />
                </span>
              </div>
              <p className="line-clamp-2 text-[11px] text-gray-300 italic">"{src.snippet}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
