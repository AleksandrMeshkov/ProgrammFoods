import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { profileStyles as styles } from '@/styles/profile.styles';
import {
  calculateAverageCalories,
  getDailyCalories,
  loadProfileMetrics,
  PROFILE_STORAGE_KEY,
  type ProfileMetrics,
} from '@/services/profile';

export default function ProfileScreen() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [calorieNorm, setCalorieNorm] = useState('');
  const [savedMetrics, setSavedMetrics] = useState<ProfileMetrics | null>(null);
  const [editing, setEditing] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadProfileMetrics()
        .then((profile) => {
          setSavedMetrics(profile);
          if (profile) {
            setHeight(String(profile.height));
            setWeight(String(profile.weight));
            setCalorieNorm(
              String(profile.calorieNorm ?? calculateAverageCalories(profile)),
            );
            setEditing(false);
          } else {
            setEditing(true);
          }
        })
        .catch(() => {
          setSavedMetrics(null);
          setEditing(true);
        });
    }, []),
  );

  async function saveProfile() {
    const heightValue = Number(height.replace(',', '.'));
    const weightValue = Number(weight.replace(',', '.'));
    const calorieNormValue = Number(calorieNorm.replace(',', '.'));

    if (
      !Number.isFinite(heightValue) ||
      !Number.isFinite(weightValue) ||
      heightValue < 100 ||
      heightValue > 250 ||
      weightValue < 20 ||
      weightValue > 300
    ) {
      Alert.alert('Проверьте данные', 'Введите рост от 100 до 250 см и вес от 20 до 300 кг.');
      return;
    }

    if (
      calorieNorm &&
      (!Number.isFinite(calorieNormValue) ||
        calorieNormValue < 500 ||
        calorieNormValue > 10000)
    ) {
      Alert.alert('Проверьте норму', 'Введите норму калорий от 500 до 10000 ккал.');
      return;
    }

    const profile: ProfileMetrics = {
      height: heightValue,
      weight: weightValue,
      calorieNorm: calorieNorm ? calorieNormValue : undefined,
    };
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setSavedMetrics(profile);
    setEditing(false);
  }

  const dailyCalories = savedMetrics
    ? getDailyCalories(savedMetrics)
    : 0;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Профиль</Text>

      {savedMetrics && !editing ? (
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Ваши параметры</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{savedMetrics.height} см</Text>
              <Text style={styles.metricLabel}>Рост</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{savedMetrics.weight} кг</Text>
              <Text style={styles.metricLabel}>Вес</Text>
            </View>
          </View>

          <View style={styles.caloriesCard}>
            <Text style={styles.caloriesValue}>{dailyCalories}</Text>
            <Text style={styles.caloriesLabel}>ккал в среднем в день</Text>
          </View>

          <Pressable
            style={styles.editButton}
            onPress={() => setEditing(true)}>
            <Text style={styles.editButtonText}>Изменить параметры</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            {savedMetrics ? 'Изменить параметры' : 'Укажите параметры'}
          </Text>

          <Text style={styles.inputLabel}>Рост, см</Text>
          <TextInput
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            placeholder="Например, 175"
            placeholderTextColor="#98A2B3"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Вес, кг</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="Например, 70"
            placeholderTextColor="#98A2B3"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Норма калорий в день</Text>
          <TextInput
            value={calorieNorm}
            onChangeText={setCalorieNorm}
            keyboardType="decimal-pad"
            placeholder="Например, 2200"
            placeholderTextColor="#98A2B3"
            style={styles.input}
          />

          {height && weight && Number(height) > 0 && Number(weight) > 0 && (
            <View style={styles.previewCard}>
              <Text style={styles.previewValue}>
                {calorieNorm
                  ? Number(calorieNorm.replace(',', '.'))
                  : calculateAverageCalories({
                      height: Number(height.replace(',', '.')),
                      weight: Number(weight.replace(',', '.')),
                    })}
              </Text>
              <Text style={styles.previewLabel}>ориентировочная норма ккал в день</Text>
            </View>
          )}

          <Pressable style={styles.saveButton} onPress={saveProfile}>
            <Text style={styles.saveButtonText}>Сохранить</Text>
          </Pressable>

          {savedMetrics && (
            <Pressable
              style={styles.cancelButton}
              onPress={() => setEditing(false)}>
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}
