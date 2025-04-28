import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';

type UsageStatsProps = {
  feature: string;
  used: number;
  limit: number;
  style?: object;
};

export default function UsageStats({ feature, used, limit, style }: UsageStatsProps) {
  const { colors } = useTheme();
  const percentage = limit === -1 ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.feature, { color: colors.text.main }]}>
          {feature.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </Text>
        <Text style={[
          styles.usage,
          { color: isNearLimit ? colors.error : colors.text.light }
        ]}>
          {used} / {limit === -1 ? '∞' : limit}
        </Text>
      </View>

      <ProgressBar
        progress={percentage}
        height={4}
        backgroundColor={colors.neutral[700]}
        progressColor={isNearLimit ? colors.error : colors.accent.yellow}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feature: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  usage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});