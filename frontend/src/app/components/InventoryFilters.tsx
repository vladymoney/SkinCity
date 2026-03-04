import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import DualRangeSlider from './DualRangeSlider';

interface InventoryFiltersProps {
  filters: {
    search: string;
    types: string[];
    rarities: string[];
    sortBy: string;
    priceRange: [number, number];
    floatRange: [number, number];
  };
  onChange: (filters: Partial<InventoryFiltersProps['filters']>) => void;
  availableTypes?: string[];
  availableRarities?: string[];
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
  'case': '#ffd700',
};

// Rarity colors
const RARITY_COLORS: Record<string, { name: string; color: string }> = {
  'b0c3d9': { name: 'Consumer Grade', color: '#b0c3d9' },
  '5e98d9': { name: 'Industrial Grade', color: '#5e98d9' },
  '4b69ff': { name: 'Mil-Spec', color: '#4b69ff' },
  '8847ff': { name: 'Restricted', color: '#8847ff' },
  'd32ce6': { name: 'Classified', color: '#d32ce6' },
  'eb4b4b': { name: 'Covert', color: '#eb4b4b' },
  'e4ae39': { name: 'Contraband', color: '#e4ae39' },
  'cf6a32': { name: 'Extraordinary', color: '#cf6a32' },
  'd2d2d2': { name: 'Base Grade', color: '#d2d2d2' },
};

// Float wear names
const FLOAT_RANGES = [
  { name: 'Factory New', min: 0.00, max: 0.07, color: '#4ade80' },
  { name: 'Minimal Wear', min: 0.07, max: 0.15, color: '#22c55e' },
  { name: 'Field-Tested', min: 0.15, max: 0.38, color: '#eab308' },
  { name: 'Well-Worn', min: 0.38, max: 0.45, color: '#f97316' },
  { name: 'Battle-Scarred', min: 0.45, max: 1.00, color: '#ef4444' },
];

