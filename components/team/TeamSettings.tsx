import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { Camera, Bell, Shield, Users } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Team } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { uploadTeamProfileImage, removeTeamProfileImage } from '@/services/teamService';

type TeamSettingsProps = {
  team: Team;
  onUpdateTeam: (updates: Partial<Team>) => Promise<void>;
  onUpdateNotifications: (settings: NotificationSettings) => Promise<void>;
  onUpdateRoles: (roles: RoleSettings) => Promise<void>;
};

type NotificationSettings = {
  newMember: boolean;
  memberLeft: boolean;
  goalUpdates: boolean;
  competitionUpdates: boolean;
};

type RoleSettings = {
  canInviteMembers: string[];
  canManageGoals: string[];
  canManageCompetitions: string[];
};

export default function TeamSettings({
  team,
  onUpdateTeam,
  onUpdateNotifications,
  onUpdateRoles
}: TeamSettingsProps) {
  const { colors } = useTheme();
  const [description, setDescription] = useState(team.description || '');
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    newMember: true,
    memberLeft: true,
    goalUpdates: true,
    competitionUpdates: true
  });
  const [roles, setRoles] = useState<RoleSettings>({
    canInviteMembers: ['owner', 'leader'],
    canManageGoals: ['owner', 'leader'],
    canManageCompetitions: ['owner', 'leader']
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleImagePick = async () => {
    try {
      setIsUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const url = await uploadTeamProfileImage(team.id, blob);
        if (url) {
          await onUpdateTeam({ profileImage: url });
        }
      }
    } catch (error) {
      console.error('Fel vid bilduppladdning:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!team.profileImage) return;
    try {
      setIsUploading(true);
      const success = await removeTeamProfileImage(team.id, team.profileImage);
      if (success) {
        await onUpdateTeam({ profileImage: null });
      }
    } catch (error) {
      console.error('Fel vid borttagning av bild:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDescription = async () => {
    await onUpdateTeam({ description });
    setIsEditing(false);
  };

  const handleNotificationToggle = async (key: keyof NotificationSettings) => {
    const newSettings = {
      ...notifications,
      [key]: !notifications[key]
    };
    setNotifications(newSettings);
    await onUpdateNotifications(newSettings);
  };

  const handleRoleToggle = async (role: string, permission: keyof RoleSettings) => {
    const newRoles = { ...roles };
    if (newRoles[permission].includes(role)) {
      newRoles[permission] = newRoles[permission].filter(r => r !== role);
    } else {
      newRoles[permission].push(role);
    }
    setRoles(newRoles);
    await onUpdateRoles(newRoles);
  };

  return (
    <View style={styles.container}>
      {/* Profilbild */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
          Team Profil
        </Text>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleImagePick} disabled={isUploading}>
            {team.profileImage ? (
              <Image
                source={{ uri: team.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary.light }]}>
                <Camera size={24} color={colors.text.main} />
              </View>
            )}
            {isUploading && (
              <Text style={{ color: colors.text.light, marginTop: 8 }}>Laddar upp...</Text>
            )}
          </TouchableOpacity>
          {team.profileImage && !isUploading && (
            <Button
              title="Ta bort bild"
              onPress={handleRemoveImage}
              variant="outline"
              size="small"
              style={{ marginTop: 8 }}
            />
          )}
          <Text style={[styles.teamName, { color: colors.text.main }]}>
            {team.name}
          </Text>
        </View>
      </Card>

      {/* Beskrivning */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
          Team Beskrivning
        </Text>
        {isEditing ? (
          <View style={styles.descriptionEdit}>
            <TextInput
              style={[styles.input, { color: colors.text.main, borderColor: colors.neutral[500] }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Beskriv ditt team..."
              placeholderTextColor={colors.neutral[400]}
              multiline
            />
            <View style={styles.buttonGroup}>
              <Button
                title="Avbryt"
                onPress={() => setIsEditing(false)}
                variant="outline"
                size="small"
              />
              <Button
                title="Spara"
                onPress={handleSaveDescription}
                variant="primary"
                size="small"
              />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.descriptionView}
            onPress={() => setIsEditing(true)}
          >
            <Text style={[styles.description, { color: colors.text.main }]}>
              {description || 'Lägg till en beskrivning för ditt team...'}
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Notifikationer */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
          Notifikationer
        </Text>
        <View style={styles.notificationList}>
          {Object.entries(notifications).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[styles.notificationItem, { borderBottomColor: colors.neutral[700] }]}
              onPress={() => handleNotificationToggle(key as keyof NotificationSettings)}
            >
              <View style={styles.notificationInfo}>
                <Bell size={20} color={colors.accent.yellow} />
                <Text style={[styles.notificationText, { color: colors.text.main }]}>
                  {key === 'newMember' && 'Nya medlemmar'}
                  {key === 'memberLeft' && 'Medlemmar lämnar'}
                  {key === 'goalUpdates' && 'Måluppdateringar'}
                  {key === 'competitionUpdates' && 'Tävlingsuppdateringar'}
                </Text>
              </View>
              <View style={[styles.toggle, { backgroundColor: value ? colors.accent.yellow : colors.neutral[700] }]} />
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Roller och behörigheter */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
          Roller och behörigheter
        </Text>
        <View style={styles.rolesList}>
          {Object.entries(roles).map(([permission, allowedRoles]) => (
            <View key={permission} style={styles.permissionGroup}>
              <Text style={[styles.permissionTitle, { color: colors.text.main }]}>
                {permission === 'canInviteMembers' && 'Bjuda in medlemmar'}
                {permission === 'canManageGoals' && 'Hantera mål'}
                {permission === 'canManageCompetitions' && 'Hantera tävlingar'}
              </Text>
              <View style={styles.roleToggles}>
                {['owner', 'leader', 'member'].map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleToggle,
                      {
                        backgroundColor: allowedRoles.includes(role)
                          ? colors.accent.yellow
                          : colors.neutral[700]
                      }
                    ]}
                    onPress={() => handleRoleToggle(role, permission as keyof RoleSettings)}
                  >
                    <Text style={[styles.roleText, { color: colors.text.main }]}>
                      {role === 'owner' && 'Ägare'}
                      {role === 'leader' && 'Ledare'}
                      {role === 'member' && 'Medlem'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  profileSection: {
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  descriptionEdit: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  descriptionView: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  notificationList: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
  },
  rolesList: {
    gap: 20,
  },
  permissionGroup: {
    gap: 8,
  },
  permissionTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  roleToggles: {
    flexDirection: 'row',
    gap: 8,
  },
  roleToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
}); 