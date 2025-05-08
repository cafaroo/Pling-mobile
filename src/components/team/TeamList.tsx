import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, Text, Icon } from 'react-native-paper';
import { useTeam } from '@/application/team/hooks/useTeam';
import { useAuth } from '@/application/auth/hooks/useAuth';
import { Team } from '@/domain/team/entities/Team';
import { useRouter } from 'expo-router';

export const TeamList: React.FC = () => {
  const { user } = useAuth();
  const { useUserTeams } = useTeam();
  const router = useRouter();
  
  const { data: teams, isLoading, error } = useUserTeams(user?.id);
  
  const handleCreateTeam = () => {
    router.push('/teams/create');
  };
  
  const handleTeamPress = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };
  
  const renderTeamItem = ({ item }: { item: Team }) => {
    const isOwner = item.ownerId.toString() === user?.id;
    const memberCount = item.members.length;
    
    return (
      <TouchableOpacity 
        onPress={() => handleTeamPress(item.id.toString())}
        testID={`team-item-${item.id.toString()}`}
      >
        <Card style={styles.teamCard}>
          <Card.Content>
            <View style={styles.teamHeader}>
              <Title>{item.name}</Title>
              {isOwner && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>Ägare</Text>
                </View>
              )}
            </View>
            
            {item.description && (
              <Paragraph style={styles.description} numberOfLines={2}>
                {item.description}
              </Paragraph>
            )}
            
            <View style={styles.teamInfo}>
              <View style={styles.infoItem}>
                <Icon source="account-group" size={16} color="#666" />
                <Text style={styles.infoText}>{memberCount} {memberCount === 1 ? 'medlem' : 'medlemmar'}</Text>
              </View>
              
              <Text style={styles.createdAt}>
                Skapad: {new Date(item.createdAt).toLocaleDateString('sv-SE')}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Ett fel uppstod: {error.message}</Text>
        <Button mode="contained" onPress={() => router.replace('/teams')}>
          Försök igen
        </Button>
      </View>
    );
  }
  
  if (!teams || teams.length === 0) {
    return (
      <View style={styles.centeredContainer} testID="empty-team-list">
        <Icon source="account-group" size={48} color="#6200ee" />
        <Text style={styles.emptyText}>Du har inga team ännu</Text>
        <Button 
          mode="contained" 
          onPress={handleCreateTeam} 
          style={styles.createButton}
          testID="create-team-button"
        >
          Skapa team
        </Button>
      </View>
    );
  }
  
  return (
    <View style={styles.container} testID="team-list">
      <FlatList
        data={teams}
        renderItem={renderTeamItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        testID="team-list-content"
      />
      
      <Button 
        mode="contained" 
        icon="plus" 
        onPress={handleCreateTeam} 
        style={styles.floatingButton}
        testID="add-team-button"
      >
        Nytt team
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for floating button
  },
  teamCard: {
    marginBottom: 16,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  teamInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
  createdAt: {
    color: '#666',
    fontSize: 12,
  },
  ownerBadge: {
    backgroundColor: '#6200ee',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ownerBadgeText: {
    color: 'white',
    fontSize: 12,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 28,
    elevation: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 16,
    textAlign: 'center',
  },
  createButton: {
    marginTop: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
}); 