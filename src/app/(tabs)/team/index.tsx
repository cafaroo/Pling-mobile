import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Platform,
  ImageBackground,
  FlatList,
  ViewStyle
} from 'react-native';
import { Text, Avatar, Divider, Button, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Users,
  ChevronRight,
  TrendingUp,
  Award,
  Bell,
  Filter,
  Search,
  ArrowUp,
  ArrowDown,
  Star,
  Crown,
  BarChart3,
  Calendar,
  Zap,
  MessageCircle
} from 'lucide-react-native';
import BottomNavigation from '@/components/BottomNavigation';

// Platform check
const IS_WEB = Platform.OS === 'web';
const { width, height } = Dimensions.get('window');

// Glass Card Component
interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style, intensity = 20 }) => {
  if (IS_WEB) {
    return (
      <View style={[styles.webGlassCard, style]}>
        {children}
      </View>
    );
  }
  
  return (
    <View style={[styles.glassCardContainer, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassCardContent}>
        {children}
      </View>
    </View>
  );
};

// Team Member Item Component
interface TeamMemberProps {
  id: number;
  name: string;
  title: string;
  sales: string;
  plings: number;
  trend: number;
  isTeamLead?: boolean;
  avatar?: string;
}

interface TeamMemberItemProps {
  member: TeamMemberProps;
  index: number;
  onPress: (member: TeamMemberProps) => void;
  delay?: number;
}

const TeamMemberItem: React.FC<TeamMemberItemProps> = ({ member, index, onPress, delay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        })
      ])
    ]).start();
  }, []);
  
  // Determine if this member is a top performer
  const isTopPerformer = index < 3;
  
  return (
    <Animated.View
      style={[
        styles.memberItemContainer,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.memberItem}
        onPress={() => onPress(member)}
        activeOpacity={0.7}
      >
        <View style={styles.memberRankContainer}>
          {isTopPerformer ? (
            <LinearGradient
              colors={
                index === 0 ? ['#FACC15', '#F59E0B'] as const : // Gold
                index === 1 ? ['#E2E8F0', '#94A3B8'] as const : // Silver
                              ['#D97706', '#B45309'] as const   // Bronze
              }
              style={styles.rankBadge}
            >
              <Crown size={14} color={index === 0 ? '#1E1B4B' : '#FFFFFF'} />
            </LinearGradient>
          ) : (
            <View style={[styles.rankBadge, styles.regularRank]}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
          )}
        </View>
        
        <Avatar.Image 
          size={50} 
          source={member.avatar ? { uri: member.avatar } : require('@assets/images/avatar-placeholder.png')} 
          style={[
            styles.memberAvatar,
            {
              backgroundColor: 
                index === 0 ? '#FACC15' : // Gold
                index === 1 ? '#94A3B8' : // Silver
                index === 2 ? '#B45309' : // Bronze
                'rgba(91, 33, 182, 0.5)' // Default
            }
          ]}
        />
        
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{member.name}</Text>
            {member.isTeamLead && (
              <View style={styles.teamLeadBadge}>
                <Star size={12} color="#FACC15" />
                <Text style={styles.teamLeadText}>Team Lead</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.memberTitle}>{member.title}</Text>
          
          <View style={styles.memberStatsRow}>
            <View style={styles.memberStatItem}>
              <TrendingUp size={12} color="#FACC15" />
              <Text style={styles.memberStatText}>{member.sales}</Text>
            </View>
            
            <View style={styles.memberStatDivider} />
            
            <View style={styles.memberStatItem}>
              <Bell size={12} color="#FACC15" />
              <Text style={styles.memberStatText}>{member.plings} pling</Text>
            </View>
            
            {member.trend !== 0 && (
              <>
                <View style={styles.memberStatDivider} />
                
                <View style={styles.memberStatItem}>
                  {member.trend > 0 ? (
                    <ArrowUp size={12} color="#10B981" />
                  ) : (
                    <ArrowDown size={12} color="#EF4444" />
                  )}
                  <Text 
                    style={[
                      styles.memberStatText,
                      { color: member.trend > 0 ? '#10B981' : '#EF4444' }
                    ]}
                  >
                    {Math.abs(member.trend)}%
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
        
        <ChevronRight size={20} color="rgba(255, 255, 255, 0.5)" />
      </TouchableOpacity>
      
      <Divider style={styles.memberDivider} />
    </Animated.View>
  );
};

// Team Stat Card Component
interface TeamStatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  colors: readonly [string, string, ...string[]];
  delay?: number;
}

const TeamStatCard: React.FC<TeamStatCardProps> = ({ title, value, icon, colors, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        })
      ])
    ]).start();
  }, []);
  
  return (
    <Animated.View
      style={[
        styles.statCardContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={colors}
        style={styles.statCard}
      >
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
        {icon}
      </LinearGradient>
    </Animated.View>
  );
};

// Performance Chart Component
interface ChartDataItem {
  label: string;
  value: number;
  color: string;
}

interface PerformanceChartProps {
  data: ChartDataItem[];
  delay?: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, delay = 0 }) => {
  const barHeights = data.map(() => useRef(new Animated.Value(0)).current);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.stagger(100, 
        barHeights.map(height => 
          Animated.timing(height, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic)
          })
        )
      )
    ]).start();
  }, []);
  
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <Animated.View
      style={[
        styles.chartContainer,
        { opacity: opacityAnim }
      ]}
    >
      <Text style={styles.chartTitle}>Försäljning per veckodag</Text>
      
      <View style={styles.chartContent}>
        {data.map((item, index) => (
          <View key={item.label} style={styles.chartBarContainer}>
            <View style={styles.chartLabelContainer}>
              <Animated.View 
                style={[
                  styles.chartBar,
                  {
                    backgroundColor: item.color,
                    transform: [
                      { 
                        scaleY: barHeights[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.1, item.value / maxValue]
                        })
                      }
                    ]
                  }
                ]}
              />
              <Text style={styles.chartBarValue}>{item.value}k</Text>
            </View>
            <Text style={styles.chartBarLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Filter Button Component
interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, isActive, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        isActive && styles.activeFilterButton
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text 
        style={[
          styles.filterButtonText,
          isActive && styles.activeFilterButtonText
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default function TeamScreen() {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const filterSlideAnim = useRef(new Animated.Value(-100)).current;
  
  // Mock data
  const mockTeam = {
    name: 'Team Alpha',
    members: 12,
    activeSince: 'Mars 2023',
    stats: {
      totalSales: '2.4M kr',
      weeklyAverage: '320k kr',
      activePlings: 24,
      competitions: 5
    },
    members: [
      { 
        id: 1, 
        name: 'Anna Lindberg', 
        title: 'Senior säljare',
        sales: '450k kr',
        plings: 32,
        trend: 12,
        isTeamLead: true
      },
      { 
        id: 2, 
        name: 'Erik Svensson', 
        title: 'Säljspecialist',
        sales: '380k kr',
        plings: 28,
        trend: 5
      },
      { 
        id: 3, 
        name: 'Maria Karlsson', 
        title: 'Säljare',
        sales: '310k kr',
        plings: 22,
        trend: -3
      },
      { 
        id: 4, 
        name: 'Johan Berg', 
        title: 'Säljare',
        sales: '290k kr',
        plings: 19,
        trend: 8
      },
      { 
        id: 5, 
        name: 'Sofia Nilsson', 
        title: 'Junior säljare',
        sales: '210k kr',
        plings: 15,
        trend: 15
      },
      { 
        id: 6, 
        name: 'Anders Lund', 
        title: 'Säljare',
        sales: '180k kr',
        plings: 12,
        trend: 0
      },
      { 
        id: 7, 
        name: 'Emma Björk', 
        title: 'Junior säljare',
        sales: '150k kr',
        plings: 10,
        trend: 7
      }
    ],
    performanceData: [
      { label: 'Mån', value: 42, color: '#FACC15' },
      { label: 'Tis', value: 58, color: '#EC4899' },
      { label: 'Ons', value: 35, color: '#6366F1' },
      { label: 'Tor', value: 70, color: '#5B21B6' },
      { label: 'Fre', value: 88, color: '#10B981' },
      { label: 'Lör', value: 30, color: '#F59E0B' },
      { label: 'Sön', value: 25, color: '#EF4444' }
    ]
  };
  
  // Filter members based on search query and active filter
  const filteredMembers = mockTeam.members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'trending' && member.trend > 0) return matchesSearch;
    if (activeFilter === 'top' && mockTeam.members.indexOf(member) < 3) return matchesSearch;
    
    return false;
  });
  
  // Entry animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      })
    ]).start();
  }, []);
  
  // Toggle filters animation
  useEffect(() => {
    Animated.timing(filterSlideAnim, {
      toValue: showFilters ? 0 : -100,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [showFilters]);
  
  // Handle member press
  const handleMemberPress = (member: TeamMemberProps) => {
    console.log('Member pressed:', member);
    // Navigate to member details
    // router.push(`/team/${member.id}`);
  };
  
  return (
    <>
      <StatusBar style="light" />
      
      <Stack.Screen
        options={{
          title: 'Team',
          headerStyle: {
            backgroundColor: '#5B21B6', // Primary color
          },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />
      
      <ImageBackground
        style={styles.emptyStateBackground}
        source={require('@assets/images/pling_confetti_bg.png')}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Team Header */}
            <Animated.View 
              style={[
                styles.teamHeader,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <LinearGradient
                colors={['rgba(91, 33, 182, 0.8)', 'rgba(124, 58, 237, 0.8)']}
                style={styles.headerGradient}
              >
                <View style={styles.headerContent}>
                  <View style={styles.teamIconContainer}>
                    <Users size={32} color="#FFFFFF" />
                  </View>
                  
                  <Text style={styles.teamName}>{mockTeam.name}</Text>
                  
                  <View style={styles.teamInfoRow}>
                    <View style={styles.teamInfoItem}>
                      <Users size={16} color="rgba(255, 255, 255, 0.7)" />
                      <Text style={styles.teamInfoText}>{mockTeam.members.length} medlemmar</Text>
                    </View>
                    <View style={styles.teamInfoDivider} />
                    <View style={styles.teamInfoItem}>
                      <Calendar size={16} color="rgba(255, 255, 255, 0.7)" />
                      <Text style={styles.teamInfoText}>Aktivt sedan {mockTeam.activeSince}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.teamActionButton}>
                    <MessageCircle size={16} color="#FFFFFF" />
                    <Text style={styles.teamActionText}>Teamchatt</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
            
            {/* Team Stats */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Teamets resultat</Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statsScrollContent}
              >
                <TeamStatCard 
                  title="Total försäljning"
                  value={mockTeam.stats.totalSales}
                  icon={<TrendingUp size={24} color="#FFFFFF" />}
                  colors={['#FACC15', '#F59E0B'] as const}
                  delay={100}
                />
                
                <TeamStatCard 
                  title="Veckosnitt"
                  value={mockTeam.stats.weeklyAverage}
                  icon={<BarChart3 size={24} color="#FFFFFF" />}
                  colors={['#EC4899', '#DB2777'] as const}
                  delay={200}
                />
                
                <TeamStatCard 
                  title="Aktiva pling"
                  value={mockTeam.stats.activePlings.toString()}
                  icon={<Bell size={24} color="#FFFFFF" />}
                  colors={['#6366F1', '#4F46E5'] as const}
                  delay={300}
                />
                
                <TeamStatCard 
                  title="Tävlingar"
                  value={mockTeam.stats.competitions.toString()}
                  icon={<Award size={24} color="#FFFFFF" />}
                  colors={['#5B21B6', '#7C3AED'] as const}
                  delay={400}
                />
              </ScrollView>
            </View>
            
            {/* Performance Chart */}
            <View style={styles.chartSection}>
              <GlassCard style={styles.chartCard}>
                <PerformanceChart 
                  data={mockTeam.performanceData}
                  delay={500}
                />
              </GlassCard>
            </View>
            
            {/* Team Members */}
            <View style={styles.membersSection}>
              <View style={styles.membersSectionHeader}>
                <Text style={styles.sectionTitle}>Teammedlemmar</Text>
                
                <TouchableOpacity 
                  style={styles.filterToggleButton}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Filter size={20} color="#FACC15" />
                </TouchableOpacity>
              </View>
              
              {/* Search and Filters */}
              <View style={styles.searchContainer}>
                <Searchbar
                  placeholder="Sök teammedlem..."
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={styles.searchbar}
                  inputStyle={styles.searchInput}
                  iconColor="rgba(255, 255, 255, 0.7)"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
                
                <Animated.View 
                  style={[
                    styles.filtersContainer,
                    { transform: [{ translateY: filterSlideAnim }] }
                  ]}
                >
                  <FilterButton 
                    label="Alla"
                    isActive={activeFilter === 'all'}
                    onPress={() => setActiveFilter('all')}
                  />
                  <FilterButton 
                    label="Trending"
                    isActive={activeFilter === 'trending'}
                    onPress={() => setActiveFilter('trending')}
                  />
                  <FilterButton 
                    label="Topp 3"
                    isActive={activeFilter === 'top'}
                    onPress={() => setActiveFilter('top')}
                  />
                </Animated.View>
              </View>
              
              {/* Members List */}
              <GlassCard style={styles.membersCard}>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member, index) => (
                    <TeamMemberItem
                      key={member.id}
                      member={member}
                      index={mockTeam.members.indexOf(member)} // Use original index for ranking
                      onPress={handleMemberPress}
                      delay={index * 100 + 600}
                    />
                  ))
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Search size={48} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={styles.noResultsText}>Inga medlemmar hittades</Text>
                    <Text style={styles.noResultsSubtext}>Försök med en annan sökterm</Text>
                  </View>
                )}
              </GlassCard>
            </View>
            
            {/* Extra padding for bottom navigation */}
            <View style={styles.bottomNavPadding} />
          </ScrollView>
        </SafeAreaView>
        
        {/* Bottom Navigation */}
        <BottomNavigation />
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 27, 75, 0.85)', // Dark blue with opacity
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  teamHeader: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerGradient: {
    borderRadius: 16,
  },
  headerContent: {
    padding: 20,
    alignItems: 'center',
  },
  teamIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  teamInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
  },
  teamInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  teamActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  teamActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsScrollContent: {
    paddingRight: 16,
  },
  statCardContainer: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    width: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statCard: {
    padding: 16,
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartSection: {
    marginBottom: 24,
  },
  chartCard: {
    padding: 16,
  },
  chartContainer: {
    width: '100%',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartLabelContainer: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartBar: {
    width: 8,
    height: '100%',
    borderRadius: 4,
  },
  chartBarValue: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    position: 'absolute',
    top: -20,
  },
  chartBarLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  membersSection: {
    marginBottom: 24,
  },
  membersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  searchInput: {
    color: '#FFFFFF',
  },
  filtersContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
  },
  filterButtonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeFilterButtonText: {
    color: '#FACC15',
    fontWeight: 'bold',
  },
  membersCard: {
    padding: 0,
    overflow: 'hidden',
  },
  memberItemContainer: {
    width: '100%',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  memberRankContainer: {
    marginRight: 12,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regularRank: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberAvatar: {
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: 8,
  },
  teamLeadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  teamLeadText: {
    fontSize: 10,
    color: '#FACC15',
    marginLeft: 2,
  },
  memberTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  memberStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberStatText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  memberStatDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  memberDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  noResultsContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomNavPadding: {
    height: 80,
  },
  glassCardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassCardContent: {
    padding: 16,
  },
  webGlassCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(91, 33, 182, 0.15)',
    backdropFilter: 'blur(10px)',
    padding: 16,
  },
  emptyStateBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 27, 75, 0.85)', // Dark blue with opacity
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  teamHeader: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerGradient: {
    borderRadius: 16,
  },
  headerContent: {
    padding: 20,
    alignItems: 'center',
  },
  teamIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  teamInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
  },
  teamInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  teamActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  teamActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsScrollContent: {
    paddingRight: 16,
  },
  statCardContainer: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    width: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statCard: {
    padding: 16,
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartSection: {
    marginBottom: 24,
  },
  chartCard: {
    padding: 16,
  },
  chartContainer: {
    width: '100%',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartLabelContainer: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartBar: {
    width: 8,
    height: '100%',
    borderRadius: 4,
  },
  chartBarValue: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    position: 'absolute',
    top: -20,
  },
  chartBarLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  membersSection: {
    marginBottom: 24,
  },
  membersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  searchInput: {
    color: '#FFFFFF',
  },
  filtersContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
  },
  filterButtonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeFilterButtonText: {
    color: '#FACC15',
    fontWeight: 'bold',
  },
  membersCard: {
    padding: 0,
    overflow: 'hidden',
  },
  memberItemContainer: {
    width: '100%',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  memberRankContainer: {
    marginRight: 12,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regularRank: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberAvatar: {
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: 8,
  },
  teamLeadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  teamLeadText: {
    fontSize: 10,
    color: '#FACC15',
    marginLeft: 2,
  },
  memberTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  memberStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberStatText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  memberStatDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  memberDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  noResultsContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomNavPadding: {
    height: 80,
  },
  glassCardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassCardContent: {
    padding: 16,
  },
  webGlassCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(91, 33, 182, 0.15)',
    backdropFilter: 'blur(10px)',
    padding: 16,
  },
}); 