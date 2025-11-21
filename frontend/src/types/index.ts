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

export type SortOption = 'name_asc' | 'name_desc' | 'newest';

export interface InventoryFilters {
  search: string;
  rarities: string[];
  sortBy: SortOption;
}