export default function InventoryFilters({ 
  filters, 
  onChange, 
  availableTypes = [], 
  availableRarities = [],
  maxPrice = 1000 
}: InventoryFiltersProps) {
  const [showTypes, setShowTypes] = useState(false);
  const [showRarities, setShowRarities] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'price_high', label: 'Price (High to Low)' },
    { value: 'price_low', label: 'Price (Low to High)' },
  ];

  // Get float wear name based on value
  const getFloatWearName = (float: number) => {
    for (const range of FLOAT_RANGES) {
      if (float >= range.min && float < range.max) {
        return range.name;
      }
    }
    return 'Battle-Scarred';
  };

  // Price quick filters
  const priceQuickFilters = [
    { label: '<$10', value: [0, 10] },
    { label: '$10 - $50', value: [10, 50] },
    { label: '$50 - $250', value: [50, 250] },
    { label: '>$250', value: [250, maxPrice] },
  ];

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search items..."
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Type Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
          <button
            onClick={() => setShowTypes(!showTypes)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white hover:border-slate-600 transition"
          >
            <span className="text-sm">
              {filters.types.length > 0 
                ? `${filters.types.length} selected` 
                : 'All Types'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTypes ? 'rotate-180' : ''}`} />
          </button>

          {showTypes && (
            <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {availableTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center px-4 py-2 hover:bg-slate-700 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...filters.types, type]
                        : filters.types.filter(t => t !== type);
                      onChange({ types: newTypes });
                    }}
                    className="mr-3"
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: TYPE_COLORS[type] || '#fff' }}
                  >
                    {type.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Rarity Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-2">Rarity</label>
          <button
            onClick={() => setShowRarities(!showRarities)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white hover:border-slate-600 transition"
          >
            <span className="text-sm">
              {filters.rarities.length > 0 
                ? `${filters.rarities.length} selected` 
                : 'All Rarities'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showRarities ? 'rotate-180' : ''}`} />
          </button>

          {showRarities && (
            <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {availableRarities.map((rarity) => {
                const rarityInfo = RARITY_COLORS[rarity] || { name: rarity, color: '#fff' };
                return (
                  <label
                    key={rarity}
                    className="flex items-center px-4 py-2 hover:bg-slate-700 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={filters.rarities.includes(rarity)}
                      onChange={(e) => {
                        const newRarities = e.target.checked
                          ? [...filters.rarities, rarity]
                          : filters.rarities.filter(r => r !== rarity);
                        onChange({ rarities: newRarities });
                      }}
                      className="mr-3"
                    />
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: rarityInfo.color }}
                    />
                    <span className="text-sm">{rarityInfo.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-2">Sort By</label>
          <button
            onClick={() => setShowSort(!showSort)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white hover:border-slate-600 transition"
          >
            <span className="text-sm">
              {sortOptions.find(opt => opt.value === filters.sortBy)?.label || 'Newest First'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSort ? 'rotate-180' : ''}`} />
          </button>

          {showSort && (
            <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange({ sortBy: option.value });
                    setShowSort(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition ${
                    filters.sortBy === option.value ? 'bg-slate-700 text-blue-400' : 'text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-300">Price</label>
          <button
            onClick={() => onChange({ priceRange: [0, maxPrice] })}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            Reset
          </button>
        </div>

        {/* Dual Range Slider */}
        <div className="relative mb-4">
          {/* Track Background */}
          <div className="absolute left-0 right-0 top-0 h-1 bg-slate-700 rounded-full" />

          {/* Active range highlight */}
          <div 
            className="absolute h-1 bg-blue-500 rounded-full transition-all pointer-events-none"
            style={{
              left: `${(filters.priceRange[0] / maxPrice) * 100}%`,
              right: `${100 - (filters.priceRange[1] / maxPrice) * 100}%`,
              top: 0
            }}
          />

          {/* Min Slider */}
          <input
            type="range"
            min="0"
            max={maxPrice}
            step="0.01"
            value={filters.priceRange[0]}
            onChange={(e) => {
              const newMin = Math.min(Number(e.target.value), filters.priceRange[1] - 0.01);
              onChange({ priceRange: [newMin, filters.priceRange[1]] });
            }}
            className="absolute top-0 left-0 w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:z-20 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-500 [&::-moz-range-thumb]:border-0"
          />

          {/* Max Slider */}
          <input
            type="range"
            min="0"
            max={maxPrice}
            step="0.01"
            value={filters.priceRange[1]}
            onChange={(e) => {
              const newMax = Math.max(Number(e.target.value), filters.priceRange[0] + 0.01);
              onChange({ priceRange: [filters.priceRange[0], newMax] });
            }}
            className="absolute top-0 left-0 w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:z-30 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-500 [&::-moz-range-thumb]:border-0"
          />
        </div>

        {/* Price Display */}
        <div className="flex items-center justify-between mt-4 gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-1">From</div>
            <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
              <span className="text-white font-medium">$ {filters.priceRange[0].toFixed(2)}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-1">To</div>
            <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
              <span className="text-white font-medium">
                $ {filters.priceRange[1].toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Price Filters */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {priceQuickFilters.map((filter, index) => (
            <button
              key={index}
              onClick={() => onChange({ priceRange: filter.value as [number, number] })}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded transition"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Float Range Slider */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-300">Float Value</label>
          <button
            onClick={() => onChange({ floatRange: [0, 1] })}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            Reset
          </button>
        </div>

        {/* Dual Range Slider for Float */}
        <div className="relative mb-4">
          {/* Track Background */}
          <div className="absolute left-0 right-0 top-0 h-1 bg-slate-700 rounded-full" />

          {/* Active range highlight */}
          <div 
            className="absolute h-1 bg-gradient-to-r from-green-500 to-red-500 rounded-full transition-all pointer-events-none"
            style={{
              left: `${(filters.floatRange[0] / 1) * 100}%`,
              right: `${100 - (filters.floatRange[1] / 1) * 100}%`,
              top: 0
            }}
          />

          {/* Min Slider */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={filters.floatRange[0]}
            onChange={(e) => {
              const newMin = Math.min(Number(e.target.value), filters.floatRange[1] - 0.01);
              onChange({ floatRange: [newMin, filters.floatRange[1]] });
            }}
            className="absolute top-0 left-0 w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:z-20 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-green-500 [&::-moz-range-thumb]:border-0"
          />

          {/* Max Slider */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={filters.floatRange[1]}
            onChange={(e) => {
              const newMax = Math.max(Number(e.target.value), filters.floatRange[0] + 0.01);
              onChange({ floatRange: [filters.floatRange[0], newMax] });
            }}
            className="absolute top-0 left-0 w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-red-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:z-30 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-red-500 [&::-moz-range-thumb]:border-0"
          />
        </div>

        {/* Float Display */}
        <div className="flex items-center justify-between mt-4 gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-1">From</div>
            <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
              <span className="text-white font-mono font-medium">
                {filters.floatRange[0].toFixed(2)}
              </span>
              <div className="text-xs text-green-400 mt-0.5">
                {getFloatWearName(filters.floatRange[0])}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-1">To</div>
            <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
              <span className="text-white font-mono font-medium">
                {filters.floatRange[1].toFixed(2)}
              </span>
              <div className="text-xs text-red-400 mt-0.5">
                {getFloatWearName(filters.floatRange[1])}
              </div>
            </div>
          </div>
        </div>

        {/* Float Quick Filters */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {FLOAT_RANGES.map((range, index) => (
            <button
              key={index}
              onClick={() => onChange({ floatRange: [range.min, range.max] })}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition flex items-center gap-2"
              style={{ 
                borderColor: range.color + '40',
                color: range.color 
              }}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: range.color }}
              />
              {range.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}