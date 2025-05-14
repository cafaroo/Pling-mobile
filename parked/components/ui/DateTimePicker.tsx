import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { format } from 'date-fns';

type DateTimePickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

export default function DateTimePicker({ 
  value,
  onChange,
  minimumDate,
  maximumDate
}: DateTimePickerProps) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const handlePress = () => {
    if (Platform.OS === 'web') {
      // Web implementation using native date input
      const input = document.createElement('input');
      input.type = 'date';
      input.value = format(value, 'yyyy-MM-dd');
      input.min = minimumDate ? format(minimumDate, 'yyyy-MM-dd') : undefined;
      input.max = maximumDate ? format(maximumDate, 'yyyy-MM-dd') : undefined;
      
      input.onchange = (e) => {
        const newDate = new Date(e.target.value);
        onChange(newDate);
      };
      
      input.click();
    } else {
      // Native implementation would go here
      // For now, just show the formatted date
      setShowPicker(true);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        { 
          borderColor: colors.neutral[500],
          backgroundColor: 'rgba(0, 0, 0, 0.2)'
        }
      ]}
    >
      <Calendar size={20} color={colors.neutral[400]} style={styles.icon} />
      <Text style={[styles.dateText, { color: colors.text.main }]}>
        {format(value, 'MMM d, yyyy')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 8,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
});