import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { Team, TeamRole } from '@/types/team';
import { Users, Settings, UserPlus, Bell, Shield, MessageCircle, Target, BarChart, Activity } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import TeamActivityList from './TeamActivityList';
import TeamStatisticsCard from './TeamStatisticsCard';
import { ActivityCategories } from '@/domain/team/value-objects/ActivityType';
import { TeamChatContainer } from './TeamChatContainer';

interface TeamDashboardProps {
  team: Team;
  userRole: TeamRole;
  onManageSettings?: () => void;
  onManageInvites?: () => void;
  onManageNotifications?: () => void;
  onManageChat?: () => void;
}

type DashboardTab = 'overview' | 'activities' | 'statistics' | 'chat';

export const TeamDashboard: React.FC<TeamDashboardProps> = ({
  team,
  userRole,
  onManageSettings,
  onManageInvites,
  onManageNotifications,
  onManageChat,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [activityFilter, setActivityFilter] = useState<keyof typeof ActivityCategories | undefined>(undefined);

  // Beräkna antalet aktiva medlemmar
  const activeMembers = team.team_members?.filter(member => member.status === 'active').length || 0;

  const handleManageMembers = () => {
    router.push(`/team/members?teamId=${team.id}`);
  };

  const handleTeamGoals = () => {
    router.push(`/team/goals?teamId=${team.id}`);
  };

  const handleViewActivities = () => {
    setActiveTab('activities');
  };

  const handleSwitchToChat = () => {
    setActiveTab('chat');
  };

  // Funktion för att filtrera aktiviteter efter kategori
  const handleFilterActivities = (category: keyof typeof ActivityCategories) => {
    setActivityFilter(prevFilter => prevFilter === category ? undefined : category);
  };

  const renderTabButtons = () => {
    return (
      <View style={styles.tabButtons}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'overview' && { color: colors.primary }]}>
            Översikt
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'activities' && styles.activeTabButton]}
          onPress={() => setActiveTab('activities')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'activities' && { color: colors.primary }]}>
            Aktiviteter
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'statistics' && styles.activeTabButton]}
          onPress={() => setActiveTab('statistics')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'statistics' && { color: colors.primary }]}>
            Statistik
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'chat' && styles.activeTabButton]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'chat' && { color: colors.primary }]}>
            Chatt
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCard = (
    icon: React.ReactElement,
    title: string,
    description: string,
    onPress?: () => void,
    highlight?: boolean
  ) => {
    const IconComponent = React.cloneElement(icon, {
      size: 24,
      color: highlight ? colors.accent.yellow : colors.text.main,
      style: styles.cardIcon,
    });

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={onPress}
        disabled={!onPress}
      >
        <BlurView intensity={20} style={styles.cardBlur}>
          <View style={styles.cardContent}>
            {IconComponent}
            <Text style={[styles.cardTitle, { color: colors.text.main }]}>
              {title}
            </Text>
            <Text style={[styles.cardDescription, { color: colors.text.light }]}>
              {description}
            </Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderFilterChips = () => {
    const categories: Array<{ key: keyof typeof ActivityCategories; label: string }> = [
      { key: 'MEMBER', label: 'Medlemmar' },
      { key: 'INVITATION', label: 'Inbjudningar' },
      { key: 'TEAM', label: 'Team' },
      { key: 'GOAL', label: 'Mål' },
      { key: 'COMMUNICATION', label: 'Kommunikation' }
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.filterChip,
              activityFilter === cat.key && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => handleFilterActivities(cat.key)}
          >
            <Text 
              style={[
                styles.filterText, 
                activityFilter === cat.key && { color: colors.primary }
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Rendererar olika innehåll baserat på aktiv flik
  const renderContent = () => {
    switch (activeTab) {
      case 'activities':
        return (
          <View style={styles.tabContent}>
            {renderFilterChips()}
            <TeamActivityList 
              teamId={team.id} 
              limit={20}
              filterCategory={activityFilter}
            />
          </View>
        );
      
      case 'statistics':
        return (
          <View style={styles.tabContent}>
            <TeamStatisticsCard teamId={team.id} />
          </View>
        );
      
      case 'chat':
        return (
          <View style={styles.tabContent}>
            <TeamChatContainer teamId={team.id} />
          </View>
        );
      
      case 'overview':
      default:
        return (
          <ScrollView style={styles.scrollContainer}>
            {/* Statistikkort */}
            <TeamStatisticsCard teamId={team.id} />
            
            <View style={styles.container}>
              {/* Aktivitetskort */}
              {renderCard(
                <Activity />,
                'Aktiviteter',
                'Se senaste teamaktiviteter',
                handleViewActivities,
                true
              )}

              {/* Medlemskort */}
              {renderCard(
                <Users />,
                'Medlemmar',
                `${activeMembers} ${activeMembers === 1 ? 'aktiv medlem' : 'aktiva medlemmar'}`,
                handleManageMembers
              )}

              {/* Chatkort */}
              {renderCard(
                <MessageCircle />,
                'Team Chat',
                'Chatta med ditt team',
                handleSwitchToChat,
                true
              )}

              {/* Team mål-kort */}
              {renderCard(
                <Target />,
                'Teammål',
                'Sätt och följ upp mål',
                handleTeamGoals,
                true
              )}

              {/* Inställningskort (endast för ägare/admin) */}
              {isOwnerOrAdmin && renderCard(
                <Settings />,
                'Inställningar',
                'Hantera teamets inställningar',
                onManageSettings
              )}

              {/* Inbjudningskort (endast för ägare/admin) */}
              {isOwnerOrAdmin && renderCard(
                <UserPlus />,
                'Bjud in',
                'Bjud in nya medlemmar',
                onManageInvites,
                true
              )}

              {/* Notifikationskort */}
              {renderCard(
                <Bell />,
                'Notifikationer',
                'Hantera teamnotifikationer',
                onManageNotifications
              )}

              {/* Rollkort */}
              {renderCard(
                <Shield />,
                'Din roll',
                getRoleDescription(userRole)
              )}
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <View style={styles.mainContainer}>
      {renderTabButtons()}
      {renderContent()}
    </View>
  );
};

const getRoleDescription = (role: TeamRole): string => {
  switch (role) {
    case 'owner':
      return 'Du är ägare av detta team';
    case 'admin':
      return 'Du är administratör i detta team';
    case 'moderator':
      return 'Du är moderator i detta team';
    default:
      return 'Du är medlem i detta team';
  }
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  tabButtons: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'white',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#5B21B6',
  },
  tabButtonText: {
    fontWeight: '500',
    color: '#666',
  },
  tabContent: {
    flex: 1,
  },
  activityContainer: {
    flex: 1,
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  cardContainer: {
    width: '48%',
    height: 120,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardBlur: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
  },
  filterContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterText: {
    fontSize: 14,
  },
}); 