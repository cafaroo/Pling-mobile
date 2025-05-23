import { MD3DarkTheme, configureFonts, type MD3Theme } from 'react-native-paper';
import type { Theme } from 'react-native-paper/lib/typescript/types';

const fontConfig = {
  customVariant: {
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
  },
};

// Vi utvidgar MD3Theme med våra egna properties
interface CustomTheme extends MD3Theme {
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  }
}

export const theme: CustomTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#5B21B6',
    onPrimary: '#FFFFFF',
    primaryContainer: '#4C1D95',
    onPrimaryContainer: '#FFFFFF',
    secondary: '#FACC15',
    onSecondary: '#0F0E2A',
    secondaryContainer: '#EC4899',
    onSecondaryContainer: '#FFFFFF',
    error: '#EF4444',
    onError: '#FFFFFF',
    background: '#0F0E2A',
    onBackground: '#FFFFFF',
    surface: '#1E1B4B',
    onSurface: '#FFFFFF',
    surfaceVariant: '#312E81',
    onSurfaceVariant: 'rgba(255, 255, 255, 0.7)',
    outline: '#4B5563',
  },
  fonts: configureFonts({
    config: {
      ...fontConfig,
    },
  }),
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
}; 