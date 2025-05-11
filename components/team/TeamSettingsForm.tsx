import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { Team, TeamSettings } from '@types/team';
import { Card } from '@components/ui/Card';
import { Switch } from '@components/ui/Switch';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Slider } from '@components/ui/Slider';
import { Users, Bell, Lock, Eye, RotateCcw } from 'lucide-react-native';
import Toast from '@components/ui/Toast';

interface TeamSettingsFormProps {
  team: Team;
  onUpdate: (settings: TeamSettings) => Promise<void>;
  isLoading?: boolean;
}

const MAX_MEMBERS_LIMIT = 1000;
const MIN_MEMBERS_LIMIT = 1;

export const TeamSettingsForm = React.memo<TeamSettingsFormProps>(({
  team,
  onUpdate,
  isLoading = false,
}) => {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<TeamSettings>(team.settings);
  const [error, setError] = useState<string | null>(null);
  const toastRef = useRef(null);

  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(team.settings);
  }, [settings, team.settings]);

  useEffect(() => {
    Toast.setRef(toastRef);
  }, []);

  const handleUpdate = useCallback(async () => {
    try {
      if (settings.maxMembers < team.members.length) {
        Alert.alert(
          'Varning',
          'Det nya maxantalet är mindre än nuvarande antal medlemmar. Vill du fortsätta?',
          [
            { text: 'Avbryt', style: 'cancel' },
            { 
              text: 'Fortsätt', 
              style: 'destructive',
              onPress: async () => {
                setError(null);
                await onUpdate(settings);
                Toast.show({
                  title: 'Inställningar uppdaterade',
                  type: 'success',
                  duration: 3000
                });
              }
            }
          ]
        );
        return;
      }

      setError(null);
      await onUpdate(settings);
      Toast.show({
        title: 'Inställningar uppdaterade',
        type: 'success',
        duration: 3000
      });
    } catch (err) {
      setError('Det gick inte att uppdatera inställningarna. Försök igen.');
      Toast.show({
        title: 'Kunde inte spara inställningar',
        description: err.message,
        type: 'error',
        duration: 5000
      });
    }
  }, [settings, onUpdate, team.members.length]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Återställ inställningar',
      'Är du säker på att du vill återställa alla inställningar till ursprungsläget?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Återställ', 
          style: 'destructive',
          onPress: () => setSettings(team.settings)
        }
      ]
    );
  }, [team.settings]);

  const updateSetting = useCallback((key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateNotificationSetting = useCallback((key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value,
      },
    }));
  }, []);

  const updatePrivacySetting = useCallback((key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }));
  }, []);

  return (
    <View style={styles.container}>
      <Toast ref={toastRef} visible={false} message="" />
      <ScrollView style={styles.container}>
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={24} color={colors.accent.yellow} />
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
              Medlemmar
            </Text>
          </View>

          <View style={styles.setting}>
            <Text style={[styles.settingLabel, { color: colors.text.main }]}>
              Max antal medlemmar
            </Text>
            <Slider
              value={settings.maxMembers}
              onValueChange={(value) => updateSetting('maxMembers', value)}
              minimumValue={MIN_MEMBERS_LIMIT}
              maximumValue={MAX_MEMBERS_LIMIT}
              step={1}
              style={styles.slider}
            />
            <Text style={[styles.settingValue, { color: colors.text.light }]}>
              {settings.maxMembers} medlemmar
            </Text>
          </View>

          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text.main }]}>
                Tillåt medlemsinbjudningar
              </Text>
              <Text style={[styles.settingDescription, { color: colors.text.light }]}>
                Låt medlemmar bjuda in nya personer till teamet
              </Text>
            </View>
            <Switch
              value={settings.allowInvites}
              onValueChange={(value) => updateSetting('allowInvites', value)}
            />
          </View>

          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text.main }]}>
                Kräv admingodkännande
              </Text>
              <Text style={[styles.settingDescription, { color: colors.text.light }]}>
                Nya medlemmar måste godkännas av en admin
              </Text>
            </View>
            <Switch
              value={settings.requireAdminApproval}
              onValueChange={(value) => updateSetting('requireAdminApproval', value)}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={24} color={colors.accent.yellow} />
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
              Notifikationer
            </Text>
          </View>

          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text.main }]}>
                Nya medlemmar
              </Text>
            </View>
            <Switch
              value={settings.notificationPreferences.newMembers}
              onValueChange={(value) => updateNotificationSetting('newMembers', value)}
            />
          </View>

          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text.main }]}>
                Chattmeddelanden
              </Text>
            </View>
            <Switch
              value={settings.notificationPreferences.chatMessages}
              onValueChange={(value) => updateNotificationSetting('chatMessages', value)}
            />
          </View>

          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text.main }]}>
                Teamuppdateringar
              </Text>
            </View>
            <Switch
              value={settings.notificationPreferences.teamUpdates}
              onValueChange={(value) => updateNotificationSetting('teamUpdates', value)}
            />
          </View>

          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text.main }]}>
                Omnämnanden (@)
              </Text>
            </View>
            <Switch
              value={settings.notificationPreferences.mentions}
              onValueChange={(value) => updateNotificationSetting('mentions', value)}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={24} color={colors.accent.yellow} />
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
              Sekretess
            </Text>
          </View>

          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text.main }]}>
                Publikt team
              </Text>
              <Text style={[styles.settingDescription, { color: colors.text.light }]}>
                Låt alla se teamet och dess information
              </Text>
            </View>
            <Switch
              value={settings.privacy.isPublic}
              onValueChange={(value) => updatePrivacySetting('isPublic', value)}
            />
          </View>

          <View style={styles.setting}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text.main }]}>
                Visa medlemslista
              </Text>
              <Text style={[styles.settingDescription, { color: colors.text.light }]}>
                Låt alla se vilka som är medlemmar i teamet
              </Text>
            </View>
            <Switch
              value={settings.privacy.showMemberList}
              onValueChange={(value) => updatePrivacySetting('showMemberList', value)}
            />
          </View>
        </Card>

        <View style={styles.footer}>
          <Button 
            variant="outline"
            onPress={handleReset}
            disabled={!hasChanges || isLoading}
            Icon={RotateCcw}
            iconPosition="left"
          >
            Återställ
          </Button>
          <Button
            variant="primary"
            onPress={handleUpdate}
            disabled={!hasChanges || isLoading}
            loading={isLoading}
          >
            Spara ändringar
          </Button>
        </View>

        {error && (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        )}
      </ScrollView>
    </View>
  );
});

TeamSettingsForm.displayName = 'TeamSettingsForm';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginLeft: 12,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  settingDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  settingValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 8,
  },
  slider: {
    flex: 1,
    marginHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
  }
}); 