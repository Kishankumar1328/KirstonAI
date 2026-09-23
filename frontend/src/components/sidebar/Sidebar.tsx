import React from 'react';
import { useConversations } from '../../hooks/useConversations';
import { ConversationItem } from './ConversationItem';
import { useChatStore } from '../../store/chatStore';
import { Plus, Search, Sparkles, Database, X, Paperclip, BarChart2, Box } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  activeThreadId?: string | null;
  onSelectThread?: (threadId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeThreadId, onSelectThread }) => {
  const { conversations, createNewChat, renameConversation, deleteConversation } = useConversations();
  const { isSidebarOpen, setSidebarOpen, useRag, setUseRag, searchQuery, setSearchQuery, setActiveThreadId } = useChatStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isKnowledgeRoute = location.pathname === '/knowledge';

  const handleNewChat = async () => {
    const threadId = await createNewChat();
    setActiveThreadId(threadId);
    if (onSelectThread) onSelectThread(threadId);
    navigate(`/chat/${threadId}`);
    setSidebarOpen(false);
  };

  const handleSelectConversation = (threadId: string) => {
    setActiveThreadId(threadId);
    if (onSelectThread) onSelectThread(threadId);
    navigate(`/chat/${threadId}`);
    setSidebarOpen(false);
  };

  const filteredConversations = conversations.filter((c) =>
    (c.title || 'New Conversation').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] bg-[#0B0D0E] dark:bg-[#0B0D0E] light:bg-[#FFFFFF] border-r border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] flex flex-col transition-transform duration-300 ease-in-out font-sans ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-4 border-b border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleNewChat}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#76B900] to-emerald-400 flex items-center justify-center text-black font-extrabold shadow-glow-nvidia">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white dark:text-white light:text-[#0F172A] tracking-wide font-sans">KIRSTON AI</h1>
              <p className="text-[9px] text-[#76B900] dark:text-[#76B900] light:text-[#3f6212] font-mono font-bold tracking-wider uppercase">NEMOTRON MULTIMODAL RAG</p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="p-3 space-y-2 border-b border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0]">
          <div className="text-[10px] font-mono text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider font-semibold">Workspace Mode</div>
          <div className="grid grid-cols-2 p-1 bg-[#15191C] dark:bg-[#15191C] light:bg-[#F1F5F9] rounded-xl border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] text-xs font-mono font-semibold">
            <button
              onClick={handleNewChat}
              className={`py-1.5 rounded-lg transition ${
                !isKnowledgeRoute ? 'bg-[#76B900] text-black shadow-sm font-extrabold' : 'text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white'
              }`}
            >
              Unified AI
            </button>
            <button
              onClick={() => {
                setUseRag(true);
                navigate('/knowledge');
              }}
              className={`py-1.5 rounded-lg transition ${
                isKnowledgeRoute ? 'bg-[#76B900] text-black shadow-sm font-extrabold' : 'text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white'
              }`}
            >
              Knowledge
            </button>
          </div>
        </div>

        {/* New Chat Action Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#76B900] to-emerald-500 hover:from-[#84cc16] hover:to-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-glow-nvidia active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#15191C] dark:bg-[#15191C] light:bg-[#F1F5F9] border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] rounded-xl text-xs text-gray-300 dark:text-gray-300 light:text-[#0F172A] focus-within:border-[#76B900]/50 transition">
            <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find conversations..."
              className="w-full bg-transparent text-xs text-white dark:text-white light:text-[#0F172A] placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Streamlined Features Catalog Shortcuts */}
        <div className="px-4 pb-2 space-y-1.5">
          <p className="text-[10px] text-gray-400 dark:text-gray-400 light:text-gray-600 font-mono uppercase tracking-wider font-semibold">Specialized Studios</p>
          <div className="space-y-1.5 text-[11px] font-medium">
            <button
              onClick={() => navigate('/3d-generator')}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#15191C] dark:bg-[#15191C] light:bg-[#F8FAFC] border border-[#76B900]/70 hover:border-[#76B900] text-[#76B900] dark:text-[#76B900] light:text-[#3f6212] font-bold transition shadow-sm"
            >
              <Box className="w-4 h-4 text-[#76B900] shrink-0" />
              <span className="truncate">3D Object Generator</span>
            </button>
            <button
              onClick={() => navigate('/coding')}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#15191C] dark:bg-[#15191C] light:bg-[#F8FAFC] border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] hover:border-[#76B900]/50 text-gray-300 dark:text-gray-300 light:text-[#0F172A] font-semibold transition"
            >
              <Sparkles className="w-4 h-4 text-[#76B900] shrink-0" />
              <span className="truncate">Autonomous Coding Agent</span>
            </button>
            <button
              onClick={() => navigate('/file-chat')}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#15191C] dark:bg-[#15191C] light:bg-[#F8FAFC] border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] hover:border-[#76B900]/50 text-gray-300 dark:text-gray-300 light:text-[#0F172A] font-semibold transition"
            >
              <Paperclip className="w-4 h-4 text-[#76B900] shrink-0" />
              <span className="truncate">AI File Chat Studio</span>
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#15191C] dark:bg-[#15191C] light:bg-[#F8FAFC] border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] hover:border-[#76B900]/50 text-gray-300 dark:text-gray-300 light:text-[#0F172A] font-semibold transition"
            >
              <BarChart2 className="w-4 h-4 text-[#76B900] shrink-0" />
              <span className="truncate">AI Data Analytics Studio</span>
            </button>
            <button
              onClick={() => {
                setUseRag(true);
                navigate('/knowledge');
              }}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#15191C] dark:bg-[#15191C] light:bg-[#F8FAFC] border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] hover:border-[#76B900]/50 text-gray-300 dark:text-gray-300 light:text-[#0F172A] font-semibold transition"
            >
              <Database className="w-4 h-4 text-[#76B900] shrink-0" />
              <span className="truncate">RAG Knowledge Base</span>
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 py-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500 font-mono">No chat threads found</div>
          ) : (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeThreadId === conv.id}
                onSelect={() => handleSelectConversation(conv.id)}
                onRename={(newTitle) => renameConversation(conv.id, newTitle)}
                onDelete={() => deleteConversation(conv.id)}
              />
            ))
          )}
        </div>

        {/* Bottom Bar: RAG Toggle Switch */}
        <div className="p-3 border-t border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] bg-[#111417]/80 dark:bg-[#111417]/80 light:bg-[#F8FAFC] space-y-2">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#15191C] dark:bg-[#15191C] light:bg-[#FFFFFF] border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#76B900]" />
              <span className="text-xs font-mono font-medium text-gray-300 dark:text-gray-300 light:text-[#0F172A]">RAG Grounding</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={useRag}
              onClick={() => setUseRag(!useRag)}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                useRag ? 'bg-[#76B900]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  useRag ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
