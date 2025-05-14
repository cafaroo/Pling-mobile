import { createContext, useContext } from 'react';

export interface Theme {
  colors: {
    background: {
      dark: string;
      main: string;
      light: string;
    };
    primary: {
      dark: string;
      main: string;
      light: string;
    };
    accent: {
      yellow: string;
      pink: string;
    };
    text: {
      main: string;
      light: string;
      dark: string;
    };
    error: string;
    success: string;
    neutral: {
      [key: number]: string;
    };
    secondary: {
      main: string;
      dark: string;
      light: string;
    };
  };
}

export const defaultTheme: Theme = {
  colors: {
    background: {
      dark: '#0F0E2A',
      main: '#1E1B4B',
      light: '#312E81',
    },
    primary: {
      dark: '#4C1D95',
      main: '#5B21B6',
      light: '#7C3AED',
    },
    accent: {
      yellow: '#FACC15',
      pink: '#EC4899',
    },
    text: {
      main: '#FFFFFF',
      light: 'rgba(255, 255, 255, 0.7)',
      dark: '#1F2937',
    },
    error: '#EF4444',
    success: '#10B981',
    neutral: {
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    secondary: {
      main: '#FACC15',
      dark: '#D4A015',
      light: '#FFE066',
    },
  },
};

export const ThemeContext = createContext<Theme>(defaultTheme);

export const useTheme = () => useContext(ThemeContext); 