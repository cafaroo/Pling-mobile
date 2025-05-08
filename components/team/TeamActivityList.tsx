import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';
import { ActivityType, ActivityCategories } from '@/domain/team/value-objects/ActivityType';
import { useTeamActivities } from '@/application/team/hooks/useTeamActivities';
import { UniqueId } from '@/shared/core/UniqueId';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface TeamActivityListProps {
  teamId: string;
  limit?: number;
  filterCategory?: keyof typeof ActivityCategories;
  onItemPress?: (activity: TeamActivity) => void;
}

/**
 * En komponent för att visa aktiviteter i ett team
 */
const TeamActivityList: React.FC<TeamActivityListProps> = ({
  teamId,
  limit = 10,
  filterCategory,
  onItemPress,
}) => {
  const theme = useTheme();
  const { activities, isLoading, isError, error } = useTeamActivities({
    teamId: new UniqueId(teamId),
    limit,
    activityTypes: filterCategory ? ActivityCategories[filterCategory] : undefined,
  });

  // Bestäm ikon baserat på aktivitetstyp
  const getIconForActivityType = (activityType: ActivityType): { name: string; color: string } => {
    switch (activityType) {
      case ActivityType.MEMBER_JOINED:
        return { name: 'user-plus', color: theme.colors.success };
      case ActivityType.MEMBER_LEFT:
        return { name: 'user-times', color: theme.colors.danger };
      case ActivityType.ROLE_CHANGED:
        return { name: 'id-badge', color: theme.colors.warning };
      case ActivityType.INVITATION_SENT:
        return { name: 'envelope', color: theme.colors.info };
      case ActivityType.INVITATION_ACCEPTED:
        return { name: 'check-circle', color: theme.colors.success };
      case ActivityType.INVITATION_DECLINED:
        return { name: 'times-circle', color: theme.colors.danger };
      case ActivityType.TEAM_CREATED:
        return { name: 'users', color: theme.colors.primary };
      case ActivityType.TEAM_UPDATED:
        return { name: 'pencil', color: theme.colors.secondary };
      case ActivityType.TEAM_SETTINGS_UPDATED:
        return { name: 'cog', color: theme.colors.secondary };
      case ActivityType.GOAL_CREATED:
        return { name: 'bullseye', color: theme.colors.primary };
      case ActivityType.GOAL_UPDATED:
        return { name: 'refresh', color: theme.colors.secondary };
      case ActivityType.GOAL_COMPLETED:
        return { name: 'trophy', color: theme.colors.success };
      case ActivityType.ACTIVITY_CREATED:
        return { name: 'calendar-plus-o', color: theme.colors.primary };
      case ActivityType.ACTIVITY_COMPLETED:
        return { name: 'calendar-check-o', color: theme.colors.success };
      case ActivityType.ACTIVITY_JOINED:
        return { name: 'handshake-o', color: theme.colors.info };
      case ActivityType.RESOURCE_ADDED:
        return { name: 'plus-square', color: theme.colors.primary };
      case ActivityType.RESOURCE_UPDATED:
        return { name: 'edit', color: theme.colors.secondary };
      case ActivityType.RESOURCE_REMOVED:
        return { name: 'minus-square', color: theme.colors.danger };
      case ActivityType.ANNOUNCEMENT_POSTED:
        return { name: 'bullhorn', color: theme.colors.warning };
      case ActivityType.MESSAGE_POSTED:
        return { name: 'comment', color: theme.colors.info };
      default:
        return { name: 'question-circle', color: theme.colors.medium };
    }
  };

  // Formatera datum relativt
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (diff < 60 * 1000) { // mindre än 1 minut
      return 'Just nu';
    } else if (diff < 60 * 60 * 1000) { // mindre än 1 timme
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} ${minutes === 1 ? 'minut' : 'minuter'} sedan`;
    } else if (diff < dayInMs) { // mindre än 1 dag
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} ${hours === 1 ? 'timme' : 'timmar'} sedan`;
    } else if (diff < 7 * dayInMs) { // mindre än 1 vecka
      const days = Math.floor(diff / dayInMs);
      return `${days} ${days === 1 ? 'dag' : 'dagar'} sedan`;
    } else {
      return format(date, 'd MMM yyyy', { locale: sv });
    }
  };

  // Rendrera en aktivitetsrad
  const renderActivityItem = ({ item }: { item: TeamActivity }) => {
    const { name, color } = getIconForActivityType(item.activityType);
    
    return (
      <TouchableOpacity
        style={styles.activityItem}
        onPress={() => onItemPress?.(item)}
        disabled={!onItemPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <FontAwesome name={name} size={18} color={color} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.activityText}>{item.getDescription()}</Text>
          <Text style={styles.timestampText}>{formatDate(item.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Rendrera skelettvyn för laddningstillstånd
  const renderSkeletonItem = ({ index }: { index: number }) => (
    <View style={styles.activityItem}>
      <View style={[styles.skeletonIcon, { opacity: 1 - index * 0.1 }]} />
      <View style={styles.contentContainer}>
        <View style={[styles.skeletonText, { width: `${85 - index * 5}%`, opacity: 1 - index * 0.1 }]} />
        <View style={[styles.skeletonTimestamp, { width: '30%', opacity: 1 - index * 0.1 }]} />
      </View>
    </View>
  );

  // Visa skelettvyn under laddning
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Teamaktiviteter</Text>
        <FlatList
          data={Array(5).fill(null).map((_, i) => i)}
          renderItem={renderSkeletonItem}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  // Visa felmeddelande
  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Teamaktiviteter</Text>
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={24} color={theme.colors.danger} />
          <Text style={styles.errorText}>Kunde inte ladda aktiviteter: {error}</Text>
          <TouchableOpacity>
            <Text style={styles.retryText}>Försök igen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Visa tomt tillstånd
  if (!activities || activities.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Teamaktiviteter</Text>
        <View style={styles.emptyContainer}>
          <FontAwesome name="history" size={24} color={theme.colors.medium} />
          <Text style={styles.emptyText}>Inga aktiviteter att visa</Text>
        </View>
      </View>
    );
  }

  // Visa aktivitetslistan
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Teamaktiviteter</Text>
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 8,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e1e1e1',
    marginRight: 12,
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e1e1e1',
    marginBottom: 8,
  },
  skeletonTimestamp: {
    height: 10,
    borderRadius: 4,
    backgroundColor: '#e1e1e1',
  },
});

export default TeamActivityList; 