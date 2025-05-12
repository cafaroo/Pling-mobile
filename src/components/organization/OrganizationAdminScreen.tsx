import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Switch,
  Alert 
} from 'react-native';
import { useOrganization } from './OrganizationProvider';
import { OrganizationMembersList } from './OrganizationMembersList';
import { OrganizationTeamList } from './OrganizationTeamList';

interface OrganizationSettings {
  maxMembers: number;
  maxTeams: number;
  allowPublicTeams: boolean;
  defaultMemberRole: string;
  subscriptionActive: boolean;
  subscriptionPlan: string;
  subscriptionRenewalDate?: Date;
}

interface OrganizationAdminScreenProps {
  organizationId: string;
  onBack?: () => void;
}

export const OrganizationAdminScreen: React.FC<OrganizationAdminScreenProps> = ({
  organizationId,
  onBack
}) => {
  const { getOrganizationById, updateOrganization } = useOrganization();
  const [organization, setOrganization] = useState<any>(null);
  const [settings, setSettings] = useState<OrganizationSettings>({
    maxMembers: 10,
    maxTeams: 5,
    allowPublicTeams: false,
    defaultMemberRole: 'member',
    subscriptionActive: false,
    subscriptionPlan: 'free'
  });
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'teams' | 'permissions'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    loadOrganizationData();
  }, [organizationId]);

  const loadOrganizationData = async () => {
    setLoading(true);
    setError(null);

    try {
      const org = await getOrganizationById(organizationId);
      if (!org) {
        setError('Kunde inte hitta organisationen');
        return;
      }

      setOrganization(org);
      setOrgName(org.name);
      
      // Här skulle vi hämta och hantera organisationens inställningar
      // Exempel med dummy-data:
      setSettings({
        maxMembers: 10,
        maxTeams: 5,
        allowPublicTeams: false,
        defaultMemberRole: 'member',
        subscriptionActive: true,
        subscriptionPlan: 'team',
        subscriptionRenewalDate: new Date('2023-12-31')
      });
    } catch (err) {
      console.error('Fel vid hämtning av organisationsdata:', err);
      setError('Ett fel uppstod vid hämtning av organisationsdata');
    } finally {
      setLoading(false);
    }
  };

  const saveOrganizationSettings = async () => {
    if (!organization) return;

    setSaving(true);
    setError(null);

    try {
      // Uppdatera organisationens namn
      if (orgName !== organization.name) {
        const result = await updateOrganization(organizationId, { name: orgName });
        if (!result.success) {
          setError(result.error || 'Kunde inte uppdatera organisationsnamn');
          return;
        }
      }

      // Här skulle vi uppdatera organisationens inställningar
      // Till exempel: await updateOrganizationSettings(organizationId, settings);

      Alert.alert('Framgång', 'Organisationsinställningar har sparats');
    } catch (err) {
      console.error('Fel vid sparande av organisationsinställningar:', err);
      setError('Ett fel uppstod vid sparande av inställningar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Laddar organisationsinställningar...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadOrganizationData}>
          <Text style={styles.retryButtonText}>Försök igen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Tillbaka</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Organisationsinställningar</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'general' && styles.activeTab]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>
            Allmänt
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Medlemmar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'teams' && styles.activeTab]}
          onPress={() => setActiveTab('teams')}
        >
          <Text style={[styles.tabText, activeTab === 'teams' && styles.activeTabText]}>
            Team
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'permissions' && styles.activeTab]}
          onPress={() => setActiveTab('permissions')}
        >
          <Text style={[styles.tabText, activeTab === 'permissions' && styles.activeTabText]}>
            Behörigheter
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* General Settings */}
        {activeTab === 'general' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allmänna inställningar</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Organisationsnamn</Text>
              <TextInput
                style={styles.input}
                value={orgName}
                onChangeText={setOrgName}
                placeholder="Organisationsnamn"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.sectionSubtitle}>Prenumerationsinformation</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Plan:</Text>
                <Text style={styles.infoValue}>{settings.subscriptionPlan}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[
                  styles.infoValue, 
                  settings.subscriptionActive ? styles.activeText : styles.inactiveText
                ]}>
                  {settings.subscriptionActive ? 'Aktiv' : 'Inaktiv'}
                </Text>
              </View>
              {settings.subscriptionRenewalDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Förnyas:</Text>
                  <Text style={styles.infoValue}>
                    {settings.subscriptionRenewalDate.toLocaleDateString('sv-SE')}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Hantera prenumeration</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.sectionSubtitle}>Organisationsbegränsningar</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Max medlemmar:</Text>
                <Text style={styles.infoValue}>{settings.maxMembers}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Max team:</Text>
                <Text style={styles.infoValue}>{settings.maxTeams}</Text>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tillåt publika team</Text>
              <View style={styles.switchContainer}>
                <Switch
                  value={settings.allowPublicTeams}
                  onValueChange={(value) => 
                    setSettings({...settings, allowPublicTeams: value})
                  }
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={settings.allowPublicTeams ? "#007AFF" : "#f4f3f4"}
                />
                <Text style={styles.switchLabel}>
                  {settings.allowPublicTeams ? 'Aktiverad' : 'Inaktiverad'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.disabledButton]} 
              onPress={saveOrganizationSettings}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Spara ändringar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medlemshantering</Text>
            <OrganizationMembersList 
              showInviteButton={true}
              onInvitePress={() => {
                // Hantera inbjudan av medlemmar
              }}
            />
          </View>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teamhantering</Text>
            <OrganizationTeamList 
              organizationId={organizationId}
              showCreateButton={true}
              onCreatePress={() => {
                // Hantera skapande av team
              }}
            />
          </View>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Behörighetshantering</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Standard medlemsroll</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity 
                  style={[
                    styles.roleOption, 
                    settings.defaultMemberRole === 'member' && styles.selectedRole
                  ]}
                  onPress={() => setSettings({...settings, defaultMemberRole: 'member'})}
                >
                  <Text style={[
                    styles.roleText, 
                    settings.defaultMemberRole === 'member' && styles.selectedRoleText
                  ]}>
                    Medlem
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.roleOption, 
                    settings.defaultMemberRole === 'admin' && styles.selectedRole
                  ]}
                  onPress={() => setSettings({...settings, defaultMemberRole: 'admin'})}
                >
                  <Text style={[
                    styles.roleText, 
                    settings.defaultMemberRole === 'admin' && styles.selectedRoleText
                  ]}>
                    Administratör
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.permissionsSection}>
              <Text style={styles.sectionSubtitle}>Rollbehörigheter</Text>
              <Text style={styles.permissionsDescription}>
                Dessa behörigheter gäller för alla användare med motsvarande roll. Alla ändringar påverkar
                alla nuvarande och framtida medlemmar med dessa roller.
              </Text>
              
              {/* Member permissions */}
              <View style={styles.permissionGroup}>
                <Text style={styles.permissionGroupTitle}>Medlembehörigheter</Text>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionLabel}>Visa organisationsinformation</Text>
                  <Switch
                    value={true}
                    disabled={true}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={"#007AFF"}
                  />
                </View>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionLabel}>Se teamlista</Text>
                  <Switch
                    value={true}
                    disabled={true}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={"#007AFF"}
                  />
                </View>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionLabel}>Skapa team</Text>
                  <Switch
                    value={false}
                    onValueChange={(value) => {
                      // Hantera behörighetsändring
                    }}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={"#f4f3f4"}
                  />
                </View>
              </View>
              
              {/* Admin permissions */}
              <View style={styles.permissionGroup}>
                <Text style={styles.permissionGroupTitle}>Administratörsbehörigheter</Text>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionLabel}>Hantera medlemmar</Text>
                  <Switch
                    value={true}
                    disabled={true}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={"#007AFF"}
                  />
                </View>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionLabel}>Hantera team</Text>
                  <Switch
                    value={true}
                    disabled={true}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={"#007AFF"}
                  />
                </View>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionLabel}>Redigera organisationsinställningar</Text>
                  <Switch
                    value={true}
                    disabled={true}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={"#007AFF"}
                  />
                </View>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionLabel}>Hantera prenumeration</Text>
                  <Switch
                    value={false}
                    onValueChange={(value) => {
                      // Hantera behörighetsändring
                    }}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={"#f4f3f4"}
                  />
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.disabledButton]} 
              onPress={saveOrganizationSettings}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Spara behörighetsändringar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 120,
    fontSize: 16,
    color: '#666666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeText: {
    color: '#34C759',
  },
  inactiveText: {
    color: '#FF3B30',
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#E6E6E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: '500',
    fontSize: 14,
  },
  roleSelector: {
    flexDirection: 'row',
    marginTop: 8,
  },
  roleOption: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 8,
  },
  selectedRole: {
    backgroundColor: '#007AFF',
  },
  roleText: {
    fontSize: 16,
    color: '#666666',
  },
  selectedRoleText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  permissionsSection: {
    marginTop: 20,
  },
  permissionsDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  permissionGroup: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  permissionGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionLabel: {
    fontSize: 15,
    flex: 1,
  },
}); 