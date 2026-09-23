import React, { useState, useEffect } from 'react';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Cpu, Search, ArrowRight, Sparkles, Image as ImageIcon, Volume2, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ModelCardData {
  id: string;
  name: string;
  provider: string;
  capability: string;
  description: string;
  status: string;
  is_default?: boolean;
}

const DEFAULT_NVIDIA_MODELS: ModelCardData[] = [
  {
    id: "nvidia/nemotron-3.5-lightning-30b-a3b",
    name: "Nemotron 3.5 Lightning 30B",
    provider: "NVIDIA",
    capability: "Reasoning / Chat",
    description: "Primary Nemotron reasoning model with fast token generation & extended thinking stream.",
    status: "Available",
    is_default: true,
  },
  {
    id: "nvidia/llama-3.1-nemotron-70b-instruct",
    name: "Llama 3.1 Nemotron 70B Instruct",
    provider: "NVIDIA",
    capability: "Reasoning / Chat",
    description: "High-capacity 70B parameter model tuned for technical instruction & document analysis.",
    status: "Available",
  },
  {
    id: "nvidia/flux-1-dev",
    name: "NVIDIA FLUX.1 Dev",
    provider: "NVIDIA",
    capability: "Image Generation",
    description: "State-of-the-art text-to-image NIM model for generating high-fidelity visuals & artwork.",
    status: "Available",
  },
  {
    id: "nvidia/nemotron-speech-v1",
    name: "NVIDIA Nemotron Speech TTS",
    provider: "NVIDIA",
    capability: "Text-to-Speech",
    description: "NVIDIA Nemotron Neural Speech NIM for high-definition natural text-to-speech audio synthesis.",
    status: "Available",
  },
  {
    id: "nvidia/neva-22b",
    name: "NVIDIA NeVA 22B Multimodal",
    provider: "NVIDIA",
    capability: "Multimodal Vision",
    description: "Visual reasoning NIM capable of understanding complex images, diagrams & spatial charts.",
    status: "Available",
  },
  {
    id: "nvidia/nv-embedqa-e5-v5",
    name: "NV EmbedQA E5 v5",
    provider: "NVIDIA",
    capability: "Embedding",
    description: "High-dimensional text embedding model for RAG vector index building.",
    status: "Available",
  }
];

export const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<ModelCardData[]>(DEFAULT_NVIDIA_MODELS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${BASE_URL}/api/v1/models`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setModels(data);
        }
      })
      .catch((err) => console.error('Using default models fallback:', err));
  }, []);

  const filtered = models.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.capability.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'All' || m.capability.toLowerCase().includes(filter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#0B0D0E] text-gray-100 flex flex-col font-sans">
      <TopNavigation />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#242A2E]/80 pb-4">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#76B900]" />
              <span>NVIDIA NIM AI Models Catalog</span>
            </h1>
            <p className="text-xs text-gray-400">
              NVIDIA Nemotron reasoning, FLUX.1 image, Nemotron Speech TTS, and embedding models available to KirstonAI.
            </p>
          </div>
        </div>

        {/* Search & Capability Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-[#15191C] border border-[#242A2E] rounded-xl px-3 py-2 text-xs w-full sm:w-80 focus-within:border-[#76B900]">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            {['All', 'Reasoning', 'Image', 'Speech', 'Embedding'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl border transition font-semibold whitespace-nowrap ${
                  filter === tab
                    ? 'bg-[#76B900]/20 border-[#76B900] text-[#76B900] shadow-sm'
                    : 'bg-[#15191C] border-[#242A2E] text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`bg-[#15191C]/90 border rounded-2xl p-5 space-y-3 transition flex flex-col justify-between shadow-xl ${
                m.is_default ? 'border-[#76B900] ring-1 ring-[#76B900]/40' : 'border-[#242A2E] hover:border-[#76B900]/50'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#0B0D0E] border border-[#76B900]/40 text-[#76B900] font-mono font-extrabold uppercase">
                    {m.provider} NIM
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{m.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">{m.name}</h3>
                  {m.is_default && (
                    <span className="px-2 py-0.5 rounded bg-[#76B900]/20 border border-[#76B900]/40 text-[#76B900] text-[10px] font-extrabold font-mono">
                      PRIMARY
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">{m.description}</p>
              </div>

              <div className="pt-3 border-t border-[#242A2E]/60 flex items-center justify-between">
                <span className="text-[11px] text-[#76B900] font-mono font-semibold">
                  {m.capability}
                </span>

                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#76B900] to-emerald-400 hover:from-[#84cc16] hover:to-emerald-300 text-black font-extrabold transition shadow-md shadow-[#76B900]/20"
                >
                  <span>Use Model</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black stroke-[3]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
