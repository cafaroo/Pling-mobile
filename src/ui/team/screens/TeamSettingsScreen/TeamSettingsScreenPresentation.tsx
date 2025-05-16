import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { Text, Card, List, Button, Divider, TextInput, Chip, IconButton, useTheme } from 'react-native-paper';
import { ErrorMessage } from '@/ui/shared/components/ErrorMessage';
import { EmptyState } from '@/ui/shared/components/EmptyState';
import { Team } from '@/domain/team/entities/Team';
import { TeamSettings } from '@/domain/team/value-objects/TeamSettings';

export interface TeamSettingsFormData {
  name: string;
  description: string;
  isPrivate: boolean;
  allowGuests: boolean;
  maxMembers: number;
  notificationSettings: {
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    activityDigestFrequency: 'never' | 'daily' | 'weekly';
    notifyOnNewMembers: boolean;
    notifyOnMemberLeave: boolean;
    notifyOnRoleChanges: boolean;
  };
}

export interface TeamSettingsScreenPresentationProps {
  // Data
  team?: Team;
  teamSettings?: TeamSettings;
  formData: TeamSettingsFormData;
  
  // Tillstånd
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  error?: { message: string; retryable?: boolean };
  saveError?: { message: string };
  
  // Callbacks
  onRetry: () => void;
  onFieldChange: (field: string, value: any) => void;
  onNestedFieldChange: (parent: string, field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onDeleteTeam: () => void;
  onLeaveTeam: () => void;
  onArchiveTeam: () => void;
}

export const TeamSettingsScreenPresentation: React.FC<TeamSettingsScreenPresentationProps> = ({
  team,
  teamSettings,
  formData,
  isLoading,
  isSaving,
  hasChanges,
  error,
  saveError,
  onRetry,
  onFieldChange,
  onNestedFieldChange,
  onSave,
  onCancel,
  onDeleteTeam,
  onLeaveTeam,
  onArchiveTeam
}) => {
  const theme = useTheme();
  
  // Visa laddningstillstånd
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Laddar teaminställningar...</Text>
      </View>
    );
  }
  
  // Visa felmeddelande
  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage 
          message={error.message}
          onRetry={error.retryable ? onRetry : undefined}
        />
      </View>
    );
  }
  
  // Om data saknas
  if (!team) {
    return (
      <EmptyState
        title="Teamet hittades inte"
        message="Teamet du söker efter finns inte eller så har du inte behörighet att se det."
        icon="account-group"
      />
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {saveError && (
        <Card style={[styles.card, styles.errorCard]}>
          <Card.Content>
            <Text style={styles.errorText}>{saveError.message}</Text>
          </Card.Content>
        </Card>
      )}
      
      {hasChanges && (
        <Card style={[styles.card, styles.warningCard]}>
          <Card.Content style={styles.warningContent}>
            <Text>Du har osparade ändringar</Text>
            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={onCancel} style={styles.actionButton}>
                Avbryt
              </Button>
              <Button 
                mode="contained" 
                onPress={onSave} 
                loading={isSaving}
                disabled={isSaving}
                style={styles.actionButton}
              >
                Spara
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
      
      <Card style={styles.card}>
        <Card.Title title="Grundinformation" />
        <Card.Content>
          <TextInput
            label="Teamnamn"
            value={formData.name}
            onChangeText={(text) => onFieldChange('name', text)}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Beskrivning"
            value={formData.description}
            onChangeText={(text) => onFieldChange('description', text)}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          
          <List.Item
            title="Privat team"
            description="Endast inbjudna medlemmar kan se och gå med i teamet"
            right={() => (
              <Switch
                value={formData.isPrivate}
                onValueChange={(value) => onFieldChange('isPrivate', value)}
              />
            )}
          />
          
          <List.Item
            title="Tillåt gäster"
            description="Gäster kan bjudas in för tillfälligt samarbete"
            right={() => (
              <Switch
                value={formData.allowGuests}
                onValueChange={(value) => onFieldChange('allowGuests', value)}
              />
            )}
          />
          
          <TextInput
            label="Max antal medlemmar"
            value={formData.maxMembers.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 0;
              onFieldChange('maxMembers', value);
            }}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Notifikationsinställningar" />
        <Card.Content>
          <List.Item
            title="E-postnotifikationer"
            description="Skicka notifikationer via e-post"
            right={() => (
              <Switch
                value={formData.notificationSettings.enableEmailNotifications}
                onValueChange={(value) => 
                  onNestedFieldChange('notificationSettings', 'enableEmailNotifications', value)
                }
              />
            )}
          />
          
          <List.Item
            title="Push-notifikationer"
            description="Skicka notifikationer till mobila enheter"
            right={() => (
              <Switch
                value={formData.notificationSettings.enablePushNotifications}
                onValueChange={(value) => 
                  onNestedFieldChange('notificationSettings', 'enablePushNotifications', value)
                }
              />
            )}
          />
          
          <List.Item
            title="Aktivitetssammanfattning"
            description="Frekvens för aktivitetssammanfattningar"
          />
          
          <View style={styles.chipContainer}>
            <Chip
              selected={formData.notificationSettings.activityDigestFrequency === 'never'}
              onPress={() => 
                onNestedFieldChange('notificationSettings', 'activityDigestFrequency', 'never')
              }
              style={styles.chip}
            >
              Aldrig
            </Chip>
            <Chip
              selected={formData.notificationSettings.activityDigestFrequency === 'daily'}
              onPress={() => 
                onNestedFieldChange('notificationSettings', 'activityDigestFrequency', 'daily')
              }
              style={styles.chip}
            >
              Dagligen
            </Chip>
            <Chip
              selected={formData.notificationSettings.activityDigestFrequency === 'weekly'}
              onPress={() => 
                onNestedFieldChange('notificationSettings', 'activityDigestFrequency', 'weekly')
              }
              style={styles.chip}
            >
              Veckovis
            </Chip>
          </View>
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Nya medlemmar"
            description="Notifiera när nya medlemmar går med i teamet"
            right={() => (
              <Switch
                value={formData.notificationSettings.notifyOnNewMembers}
                onValueChange={(value) => 
                  onNestedFieldChange('notificationSettings', 'notifyOnNewMembers', value)
                }
              />
            )}
          />
          
          <List.Item
            title="Medlemmar lämnar"
            description="Notifiera när medlemmar lämnar teamet"
            right={() => (
              <Switch
                value={formData.notificationSettings.notifyOnMemberLeave}
                onValueChange={(value) => 
                  onNestedFieldChange('notificationSettings', 'notifyOnMemberLeave', value)
                }
              />
            )}
          />
          
          <List.Item
            title="Rollförändringar"
            description="Notifiera vid förändringar av medlemsroller"
            right={() => (
              <Switch
                value={formData.notificationSettings.notifyOnRoleChanges}
                onValueChange={(value) => 
                  onNestedFieldChange('notificationSettings', 'notifyOnRoleChanges', value)
                }
              />
            )}
          />
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Hantera team" />
        <Card.Content>
          <List.Item
            title="Lämna team"
            description="Lämna teamet men lämna det aktivt för andra"
            left={props => <List.Icon {...props} icon="exit-to-app" color={theme.colors.primary} />}
            onPress={onLeaveTeam}
          />
          
          <List.Item
            title="Arkivera team"
            description="Gör teamet inaktivt men behåll all data"
            left={props => <List.Icon {...props} icon="archive" color={theme.colors.warning} />}
            onPress={onArchiveTeam}
          />
          
          <List.Item
            title="Ta bort team"
            description="Ta bort teamet permanent (kan inte ångras)"
            left={props => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
            onPress={onDeleteTeam}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  card: {
    marginBottom: 16,
  },
  errorCard: {
    backgroundColor: '#FEE8E7',
  },
  warningCard: {
    backgroundColor: '#FFF8E1',
  },
  warningContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#B71C1C',
  },
  input: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  chip: {
    margin: 4,
  },
  divider: {
    marginVertical: 16,
  },
}); 