import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TeamStatus, TeamMemberStatus } from '../../types/team';

type StatusType = 'team' | 'user' | 'invitation';

type UserStatus = 'online' | 'away' | 'offline' | 'busy';
type InvitationStatus = 'sent' | 'accepted' | 'rejected' | 'expired';

type StatusBadgeProps = {
  type: StatusType;
  status: TeamStatus | TeamMemberStatus | UserStatus | InvitationStatus;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  style?: any;
  textStyle?: any;
  variant?: 'default' | 'outline' | 'solid';
};

const getStatusData = (type: StatusType, status: string, theme: any) => {
  const teamStatuses: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    active: {
      bg: theme.colors.primary,
      text: '#FFFFFF',
      icon: 'check-circle',
      label: 'Aktiv',
    },
    inactive: {
      bg: theme.colors.error,
      text: '#FFFFFF',
      icon: 'close-circle',
      label: 'Inaktiv',
    },
    paused: {
      bg: theme.colors.surfaceVariant,
      text: theme.colors.onSurfaceVariant,
      icon: 'pause-circle',
      label: 'Pausad',
    },
  };

  const userStatuses: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    online: {
      bg: '#4CAF50',
      text: '#FFFFFF',
      icon: 'circle',
      label: 'Online',
    },
    away: {
      bg: '#FFC107',
      text: '#000000',
      icon: 'clock',
      label: 'Borta',
    },
    offline: {
      bg: '#9E9E9E',
      text: '#FFFFFF',
      icon: 'circle-outline',
      label: 'Offline',
    },
    busy: {
      bg: '#F44336',
      text: '#FFFFFF',
      icon: 'minus-circle',
      label: 'Upptagen',
    },
  };

  const invitationStatuses: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    sent: {
      bg: theme.colors.primary,
      text: '#FFFFFF',
      icon: 'email-outline',
      label: 'Skickad',
    },
    accepted: {
      bg: '#4CAF50',
      text: '#FFFFFF',
      icon: 'check',
      label: 'Accepterad',
    },
    rejected: {
      bg: '#F44336',
      text: '#FFFFFF',
      icon: 'close',
      label: 'Avvisad',
    },
    expired: {
      bg: '#9E9E9E',
      text: '#FFFFFF',
      icon: 'clock-outline',
      label: 'Utgången',
    },
  };

  const statusMaps = {
    team: teamStatuses,
    user: userStatuses,
    invitation: invitationStatuses,
  };

  const statusMap = statusMaps[type];
  const statusInfo = statusMap[status] || {
    bg: theme.colors.surfaceVariant,
    text: theme.colors.onSurfaceVariant,
    icon: 'help-circle',
    label: 'Okänd',
  };

  return {
    backgroundColor: statusInfo.bg,
    textColor: statusInfo.text,
    icon: statusInfo.icon,
    label: statusInfo.label,
  };
};

const getSizeData = (size: 'small' | 'medium' | 'large') => {
  const sizes = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 10,
      iconSize: 10,
      borderRadius: 4,
      iconMargin: 2,
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 12,
      iconSize: 12,
      borderRadius: 6,
      iconMargin: 4,
    },
    large: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 14,
      iconSize: 16,
      borderRadius: 8,
      iconMargin: 6,
    },
  };

  return sizes[size];
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  status,
  size = 'medium',
  showIcon = true,
  style,
  textStyle,
  variant = 'default',
}) => {
  const theme = useTheme();
  const statusData = getStatusData(type, status, theme);
  const sizeData = getSizeData(size);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: statusData.backgroundColor,
          paddingHorizontal: sizeData.paddingHorizontal,
          paddingVertical: sizeData.paddingVertical,
          borderRadius: sizeData.borderRadius,
        },
        style,
      ]}
    >
      {showIcon && (
        <MaterialCommunityIcons
          name={statusData.icon}
          size={sizeData.iconSize}
          color={statusData.textColor}
          style={{ marginRight: sizeData.iconMargin }}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: statusData.textColor,
            fontSize: sizeData.fontSize,
          },
          textStyle,
        ]}
      >
        {statusData.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
});

export default StatusBadge; 