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
  List,
  Modal,
  Provider as PaperProvider
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
  AlertCircle,
  Target,
  TrendingUp as TrendingUpIcon,
  Award as AwardIcon,
  Trophy as TrophyIcon,
  CalendarDays,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BlurView, BlurTint } from 'expo-blur';
import * as Progress from 'react-native-progress';

// Kontrollera om vi kör på webben
const IS_WEB = Platform.OS === 'web';

// Plattformsspecifika easing-funktioner för att undvika kompatibilitetsproblem med webben
const createEasing = () => {
  if (IS_WEB) {
    // Enklare easing-funktioner för webb
    return {
      easeInOut: Easing.ease,
      move: Easing.ease,
      bounce: Easing.linear
    };
  } else {
    // Fullständiga easing-funktioner för nativt
    return {
      easeInOut: Easing.inOut(Easing.cubic),
      move: Easing.inOut(Easing.cubic),
      bounce: Easing.bounce
    };
  }
};

// Typning för GlassEffect-komponenten
interface GlassEffectProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default'; 
  style?: any;
  children: React.ReactNode;
  borderGlow?: boolean; // Ny prop för att lägga till en subtil lysande kant
  highlightTop?: boolean; // Ny prop för att lägga till en highlight-effekt högst upp
  highlightColor?: string; // Färg för highlight-effekten
}

// Anpassad komponent för glaseffekt som fungerar på alla plattformar
const GlassEffect: React.FC<GlassEffectProps> = ({ 
  intensity = 50, 
  tint = 'dark', 
  style, 
  children,
  borderGlow = false,
  highlightTop = false,
  highlightColor = 'rgba(255, 255, 255, 0.12)'
}) => {
  if (IS_WEB) {
    // Web använder CSS för glaseffekt
    return (
      <View style={[
        styles.glassWeb, 
        borderGlow && styles.glassGlowBorder,
        style
      ]}>
        {highlightTop && <View style={[styles.glassHighlight, { backgroundColor: highlightColor }]} />}
        {children}
      </View>
    );
  } else {
    // Native använder expo-blur
    return (
      <BlurView 
        intensity={intensity} 
        tint={tint as BlurTint} 
        style={[
          styles.glassNative, 
          borderGlow && styles.glassGlowBorder,
          style
        ]}
      >
        {highlightTop && <View style={[styles.glassHighlight, { backgroundColor: highlightColor }]} />}
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

// Ny PlingModal komponent
interface PlingModalProps {
  visible: boolean;
  onClose: () => void;
}

const PlingModal: React.FC<PlingModalProps> = ({ visible, onClose }) => {
  const [amount, setAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productMenuVisible, setProductMenuVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const submitButtonScale = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const easingFunctions = createEasing();

  const handleModalSubmit = () => {
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
        setAmount('');
        setSelectedProduct('');
        setComment('');
        onClose();
      }, 1500);
    });
  };

  useEffect(() => {
    if (!visible) {
      setProductMenuVisible(false);
    }
  }, [visible]);

  return (
    <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalOuterContainer}>
      <View style={styles.modalInnerContainer}>
        <GlassEffect
          style={styles.modalContent}
          intensity={40}
          borderGlow={true}
          highlightTop={true}
          highlightColor="rgba(250, 204, 21, 0.1)"
        >
          <Text style={styles.modalTitle}>Registrera försäljning</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Belopp</Text>
            <TextInput
              mode="outlined"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0 SEK"
              style={styles.textInput}
              outlineColor="rgba(255, 255, 255, 0.15)"
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
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)'}}
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
              outlineColor="rgba(255, 255, 255, 0.15)"
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
              onPress={handleModalSubmit}
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
                opacity: confettiAnim,
              }
            ]}>
              <View style={styles.successIconContainer}>
                <Check size={40} color="#10B981" />
              </View>
              <Text style={styles.successText}>Försäljning registrerad!</Text>
            </Animated.View>
          )}
        </GlassEffect>
      </View>
    </Modal>
  );
};

// Ny mock-data för Dagens Överblick och Fokus
const mockTodaysOverview = {
  todaysSales: 7850,
  salesGoal: 12000,
  goalProgress: 7850 / 12000, // Använd decimal för progresskomponenter
  currentRank: 3,
  totalRanked: 18,
  salesChangePercent: 15, // Positiv förändring
};

const mockFocusToday = {
  type: 'contest', // Kan vara 'tip', 'motivation' etc.
  title: 'Månadsfinalen: Sista Spurten!',
  description: 'Endast 3 dagar kvar! Du ligger på 3:e plats.',
  icon: TrophyIcon,
  actionText: 'Visa Tävling',
  // actionLink: '/competitions/1', // Exempellänk (hanteras med onPress)
};

const mockLeaderboardSnapshot = mockLeaderboard.slice(0, 2); // Anpassa senare för att inkludera användaren
const mockActiveContestTeaser = mockContests.length > 0 ? mockContests[0] : null;
const mockLatestNotification = mockNotifications.length > 0 ? mockNotifications[0] : null;

