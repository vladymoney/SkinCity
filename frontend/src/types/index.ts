export enum Rarity {
  Consumer = 'Consumer Grade',
  Industrial = 'Industrial Grade',
  MilSpec = 'Mil-Spec Grade',
  Restricted = 'Restricted',
  Classified = 'Classified',
  Covert = 'Covert',
  Contraband = 'Contraband',
  Extraordinary = 'Extraordinary',
}

export type SortOption = 'name_asc' | 'name_desc' | 'newest' | 'price_high' | 'price_low';

export interface InventoryFilters {
  search: string;
  types: string[];
  rarities: string[];
  sortBy: SortOption;
  priceRange: [number, number];
  floatRange: [number, number];
}