import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity, 
  Animated, 
  Easing,
  Platform,
  ImageBackground
} from 'react-native';
import { Stack } from 'expo-router';
import { Text, useTheme, Avatar } from 'react-native-paper';
import { useUser } from '../../application/user/hooks/useUser';
import { LoadingSpinner } from '../../ui/shared/components/LoadingSpinner';
import { ErrorMessage } from '../../ui/shared/components/ErrorMessage';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Award, TrendingUp, Users, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const { data: user, isLoading, error } = useUser();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Entry animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  // Mock data for the dashboard
  const mockData = {
    stats: {
      todaySales: '12 500 kr',
      weekSales: '87 300 kr',
      rank: 3,
      plings: 8
    },
    topSellers: [
      { id: 1, name: 'Anna L.', amount: '23 500 kr', avatar: null },
      { id: 2, name: 'Erik S.', amount: '19 800 kr', avatar: null },
      { id: 3, name: 'Maria K.', amount: '15 200 kr', avatar: null },
    ],
    activeCompetition: {
      title: 'Veckans utmaning',
      goal: 'Först till 50 000 kr',
      endDate: 'Fredag 16:00',
      progress: 65
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !user) {
    return <ErrorMessage message={error?.message ?? 'Kunde inte ladda användardata'} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerStyle: {
            backgroundColor: '#5B21B6', // Primary color from brand guide
          },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity style={styles.bellButton}>
              <Bell size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ImageBackground 
        source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pling_confetti_bg-JiUBL2n4f0s9arHXG1spHXfnBCVCMH.png' }}
        style={styles.backgroundImage}
      >
        <View style={styles.overlay} />
        
        <SafeAreaView style={styles.container}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Welcome Section */}
            <Animated.View 
              style={[
                styles.welcomeSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.welcomeHeader}>
                <View>
                  <Text variant="titleMedium" style={styles.welcomeText}>
                    Välkommen tillbaka
                  </Text>
                  <Text variant="headlineSmall" style={styles.nameText}>
                    {user.profile.firstName}!
                  </Text>
                </View>
                <Avatar.Text 
                  size={50} 
                  label={user.profile.firstName.charAt(0) + (user.profile.lastName ? user.profile.lastName.charAt(0) : '')} 
                  style={{ backgroundColor: "#EC4899" }} // Pink accent color
                  color="#FFFFFF"
                />
              </View>
            </Animated.View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <LinearGradient
                colors={['#5B21B6', '#7C3AED']} // Primary color gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statsCard}
              >
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>Dagens försäljning</Text>
                  <Text style={styles.statValue}>{mockData.stats.todaySales}</Text>
                </View>
                <TrendingUp size={24} color="#FFFFFF" style={styles.statIcon} />
              </LinearGradient>
              
              <LinearGradient
                colors={['#EC4899', '#DB2777']} // Pink accent gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statsCard}
              >
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>Din ranking</Text>
                  <Text style={styles.statValue}>#{mockData.stats.rank}</Text>
                </View>
                <Award size={24} color="#FFFFFF" style={styles.statIcon} />
              </LinearGradient>
            </View>

            {/* Active Competition */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Aktiv tävling</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Se alla</Text>
                </TouchableOpacity>
              </View>
              
              <LinearGradient
                colors={['rgba(250, 204, 21, 0.9)', 'rgba(245, 158, 11, 0.9)']} // Yellow gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.competitionCard}
              >
                <View style={styles.competitionContent}>
                  <Text style={styles.competitionTitle}>{mockData.activeCompetition.title}</Text>
                  <Text style={styles.competitionGoal}>{mockData.activeCompetition.goal}</Text>
                  <Text style={styles.competitionDate}>Slutar: {mockData.activeCompetition.endDate}</Text>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${mockData.activeCompetition.progress}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{mockData.activeCompetition.progress}%</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Top Sellers */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Topplista</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Se alla</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.topSellersCard}>
                {mockData.topSellers.map((seller, index) => (
                  <TouchableOpacity key={seller.id} style={styles.sellerItem}>
                    <View style={styles.sellerRank}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <Avatar.Text 
                      size={40} 
                      label={seller.name.split(' ').map(n => n[0]).join('')} 
                      style={{
                        backgroundColor: 
                          index === 0 ? '#FACC15' : // Gold for #1
                          index === 1 ? '#94A3B8' : // Silver for #2
                          index === 2 ? '#B45309' : // Bronze for #3
                          '#6B7280' // Gray for others
                      }}
                      color="#1E1B4B"
                    />
                    <View style={styles.sellerInfo}>
                      <Text style={styles.sellerName}>{seller.name}</Text>
                      <Text style={styles.sellerAmount}>{seller.amount}</Text>
                    </View>
                    <ChevronRight size={20} color="#FFFFFF" opacity={0.5} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Snabbåtgärder</Text>
              </View>
              
              <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton}>
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
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 27, 75, 0.85)', // Dark blue with opacity
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  welcomeSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  nameText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 24,
  },
  bellButton: {
    marginRight: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statIcon: {
    marginLeft: 8,
  },
  sectionContainer: {
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
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#FACC15', // Yellow accent
    fontSize: 14,
  },
  competitionCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  competitionContent: {
    width: '100%',
  },
  competitionTitle: {
    color: '#1E1B4B', // Dark blue
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  competitionGoal: {
    color: '#1E1B4B',
    fontSize: 16,
    marginBottom: 2,
  },
  competitionDate: {
    color: 'rgba(30, 27, 75, 0.8)',
    fontSize: 14,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(30, 27, 75, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E1B4B',
    borderRadius: 4,
  },
  progressText: {
    marginLeft: 8,
    color: '#1E1B4B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  topSellersCard: {
    backgroundColor: 'rgba(91, 33, 182, 0.3)', // Primary color with opacity
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sellerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sellerRank: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    color: '#FACC15', // Yellow accent
    fontWeight: 'bold',
    fontSize: 14,
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  sellerAmount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: '30%',
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
});