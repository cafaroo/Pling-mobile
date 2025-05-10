import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  ViewStyle
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Text, Avatar, useTheme, Divider } from 'react-native-paper';
import { useUser } from '../../application/user/hooks/useUser';
import { LoadingSpinner } from '../../ui/shared/components/LoadingSpinner';
import { ErrorMessage } from '../../ui/shared/components/ErrorMessage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  Award, 
  TrendingUp, 
  Users, 
  ChevronRight, 
  Plus, 
  Settings,
  BarChart3,
  Crown
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';

// Platform check
const IS_WEB = Platform.OS === 'web';
const { width, height } = Dimensions.get('window');

// Glass Card Component types
interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

// Glass Card Component
const GlassCard = ({ children, style, intensity = 20 }: GlassCardProps) => {
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

// Main Dashboard Component
export default function Dashboard() {
  const theme = useTheme();
  const { data: user, isLoading, error } = useUser();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Mock data
  const mockData = {
    stats: {
      dailySales: '12 500 kr',
      rank: 3,
      weeklySales: '87 300 kr',
      plingCount: 8
    },
    activeCompetition: {
      title: 'Veckans utmaning',
      goal: 'Först till 50 000 kr',
      endDate: 'Fredag 16:00',
      progress: 65
    },
    topSellers: [
      { id: 1, name: 'Anna L.', amount: '23 500 kr', avatar: null },
      { id: 2, name: 'Erik S.', amount: '19 800 kr', avatar: null },
      { id: 3, name: 'Maria K.', amount: '15 200 kr', avatar: null, isCurrentUser: true },
    ],
    recentPlings: [
      { 
        id: 1, 
        user: 'Erik S.', 
        amount: '5 200 kr', 
        product: 'Premium-paket',
        timeAgo: '5 min sedan' 
      },
      { 
        id: 2, 
        user: 'Anna L.', 
        amount: '3 800 kr', 
        product: 'Konsulttjänst',
        timeAgo: '32 min sedan' 
      }
    ]
  };
  
  // Entry animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Cubic bezier curve, ersätter Easing.out(Easing.cubic)
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Cubic bezier curve
      }),
    ]).start();
  }, []);
  
  // Header animation based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !user) {
    return <ErrorMessage message={error?.message ?? 'Kunde inte ladda användardata'} />;
  }
  
  // Handle new pling action
  const handleNewPling = () => {
    // Använd en sträng som vi vet är giltig som ett relativt nav
    router.push('/new-pling' as any);
  };
  
  // Extrahera användarnamn säkert
  const firstName = user.profile?.firstName || '';
  const lastName = user.profile?.lastName || '';
  const initials = firstName.charAt(0) + (lastName ? lastName.charAt(0) : '');
  
  return (
    <>
      <StatusBar style="light" />
      
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerStyle: {
            backgroundColor: '#5B21B6', // Primary color
          },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.headerButton}>
                <Bell size={24} color="#FFFFFF" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>3</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Settings size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <ImageBackground 
        source={require('@assets/images/pling_confetti_bg.png')} 
        style={styles.confettiBg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {/* Welcome Banner */}
            <Animated.View 
              style={[
                styles.welcomeBanner,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <LinearGradient
                colors={['rgba(91, 33, 182, 0.8)', 'rgba(124, 58, 237, 0.8)']}
                style={styles.welcomeGradient}
              >
                <View style={styles.welcomeContent}>
                  <View>
                    <Text style={styles.welcomeText}>
                      Välkommen tillbaka
                    </Text>
                    <Text style={styles.nameText}>
                      {firstName}!
                    </Text>
                  </View>
                  
                  <Avatar.Text 
                    size={50} 
                    label={initials}
                    style={{ backgroundColor: "#EC4899"}}
                    color="#FFFFFF"
                  />
                </View>
              </LinearGradient>
            </Animated.View>
            
            {/* Stats Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dina resultat</Text>
              
              <View style={styles.statsGrid}>
                <GlassCard style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <LinearGradient
                      colors={['#FACC15', '#F59E0B']}
                      style={styles.statIconGradient}
                    >
                      <TrendingUp size={20} color="#1E1B4B" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.statValue}>{mockData.stats.dailySales}</Text>
                  <Text style={styles.statLabel}>Dagens försäljning</Text>
                </GlassCard>
                
                <GlassCard style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <LinearGradient
                      colors={['#EC4899', '#DB2777']}
                      style={styles.statIconGradient}
                    >
                      <Award size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.statValue}>#{mockData.stats.rank}</Text>
                  <Text style={styles.statLabel}>Din ranking</Text>
                </GlassCard>
                
                <GlassCard style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <LinearGradient
                      colors={['#6366F1', '#4F46E5']}
                      style={styles.statIconGradient}
                    >
                      <BarChart3 size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.statValue}>{mockData.stats.weeklySales}</Text>
                  <Text style={styles.statLabel}>Veckans försäljning</Text>
                </GlassCard>
                
                <GlassCard style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <LinearGradient
                      colors={['#5B21B6', '#7C3AED']}
                      style={styles.statIconGradient}
                    >
                      <Bell size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.statValue}>{mockData.stats.plingCount}</Text>
                  <Text style={styles.statLabel}>Antal pling</Text>
                </GlassCard>
              </View>
            </View>
            
            {/* Active Competition */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Aktiv tävling</Text>
                <TouchableOpacity style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>Se alla</Text>
                  <ChevronRight size={16} color="#FACC15" />
                </TouchableOpacity>
              </View>
              
              <GlassCard style={styles.competitionCard}>
                <View style={styles.competitionHeader}>
                  <View>
                    <Text style={styles.competitionTitle}>{mockData.activeCompetition.title}</Text>
                    <Text style={styles.competitionGoal}>{mockData.activeCompetition.goal}</Text>
                  </View>
                  <Award size={24} color="#FACC15" />
                </View>
                
                <View style={styles.competitionImageContainer}>
                  <Image 
                    source={require('@assets/images/splash-icon.png')} 
                    style={styles.competitionImage}
                    resizeMode="contain"
                  />
                </View>
                
                <View style={styles.competitionFooter}>
                  <View>
                    <Text style={styles.competitionEndLabel}>Slutar</Text>
                    <Text style={styles.competitionEndDate}>{mockData.activeCompetition.endDate}</Text>
                  </View>
                  
                  <View>
                    <View style={styles.progressLabelContainer}>
                      <Text style={styles.progressLabel}>Din framgång</Text>
                      <Text style={styles.progressPercentage}>{mockData.activeCompetition.progress}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { width: `${mockData.activeCompetition.progress}%` }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              </GlassCard>
            </View>
            
            {/* Top Sellers */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Topplista</Text>
                <TouchableOpacity style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>Se alla</Text>
                  <ChevronRight size={16} color="#FACC15" />
                </TouchableOpacity>
              </View>
              
              <GlassCard style={styles.leaderboardCard}>
                <View style={styles.leaderboardHeader}>
                  <Image 
                    source={require('@assets/images/logo.png')} 
                    style={styles.trophyImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.leaderboardTitle}>Veckans toppsäljare</Text>
                </View>
                
                <Divider style={styles.divider} />
                
                {mockData.topSellers.map((seller, index) => (
                  <View 
                    key={seller.id} 
                    style={[
                      styles.leaderboardItem,
                      seller.isCurrentUser && styles.currentUserItem,
                      index < mockData.topSellers.length - 1 && styles.itemWithBorder
                    ]}
                  >
                    <View style={styles.rankContainer}>
                      {index < 3 ? (
                        <LinearGradient
                          colors={
                            index === 0 ? ['#FACC15', '#F59E0B'] : // Gold
                            index === 1 ? ['#E2E8F0', '#94A3B8'] : // Silver
                                          ['#D97706', '#B45309']   // Bronze
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
                    
                    <Avatar.Text 
                      size={40} 
                      label={seller.name.split(' ').map(n => n[0]).join('')} 
                      style={{
                        backgroundColor: 
                          index === 0 ? '#FACC15' : // Gold
                          index === 1 ? '#94A3B8' : // Silver
                          index === 2 ? '#B45309' : // Bronze
                          seller.isCurrentUser ? '#EC4899' : // Pink for current user
                          'rgba(255, 255, 255, 0.2)' // Default
                      }}
                      color={index < 3 ? '#1E1B4B' : '#FFFFFF'}
                    />
                    
                    <View style={styles.sellerInfo}>
                      <Text style={[styles.sellerName, seller.isCurrentUser && styles.currentUserText]}>
                        {seller.name}
                        {seller.isCurrentUser && ' (Du)'}
                      </Text>
                      <Text style={styles.sellerAmount}>{seller.amount}</Text>
                    </View>
                    
                    <ChevronRight size={16} color="rgba(255, 255, 255, 0.5)" />
                  </View>
                ))}
              </GlassCard>
            </View>
            
            {/* Recent Plings */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Senaste pling</Text>
                <TouchableOpacity style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>Se alla</Text>
                  <ChevronRight size={16} color="#FACC15" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.plingList}>
                {mockData.recentPlings.map((pling, index) => (
                  <GlassCard key={pling.id} style={styles.plingCard}>
                    <View style={styles.plingHeader}>
                      <Avatar.Text 
                        size={40} 
                        label={pling.user.split(' ').map(n => n[0]).join('')} 
                        style={{
                          backgroundColor: index === 0 ? '#FACC15' : 'rgba(255, 255, 255, 0.2)'
                        }}
                        color={index === 0 ? '#1E1B4B' : '#FFFFFF'}
                      />
                      
                      <View style={styles.plingInfo}>
                        <Text style={styles.plingUser}>{pling.user}</Text>
                        <Text style={styles.plingTime}>{pling.timeAgo}</Text>
                      </View>
                      
                      {index === 0 && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>Ny</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.plingContent}>
                      <View style={styles.plingAmount}>
                        <Text style={styles.plingAmountValue}>{pling.amount}</Text>
                        <Text style={styles.plingProduct}>{pling.product}</Text>
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </View>
            </View>
            
            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Snabbåtgärder</Text>
              
              <View style={styles.actionsGrid}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleNewPling}
                >
                  <LinearGradient
                    colors={['#FACC15', '#F59E0B']} // Yellow gradient
                    style={styles.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Bell size={24} color="#1E1B4B" />
                  </LinearGradient>
                  <Text style={styles.actionText}>Nytt Pling</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <LinearGradient
                    colors={['#EC4899', '#DB2777']} // Pink gradient
                    style={styles.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Award size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.actionText}>Tävlingar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']} // Indigo gradient
                    style={styles.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <BarChart3 size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.actionText}>Statistik</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <LinearGradient
                    colors={['#5B21B6', '#7C3AED']} // Purple gradient
                    style={styles.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Users size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.actionText}>Team</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
        
        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleNewPling}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FACC15', '#F59E0B']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Plus size={24} color="#1E1B4B" />
          </LinearGradient>
        </TouchableOpacity>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  confettiBg: {
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
    paddingBottom: 80, // Extra padding for FAB
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  welcomeBanner: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  welcomeGradient: {
    padding: 16,
    paddingBottom: 0,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeImage: {
    width: '100%',
    height: 120,
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#FACC15',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
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
  competitionCard: {
    marginBottom: 8,
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  competitionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  competitionGoal: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  competitionImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  competitionImage: {
    width: '80%',
    height: 120,
  },
  competitionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  competitionEndLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginBottom: 4,
  },
  competitionEndDate: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: 150,
  },
  progressLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  progressPercentage: {
    color: '#FACC15',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    width: 150,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FACC15',
    borderRadius: 4,
  },
  leaderboardCard: {
    padding: 0,
    overflow: 'hidden',
  },
  leaderboardHeader: {
    padding: 16,
    alignItems: 'center',
  },
  trophyImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  leaderboardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentUserItem: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)', // Pink background for current user
  },
  rankContainer: {
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
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  currentUserText: {
    color: '#EC4899', // Pink for current user
  },
  sellerAmount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  plingList: {
    marginBottom: 8,
  },
  plingCard: {
    marginBottom: 12,
  },
  plingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  plingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  plingUser: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  plingTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  newBadge: {
    backgroundColor: '#FACC15',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newBadgeText: {
    color: '#1E1B4B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  plingContent: {
    marginTop: 8,
  },
  plingAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plingAmountValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  plingProduct: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabGradient: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 