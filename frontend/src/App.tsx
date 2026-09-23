import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { ModelsPage } from './pages/ModelsPage';
import { ExplorePage } from './pages/ExplorePage';
import { SettingsPage } from './pages/SettingsPage';
import { FileChatPage } from './pages/FileChatPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CodingAgentPage } from './pages/CodingAgentPage';
import { ThreeDStudioPage } from './pages/ThreeDStudioPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/chat/:threadId" element={<ChatPage />} />
        <Route path="/3d-generator" element={<ThreeDStudioPage />} />
        <Route path="/3d-generator/:id" element={<ThreeDStudioPage />} />
        <Route path="/coding" element={<CodingAgentPage />} />
        <Route path="/file-chat" element={<FileChatPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;
