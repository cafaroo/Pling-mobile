import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Card, Divider, List, Button, IconButton, Chip } from 'react-native-paper';
import { ErrorMessage } from '@/ui/shared/components/ErrorMessage';
import { EmptyState } from '@/ui/shared/components/EmptyState';
import { Team } from '@/domain/team/entities/Team';
import { TeamStatistics } from '@/domain/team/entities/TeamStatistics';
import { TeamActivity } from '@/domain/team/entities/TeamActivity';

export interface TeamDetailsScreenPresentationProps {
  // Data
  team?: Team;
  teamStatistics?: TeamStatistics;
  recentActivities?: TeamActivity[];
  
  // Tillstånd
  isLoading: boolean;
  isStatisticsLoading: boolean;
  isActivitiesLoading: boolean;
  error?: { message: string; retryable?: boolean };
  statisticsError?: { message: string; retryable?: boolean };
  activitiesError?: { message: string; retryable?: boolean };
  
  // Callbacks
  onRetry: () => void;
  onRetryStatistics: () => void;
  onRetryActivities: () => void;
  onEditDetails: () => void;
  onViewAllMembers: () => void;
  onViewAllActivities: () => void;
  onMemberPress: (memberId: string) => void;
  onSettingsPress: () => void;
}

export const TeamDetailsScreenPresentation: React.FC<TeamDetailsScreenPresentationProps> = ({
  team,
  teamStatistics,
  recentActivities,
  isLoading,
  isStatisticsLoading,
  isActivitiesLoading,
  error,
  statisticsError,
  activitiesError,
  onRetry,
  onRetryStatistics,
  onRetryActivities,
  onEditDetails,
  onViewAllMembers,
  onViewAllActivities,
  onMemberPress,
  onSettingsPress
}) => {
  // Visa laddningstillstånd
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Laddar teamdetaljer...</Text>
      </View>
    );
  }
  
  // Visa felmeddelande
  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage 
          message={error.message}
          onRetry={error.retryable ? onRetry : undefined}
        />
      </View>
    );
  }
  
  // Om data saknas
  if (!team) {
    return (
      <EmptyState
        title="Teamet hittades inte"
        message="Teamet du söker efter finns inte eller så har du inte behörighet att se det."
        icon="account-group"
      />
    );
  }
  
  // Visa teamdetaljer
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContainer}>
            <View style={styles.headerTextContainer}>
              <Text variant="headlineMedium">{team.name}</Text>
              {team.description && (
                <Text variant="bodyMedium" style={styles.description}>
                  {team.description}
                </Text>
              )}
              <View style={styles.metaContainer}>
                <Chip icon="calendar" style={styles.metaChip}>
                  Skapat: {new Date(team.createdAt).toLocaleDateString()}
                </Chip>
                <Chip icon="account-multiple" style={styles.metaChip}>
                  {team.members.length} medlemmar
                </Chip>
              </View>
            </View>
            <IconButton
              icon="cog"
              size={24}
              onPress={onSettingsPress}
              style={styles.settingsButton}
            />
          </View>
        </Card.Content>
        <Card.Actions>
          <Button onPress={onEditDetails}>Redigera detaljer</Button>
          <Button onPress={onViewAllMembers}>Visa alla medlemmar</Button>
        </Card.Actions>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Statistik" />
        <Card.Content>
          {isStatisticsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Laddar statistik...</Text>
            </View>
          ) : statisticsError ? (
            <ErrorMessage 
              message={statisticsError.message}
              onRetry={statisticsError.retryable ? onRetryStatistics : undefined}
            />
          ) : teamStatistics ? (
            <View style={styles.statisticsContainer}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">{teamStatistics.totalMessages}</Text>
                <Text variant="bodyMedium">Meddelanden</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">{teamStatistics.activeUsers}</Text>
                <Text variant="bodyMedium">Aktiva användare</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">{teamStatistics.completedTasks}</Text>
                <Text variant="bodyMedium">Slutförda uppgifter</Text>
              </View>
            </View>
          ) : (
            <Text>Ingen statistik tillgänglig</Text>
          )}
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title 
          title="Senaste aktiviteter" 
          right={(props) => (
            <Button onPress={onViewAllActivities}>Visa alla</Button>
          )}
        />
        <Card.Content>
          {isActivitiesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Laddar aktiviteter...</Text>
            </View>
          ) : activitiesError ? (
            <ErrorMessage 
              message={activitiesError.message}
              onRetry={activitiesError.retryable ? onRetryActivities : undefined}
            />
          ) : recentActivities && recentActivities.length > 0 ? (
            <View>
              {recentActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <List.Item
                    title={activity.title}
                    description={activity.description}
                    left={props => <List.Icon {...props} icon={getActivityIcon(activity.type)} />}
                    right={props => (
                      <Text style={styles.activityDate}>
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </Text>
                    )}
                  />
                  {index < recentActivities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <Text>Inga aktiviteter ännu</Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

// Hjälpfunktion för att få rätt ikon baserat på aktivitetstyp
const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'message':
      return 'message-text';
    case 'member_joined':
      return 'account-plus';
    case 'member_left':
      return 'account-minus';
    case 'role_changed':
      return 'account-key';
    case 'task_completed':
      return 'check-circle';
    default:
      return 'information';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  metaChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  settingsButton: {
    alignSelf: 'flex-start',
  },
  card: {
    marginBottom: 16,
  },
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    minWidth: '30%',
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'center',
  },
}); 