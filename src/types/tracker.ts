export type UnitMode = 'grams' | 'pieces';

export type Product = {
  code: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  servingGrams: number;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  sugars: number;
};

export type TrackerEntry = {
  id: string;
  product: Product;
  amount: number;
  unit: UnitMode;
};

export type TrackerData = {
  mealCount: number;
  entries: TrackerEntry[][];
  mealNames: string[];
};
