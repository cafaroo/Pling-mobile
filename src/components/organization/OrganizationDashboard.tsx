import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { useOrganization } from './OrganizationProvider';
import { OrganizationList } from './OrganizationList';
import { CreateOrganizationForm } from './CreateOrganizationForm';
import { OrganizationInvitationList } from './OrganizationInvitationList';
import { InviteUserForm } from './InviteUserForm';
import { OrganizationMembersList } from './OrganizationMembersList';

export const OrganizationDashboard: React.FC = () => {
  const { currentOrganization, userInvitations } = useOrganization();
  const [showCreateOrgForm, setShowCreateOrgForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  const pendingInvitations = userInvitations.filter(inv => inv.isPending());
  
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
        
        {/* Visa medlemmar för vald organisation */}
        {currentOrganization && (
          <View style={styles.section}>
            <OrganizationMembersList
              showInviteButton={true}
              onInvitePress={() => setShowInviteForm(true)}
            />
          </View>
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
              onSuccess={() => setShowCreateOrgForm(false)}
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
}); 