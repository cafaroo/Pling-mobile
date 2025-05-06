import { StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export function useStyles() {
  const { colors } = useTheme();

  return StyleSheet.create({
    background: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent.yellow,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    card: {
      padding: 20,
      marginBottom: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 12,
    },
    title: {
      fontFamily: 'Inter-Bold',
      fontSize: 24,
      marginBottom: 12,
      color: colors.text.main,
    },
    subtitle: {
      fontFamily: 'Inter-Regular',
      fontSize: 16,
      color: colors.text.light,
      marginBottom: 24,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40,
    },
    loadingText: {
      fontFamily: 'Inter-Regular',
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40,
    },
    errorText: {
      fontFamily: 'Inter-Regular',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      minWidth: 120,
    },
    summaryCard: {
      padding: 20,
      marginBottom: 24,
    },
    summaryTitle: {
      fontFamily: 'Inter-Bold',
      fontSize: 18,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 16,
    },
    statItem: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    statValue: {
      fontFamily: 'Inter-Bold',
      fontSize: 24,
      marginVertical: 8,
    },
    statLabel: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
    },
    goalsContainer: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: 'Inter-Bold',
      fontSize: 20,
      marginBottom: 16,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    emptyIconContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontFamily: 'Inter-Bold',
      fontSize: 24,
      marginBottom: 12,
      textAlign: 'center',
    },
    emptyText: {
      fontFamily: 'Inter-Regular',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 32,
      maxWidth: 300,
    },
    createButton: {
      minWidth: 200,
    },
    // Lägg till fler gemensamma stilar här vid behov
  });
} 