import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Avatar, Divider, Button, IconButton, Menu } from 'react-native-paper';
import { useTeam } from '@/application/team/hooks/useTeam';
import { useAuth } from '@context/AuthContext';
import { TeamMember as TeamMemberType } from '@/domain/team/value-objects/TeamMember';
import { TeamRole, getTeamRoleLabel } from '@/domain/team/value-objects/TeamRole';
import { Team } from '@/domain/team/entities/Team';

interface TeamMemberListProps {
  team: Team;
  onRoleChange?: () => void;
}

export const TeamMemberList: React.FC<TeamMemberListProps> = ({ team, onRoleChange }) => {
  const { user } = useAuth();
  const { useUpdateTeamMemberRole, useLeaveTeam } = useTeam();
  const updateRoleMutation = useUpdateTeamMemberRole();
  const leaveMutation = useLeaveTeam();
  
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  
  const currentUser = user?.id;
  const isOwner = team.ownerId.toString() === currentUser;
  const userMember = team.members.find(m => m.userId.toString() === currentUser);
  const userRole = userMember?.role || "";
  const canManageRoles = isOwner || userRole === TeamRole.ADMIN;
  
  const openMenu = (userId: string) => setMenuVisible(userId);
  const closeMenu = () => setMenuVisible(null);
  
  const handleRoleChange = async (member: TeamMemberType, newRole: string) => {
    if (!user) return;
    
    closeMenu();
    setLoading(member.userId.toString());
    
    try {
      await updateRoleMutation.mutateAsync({
        teamId: team.id.toString(),
        userId: member.userId.toString(),
        newRole,
        currentUserId: user.id
      });
      
      if (onRoleChange) {
        onRoleChange();
      }
    } catch (error) {
      Alert.alert('Fel', error.message);
    } finally {
      setLoading(null);
    }
  };
  
  const handleLeaveTeam = async () => {
    if (!user) return;
    
    Alert.alert(
      'Lämna team',
      'Är du säker på att du vill lämna det här teamet?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Lämna', 
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveMutation.mutateAsync({
                teamId: team.id.toString(),
                userId: user.id
              });
            } catch (error) {
              Alert.alert('Fel', error.message);
            }
          }
        }
      ]
    );
  };
  
  const renderMemberItem = ({ item }: { item: TeamMemberType }) => {
    const isCurrentUser = item.userId.toString() === currentUser;
    const isItemOwner = item.userId.toString() === team.ownerId.toString();
    const canChangeRole = canManageRoles && !isItemOwner && (!isCurrentUser || isOwner);
    
    return (
      <View style={styles.memberItem}>
        <View style={styles.memberInfo}>
          <Avatar.Text 
            size={40} 
            label={item.userId.toString().substring(0, 2).toUpperCase()} 
            style={styles.avatar} 
          />
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>
              {item.userId.toString().substring(0, 8)}
              {isCurrentUser ? ' (Du)' : ''}
            </Text>
            <Text style={styles.memberRole}>
              {getTeamRoleLabel(item.role as TeamRole)}
            </Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          {canChangeRole && (
            <Menu
              visible={menuVisible === item.userId.toString()}
              onDismiss={closeMenu}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => openMenu(item.userId.toString())}
                  testID={`team-member-menu-${item.userId.toString()}`}
                />
              }
            >
              {Object.values(TeamRole).map(role => (
                <Menu.Item
                  key={role}
                  onPress={() => handleRoleChange(item, role)}
                  title={getTeamRoleLabel(role as TeamRole)}
                  disabled={loading === item.userId.toString() || item.role === role}
                />
              ))}
            </Menu>
          )}
          
          {isCurrentUser && !isOwner && (
            <Button 
              mode="text" 
              color="red" 
              onPress={handleLeaveTeam} 
              disabled={leaveMutation.isPending}
              testID="leave-team-button"
            >
              Lämna
            </Button>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container} testID="team-member-list">
      <Text style={styles.title}>Teammedlemmar ({team.members.length})</Text>
      
      <FlatList
        data={team.members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.userId.toString()}
        ItemSeparatorComponent={() => <Divider />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  memberDetails: {
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 