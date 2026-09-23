import React, { useState } from 'react';
import { Search, X, MessageSquare, Calendar } from 'lucide-react';
import { searchHistory } from '../../services/conversations';
import { SearchResult } from '../../types/conversation';
import { useChatStore } from '../../store/chatStore';

interface SearchChatsProps {
  onSelectConversation: (threadId: string) => void;
}

export const SearchChats: React.FC<SearchChatsProps> = ({ onSelectConversation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchHistory(val);
      setResults(res.results);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/60 border border-border/80 text-xs text-gray-400 hover:text-gray-200 hover:bg-surface-hover transition"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search chats...</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
          <div className="bg-surface border border-border/90 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Search Input Bar */}
            <div className="p-3 border-b border-border/60 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search titles and message contents..."
                autoFocus
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-hover text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-96 overflow-y-auto p-2">
              {loading ? (
                <div className="py-8 text-center text-xs text-gray-400">Searching history...</div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  {query ? 'No matching conversations found.' : 'Type a query to search chat history.'}
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectConversation(r.conversation_id);
                        setIsOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-surface-hover transition flex flex-col gap-1 border border-transparent hover:border-border/60"
                    >
                      <div className="flex items-center justify-between text-xs text-indigo-300 font-medium">
                        <span className="flex items-center gap-1.5 truncate">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                          {r.conversation_title}
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3" />
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 pl-5">{r.snippet}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
