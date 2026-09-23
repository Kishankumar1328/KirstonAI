import React from 'react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { Cpu, Database, Palette, Sliders, Moon, Sun, Check } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0D0E] dark:bg-[#0B0D0E] light:bg-[#F8FAFC] font-sans selection:bg-[#76B900]/30 selection:text-white transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto bg-[#0B0D0E] text-gray-100 p-4 md:p-8">
        <main className="max-w-4xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="border-b border-[#242A2E] pb-4">
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#76B900]" />
              <span>KirstonAI Settings & Theme Center</span>
            </h1>
            <p className="text-xs text-gray-400">
              Configure appearance theme (NVIDIA Green Dark/Light), LLM model defaults, RAG parameters, and system preferences.
            </p>
          </div>

          {/* Section 1: Appearance & Theme */}
          <div className="bg-[#15191C] border border-[#242A2E] rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 text-[#76B900] font-bold text-sm">
              <Palette className="w-4 h-4" />
              <span>Appearance & Theme Selection</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dark Theme Option Card */}
              <div
                onClick={() => setTheme('dark')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                  theme === 'dark'
                    ? 'border-[#76B900] bg-[#0B0D0E] ring-2 ring-[#76B900]/30 shadow-glow-nvidia'
                    : 'border-[#242A2E] bg-[#0B0D0E]/60 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <Moon className="w-4.5 h-4.5 text-[#76B900]" />
                    <span>NVIDIA Charcoal Dark</span>
                  </div>
                  {theme === 'dark' && (
                    <span className="w-5 h-5 rounded-full bg-[#76B900] text-black flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Sleek dark background (`#0B0D0E`), charcoal cards, and vibrant NVIDIA Green (`#76B900`) highlights.
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-[#242A2E]">
                  <div className="w-4 h-4 rounded-full bg-[#0B0D0E] border border-gray-700" title="Background #0B0D0E" />
                  <div className="w-4 h-4 rounded-full bg-[#15191C] border border-gray-700" title="Card #15191C" />
                  <div className="w-4 h-4 rounded-full bg-[#76B900]" title="NVIDIA Green Accent #76B900" />
                </div>
              </div>

              {/* Light Theme Option Card */}
              <div
                onClick={() => setTheme('light')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                  theme === 'light'
                    ? 'border-[#76B900] bg-white ring-2 ring-[#76B900]/30 shadow-lg'
                    : 'border-[#242A2E] bg-[#15191C]/60 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <Sun className="w-4.5 h-4.5 text-[#76B900]" />
                    <span>NVIDIA Clean Light</span>
                  </div>
                  {theme === 'light' && (
                    <span className="w-5 h-5 rounded-full bg-[#76B900] text-black flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Clean light background (`#F8FAFC`), crisp white cards, and vibrant NVIDIA Green (`#76B900`) highlights.
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-[#242A2E]">
                  <div className="w-4 h-4 rounded-full bg-[#F8FAFC] border border-gray-300" title="Background #F8FAFC" />
                  <div className="w-4 h-4 rounded-full bg-white border border-gray-300" title="Card #FFFFFF" />
                  <div className="w-4 h-4 rounded-full bg-[#76B900]" title="NVIDIA Green Accent #76B900" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Model Configuration */}
          <div className="bg-[#15191C] border border-[#242A2E] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-[#76B900] font-bold text-sm">
              <Cpu className="w-4 h-4" />
              <span>Model Defaults & NIM Endpoints</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-[#0B0D0E] border border-[#242A2E] space-y-2">
                <label className="block font-semibold text-white">Default LLM Reasoning Model</label>
                <select className="w-full bg-[#15191C] border border-[#242A2E] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#76B900]">
                  <option value="nvidia/nemotron-3.5-lightning-30b-a3b">
                    nvidia/nemotron-3.5-lightning-30b-a3b (Primary Reasoning)
                  </option>
                  <option value="nvidia/llama-3.1-nemotron-70b-instruct">
                    nvidia/llama-3.1-nemotron-70b-instruct (70B Instruct)
                  </option>
                  <option value="nvidia/nemotron-mini-4b-instruct">
                    nvidia/nemotron-mini-4b-instruct (Fast 4B)
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: RAG Knowledge Store */}
          <div className="bg-[#15191C] border border-[#242A2E] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Database className="w-4 h-4" />
              <span>RAG Vector Search Parameters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-[#0B0D0E] border border-[#242A2E]">
                <p className="font-semibold text-white mb-1">Max Top-K Retrieved Chunks</p>
                <p className="text-gray-400 text-[11px]">3 Top similarity chunks per query</p>
              </div>
              <div className="p-4 rounded-xl bg-[#0B0D0E] border border-[#242A2E]">
                <p className="font-semibold text-white mb-1">Vector Storage Provider</p>
                <p className="text-gray-400 text-[11px]">PostgreSQL pgvector Cosine Similarity Index</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
