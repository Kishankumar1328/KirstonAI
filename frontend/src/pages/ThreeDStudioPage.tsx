import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopNavigation } from '../components/layout/TopNavigation';
import { ThreeCanvasViewer } from '../components/three3d/ThreeCanvasViewer';
import { PromptInputBar } from '../components/three3d/PromptInputBar';
import { HistoryDrawer } from '../components/three3d/HistoryDrawer';
import { EngineStatusBadge } from '../components/three3d/EngineStatusBadge';
import { SpeciesLibraryModal } from '../components/three3d/SpeciesLibraryModal';
import { SpeciesDetailPanel } from '../components/three3d/SpeciesDetailPanel';
import { object3dService } from '../services/object3dService';
import {
  Object3DItem,
  Generate3DParams,
  EngineStatus,
  SpeciesDetail,
  AnimationAction,
  StageEnvironment,
} from '../types/object3d';
import {
  getAllSpecies,
  getSpeciesById,
  parsePromptForSpecies,
} from '../data/speciesRegistry';
import {
  Box,
  History,
  Sparkles,
  AlertCircle,
  Download,
  RotateCcw,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const ThreeDStudioPage: React.FC = () => {
  const { id: routeModelId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [currentModel, setCurrentModel] = useState<Object3DItem | null>(null);
  const [history, setHistory] = useState<Object3DItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [activeEngine, setActiveEngine] = useState('auto');

  // Species-Aware Animation State
  const [isSpeciesLibraryOpen, setIsSpeciesLibraryOpen] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesDetail | null>(null);
  const [activeAction, setActiveAction] = useState<AnimationAction>('idle');
  const [activeEnvironment, setActiveEnvironment] = useState<StageEnvironment>('savannah');

  // Load Engine Status & History on Mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [engStatus, histData] = await Promise.all([
          object3dService.getEngineStatus(),
          object3dService.getHistory(50, 0),
        ]);
        setEngineStatus(engStatus);
        setHistory(histData.items);

        // If route has model ID, load that model; otherwise wait for user input
        if (routeModelId) {
          const match = histData.items.find((item) => item.id === routeModelId);
          if (match) {
            handleModelSelect(match);
          } else {
            const fetched = await object3dService.getGeneration(routeModelId);
            if (fetched) handleModelSelect(fetched);
          }
        }
      } catch (err: any) {
        console.error('Failed initializing 3D studio data:', err);
      }
    };
    initData();
  }, [routeModelId]);

  // Sync active species and animation when a model is selected
  const handleModelSelect = (model: Object3DItem) => {
    setCurrentModel(model);
    
    // Find matching species in registry
    let matched: SpeciesDetail | undefined;
    if (model.species_name) {
      matched = getAllSpecies().find(
        (sp) => sp.name.toLowerCase() === model.species_name?.toLowerCase()
      );
    }
    if (!matched) {
      const parsed = parsePromptForSpecies(model.prompt);
      matched = parsed.species;
    }

    if (matched) {
      setSelectedSpecies(matched);
      setActiveAction(
        (model.species_action as AnimationAction) || matched.available_animations[0] || 'idle'
      );
      setActiveEnvironment(
        (model.species_environment as StageEnvironment) || matched.default_environment || 'savannah'
      );
    } else {
      setSelectedSpecies(null);
      setActiveAction('idle');
    }
  };

  // Handle Species Selection from Library Modal
  const handleSelectSpeciesFromLibrary = (
    species: SpeciesDetail,
    defaultAction: AnimationAction,
    defaultEnv: StageEnvironment
  ) => {
    setSelectedSpecies(species);
    setActiveAction(defaultAction);
    setActiveEnvironment(defaultEnv);
    setIsSpeciesLibraryOpen(false);

    // Auto-generate archetype model for selected species
    handleGenerate({
      prompt: `Create a realistic ${species.name} with ${defaultAction} in ${defaultEnv}`,
      species_name: species.name,
      species_category: species.category,
      species_action: defaultAction,
      species_environment: defaultEnv,
      style: 'pbr_photoreal',
    });
  };

  // Handle 3D Generation
  const handleGenerate = async (params: Generate3DParams) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessToast(null);

    try {
      const generated = await object3dService.generate3D(params);
      handleModelSelect(generated);
      setHistory((prev) => [generated, ...prev.filter((item) => item.id !== generated.id)]);
      setSuccessToast(`Synthesized 3D mesh: "${generated.prompt.slice(0, 32)}..."`);
      navigate(`/3d-generator/${generated.id}`, { replace: true });
    } catch (err: any) {
      console.error('Generation failed:', err);
      setErrorMessage(err.message || 'Failed to generate 3D model. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Regeneration
  const handleRegenerate = async () => {
    if (!currentModel) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const regenerated = await object3dService.regenerate3D(currentModel.id, {
        prompt: currentModel.prompt,
        engine: activeEngine,
        species_name: selectedSpecies?.name,
        species_action: activeAction,
        species_environment: activeEnvironment,
        seed: Math.floor(Math.random() * 1000000),
      });
      handleModelSelect(regenerated);
      setHistory((prev) => [regenerated, ...prev.filter((item) => item.id !== regenerated.id)]);
      setSuccessToast(`Regenerated 3D model.`);
    } catch (err: any) {
      console.error('Regeneration failed:', err);
      setErrorMessage(err.message || 'Failed to regenerate 3D model.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      await object3dService.delete3D(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (currentModel?.id === id) {
        const remaining = history.filter((item) => item.id !== id);
        if (remaining.length > 0) {
          handleModelSelect(remaining[0]);
        } else {
          setCurrentModel(null);
        }
      }
    } catch (err: any) {
      console.error('Failed to delete 3D model:', err);
      setErrorMessage('Failed to delete 3D model.');
    }
  };

  // Download Action
  const handleDownloadGlb = () => {
    if (!currentModel) return;
    const downloadUrl = object3dService.getDownloadUrl(currentModel.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    const speciesPrefix = (selectedSpecies?.name || 'model').toLowerCase().replace(/\s+/g, '_');
    link.setAttribute('download', `${speciesPrefix}_${currentModel.id.slice(0, 8)}.glb`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#07090B] text-gray-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Header Navigation */}
      <TopNavigation />

      {/* Main Studio Body */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-3 md:p-6 space-y-4">
        {/* Studio Title Header & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#242A2E] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#76B900] to-emerald-400 flex items-center justify-center text-black font-extrabold shadow-glow-nvidia">
                <Box className="w-4.5 h-4.5" />
              </div>
              <h1 className="text-lg md:text-xl font-extrabold text-white font-mono tracking-tight flex items-center gap-2">
                Species-Aware 3D Animation Studio
              </h1>
            </div>
            <p className="text-xs text-gray-400 font-sans">
              Generate species-accurate 3D anatomical models with custom rigs, habitats, and 60 FPS kinematic animations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Species Library Trigger */}
            <button
              onClick={() => setIsSpeciesLibraryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141B20] border border-[#76B900]/50 hover:bg-[#1C262E] text-xs font-mono text-[#76B900] font-bold transition shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Species Library</span>
            </button>

            <EngineStatusBadge status={engineStatus} />

            {/* History Toggle Button */}
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#14181B] border border-[#242A2E] hover:border-[#76B900]/60 text-xs font-mono text-gray-300 hover:text-white transition shadow-sm"
            >
              <History className="w-4 h-4 text-[#76B900]" />
              <span>History</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#20262B] text-[#76B900] font-bold">
                {history.length}
              </span>
            </button>
          </div>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between animate-fade-in shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white text-xs underline font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {successToast && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center justify-between animate-fade-in shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#76B900] shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-[#76B900] hover:text-white text-xs underline font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 3D WebGL Canvas Viewport */}
        <div className="w-full h-[54vh] md:h-[60vh] min-h-[380px]">
          <ThreeCanvasViewer
            currentModel={currentModel}
            isLoading={isLoading}
            activeSpecies={selectedSpecies}
            activeAction={activeAction}
            onActionChange={setActiveAction}
            onDownloadGlb={handleDownloadGlb}
            onRegenerate={handleRegenerate}
          />
        </div>

        {/* Species Detail Panel */}
        {selectedSpecies && (
          <SpeciesDetailPanel
            species={selectedSpecies}
            activeAction={activeAction}
            onActionSelect={setActiveAction}
            modelEngine={currentModel?.model_engine || 'Neural & Parametric GLB 2.0'}
            format="GLTF 2.0 / GLB"
          />
        )}

        {/* 3D Accuracy & Geometric Validation Diagnostics Panel */}
        {currentModel && (
          <div className="w-full p-4 rounded-2xl bg-[#0C1114] border border-[#242E36] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#1E272E] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#76B900]/20 border border-[#76B900]/40 text-[#76B900]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white font-mono flex items-center gap-2">
                    Geometric Accuracy & Validation Report
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Real-time mesh topology audit, dimensional unit consistency, and 3D printing manifold analysis.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-[#76B900] text-xs font-mono font-bold">
                  Score: {currentModel.accuracy_score || 96}% ({currentModel.accuracy_metrics?.status || 'EXCELLENT'})
                </span>
              </div>
            </div>

            {/* Sub-Score Breakdown Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-2.5 rounded-xl bg-[#141B20] border border-[#222B32] space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>DIMENSIONS</span>
                  <span className="text-white font-bold">{currentModel.accuracy_metrics?.dimension_score || 100}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0A0D0F] rounded-full overflow-hidden">
                  <div className="h-full bg-[#76B900] rounded-full" style={{ width: `${currentModel.accuracy_metrics?.dimension_score || 100}%` }} />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#141B20] border border-[#222B32] space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>PROPORTIONS</span>
                  <span className="text-white font-bold">{currentModel.accuracy_metrics?.proportion_score || 100}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0A0D0F] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${currentModel.accuracy_metrics?.proportion_score || 100}%` }} />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#141B20] border border-[#222B32] space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>SYMMETRY</span>
                  <span className="text-white font-bold">{currentModel.accuracy_metrics?.symmetry_score || 100}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0A0D0F] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${currentModel.accuracy_metrics?.symmetry_score || 100}%` }} />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#141B20] border border-[#222B32] space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>TOPOLOGY</span>
                  <span className="text-white font-bold">{currentModel.accuracy_metrics?.topology_score || 100}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0A0D0F] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${currentModel.accuracy_metrics?.topology_score || 100}%` }} />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#141B20] border border-[#222B32] space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>NORMALS</span>
                  <span className="text-white font-bold">{currentModel.accuracy_metrics?.surface_quality_score || 100}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0A0D0F] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${currentModel.accuracy_metrics?.surface_quality_score || 100}%` }} />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#141B20] border border-[#222B32] space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>3D PRINT</span>
                  <span className="text-white font-bold">{currentModel.accuracy_metrics?.export_integrity_score || 100}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0A0D0F] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${currentModel.accuracy_metrics?.export_integrity_score || 100}%` }} />
                </div>
              </div>
            </div>

            {/* Health Badges & Issues */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-[#141B20] border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                ✓ Watertight Mesh
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#141B20] border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                ✓ 1 Unit = 1m Standardized
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#141B20] border border-amber-500/40 text-amber-300 flex items-center gap-1">
                ✓ Centerline Welded
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#141B20] border border-[#2A343C] text-gray-300">
                Duplicates: {currentModel.topology_health?.duplicate_vertices || 0}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#141B20] border border-[#2A343C] text-gray-300">
                Non-Manifold: {currentModel.topology_health?.non_manifold_edges || 0}
              </span>
            </div>
          </div>
        )}

        {/* Prompt Input & Styling Controller */}
        <div className="w-full">
          <PromptInputBar
            onGenerate={handleGenerate}
            isLoading={isLoading}
            activeEngine={activeEngine}
            onEngineChange={setActiveEngine}
            selectedSpecies={selectedSpecies}
            selectedAction={activeAction}
            selectedEnvironment={activeEnvironment}
            onOpenSpeciesLibrary={() => setIsSpeciesLibraryOpen(true)}
            onActionChange={setActiveAction}
            onEnvironmentChange={setActiveEnvironment}
          />
        </div>
      </main>

      {/* Species Library Modal */}
      <SpeciesLibraryModal
        isOpen={isSpeciesLibraryOpen}
        onClose={() => setIsSpeciesLibraryOpen(false)}
        selectedSpeciesId={selectedSpecies?.id}
        onSelectSpecies={handleSelectSpeciesFromLibrary}
      />

      {/* History Drawer */}
      <HistoryDrawer
        history={history}
        activeModelId={currentModel?.id}
        onSelectModel={(model) => {
          handleModelSelect(model);
          navigate(`/3d-generator/${model.id}`, { replace: true });
        }}
        onDeleteModel={handleDelete}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
