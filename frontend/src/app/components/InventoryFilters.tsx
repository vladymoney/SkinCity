import React from 'react';
import { Search, ChevronDown, DollarSign } from 'lucide-react';

interface InventoryFiltersProps {
  filters: {
    search: string;
    types: string[];      // Weapon types (AK-47, AWP, etc.)
    rarities: string[];   // Rarity grades (Consumer, Mil-Spec, etc.)
    sortBy: string;
    priceRange: [number, number];
  };
  onChange: (filters: Partial<InventoryFiltersProps['filters']>) => void;
  availableTypes?: string[];     // Weapon types from inventory
  availableRarities?: string[];  // Rarity grades from inventory
  maxPrice?: number;
}

// Weapon type colors
const TYPE_COLORS: Record<string, string> = {
  'ak-47': '#eb4b4b',
  'm4a4': '#d32ce6',
  'm4a1-s': '#d32ce6',
  'awp': '#eb4b4b',
  'desert eagle': '#8847ff',
  'glock-18': '#5e98d9',
  'usp-s': '#4b69ff',
  'p2000': '#4b69ff',
  'p250': '#5e98d9',
  'dual berettas': '#b0c3d9',
  'ssg 08': '#8847ff',
  'sawed-off': '#5e98d9',
  'g3sg1': '#8847ff',
  'scar-20': '#8847ff',
  'mac-10': '#5e98d9',
  'pp-bizon': '#b0c3d9',
  'aug': '#8847ff',
  'r8 revolver': '#d32ce6',
  'case': '#ffd700',
  'sealed graffiti': '#b0c3d9',
};

// Rarity grade colors (based on CS:GO color codes)
const RARITY_COLORS: Record<string, { name: string; color: string }> = {
  // CS:GO Standard Rarities
  'b0c3d9': { name: 'Consumer Grade', color: '#b0c3d9' },
  '5e98d9': { name: 'Industrial Grade', color: '#5e98d9' },
  '4b69ff': { name: 'Mil-Spec', color: '#4b69ff' },
  '8847ff': { name: 'Restricted', color: '#8847ff' },
  'd32ce6': { name: 'Classified', color: '#d32ce6' },
  'eb4b4b': { name: 'Covert', color: '#eb4b4b' },
  'e4ae39': { name: 'Contraband', color: '#e4ae39' },
  'ffd700': { name: 'Extraordinary', color: '#ffd700' },
  
  // Additional color variations
  'cf6a32': { name: 'Extraordinary', color: '#cf6a32' },  // Orange-gold
  'd2d2d2': { name: 'Base Grade', color: '#d2d2d2' },     // Light gray
  'b2b2b2': { name: 'Base Grade', color: '#b2b2b2' },     // Gray
  'ffffff': { name: 'High Grade', color: '#ffffff' },     // White
  'a0a0a0': { name: 'Remarkable', color: '#a0a0a0' },     // Medium gray
  '9da1a9': { name: 'Consumer Grade', color: '#9da1a9' }, // Slate gray
  '4b69ff': { name: 'Mil-Spec Grade', color: '#4b69ff' }, // Blue
  '5e98d9': { name: 'Industrial Grade', color: '#5e98d9' }, // Light blue
};

// Weapon name display
const WEAPON_NAMES: Record<string, string> = {
  'ak-47': 'AK-47',
  'm4a4': 'M4A4',
  'm4a1-s': 'M4A1-S',
  'awp': 'AWP',
  'desert eagle': 'Desert Eagle',
  'glock-18': 'Glock-18',
  'usp-s': 'USP-S',
  'p2000': 'P2000',
  'p250': 'P250',
  'dual berettas': 'Dual Berettas',
  'ssg 08': 'SSG 08',
  'sawed-off': 'Sawed-Off',
  'g3sg1': 'G3SG1',
  'scar-20': 'SCAR-20',
  'mac-10': 'MAC-10',
  'pp-bizon': 'PP-Bizon',
  'aug': 'AUG',
  'r8 revolver': 'R8 Revolver',
  'case': 'Case',
  'sealed graffiti': 'Sealed Graffiti',
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'price_high', label: 'Price (High to Low)' },
  { value: 'price_low', label: 'Price (Low to High)' },
];

