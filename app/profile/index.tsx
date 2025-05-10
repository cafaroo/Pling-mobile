import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Bell, LogOut, Award, Zap, TrendingUp, CircleAlert as AlertCircle, Target } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useAuth } from '@/context/AuthContext';
import { getUserStats, getUserBadges } from '@/services/userService';
import { getUserGoals } from '@/services/goalService';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import StatBox from '@/components/profile/StatBox';
import BadgeItem from '@/components/profile/BadgeItem';
import GoalCard from '@/components/goals/GoalCard';
import { UserStats, Badge, Goal } from '@/types';
import { router } from 'expo-router';

/**
 * Detta är en kopia av ProfileScreen från app/(tabs)/profile.tsx
 * för att stödja både /profile och /profile/index routes
 */
export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const { signOut } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userStats = await getUserStats(user?.id || '');
      setStats(userStats);
      const userBadges = await getUserBadges(user?.id || '');
      setBadges(userBadges);
      
      // Load user's active goals
      const userGoals = await getUserGoals(user?.id || '', 'active');
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  if (!user) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text.main }}>Laddar profil...</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Min profil" 
        icon={User}
        rightIcon={Bell}
        onRightIconPress={() => {}}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileHeader}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary.light }]}>
              <Text style={styles.avatarInitial}>
                {user.name ? user.name.charAt(0) : '?'}
              </Text>
            </View>
          )}
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text.main }]}>
              {user.name || 'Unnamed User'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.text.light }]}>{user.email}</Text>
            
            {stats?.level && (
              <View style={[styles.levelBadge, { backgroundColor: colors.accent.yellow }]}>
                <Text style={styles.levelText}>Nivå {stats.level}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.logoutButton, { borderColor: colors.neutral[500] }]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color={colors.text.light} />
          </TouchableOpacity>
        </View>
        
        {stats && (
          <View style={styles.statsGrid}>
            <StatBox 
              title="Vecka" 
              value={`${new Intl.NumberFormat('sv-SE').format(stats.weekAmount)} kr`}
              icon={Zap}
              color={colors.accent.yellow}
            />
            <StatBox 
              title="Månad" 
              value={`${new Intl.NumberFormat('sv-SE').format(stats.monthAmount)} kr`}
              icon={TrendingUp}
              color={colors.accent.pink}
            />
            <StatBox 
              title="Største affär" 
              value={`${new Intl.NumberFormat('sv-SE').format(stats.largestSale)} kr`}
              icon={Award}
              color={colors.success}
            />
            <StatBox 
              title="Antal plingar" 
              value={stats.totalSales.toString()}
              icon={AlertCircle}
              color={colors.primary.light}
            />
          </View>
        )}
        
        {badges.length > 0 && (
          <Card style={styles.badgesCard}>
            <Text style={[styles.badgesTitle, { color: colors.text.main }]}>
              Dina badges
            </Text>
            <View style={styles.badgesList}>
              {badges.map((badge) => (
                <BadgeItem key={badge.id} badge={badge} />
              ))}
            </View>
          </Card>
        )}
        
        {/* Personal Goals Section */}
        {goals.length > 0 && (
          <Card style={styles.goalsCard}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Personal Goals
              </Text>
              <TouchableOpacity onPress={() => router.push('/goals')}>
                <Text style={[styles.viewAllText, { color: colors.accent.yellow }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={goals.slice(0, 2)}
              renderItem={({ item }) => (
                <GoalCard
                  goal={item}
                  onPress={() => router.push(`/goals/${item.id}`)}
                  style={styles.goalCard}
                />
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </Card>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: 'white',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  levelText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#1E1B4B',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  badgesCard: {
    marginBottom: 24,
    padding: 20,
  },
  badgesTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  goalsCard: {
    marginBottom: 24,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  viewAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  goalCard: {
    marginBottom: 12,
  },
}); 