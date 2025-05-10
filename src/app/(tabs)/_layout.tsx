import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Slot />
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1B4B',
  },
}); 