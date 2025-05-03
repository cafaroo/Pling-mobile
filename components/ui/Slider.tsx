import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import RNSlider from '@react-native-community/slider';
import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  style?: any;
}

export const Slider = memo(({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  label,
  showValue = true,
  disabled = false,
  style,
}: SliderProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text variant="bodySmall">{label}</Text>
          {showValue && (
            <Text variant="bodySmall" style={{ color: colors.primary }}>
              {value}
            </Text>
          )}
        </View>
      )}
      <RNSlider
        value={value}
        onValueChange={onValueChange}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        disabled={disabled}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
        style={styles.slider}
      />
    </View>
  );
});

Slider.displayName = 'Slider';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
}); 