import { View, Text, StyleSheet } from 'react-native';
import { Award, CircleCheck as CheckCircle, Circle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { GoalMilestone } from '@/types';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';

type MilestonesListProps = {
  milestones: GoalMilestone[];
  currentValue: number;
  targetValue: number;
  style?: object;
};

export default function MilestonesList({ 
  milestones, 
  currentValue, 
  targetValue,
  style 
}: MilestonesListProps) {
  const { colors } = useTheme();

  // Sort milestones by target value
  const sortedMilestones = [...milestones].sort((a, b) => a.targetValue - b.targetValue);

  if (milestones.length === 0) {
    return (
      <Card style={[styles.emptyContainer, style]}>
        <Text style={[styles.emptyText, { color: colors.text.light }]}>
          No milestones set for this goal
        </Text>
      </Card>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: colors.text.main }]}>
        Milestones
      </Text>
      
      {sortedMilestones.map((milestone, index) => {
        const progress = (milestone.targetValue / targetValue) * 100;
        const isCurrent = !milestone.isCompleted && currentValue < milestone.targetValue;
        const isCompleted = milestone.isCompleted || currentValue >= milestone.targetValue;
        
        return (
          <Card key={milestone.id} style={[
            styles.milestoneCard,
            isCurrent && { borderColor: colors.accent.yellow, borderWidth: 2 }
          ]}>
            <View style={styles.milestoneHeader}>
              <View style={styles.milestoneInfo}>
                {isCompleted ? (
                  <CheckCircle size={24} color={colors.success} />
                ) : (
                  <Circle size={24} color={colors.neutral[400]} />
                )}
                <Text style={[styles.milestoneTitle, { color: colors.text.main }]}>
                  {milestone.title}
                </Text>
              </View>
              <Text style={[
                styles.milestoneValue, 
                { 
                  color: isCompleted ? colors.success : 
                         isCurrent ? colors.accent.yellow : 
                         colors.text.light 
                }
              ]}>
                {milestone.targetValue.toLocaleString()} 
                {milestone.targetValue / targetValue < 1 && 
                  ` (${Math.round((milestone.targetValue / targetValue) * 100)}%)`
                }
              </Text>
            </View>
            
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={progress}
                height={6}
                backgroundColor={colors.neutral[700]}
                progressColor={isCompleted ? colors.success : colors.primary.light}
              />
            </View>
            
            {milestone.reward && (
              <View style={styles.rewardContainer}>
                <Award size={16} color={colors.accent.yellow} />
                <Text style={[styles.rewardText, { color: colors.text.light }]}>
                  Reward: {milestone.reward}
                </Text>
              </View>
            )}
            
            {isCompleted && milestone.completedAt && (
              <Text style={[styles.completedText, { color: colors.text.light }]}>
                Completed on {new Date(milestone.completedAt).toLocaleDateString()}
              </Text>
            )}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 8,
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
  milestoneCard: {
    padding: 16,
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  milestoneValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  rewardText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  completedText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'right',
  },
});