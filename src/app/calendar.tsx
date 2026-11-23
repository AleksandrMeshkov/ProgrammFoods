import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { calendarStyles as styles } from '@/styles/calendar.styles';
import type { TrackerData, TrackerEntry } from '@/types/tracker';

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
});

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

export default function CalendarScreen() {
  const [displayMonth, setDisplayMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [dayStatuses, setDayStatuses] = useState<
    Record<string, [boolean, boolean, boolean]>
  >({});
  const [dayTrackers, setDayTrackers] = useState<Record<string, TrackerData>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rangeOffset, setRangeOffset] = useState(0);
  const [rangeLength, setRangeLength] = useState(1);

  const loadMonth = useCallback(async () => {
    const daysInMonth = new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth() + 1,
      0,
    ).getDate();
    const keys = Array.from(
      { length: daysInMonth },
      (_, index) => dateKey(new Date(displayMonth.getFullYear(), displayMonth.getMonth(), index + 1)),
    );
    const values = await AsyncStorage.multiGet(keys.map((key) => `tracker:${key}`));
    const statuses: Record<string, [boolean, boolean, boolean]> = {};
    const trackers: Record<string, TrackerData> = {};

    values.forEach(([key, value]) => {
      if (!value) return;
      const date = key.replace('tracker:', '');
      const tracker = JSON.parse(value) as Partial<TrackerData>;
      if (!Array.isArray(tracker.entries)) return;
      trackers[date] = {
        mealCount: tracker.mealCount ?? 3,
        mealNames: Array.isArray(tracker.mealNames)
          ? tracker.mealNames
          : ['Завтрак', 'Обед', 'Ужин'],
        entries: tracker.entries as TrackerData['entries'],
      };
      statuses[date] = [
        (tracker.entries[0]?.length ?? 0) > 0,
        (tracker.entries[1]?.length ?? 0) > 0,
        (tracker.entries[2]?.length ?? 0) > 0,
      ];
    });

    setDayStatuses(statuses);
    setDayTrackers(trackers);
  }, [displayMonth]);

  useFocusEffect(
    useCallback(() => {
      loadMonth().catch(() => {});
    }, [loadMonth]),
  );

  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const mondayBasedOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: mondayBasedOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [displayMonth]);

  function shiftMonth(amount: number) {
    setDisplayMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  }

  const rangeStart = useMemo(
    () => addMonths(displayMonth, rangeOffset),
    [displayMonth, rangeOffset],
  );
  const rangeEnd = useMemo(
    () => addMonths(rangeStart, rangeLength - 1),
    [rangeStart, rangeLength],
  );

  function getRangeKeys() {
    const keys: string[] = [];
    let month = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 0);

    while (month <= end) {
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day += 1) {
        keys.push(dateKey(new Date(year, monthIndex, day)));
      }
      month = new Date(year, monthIndex + 1, 1);
    }
    return keys;
  }

  async function mergeTracker(date: string, incoming: TrackerData) {
    const storageKey = `tracker:${date}`;
    const storedValue = await AsyncStorage.getItem(storageKey);
    if (!storedValue) {
      await AsyncStorage.setItem(storageKey, JSON.stringify(incoming));
      return;
    }

    const stored = JSON.parse(storedValue) as TrackerData;
    const mealNames = Array.isArray(incoming.mealNames) && incoming.mealNames.length >= 3
      ? incoming.mealNames
      : stored.mealNames;
    const entries = incoming.entries.map((incomingEntries, mealIndex) => {
      const existingEntries = stored.entries[mealIndex] ?? [];
      const knownIds = new Set(existingEntries.map((entry) => entry.id));
      const uniqueIncoming = incomingEntries.filter((entry) => !knownIds.has(entry.id));
      return [...existingEntries, ...uniqueIncoming];
    });

    for (let index = incoming.entries.length; index < stored.entries.length; index += 1) {
      entries.push(stored.entries[index] ?? []);
    }

    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify({
        mealCount: Math.max(stored.mealCount, mealNames.length),
        mealNames,
        entries,
      }),
    );
  }

  async function importData(format: 'json' | 'csv') {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: format === 'json' ? 'application/json' : 'text/csv',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets[0]) return;

      const file = new File(result.assets[0].uri);
      const text = await file.text();

      if (format === 'json') {
        const parsed = JSON.parse(text) as
          | { date: string; tracker: TrackerData }[]
          | Record<string, TrackerData>;
        const records = Array.isArray(parsed)
          ? parsed
          : Object.entries(parsed).map(([date, tracker]) => ({ date, tracker }));

        for (const record of records) {
          if (!record.date || !record.tracker || !Array.isArray(record.tracker.entries)) continue;
          await mergeTracker(record.date, record.tracker);
        }
      } else {
        const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) throw new Error('CSV-файл пуст');

        const headers = parseCsvLine(lines[0]);
        const grouped = new Map<string, TrackerData>();

        for (const line of lines.slice(1)) {
          const values = parseCsvLine(line);
          const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
          if (!row.date) continue;

          if (!grouped.has(row.date)) {
            grouped.set(row.date, {
              mealCount: 3,
              mealNames: ['Завтрак', 'Обед', 'Ужин'],
              entries: [[], [], []],
            });
          }
          const tracker = grouped.get(row.date)!;
          const mealIndex = Number(row.mealIndex);
          if (!Number.isInteger(mealIndex) || mealIndex < 0) continue;
          while (tracker.entries.length <= mealIndex) tracker.entries.push([]);
          while (tracker.mealNames.length <= mealIndex) {
            tracker.mealNames.push(`Перекус ${tracker.mealNames.length - 2}`);
          }
          if (row.mealName) tracker.mealNames[mealIndex] = row.mealName;

          const amount = Number(row.amount);
          if (!row.productName || !Number.isFinite(amount) || amount <= 0) continue;
          const entry: TrackerEntry = {
            id: row.id || `${Date.now()}-${row.productCode || row.productName}`,
            amount,
            unit: row.unit === 'pieces' ? 'pieces' : 'grams',
            product: {
              code: row.productCode || '',
              name: row.productName,
              brand: row.brand || undefined,
              imageUrl: row.imageUrl || undefined,
              servingGrams: Number(row.servingGrams) || 100,
              calories: Number(row.calories) || 0,
              proteins: Number(row.proteins) || 0,
              carbs: Number(row.carbs) || 0,
              fats: Number(row.fats) || 0,
            },
          };
          tracker.entries[mealIndex].push(entry);
          tracker.mealCount = tracker.mealNames.length;
        }

        for (const [date, tracker] of grouped) {
          await mergeTracker(date, tracker);
        }
      }

      await loadMonth();
      Alert.alert('Импорт завершён', 'Данные объединены с сохранёнными днями.');
    } catch (error) {
      Alert.alert(
        'Ошибка импорта',
        error instanceof Error ? error.message : 'Не удалось прочитать файл.',
      );
    }
  }

  async function exportData(format: 'json' | 'csv') {
    try {
      const keys = getRangeKeys();
      const values = await AsyncStorage.multiGet(keys.map((key) => `tracker:${key}`));
      const records: { date: string; tracker: TrackerData }[] = [];

      values.forEach(([key, value]) => {
        if (!value) return;
        records.push({
          date: key.replace('tracker:', ''),
          tracker: JSON.parse(value) as TrackerData,
        });
      });

      let content: string;
      let mimeType: string;
      let extension: string;

      if (format === 'json') {
        content = JSON.stringify(records, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        const headers = [
          'date',
          'mealIndex',
          'mealName',
          'id',
          'productCode',
          'productName',
          'brand',
          'imageUrl',
          'amount',
          'unit',
          'servingGrams',
          'calories',
          'proteins',
          'carbs',
          'fats',
        ];
        const rows = [headers.join(',')];

        records.forEach(({ date, tracker }) => {
          tracker.entries.forEach((entries, mealIndex) => {
            entries.forEach((entry) => {
              const product = entry.product;
              rows.push([
                date,
                mealIndex,
                tracker.mealNames[mealIndex] ?? '',
                entry.id,
                product.code,
                product.name,
                product.brand ?? '',
                product.imageUrl ?? '',
                entry.amount,
                entry.unit,
                product.servingGrams,
                product.calories,
                product.proteins,
                product.carbs,
                product.fats,
              ].map(csvEscape).join(','));
            });
          });
        });
        content = rows.join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
      }

      const filename = `nutrition-${dateKey(rangeStart)}-${dateKey(rangeEnd)}.${extension}`;
      const file = new File(Paths.cache, filename);
      file.create({ overwrite: true });
      file.write(content);

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Экспорт недоступен', 'Передача файлов не поддерживается на этом устройстве.');
        return;
      }
      await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Экспорт трекера питания' });
    } catch (error) {
      Alert.alert(
        'Ошибка экспорта',
        error instanceof Error ? error.message : 'Не удалось создать файл.',
      );
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          style={styles.monthButton}
          onPress={() => shiftMonth(-1)}
          accessibilityLabel="Предыдущий месяц">
          <Text style={styles.monthButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>
          {MONTH_FORMATTER.format(displayMonth)}
        </Text>
        <Pressable
          style={styles.monthButton}
          onPress={() => shiftMonth(1)}
          accessibilityLabel="Следующий месяц">
          <Text style={styles.monthButtonText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.breakfast]} />
          <Text style={styles.legendText}>Завтрак</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.lunch]} />
          <Text style={styles.legendText}>Обед</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dinner]} />
          <Text style={styles.legendText}>Ужин</Text>
        </View>
      </View>

      <View style={styles.calendar}>
        <View style={styles.weekRow}>
          {WEEK_DAYS.map((day) => (
            <Text key={day} style={styles.weekDay}>{day}</Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
            }

            const date = new Date(
              displayMonth.getFullYear(),
              displayMonth.getMonth(),
              day,
            );
            const key = dateKey(date);
            const status = dayStatuses[key] ?? [false, false, false];
            const isToday = key === dateKey(new Date());

            return (
              <Pressable
                key={key}
                style={[styles.dayCell, isToday && styles.todayCell]}
                onPress={() => setSelectedDate(key)}>
                <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
                  {day}
                </Text>
                <View style={styles.mealMarks}>
                  {status.map((filled, mealIndex) => (
                    <View
                      key={mealIndex}
                      style={[
                        styles.mealMark,
                        mealIndex === 0 && styles.breakfast,
                        mealIndex === 1 && styles.lunch,
                        mealIndex === 2 && styles.dinner,
                        !filled && styles.mealMarkEmpty,
                      ]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.dataPanel}>
        <Text style={styles.dataTitle}>Диапазон данных</Text>
        <View style={styles.rangeNavigation}>
          <Pressable
            style={styles.rangeArrow}
            onPress={() => setRangeOffset((current) => current - 1)}
            accessibilityLabel="Предыдущий месяц диапазона">
            <Text style={styles.rangeArrowText}>‹</Text>
          </Pressable>
          <View style={styles.rangeLabel}>
            <Text style={styles.rangeLabelText}>
              {MONTH_FORMATTER.format(rangeStart)}
            </Text>
            {rangeLength > 1 && (
              <Text style={styles.rangeLabelTextSmall}>
                — {MONTH_FORMATTER.format(rangeEnd)}
              </Text>
            )}
          </View>
          <Pressable
            style={styles.rangeArrow}
            onPress={() => setRangeOffset((current) => current + 1)}
            accessibilityLabel="Следующий месяц диапазона">
            <Text style={styles.rangeArrowText}>›</Text>
          </Pressable>
        </View>

        <View style={styles.lengthRow}>
          {[1, 3, 6, 12].map((months) => (
            <Pressable
              key={months}
              style={[
                styles.lengthButton,
                rangeLength === months && styles.lengthButtonActive,
              ]}
              onPress={() => setRangeLength(months)}>
              <Text
                style={[
                  styles.lengthButtonText,
                  rangeLength === months && styles.lengthButtonTextActive,
                ]}>
                {months === 1 ? 'Месяц' : `${months} мес.`}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, styles.importButton]}
            onPress={() => importData('json')}>
            <Text style={styles.actionButtonText}>Импорт JSON</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.importButton]}
            onPress={() => importData('csv')}>
            <Text style={styles.actionButtonText}>Импорт CSV</Text>
          </Pressable>
        </View>
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, styles.exportButton]}
            onPress={() => exportData('json')}>
            <Text style={styles.exportButtonText}>Экспорт JSON</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.exportButton]}
            onPress={() => exportData('csv')}>
            <Text style={styles.exportButtonText}>Экспорт CSV</Text>
          </Pressable>
        </View>
      </View>
      <Modal
        visible={selectedDate !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDate(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedDate
                    ? new Intl.DateTimeFormat('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }).format(
                        new Date(
                          Number(selectedDate.slice(0, 4)),
                          Number(selectedDate.slice(5, 7)) - 1,
                          Number(selectedDate.slice(8, 10)),
                        ),
                      )
                    : 'День питания'}
                </Text>
                <Text style={styles.modalSubtitle}>Что было съедено</Text>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={() => setSelectedDate(null)}
                accessibilityLabel="Закрыть информацию за день">
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedDate &&
                (() => {
                  const tracker = dayTrackers[selectedDate];
                  if (!tracker) {
                    return (
                      <Text style={styles.emptyDayText}>
                        В этот день данные о приёмах пищи отсутствуют
                      </Text>
                    );
                  }

                  return tracker.entries.map((entries, mealIndex) => (
                    <View key={mealIndex} style={styles.mealSection}>
                      <View style={styles.mealSectionHeader}>
                        <Text style={styles.mealName}>
                          {tracker.mealNames[mealIndex] ?? `Приём ${mealIndex + 1}`}
                        </Text>
                        <Text style={styles.mealCount}>
                          {entries.length
                            ? `${entries.length} ${
                                entries.length === 1 ? 'продукт' : 'продукта'
                              }`
                            : 'Ничего'}
                        </Text>
                      </View>
                      {entries.map((entry) => {
                        const grams =
                          entry.unit === 'grams'
                            ? entry.amount
                            : entry.amount * entry.product.servingGrams;
                        const calories =
                          entry.product.calories * (grams / 100);
                        return (
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
                              <Text style={styles.entryName} numberOfLines={2}>
                                {entry.product.name}
                              </Text>
                              <Text style={styles.entryAmount}>
                                {entry.amount} {entry.unit === 'grams' ? 'г' : 'шт'}
                              </Text>
                            </View>
                            <Text style={styles.entryCalories}>
                              {Math.round(calories * 10) / 10} ккал
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ));
                })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
