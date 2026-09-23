import React, { useState } from 'react';
import {
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Compass,
  Maximize2,
  Bone,
  Film,
  Tag,
  Sparkles,
} from 'lucide-react';
import { SpeciesDetail, AnimationAction } from '../../types/object3d';

interface SpeciesDetailPanelProps {
  species: SpeciesDetail | null;
  activeAction?: AnimationAction;
  onActionSelect?: (action: AnimationAction) => void;
  modelEngine?: string;
  format?: string;
}

export const SpeciesDetailPanel: React.FC<SpeciesDetailPanelProps> = ({
  species,
  activeAction,
  onActionSelect,
  modelEngine = 'Neural & Parametric GLB 2.0',
  format = 'GLTF 2.0 / GLB',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!species) return null;

  return (
    <div className="bg-[#0D1216]/90 backdrop-blur-md border border-[#242D34] rounded-2xl shadow-xl overflow-hidden text-xs font-mono text-gray-200 transition-all">
      {/* Header Bar */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-4 py-2.5 bg-[#13191E] border-b border-[#242D34] cursor-pointer hover:bg-[#182026] transition select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{species.icon || '🐾'}</span>
          <div>
            <span className="font-bold text-white text-sm">{species.name}</span>
            <span className="ml-2 text-[10px] text-gray-400 italic">({species.scientific_name})</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#76B900]/15 text-[#76B900] border border-[#76B900]/30 uppercase tracking-wider">
            {species.category}
          </span>
          <button className="text-gray-400 hover:text-white">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {!isCollapsed && (
        <div className="p-4 space-y-3.5 animate-fade-in">
          {/* Top Grid: Habitat, Movement, Rig, Dimensions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            {/* Habitat */}
            <div className="p-2.5 rounded-xl bg-[#141B20] border border-[#202931] space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[10px]">
                <Compass className="w-3.5 h-3.5" />
                <span className="font-bold uppercase tracking-wider">Habitat</span>
              </div>
              <p className="text-gray-100 font-semibold truncate">{species.habitat}</p>
            </div>

            {/* Movement */}
            <div className="p-2.5 rounded-xl bg-[#141B20] border border-[#202931] space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 text-[10px]">
                <Activity className="w-3.5 h-3.5" />
                <span className="font-bold uppercase tracking-wider">Movement</span>
              </div>
              <p className="text-gray-100 font-semibold truncate">{species.movement_type}</p>
            </div>

            {/* Dimensions */}
            <div className="p-2.5 rounded-xl bg-[#141B20] border border-[#202931] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="font-bold uppercase tracking-wider">Scale / Weight</span>
              </div>
              <p className="text-gray-100 font-semibold truncate">
                {species.size_dimensions.length_m}m × {species.size_dimensions.height_m}m ({species.size_dimensions.weight_kg}kg)
              </p>
            </div>

            {/* Rig / Skeleton */}
            <div className="p-2.5 rounded-xl bg-[#141B20] border border-[#202931] space-y-1">
              <div className="flex items-center gap-1.5 text-purple-400 text-[10px]">
                <Bone className="w-3.5 h-3.5" />
                <span className="font-bold uppercase tracking-wider">Rig Architecture</span>
              </div>
              <p className="text-gray-100 font-semibold truncate">{species.rig_type}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-300 font-sans leading-relaxed">
            {species.description}
          </p>

          {/* Supported Species Animations */}
          <div className="space-y-1.5 pt-1 border-t border-[#1F262C]">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span className="flex items-center gap-1 font-bold text-gray-300 uppercase tracking-wider">
                <Film className="w-3 h-3 text-[#76B900]" />
                Supported Kinematic & Skeletal Animations:
              </span>
              <span>Click to trigger animation</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {species.available_animations.map((act) => {
                const isActive = activeAction === act;
                return (
                  <button
                    key={act}
                    onClick={() => onActionSelect && onActionSelect(act)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 ${
                      isActive
                        ? 'bg-[#76B900] text-black shadow-glow-nvidia scale-105'
                        : 'bg-[#182127] text-gray-300 hover:text-white hover:bg-[#202A32] border border-[#28343E]'
                    }`}
                  >
                    <span>{isActive ? '▶' : '•'}</span>
                    <span className="capitalize">{act.replace('_', ' ')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Specs */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-[#1C2329]">
            <div className="flex items-center gap-2">
              <span>Format: <span className="text-white font-bold">{format}</span></span>
              <span>•</span>
              <span>Engine: <span className="text-[#76B900] font-bold">{modelEngine}</span></span>
            </div>
            <span className="text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Kinematic Physics Active (60 FPS)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
