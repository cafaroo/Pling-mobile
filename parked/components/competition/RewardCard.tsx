import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Medal, Award, Star } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { CompetitionReward } from '@/types/competition';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';

type RewardCardProps = {
  reward: CompetitionReward;
  progress?: number;
  completed?: boolean;
  style?: object;
};

export default function RewardCard({ reward, progress = 0, completed = false, style }: RewardCardProps) {
  const { colors } = useTheme();

  const getIcon = () => {
    switch (reward.type) {
      case 'milestone':
        return Trophy;
      case 'rank':
        return Medal;
      case 'completion':
        return Star;
      default:
        return Award;
    }
  };

  const Icon = getIcon();

  const getConditionText = () => {
    switch (reward.conditionType) {
      case 'value':
        return `Reach ${new Intl.NumberFormat('sv-SE').format(reward.conditionValue)} kr`;
      case 'percentage':
        return `Complete ${reward.conditionValue}% of target`;
      case 'rank':
        return `Reach rank #${reward.conditionValue}`;
      default:
        return '';
    }
  };

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary.light }]}>
          <Icon color={colors.accent.yellow} size={24} />
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text.main }]}>
            {reward.title}
          </Text>
          {reward.description && (
            <Text style={[styles.description, { color: colors.text.light }]}>
              {reward.description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressText, { color: colors.text.light }]}>
            Progress: {Math.round(progress)}%
          </Text>
          {completed && (
            <Text style={[styles.completedText, { color: colors.accent.yellow }]}>
              Completed!
            </Text>
          )}
        </View>
        <ProgressBar 
          progress={progress}
          height={6}
          backgroundColor={colors.neutral[700]}
          progressColor={completed ? colors.accent.yellow : colors.primary.light}
        />
      </View>

      <Text style={[styles.condition, { color: colors.text.light }]}>
        {getConditionText()}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 2,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  completedText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  condition: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 8,
  },
});