import React from 'react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { AnalyticsStudio } from '../components/analytics/AnalyticsStudio';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#0B0D0E] text-gray-100 overflow-hidden font-sans">
      <Sidebar />
      <AnalyticsStudio />
    </div>
  );
};
