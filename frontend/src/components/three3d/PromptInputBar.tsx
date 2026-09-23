import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  SlidersHorizontal,
  ChevronDown,
  Wand2,
  Cpu,
  Palette,
  Compass,
  Film,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import {
  Generate3DParams,
  SpeciesDetail,
  AnimationAction,
  StageEnvironment,
} from '../../types/object3d';
import { parsePromptForSpecies } from '../../data/speciesRegistry';

interface PromptInputBarProps {
  onGenerate: (params: Generate3DParams) => void;
  isLoading: boolean;
  activeEngine: string;
  onEngineChange: (engine: string) => void;
  selectedSpecies?: SpeciesDetail | null;
  selectedAction?: AnimationAction;
  selectedEnvironment?: StageEnvironment;
  onOpenSpeciesLibrary: () => void;
  onActionChange: (action: AnimationAction) => void;
  onEnvironmentChange: (env: StageEnvironment) => void;
}

const SPECIES_PROMPT_IDEAS = [
  { label: 'Bengal Tiger Running', prompt: 'Create a realistic Bengal tiger roaring and running through a jungle', species: 'bengal_tiger' },
  { label: 'Great White Shark', prompt: 'Great White Shark swimming in deep ocean water with caustics', species: 'great_white_shark' },
  { label: 'Bald Eagle Soaring', prompt: 'Bald Eagle flying and soaring high in the blue sky', species: 'bald_eagle' },
  { label: 'King Cobra Strike', prompt: 'Venomous King Cobra coiling and slithering on jungle terrain', species: 'king_cobra' },
  { label: 'Emperor Penguin', prompt: 'Emperor Penguin walking and swimming on arctic glacial ice', species: 'emperor_penguin' },
  { label: 'Arabian Horse Gallop', prompt: 'Graceful Arabian horse galloping and jumping on open savannah plains', species: 'arabian_horse' },
  { label: 'Panther Chameleon', prompt: 'Colorful Panther Chameleon crawling on tropical branch foliage', species: 'panther_chameleon' },
  { label: 'African Elephant', prompt: 'Colossal African Elephant walking with ivory tusks in savannah', species: 'african_elephant' },
];

const STYLE_PRESETS = [
  { id: 'pbr_photoreal', label: 'PBR Realism' },
  { id: 'game_ready', label: 'Game Ready' },
  { id: 'scifi', label: 'Sci-Fi Cyber' },
  { id: 'stylized_clay', label: 'Stylized Clay' },
];

