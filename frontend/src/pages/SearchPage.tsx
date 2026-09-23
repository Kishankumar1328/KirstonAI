import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchChats } from '../components/sidebar/SearchChats';
import { ArrowLeft } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-gray-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Chat</span>
        </button>

        <h1 className="text-xl font-bold text-white">Search Conversations</h1>
        <SearchChats onSelectConversation={(id) => navigate(`/chat/${id}`)} />
      </div>
    </div>
  );
};
