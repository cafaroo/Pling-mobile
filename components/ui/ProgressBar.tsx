import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type ProgressBarProps = {
  progress: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
};

export default function ProgressBar({
  progress,
  height = 8,
  backgroundColor,
  progressColor,
}: ProgressBarProps) {
  const { colors } = useTheme();
  
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: backgroundColor || 'rgba(255, 255, 255, 0.1)',
        },
      ]}
    >
      <View
        style={[
          styles.progress,
          {
            width: `${clampedProgress}%`,
            backgroundColor: progressColor || colors.accent.yellow,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
  },
});