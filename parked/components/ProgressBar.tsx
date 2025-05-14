import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number; // Värde mellan 0 och 1
  color?: string;
  backgroundColor?: string;
  style?: any;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  color = '#7C3AED', 
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  style 
}) => {
  // Animera progress-bredd
  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${Math.min(100, progress * 100)}%`,
      backgroundColor: color,
    };
  });

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor }, 
        style
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          progressAnimatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
});

export default ProgressBar; 