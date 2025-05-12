import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useOrganization } from './OrganizationProvider';
import { OrganizationList } from './OrganizationList';
import { CreateOrganizationForm } from './CreateOrganizationForm';
import { OrganizationInvitationList } from './OrganizationInvitationList';
import { InviteUserForm } from './InviteUserForm';
import { OrganizationMembersList } from './OrganizationMembersList';
import { OrganizationTeamList } from './OrganizationTeamList';
import { OrganizationAdminScreen } from './OrganizationAdminScreen';
import { OrganizationOnboarding } from './OrganizationOnboarding';
import { OrganizationResourceList } from './OrganizationResourceList';
import { OrganizationResourceDetails } from './OrganizationResourceDetails';
import { CreateResourceForm } from './CreateResourceForm';
import { OrganizationSubscriptionInfo } from './OrganizationSubscriptionInfo';
import { OrganizationResource } from '@/domain/organization/entities/OrganizationResource';

// Definiera en enkel CreateTeamForm komponent
interface CreateTeamFormProps {
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateTeamForm: React.FC<CreateTeamFormProps> = ({
  organizationId,
  onSuccess,
  onCancel
}) => {
  const { createTeam } = useOrganization();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Teamets namn får inte vara tomt');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await createTeam(organizationId, {
        name: name.trim(),
        description: description.trim()
      });
      
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Kunde inte skapa team');
      }
    } catch (err) {
      console.error('Fel vid skapande av team:', err);
      setError('Ett oväntat fel inträffade');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Skapa nytt team</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Teamets namn</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ange teamets namn"
          autoCapitalize="words"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Beskrivning (valfritt)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Beskriv teamets syfte"
          multiline
          numberOfLines={3}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Avbryt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Skapa team</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const OrganizationDashboard: React.FC = () => {
  const { currentOrganization, userInvitations } = useOrganization();
  const [showCreateOrgForm, setShowCreateOrgForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [showAdminScreen, setShowAdminScreen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateResourceForm, setShowCreateResourceForm] = useState(false);
  const [showResourceDetails, setShowResourceDetails] = useState(false);
  const [selectedResource, setSelectedResource] = useState<OrganizationResource | null>(null);
  const [newOrganizationId, setNewOrganizationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'teams' | 'resources' | 'subscription'>('members');
  
  const pendingInvitations = userInvitations.filter(inv => inv.isPending());

  const handleCreateOrganizationSuccess = () => {
    setShowCreateOrgForm(false);
    
    // Starta onboarding-flödet med den skapade organisationen
    if (currentOrganization) {
      setNewOrganizationId(currentOrganization.id.toString());
      setShowOnboarding(true);
    }
  };
  
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setNewOrganizationId(null);
  };
  
  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setNewOrganizationId(null);
  };

  const handleSelectResource = (resource: OrganizationResource) => {
    setSelectedResource(resource);
    setShowResourceDetails(true);
  };

  const handleResourceCreated = () => {
    setShowCreateResourceForm(false);
  };
  
  const handleCloseResourceDetails = () => {
    setShowResourceDetails(false);
    setSelectedResource(null);
  };
  
  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Visar användarens inbjudningar om det finns några */}
        {pendingInvitations.length > 0 && (
          <View style={styles.section}>
            <OrganizationInvitationList
              onAcceptSuccess={() => {
                // Hantera accepterad inbjudan
              }}
              onDeclineSuccess={() => {
                // Hantera avböjd inbjudan
              }}
            />
          </View>
        )}
        
        {/* Lista över användarens organisationer */}
        <View style={styles.section}>
          <OrganizationList 
            onCreateNew={() => setShowCreateOrgForm(true)}
            onSelectOrganization={(org) => {
              // Hantera val av organisation
              console.log('Vald organisation:', org.name);
            }}
          />
        </View>
        
        {/* Innehåll för vald organisation med flikar */}
        {currentOrganization && (
          <>
            <View style={styles.orgActionBar}>
              <Text style={styles.currentOrgName}>{currentOrganization.name}</Text>
              <TouchableOpacity 
                style={styles.adminButton}
                onPress={() => setShowAdminScreen(true)}
              >
                <Text style={styles.adminButtonText}>Administrera</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.section}>
              <View style={styles.tabContainer}>
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
                  style={[styles.tab, activeTab === 'resources' && styles.activeTab]}
                  onPress={() => setActiveTab('resources')}
                >
                  <Text style={[styles.tabText, activeTab === 'resources' && styles.activeTabText]}>
                    Resurser
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'subscription' && styles.activeTab]}
                  onPress={() => setActiveTab('subscription')}
                >
                  <Text style={[styles.tabText, activeTab === 'subscription' && styles.activeTabText]}>
                    Prenumeration
                  </Text>
                </TouchableOpacity>
              </View>
              
              {activeTab === 'members' && (
                <OrganizationMembersList
                  showInviteButton={true}
                  onInvitePress={() => setShowInviteForm(true)}
                />
              )}
              
              {activeTab === 'teams' && (
                <OrganizationTeamList
                  organizationId={currentOrganization.id.toString()}
                  showCreateButton={true}
                  onCreatePress={() => setShowCreateTeamForm(true)}
                />
              )}

              {activeTab === 'resources' && (
                <OrganizationResourceList
                  organizationId={currentOrganization.id.toString()}
                  onSelectResource={handleSelectResource}
                  onCreateResource={() => setShowCreateResourceForm(true)}
                />
              )}

              {activeTab === 'subscription' && (
                <OrganizationSubscriptionInfo
                  organizationId={currentOrganization.id.toString()}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
      
      {/* Modal för att skapa organisation */}
      <Modal
        visible={showCreateOrgForm}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <CreateOrganizationForm
              onSuccess={handleCreateOrganizationSuccess}
              onCancel={() => setShowCreateOrgForm(false)}
            />
          </View>
        </View>
      </Modal>
      
      {/* Modal för att bjuda in användare */}
      <Modal
        visible={showInviteForm && !!currentOrganization}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {currentOrganization && (
              <InviteUserForm
                organizationId={currentOrganization.id.toString()}
                onSuccess={() => setShowInviteForm(false)}
                onCancel={() => setShowInviteForm(false)}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Modal för att skapa team */}
      <Modal
        visible={showCreateTeamForm && !!currentOrganization}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {currentOrganization && (
              <CreateTeamForm
                organizationId={currentOrganization.id.toString()}
                onSuccess={() => setShowCreateTeamForm(false)}
                onCancel={() => setShowCreateTeamForm(false)}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Modal för att skapa resurs */}
      <Modal
        visible={showCreateResourceForm && !!currentOrganization}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {currentOrganization && (
              <CreateResourceForm
                organizationId={currentOrganization.id.toString()}
                onSuccess={handleResourceCreated}
                onCancel={() => setShowCreateResourceForm(false)}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal för resursdetaljer */}
      <Modal
        visible={showResourceDetails && !!selectedResource}
        animationType="slide"
        transparent={false}
      >
        {selectedResource && (
          <OrganizationResourceDetails
            resourceId={selectedResource.id.toString()}
            onBack={handleCloseResourceDetails}
            onDelete={handleCloseResourceDetails}
          />
        )}
      </Modal>
      
      {/* Modal för organisationsadministration */}
      <Modal
        visible={showAdminScreen && !!currentOrganization}
        animationType="slide"
        transparent={false}
      >
        {currentOrganization && (
          <OrganizationAdminScreen
            organizationId={currentOrganization.id.toString()}
            onBack={() => setShowAdminScreen(false)}
          />
        )}
      </Modal>
      
      {/* Modal för onboarding */}
      <Modal
        visible={showOnboarding && !!newOrganizationId}
        animationType="slide"
        transparent={false}
      >
        {newOrganizationId && (
          <OrganizationOnboarding
            organizationId={newOrganizationId}
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
    marginBottom: 20,
  },
  orgActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 4,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  currentOrgName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  adminButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
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
    fontSize: 16,
    color: '#666666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
  },
  // Form styles
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#FFEEEE',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
}); 