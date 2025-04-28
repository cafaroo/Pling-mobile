import { createContext, useContext, ReactNode } from 'react';

// Define the theme colors
const colors = {
  primary: {
    main: '#5B21B6',
    light: '#7C3AED',
    dark: '#4C1D95',
  },
  background: {
    main: '#1E1B4B',
    light: '#312E81',
    dark: '#0F0E2A',
  },
  accent: {
    yellow: '#FACC15',
    pink: '#EC4899',
  },
  success: '#10B981',
  error: '#EF4444',
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
  text: {
    main: '#FFFFFF',
    light: 'rgba(255, 255, 255, 0.7)',
    dark: '#1F2937',
  },
};

// Define the theme context type
type ThemeContextType = {
  colors: typeof colors;
};

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Create the theme provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = {
    colors,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// Create a hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}