import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { CompetitionReward, CompetitionAchievement } from '@/types/competition';
import RewardCard from './RewardCard';

type RewardsListProps = {
  rewards: CompetitionReward[];
  achievements?: CompetitionAchievement[];
  style?: object;
};

export default function RewardsList({ rewards, achievements = [], style }: RewardsListProps) {
  const { colors } = useTheme();

  if (rewards.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={[styles.emptyText, { color: colors.text.light }]}>
          No rewards available for this competition
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {rewards.map((reward) => {
        const achievement = achievements.find(a => a.rewardId === reward.id);
        return (
          <RewardCard
            key={reward.id}
            reward={reward}
            progress={achievement?.progress || 0}
            completed={achievement?.completed || false}
            style={styles.rewardCard}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  rewardCard: {
    marginBottom: 12,
  },
});