export const PromptInputBar: React.FC<PromptInputBarProps> = ({
  onGenerate,
  isLoading,
  activeEngine,
  onEngineChange,
  selectedSpecies,
  selectedAction = 'idle',
  selectedEnvironment = 'savannah',
  onOpenSpeciesLibrary,
  onActionChange,
  onEnvironmentChange,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('pbr_photoreal');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [roughness, setRoughness] = useState(0.35);
  const [metalness, setMetalness] = useState(0.2);
  const [seed, setSeed] = useState<string>('');

  // Auto-parse NLP attributes when prompt changes
  const parsedAttributes = React.useMemo(() => {
    if (!prompt.trim()) return null;
    return parsePromptForSpecies(prompt);
  }, [prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    onGenerate({
      prompt: prompt.trim(),
      style: selectedStyle,
      engine: activeEngine,
      roughness,
      metalness,
      seed: seed.trim() ? parseInt(seed.trim(), 10) : undefined,
      species_name: selectedSpecies?.name || parsedAttributes?.species?.name,
      species_category: selectedSpecies?.category || parsedAttributes?.species?.category,
      species_action: selectedAction || parsedAttributes?.action,
      species_environment: selectedEnvironment || parsedAttributes?.environment,
    });
  };

  const handleIdeaClick = (ideaPrompt: string) => {
    setPrompt(ideaPrompt);
    const parsed = parsePromptForSpecies(ideaPrompt);
    if (parsed.action) onActionChange(parsed.action);
    if (parsed.environment) onEnvironmentChange(parsed.environment);

    onGenerate({
      prompt: ideaPrompt,
      style: selectedStyle,
      engine: activeEngine,
      roughness,
      metalness,
      seed: seed.trim() ? parseInt(seed.trim(), 10) : undefined,
      species_name: parsed.species?.name,
      species_category: parsed.species?.category,
      species_action: parsed.action,
      species_environment: parsed.environment,
    });
  };

  return (
    <div className="w-full space-y-3">
      {/* Suggestions Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
        {/* Open Species Library Button */}
        <button
          onClick={onOpenSpeciesLibrary}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-[#76B900]/20 border border-[#76B900]/50 text-[#76B900] hover:bg-[#76B900]/30 font-bold transition shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Species Library</span>
        </button>

        <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold shrink-0 ml-1">
          Archetypes:
        </span>
        {SPECIES_PROMPT_IDEAS.map((idea) => (
          <button
            key={idea.label}
            onClick={() => handleIdeaClick(idea.prompt)}
            disabled={isLoading}
            className="shrink-0 px-2.5 py-1 rounded-xl bg-[#14181B] border border-[#242A2E] hover:border-[#76B900]/60 hover:text-white text-gray-400 transition text-[11px] disabled:opacity-50"
          >
            {idea.label}
          </button>
        ))}
      </div>

      {/* Main Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#0B0D0E]/90 backdrop-blur-xl border border-[#242A2E] focus-within:border-[#76B900]/70 rounded-2xl p-2.5 md:p-3 shadow-2xl transition space-y-2.5"
      >
        {/* Natural Language Prompt Input Bar */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#15191C] text-[#76B900] shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='e.g., "Create a realistic Bengal tiger roaring and running through a jungle"...'
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm md:text-base font-sans text-gray-100 placeholder-gray-500 outline-none"
          />

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-2 rounded-xl border transition ${
              showAdvanced
                ? 'bg-[#182026] text-[#76B900] border-[#76B900]/40'
                : 'bg-[#13171A] text-gray-400 border-[#242A2E] hover:text-white hover:bg-[#1A2024]'
            }`}
            title="PBR Material & Generation Parameters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Submit / Generate Button */}
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#76B900] to-emerald-500 hover:from-[#659e00] hover:to-emerald-400 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-black font-extrabold text-xs md:text-sm font-mono shadow-glow-nvidia transition shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? 'Synthesizing...' : 'Generate 3D'}</span>
          </button>
        </div>

        {/* NLP Auto-Detected Attribute Badges */}
        {(selectedSpecies || parsedAttributes?.species) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1C2227] text-[11px] font-mono animate-fade-in">
            <span className="text-gray-500 text-[10px] uppercase font-bold">Parameters:</span>

            {/* Species Badge */}
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
              <span>{selectedSpecies?.icon || parsedAttributes?.species?.icon || '🐾'}</span>
              <span>Species: {selectedSpecies?.name || parsedAttributes?.species?.name}</span>
            </span>

            {/* Action Badge */}
            <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-1">
              <Film className="w-3 h-3" />
              <span>Action: {selectedAction || parsedAttributes?.action || 'idle'}</span>
            </span>

            {/* Environment Badge */}
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>Stage: {selectedEnvironment || parsedAttributes?.environment || 'savannah'}</span>
            </span>
          </div>
        )}

        {/* Quick Style & Engine Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1C2227] text-xs font-mono">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-gray-500 text-[10px] uppercase font-bold shrink-0">
              Style:
            </span>
            {STYLE_PRESETS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStyle(st.id)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] transition ${
                  selectedStyle === st.id
                    ? 'bg-[#76B900] text-black font-bold shadow-glow-nvidia'
                    : 'bg-[#14181B] text-gray-400 hover:text-white border border-[#242A2E]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-[10px] uppercase font-bold">Engine:</span>
            <select
              value={activeEngine}
              onChange={(e) => onEngineChange(e.target.value)}
              className="bg-[#14181B] text-gray-200 border border-[#242A2E] rounded-lg px-2 py-0.5 text-[11px] font-mono outline-none cursor-pointer focus:border-[#76B900]"
            >
              <option value="auto">Auto Smart Routing</option>
              <option value="neural-parametric-glb">Neural & Parametric GLB 2.0</option>
              <option value="aimlapi-3d">AIML API TripoSR</option>
            </select>
          </div>
        </div>

        {/* Advanced PBR Surface & Seed Controls */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#1C2227] text-xs font-mono text-gray-300 animate-fade-in">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">
                Roughness: <span className="text-white font-bold">{roughness}</span>
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={roughness}
                onChange={(e) => setRoughness(parseFloat(e.target.value))}
                className="w-full accent-[#76B900] cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">
                Metalness: <span className="text-white font-bold">{metalness}</span>
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={metalness}
                onChange={(e) => setMetalness(parseFloat(e.target.value))}
                className="w-full accent-[#76B900] cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Deterministic Seed:</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Random (e.g. 42)"
                className="w-full px-2.5 py-1 rounded-lg bg-[#14181B] border border-[#242A2E] text-xs text-gray-200 outline-none focus:border-[#76B900]"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
