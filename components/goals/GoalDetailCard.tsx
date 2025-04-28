import { View, Text, StyleSheet } from 'react-native';
import { Target, Calendar, Award, Clock, User, Users } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Goal, GoalMilestone } from '@/types';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import { format, differenceInDays } from 'date-fns';

type GoalDetailCardProps = {
  goal: Goal;
  style?: object;
};

export default function GoalDetailCard({ goal, style }: GoalDetailCardProps) {
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

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
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
          <Text style={[styles.progressLabel, { color: colors.text.main }]}>
            Progress
          </Text>
          <Text style={[styles.progressValue, { color: colors.accent.yellow }]}>
            {Math.round(goal.progress)}%
          </Text>
        </View>
        
        <ProgressBar 
          progress={goal.progress} 
          height={10}
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
      
      <View style={styles.detailsGrid}>
        <View style={[styles.detailItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
          <Calendar size={20} color={colors.accent.yellow} />
          <Text style={[styles.detailLabel, { color: colors.text.light }]}>
            Period
          </Text>
          <Text style={[styles.detailValue, { color: colors.text.main }]}>
            {goal.period.charAt(0).toUpperCase() + goal.period.slice(1)}
          </Text>
        </View>
        
        <View style={[styles.detailItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
          <Clock size={20} color={colors.accent.yellow} />
          <Text style={[styles.detailLabel, { color: colors.text.light }]}>
            Time Left
          </Text>
          <Text style={[styles.detailValue, { color: colors.text.main }]}>
            {formatTimeRemaining()}
          </Text>
        </View>
        
        <View style={[styles.detailItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
          <Target size={20} color={colors.accent.yellow} />
          <Text style={[styles.detailLabel, { color: colors.text.light }]}>
            Type
          </Text>
          <Text style={[styles.detailValue, { color: colors.text.main }]}>
            {goal.type === 'sales_amount' ? 'Sales Amount' : 'Sales Count'}
          </Text>
        </View>
        
        <View style={[styles.detailItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
          <User size={20} color={colors.accent.yellow} />
          <Text style={[styles.detailLabel, { color: colors.text.light }]}>
            Created By
          </Text>
          <Text style={[styles.detailValue, { color: colors.text.main }]}>
            {goal.createdByName || 'You'}
          </Text>
        </View>
        
        {goal.assigneeId && goal.assigneeName && (
        <View style={[styles.detailItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
          <Users size={20} color={colors.accent.yellow} />
          <Text style={[styles.detailLabel, { color: colors.text.light }]}>
            Assigned To
          </Text>
          <Text style={[styles.detailValue, { color: colors.text.main }]}>
            {goal.assigneeName}
          </Text>
        </View>
        )}
      </View>
      
      <View style={styles.dateSection}>
        <View style={styles.dateItem}>
          <Text style={[styles.dateLabel, { color: colors.text.light }]}>
            Start Date
          </Text>
          <Text style={[styles.dateValue, { color: colors.text.main }]}>
            {format(new Date(goal.startDate), 'MMM d, yyyy')}
          </Text>
        </View>
        
        <View style={styles.dateItem}>
          <Text style={[styles.dateLabel, { color: colors.text.light }]}>
            End Date
          </Text>
          <Text style={[styles.dateValue, { color: colors.text.main }]}>
            {format(new Date(goal.endDate), 'MMM d, yyyy')}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  statusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: 'white',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  progressValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  currentValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  targetValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginLeft: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 8,
  },
  detailValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginTop: 4,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  dateItem: {
    alignItems: 'center',
  },
  dateLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  dateValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});