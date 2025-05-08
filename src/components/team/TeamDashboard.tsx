import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Text, Chip, Divider, useTheme, SegmentedButtons } from 'react-native-paper';
import { UniqueId } from '@/domain/core/UniqueId';
import { TeamActivityList } from './TeamActivityList';
import { TeamMemberList } from './TeamMemberList';
import { TeamStatisticsDashboard } from './TeamStatisticsDashboard';
import { useTeam } from '@/application/team/hooks/useTeam';
import { TeamChatContainer } from './TeamChatContainer';
import { Icon } from 'react-native-paper';

type DashboardTab = 'overview' | 'statistics' | 'activities' | 'members' | 'chat';

interface TeamDashboardProps {
  teamId: string;
}

export function TeamDashboard({ teamId }: TeamDashboardProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const { team, isLoading, error } = useTeam(teamId);
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View>
            {/* Översiktsinformation */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge">{team?.name || 'Laddar team...'}</Text>
                <Text variant="bodyMedium" style={styles.description}>
                  {team?.description || 'Ingen beskrivning tillgänglig'}
                </Text>
                
                <Divider style={styles.divider} />
                
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text variant="bodyLarge" style={styles.statValue}>
                      {team?.members.length || 0}
                    </Text>
                    <Text variant="bodySmall">Medlemmar</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text variant="bodyLarge" style={styles.statValue}>
                      {team?.settings?.goalCount || 0}
                    </Text>
                    <Text variant="bodySmall">Mål</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text variant="bodyLarge" style={styles.statValue}>
                      {team?.settings?.activityCount || 0}
                    </Text>
                    <Text variant="bodySmall">Aktiviteter</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
            
            {/* Senaste aktiviteter */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Senaste aktiviteter
            </Text>
            <TeamActivityList 
              teamId={teamId} 
              limit={5} 
              showViewAll={() => setActiveTab('activities')}
            />
            
            {/* Statistik */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Teamstatistik
            </Text>
            <TeamStatisticsDashboard teamId={teamId} />
          </View>
        );
        
      case 'statistics':
        return <TeamStatisticsDashboard teamId={teamId} fullView />;
        
      case 'activities':
        return <TeamActivityList teamId={teamId} />;
        
      case 'members':
        return <TeamMemberList teamId={teamId} />;
        
      case 'chat':
        return <TeamChatContainer teamId={teamId} />;
        
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text>Laddar team...</Text>
      </View>
    );
  }
  
  if (error || !team) {
    return (
      <View style={styles.error}>
        <Icon source="alert-circle" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>Kunde inte ladda team</Text>
        <Text>{error?.message || 'Okänt fel'}</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as DashboardTab)}
        buttons={[
          { value: 'overview', label: 'Översikt' },
          { value: 'statistics', label: 'Statistik' },
          { value: 'activities', label: 'Aktiviteter' },
          { value: 'chat', label: 'Chat' },
          { value: 'members', label: 'Medlemmar' }
        ]}
        style={styles.tabs}
      />
      
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </ScrollView>
  );
}

interface TeamHeaderProps {
  team: any; // Ersätt med korrekt typ från Team-domänen
}

function TeamHeader({ team }: TeamHeaderProps) {
  const theme = useTheme();
  
  return (
    <Card style={styles.headerCard}>
      <Card.Content>
        <Text variant="headlineMedium">{team.name}</Text>
        {team.description && (
          <Text variant="bodyMedium">{team.description}</Text>
        )}
        <View style={styles.teamMeta}>
          <Chip 
            icon="account-group" 
            style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
          >
            {team.members.length} medlemmar
          </Chip>
          <Chip 
            icon="eye" 
            style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
          >
            {team.settings.visibility}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );
}

function TeamOverview({ team }: TeamHeaderProps) {
  return (
    <>
      <Card style={styles.card}>
        <Card.Title title="Team-aktiviteter" />
        <Card.Content>
          <TeamActivityList teamId={team.id.toString()} limit={5} />
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Medlemmar" />
        <Card.Content>
          <TeamMemberList team={team} compact />
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Mål & Framsteg" />
        <Card.Content>
          <Text>Teamets mål kommer att visas här</Text>
        </Card.Content>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  teamMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
  },
  tabSelector: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  divider: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  tabs: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  description: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
}); 