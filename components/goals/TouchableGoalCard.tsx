import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { Goal } from '@/types/goal';
import { GoalCard } from './GoalCard';

interface TouchableGoalCardProps {
  goal: Goal;
  onPress?: (goal: Goal) => void;
  onSwipeComplete?: (goal: Goal) => void;
  style?: any;
}

export const TouchableGoalCard: React.FC<TouchableGoalCardProps> = ({
  goal,
  onPress,
  onSwipeComplete,
  style
}) => {
  const translateX = useSharedValue(0);
  const cardScale = useSharedValue(1);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(goal);
  }, [goal, onPress]);

  const handleSwipeComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSwipeComplete?.(goal);
  }, [goal, onSwipeComplete]);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(Haptics.selectionAsync)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      if (Math.abs(event.translationX) > 50) {
        cardScale.value = withSpring(0.95);
      }
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > 100) {
        runOnJS(handleSwipeComplete)();
      }
      translateX.value = withSpring(0);
      cardScale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: cardScale.value }
    ]
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, style, animatedStyle]}>
        <GoalCard 
          goal={goal} 
          onPress={handlePress}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  }
}); 