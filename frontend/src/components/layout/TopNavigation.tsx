import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, Compass, Cpu, Database, Settings, ArrowLeft, Box } from 'lucide-react';

export const TopNavigation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-[#0B0D0E]/80 backdrop-blur-xl border-b border-[#242A2E]/80 px-4 md:px-6 flex items-center justify-between shrink-0 select-none z-30 shadow-glow-nvidia">
      {/* Brand Logo & Back Control */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#15191C] border border-[#242A2E] text-gray-300 hover:text-[#76B900] hover:border-[#76B900]/60 transition text-xs font-semibold"
          title="Back to Workspace Chat"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Workspace</span>
        </button>

        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#76B900] to-emerald-400 flex items-center justify-center text-black font-extrabold shadow-md shadow-[#76B900]/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-extrabold tracking-tight text-white flex items-center gap-1 font-mono">
              KIRSTON<span className="text-[#76B900]">AI</span>
            </h1>
            <p className="text-[8px] text-[#76B900] tracking-wider uppercase font-mono font-semibold">
              NVIDIA NIM RAG
            </p>
          </div>
        </div>
      </div>

      {/* Navigation HUD Tabs */}
      <nav className="flex items-center gap-1 text-xs">
        <NavLink
          to="/3d-generator"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition font-medium ${
              isActive
                ? 'bg-[#15191C] text-[#76B900] border border-[#76B900]/60 shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#181C20]'
            }`
          }
        >
          <Box className="w-3.5 h-3.5 text-[#76B900]" />
          <span>3D Studio</span>
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition font-medium ${
              isActive
                ? 'bg-[#15191C] text-[#76B900] border border-[#76B900]/60 shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#181C20]'
            }`
          }
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Explore</span>
        </NavLink>

        <NavLink
          to="/models"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition font-medium ${
              isActive
                ? 'bg-[#15191C] text-[#76B900] border border-[#76B900]/60 shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#181C20]'
            }`
          }
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Models</span>
        </NavLink>

        <NavLink
          to="/knowledge"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition font-medium ${
              isActive
                ? 'bg-[#15191C] text-[#76B900] border border-[#76B900]/60 shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#181C20]'
            }`
          }
        >
          <Database className="w-3.5 h-3.5" />
          <span>Knowledge</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#181C20] transition ${
              isActive ? 'text-[#76B900] bg-[#15191C] border border-[#76B900]/40' : ''
            }`
          }
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </NavLink>
      </nav>
    </header>
  );
};
