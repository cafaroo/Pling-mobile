import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = '#2563eb',
  backgroundColor = '#e2e8f0',
  style,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${Math.min(Math.max(progress, 0), 100)}%`,
      transform: [
        {
          translateX: withSpring(0, {
            damping: 15,
            stiffness: 100,
          }),
        },
      ],
      opacity: withTiming(1, { duration: 300 }),
    };
  }, [progress]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          { backgroundColor: color },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  progress: {
    height: '100%',
    borderRadius: 2,
  },
});