import { View, StyleSheet } from 'react-native';
import { Video as LucideIcon } from 'lucide-react-native';

type TabBarIconProps = {
  icon: LucideIcon;
  color: string;
  size: number;
};

export default function TabBarIcon({ icon: Icon, color, size }: TabBarIconProps) {
  return (
    <View style={styles.container}>
      <Icon color={color} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: -2,
  },
});