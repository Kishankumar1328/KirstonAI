import React from 'react';
import { TopNavigation } from '../components/layout/TopNavigation';
import { Compass, FileText, Code, Database, Sparkles, Image, ArrowRight, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();

  const handlePromptClick = (prompt: string) => {
    navigate('/', { state: { initialPrompt: prompt } });
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col font-sans">
      <TopNavigation />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Title Header */}
        <div className="border-b border-border/80 pb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-accent-green" />
            <span>Explore KirstonAI Capabilities</span>
          </h1>
          <p className="text-xs text-gray-400">
            Discover example workflows for RAG document grounding, Nemotron reasoning, and multimodal analysis.
          </p>
        </div>

        {/* Prompt Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => handlePromptClick("Explain how Multimodal RAG architecture works with code examples.")}
            className="bg-card border border-border/80 hover:border-accent-green/60 rounded-2xl p-5 cursor-pointer transition group space-y-3 shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-green/10 border border-accent-green/30 flex items-center justify-center text-accent-green">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-accent-green transition">
                Analyze Architecture Documents
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Upload architecture specs or technical documentation to extract key component patterns and pipeline dependencies.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-accent-green font-medium pt-2">
              <span>Try this workflow</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => handlePromptClick("Write a Python FastAPI SSE endpoint with rate limiting and logging.")}
            className="bg-card border border-border/80 hover:border-accent-green/60 rounded-2xl p-5 cursor-pointer transition group space-y-3 shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-accent-green transition">
                Generate Executable Code
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Generate production-ready Python, TypeScript, and SQL code snippets with built-in error checking.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-accent-green font-medium pt-2">
              <span>Try this workflow</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => handlePromptClick("Summarize key principles of LangGraph state workflow agents.")}
            className="bg-card border border-border/80 hover:border-accent-green/60 rounded-2xl p-5 cursor-pointer transition group space-y-3 shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-accent-green transition">
                Deep Agentic Reasoning
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Leaverage Nemotron 3.5 Lightning extended thinking to break down complex multi-step logic problems.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-accent-green font-medium pt-2">
              <span>Try this workflow</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => handlePromptClick("How do I optimize PostgreSQL query performance for vector similarity?")}
            className="bg-card border border-border/80 hover:border-accent-green/60 rounded-2xl p-5 cursor-pointer transition group space-y-3 shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-accent-green transition">
                Database Optimization & RAG
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Optimize Supabase PostgreSQL queries, vector indexing, and connection pool configurations.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-accent-green font-medium pt-2">
              <span>Try this workflow</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/3d-generator')}
            className="bg-card border border-border/80 hover:border-accent-green/60 rounded-2xl p-5 cursor-pointer transition group space-y-3 shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-[#76B900]/15 border border-[#76B900]/40 flex items-center justify-center text-[#76B900]">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-accent-green transition">
                3D Object Generator & WebGL Studio
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Generate production-ready 3D models (GLB/GLTF) from natural-language prompts with OrbitControls, PBR materials, wireframe, and lighting.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-accent-green font-medium pt-2">
              <span>Open 3D Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
