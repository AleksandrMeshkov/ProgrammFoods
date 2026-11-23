import { Text, View } from 'react-native';

import { profileStyles as styles } from '@/styles/profile.styles';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Профиль</Text>
      <Text style={styles.subtitle}>Здесь появятся настройки пользователя</Text>
    </View>
  );
}
