import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Plus, ArrowLeft, Users, TrendingUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { getTeamGoals } from '@/services/goalService';
import { Goal, GoalStatus } from '@/types';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import GoalCard from '@/components/goals/GoalCard';

export default function TeamGoalsScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<GoalStatus | 'all'>('active');
  
  useEffect(() => {
    if (user?.team?.id) {
      loadGoals();
    }
  }, [user?.team?.id, activeTab]);

  const loadGoals = async () => {
    if (!user?.team?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const status = activeTab !== 'all' ? activeTab : undefined;
      const data = await getTeamGoals(user.team.id, status);
      setGoals(data);
    } catch (error) {
      console.error('Error loading team goals:', error);
      setError('Could not load team goals');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is team leader or owner
  const isTeamLeader = user?.team?.members?.some(
    m => m.userId === user.id && (m.role === 'leader' || m.role === 'owner')
  );

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Team Goals" 
        icon={Target}
        leftIcon={ArrowLeft}
        onLeftIconPress={() => router.push('/team')}
      />
      
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
              Loading team goals...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
            <Button
              title="Try Again"
              onPress={loadGoals}
              variant="outline"
              size="small"
              style={styles.retryButton}
            />
          </View>
        ) : goals.length > 0 ? (
          <>
            {/* Summary Card */}
            <Card style={styles.summaryCard}>
              <Text style={[styles.summaryTitle, { color: colors.text.main }]}>
                Team Progress
              </Text>
              
              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                  <TrendingUp size={20} color={colors.accent.yellow} />
                  <Text style={[styles.statValue, { color: colors.text.main }]}>
                    {goals.filter(g => g.status === 'active').length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.light }]}>
                    Active Goals
                  </Text>
                </View>
                
                <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                  <Target size={20} color={colors.accent.yellow} />
                  <Text style={[styles.statValue, { color: colors.text.main }]}>
                    {goals.filter(g => g.status === 'completed').length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.light }]}>
                    Completed
                  </Text>
                </View>
                
                <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                  <Users size={20} color={colors.accent.yellow} />
                  <Text style={[styles.statValue, { color: colors.text.main }]}>
                    {new Set(goals.map(g => g.createdBy)).size}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.light }]}>
                    Contributors
                  </Text>
                </View>
              </View>
            </Card>
            
            {/* Goals List */}
            <View style={styles.goalsContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                {activeTab === 'active' ? 'Active Team Goals' : 
                 activeTab === 'completed' ? 'Completed Team Goals' : 'All Team Goals'}
              </Text>
              
              {goals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onPress={() => router.push(`/team/goals/${goal.id}`)}
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
              No Team Goals Yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.text.light }]}>
              Set team goals to track your collective progress and motivate your team.
            </Text>
            {isTeamLeader && (
              <Button
                title="Create Team Goal"
                icon={Plus}
                onPress={() => router.push('/team/goals/create')}
                variant="primary"
                size="large"
                style={styles.createButton}
              />
            )}
          </View>
        )}
      </ScrollView>
      
      {isTeamLeader && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent.yellow }]}
          onPress={() => router.push('/team/goals/create')}
          activeOpacity={0.8}
        >
          <Plus color={colors.background.dark} size={24} />
        </TouchableOpacity>
      )}
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
  summaryCard: {
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginVertical: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
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