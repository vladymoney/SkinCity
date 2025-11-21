"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { InventoryFilters as InventoryFiltersType, Rarity } from '@/types';
import { RARITY_COLORS } from '@/constants';

interface InventoryFiltersProps {
  filters: InventoryFiltersType;
  onChange: (newFilters: Partial<InventoryFiltersType>) => void;
}

const RARITY_OPTIONS = Object.values(Rarity);

const InventoryFilters: React.FC<InventoryFiltersProps> = ({ filters, onChange }) => {
  const [rarityOpen, setRarityOpen] = useState(false);
  const rarityRef = useRef<HTMLDivElement>(null);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ sortBy: e.target.value as any }); 
  };

  const toggleRarity = (rarity: string) => {
    const current = filters.rarities || [];
    const newRarities = current.includes(rarity)
      ? current.filter(r => r !== rarity)
      : [...current, rarity];
    onChange({ rarities: newRarities });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rarityRef.current && !rarityRef.current.contains(event.target as Node)) {
        setRarityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3 mb-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
      <div className="flex flex-col sm:flex-row gap-3">
        {}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search items..."
            className="w-full h-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>

        {}
        <div className="relative sm:w-48" ref={rarityRef}>
           <button onClick={() => setRarityOpen(!rarityOpen)} className="w-full h-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-white text-sm flex items-center justify-between">
             <span>{filters.rarities.length > 0 ? `${filters.rarities.length} Rarities` : 'All Rarities'}</span>
             <ChevronDown className={`w-4 h-4 transition-transform ${rarityOpen ? 'rotate-180' : ''}`} />
           </button>
           {rarityOpen && (
             <div className="absolute top-full right-0 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg z-50 p-1">
               {RARITY_OPTIONS.map((rarity) => {
                   const isSelected = filters.rarities.includes(rarity);
                   return (
                     <button key={rarity} onClick={() => toggleRarity(rarity)} className="w-full text-left px-3 py-2 rounded flex items-center justify-between hover:bg-slate-700">
                       <span className={`text-sm font-medium ${RARITY_COLORS[rarity]}`}>{rarity}</span>
                       {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                     </button>
                   );
                 })}
             </div>
           )}
        </div>

        {}
        <div className="relative sm:w-48">
           <select 
             value={filters.sortBy}
             onChange={handleSortChange}
             className="w-full h-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-white text-sm appearance-none focus:outline-none focus:border-blue-500"
           >
             <option value="newest">Newest First</option>
             <option value="name_asc">Name (A-Z)</option>
             <option value="name_desc">Name (Z-A)</option>
           </select>
           <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default InventoryFilters;