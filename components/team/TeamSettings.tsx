import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Switch, ScrollView } from 'react-native';
import { Camera, Bell, Shield, Users, Bold, Italic, List, Link as LinkIcon } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Team, NotificationSettings } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import Markdown from 'react-native-markdown-display';
import { uploadTeamProfileImage, removeTeamProfileImage, updateTeamNotificationSettings } from '@/services/teamService';

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

const MARKDOWN_GUIDE = `
### Formatering:
- **Fet text**: Använd **dubbla asterisker**
- *Kursiv text*: Använd *enkla asterisker*
- Punktlista: Börja rader med -
- [Länk](url): Använd [text](url)

### Tips:
- Håll beskrivningen kort och koncis
- Använd rubriker för att organisera
- Lägg till relevanta länkar
`;

export default function TeamSettings({
  team,
  onUpdateTeam,
  onUpdateNotifications,
  onUpdateRoles
}: TeamSettingsProps) {
  const { colors } = useTheme();
  const [description, setDescription] = useState(team.description || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSettings>(
    team.notificationSettings || {
      newMember: true,
      memberLeft: true,
      goalUpdates: true,
      competitionUpdates: true
    }
  );
  const [roles, setRoles] = useState<RoleSettings>({
    canInviteMembers: ['owner', 'leader'],
    canManageGoals: ['owner', 'leader'],
    canManageCompetitions: ['owner', 'leader']
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    try {
      setIsSaving(true);
      const newSettings = {
        ...notifications,
        [key]: !notifications[key]
      };
      
      const success = await updateTeamNotificationSettings(team.id, newSettings);
      
      if (success) {
        setNotifications(newSettings);
        await onUpdateTeam({ notificationSettings: newSettings });
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
    } finally {
      setIsSaving(false);
    }
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

  const getNotificationLabel = (key: keyof NotificationSettings): string => {
    switch (key) {
      case 'newMember':
        return 'Nya medlemmar';
      case 'memberLeft':
        return 'Medlemmar som lämnar';
      case 'goalUpdates':
        return 'Måluppdateringar';
      case 'competitionUpdates':
        return 'Tävlingsuppdateringar';
      default:
        return '';
    }
  };

  const insertMarkdownSyntax = (syntax: string, wrapper: string) => {
    const textInput = description;
    const selectionStart = textInput.length;
    const selectionEnd = textInput.length;
    const beforeText = textInput.substring(0, selectionStart);
    const afterText = textInput.substring(selectionEnd);

    if (syntax === 'list') {
      setDescription(description + '\n- ');
    } else {
      setDescription(beforeText + wrapper + syntax + wrapper + afterText);
    }
  };

  const renderMarkdownToolbar = () => (
    <View style={styles.markdownToolbar}>
      <TouchableOpacity
        style={styles.toolbarButton}
        onPress={() => insertMarkdownSyntax('text', '**')}
      >
        <Bold size={20} color={colors.text.main} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.toolbarButton}
        onPress={() => insertMarkdownSyntax('text', '*')}
      >
        <Italic size={20} color={colors.text.main} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.toolbarButton}
        onPress={() => insertMarkdownSyntax('list', '')}
      >
        <List size={20} color={colors.text.main} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.toolbarButton}
        onPress={() => insertMarkdownSyntax('[länktext](url)', '')}
      >
        <LinkIcon size={20} color={colors.text.main} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toolbarButton, styles.guideButton]}
        onPress={() => setShowMarkdownGuide(!showMarkdownGuide)}
      >
        <Text style={{ color: colors.text.main }}>?</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
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
            {renderMarkdownToolbar()}
            <TextInput
              style={[styles.input, { color: colors.text.main, borderColor: colors.neutral[500] }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Beskriv ditt team... (Markdown stöds)"
              placeholderTextColor={colors.neutral[400]}
              multiline
              textAlignVertical="top"
            />
            {showMarkdownGuide && (
              <Card style={styles.markdownGuide}>
                <Text style={[styles.guideTitle, { color: colors.text.main }]}>
                  Markdown Guide
                </Text>
                <Markdown style={{
                  body: { color: colors.text.main },
                  heading3: { color: colors.text.main, fontFamily: 'Inter-Bold' },
                  list: { color: colors.text.main },
                  link: { color: colors.primary.main },
                }}>
                  {MARKDOWN_GUIDE}
                </Markdown>
              </Card>
            )}
            <View style={styles.previewSection}>
              <Text style={[styles.previewTitle, { color: colors.text.main }]}>
                Förhandsgranskning
              </Text>
              <Card style={styles.preview}>
                <Markdown style={{
                  body: { color: colors.text.main },
                  heading1: { color: colors.text.main, fontFamily: 'Inter-Bold' },
                  heading2: { color: colors.text.main, fontFamily: 'Inter-Bold' },
                  heading3: { color: colors.text.main, fontFamily: 'Inter-Bold' },
                  link: { color: colors.primary.main },
                  list: { color: colors.text.main },
                }}>
                  {description || '*Ingen beskrivning än...*'}
                </Markdown>
              </Card>
            </View>
            <View style={styles.buttonGroup}>
              <Button
                title="Avbryt"
                onPress={() => {
                  setIsEditing(false);
                  setShowMarkdownGuide(false);
                }}
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
            <Markdown style={{
              body: { color: colors.text.main },
              heading1: { color: colors.text.main, fontFamily: 'Inter-Bold' },
              heading2: { color: colors.text.main, fontFamily: 'Inter-Bold' },
              heading3: { color: colors.text.main, fontFamily: 'Inter-Bold' },
              link: { color: colors.primary.main },
              list: { color: colors.text.main },
            }}>
              {description || '*Lägg till en beskrivning för ditt team...*'}
            </Markdown>
          </TouchableOpacity>
        )}
      </Card>

      {/* Notifikationer */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bell size={20} color={colors.text.main} />
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
            Notifikationer
          </Text>
        </View>
        <View style={styles.notificationList}>
          {Object.keys(notifications).map((key) => (
            <View key={key} style={styles.notificationItem}>
              <Text style={[styles.notificationLabel, { color: colors.text.main }]}>
                {getNotificationLabel(key as keyof NotificationSettings)}
              </Text>
              <Switch
                value={notifications[key as keyof NotificationSettings]}
                onValueChange={() => handleNotificationToggle(key as keyof NotificationSettings)}
                disabled={isSaving}
                trackColor={{ false: colors.neutral[300], true: colors.primary.main }}
                thumbColor={colors.neutral[50]}
              />
            </View>
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
    </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  notificationList: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  notificationLabel: {
    fontSize: 16,
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
  markdownToolbar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    gap: 8,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  guideButton: {
    marginLeft: 'auto',
  },
  markdownGuide: {
    marginTop: 12,
    padding: 16,
  },
  guideTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    marginBottom: 8,
  },
  previewSection: {
    marginTop: 16,
  },
  previewTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  preview: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
}); 