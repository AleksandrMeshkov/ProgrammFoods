import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProfileMetrics = {
  height: number;
  weight: number;
  calorieNorm?: number;
};

export const PROFILE_STORAGE_KEY = 'profile:metrics';

export function calculateAverageCalories({ height, weight }: ProfileMetrics) {
  if (height <= 0 || weight <= 0) return 0;
  const restingCalories = 10 * weight + 6.25 * height - 228;
  return Math.round(Math.max(restingCalories, 1000) * 1.55);
}

export async function loadProfileMetrics(): Promise<ProfileMetrics | null> {
  const value = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
  if (!value) return null;
  const parsed = JSON.parse(value) as Partial<ProfileMetrics>;
  const height = Number(parsed.height);
  const weight = Number(parsed.weight);
  if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0 || weight <= 0) {
    return null;
  }
  const calorieNorm = Number(parsed.calorieNorm);
  return {
    height,
    weight,
    calorieNorm:
      Number.isFinite(calorieNorm) && calorieNorm >= 500 && calorieNorm <= 10000
        ? calorieNorm
        : undefined,
  };
}

export function getDailyCalories(profile: ProfileMetrics) {
  return profile.calorieNorm ?? calculateAverageCalories(profile);
}
