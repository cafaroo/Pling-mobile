import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, UserPlus, CircleAlert as AlertCircle, MessageSquare, CreditCard, Plus, Building2, Crown, Shield, Star, ChartBar as BarChart, Settings, ChevronRight, Trash2, CirclePlus as PlusCircle, Link, Bug, Target } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'expo-router';
import { getUserTeam, createTeam, getTeamInvitation, updateTeamName, removeTeamMember, changeTeamMemberRole, promoteToTeamOwner, createTeamInviteCode, joinTeamWithCode, getPendingTeamMembers, approveTeamMember } from '@/services/teamService';
import { useSubscription } from '@/hooks/useSubscription';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import TeamMemberList from '@/components/team/TeamMemberList';
import AddMemberModal from '@/components/team/AddMemberModal';
import InviteCodeModal from '@/components/team/InviteCodeModal';
import PendingApprovalCard from '@/components/team/PendingApprovalCard';
import PendingMembershipCard from '@/components/team/PendingMembershipCard';
import PendingInviteCard from '@/components/team/PendingInviteCard';
import { Team, TeamMember } from '@/types';

// 6-character alphanumeric code validation pattern
const INVITE_CODE_PATTERN = /^[A-Z0-9]{6}$/;

export default function TeamScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTeamName, setEditedTeamName] = useState('');
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isOrgOwner, setIsOrgOwner] = useState(false);
  const { subscription } = useSubscription(team?.id);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCodeData, setInviteCodeData] = useState<{ code: string; expiresAt: string } | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<TeamMember[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isApprovingMember, setIsApprovingMember] = useState(false);
  const [isPendingMember, setIsPendingMember] = useState(false);
  const [pendingTeamName, setPendingTeamName] = useState('');

  // Get current user's role and team leader status
  const currentUserRole = team?.members?.find(m => m.userId === user?.id)?.role;
  const isOwner = currentUserRole === 'owner';
  const isLeader = currentUserRole === 'leader' || isOwner;
  const isTeamLeader = isLeader; // This fixes the undefined reference
  const canManageTeam = isLeader || isOrgOwner;

  // Debug function to log the current state
  const logDebugInfo = () => {
    console.log('Debug Info:');
    console.log('isPendingMember:', isPendingMember);
    console.log('pendingTeamName:', pendingTeamName);
    console.log('team:', team);
    if (team) {
      console.log('Current user member:', team.members?.find(m => m.userId === user?.id));
    }
  };

  useEffect(() => {
    if (user) {
      loadTeamData();
    }
  }, [user]);

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user has a team
      if (user?.organizations?.length) {
        // User is part of an organization, check if they're an admin
        const isAdmin = user.organizations.some(org => org.role === 'admin');
        setIsOrgOwner(isAdmin);

        // TODO: In a real implementation, fetch all teams in the organization
        // For now, we'll just use the user's team
        const teamData = await getUserTeam(user.id);
        if (teamData) {
          setTeams([teamData]);
          setTeam(teamData);
          setSelectedTeam(teamData.id);
          
          // Check if current user is pending approval
          const currentUserMember = teamData.members?.find(m => m.userId === user.id);
          setIsPendingMember(currentUserMember?.approvalStatus === 'pending');
          setPendingTeamName(teamData.name);
          
          // Log debug info
          console.log('Team loaded, pending status:', currentUserMember?.approvalStatus);

          // Load pending members if user is leader or owner
          const userRole = teamData.members?.find(m => m.userId === user.id)?.role;
          if (userRole === 'leader' || userRole === 'owner') {
            await loadPendingMembers(teamData.id);
          }
        }
      } else {
        // Regular user, just get their team
        const teamData = await getUserTeam(user.id);
        if (teamData) {
          setTeam(teamData);
          setTeams([teamData]);
          setSelectedTeam(teamData.id);
          
          // Check if current user is pending approval
          const currentUserMember = teamData.members?.find(m => m.userId === user.id);
          setIsPendingMember(currentUserMember?.approvalStatus === 'pending');
          setPendingTeamName(teamData.name);
          
          // Log debug info
          console.log('Team loaded, pending status:', currentUserMember?.approvalStatus);

          // Load pending members if user is leader or owner
          const userRole = teamData.members?.find(m => m.userId === user.id)?.role;
          if (userRole === 'leader' || userRole === 'owner') {
            await loadPendingMembers(teamData.id);
          }
        }
      }

      // Check for pending invitation
      // Only check for invitation if user doesn't have a team
      if (!team && !isPendingMember) {
        const inviteData = await getTeamInvitation(user?.email || '');
        if (inviteData) {
          setInvitation(inviteData);
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      setError('Could not load team data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingMembers = async (teamId: string) => {
    try {
      setIsLoadingPending(true);
      const pendingMembersData = await getPendingTeamMembers(teamId);
      setPendingMembers(pendingMembersData);
    } catch (error) {
      console.error('Error loading pending members:', error);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const handleApproveMember = async (userId: string) => {
    if (!team) return;
    
    try {
      setIsApprovingMember(true);
      const success = await approveTeamMember(team.id, userId, true);
      
      if (success) {
        // Reload team data and pending members
        await loadTeamData();
      } else {
        setError('Failed to approve team member');
      }
    } catch (error) {
      console.error('Error approving team member:', error);
      setError('Failed to approve team member');
    } finally {
      setIsApprovingMember(false);
    }
  };

  const handleRejectMember = async (userId: string) => {
    if (!team) return;
    
    try {
      setIsApprovingMember(true);
      const success = await approveTeamMember(team.id, userId, false);
      
      if (success) {
        // Just remove from pending members list
        setPendingMembers(pendingMembers.filter(m => m.userId !== userId));
      } else {
        setError('Failed to reject team member');
      }
    } catch (error) {
      console.error('Error rejecting team member:', error);
      setError('Failed to reject team member');
    } finally {
      setIsApprovingMember(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    if (!team) return;
    
    try {
      setIsGeneratingCode(true);
      const codeData = await createTeamInviteCode(team.id);
      
      if (codeData) {
        setInviteCodeData(codeData);
      } else {
        setError('Failed to generate invite code');
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
      setError('Failed to generate invite code');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      setInviteError('Please enter an invite code');
      return;
    }

    // Validate that the invite code is a valid 6-character code
    if (!INVITE_CODE_PATTERN.test(inviteCode.trim().toUpperCase())) {
      setInviteError('Invalid invite code format. Please enter a 6-character code.');
      return;
    }

    try {
      setIsJoining(true);
      setInviteError(null);

      // Call API to join team with code
      const success = await joinTeamWithCode(inviteCode.trim());
      
      if (success) {
        await loadTeamData();
      } else {
        setInviteError('Invalid invite code');
      }
    } catch (error) {
      console.error('Error joining team:', error);
      setInviteError('Failed to join team');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const newTeam = await createTeam(newTeamName.trim(), user?.id || '');
      if (newTeam) {
        setTeam(newTeam);
        setShowCreateForm(false);
      } else {
        setError('Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      setError('Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAcceptInvitation = async () => {
    try {
      setIsJoining(true);
      // Accept invitation logic here
      await acceptTeamInvitation(invitation.token);
      await loadTeamData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Failed to accept invitation');
    } finally {
      setIsJoining(false);
    }
  };

  const handleAddMember = async (email: string, role: string) => {
    try {
      setError(null);
      // Call API to add team member
      const result = await addTeamMember(team?.id || '', email, role);
      
      if (result.member) {
        await loadTeamData(); // Refresh team data to show new member
        setShowAddMember(false); // Close the modal
      } else if (result.error) {
        setError(result.error);
      } else {
        setError('Failed to add team member');
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      setError('Failed to add team member');
    }
  };

  const handleEditTeam = async () => {
    if (!editedTeamName.trim() || !team) {
      return;
    }

    try {
      const success = await updateTeamName(team.id, editedTeamName.trim());
      if (success) {
        setTeam({ ...team, name: editedTeamName.trim() });
        setIsEditing(false);
      } else {
        setError('Failed to update team name');
      }
    } catch (error) {
      console.error('Error updating team name:', error);
      setError('Failed to update team name');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!team) return;
    
    try {
      setIsRemovingMember(true);
      const success = await removeTeamMember(team.id, userId);
      if (success) {
        // Update the team state by removing the member
        setTeam({
          ...team,
          members: team.members?.filter(m => m.userId !== userId) || []
        });
      } else {
        setError('Failed to remove team member');
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      setError('Failed to remove team member');
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handlePromoteMember = async (userId: string, newRole: 'leader' | 'owner') => {
    if (!team) return;
    
    try {
      setIsChangingRole(true);
      let success = false;
      
      if (newRole === 'owner') {
        success = await promoteToTeamOwner(team.id, userId);
      } else {
        success = await changeTeamMemberRole(team.id, userId, newRole);
      }
      
      if (success) {
        await loadTeamData(); // Reload team data to reflect new roles
      } else {
        setError(`Failed to promote member to ${newRole}`);
      }
    } catch (error) {
      console.error('Error changing member role:', error);
      setError('Failed to change member role');
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleDemoteMember = async (userId: string) => {
    if (!team) return;
    
    try {
      setIsChangingRole(true);
      const success = await changeTeamMemberRole(team.id, userId, 'member');
      
      if (success) {
        await loadTeamData(); // Reload team data to reflect new roles
      } else {
        setError('Failed to demote member');
      }
    } catch (error) {
      console.error('Error demoting member:', error);
      setError('Failed to demote member');
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleSelectTeam = (teamId: string) => {
    const selectedTeam = teams.find(t => t.id === teamId);
    if (selectedTeam) {
      setTeam(selectedTeam);
      setSelectedTeam(teamId);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header title="Team" icon={Users} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Loading team information...
          </Text>
        </View>
      </Container>
    );
  }

  if (team) {
    const currentUserRole = team.members?.find(m => m.userId === user?.id)?.role;
    const isOwner = currentUserRole === 'owner';
    const isLeader = currentUserRole === 'leader' || isOwner;
    const canManageTeam = isLeader || isOrgOwner;
    const subscriptionTier = subscription?.tier || 'free';
    const formattedTier = subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1);

    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header title="Team" icon={Users} />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Pending Membership Banner - Show when user is waiting for approval */}
          {isPendingMember && (
            <>
              <PendingMembershipCard teamName={pendingTeamName} />
              <Button
                title="Debug Membership Status"
                icon={Bug}
                onPress={logDebugInfo}
                variant="outline"
                size="small"
                style={styles.debugButton}
              />
            </>
          )}
          
          {/* Pending Approvals Card - Only visible for team leaders/owners when there are pending members */}
          {canManageTeam && pendingMembers.length > 0 && (
            <PendingApprovalCard
              pendingMembers={pendingMembers}
              onApprove={handleApproveMember}
              onReject={handleRejectMember}
              isLoading={isApprovingMember}
            />
          )}
          
          {/* Organization Owner View - Shows multiple teams */}
          {isOrgOwner && teams.length > 0 && (
            <Card style={styles.teamsCard}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text.main }]}>
                  Your Teams
                </Text>
                <TouchableOpacity 
                  style={styles.addTeamButton}
                  onPress={() => setShowCreateForm(true)}
                >
                  <PlusCircle size={20} color={colors.accent.yellow} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.teamsList}>
                {teams.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.teamItem,
                      selectedTeam === t.id && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                    ]}
                    onPress={() => handleSelectTeam(t.id)}
                  >
                    <TouchableOpacity
                      style={styles.teamItemContent}
                      onPress={() => router.push(`/team/${t.id}`)}
                    >
                      <View style={[styles.teamIconContainer, { backgroundColor: colors.primary.light }]}>
                        <Users size={16} color={colors.accent.yellow} />
                      </View>
                      <View style={styles.teamItemInfo}>
                        <Text style={[styles.teamItemName, { color: colors.text.main }]}>
                          {t.name}
                        </Text>
                        <Text style={[styles.teamItemMeta, { color: colors.text.light }]}>
                          {t.members?.length || 0} members • {formattedTier} plan
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}


          {/* Team Members Card */}
          <Card style={styles.membersCard}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text.main }]}>
                Team Members
              </Text>
              <View style={styles.teamActions}>
                {canManageTeam && (
                  <Button
                    title="Invite"
                    icon={Link}
                    onPress={() => setShowInviteCode(true)}
                    variant="outline"
                    size="small"
                    style={styles.actionButton}
                  />
                )}
                <Button
                  title="Add"
                  icon={UserPlus}
                  onPress={() => setShowAddMember(true)}
                  variant="outline"
                  size="small"
                  style={styles.actionButton}
                />
              </View>
            </View>
            
            {team.members && team.members.length > 0 && (
              <TeamMemberList 
                members={team.members} 
                currentUser={user}
                onRemoveMember={canManageTeam ? handleRemoveMember : undefined}
                onPromoteMember={isOwner ? handlePromoteMember : undefined}
                onDemoteMember={isOwner ? handleDemoteMember : undefined}
              />
            )}
          </Card>

          {/* Quick Actions Card */}
          <Card style={styles.quickActionsCard}>
            <Text style={[styles.cardTitle, { color: colors.text.main, marginBottom: 16 }]}>
              Quick Actions
            </Text>
            
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push('/chat')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.accent.yellow }]}>
                  <MessageSquare color={colors.background.dark} size={20} />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text.main }]}>
                  Team Chat
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push('/team/analytics')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.primary.light }]}>
                  <BarChart color={colors.background.dark} size={20} />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text.main }]}>
                  Analytics
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push('/team/goals')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.accent.pink }]}>
                  <Target color={colors.background.dark} size={20} />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text.main }]}>
                  Team Goals
                </Text>
              </TouchableOpacity>
              
              {isTeamLeader && (
                <TouchableOpacity 
                  style={styles.quickAction}
                  onPress={() => router.push('/team/member-goals')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.success }]}>
                    <Target color={colors.background.dark} size={20} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text.main }]}>
                    Member Goals
                  </Text>
                </TouchableOpacity>
              )}
              
              {canManageTeam && (
                <TouchableOpacity 
                  style={styles.quickAction}
                  onPress={() => router.push('/team/subscription')}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.accent.pink }]}>
                    <CreditCard color={colors.background.dark} size={20} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text.main }]}>
                    Subscription
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
          
          <View style={styles.organizationSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
              Multi-Team Management
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.text.light }]}>
              Create or join an organization to manage multiple teams in one place
            </Text>
            
            <Button
              title="View Organizations"
              icon={Building2}
              onPress={() => router.push('/team/organizations')}
              variant="outline"
              size="large"
              style={styles.orgButton}
            />
          </View>
        </ScrollView>

        <AddMemberModal
          visible={showAddMember}
          onClose={() => setShowAddMember(false)}
          onAdd={handleAddMember}
        />
        
        <InviteCodeModal
          visible={showInviteCode}
          onClose={() => setShowInviteCode(false)}
          code={inviteCodeData?.code || null}
          expiresAt={inviteCodeData?.expiresAt || null}
          isLoading={isGeneratingCode}
          onGenerateCode={handleGenerateInviteCode}
        />
      </Container>
    );
  }

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.main]}
        style={styles.background}
      />
      <Header title="Team" icon={Users} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.centerContent}>
        <Card style={styles.welcomeCard}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
            style={styles.welcomeImage}
          />
          <Text style={[styles.welcomeTitle, { color: colors.text.main }]}>
            Join Your Team
          </Text>
          <Text style={[styles.welcomeText, { color: colors.text.light }]}>
            Connect with your colleagues and track your success together
          </Text>

          {invitation ? (
            <PendingInviteCard
              invitation={invitation}
              onAccept={handleAcceptInvitation}
              isLoading={isJoining}
              style={styles.invitationCard}
            />
          ) : showCreateForm ? (
            <View style={styles.formContainer}>
              <Text style={[styles.formLabel, { color: colors.text.main }]}>
                Team Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.neutral[500],
                    color: colors.text.main,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  },
                ]}
                value={newTeamName}
                onChangeText={setNewTeamName}
                placeholder="Enter team name"
                placeholderTextColor={colors.neutral[400]}
              />
              {error && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              )}
              <View style={styles.buttonGroup}>
                <Button
                  title="Cancel"
                  variant="outline"
                  size="large"
                  onPress={() => setShowCreateForm(false)}
                  style={styles.cancelButton}
                />
                <Button
                  title="Create Team"
                  icon={Plus}
                  onPress={handleCreateTeam}
                  variant="primary"
                  size="large"
                  loading={isCreating}
                  style={styles.createButton}
                />
              </View>
            </View>
          ) : (
            <View style={styles.actionContainer}>
              <View style={styles.joinContainer}>
                <Text style={[styles.joinTitle, { color: colors.text.main }]}>
                  Have an invite code?
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.neutral[500],
                      color: colors.text.main,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    },
                  ]}
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={colors.neutral[400]}
                  maxLength={6}
                  autoCapitalize="characters"
                />
                {inviteError && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {inviteError}
                  </Text>
                )}
                <Button
                  title="Join Team"
                  icon={UserPlus}
                  onPress={handleJoinTeam}
                  variant="primary"
                  size="large"
                  loading={isJoining}
                  style={styles.actionButton}
                />
              </View>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.neutral[700] }]} />
                <Text style={[styles.dividerText, { color: colors.text.light }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.neutral[700] }]} />
              </View>

              <Button
                title="Create New Team"
                icon={Plus}
                onPress={() => setShowCreateForm(true)}
                variant="outline"
                size="large"
                style={styles.createButton}
              />
              
              <View style={styles.organizationOption}>
                <Text style={[styles.organizationText, { color: colors.text.light }]}>
                  Need to manage multiple teams?
                </Text>
                <Button
                  title="Create Organization"
                  icon={Building2}
                  onPress={() => router.push('/team/organizations/create')}
                  variant="outline"
                  size="medium"
                  style={styles.organizationButton}
                />
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    gap: 20,
  },
  centerContent: {
    padding: 20,
    paddingBottom: 100,
    minHeight: '100%',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  teamContainer: {
    flex: 1,
  },
  teamsCard: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginBottom: 0,
  },
  teamCard: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginBottom: 0,
  },
  membersCard: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginBottom: 0,
  },
  quickActionsCard: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  teamsList: {
    gap: 8,
  },
  teamItem: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  teamItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  teamIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamItemInfo: {
    flex: 1,
  },
  teamItemName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 2,
  },
  teamItemMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  addTeamButton: {
    padding: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  quickAction: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  organizationSection: {
    marginTop: 32,
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  sectionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  orgButton: {
    minWidth: 200,
  },
  welcomeCard: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  welcomeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  welcomeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginTop: 24,
  },
  welcomeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  invitationCard: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  formContainer: {
    padding: 24,
  },
  formLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  createButton: {
    flex: 1,
  },
  actionContainer: {
    padding: 24,
  },
  joinContainer: {
    marginBottom: 24,
  },
  joinTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginHorizontal: 16,
  },
  organizationOption: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  organizationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  organizationButton: {
    minWidth: 180,
  },
  debugButton: {
    alignSelf: 'center',
    marginTop: 8,
  }
});