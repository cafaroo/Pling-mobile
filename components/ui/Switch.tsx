import React from 'react';
import { Switch as RNSwitch, SwitchProps as RNSwitchProps, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface SwitchProps extends Omit<RNSwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> {
  size?: 'small' | 'medium' | 'large';
}

export const Switch: React.FC<SwitchProps> = ({
  size = 'medium',
  ...props
}) => {
  const theme = useTheme();

  const getTrackColor = () => {
    if (Platform.OS === 'ios') {
      return {
        false: theme.colors.border,
        true: theme.colors.primary,
      };
    }
    return {
      false: theme.colors.border + '80',
      true: theme.colors.primary + '80',
    };
  };

  const getThumbColor = () => {
    if (Platform.OS === 'ios') {
      return '#FFFFFF';
    }
    return props.value ? theme.colors.primary : theme.colors.foreground + '40';
  };

  return (
    <RNSwitch
      {...props}
      trackColor={getTrackColor()}
      thumbColor={getThumbColor()}
      ios_backgroundColor={theme.colors.border}
      style={[
        Platform.select({
          ios: {
            transform: [
              { scaleX: size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1 },
              { scaleY: size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1 },
            ],
          },
          android: {
            transform: [
              { scale: size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1 },
            ],
          },
        }),
      ]}
    />
  );
};

export type { SwitchProps }; 