import React, { useEffect, useState, useRef } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { SourcePreviewPanel } from './SourcePreviewPanel';
import { useChat } from '../../hooks/useChat';
import { RAGSource } from '../../types/chat';
import { Menu, FolderUp, Settings, Cpu, ChevronDown, Check } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useNavigate } from 'react-router-dom';

interface ChatWindowProps {
  threadId: string | null;
}

export const MODEL_OPTIONS = [
  { id: 'nvidia/nemotron-3.5-lightning-30b-a3b', name: 'Nemotron 3.5 Lightning (Reasoning)', category: 'Text & Reasoning' },
  { id: 'nvidia/flux.1-dev-nim', name: 'FLUX.1 NIM (Image Generation)', category: 'Image Generation' },
  { id: 'nvidia/nemotron-speech-v1', name: 'Nemotron Speech NIM (Text-to-Speech)', category: 'Text-to-Speech' },
  { id: 'nvidia/neva-22b', name: 'NeVA 22B (Code & Multimodal)', category: 'Code Tutor' },
];

export const ChatWindow: React.FC<ChatWindowProps> = ({ threadId }) => {
  const [selectedModel, setSelectedModel] = useState<string>('nvidia/nemotron-3.5-lightning-30b-a3b');
  
  const {
    messages,
    isStreaming,
    streamingContent,
    streamingReasoning,
    streamingSources,
    loadMessages,
    sendMessage,
    stopGeneration,
    regenerateResponse,
  } = useChat(threadId, selectedModel);

  const { toggleSidebar, setDocumentModalOpen, conversations } = useChatStore();
  const [selectedSource, setSelectedSource] = useState<RAGSource | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (threadId) {
      loadMessages(threadId);
    }
    setSelectedSource(null);
  }, [threadId]);

  // Click outside handler for Model Selector dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeConv = conversations.find((c) => c.id === threadId);
  const currentModelObj = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0];

  const handleRegenerateLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      regenerateResponse(lastUserMsg.content);
    }
  };

  return (
    <div className="flex-1 flex h-full bg-[#0B0D0E] relative overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Clean Header with High Z-Index for Dropdown Overlay */}
        <header className="h-14 border-b border-[#242A2E]/60 px-4 flex items-center justify-between bg-[#111417]/90 backdrop-blur-md shrink-0 select-none z-30 relative">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-1.5 rounded-lg bg-[#15191C] border border-[#242A2E] text-gray-300 hover:text-white"
              title="Toggle Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <h2 className="text-xs font-semibold text-white truncate max-w-xs md:max-w-md font-mono hidden sm:block">
                {activeConv ? activeConv.title : 'KirstonAI Workspace'}
              </h2>

              {/* Dedicated Active Model Selector Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#15191C] border border-[#76B900]/60 text-[#76B900] hover:border-[#76B900] text-xs font-mono font-bold transition shadow-sm hover:shadow-glow-nvidia"
                >
                  <Cpu className="w-4 h-4 text-[#76B900]" />
                  <span>{currentModelObj.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-[#15191C] border border-[#76B900]/60 rounded-2xl p-2.5 shadow-2xl z-50 space-y-1.5 backdrop-blur-xl shadow-glow-nvidia animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-[#242A2E] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Select Active NIM Model</span>
                      <span className="text-[10px] text-[#76B900] font-mono font-bold">4 Models</span>
                    </div>

                    <div className="space-y-1">
                      {MODEL_OPTIONS.map((m) => {
                        const isSelected = selectedModel === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedModel(m.id);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition flex items-center justify-between group ${
                              isSelected
                                ? 'bg-[#76B900] text-black font-extrabold shadow-md shadow-[#76B900]/25'
                                : 'text-gray-300 hover:bg-[#1C2125] hover:text-white border border-transparent hover:border-[#242A2E]'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="font-sans text-xs">{m.name}</div>
                              <div className={`text-[10px] font-mono ${isSelected ? 'text-black/80 font-bold' : 'text-gray-400'}`}>
                                {m.category}
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Right Quick Actions */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setDocumentModalOpen(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-[#15191C] border border-[#76B900]/40 hover:border-[#76B900] text-[#76B900] transition font-semibold shadow-sm"
            >
              <FolderUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Knowledge Upload</span>
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#15191C] border border-transparent hover:border-[#242A2E] transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Stream Area (Lower Z-Index than Header Dropdown) */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col relative z-10">
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            streamingReasoning={streamingReasoning}
            streamingSources={streamingSources}
            onRegenerate={handleRegenerateLast}
            onExampleClick={sendMessage}
            onSelectSource={setSelectedSource}
            onStop={stopGeneration}
          />
        </div>

        {/* Floating Input Area */}
        <ChatInput
          onSend={sendMessage}
          isStreaming={isStreaming}
          onStop={stopGeneration}
          selectedModel={selectedModel}
        />
      </div>

      {/* RAG Source Preview Side Drawer */}
      {selectedSource && (
        <SourcePreviewPanel
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </div>
  );
};
