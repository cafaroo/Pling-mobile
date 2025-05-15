import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TeamMember {
  id: string;
  name?: string;
  role: string;
  addedAt?: string;
}

interface MemberCardProps {
  /** Teammedlemmen att visa */
  member: TeamMember;
  /** Om nuvarande användare är admin */
  isAdmin: boolean;
  /** Callback för att ta bort medlem */
  onRemove?: (memberId: string) => void;
  /** Callback för att ändra roll */
  onRoleChange?: (role: string) => void;
}

/**
 * Visar en medlems information i ett team med möjlighet att hantera medlemskapet
 */
export const MemberCard = ({ member, isAdmin, onRemove, onRoleChange }: MemberCardProps) => {
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  
  // Beräkna medlemskapstid om addedAt finns
  const memberSince = member.addedAt 
    ? new Date(member.addedAt).toLocaleDateString('sv-SE')
    : 'Okänd tidpunkt';
    
  // Använd ID som namn om namn saknas
  const displayName = member.name || `Användare (${member.id})`;
  
  // Rollalternativ
  const roles = [
    { id: 'admin', label: 'Admin' },
    { id: 'member', label: 'Medlem' }
  ];
  
  const handleRoleChange = (role: string) => {
    setShowRoleOptions(false);
    if (onRoleChange) {
      onRoleChange(role);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{displayName}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.roleContainer}>
            <Text style={styles.label}>Roll:</Text>
            {showRoleOptions ? (
              <View style={styles.roleOptions}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.roleOption,
                      member.role === role.id && styles.selectedRoleOption
                    ]}
                    onPress={() => handleRoleChange(role.id)}
                  >
                    <Text 
                      style={[
                        styles.roleOptionText,
                        member.role === role.id && styles.selectedRoleOptionText
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.currentRole}>
                <Text style={styles.roleText}>
                  {member.role === 'admin' ? 'Admin' : 'Medlem'}
                </Text>
                {isAdmin && onRoleChange && (
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => setShowRoleOptions(true)}
                  >
                    <Text style={styles.editButtonText}>Ändra</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          
          <Text style={styles.memberSince}>
            <Text style={styles.label}>Medlem sedan: </Text>
            {memberSince}
          </Text>
        </View>
      </View>
      
      {isAdmin && onRemove && (
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => onRemove(member.id)}
        >
          <Text style={styles.removeButtonText}>Ta bort</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsContainer: {
    marginTop: 4,
  },
  roleContainer: {
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    color: '#666',
  },
  currentRole: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roleText: {
    fontSize: 16,
    color: '#333',
  },
  roleOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  roleOption: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedRoleOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedRoleOptionText: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButtonText: {
    color: '#0066cc',
    fontSize: 12,
  },
  removeButton: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    justifyContent: 'center',
    marginLeft: 16,
  },
  removeButtonText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
}); 