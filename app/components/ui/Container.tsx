import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ContainerProps {
  children: React.ReactNode;
  style?: any;
}

export default function Container({ children, style }: ContainerProps) {
  const { colors } = useTheme();
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.background.main },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 