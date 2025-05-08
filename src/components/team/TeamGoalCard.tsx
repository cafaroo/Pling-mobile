import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { TeamGoal, GoalStatus } from '@/domain/team/entities/TeamGoal';
import { Text } from '@/components/Text';
import { ProgressBar } from '@/components/ProgressBar';
import { Avatar } from '@/components/Avatar';
import { useTheme } from '@/hooks/useTheme';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface TeamGoalCardProps {
  goal: TeamGoal;
  onPress?: () => void;
  style?: ViewStyle;
}

export function TeamGoalCard({ goal, onPress, style }: TeamGoalCardProps) {
  const theme = useTheme();

  const statusColors = {
    [GoalStatus.NOT_STARTED]: theme.colors.gray,
    [GoalStatus.IN_PROGRESS]: theme.colors.primary,
    [GoalStatus.COMPLETED]: theme.colors.success,
    [GoalStatus.DELAYED]: theme.colors.warning,
    [GoalStatus.CANCELLED]: theme.colors.error,
  };

  const statusText = {
    [GoalStatus.NOT_STARTED]: 'Ej påbörjat',
    [GoalStatus.IN_PROGRESS]: 'Pågående',
    [GoalStatus.COMPLETED]: 'Slutfört',
    [GoalStatus.DELAYED]: 'Försenat',
    [GoalStatus.CANCELLED]: 'Avbrutet',
  };

  const isOverdue = goal.dueDate && new Date() > goal.dueDate && goal.status !== GoalStatus.COMPLETED;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {goal.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[goal.status] }]}>
          <Text style={styles.statusText}>{statusText[goal.status]}</Text>
        </View>
      </View>

      {goal.description && (
        <Text style={styles.description} numberOfLines={2}>
          {goal.description}
        </Text>
      )}

      <View style={styles.progressContainer}>
        <ProgressBar
          progress={goal.progress}
          color={statusColors[goal.status]}
          style={styles.progressBar}
        />
        <Text style={styles.progressText}>{`${Math.round(goal.progress)}%`}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dates}>
          <Text style={styles.dateText}>
            Startdatum: {format(goal.startDate, 'd MMM yyyy', { locale: sv })}
          </Text>
          {goal.dueDate && (
            <Text style={[styles.dateText, isOverdue && styles.overdueText]}>
              Slutdatum: {format(goal.dueDate, 'd MMM yyyy', { locale: sv })}
            </Text>
          )}
        </View>

        {goal.assignments.length > 0 && (
          <View style={styles.assignees}>
            {goal.assignments.slice(0, 3).map((assignment, index) => (
              <View key={assignment.userId.toString()} style={styles.avatarContainer}>
                <Avatar
                  userId={assignment.userId}
                  size={24}
                  style={[
                    styles.avatar,
                    index > 0 && { marginLeft: -12 }
                  ]}
                />
              </View>
            ))}
            {goal.assignments.length > 3 && (
              <View style={[styles.avatarContainer, styles.moreAssignees]}>
                <Text style={styles.moreAssigneesText}>
                  +{goal.assignments.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    marginRight: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 40,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dates: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  overdueText: {
    color: '#dc3545',
  },
  assignees: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreAssignees: {
    width: 24,
    height: 24,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  moreAssigneesText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
}); 