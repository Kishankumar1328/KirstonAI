import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  SlidersHorizontal,
  Sparkles,
  Compass,
  Activity,
  Maximize2,
  Check,
  Zap,
} from 'lucide-react';
import { SpeciesDetail, SpeciesCategory, AnimationAction, StageEnvironment } from '../../types/object3d';
import { getAllSpecies, getSpeciesByCategory } from '../../data/speciesRegistry';

interface SpeciesLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpeciesId?: string | null;
  onSelectSpecies: (species: SpeciesDetail, defaultAction: AnimationAction, defaultEnv: StageEnvironment) => void;
}

const CATEGORY_TABS: { id: SpeciesCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Species', icon: '🐾' },
  { id: 'animals', label: 'Animals', icon: '🦁' },
  { id: 'fish', label: 'Fish & Aquatic', icon: '🦈' },
  { id: 'reptiles', label: 'Reptiles', icon: '🦎' },
  { id: 'birds', label: 'Birds', icon: '🦅' },
];

export const SpeciesLibraryModal: React.FC<SpeciesLibraryModalProps> = ({
  isOpen,
  onClose,
  selectedSpeciesId,
  onSelectSpecies,
}) => {
  const [activeTab, setActiveTab] = useState<SpeciesCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [habitatFilter, setHabitatFilter] = useState<string>('all');

  // Filtered Species list
  const filteredSpecies = useMemo(() => {
    let list = getSpeciesByCategory(activeTab);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (sp) =>
          sp.name.toLowerCase().includes(q) ||
          sp.scientific_name.toLowerCase().includes(q) ||
          sp.habitat.toLowerCase().includes(q) ||
          sp.movement_type.toLowerCase().includes(q) ||
          sp.description.toLowerCase().includes(q)
      );
    }

    if (habitatFilter !== 'all') {
      list = list.filter((sp) => sp.default_environment === habitatFilter);
    }

    return list;
  }, [activeTab, searchQuery, habitatFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#0C1013] border border-[#242A2E] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#242A2E] bg-[#11161A]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#76B900] to-emerald-400 flex items-center justify-center text-black font-extrabold shadow-glow-nvidia">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-extrabold text-white font-mono tracking-tight flex items-center gap-2">
                Species Taxonomy Library
              </h2>
              <p className="text-xs text-gray-400">
                Select an authentic biological archetype with tailored anatomy, rigs, habitats, and animations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E252B] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search, Category Tabs & Filters */}
        <div className="p-4 border-b border-[#1E252B] space-y-3 bg-[#0E1317]">
          {/* Top Bar: Search Input & Habitat Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search species by name, scientific taxonomy, habitat, or movement..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#151B20] border border-[#262E35] focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] text-xs font-mono text-gray-200 placeholder-gray-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <select
                value={habitatFilter}
                onChange={(e) => setHabitatFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#151B20] border border-[#262E35] text-xs font-mono text-gray-300 focus:border-[#76B900] outline-none cursor-pointer"
              >
                <option value="all">All Environments</option>
                <option value="savannah">Savannah / Grasslands</option>
                <option value="jungle">Tropical Jungle / Rainforest</option>
                <option value="ocean">Deep Ocean / Marine</option>
                <option value="sky">High Altitude Sky</option>
                <option value="arctic">Arctic / Snow Tundra</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const count =
                tab.id === 'all'
                  ? getAllSpecies().length
                  : getSpeciesByCategory(tab.id).length;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition shrink-0 ${
                    isActive
                      ? 'bg-[#76B900] text-black font-bold shadow-glow-nvidia'
                      : 'bg-[#151B20] text-gray-300 hover:text-white hover:bg-[#1C2329] border border-[#262E35]'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-black/20 text-black' : 'bg-[#222B32] text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Species Grid View */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 custom-scrollbar">
          {filteredSpecies.map((sp) => {
            const isSelected = selectedSpeciesId === sp.id;

            return (
              <div
                key={sp.id}
                onClick={() => {
                  onSelectSpecies(sp, sp.available_animations[0], sp.default_environment);
                  onClose();
                }}
                className={`group relative p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1A2518] border-[#76B900] shadow-glow-nvidia'
                    : 'bg-[#11171B] border-[#22292F] hover:border-[#76B900]/60 hover:bg-[#151C21]'
                }`}
              >
                {/* Header: Icon & Taxonomy */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1.5 rounded-lg bg-[#182026] border border-[#2A333B]">
                        {sp.icon || '🐾'}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white font-mono group-hover:text-[#76B900] transition">
                          {sp.name}
                        </h3>
                        <p className="text-[11px] italic text-gray-400 font-serif">
                          {sp.scientific_name}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="p-1 rounded-full bg-[#76B900] text-black">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 font-sans line-clamp-2 leading-relaxed">
                    {sp.description}
                  </p>
                </div>

                {/* Badges & Properties */}
                <div className="mt-3.5 pt-3 border-t border-[#1F262C] space-y-2">
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-gray-400">
                    <div className="flex items-center gap-1">
                      <Compass className="w-3 h-3 text-cyan-400" />
                      <span className="truncate">{sp.habitat}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-amber-400" />
                      <span className="truncate">{sp.movement_type.split(' ')[0]}</span>
                    </div>
                  </div>

                  {/* Available Animations Preview Badges */}
                  <div className="flex flex-wrap gap-1">
                    {sp.available_animations.slice(0, 4).map((act) => (
                      <span
                        key={act}
                        className="px-1.5 py-0.5 rounded bg-[#1B232A] text-[9px] font-mono text-emerald-400 border border-emerald-900/40"
                      >
                        {act}
                      </span>
                    ))}
                    {sp.available_animations.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded bg-[#182026] text-[9px] font-mono text-gray-400">
                        +{sp.available_animations.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover CTA Indicator */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-gray-400 group-hover:text-white">
                  <span className="flex items-center gap-1 text-[#76B900]">
                    <Zap className="w-3 h-3" />
                    Load Archetype
                  </span>
                  <span className="text-[10px] text-gray-500">{sp.rig_type.split(' ')[0]}</span>
                </div>
              </div>
            );
          })}

          {filteredSpecies.length === 0 && (
            <div className="col-span-full py-16 text-center space-y-2 text-gray-400 font-mono text-xs">
              <Search className="w-8 h-8 mx-auto text-gray-600 mb-2" />
              <p>No species found matching "{searchQuery}".</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setHabitatFilter('all');
                }}
                className="text-[#76B900] underline hover:text-white"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
