import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Text, Button, Card, Title, Paragraph, IconButton, Divider } from 'react-native-paper';
import { useTeam } from '@/application/team/hooks/useTeam';
import { useAuth } from '@/application/auth/hooks/useAuth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TeamMemberList } from '@/components/team/TeamMemberList';
import { TeamInvite } from '@/components/team/TeamInvite';
import { TeamPermission } from '@/domain/team/value-objects/TeamPermission';

export default function TeamDetailsScreen() {
  const params = useLocalSearchParams();
  const teamId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  
  const { useTeamById, useDeleteTeam } = useTeam();
  const { data: team, isLoading, error, refetch } = useTeamById(teamId);
  const deleteTeam = useDeleteTeam();
  
  const isOwner = team?.ownerId.toString() === user?.id;

  const handleDeleteTeam = () => {
    if (!user || !team) return;
    
    Alert.alert(
      'Ta bort team',
      'Är du säker på att du vill ta bort detta team? Denna åtgärd kan inte ångras.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTeam.mutateAsync({
                teamId: team.id.toString(),
                userId: user.id
              });
              
              router.replace('/teams');
            } catch (error) {
              Alert.alert('Fel', error.message);
            }
          }
        }
      ]
    );
  };
  
  const handleEditTeam = () => {
    router.push(`/teams/edit/${teamId}`);
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }
  
  if (error || !team) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          {error ? `Ett fel uppstod: ${error.message}` : 'Teamet hittades inte'}
        </Text>
        <Button 
          mode="contained" 
          onPress={() => router.back()}
          style={styles.button}
        >
          Gå tillbaka
        </Button>
      </View>
    );
  }
  
  const userMember = team.members.find(m => m.userId.toString() === user?.id);
  const canEdit = user && team.hasMemberPermission(userMember?.userId, TeamPermission.EDIT_TEAM);
  
  return (
    <ScrollView style={styles.container} testID="team-details-screen">
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Title style={styles.title}>{team.name}</Title>
            
            {canEdit && (
              <IconButton
                icon="pencil"
                size={20}
                onPress={handleEditTeam}
                testID="edit-team-button"
              />
            )}
          </View>
          
          {team.description && (
            <Paragraph style={styles.description}>
              {team.description}
            </Paragraph>
          )}
          
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>
              Skapad: {new Date(team.createdAt).toLocaleDateString('sv-SE')}
            </Text>
            <Text style={styles.metaText}>
              Medlemmar: {team.members.length}
            </Text>
          </View>
        </Card.Content>
      </Card>
      
      <TeamInvite team={team} onInviteSent={refetch} />
      
      <TeamMemberList team={team} onRoleChange={refetch} />
      
      {isOwner && (
        <Card style={[styles.card, styles.dangerCard]}>
          <Card.Content>
            <Title style={styles.dangerTitle}>Farlig zon</Title>
            <Divider style={styles.divider} />
            <Text style={styles.dangerText}>
              Om du tar bort teamet kommer all data relaterad till teamet att försvinna permanent.
            </Text>
            <Button
              mode="contained"
              color="#d32f2f"
              onPress={handleDeleteTeam}
              loading={deleteTeam.isPending}
              style={styles.dangerButton}
              testID="delete-team-button"
            >
              Ta bort team
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  description: {
    marginVertical: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  dangerCard: {
    marginTop: 16,
    borderColor: '#d32f2f',
    borderWidth: 1,
  },
  dangerTitle: {
    color: '#d32f2f',
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#d32f2f',
  },
  dangerText: {
    marginVertical: 8,
    color: '#666',
  },
  dangerButton: {
    marginTop: 16,
  },
  button: {
    marginTop: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
}); 