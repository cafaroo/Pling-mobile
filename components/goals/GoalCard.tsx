import { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, Calendar, TrendingUp, Award, ChevronRight, User } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Goal } from '@/types';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import { format, differenceInDays } from 'date-fns';

interface GoalCardProps {
  goal: Goal;
  onPress?: (goalId: string) => void;
  style?: object;
}

export const GoalCard = memo(function GoalCard({ goal, onPress, style }: GoalCardProps) {
  const { colors } = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.primary.light;
      case 'completed':
        return colors.success;
      case 'failed':
        return colors.error;
      default:
        return colors.neutral[400];
    }
  };
  
  const formatTimeRemaining = () => {
    const endDate = new Date(goal.endDate);
    const now = new Date();
    
    if (endDate < now) {
      return 'Ended';
    }
    
    const daysRemaining = differenceInDays(endDate, now);
    return daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`;
  };
  
  const formatValue = (value: number) => {
    return goal.type === 'sales_amount'
      ? `${new Intl.NumberFormat('sv-SE').format(value)} kr`
      : new Intl.NumberFormat('sv-SE').format(value);
  };

  const handlePress = () => {
    onPress?.(goal.id);
  };

  return (
    <Card 
      style={[styles.container, style]}
      onPress={handlePress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text.main }]}>
            {goal.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(goal.status) }]}>
            <Text style={styles.statusText}>
              {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
            </Text>
          </View>
        </View>
        
        {goal.description && (
          <Text style={[styles.description, { color: colors.text.light }]}>
            {goal.description}
          </Text>
        )}
      </View>
      
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.text.light }]}>
            Progress
          </Text>
          <Text style={[styles.progressValue, { color: colors.accent.yellow }]}>
            {Math.round(goal.progress)}%
          </Text>
        </View>
        
        <ProgressBar 
          progress={goal.progress} 
          height={8}
          backgroundColor={colors.neutral[700]}
          progressColor={goal.status === 'completed' ? colors.success : colors.accent.yellow}
        />
        
        <View style={styles.valueContainer}>
          <Text style={[styles.currentValue, { color: colors.text.main }]}>
            {formatValue(goal.currentValue)}
          </Text>
          <Text style={[styles.targetValue, { color: colors.text.light }]}>
            of {formatValue(goal.targetValue)}
          </Text>
        </View>
      </View>
      
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Calendar size={16} color={colors.text.light} />
          <Text style={[styles.metaText, { color: colors.text.light }]}>
            {formatTimeRemaining()}
          </Text>
        </View>
        
        <View style={styles.metaItem}>
          <Target size={16} color={colors.text.light} />
          <Text style={[styles.metaText, { color: colors.text.light }]}>
            {goal.period.charAt(0).toUpperCase() + goal.period.slice(1)}ly goal
          </Text>
        </View>
        
        {goal.milestones && (
          <View style={styles.metaItem}>
            <Award size={16} color={colors.text.light} />
            <Text style={[styles.metaText, { color: colors.text.light }]}>
              {goal.completedMilestones || 0}/{goal.milestonesCount || 0} milestones
            </Text>
          </View>
        )}
        
        {goal.assigneeName && (
        <View style={styles.metaItem}>
          <User size={16} color={colors.text.light} />
          <Text style={[styles.metaText, { color: colors.text.light }]}>
            {goal.assigneeName}
          </Text>
        </View>
        )}
      </View>
      
      {onPress && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.detailsButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
            onPress={handlePress}
          >
            <Text style={[styles.detailsText, { color: colors.accent.yellow }]}>
              View Details
            </Text>
            <ChevronRight size={16} color={colors.accent.yellow} />
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}, (prevProps, nextProps) => prevProps.goal.id === nextProps.goal.id);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: 'white',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  progressValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  currentValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  targetValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginLeft: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  detailsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});