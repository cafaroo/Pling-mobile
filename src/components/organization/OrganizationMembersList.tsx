import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useOrganization } from './OrganizationProvider';
import { OrganizationMember } from '@/domain/organization/value-objects/OrganizationMember';
import { OrganizationRole } from '@/domain/organization/value-objects/OrganizationRole';

interface OrganizationMembersListProps {
  showInviteButton?: boolean;
  onInvitePress?: () => void;
}

export const OrganizationMembersList: React.FC<OrganizationMembersListProps> = ({
  showInviteButton = true,
  onInvitePress
}) => {
  const { currentOrganization, loadingOrganizations } = useOrganization();
  
  if (loadingOrganizations || !currentOrganization) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Laddar medlemmar...</Text>
      </View>
    );
  }
  
  const members = currentOrganization.members;
  
  const renderRoleBadge = (role: string) => {
    let badgeStyle;
    let textStyle;
    
    switch (role) {
      case 'owner':
        badgeStyle = styles.ownerBadge;
        textStyle = styles.ownerBadgeText;
        break;
      case 'admin':
        badgeStyle = styles.adminBadge;
        textStyle = styles.adminBadgeText;
        break;
      default:
        badgeStyle = styles.memberBadge;
        textStyle = styles.memberBadgeText;
    }
    
    return (
      <View style={badgeStyle}>
        <Text style={textStyle}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Text>
      </View>
    );
  };
  
  const formatJoinedDate = (joinedAt?: Date) => {
    if (!joinedAt) return 'Okänt datum';
    
    return new Date(joinedAt).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medlemmar</Text>
        {showInviteButton && (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={onInvitePress}
          >
            <Text style={styles.inviteButtonText}>Bjud in</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {members.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Inga medlemmar att visa</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item, index) => `${item.userId.toString()}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {item.userName || `Användare ${item.userId.toString().slice(0, 8)}`}
                </Text>
                <Text style={styles.memberJoinedDate}>
                  Anslöt: {formatJoinedDate(item.joinedAt)}
                </Text>
              </View>
              
              {renderRoleBadge(item.role.toString().toLowerCase())}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  memberItem: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  memberJoinedDate: {
    fontSize: 12,
    color: '#666',
  },
  ownerBadge: {
    backgroundColor: '#FFD60A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ownerBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  adminBadge: {
    backgroundColor: '#5856D6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  memberBadge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  memberBadgeText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
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
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  separator: {
    height: 8,
  }
}); 