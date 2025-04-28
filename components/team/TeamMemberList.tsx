import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MoveVertical as MoreVertical, UserMinus, Crown, Shield, Star, Mail } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { TeamMember, User } from '@/types';
import { useState } from 'react';

type TeamMemberListProps = {
  members: TeamMember[];
  currentUser?: User | null;
  onRemoveMember?: (userId: string) => void;
  onPromoteMember?: (userId: string, role: 'leader' | 'owner') => void;
  onDemoteMember?: (userId: string) => void;
};

export default function TeamMemberList({ 
  members, 
  currentUser,
  onRemoveMember,
  onPromoteMember,
  onDemoteMember
}: TeamMemberListProps) {
  const { colors } = useTheme();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  
  const currentUserRole = currentUser && 
    members.find(m => m.userId === currentUser.id)?.role;
  
  const isCurrentUserLeader = currentUserRole === 'leader';
  const isCurrentUserOwner = currentUserRole === 'owner';
  
  const toggleMemberActions = (memberId: string) => {
    setExpandedMember(expandedMember === memberId ? null : memberId);
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return colors.accent.pink;
      case 'leader':
        return colors.accent.yellow;
      default:
        return colors.primary.light;
    }
  };
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Star size={12} color={colors.background.dark} style={styles.roleIcon} />;
      case 'leader':
        return <Crown size={12} color={colors.background.dark} style={styles.roleIcon} />;
      default:
        return <Shield size={12} color={colors.text.main} style={styles.roleIcon} />;
    }
  };

  return (
    <View style={styles.container}>
      {members.filter(m => m.approvalStatus !== 'pending').sort((a, b) => {
        // Sort by role first (owner > leader > member)
        const roleOrder = { owner: 0, leader: 1, member: 2 };
        const roleA = roleOrder[a.role as keyof typeof roleOrder];
        const roleB = roleOrder[b.role as keyof typeof roleOrder];
        
        if (roleA !== roleB) return roleA - roleB;
        
        // Then sort by name
        return (a.user?.name || '').localeCompare(b.user?.name || '');
      }).map((member) => (
        <View key={member.id} style={styles.memberCard}>
          <View style={styles.memberContainer}>
            <View style={styles.memberInfo}>
              {member.user?.avatarUrl ? (
                <Image 
                  source={{ uri: member.user.avatarUrl }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary.light }]}>
                  <Text style={styles.avatarInitial}>
                    {member.user?.name?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
              
              <View style={styles.textContainer}>
                <View style={styles.nameContainer}>
                  <Text style={[styles.name, { color: colors.text.main }]}>
                    {member.user?.name || 'Unnamed User'}
                  </Text>                  
                </View>
                <View style={styles.emailContainer}>
                  <Mail size={12} color={colors.text.light} style={styles.emailIcon} />
                  <Text style={[styles.email, { color: colors.text.light }]}>
                    {member.user?.email || 'No email'}
                  </Text>
                  {member.userId === currentUser?.id && (
                    <Text style={[styles.youLabel, { color: colors.accent.yellow }]}>
                      (You)
                    </Text>
                  )}
                </View>
              </View>
            </View>
            
            <View style={styles.rightContainer}>
              <View style={[
                styles.roleBadge, 
                { backgroundColor: getRoleBadgeColor(member.role) }
              ]}>
                {getRoleIcon(member.role)}
                <Text style={[
                  styles.roleText,
                  { color: member.role !== 'member' ? colors.background.dark : colors.text.main }
                ]}>
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </Text>
              </View>
              
              {(isCurrentUserLeader || isCurrentUserOwner) && member.userId !== currentUser?.id && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => toggleMemberActions(member.id)}
                >
                  <MoreVertical size={20} color={colors.text.light} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {expandedMember === member.id && (isCurrentUserLeader || isCurrentUserOwner) && (
            <View style={styles.actionMenu}>
              {isCurrentUserOwner && member.role !== 'leader' && (
                <TouchableOpacity 
                  style={[styles.actionMenuItem, { borderBottomColor: colors.neutral[700], borderBottomWidth: 1 }]}
                  onPress={() => {
                    if (onPromoteMember) {
                      onPromoteMember(member.userId, 'leader');
                    }
                    setExpandedMember(null);
                  }}
                >
                  <Crown size={16} color={colors.accent.yellow} />
                  <Text style={[styles.actionMenuText, { color: colors.text.main }]}>
                    Promote to Leader
                  </Text>
                </TouchableOpacity>
              )}
              
              {isCurrentUserOwner && member.role === 'leader' && (
                <TouchableOpacity 
                  style={[styles.actionMenuItem, { borderBottomColor: colors.neutral[700], borderBottomWidth: 1 }]}
                  onPress={() => {
                    if (onPromoteMember) {
                      onPromoteMember(member.userId, 'owner');
                    }
                    setExpandedMember(null);
                  }}
                >
                  <Star size={16} color={colors.accent.pink} />
                  <Text style={[styles.actionMenuText, { color: colors.text.main }]}>
                    Transfer Ownership
                  </Text>
                </TouchableOpacity>
              )}
              
              {isCurrentUserOwner && member.role === 'leader' && (
                <TouchableOpacity 
                  style={[styles.actionMenuItem, { borderBottomColor: colors.neutral[700], borderBottomWidth: 1 }]}
                  onPress={() => {
                    if (onDemoteMember) {
                      onDemoteMember(member.userId);
                    }
                    setExpandedMember(null);
                  }}
                >
                  <Shield size={16} color={colors.primary.light} />
                  <Text style={[styles.actionMenuText, { color: colors.text.main }]}>
                    Demote to Member
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={() => {
                  if (onRemoveMember) {
                    onRemoveMember(member.userId);
                  }
                  setExpandedMember(null);
                }}
              >
                <UserMinus size={16} color={colors.error} />
                <Text style={[styles.actionMenuText, { color: colors.error }]}>
                  Remove from Team
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  memberCard: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
  },
  memberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: 'white',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameContainer: {
    marginBottom: 4,
  },
  name: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  emailIcon: {
    marginRight: 4,
  },
  youLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginLeft: 6,
  },
  email: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleIcon: {
    marginRight: 2,
  },
  roleText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  actionMenu: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionMenuText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  joinDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.5)'
  },
});