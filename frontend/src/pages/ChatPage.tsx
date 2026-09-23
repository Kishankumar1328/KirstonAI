import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { DocumentUploadModal } from '../components/sidebar/DocumentUploadModal';
import { useChatStore } from '../store/chatStore';

export const ChatPage: React.FC = () => {
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const { activeThreadId, setActiveThreadId, conversations } = useChatStore();

  useEffect(() => {
    if (threadId) {
      setActiveThreadId(threadId);
    } else if (activeThreadId) {
      navigate(`/chat/${activeThreadId}`, { replace: true });
    } else if (conversations.length > 0) {
      navigate(`/chat/${conversations[0].id}`, { replace: true });
    } else {
      const newId = crypto.randomUUID();
      navigate(`/chat/${newId}`, { replace: true });
    }
  }, [threadId, activeThreadId, conversations]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0D0E] font-sans selection:bg-[#76B900]/30 selection:text-white">
      {/* 25% Left Sidebar */}
      <Sidebar
        activeThreadId={activeThreadId}
        onSelectThread={(id) => navigate(`/chat/${id}`)}
      />

      {/* 75% Right Workspace */}
      <ChatWindow threadId={activeThreadId} />

      {/* Knowledge Document Upload Modal */}
      <DocumentUploadModal />
    </div>
  );
};
