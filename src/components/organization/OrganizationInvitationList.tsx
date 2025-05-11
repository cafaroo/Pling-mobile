import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useOrganization } from './OrganizationProvider';
import { OrganizationInvitation } from '@/domain/organization/value-objects/OrganizationInvitation';

interface OrganizationInvitationListProps {
  onAcceptSuccess?: () => void;
  onDeclineSuccess?: () => void;
}

export const OrganizationInvitationList: React.FC<OrganizationInvitationListProps> = ({
  onAcceptSuccess,
  onDeclineSuccess
}) => {
  const { userInvitations, loadingInvitations, acceptInvitation, declineInvitation } = useOrganization();
  const [processingInvitations, setProcessingInvitations] = useState<string[]>([]);
  
  const pendingInvitations = userInvitations.filter(inv => inv.isPending());
  
  const handleAcceptInvitation = async (invitation: OrganizationInvitation) => {
    if (!invitation.id) return;
    
    const invitationId = invitation.id.toString();
    setProcessingInvitations(prev => [...prev, invitationId]);
    
    try {
      const result = await acceptInvitation(invitationId);
      
      if (result.success) {
        if (onAcceptSuccess) onAcceptSuccess();
      } else {
        Alert.alert('Fel', result.error || 'Kunde inte acceptera inbjudan');
      }
    } catch (error) {
      console.error('Fel vid acceptering av inbjudan:', error);
      Alert.alert('Fel', 'Ett oväntat fel inträffade vid acceptering av inbjudan');
    } finally {
      setProcessingInvitations(prev => prev.filter(id => id !== invitationId));
    }
  };
  
  const handleDeclineInvitation = async (invitation: OrganizationInvitation) => {
    if (!invitation.id) return;
    
    const invitationId = invitation.id.toString();
    setProcessingInvitations(prev => [...prev, invitationId]);
    
    try {
      const result = await declineInvitation(invitationId);
      
      if (result.success) {
        if (onDeclineSuccess) onDeclineSuccess();
      } else {
        Alert.alert('Fel', result.error || 'Kunde inte avböja inbjudan');
      }
    } catch (error) {
      console.error('Fel vid avböjning av inbjudan:', error);
      Alert.alert('Fel', 'Ett oväntat fel inträffade vid avböjning av inbjudan');
    } finally {
      setProcessingInvitations(prev => prev.filter(id => id !== invitationId));
    }
  };
  
  if (loadingInvitations) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Laddar inbjudningar...</Text>
      </View>
    );
  }
  
  if (pendingInvitations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Du har inga inbjudningar</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inbjudningar till organisationer</Text>
      
      <FlatList
        data={pendingInvitations}
        keyExtractor={(item) => item.id?.toString() || ''}
        renderItem={({ item }) => {
          const invitationId = item.id?.toString() || '';
          const isProcessing = processingInvitations.includes(invitationId);
          
          return (
            <View style={styles.invitationItem}>
              <View style={styles.invitationInfo}>
                <Text style={styles.organizationName}>
                  {item.organizationName || 'Organisation'}
                </Text>
                <Text style={styles.invitationText}>
                  Du har blivit inbjuden att gå med i denna organisation
                </Text>
                <Text style={styles.expirationText}>
                  Går ut: {new Date(item.expiresAt || '').toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.actionButtons}>
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => handleDeclineInvitation(item)}
                      disabled={isProcessing}
                    >
                      <Text style={styles.declineButtonText}>Avböj</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptInvitation(item)}
                      disabled={isProcessing}
                    >
                      <Text style={styles.acceptButtonText}>Acceptera</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  invitationItem: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  invitationInfo: {
    marginBottom: 12,
  },
  organizationName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  invitationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  expirationText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  declineButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  declineButtonText: {
    color: '#FF3B30',
    fontWeight: '500',
    fontSize: 14,
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
    color: '#666',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  separator: {
    height: 12,
  },
}); 