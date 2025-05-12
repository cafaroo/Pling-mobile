import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useOrganization } from './OrganizationProvider';
import { useNavigation } from '@react-navigation/native';

interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: Date;
}

interface OrganizationTeamListProps {
  organizationId: string;
  onTeamSelect?: (teamId: string) => void;
  showCreateButton?: boolean;
  onCreatePress?: () => void;
}

export const OrganizationTeamList: React.FC<OrganizationTeamListProps> = ({
  organizationId,
  onTeamSelect,
  showCreateButton = true,
  onCreatePress
}) => {
  const { currentOrganization } = useOrganization();
  const navigation = useNavigation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizationTeams();
  }, [organizationId]);

  const fetchOrganizationTeams = async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      // Här skulle vi anropa ett faktiskt API för att hämta teamen
      // Till exempel: const result = await teamRepository.findByOrganizationId(organizationId);
      
      // För demonstrationssyfte använder vi dummy-data
      const dummyTeams: Team[] = [
        {
          id: '1',
          name: 'Utvecklingsteam',
          description: 'Teamet för produktutveckling',
          memberCount: 5,
          createdAt: new Date('2023-01-15')
        },
        {
          id: '2',
          name: 'Marknadsföringsteam',
          description: 'Teamet för marknadsföring',
          memberCount: 3,
          createdAt: new Date('2023-02-20')
        },
        {
          id: '3',
          name: 'Supportteam',
          description: 'Kundtjänst och support',
          memberCount: 4,
          createdAt: new Date('2023-03-10')
        }
      ];
      
      // Simulera en nätverksfördröjning
      setTimeout(() => {
        setTeams(dummyTeams);
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      console.error('Fel vid hämtning av team:', err);
      setError('Kunde inte hämta organisationens team');
      setLoading(false);
    }
  };

  const handleTeamPress = (teamId: string) => {
    if (onTeamSelect) {
      onTeamSelect(teamId);
    } else {
      // Navigera till team-detaljsida om ingen callback tillhandahålls
      // @ts-ignore - Detta beror på navigation-typen som kan variera
      navigation.navigate('TeamDetails', { teamId });
    }
  };

  const handleCreateTeam = () => {
    if (onCreatePress) {
      onCreatePress();
    } else {
      // Navigera till skärmen för att skapa team om ingen callback tillhandahålls
      // @ts-ignore - Detta beror på navigation-typen som kan variera
      navigation.navigate('CreateTeam', { organizationId });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Laddar team...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrganizationTeams}>
          <Text style={styles.retryButtonText}>Försök igen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (teams.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Inga team hittades för denna organisation</Text>
        {showCreateButton && (
          <TouchableOpacity style={styles.createButton} onPress={handleCreateTeam}>
            <Text style={styles.createButtonText}>Skapa nytt team</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team</Text>
        {showCreateButton && (
          <TouchableOpacity style={styles.createButton} onPress={handleCreateTeam}>
            <Text style={styles.createButtonText}>Skapa nytt team</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.teamItem}
            onPress={() => handleTeamPress(item.id)}
          >
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.teamDescription}>{item.description}</Text>
              )}
              <Text style={styles.teamMeta}>
                {item.memberCount} {item.memberCount === 1 ? 'medlem' : 'medlemmar'} • 
                Skapat {item.createdAt.toLocaleDateString('sv-SE')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  teamItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  teamMeta: {
    fontSize: 12,
    color: '#999999',
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#E6E6E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
  },
}); 