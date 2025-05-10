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
  Image,
  ViewStyle
} from 'react-native';
import { Text, Avatar, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  User,
  Settings,
  LogOut,
  ChevronRight,
  Edit,
  Bell,
  Award,
  Zap,
  HelpCircle,
  Mail,
  Shield,
  Star,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react-native';
import { useAuth } from '@context/AuthContext';

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

// Achievement Badge Component
interface AchievementBadgeProps {
  icon: React.ReactNode;
  title: string;
  color: readonly [string, string, ...string[]];
  delay?: number;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ icon, title, color, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.7))
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
        styles.achievementContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={color}
        style={styles.achievementBadge}
      >
        {icon}
      </LinearGradient>
      <Text style={styles.achievementTitle}>{title}</Text>
    </Animated.View>
  );
};

// Menu Item Component
interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  delay?: number;
  last?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, description, onPress, delay = 0, last }) => {
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
  
  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuIconContainer}>
          {icon}
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuDescription}>{description}</Text>
        </View>
        <ChevronRight size={20} color="rgba(255, 255, 255, 0.5)" />
      </TouchableOpacity>
      <Divider style={styles.menuDivider} />
    </Animated.View>
  );
};

// Stat Item Component
interface StatItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  colors: readonly [string, string, ...string[]];
  delay?: number;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon, colors, delay = 0 }) => {
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
        styles.statItem,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={colors}
        style={styles.statIconContainer}
      >
        {icon}
      </LinearGradient>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const avatarScaleAnim = useRef(new Animated.Value(0.5)).current;

  // Mock data for demonstration
  const mockUser = {
    name: user?.name || 'Gustav Testsson',
    email: user?.email || 'gustav.test@example.com',
    avatarUrl: user?.avatarUrl || undefined,
    title: 'Toppsäljare',
    team: 'Team Alpha',
    joinDate: '15 mars 2023',
    stats: {
      totalSales: '1.2M kr',
      rank: '#3',
      plings: '145',
      competitions: '12'
    },
    achievements: [
      { id: 1, title: 'Stjärnsäljare', icon: Star, color: ['#FACC15', '#F59E0B'] as const },
      { id: 2, title: 'Teamplayer', icon: Users, color: ['#6366F1', '#4F46E5'] as const },
      { id: 3, title: 'Snabb start', icon: Zap, color: ['#EC4899', '#DB2777'] as const },
      { id: 4, title: 'Tävlingsvinnare', icon: Award, color: ['#5B21B6', '#7C3AED'] as const }
    ]
  };
  
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
      }),
      Animated.timing(avatarScaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      })
    ]).start();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation to login screen is handled by AuthProvider
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <>
      <StatusBar style="light" />
      
      <Stack.Screen
        options={{
          headerShown: false
        }}
      />
      
      <ImageBackground
        style={styles.confettiBg}
        source={require('@assets/images/pling_confetti_bg.png')}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Header */}
            <Animated.View 
              style={[
                styles.profileHeader,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <LinearGradient
                colors={['rgba(91, 33, 182, 0.8)', 'rgba(124, 58, 237, 0.8)']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.headerContent}>
                  <Animated.View 
                    style={[
                      styles.avatarContainer,
                      { transform: [{ scale: avatarScaleAnim }] }
                    ]}
                  >
                    <Avatar.Image 
                      size={100} 
                      source={mockUser.avatarUrl ? { uri: mockUser.avatarUrl } : require('@assets/images/avatar-placeholder.png')} 
                      style={styles.avatar}
                    />
                    <TouchableOpacity style={styles.editButton}>
                      <LinearGradient
                        colors={['#FACC15', '#F59E0B']}
                        style={styles.editButtonGradient}
                      >
                        <Edit size={16} color="#1E1B4B" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                  
                  <Text style={styles.userName}>{mockUser.name}</Text>
                  <Text style={styles.userTitle}>{mockUser.title}</Text>
                  
                  <View style={styles.userInfoRow}>
                    <View style={styles.userInfoItem}>
                      <Users size={16} color="rgba(255, 255, 255, 0.7)" />
                      <Text style={styles.userInfoText}>{mockUser.team}</Text>
                    </View>
                    <View style={styles.userInfoDivider} />
                    <View style={styles.userInfoItem}>
                      <Calendar size={16} color="rgba(255, 255, 255, 0.7)" />
                      <Text style={styles.userInfoText}>Sedan {mockUser.joinDate}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
            
            {/* User Stats */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Dina resultat</Text>
              
              <View style={styles.statsGrid}>
                <StatItem 
                  label="Total försäljning"
                  value={mockUser.stats.totalSales}
                  icon={<TrendingUp size={20} color="#FFFFFF" />}
                  colors={['#FACC15', '#F59E0B'] as const}
                  delay={100}
                />
                
                <StatItem 
                  label="Din ranking"
                  value={mockUser.stats.rank}
                  icon={<Award size={20} color="#FFFFFF" />}
                  colors={['#EC4899', '#DB2777'] as const}
                  delay={200}
                />
                
                <StatItem 
                  label="Antal pling"
                  value={mockUser.stats.plings}
                  icon={<Bell size={20} color="#FFFFFF" />}
                  colors={['#6366F1', '#4F46E5'] as const}
                  delay={300}
                />
                
                <StatItem 
                  label="Tävlingar"
                  value={mockUser.stats.competitions}
                  icon={<Zap size={20} color="#FFFFFF" />}
                  colors={['#5B21B6', '#7C3AED'] as const}
                  delay={400}
                />
              </View>
            </View>
            
            {/* Achievements */}
            <View style={styles.achievementsSection}>
              <Text style={styles.sectionTitle}>Utmärkelser</Text>
              
              <GlassCard style={styles.achievementsCard}>
                <View style={styles.achievementsGrid}>
                  {mockUser.achievements.map((achievement, index) => (
                    <AchievementBadge
                      key={achievement.id}
                      title={achievement.title}
                      icon={<achievement.icon size={24} color="#FFFFFF" />}
                      color={achievement.color}
                      delay={index * 100}
                    />
                  ))}
                </View>
              </GlassCard>
            </View>

            {/* Menu */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Inställningar</Text>
              
              <GlassCard style={styles.menuCard}>
                <MenuItem
                  icon={<User size={20} color="#FACC15" />}
                  title="Personlig information"
                  description="Hantera namn, e-post och kontaktuppgifter"
                  onPress={() => console.log('Navigate to Personal Info')}
                  delay={100}
                />
                
                <MenuItem
                  icon={<Settings size={20} color="#EC4899" />}
                  title="Inställningar"
                  description="Appens utseende, notiser och språk"
                  onPress={() => console.log('Navigate to Settings')}
                  delay={200}
                />
                
                <MenuItem
                  icon={<Bell size={20} color="#6366F1" />}
                  title="Notifikationer"
                  description="Hantera push-notiser och påminnelser"
                  onPress={() => console.log('Navigate to Notifications')}
                  delay={300}
                />
                
                <MenuItem
                  icon={<Shield size={20} color="#5B21B6" />}
                  title="Sekretess & Säkerhet"
                  description="Lösenord, datadelning och säkerhet"
                  onPress={() => console.log('Navigate to Privacy')}
                  delay={400}
                />
                
                <MenuItem
                  icon={<HelpCircle size={20} color="#10B981" />}
                  title="Hjälp & Support"
                  description="Vanliga frågor och kontakta support"
                  onPress={() => console.log('Navigate to Help')}
                  delay={500}
                  last={true}
                />
              </GlassCard>
            </View>
            
            {/* Contact */}
            <View style={styles.contactSection}>
              <GlassCard style={styles.contactCard}>
                <View style={styles.contactHeader}>
                  <Mail size={20} color="#FACC15" />
                  <Text style={styles.contactTitle}>Kontakta oss</Text>
                </View>
                <Text style={styles.contactText}>
                  Har du frågor eller behöver hjälp? Vårt supportteam finns här för dig.
                </Text>
                <TouchableOpacity style={styles.contactButton}>
                  <Text style={styles.contactButtonText}>Skicka meddelande</Text>
                </TouchableOpacity>
              </GlassCard>
            </View>

            {/* Sign Out Button */}
            {!showLogoutConfirm ? (
              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={() => setShowLogoutConfirm(true)}
              >
                <LogOut size={20} color="#EF4444" style={styles.signOutIcon} />
                <Text style={styles.signOutText}>Logga ut</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.logoutConfirmContainer}>
                <Text style={styles.logoutConfirmText}>Är du säker på att du vill logga ut?</Text>
                <View style={styles.logoutButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.logoutButton, styles.cancelButton]}
                    onPress={() => setShowLogoutConfirm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Avbryt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.logoutButton, styles.confirmButton]}
                    onPress={handleSignOut}
                  >
                    <Text style={styles.confirmButtonText}>Logga ut</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* App Version */}
            <Text style={styles.versionText}>Pling v1.0.0</Text>
            
            {/* Extra padding for bottom navigation */}
            <View style={styles.bottomNavPadding} />
          </ScrollView>
        </SafeAreaView>
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
    paddingBottom: 80,
  },
  profileHeader: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerGradient: {
    borderRadius: 16,
  },
  headerContent: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#5B21B6',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  editButtonGradient: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 16,
    color: '#FACC15',
    marginBottom: 16,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
  },
  userInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementsCard: {
    padding: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementContainer: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  menuDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contactSection: {
    marginBottom: 24,
  },
  contactCard: {
    padding: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  contactText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
  logoutConfirmContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  logoutConfirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  logoutButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoutButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#EF4444',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 16,
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