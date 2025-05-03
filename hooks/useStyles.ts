import { StyleSheet } from 'react-native';
import { useTheme } from '../constants';

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
    // Lägg till fler gemensamma stilar här vid behov
  });
} 