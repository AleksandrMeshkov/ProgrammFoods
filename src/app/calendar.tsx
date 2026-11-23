import { Text, View } from 'react-native';

import { calendarStyles as styles } from '@/styles/calendar.styles';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Календарь</Text>
      <Text style={styles.subtitle}>Здесь появится календарь питания</Text>
    </View>
  );
}
