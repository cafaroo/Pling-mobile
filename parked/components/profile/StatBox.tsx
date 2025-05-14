import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

type StatBoxProps = {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
};

export default function StatBox({ title, value, icon: Icon, color }: StatBoxProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Icon color="white" size={20} />
      </View>
      
      <Text style={[styles.value, { color: colors.text.main }]}>
        {value}
      </Text>
      
      <Text style={[styles.title, { color: colors.text.light }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  value: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});