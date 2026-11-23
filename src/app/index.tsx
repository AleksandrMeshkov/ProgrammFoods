import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getProductByCode, searchProducts } from '@/services/openFoodFacts';
import { trackerStyles as styles } from '@/styles/tracker.styles';
import type { Product, TrackerData, TrackerEntry, UnitMode } from '@/types/tracker';

const DEFAULT_MEAL_NAMES = ['Завтрак', 'Обед', 'Ужин'];

function emptyTracker(): TrackerData {
  return {
    mealCount: 3,
    mealNames: [...DEFAULT_MEAL_NAMES],
    entries: [[], [], []],
  };
}

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function shiftDateKey(key: string, days: number) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TRACKER_DAYS_KEY = 'tracker:days';

function formatNumber(value: number) {
  return Math.round(value * 10) / 10;
}

export default function TrackerScreen() {
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [followCurrentDate, setFollowCurrentDate] = useState(true);
  const [tracker, setTracker] = useState<TrackerData>(() => emptyTracker());
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const [activeMeal, setActiveMeal] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [unit, setUnit] = useState<UnitMode>('grams');
  const [amount, setAmount] = useState('100');

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(`tracker:${selectedDate}`)
      .then((value) => {
        if (!active) return;

        if (!value) {
          setTracker(emptyTracker());
          return;
        }

        const saved = JSON.parse(value) as Partial<TrackerData>;
        if (!Array.isArray(saved.entries)) {
          setTracker(emptyTracker());
          return;
        }

        const mealNames =
          Array.isArray(saved.mealNames) && saved.mealNames.length >= 3
            ? saved.mealNames
            : [...DEFAULT_MEAL_NAMES];
        const entries = DEFAULT_MEAL_NAMES.map((_, index) => saved.entries?.[index] ?? []);
        for (let index = DEFAULT_MEAL_NAMES.length; index < mealNames.length; index += 1) {
          entries.push(saved.entries?.[index] ?? []);
        }
        const normalizedTracker: TrackerData = {
          mealCount: mealNames.length,
          mealNames,
          entries,
        };
        setTracker(normalizedTracker);

        Promise.all(
          normalizedTracker.entries.map(async (mealEntries) =>
            Promise.all(
              mealEntries.map(async (entry) => {
                if ((entry.product.sugars ?? 0) !== 0) return entry;
                try {
                  const refreshedProduct = await getProductByCode(entry.product.code);
                  return refreshedProduct
                    ? { ...entry, product: { ...entry.product, sugars: refreshedProduct.sugars } }
                    : entry;
                } catch {
                  return entry;
                }
              }),
            ),
          ),
        ).then((refreshedEntries) => {
          if (active) setTracker((current) => ({ ...current, entries: refreshedEntries }));
        });
      })
      .catch(() => {
        if (active) setTracker(emptyTracker());
      })
      .finally(() => {
        if (active) setLoadedDate(selectedDate);
      });

    return () => {
      active = false;
    };
  }, [selectedDate]);

  useEffect(() => {
    if (loadedDate === selectedDate) {
      Promise.all([
        AsyncStorage.setItem(`tracker:${selectedDate}`, JSON.stringify(tracker)),
        AsyncStorage.getItem(TRACKER_DAYS_KEY).then((value) => {
          const savedDays = value ? (JSON.parse(value) as string[]) : [];
          const nextDays = Array.from(new Set([selectedDate, ...savedDays])).sort().reverse();
          return AsyncStorage.setItem(TRACKER_DAYS_KEY, JSON.stringify(nextDays));
        }),
      ]).catch(() => {});
    }
  }, [tracker, loadedDate, selectedDate]);

  useEffect(() => {
    const syncCurrentDate = () => {
      if (followCurrentDate) setSelectedDate(todayKey());
    };

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncCurrentDate();
    });
    const interval = setInterval(syncCurrentDate, 60_000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [followCurrentDate]);

  const totals = useMemo(() => {
    const result = { calories: 0, proteins: 0, carbs: 0, fats: 0, sugars: 0 };
    tracker.entries.flat().forEach((entry) => {
      const grams =
        entry.unit === 'grams'
          ? entry.amount
          : entry.amount * entry.product.servingGrams;
      const factor = grams / 100;
      result.calories += entry.product.calories * factor;
      result.proteins += entry.product.proteins * factor;
      result.carbs += entry.product.carbs * factor;
      result.fats += entry.product.fats * factor;
      result.sugars += (entry.product.sugars ?? 0) * factor;
    });
    return result;
  }, [tracker.entries]);

  function addSnack() {
    setTracker((current) => ({
      mealCount: current.mealCount + 1,
      mealNames: [...current.mealNames, `Перекус ${current.mealNames.length - 2}`],
      entries: [...current.entries, []],
    }));
  }

  function removeSnack(mealIndex: number) {
    Alert.alert(
      'Удалить перекус?',
      'Все продукты этого перекуса будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            setTracker((current) => {
              const mealNames = current.mealNames.filter((_, index) => index !== mealIndex);
              const entries = current.entries.filter((_, index) => index !== mealIndex);
              const renamedMeals = mealNames.map((name, index) =>
                index >= 3 ? `Перекус ${index - 2}` : name,
              );

              return {
                mealCount: renamedMeals.length,
                mealNames: renamedMeals,
                entries,
              };
            });
            if (activeMeal === mealIndex) closeMeal();
          },
        },
      ],
    );
  }

  async function runSearch() {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      setSearchResults(await searchProducts(trimmedQuery));
    } catch {
      setSearchError('Не удалось получить результаты. Проверьте интернет-соединение.');
    } finally {
      setSearching(false);
    }
  }

  function openMeal(mealIndex: number) {
    setActiveMeal(mealIndex);
    setSelectedProduct(null);
    setQuery('');
    setSearchResults([]);
    setSearchError('');
  }

  function closeMeal() {
    setActiveMeal(null);
    setSelectedProduct(null);
  }

  function chooseProduct(product: Product) {
    setSelectedProduct(product);
    setUnit('grams');
    setAmount('100');
  }

  function addEntry() {
    const numericAmount = Number(amount);
    if (
      !selectedProduct ||
      activeMeal === null ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) return;

    const entry: TrackerEntry = {
      id: `${Date.now()}-${selectedProduct.code}`,
      product: selectedProduct,
      amount: numericAmount,
      unit,
    };

    setTracker((current) => ({
      ...current,
      entries: current.entries.map((entries, index) =>
        index === activeMeal ? [...entries, entry] : entries,
      ),
    }));
    setSelectedProduct(null);
  }

  function removeEntry(mealIndex: number, entryId: string) {
    setTracker((current) => ({
      ...current,
      entries: current.entries.map((entries, index) =>
        index === mealIndex ? entries.filter((entry) => entry.id !== entryId) : entries,
      ),
    }));
  }

  function getEntryCalories(entry: TrackerEntry) {
    const grams =
      entry.unit === 'grams'
        ? entry.amount
        : entry.amount * entry.product.servingGrams;
    return entry.product.calories * (grams / 100);
  }

  return (
    <>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable
            style={styles.dateButton}
            onPress={() => {
              setFollowCurrentDate(false);
              setSelectedDate((current) => shiftDateKey(current, -1));
            }}
            accessibilityLabel="Предыдущий день">
            <Text style={styles.dateButtonText}>‹</Text>
          </Pressable>
          <View style={styles.dateHeaderContent}>
            <Text style={styles.eyebrow}>
              {selectedDate === todayKey() ? 'Сегодня' : 'День трекера'}
            </Text>
            <Text style={styles.title}>
              {new Intl.DateTimeFormat('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(dateFromKey(selectedDate))}
            </Text>
          </View>
          <Pressable
            style={[
              styles.dateButton,
              selectedDate >= todayKey() && styles.dateButtonDisabled,
            ]}
            onPress={() => {
              if (selectedDate < todayKey()) {
                const nextDate = shiftDateKey(selectedDate, 1);
                setSelectedDate(nextDate);
                if (nextDate === todayKey()) setFollowCurrentDate(true);
              }
            }}
            accessibilityLabel="Следующий день"
            disabled={selectedDate >= todayKey()}>
            <Text style={styles.dateButtonText}>›</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.calorieSummary}>
            <Text style={styles.calorieValue}>{formatNumber(totals.calories)}</Text>
            <Text style={styles.calorieLabel}>ккал</Text>
          </View>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{formatNumber(totals.proteins)} г</Text>
              <Text style={styles.macroLabel}>Белки</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{formatNumber(totals.fats)} г</Text>
              <Text style={styles.macroLabel}>Жиры</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{formatNumber(totals.carbs)} г</Text>
              <Text style={styles.macroLabel}>Углеводы</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{formatNumber(totals.sugars)} г</Text>
              <Text style={styles.macroLabel}>Сахар</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Приёмы пищи</Text>
        </View>

        {tracker.entries.map((entries, mealIndex) => {
          const mealCalories = entries.reduce(
            (sum, entry) => sum + getEntryCalories(entry),
            0,
          );

          return (
            <View key={mealIndex} style={styles.mealCard}>
              <Pressable
                style={styles.mealCardContent}
                onPress={() => openMeal(mealIndex)}>
                <View>
                  <Text style={styles.mealName}>
                    {tracker.mealNames[mealIndex] ?? `Приём ${mealIndex + 1}`}
                  </Text>
                  <Text style={styles.mealCalories}>
                    {entries.length === 0
                      ? 'Ничего не добавлено'
                      : `${formatNumber(mealCalories)} ккал · ${entries.length} ${
                          entries.length === 1 ? 'продукт' : 'продукта'
                        }`}
                  </Text>
                </View>
              </Pressable>
              {mealIndex >= 3 ? (
                <Pressable
                  style={styles.removeMealButton}
                  onPress={() => removeSnack(mealIndex)}
                  accessibilityLabel={`Удалить ${tracker.mealNames[mealIndex]}`}>
                  <Text style={styles.removeMealButtonText}>×</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.mealArrowButton}
                  onPress={() => openMeal(mealIndex)}>
                  <Text style={styles.mealArrow}>›</Text>
                </Pressable>
              )}
            </View>
          );
        })}

        <Pressable style={styles.addSnackButton} onPress={addSnack}>
          <Text style={styles.addSnackButtonText}>+ Добавить перекус</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={activeMeal !== null}
        transparent
        animationType="slide"
        onRequestClose={closeMeal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {activeMeal !== null
                    ? tracker.mealNames[activeMeal] ?? 'Приём пищи'
                    : 'Приём пищи'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Добавьте продукты из базы Open Food Facts
                </Text>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={closeMeal}
                accessibilityLabel="Закрыть окно приёма пищи">
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled">
              {activeMeal !== null &&
                tracker.entries[activeMeal]?.map((entry) => (
                  <View key={entry.id} style={styles.entryRow}>
                    {entry.product.imageUrl ? (
                      <Image
                        source={{ uri: entry.product.imageUrl }}
                        style={styles.entryImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.entryImagePlaceholder}>
                        <Text style={styles.entryImagePlaceholderText}>OFF</Text>
                      </View>
                    )}
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName} numberOfLines={1}>
                        {entry.product.name}
                      </Text>
                      <Text style={styles.entryAmount}>
                        {formatNumber(entry.amount)} {entry.unit === 'grams' ? 'г' : 'шт'}
                      </Text>
                    </View>
                    <Text style={styles.entryCalories}>
                      {formatNumber(getEntryCalories(entry))} ккал
                    </Text>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => removeEntry(activeMeal, entry.id)}
                      accessibilityLabel={`Удалить ${entry.product.name}`}>
                      <Text style={styles.removeButtonText}>×</Text>
                    </Pressable>
                  </View>
                ))}

              <View style={styles.searchPanel}>
                <View style={styles.searchRow}>
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={runSearch}
                    placeholder="Название или штрихкод"
                    placeholderTextColor="#98A2B3"
                    style={styles.searchInput}
                    returnKeyType="search"
                  />
                  <Pressable style={styles.searchButton} onPress={runSearch}>
                    <Text style={styles.searchButtonText}>Найти</Text>
                  </Pressable>
                </View>

                {searching && (
                  <ActivityIndicator color="#4F7CFF" style={styles.loader} />
                )}
                {!!searchError && (
                  <Text style={styles.searchError}>{searchError}</Text>
                )}

                {!selectedProduct &&
                  searchResults.map((product) => (
                    <Pressable
                      key={product.code}
                      style={styles.productRow}
                      onPress={() => chooseProduct(product)}>
                      {product.imageUrl ? (
                        <Image
                          source={{ uri: product.imageUrl }}
                          style={styles.productImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.productImagePlaceholder}>
                          <Text style={styles.productImagePlaceholderText}>OFF</Text>
                        </View>
                      )}
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>
                          {product.name}
                        </Text>
                        {!!product.brand && (
                          <Text style={styles.productBrand} numberOfLines={1}>
                            {product.brand}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.productCalories}>
                        {formatNumber(product.calories)} ккал/100г
                      </Text>
                    </Pressable>
                  ))}

                {selectedProduct && (
                  <View style={styles.quantityPanel}>
                    <Text style={styles.quantityProductName}>
                      {selectedProduct.name}
                    </Text>
                    <View style={styles.unitSwitch}>
                      <Pressable
                        style={[
                          styles.unitButton,
                          unit === 'grams' && styles.unitButtonActive,
                        ]}
                        onPress={() => {
                          setUnit('grams');
                          setAmount('100');
                        }}>
                        <Text
                          style={[
                            styles.unitButtonText,
                            unit === 'grams' && styles.unitButtonTextActive,
                          ]}>
                          Граммы
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.unitButton,
                          unit === 'pieces' && styles.unitButtonActive,
                        ]}
                        onPress={() => {
                          setUnit('pieces');
                          setAmount('1');
                        }}>
                        <Text
                          style={[
                            styles.unitButtonText,
                            unit === 'pieces' && styles.unitButtonTextActive,
                          ]}>
                          Штуки
                        </Text>
                      </Pressable>
                    </View>
                    <View style={styles.amountRow}>
                      <TextInput
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        style={styles.amountInput}
                      />
                      <Text style={styles.amountUnit}>
                        {unit === 'grams' ? 'г' : 'шт'}
                      </Text>
                      <Pressable style={styles.confirmButton} onPress={addEntry}>
                        <Text style={styles.confirmButtonText}>Добавить</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
