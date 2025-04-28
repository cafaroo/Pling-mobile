import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
};

export default function Card({ children, style, onPress }: CardProps) {
  const { colors } = useTheme();
  
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.card,
          { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
          style
        ]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[
      styles.card,
      { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
});