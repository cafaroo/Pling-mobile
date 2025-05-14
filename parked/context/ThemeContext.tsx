import React, { createContext, useContext } from 'react';

interface ThemeColors {
  background: {
    dark: string;
    main: string;
    light: string;
    card: string;
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
  border: {
    subtle: string;
    default: string;
    strong: string;
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
}

interface ThemeShadows {
  small: {
    shadowColor: string;
    shadowOffset: {
      width: number;
      height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
  };
  medium: {
    shadowColor: string;
    shadowOffset: {
      width: number;
      height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
  };
  large: {
    shadowColor: string;
    shadowOffset: {
      width: number;
      height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
  };
}

interface ThemeContextType {
  colors: ThemeColors;
  shadows: ThemeShadows;
}

const defaultShadows: ThemeShadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
};

const defaultTheme: ThemeColors = {
  background: {
    dark: '#0F0E2A',   // Primary app background
    main: '#1E1B4B',   // Secondary background
    light: '#312E81',  // Tertiary background
    card: 'rgba(0, 0, 0, 0.2)', // Card background
  },
  primary: {
    dark: '#4C1D95',   // Dark purple
    main: '#5B21B6',   // Main purple
    light: '#7C3AED',  // Light purple
  },
  accent: {
    yellow: '#FACC15', // Primary accent
    pink: '#EC4899',   // Secondary accent
  },
  text: {
    main: '#FFFFFF',   // Primary text on dark backgrounds
    light: 'rgba(255, 255, 255, 0.7)', // Secondary text
    dark: '#1F2937',   // Text on light backgrounds
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.1)',  // Subtle borders
    default: 'rgba(255, 255, 255, 0.2)',  // Default borders
    strong: 'rgba(255, 255, 255, 0.3)',   // Strong borders
  },
  error: '#EF4444',    // Error red
  success: '#10B981',  // Success green
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
    main: '#FACC15', // Accent yellow
    dark: '#D4A015',
    light: '#FFE066',
  },
};

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultTheme,
  shadows: defaultShadows,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ colors: defaultTheme, shadows: defaultShadows }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}