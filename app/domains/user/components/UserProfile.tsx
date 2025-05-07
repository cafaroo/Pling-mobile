import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useUser } from '../hooks/useUser';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Settings, Edit2, Camera } from 'lucide-react-native';

interface UserProfileProps {
  userId: string;
  onEditPress?: () => void;
  onSettingsPress?: () => void;
}

export function UserProfile({ 
  userId, 
  onEditPress, 
  onSettingsPress 
}: UserProfileProps) {
  const { colors } = useTheme();
  const { 
    user, 
    preferences,
    isLoading,
    error 
  } = useUser(userId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.text.light }]}>
          Laddar användarprofil...
        </Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Kunde inte ladda användarprofilen
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BlurView intensity={20} style={styles.header}>
        <View style={styles.avatarContainer}>
          <Avatar
            size={80}
            url={user.avatar_url}
            name={user.name || ''}
          />
          {onEditPress && (
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: colors.primary.main }]}
              onPress={onEditPress}
            >
              <Camera size={20} color={colors.text.main} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={[styles.name, { color: colors.text.main }]}>
          {user.name || 'Namnlös användare'}
        </Text>
        
        <Text style={[styles.email, { color: colors.text.light }]}>
          {user.email}
        </Text>
      </BlurView>

      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Text style={[styles.infoTitle, { color: colors.text.main }]}>
            Profilinformation
          </Text>
          {onSettingsPress && (
            <TouchableOpacity onPress={onSettingsPress}>
              <Settings size={24} color={colors.text.light} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContent}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text.light }]}>
              Status
            </Text>
            <Text style={[styles.infoValue, { color: colors.text.main }]}>
              {user.status}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text.light }]}>
              Språk
            </Text>
            <Text style={[styles.infoValue, { color: colors.text.main }]}>
              {preferences?.language || 'Svenska'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.text.light }]}>
              Tema
            </Text>
            <Text style={[styles.infoValue, { color: colors.text.main }]}>
              {preferences?.theme || 'Ljust'}
            </Text>
          </View>
        </View>

        {onEditPress && (
          <Button
            title="Redigera profil"
            onPress={onEditPress}
            icon={Edit2}
            variant="outline"
            style={styles.editProfileButton}
          />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  editButton: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  infoCard: {
    marginTop: 20,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  editProfileButton: {
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
}); 