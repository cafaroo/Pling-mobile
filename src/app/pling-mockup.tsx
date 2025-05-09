import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  Platform,
  Animated,
  Easing,
  TouchableOpacity,
  ImageBackground,
  TextInput as RNTextInput
} from 'react-native';
import { 
  Text, 
  Card, 
  useTheme, 
  Avatar, 
  Button,
  IconButton,
  TextInput,
  SegmentedButtons,
  Checkbox,
  Menu,
  Divider,
  List
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@context/AuthContext';
import { 
  Bell, 
  RadioTower, 
  Trophy, 
  Zap, 
  Plus, 
  ChevronRight, 
  Calendar, 
  Award, 
  Users, 
  TrendingUp,
  BarChart,
  Coins,
  Check,
  Crown,
  Medal,
  Badge,
  BarChart3,
  Info,
  AlertCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BlurView, BlurTint } from 'expo-blur';

// Kontrollera om vi kör på webben
const IS_WEB = Platform.OS === 'web';

// Plattformsspecifika easing-funktioner för att undvika kompatibilitetsproblem med webben
const createEasing = () => {
  if (IS_WEB) {
    // Enklare easing-funktioner för webb
    return {
      easeInOut: Easing.ease,
      move: Easing.ease
    };
  } else {
    // Fullständiga easing-funktioner för nativt
    return {
      easeInOut: Easing.inOut(Easing.cubic),
      move: Easing.inOut(Easing.cubic)
    };
  }
};

// Typning för GlassEffect-komponenten
interface GlassEffectProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default'; 
  style?: any;
  children: React.ReactNode;
}

// Anpassad komponent för glaseffekt som fungerar på alla plattformar
const GlassEffect: React.FC<GlassEffectProps> = ({ 
  intensity = 50, 
  tint = 'dark', 
  style, 
  children 
}) => {
  if (IS_WEB) {
    // Web använder CSS för glaseffekt
    return (
      <View style={[styles.glassWeb, style]}>
        {children}
      </View>
    );
  } else {
    // Native använder expo-blur
    return (
      <BlurView 
        intensity={intensity} 
        tint={tint as BlurTint} 
        style={[styles.glassNative, style]}
      >
        {children}
      </BlurView>
    );
  }
};

// Mockup-data
const mockProducts = [
  { id: '1', name: 'Premium Prenumeration' },
  { id: '2', name: 'Årsavtal Företag' },
  { id: '3', name: 'Konsulttjänst' },
  { id: '4', name: 'Månadsprenumeration' }
];

const mockLeaderboard = [
  { id: '1', name: 'Annika Larsson', avatar: null, sales: 24500, change: '+12%' },
  { id: '2', name: 'Erik Johansson', avatar: null, sales: 21200, change: '+5%' },
  { id: '3', name: 'Maria Lindberg', avatar: null, sales: 19800, change: '+8%' },
];

const mockContests = [
  { id: '1', name: 'Sommarsprint', endDate: '25 juni', yourPosition: 2, totalParticipants: 18 },
  { id: '2', name: 'Kvartalsutmaning', endDate: '30 juni', yourPosition: 5, totalParticipants: 25 },
];

const mockNotifications = [
  { id: '1', message: 'Du slog ditt rekord!', time: 'Idag 14:22', type: 'success' },
  { id: '2', message: 'Ny tävling har startat', time: 'Idag 09:30', type: 'info' },
  { id: '3', message: 'Erik skickade dig en high-five', time: 'Igår 18:45', type: 'info' },
];

