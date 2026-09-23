import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../../types/conversation';
import { MessageSquare, MoreHorizontal, Edit2, Trash2, Check, X, Sparkles } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(conversation.title);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const threadStream = useChatStore((state) => state.threadStreams[conversation.id]);
  const isThreadGenerating = threadStream?.isStreaming || false;

  useEffect(() => {
    setTitleInput(conversation.title);
  }, [conversation.title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveRename = () => {
    if (titleInput.trim() && titleInput !== conversation.title) {
      onRename(conversation.id, titleInput.trim());
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  return (
    <div
      onClick={() => !isEditing && onSelect(conversation.id)}
      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition ${
        isActive
          ? 'bg-[#76B900]/15 dark:bg-[#76B900]/15 light:bg-[#76B900]/20 text-white dark:text-white light:text-[#0F172A] border border-[#76B900]/40 font-bold shadow-sm'
          : 'text-gray-400 dark:text-gray-400 light:text-[#334155] hover:text-gray-200 light:hover:text-[#0F172A] hover:bg-[#15191C]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
        <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#76B900]' : 'text-gray-500 light:text-gray-400'}`} />

        {isEditing ? (
          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
              autoFocus
              className="w-full bg-[#0B0D0E] dark:bg-[#0B0D0E] light:bg-[#F1F5F9] border border-[#76B900]/60 rounded px-1.5 py-0.5 text-xs text-white dark:text-white light:text-[#0F172A] focus:outline-none"
            />
            <button onClick={handleSaveRename} className="p-0.5 hover:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsEditing(false)} className="p-0.5 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="truncate">{conversation.title}</span>

            {/* Background Stream Active Indicator Badge */}
            {isThreadGenerating && (
              <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#76B900]/20 border border-[#76B900]/50 text-[#76B900] text-[9px] font-mono animate-pulse">
                <Sparkles className="w-2.5 h-2.5 text-[#76B900] animate-spin" />
                <span>Generating...</span>
              </span>
            )}
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#15191C] dark:hover:bg-[#15191C] light:hover:bg-[#E2E8F0] border border-transparent hover:border-[#242A2E] rounded text-gray-400 hover:text-white transition"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-6 z-50 w-32 bg-[#15191C] dark:bg-[#15191C] light:bg-[#FFFFFF] border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] rounded-xl shadow-xl py-1 text-xs text-gray-300 dark:text-gray-300 light:text-[#0F172A] backdrop-blur">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#242A2E] dark:hover:bg-[#242A2E] light:hover:bg-[#F1F5F9] hover:text-white"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this conversation?')) {
                    onDelete(conversation.id);
                  }
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-red-500/20 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              </div>
          )}
        </div>
      )}
    </div>
  );
};
