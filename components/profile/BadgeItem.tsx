import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/types';

type BadgeItemProps = {
  badge: Badge;
};

export default function BadgeItem({ badge }: BadgeItemProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: badge.color }]}>
        <Text style={styles.icon}>{badge.icon}</Text>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.name, { color: colors.text.main }]}>
          {badge.name}
        </Text>
        
        <Text style={[styles.description, { color: colors.text.light }]}>
          {badge.description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 2,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});