export default function PlingMockupScreen() {
  const theme = useTheme();
  const easingFunctions = createEasing();
  const [amount, setAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productMenuVisible, setProductMenuVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardsAnimArray = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current
  ];

  const submitButtonScale = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  
  // Entry animations
  useEffect(() => {
    // Main content fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: !IS_WEB,
        easing: easingFunctions.easeInOut,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: !IS_WEB,
        easing: easingFunctions.easeInOut,
      })
    ]).start();

    // Cards stagger animation
    Animated.stagger(150, 
      cardsAnimArray.map(anim => 
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: !IS_WEB,
          easing: easingFunctions.easeInOut,
        })
      )
    ).start();
  }, []);

  const handlePlingButtonPress = () => {
    // Animera knappen
    Animated.sequence([
      Animated.timing(submitButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: !IS_WEB,
        easing: Easing.ease,
      }),
      Animated.timing(submitButtonScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: !IS_WEB,
        easing: Easing.elastic(1),
      })
    ]).start();

    // Visa konfetti-animationen
    setShowSuccessAnimation(true);
    Animated.timing(confettiAnim, {
      toValue: 1, 
      duration: 1000,
      useNativeDriver: !IS_WEB,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      setTimeout(() => {
        setShowSuccessAnimation(false);
        confettiAnim.setValue(0);
      }, 2000);
    });

    // Återställ formuläret
    setTimeout(() => {
      setAmount('');
      setSelectedProduct('');
      setComment('');
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0F0E2A', '#1E1B4B', '#312E81']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Gradient accents - för visuellt intresse */}
      <View style={styles.gradientAccent1} />
      <View style={styles.gradientAccent2} />
      
      <StatusBar style="light" />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header med titel */}
        <GlassEffect style={styles.header} intensity={40}>
          <Text style={styles.headerTitle}>Pling Säljregistrering</Text>
          <TouchableOpacity onPress={() => console.log('Notifications')}>
            <View style={styles.notificationButton}>
              <Bell size={20} color="#FFFFFF" />
              <View style={styles.notificationBadge} />
            </View>
          </TouchableOpacity>
        </GlassEffect>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Säljregistrering - huvudkort */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: IS_WEB ? [] : [{ translateY: slideAnim }],
              marginBottom: 24,
            }}
          >
            <GlassEffect style={styles.mainCard} intensity={30}>
              <Text style={styles.mainCardTitle}>Registrera försäljning</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Belopp</Text>
                <TextInput
                  mode="outlined"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0 SEK"
                  style={styles.textInput}
                  outlineColor="rgba(255, 255, 255, 0.2)"
                  activeOutlineColor="#FACC15"
                  textColor="#FFFFFF"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  theme={{ colors: { background: 'rgba(0, 0, 0, 0.2)' } }}
                  left={<TextInput.Icon icon={() => <Coins size={20} color="rgba(255, 255, 255, 0.7)" />} />}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Produkt (valfritt)</Text>
                <Menu
                  visible={productMenuVisible}
                  onDismiss={() => setProductMenuVisible(false)}
                  anchor={
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setProductMenuVisible(true)}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {selectedProduct ? selectedProduct : 'Välj produkt'}
                      </Text>
                      <ChevronRight size={20} color="rgba(255, 255, 255, 0.7)" style={{ transform: [{ rotate: '90deg' }] }} />
                    </TouchableOpacity>
                  }
                  contentStyle={styles.menuContent}
                >
                  {mockProducts.map(product => (
                    <Menu.Item
                      key={product.id}
                      onPress={() => {
                        setSelectedProduct(product.name);
                        setProductMenuVisible(false);
                      }}
                      title={product.name}
                      titleStyle={{ color: '#FFFFFF' }}
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    />
                  ))}
                </Menu>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Kommentar (valfritt)</Text>
                <TextInput
                  mode="outlined"
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Lägg till kommentar..."
                  style={styles.textInput}
                  multiline
                  numberOfLines={2}
                  outlineColor="rgba(255, 255, 255, 0.2)"
                  activeOutlineColor="#FACC15"
                  textColor="#FFFFFF"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  theme={{ colors: { background: 'rgba(0, 0, 0, 0.2)' } }}
                />
              </View>
              
              <Animated.View style={{ 
                transform: [{ scale: submitButtonScale }],
                alignItems: 'center',
                marginTop: 16
              }}>
                <TouchableOpacity
                  style={styles.plingButton}
                  onPress={handlePlingButtonPress}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#FACC15', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.plingButtonGradient}
                  >
                    <View style={styles.plingButtonContent}>
                      <RadioTower size={24} color="#0F0E2A" style={{ marginRight: 12 }} />
                      <Text style={styles.plingButtonText}>PLING!</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              
              {showSuccessAnimation && (
                <Animated.View style={[
                  styles.confettiContainer,
                  {
                    opacity: confettiAnim
                  }
                ]}>
                  <View style={styles.successIconContainer}>
                    <Check size={40} color="#10B981" />
                  </View>
                  <Text style={styles.successText}>Försäljning registrerad!</Text>
                </Animated.View>
              )}
            </GlassEffect>
          </Animated.View>

          {/* Mina framsteg */}
          <Animated.View
            style={{
              opacity: cardsAnimArray[0],
              transform: IS_WEB ? [] : [
                { 
                  translateY: cardsAnimArray[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ],
              marginBottom: 20,
            }}
          >
            <GlassEffect style={styles.card} intensity={25}>
              <Text style={styles.cardTitle}>Mina framsteg</Text>
              
              <View style={styles.progressSection}>
                <View style={styles.weeklySalesContainer}>
                  <Text style={styles.weeklySalesLabel}>Denna vecka</Text>
                  <Text style={styles.weeklySalesAmount}>21 500 kr</Text>
                  <Text style={styles.weeklySalesChange}>
                    <Text style={{ color: '#10B981' }}>↑ 14%</Text> från förra veckan
                  </Text>
                </View>
                
                <View style={styles.badgesContainer}>
                  <Text style={styles.badgesTitle}>Badges</Text>
                  <View style={styles.badgesList}>
                    <View style={styles.badgeItem}>
                      <View style={[styles.badgeIcon, { backgroundColor: 'rgba(124, 58, 237, 0.2)' }]}>
                        <Award size={18} color="#FFFFFF" />
                      </View>
                      <Text style={styles.badgeText}>Nybörjare</Text>
                    </View>
                    
                    <View style={styles.badgeItem}>
                      <View style={[styles.badgeIcon, { backgroundColor: 'rgba(250, 204, 21, 0.2)' }]}>
                        <TrendingUp size={18} color="#FFFFFF" />
                      </View>
                      <Text style={styles.badgeText}>På väg upp</Text>
                    </View>
                    
                    <View style={styles.badgeItem}>
                      <View style={[styles.badgeIcon, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                        <Crown size={18} color="#FFFFFF" />
                      </View>
                      <Text style={styles.badgeText}>Toppsäljare</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.recordSalesContainer}>
                <Text style={styles.recordSalesLabel}>Bästa försäljningsdagen</Text>
                <GlassEffect style={styles.recordSalesCard} intensity={10}>
                  <View style={styles.recordSalesContent}>
                    <View style={styles.recordSalesIconContainer}>
                      <Trophy size={20} color="#FACC15" />
                    </View>
                    <View style={styles.recordSalesTextContainer}>
                      <Text style={styles.recordSalesAmount}>8 200 kr</Text>
                      <Text style={styles.recordSalesDate}>16 juni 2024</Text>
                    </View>
                  </View>
                </GlassEffect>
              </View>
            </GlassEffect>
          </Animated.View>
          
          {/* Leaderboard */}
          <Animated.View
            style={{
              opacity: cardsAnimArray[1],
              transform: IS_WEB ? [] : [
                { 
                  translateY: cardsAnimArray[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ],
              marginBottom: 20,
            }}
          >
            <GlassEffect style={styles.card} intensity={25}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Leaderboard</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Se alla</Text>
                </TouchableOpacity>
              </View>
              
              {mockLeaderboard.map((person, index) => (
                <View key={person.id} style={styles.leaderboardItem}>
                  <View style={styles.leaderboardRankContainer}>
                    <Text style={[
                      styles.leaderboardRank, 
                      index === 0 ? styles.rankGold : (index === 1 ? styles.rankSilver : styles.rankBronze)
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  
                  <View style={styles.leaderboardAvatar}>
                    <Avatar.Text 
                      size={36} 
                      label={person.name.split(' ').map(n => n[0]).join('')} 
                      color="#FFFFFF"
                      style={{ 
                        backgroundColor: index === 0 
                          ? 'rgba(250, 204, 21, 0.3)' 
                          : (index === 1 
                            ? 'rgba(209, 213, 219, 0.3)' 
                            : 'rgba(180, 83, 9, 0.3)')
                      }}
                    />
                  </View>
                  
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>{person.name}</Text>
                    <Text style={styles.leaderboardSales}>{person.sales.toLocaleString()} kr</Text>
                  </View>
                  
                  <View style={styles.leaderboardChange}>
                    <Text style={[styles.leaderboardChangeText, { color: '#10B981' }]}>
                      {person.change}
                    </Text>
                  </View>
                </View>
              ))}
              
              <View style={styles.yourRankContainer}>
                <GlassEffect style={styles.yourRankCard} intensity={15}>
                  <View style={styles.yourRankContent}>
                    <Text style={styles.yourRankTitle}>Din placering</Text>
                    <View style={styles.yourRankPosition}>
                      <Text style={styles.yourRankNumber}>6</Text>
                      <Text style={styles.yourRankTotal}>av 25</Text>
                    </View>
                  </View>
                </GlassEffect>
              </View>
            </GlassEffect>
          </Animated.View>
          
          {/* Tävlingar */}
          <Animated.View
            style={{
              opacity: cardsAnimArray[2],
              transform: IS_WEB ? [] : [
                { 
                  translateY: cardsAnimArray[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ],
              marginBottom: 20,
            }}
          >
            <GlassEffect style={styles.card} intensity={25}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Aktuella tävlingar</Text>
                <Button
                  mode="text"
                  textColor="#FACC15"
                  onPress={() => console.log('Se alla tävlingar')}
                >
                  Se alla
                </Button>
              </View>
              
              {mockContests.map((contest) => (
                <TouchableOpacity key={contest.id} activeOpacity={0.9}>
                  <GlassEffect 
                    style={styles.contestItem} 
                    intensity={10}
                  >
                    <View style={styles.contestHeader}>
                      <View style={styles.contestIconContainer}>
                        <Trophy size={20} color="#FACC15" />
                      </View>
                      <Text style={styles.contestName}>{contest.name}</Text>
                    </View>
                    
                    <View style={styles.contestDetails}>
                      <View style={styles.contestPositionContainer}>
                        <Text style={styles.contestPositionLabel}>Din placering</Text>
                        <View style={styles.contestPositionContent}>
                          <Text style={styles.contestPosition}>{contest.yourPosition}</Text>
                          <Text style={styles.contestPositionTotal}>av {contest.totalParticipants}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.contestTimeContainer}>
                        <Text style={styles.contestTimeLabel}>Slutar</Text>
                        <Text style={styles.contestTimeValue}>{contest.endDate}</Text>
                      </View>
                    </View>
                  </GlassEffect>
                </TouchableOpacity>
              ))}
            </GlassEffect>
          </Animated.View>
          
          {/* Notiser */}
          <Animated.View
            style={{
              opacity: cardsAnimArray[3],
              transform: IS_WEB ? [] : [
                { 
                  translateY: cardsAnimArray[3].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ],
              marginBottom: 20,
            }}
          >
            <GlassEffect style={styles.card} intensity={25}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Senaste händelser</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Se alla</Text>
                </TouchableOpacity>
              </View>
              
              {mockNotifications.map((notification) => (
                <View key={notification.id} style={styles.notificationItem}>
                  <View style={[
                    styles.notificationIconContainer,
                    { 
                      backgroundColor: notification.type === 'success' 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : 'rgba(250, 204, 21, 0.2)' 
                    }
                  ]}>
                    {notification.type === 'success' ? (
                      <Check size={20} color="#10B981" />
                    ) : (
                      <Info size={20} color="#FACC15" />
                    )}
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                </View>
              ))}
            </GlassEffect>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientAccent1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    top: -100,
    right: -50,
  },
  gradientAccent2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    bottom: 100,
    left: -100,
  },
  safeArea: {
    flex: 1,
  },
  // Glaseffekt stilar
  glassWeb: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
  },
  glassNative: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EC4899',
    borderWidth: 1,
    borderColor: 'rgba(15, 14, 42, 0.5)',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 80,
  },
  mainCard: {
    padding: 24,
    borderRadius: 16,
    ...(IS_WEB ? {
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.2)'
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    }),
  },
  mainCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    height: 50,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    height: 50,
    paddingHorizontal: 16,
  },
  dropdownButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  menuContent: {
    backgroundColor: 'rgba(30, 27, 75, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  plingButton: {
    width: 180,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...(IS_WEB ? {
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    }),
  },
  plingButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F0E2A',
    letterSpacing: 1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 14, 42, 0.8)',
    borderRadius: 16,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    ...(IS_WEB ? {
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.2)'
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#FACC15',
  },
  
  // Framsteg-kortet
  progressSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  weeklySalesContainer: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    paddingRight: 16,
  },
  weeklySalesLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  weeklySalesAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  weeklySalesChange: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  badgesContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  badgesTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 8,
  },
  badgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  recordSalesContainer: {
    marginTop: 16,
  },
  recordSalesLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  recordSalesCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    overflow: 'hidden',
  },
  recordSalesContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  recordSalesIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  recordSalesTextContainer: {
    flex: 1,
  },
  recordSalesAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  recordSalesDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  // Leaderboard-kortet
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaderboardRankContainer: {
    width: 30,
    alignItems: 'center',
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankGold: {
    color: '#FACC15',
  },
  rankSilver: {
    color: '#D1D5DB',
  },
  rankBronze: {
    color: '#B45309',
  },
  leaderboardAvatar: {
    marginRight: 16,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  leaderboardSales: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  leaderboardChange: {
    paddingHorizontal: 8,
  },
  leaderboardChangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  yourRankContainer: {
    marginTop: 16,
  },
  yourRankCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  yourRankContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourRankTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  yourRankPosition: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  yourRankNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 6,
  },
  yourRankTotal: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  // Tävlingar-kortet
  contestItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  contestIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  contestName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  contestDetails: {
    flexDirection: 'row',
    padding: 16,
  },
  contestPositionContainer: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    paddingRight: 16,
  },
  contestPositionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  contestPositionContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  contestPosition: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 6,
  },
  contestPositionTotal: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  contestTimeContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  contestTimeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  contestTimeValue: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // Notiser
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
}); 