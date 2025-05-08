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

interface TeamDashboardProps {
  team: Team;
  userRole: TeamRole;
  onManageSettings?: () => void;
  onManageInvites?: () => void;
  onManageNotifications?: () => void;
  onManageChat?: () => void;
}

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
  const [showActivities, setShowActivities] = useState(false);
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
    setShowActivities(true);
  };

  // Funktion för att filtrera aktiviteter efter kategori
  const handleFilterActivities = (category: keyof typeof ActivityCategories) => {
    setActivityFilter(prevFilter => prevFilter === category ? undefined : category);
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

  if (showActivities) {
    return (
      <View style={styles.activityContainer}>
        <View style={styles.activityHeader}>
          <Text style={[styles.activityTitle, { color: colors.text.main }]}>Teamaktiviteter</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowActivities(false)}
          >
            <Text style={{ color: colors.primary }}>Tillbaka</Text>
          </TouchableOpacity>
        </View>
        
        {renderFilterChips()}
        
        <TeamActivityList 
          teamId={team.id} 
          limit={20}
          filterCategory={activityFilter}
        />
      </View>
    );
  }

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
          onManageChat,
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
  scrollContainer: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardContainer: {
    flex: 1,
    minWidth: 150,
    maxWidth: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBlur: {
    flex: 1,
    padding: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  activityContainer: {
    flex: 1,
    padding: 0,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  activityTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  backButton: {
    padding: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  }
}); 