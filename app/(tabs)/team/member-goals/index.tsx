import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Plus, ArrowLeft, Users, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { getTeamMemberGoals } from '@/services/goalService';
import { Goal, GoalStatus, TeamMember } from '@/types';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import GoalCard from '@/components/goals/GoalCard';

export default function MemberGoalsScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<GoalStatus | 'all'>('active');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.team?.id && selectedMember) {
      loadMemberGoals();
    } else if (user?.team?.members && user.team.members.length > 0) {
      // Select first member by default
      const firstMember = user.team.members.find(m => m.userId !== user.id);
      if (firstMember) {
        setSelectedMember(firstMember.userId);
      }
    }
  }, [user?.team?.id, selectedMember, activeTab]);

  const loadMemberGoals = async () => {
    if (!user?.team?.id || !selectedMember) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const status = activeTab !== 'all' ? activeTab : undefined;
      const data = await getTeamMemberGoals(user.team.id, selectedMember, status);
      setGoals(data);
    } catch (error) {
      console.error('Error loading member goals:', error);
      setError('Could not load member goals');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is team leader or owner
  const isTeamLeader = user?.team?.members?.some(
    m => m.userId === user.id && (m.role === 'leader' || m.role === 'owner')
  );

  // Filter team members (exclude current user)
  const teamMembers = user?.team?.members?.filter(m => m.userId !== user.id) || [];

  // Get selected member name
  const selectedMemberName = user?.team?.members?.find(m => m.userId === selectedMember)?.user?.name || 'Team Member';

  if (!isTeamLeader) {
    router.replace('/team');
    return null;
  }

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Member Goals" 
        icon={Target}
        leftIcon={ArrowLeft}
        onLeftIconPress={() => router.push('/team')}
      />
      
      {/* Member Selection */}
      <View style={styles.memberSelection}>
        <Text style={[styles.sectionLabel, { color: colors.text.light }]}>
          Select Team Member:
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberList}
        >
          {teamMembers.map(member => (
            <TouchableOpacity
              key={member.userId}
              style={[
                styles.memberChip,
                selectedMember === member.userId && { backgroundColor: colors.accent.yellow }
              ]}
              onPress={() => setSelectedMember(member.userId)}
            >
              <User size={16} color={selectedMember === member.userId ? colors.background.dark : colors.text.light} />
              <Text style={[
                styles.memberName,
                selectedMember === member.userId && { color: colors.background.dark }
              ]}>
                {member.user?.name || 'Unknown'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <Tabs
        tabs={[
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Completed' },
          { id: 'all', label: 'All' },
        ]}
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab as GoalStatus | 'all')}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text.light }]}>
              Loading member goals...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
            <Button
              title="Try Again"
              onPress={loadMemberGoals}
              variant="outline"
              size="small"
              style={styles.retryButton}
            />
          </View>
        ) : goals.length > 0 ? (
          <>
            {/* Goals List */}
            <View style={styles.goalsContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                {selectedMemberName}'s {activeTab === 'active' ? 'Active' : 
                 activeTab === 'completed' ? 'Completed' : 'All'} Goals
              </Text>
              
              {goals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onPress={() => router.push(`/team/member-goals/${goal.id}`)}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary.light }]}>
              <Target size={48} color={colors.accent.yellow} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.main }]}>
              No Goals Set
            </Text>
            <Text style={[styles.emptyText, { color: colors.text.light }]}>
              Set individual goals for {selectedMemberName} to help them track progress and stay motivated.
            </Text>
            <Button
              title="Create Member Goal"
              icon={Plus}
              onPress={() => router.push('/team/member-goals/create')}
              variant="primary"
              size="large"
              style={styles.createButton}
            />
          </View>
        )}
      </ScrollView>
      
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent.yellow }]}
        onPress={() => router.push('/team/member-goals/create')}
        activeOpacity={0.8}
      >
        <Plus color={colors.background.dark} size={24} />
      </TouchableOpacity>
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
  },
  memberSelection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  memberList: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  memberName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
  goalsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
  },
  createButton: {
    minWidth: 200,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});