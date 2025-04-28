import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Text style={[styles.title, { color: colors.text.main }]}>
          Page Not Found
        </Text>
        <Text style={[styles.message, { color: colors.text.light }]}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Link href="/" style={[styles.link, { backgroundColor: colors.accent.yellow }]}>
          <Text style={[styles.linkText, { color: colors.background.dark }]}>
            Go to home screen
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Inter-Bold',
  },
  message: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 300,
    fontFamily: 'Inter-Regular',
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});