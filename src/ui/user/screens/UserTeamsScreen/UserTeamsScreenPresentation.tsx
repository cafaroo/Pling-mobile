import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Card, Text, Button, ActivityIndicator, useTheme, Divider } from 'react-native-paper';
import { Screen } from '@/ui/components/Screen';
import { ErrorMessage } from '@/ui/shared/components/ErrorMessage';
import { EmptyState } from '@/ui/shared/components/EmptyState';

export interface TeamItem {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  userRole: string;
  avatarUrl?: string;
}

export interface UserTeamsScreenPresentationProps {
  // Data
  teams: TeamItem[];
  
  // Tillstånd
  isLoading: boolean;
  error?: Error | null;
  
  // Callbacks
  onTeamPress: (teamId: string) => void;
  onCreateTeamPress: () => void;
  onBack: () => void;
}

export const UserTeamsScreenPresentation: React.FC<UserTeamsScreenPresentationProps> = ({
  teams,
  isLoading,
  error,
  onTeamPress,
  onCreateTeamPress,
  onBack,
}) => {
  const { colors } = useTheme();
  
  const renderTeamCard = ({ item }: { item: TeamItem }) => (
    <Card 
      style={styles.card} 
      onPress={() => onTeamPress(item.id)}
    >
      <Card.Content>
        <Text variant="titleMedium" style={styles.teamName}>{item.name}</Text>
        {item.description && (
          <Text variant="bodyMedium" numberOfLines={2} style={styles.description}>
            {item.description}
          </Text>
        )}
        <View style={styles.metaContainer}>
          <Text variant="bodySmall" style={styles.memberCount}>
            {item.memberCount} {item.memberCount === 1 ? 'medlem' : 'medlemmar'}
          </Text>
          <Text variant="bodySmall" style={[styles.role, { color: colors.primary }]}>
            {item.userRole}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Laddar team...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <ErrorMessage 
          message="Kunde inte ladda team" 
          description={error.message}
        />
      );
    }
    
    if (teams.length === 0) {
      return (
        <EmptyState
          title="Inga team än"
          description="Du är inte medlem i något team. Skapa ett nytt team eller be om en inbjudan."
          actionLabel="Skapa team"
          onAction={onCreateTeamPress}
        />
      );
    }
    
    return (
      <FlatList
        data={teams}
        renderItem={renderTeamCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  };
  
  return (
    <Screen>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Mina team" />
        {teams.length > 0 && (
          <Appbar.Action 
            icon="plus" 
            onPress={onCreateTeamPress} 
            disabled={isLoading}
          />
        )}
      </Appbar.Header>
      
      <View style={styles.container}>
        {renderContent()}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    marginBottom: 8,
  },
  teamName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  memberCount: {
    opacity: 0.7,
  },
  role: {
    fontWeight: 'bold',
  },
  separator: {
    height: 8,
  },
}); 