export default function InventoryFilters({ 
  filters, 
  onChange, 
  availableTypes = [], 
  availableRarities = [],
  maxPrice = 1000
}: InventoryFiltersProps) {
  const [typesOpen, setTypesOpen] = React.useState(false);
  const [raritiesOpen, setRaritiesOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);

  // Build type options
  const typeOptions = availableTypes.map(type => ({
    value: type,
    label: WEAPON_NAMES[type] || type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    color: TYPE_COLORS[type] || '#94a3b8'
  })).sort((a, b) => a.label.localeCompare(b.label));

  // Build rarity options from color codes
  const rarityOptions = availableRarities.map(colorCode => {
    const rarityInfo = RARITY_COLORS[colorCode];
    
    if (rarityInfo) {
      return {
        value: colorCode,
        label: rarityInfo.name,
        color: rarityInfo.color
      };
    }
    
    // Fallback for unknown colors - try to guess rarity based on color
    const hex = `#${colorCode}`;
    let guessedName = 'Unknown Grade';
    
    // Guess based on common CS:GO color patterns
    const r = parseInt(colorCode.slice(0, 2), 16);
    const g = parseInt(colorCode.slice(2, 4), 16);
    const b = parseInt(colorCode.slice(4, 6), 16);
    
    if (r > 200 && g > 200 && b > 200) guessedName = 'Common Grade';
    else if (b > r && b > g && b > 150) guessedName = 'Industrial Grade';
    else if (r > 200 && g < 100 && b < 100) guessedName = 'Covert';
    else if (r > 150 && g < 100 && b > 150) guessedName = 'Restricted';
    else if (r > 150 && b > 200) guessedName = 'Classified';
    else if (r > 200 && g > 150) guessedName = 'Extraordinary';
    
    return {
      value: colorCode,
      label: guessedName,
      color: hex
    };
  }).sort((a, b) => a.label.localeCompare(b.label));

  const toggleType = (value: string) => {
    const newTypes = filters.types.includes(value)
      ? filters.types.filter(t => t !== value)
      : [...filters.types, value];
    onChange({ types: newTypes });
  };

  const toggleRarity = (value: string) => {
    const newRarities = filters.rarities.includes(value)
      ? filters.rarities.filter(r => r !== value)
      : [...filters.rarities, value];
    onChange({ rarities: newRarities });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search items..."
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3">
        {/* Type Filter */}
        <div className="relative">
          <button
            onClick={() => setTypesOpen(!typesOpen)}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition flex items-center gap-2 min-w-[140px] justify-between"
          >
            <span className="text-sm font-medium">
              {filters.types.length === 0 ? 'Type' : `Type (${filters.types.length})`}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${typesOpen ? 'rotate-180' : ''}`} />
          </button>

          {typesOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setTypesOpen(false)} />
              <div className="absolute top-full mt-2 left-0 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">Weapon Type</span>
                  {filters.types.length > 0 && (
                    <button
                      onClick={() => { onChange({ types: [] }); setTypesOpen(false); }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="p-2">
                  {typeOptions.length > 0 ? typeOptions.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type.value)}
                        onChange={() => toggleType(type.value)}
                        className="w-4 h-4 rounded border-slate-600 text-blue-600"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                        <span className="text-sm" style={{ color: type.color }}>{type.label}</span>
                      </div>
                    </label>
                  )) : (
                    <div className="px-3 py-4 text-sm text-slate-400 text-center">Loading...</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rarity Filter */}
        <div className="relative">
          <button
            onClick={() => setRaritiesOpen(!raritiesOpen)}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition flex items-center gap-2 min-w-[140px] justify-between"
          >
            <span className="text-sm font-medium">
              {filters.rarities.length === 0 ? 'Rarity' : `Rarity (${filters.rarities.length})`}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${raritiesOpen ? 'rotate-180' : ''}`} />
          </button>

          {raritiesOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setRaritiesOpen(false)} />
              <div className="absolute top-full mt-2 left-0 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">Rarity Grade</span>
                  {filters.rarities.length > 0 && (
                    <button
                      onClick={() => { onChange({ rarities: [] }); setRaritiesOpen(false); }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="p-2">
                  {rarityOptions.length > 0 ? rarityOptions.map((rarity) => (
                    <label
                      key={rarity.value}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.rarities.includes(rarity.value)}
                        onChange={() => toggleRarity(rarity.value)}
                        className="w-4 h-4 rounded border-slate-600 text-blue-600"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rarity.color }} />
                        <span className="text-sm" style={{ color: rarity.color }}>{rarity.label}</span>
                      </div>
                    </label>
                  )) : (
                    <div className="px-3 py-4 text-sm text-slate-400 text-center">Loading...</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition flex items-center gap-2 min-w-[160px] justify-between"
          >
            <span className="text-sm font-medium">
              {SORT_OPTIONS.find(o => o.value === filters.sortBy)?.label || 'Sort By'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>

          {sortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
              <div className="absolute top-full mt-2 right-0 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20">
                <div className="p-2">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onChange({ sortBy: option.value });
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                        filters.sortBy === option.value
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-300">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-semibold">Price Range</span>
          </div>
          <span className="text-sm text-slate-400">
            ${filters.priceRange[0]} - ${filters.priceRange[1] >= maxPrice ? `${maxPrice}+` : filters.priceRange[1]}
          </span>
        </div>
        
        <div className="space-y-3">
          {/* Min Price Slider */}
          <div>
            <input
              type="range"
              min="0"
              max={maxPrice}
              step="1"
              value={filters.priceRange[0]}
              onChange={(e) => {
                const min = Number(e.target.value);
                onChange({ priceRange: [min, Math.max(min, filters.priceRange[1])] });
              }}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
          
          {/* Max Price Slider */}
          <div>
            <input
              type="range"
              min="0"
              max={maxPrice}
              step="1"
              value={filters.priceRange[1]}
              onChange={(e) => {
                const max = Number(e.target.value);
                onChange({ priceRange: [Math.min(max, filters.priceRange[0]), max] });
              }}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}