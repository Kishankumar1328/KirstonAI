import React from 'react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { FileChatWindow } from '../components/filechat/FileChatWindow';
import { useNavigate } from 'react-router-dom';

export const FileChatPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#0B0D0E] text-gray-100 overflow-hidden font-sans">
      <Sidebar
        activeThreadId={null}
        onSelectThread={(id) => navigate(`/chat/${id}`)}
      />
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        <FileChatWindow />
      </main>
    </div>
  );
};
