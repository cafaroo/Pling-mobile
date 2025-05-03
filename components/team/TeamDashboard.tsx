import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { Team, TeamRole } from '@/types/team';
import { Users, Settings, UserPlus, Bell, Shield, MessageCircle } from 'lucide-react-native';

interface TeamDashboardProps {
  team: Team;
  userRole: TeamRole;
  onManageMembers?: () => void;
  onManageSettings?: () => void;
  onManageInvites?: () => void;
  onManageNotifications?: () => void;
  onManageChat?: () => void;
}

export const TeamDashboard: React.FC<TeamDashboardProps> = ({
  team,
  userRole,
  onManageMembers,
  onManageSettings,
  onManageInvites,
  onManageNotifications,
  onManageChat,
}) => {
  const { colors } = useTheme();
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

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

  return (
    <View style={styles.container}>
      {/* Medlemskort */}
      {renderCard(
        <Users />,
        'Medlemmar',
        `${team.members?.length || 0} aktiva medlemmar`,
        onManageMembers
      )}

      {/* Chatkort */}
      {renderCard(
        <MessageCircle />,
        'Team Chat',
        'Chatta med ditt team',
        onManageChat,
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
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
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
}); 