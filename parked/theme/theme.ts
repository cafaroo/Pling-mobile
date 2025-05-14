export const theme = {
  colors: {
    primary: {
      main: '#3B82F6',
      dark: '#2563EB',
      light: '#60A5FA',
    },
    accent: {
      yellow: '#FBBF24',
      pink: '#EC4899',
    },
    background: {
      main: '#1F2937',
      dark: '#111827',
    },
    text: {
      main: '#F9FAFB',
      light: '#9CA3AF',
    },
    neutral: {
      500: '#6B7280',
      700: '#374151',
    },
    success: '#10B981',
    error: '#EF4444',
    secondary: {
      main: '#FACC15',
      dark: '#D4A015',
      light: '#FFE066',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  typography: {
    h1: {
      fontFamily: 'Inter-Bold',
      fontSize: 28,
    },
    h2: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 24,
    },
    body: {
      fontFamily: 'Inter-Regular',
      fontSize: 16,
    },
    caption: {
      fontFamily: 'Inter-Medium',
      fontSize: 12,
    },
  },
} as const;

export type Theme = typeof theme; 