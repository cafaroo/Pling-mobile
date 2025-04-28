import { ReactNode } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type ContainerProps = {
  children: ReactNode;
  style?: object;
};

export default function Container({ children, style }: ContainerProps) {
  const { colors } = useTheme();
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.dark }]}>
      <View style={[styles.container, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    width: '100%',
  },
});