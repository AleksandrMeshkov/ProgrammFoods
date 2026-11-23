import { SearchApi } from '@openfoodfacts/openfoodfacts-nodejs';

import type { Product } from '@/types/tracker';

const searchApi = new SearchApi(globalThis.fetch);

function asNumber(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    const number = asOptionalNumber(value);
    if (number !== undefined) return number;
  }
  return 0;
}

function parseProduct(hit: Record<string, unknown>): Product | null {
  const code = asString(hit.code) || String(hit.code ?? '');
  const name =
    asString(hit.product_name_ru) ||
    asString(hit.product_name) ||
    asString(hit.product_name_en);

  if (!code || !name) return null;

  const nutriments =
    typeof hit.nutriments === 'object' && hit.nutriments !== null
      ? (hit.nutriments as Record<string, unknown>)
      : {};

  let brand: string | undefined;
  if (Array.isArray(hit.brands)) brand = asString(hit.brands[0]) || undefined;
  if (!brand) brand = asString(hit.brands) || undefined;

  const servingGrams = firstNumber(
    hit.serving_quantity,
    hit.serving_quantity_100g,
  );
  return {
    code,
    name,
    brand,
    imageUrl: asString(hit.image_front_small_url) || undefined,
    servingGrams: Math.max(servingGrams, 100),
    calories: asNumber(nutriments['energy-kcal_100g']) ||
      asNumber(nutriments['energy_kcal_100g']) ||
      asNumber(nutriments.energy_kcal),
    proteins: asNumber(nutriments.proteins_100g),
    carbs: asNumber(nutriments.carbohydrates_100g),
    fats: asNumber(nutriments.fat_100g),
  };
}

export async function searchProducts(query: string): Promise<Product[]> {
  const response = await searchApi.searchGet({
    q: query,
    langs: 'ru,en',
    page_size: 20,
    page: 1,
    fields:
      'code,product_name,product_name_ru,product_name_en,brands,image_front_small_url,nutriments,serving_quantity',
  });

  if (response.error) throw new Error('Не удалось выполнить поиск');

  const data = response.data as { hits?: Record<string, unknown>[] } | undefined;
  return (data?.hits ?? []).map(parseProduct).filter((product): product is Product => product !== null);
}

export async function getProductByCode(code: string): Promise<Product | null> {
  const response = await searchApi.searchGet({
    q: `code:${code}`,
    langs: 'ru,en',
    page_size: 1,
    page: 1,
    fields:
      'code,product_name,product_name_ru,product_name_en,brands,image_front_small_url,nutriments,serving_quantity,serving_quantity_100g',
  });

  if (response.error) return null;

  const data = response.data as { hits?: Record<string, unknown>[] } | undefined;
  const exactProduct = (data?.hits ?? [])
    .map(parseProduct)
    .find((product) => product?.code === code);
  return exactProduct ?? null;
}
