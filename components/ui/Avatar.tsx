import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';

interface AvatarProps {
  size?: number;
  source?: string | null;
  fallback?: string;
  showBadge?: boolean;
  badgeIcon?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 40,
  source,
  fallback,
  showBadge = false,
  badgeIcon,
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
    },
    avatar: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    badge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.card,
      borderRadius: size / 4,
      padding: size / 10,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    fallbackText: {
      fontSize: size * 0.4,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        {source ? (
          <Image
            source={{ uri: source }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : fallback ? (
          <Text style={styles.fallbackText}>
            {getInitials(fallback)}
          </Text>
        ) : null}
      </View>
      {showBadge && badgeIcon && (
        <View style={styles.badge}>
          {badgeIcon}
        </View>
      )}
    </View>
  );
};

export type { AvatarProps }; 