export default function PlingScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const easingFunctions = createEasing();
  const [isPlingModalVisible, setIsPlingModalVisible] = useState(false);

  const plingButtonScale = useRef(new Animated.Value(1)).current;
  const headerElementsFade = useRef(new Animated.Value(0)).current;
  const overviewFade = useRef(new Animated.Value(0)).current;
  const focusFade = useRef(new Animated.Value(0)).current;
  const listFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerElementsFade, {
      toValue: 1,
      duration: 600,
      delay: 200,
      useNativeDriver: !IS_WEB,
      easing: easingFunctions.easeInOut,
    }).start();

    Animated.timing(overviewFade, {
      toValue: 1,
      duration: 600,
      delay: 400,
      useNativeDriver: !IS_WEB,
      easing: easingFunctions.easeInOut,
    }).start();

    Animated.timing(focusFade, {
      toValue: 1,
      duration: 600,
      delay: 600,
      useNativeDriver: !IS_WEB,
      easing: easingFunctions.easeInOut,
    }).start();

    Animated.timing(listFade, {
      toValue: 1,
      duration: 600,
      delay: 800,
      useNativeDriver: !IS_WEB,
      easing: easingFunctions.easeInOut,
    }).start();
  }, []);

  const handlePlingPressIn = () => {
    Animated.spring(plingButtonScale, {
      toValue: 0.95,
      useNativeDriver: !IS_WEB,
    }).start();
  };

  const handlePlingPressOut = () => {
    Animated.spring(plingButtonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: !IS_WEB,
    }).start();
    setIsPlingModalVisible(true);
  };

  const firstName = user?.name?.split(' ')[0] || 'Plingare';

  const renderFocusTodayIcon = () => {
    if (mockFocusToday.type === 'contest') {
      return <TrophyIcon size={28} color="#FACC15" />;
    } else if (mockFocusToday.type === 'tip') {
      return <Info size={28} color="#818CF8" />; // Annan färg för tips
    }
    return <AwardIcon size={28} color="#FFFFFF" />;
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0E2A', '#1E1B4B', '#312E81']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.gradientAccent1} />
        <View style={styles.gradientAccent2} />
        <View style={styles.gradientAccent3} />
        <View style={styles.gradientAccent4} />
        <StatusBar style="light" />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.newHeaderContainer}>
            <Animated.View style={{ opacity: headerElementsFade }}>
              <TouchableOpacity onPress={() => console.log('Avatar')} style={styles.newHeaderAvatarButton}>
                <Avatar.Image
                  size={40}
                  source={user?.avatarUrl ? { uri: user.avatarUrl } : require('../../../assets/images/avatar-placeholder.png')}
                  style={styles.newHeaderAvatar}
                />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: plingButtonScale }] }}>
              <TouchableOpacity
                style={styles.newHeaderPlingButton}
                onPressIn={handlePlingPressIn}
                onPressOut={handlePlingPressOut}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#FACC15', '#F59E0B']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.newHeaderPlingButtonGradient}
                >
                  <RadioTower size={28} color="#0F0E2A" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ opacity: headerElementsFade }}>
              <TouchableOpacity onPress={() => console.log('Notiser')} style={styles.newHeaderNotificationButton}>
                <Bell size={24} color="#FFFFFF" />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: overviewFade, marginBottom: 24 }}>
              <Text style={styles.sectionTitle}>God morgon, {firstName}!</Text>
              <View style={styles.overviewNewGrid}>
                <GlassEffect style={styles.overviewCard} intensity={30} borderGlow highlightTop highlightColor="rgba(250, 204, 21, 0.1)">
                   <View style={styles.overviewCardHeader}>
                     <TrendingUpIcon size={20} color="#FACC15" />
                     <Text style={styles.overviewCardTitle}>Sålt idag</Text>
                   </View>
                   <Text style={styles.overviewCardValue}>{mockTodaysOverview.todaysSales.toLocaleString()} kr</Text>
                   <Text style={[styles.overviewCardChange, { color: mockTodaysOverview.salesChangePercent >= 0 ? '#10B981' : '#EF4444' }]}>
                       {mockTodaysOverview.salesChangePercent >= 0 ? '+' : ''}{mockTodaysOverview.salesChangePercent}%
                   </Text>
                </GlassEffect>

                <GlassEffect style={styles.overviewCard} intensity={30} borderGlow highlightTop highlightColor="rgba(167, 139, 250, 0.1)">
                   <View style={styles.overviewCardHeader}>
                     <Target size={20} color="#A78BFA" />
                     <Text style={styles.overviewCardTitle}>Dagens Mål</Text>
                   </View>
                   <View style={styles.circularProgressContainer}>
                    <Progress.Circle
                        size={80}
                        progress={mockTodaysOverview.goalProgress}
                        color="#A78BFA"
                        unfilledColor="rgba(255, 255, 255, 0.1)"
                        borderWidth={0}
                        thickness={8}
                        showsText={true}
                        formatText={() => `${Math.round(mockTodaysOverview.goalProgress * 100)}%`}
                        textStyle={styles.circularProgressText}
                      />
                   </View>
                </GlassEffect>

                <GlassEffect style={styles.overviewCard} intensity={30} borderGlow highlightTop highlightColor="rgba(251, 191, 36, 0.1)">
                  <View style={styles.overviewCardHeader}>
                     <AwardIcon size={20} color="#FBBF24" />
                     <Text style={styles.overviewCardTitle}>Din Rank</Text>
                   </View>
                   <View style={styles.rankContainer}>
                      <Text style={styles.rankValue}>{mockTodaysOverview.currentRank}</Text>
                      <Text style={styles.rankTotal}> / {mockTodaysOverview.totalRanked}</Text>
                   </View>
                </GlassEffect>
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: focusFade, marginBottom: 24 }}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => console.log('Focus')}>
                <GlassEffect style={styles.focusCardNew} intensity={35} borderGlow highlightTop highlightColor="rgba(250, 204, 21, 0.15)">
                    <View style={styles.focusIconContainer}>
                       {mockFocusToday.type === 'contest' ? <TrophyIcon size={24} color="#FACC15"/> : <Info size={24} color="#A78BFA"/>}
                    </View>
                    <View style={styles.focusTextContainer}>
                        <Text style={styles.focusTitleNew}>{mockFocusToday.title}</Text>
                        <Text style={styles.focusDescriptionNew}>{mockFocusToday.description}</Text>
                    </View>
                    <ChevronRight size={22} color="rgba(255, 255, 255, 0.7)" style={styles.focusChevron} />
                </GlassEffect>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ opacity: listFade }}>
                {/* Här kan framtida kompakta listor för leaderboard, tävlingar etc. läggas in */}
            </Animated.View>
          </ScrollView>
        </SafeAreaView>

        <PlingModal
          visible={isPlingModalVisible}
          onClose={() => setIsPlingModalVisible(false)}
        />
      </View>
    </PaperProvider>
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
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    top: -120,
    right: -70,
    opacity: 0.7,
  },
  gradientAccent2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    bottom: 100,
    left: -120,
    opacity: 0.5,
  },
  gradientAccent3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(250, 204, 21, 0.07)',
    top: height * 0.3,
    right: -60,
    opacity: 0.7,
  },
  gradientAccent4: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    top: height * 0.5,
    left: -80,
    opacity: 0.5,
  },
  safeArea: {
    flex: 1,
  },
  glassWeb: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    backdropFilter: 'blur(12px)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  glassNative: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 16,
    position: 'relative',
  },
  glassGlowBorder: {
    ...(IS_WEB ? {
      boxShadow: '0 0 15px 1px rgba(255, 255, 255, 0.1), 0 8px 30px rgba(0, 0, 0, 0.2)',
    } : {
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 10,
    }),
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  newHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    height: 64,
  },
  newHeaderAvatarButton: {
    padding: 4,
  },
  newHeaderAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  newHeaderPlingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    overflow: 'visible',
  },
  newHeaderPlingButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  newHeaderNotificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EC4899',
    borderWidth: 1.5,
    borderColor: '#0F0E2A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  overviewNewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  overviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.8,
  },
  overviewCardTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  overviewCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  overviewCardChange: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: 8,
  },
  circularProgressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  rankValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankTotal: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },
  focusCardNew: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusIconContainer: {
     width: 48,
     height: 48,
     borderRadius: 24,
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 16,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  focusTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  focusTitleNew: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  focusDescriptionNew: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  focusChevron: {
    opacity: 0.7,
  },
  modalOuterContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalInnerContainer: { width: Platform.OS === 'web' ? '60%' : '90%', maxWidth: Platform.OS === 'web' ? 500 : undefined, borderRadius: 16, overflow: 'hidden' },
  modalContent: { padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20, textAlign: 'center' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 8 },
  textInput: { backgroundColor: 'rgba(0, 0, 0, 0.2)', height: 50 },
  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 8, height: 50, paddingHorizontal: 16 },
  dropdownButtonText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 16 },
  menuContent: { backgroundColor: 'rgba(30, 27, 75, 0.95)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 8, marginTop: Platform.OS === 'web' ? 4 : 0, ...(Platform.OS === 'web' && { backdropFilter: 'blur(10px)' }) },
  plingButton: { width: 180, height: 56, borderRadius: 28, overflow: 'hidden', ...(IS_WEB ? { boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 }) },
  plingButtonGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  plingButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  plingButtonText: { fontSize: 18, fontWeight: 'bold', color: '#0F0E2A', letterSpacing: 1 },
  confettiContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 14, 42, 0.85)', borderRadius: 16, ...(Platform.OS === 'web' && { backdropFilter: 'blur(4px)' }) },
  successIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)' },
  successText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
}); 