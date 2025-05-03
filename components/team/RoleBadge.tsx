import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type TeamRole = 'owner' | 'admin' | 'member' | 'invited' | 'pending';

type RoleBadgeProps = {
  role: TeamRole;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  style?: any;
  textStyle?: any;
};

const getRoleData = (role: TeamRole, theme: any) => {
  const colors = {
    owner: {
      bg: theme.colors.primary,
      text: '#FFFFFF',
      icon: 'crown',
    },
    admin: {
      bg: theme.colors.secondary,
      text: '#FFFFFF',
      icon: 'shield',
    },
    member: {
      bg: theme.colors.tertiary,
      text: '#FFFFFF',
      icon: 'account',
    },
    invited: {
      bg: theme.colors.inversePrimary,
      text: theme.colors.onSurfaceVariant,
      icon: 'email-outline',
    },
    pending: {
      bg: theme.colors.surfaceVariant,
      text: theme.colors.onSurfaceVariant,
      icon: 'clock-outline',
    },
  };

  const labels = {
    owner: 'Ägare',
    admin: 'Admin',
    member: 'Medlem',
    invited: 'Inbjuden',
    pending: 'Avvaktar',
  };

  return {
    backgroundColor: colors[role].bg,
    textColor: colors[role].text,
    icon: colors[role].icon,
    label: labels[role],
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

const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'medium',
  showIcon = true,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const roleData = getRoleData(role, theme);
  const sizeData = getSizeData(size);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: roleData.backgroundColor,
          paddingHorizontal: sizeData.paddingHorizontal,
          paddingVertical: sizeData.paddingVertical,
          borderRadius: sizeData.borderRadius,
        },
        style,
      ]}
    >
      {showIcon && (
        <MaterialCommunityIcons
          name={roleData.icon}
          size={sizeData.iconSize}
          color={roleData.textColor}
          style={{ marginRight: sizeData.iconMargin }}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: roleData.textColor,
            fontSize: sizeData.fontSize,
          },
          textStyle,
        ]}
      >
        {roleData.label}
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

export default RoleBadge; 