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
  TextInput as RNTextInput,
  FlatList,
  ViewStyle
} from 'react-native';
import { Text, Avatar, Divider, Button, Modal, Portal, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Trophy,
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  Plus,
  Check,
  X,
  Clock,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Users,
  User,
  Edit,
  Trash2,
  AlertCircle,
  Flag,
  Timer,
  Star,
  Crown,
  Medal,
  Gift,
  Zap,
  Search,
  Filter,
  BarChart3,
  Bell,
  LucideProps
} from 'lucide-react-native';
import BottomNavigation from '@/components/BottomNavigation';

// Platform check
const IS_WEB = Platform.OS === 'web';
const { width, height } = Dimensions.get('window');

// Interfaces
interface CompetitionParticipant {
  name: string;
  score: string;
  avatar?: string | null;
  trend: number;
}

interface CompetitionData {
  id: number;
  title: string;
  target: string;
  prize: string;
  timeframe: string;
  status: 'active' | 'upcoming' | 'completed';
  type: 'individual' | 'team';
  daysRemaining?: number;
  daysUntilStart?: number;
  daysAgo?: number;
  description?: string;
  participants: CompetitionParticipant[];
}

interface CompetitionStats {
  totalCompetitions: number;
  activeCompetitions: number;
  totalParticipants: number;
  completedCompetitions: number;
}

interface NewCompetitionData {
  title: string;
  target: string;
  prize: string;
  startDate: string;
  endDate: string;
  type: 'individual' | 'team';
}

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

// Competition Card Component
interface CompetitionCardProps {
  competition: CompetitionData;
  delay?: number;
  onPress: (competition: CompetitionData) => void;
}

const CompetitionCard: React.FC<CompetitionCardProps> = ({ competition, delay = 0, onPress }) => {
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
  
  // Determine status color
  const getStatusColor = () => {
    if (competition.status === 'active') return '#10B981'; // Green
    if (competition.status === 'upcoming') return '#FACC15'; // Yellow
    if (competition.status === 'completed') return '#6366F1'; // Purple
    return 'rgba(255, 255, 255, 0.5)'; // Default
  };
  
  // Determine status text
  const getStatusText = () => {
    if (competition.status === 'active') return 'Aktiv';
    if (competition.status === 'upcoming') return 'Kommande';
    if (competition.status === 'completed') return 'Avslutad';
    return 'Okänd';
  };
  
  // Determine status icon
  const StatusIcon = () => {
    if (competition.status === 'active') return <Zap size={16} color="#10B981" />;
    if (competition.status === 'upcoming') return <Clock size={16} color="#FACC15" />;
    if (competition.status === 'completed') return <Check size={16} color="#6366F1" />;
    return <AlertCircle size={16} color="rgba(255, 255, 255, 0.5)" />;
  };
  
  // Calculate days remaining or days ago
  const getDaysText = () => {
    if (competition.status === 'active' && competition.daysRemaining !== undefined) {
      return `${competition.daysRemaining} dagar kvar`;
    } else if (competition.status === 'upcoming' && competition.daysUntilStart !== undefined) {
      return `Startar om ${competition.daysUntilStart} dagar`;
    } else if (competition.status === 'completed' && competition.daysAgo !== undefined) {
      return `Avslutades för ${competition.daysAgo} dagar sedan`;
    }
    return '';
  };
  
  return (
    <Animated.View
      style={[
        styles.competitionCard,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.competitionCardContent}
        onPress={() => onPress(competition)}
        activeOpacity={0.8}
      >
        <View style={styles.competitionHeader}>
          <View style={styles.competitionTypeContainer}>
            {competition.type === 'individual' ? (
              <User size={16} color="#FFFFFF" />
            ) : (
              <Users size={16} color="#FFFFFF" />
            )}
            <Text style={styles.competitionType}>
              {competition.type === 'individual' ? 'Individuell' : 'Lag'}
            </Text>
          </View>
          
          <View style={[styles.competitionStatus, { backgroundColor: `${getStatusColor()}20` }]}>
            <StatusIcon />
            <Text style={[styles.competitionStatusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.competitionTitle}>{competition.title}</Text>
        
        <View style={styles.competitionDetails}>
          <View style={styles.competitionTarget}>
            <Text style={styles.competitionTargetLabel}>Mål</Text>
            <Text style={styles.competitionTargetValue}>{competition.target}</Text>
          </View>
          
          <View style={styles.competitionPrize}>
            <Text style={styles.competitionPrizeLabel}>Pris</Text>
            <Text style={styles.competitionPrizeValue}>{competition.prize}</Text>
          </View>
        </View>
        
        <View style={styles.competitionParticipants}>
          <View style={styles.avatarGroup}>
            {competition.participants.slice(0, 3).map((participant, index) => (
              <View 
                key={index} 
                style={[
                  styles.avatarContainer, 
                  { marginLeft: index > 0 ? -10 : 0, zIndex: 3 - index }
                ]}
              >
                <Avatar.Image 
                  size={28} 
                  source={participant.avatar ? { uri: participant.avatar } : require('@assets/images/avatar-placeholder.png')} 
                  style={styles.avatar}
                />
              </View>
            ))}
            {competition.participants.length > 3 && (
              <View style={[styles.avatarContainer, { marginLeft: -10, zIndex: 0 }]}>
                <View style={styles.moreAvatars}>
                  <Text style={styles.moreAvatarsText}>+{competition.participants.length - 3}</Text>
                </View>
              </View>
            )}
          </View>
          
          <Text style={styles.participantsText}>
            {competition.participants.length} deltagare
          </Text>
        </View>
        
        <View style={styles.competitionFooter}>
          <View style={styles.competitionTimeContainer}>
            <Calendar size={14} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.competitionTimeText}>{getDaysText()}</Text>
          </View>
          
          <ChevronRight size={20} color="rgba(255, 255, 255, 0.5)" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Leaderboard Item Component
interface LeaderboardItemProps {
  participant: CompetitionParticipant;
  index: number;
  delay?: number;
}

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ participant, index, delay = 0 }) => {
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
  
  // Determine if this participant is a top performer
  const isTopPerformer = index < 3;
  
  return (
    <Animated.View
      style={[
        styles.leaderboardItemContainer,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.leaderboardItem}>
        <View style={styles.leaderboardRankContainer}>
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
          size={40} 
          source={participant.avatar ? { uri: participant.avatar } : require('@assets/images/avatar-placeholder.png')} 
          style={[
            styles.leaderboardAvatar,
            {
              backgroundColor: 
                index === 0 ? '#FACC15' : // Gold
                index === 1 ? '#94A3B8' : // Silver
                index === 2 ? '#B45309' : // Bronze
                'rgba(91, 33, 182, 0.5)' // Default
            }
          ]}
        />
        
        <View style={styles.leaderboardInfo}>
          <Text style={styles.leaderboardName}>{participant.name}</Text>
          <Text style={styles.leaderboardScore}>{participant.score}</Text>
        </View>
        
        {participant.trend !== 0 && (
          <View style={styles.leaderboardTrend}>
            {participant.trend > 0 ? (
              <ArrowUp size={16} color="#10B981" />
            ) : (
              <ArrowDown size={16} color="#EF4444" />
            )}
            <Text 
              style={[
                styles.leaderboardTrendText,
                { color: participant.trend > 0 ? '#10B981' : '#EF4444' }
              ]}
            >
              {Math.abs(participant.trend)}%
            </Text>
          </View>
        )}
                 </View>
      
      <Divider style={styles.leaderboardDivider} />
    </Animated.View>
  );
};

// Competition Stats Component
interface CompetitionStatsProps {
  stats: CompetitionStats;
  delay?: number;
}

const CompetitionStats: React.FC<CompetitionStatsProps> = ({ stats, delay = 0 }) => {
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
        styles.statsContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsScrollContent}
        onScroll={(event) => {
          // Hantera scroll-händelse här om det behövs
        }}
      >
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#FACC15', '#F59E0B']}
            style={styles.statCardGradient}
          >
            <View style={styles.statCardContent}>
              <Trophy size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.totalCompetitions}</Text>
              <Text style={styles.statLabel}>Tävlingar</Text>
               </View>
          </LinearGradient>
             </View>
        
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#EC4899', '#DB2777']}
            style={styles.statCardGradient}
          >
            <View style={styles.statCardContent}>
              <Zap size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.activeCompetitions}</Text>
              <Text style={styles.statLabel}>Aktiva</Text>
            </View>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            style={styles.statCardGradient}
          >
            <View style={styles.statCardContent}>
              <Users size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.totalParticipants}</Text>
              <Text style={styles.statLabel}>Deltagare</Text>
            </View>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.statCardGradient}
          >
            <View style={styles.statCardContent}>
              <Award size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats.completedCompetitions}</Text>
              <Text style={styles.statLabel}>Avslutade</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// New Competition Modal Component
interface NewCompetitionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (competition: NewCompetitionData) => void;
}

const NewCompetitionModal: React.FC<NewCompetitionModalProps> = ({ visible, onDismiss, onSave }) => {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [prize, setPrize] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<'individual' | 'team'>('individual');
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  
  const handleSave = () => {
    if (!title || !target || !prize || !startDate || !endDate) return;
    
    onSave({
      title,
      target,
      prize,
      startDate,
      endDate,
      type
    });
    
    // Reset form
    setTitle('');
    setTarget('');
    setPrize('');
    setStartDate('');
    setEndDate('');
    setType('individual');
  };
  
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ny tävling</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.modalCloseButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}
            onScroll={(event) => {
              // Hantera scroll-händelse här om det behövs
            }}
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Titel</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={styles.textInput}
                placeholder="T.ex. Sommarens säljutmaning"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                theme={{ colors: { text: '#FFFFFF', placeholder: 'rgba(255, 255, 255, 0.4)' } }}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mål</Text>
              <TextInput
                value={target}
                onChangeText={setTarget}
                style={styles.textInput}
                placeholder="T.ex. Högst försäljning"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                theme={{ colors: { text: '#FFFFFF', placeholder: 'rgba(255, 255, 255, 0.4)' } }}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pris</Text>
              <TextInput
                value={prize}
                onChangeText={setPrize}
                style={styles.textInput}
                placeholder="T.ex. Presentkort 1000 kr"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                theme={{ colors: { text: '#FFFFFF', placeholder: 'rgba(255, 255, 255, 0.4)' } }}
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Startdatum</Text>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  style={styles.textInput}
                  placeholder="ÅÅÅÅ-MM-DD"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  theme={{ colors: { text: '#FFFFFF', placeholder: 'rgba(255, 255, 255, 0.4)' } }}
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Slutdatum</Text>
                <TextInput
                  value={endDate}
                  onChangeText={setEndDate}
                  style={styles.textInput}
                  placeholder="ÅÅÅÅ-MM-DD"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  theme={{ colors: { text: '#FFFFFF', placeholder: 'rgba(255, 255, 255, 0.4)' } }}
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tävlingstyp</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setTypeModalVisible(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {type === 'individual' ? 'Individuell' : 'Lag'}
                </Text>
                <ChevronDown size={20} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              disabled={!title || !target || !prize || !startDate || !endDate}
            >
              <LinearGradient
                colors={['#FACC15', '#F59E0B']}
                style={[
                  styles.saveButtonGradient,
                  (!title || !target || !prize || !startDate || !endDate) && styles.disabledButton
                ]}
              >
                <Text style={styles.saveButtonText}>Skapa tävling</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Type Selection Modal */}
        <Modal
          visible={typeModalVisible}
          onDismiss={() => setTypeModalVisible(false)}
          contentContainerStyle={styles.selectionModalContainer}
        >
          <View style={styles.selectionModalContent}>
            <Text style={styles.selectionModalTitle}>Välj tävlingstyp</Text>
            
            {[
              { id: 'individual' as const, label: 'Individuell' },
              { id: 'team' as const, label: 'Lag' }
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.selectionItem,
                  type === item.id && styles.selectedItem
                ]}
                onPress={() => {
                  setType(item.id);
                  setTypeModalVisible(false);
                }}
              >
                <Text 
                  style={[
                    styles.selectionItemText,
                    type === item.id && styles.selectedItemText
                  ]}
                >
                  {item.label}
                </Text>
                {type === item.id && (
                  <Check size={20} color="#FACC15" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setTypeModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Modal>
    </Portal>
  );
};

// Competition Detail Modal Component
interface CompetitionDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  competition: CompetitionData | null;
  onEdit: (competition: CompetitionData) => void;
  onDelete: (competition: CompetitionData) => void;
}

const CompetitionDetailModal: React.FC<CompetitionDetailModalProps> = ({ 
  visible, 
  onDismiss, 
  competition, 
  onEdit, 
  onDelete 
}) => {
  const [activeTab, setActiveTab] = useState('leaderboard');
  
  if (!competition) return null;
  
  // Determine status color
  const getStatusColor = () => {
    if (competition.status === 'active') return '#10B981'; // Green
    if (competition.status === 'upcoming') return '#FACC15'; // Yellow
    if (competition.status === 'completed') return '#6366F1'; // Purple
    return 'rgba(255, 255, 255, 0.5)'; // Default
  };
  
  // Determine status text
  const getStatusText = () => {
    if (competition.status === 'active') return 'Aktiv';
    if (competition.status === 'upcoming') return 'Kommande';
    if (competition.status === 'completed') return 'Avslutad';
    return 'Okänd';
  };
  
  // Calculate days remaining or days ago
  const getDaysText = () => {
    if (competition.status === 'active' && competition.daysRemaining !== undefined) {
      return `${competition.daysRemaining} dagar kvar`;
    } else if (competition.status === 'upcoming' && competition.daysUntilStart !== undefined) {
      return `Startar om ${competition.daysUntilStart} dagar`;
    } else if (competition.status === 'completed' && competition.daysAgo !== undefined) {
      return `Avslutades för ${competition.daysAgo} dagar sedan`;
    }
    return '';
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.fullModalContainer}
      >
        <View style={styles.fullModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tävlingsdetaljer</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.modalCloseButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.competitionDetailScrollContent}
            onScroll={(event) => {
              // Hantera scroll-händelse här om det behövs
            }}
          >
            <View style={styles.competitionDetailHeader}>
              <View style={styles.competitionTypeContainer}>
                {competition.type === 'individual' ? (
                  <User size={16} color="#FFFFFF" />
                ) : (
                  <Users size={16} color="#FFFFFF" />
                )}
                <Text style={styles.competitionType}>
                  {competition.type === 'individual' ? 'Individuell' : 'Lag'}
                </Text>
              </View>
              
              <View style={[styles.competitionStatus, { backgroundColor: `${getStatusColor()}20` }]}>
                <Text style={[styles.competitionStatusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.competitionDetailTitle}>{competition.title}</Text>
            
            <View style={styles.competitionDetailSection}>
              <View style={styles.competitionDetailRow}>
                <View style={styles.competitionDetailItem}>
                  <Trophy size={20} color="#FACC15" />
                  <Text style={styles.competitionDetailLabel}>Mål</Text>
                  <Text style={styles.competitionDetailValue}>{competition.target}</Text>
                </View>
                
                <View style={styles.competitionDetailItem}>
                  <Gift size={20} color="#EC4899" />
                  <Text style={styles.competitionDetailLabel}>Pris</Text>
                  <Text style={styles.competitionDetailValue}>{competition.prize}</Text>
                </View>
              </View>
              
              <View style={styles.competitionDetailRow}>
                <View style={styles.competitionDetailItem}>
                  <Calendar size={20} color="#6366F1" />
                  <Text style={styles.competitionDetailLabel}>Tidsram</Text>
                  <Text style={styles.competitionDetailValue}>{competition.timeframe}</Text>
                </View>
                
                <View style={styles.competitionDetailItem}>
                  <Users size={20} color="#10B981" />
                  <Text style={styles.competitionDetailLabel}>Deltagare</Text>
                  <Text style={styles.competitionDetailValue}>{competition.participants.length}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.competitionDetailTimeContainer}>
              <Timer size={16} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.competitionDetailTimeText}>{getDaysText()}</Text>
            </View>
            
            {competition.description && (
              <View style={styles.competitionDetailDescriptionContainer}>
                <Text style={styles.competitionDetailDescription}>{competition.description}</Text>
              </View>
            )}
            
            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'leaderboard' && styles.activeTab
                ]}
                onPress={() => setActiveTab('leaderboard')}
              >
                <Text 
                  style={[
                    styles.tabText,
                    activeTab === 'leaderboard' && styles.activeTabText
                  ]}
                >
                  Topplista
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'stats' && styles.activeTab
                ]}
                onPress={() => setActiveTab('stats')}
              >
                <Text 
                  style={[
                    styles.tabText,
                    activeTab === 'stats' && styles.activeTabText
                  ]}
                >
                  Statistik
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'rules' && styles.activeTab
                ]}
                onPress={() => setActiveTab('rules')}
              >
                <Text 
                  style={[
                    styles.tabText,
                    activeTab === 'rules' && styles.activeTabText
                  ]}
                >
                  Regler
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <View style={styles.tabContent}>
                <GlassCard style={styles.leaderboardCard}>
                  {competition.participants.map((participant, index) => (
                    <LeaderboardItem
                      key={index}
                      participant={participant}
                      index={index}
                      delay={index * 100}
                    />
                  ))}
                </GlassCard>
              </View>
            )}
            
            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <View style={styles.tabContent}>
                <GlassCard style={styles.statsCard}>
                  <View style={styles.statsHeader}>
                    <BarChart3 size={20} color="#FACC15" />
                    <Text style={styles.statsTitle}>Tävlingsstatistik</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statRowLabel}>Genomsnittlig försäljning</Text>
                    <Text style={styles.statRowValue}>32 500 kr</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statRowLabel}>Högsta försäljning</Text>
                    <Text style={styles.statRowValue}>58 200 kr</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statRowLabel}>Lägsta försäljning</Text>
                    <Text style={styles.statRowValue}>12 800 kr</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statRowLabel}>Totalt antal pling</Text>
                    <Text style={styles.statRowValue}>145</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statRowLabel}>Aktiva deltagare</Text>
                    <Text style={styles.statRowValue}>8 av 12</Text>
                  </View>
                </GlassCard>
              </View>
            )}
            
            {/* Rules Tab */}
            {activeTab === 'rules' && (
              <View style={styles.tabContent}>
                <GlassCard style={styles.rulesCard}>
                  <View style={styles.rulesHeader}>
                    <Flag size={20} color="#FACC15" />
                    <Text style={styles.rulesTitle}>Tävlingsregler</Text>
                  </View>
                  
                  <Text style={styles.ruleText}>
                    1. Alla försäljningar måste registreras med ett "pling" för att räknas.
                  </Text>
                  <Text style={styles.ruleText}>
                    2. Endast försäljningar under tävlingsperioden räknas.
                  </Text>
                  <Text style={styles.ruleText}>
                    3. Vinnaren är den med högst total försäljning vid tävlingens slut.
                  </Text>
                  <Text style={styles.ruleText}>
                    4. Vid lika resultat vinner den som nådde resultatet först.
                  </Text>
                  <Text style={styles.ruleText}>
                    5. Teamledare har rätt att diskvalificera deltagare vid misstanke om fusk.
                  </Text>
                  <Text style={styles.ruleText}>
                    6. Priset delas ut inom en vecka efter tävlingens slut.
                  </Text>
                </GlassCard>
              </View>
            )}
            
            {/* Action Buttons */}
            {competition.status !== 'completed' && (
              <View style={styles.competitionDetailActions}>
                <TouchableOpacity 
                  style={[styles.competitionDetailAction, styles.editAction]}
                  onPress={() => {
                    onDismiss();
                    onEdit(competition);
                  }}
                >
                  <Edit size={20} color="#FFFFFF" />
                  <Text style={styles.competitionDetailActionText}>Redigera</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.competitionDetailAction, styles.deleteAction]}
                  onPress={() => {
                    onDismiss();
                    onDelete(competition);
                  }}
                >
                  <Trash2 size={20} color="#EF4444" />
                  <Text style={[styles.competitionDetailActionText, styles.deleteActionText]}>Ta bort</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </Portal>
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

export default function CompetitionsScreen() {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [newCompetitionModalVisible, setNewCompetitionModalVisible] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<CompetitionData | null>(null);
  const [competitionDetailModalVisible, setCompetitionDetailModalVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const filterSlideAnim = useRef(new Animated.Value(-100)).current;
  
  // Mock data
  const mockData = {
    stats: {
      totalCompetitions: 24,
      activeCompetitions: 3,
      totalParticipants: 42,
      completedCompetitions: 18
    },
    competitions: [
      {
        id: 1,
        title: 'Sommarens säljutmaning',
        target: 'Högst försäljning',
        prize: 'Presentkort 1000 kr',
        timeframe: '2023-06-01 till 2023-06-30',
        status: 'active' as const,
        type: 'individual' as const,
        daysRemaining: 12,
        description: 'Tävla om att nå högst försäljning under sommarmånaderna. Vinnaren får ett presentkort på 1000 kr att använda på valfri butik.',
        participants: [
          { name: 'Anna Lindberg', score: '58 200 kr', avatar: null, trend: 5 },
          { name: 'Erik Svensson', score: '42 800 kr', avatar: null, trend: 12 },
          { name: 'Maria Karlsson', score: '38 500 kr', avatar: null, trend: -3 },
          { name: 'Johan Berg', score: '32 100 kr', avatar: null, trend: 0 },
          { name: 'Sofia Nilsson', score: '28 700 kr', avatar: null, trend: 8 },
          { name: 'Anders Lund', score: '24 300 kr', avatar: null, trend: -5 },
          { name: 'Emma Björk', score: '18 900 kr', avatar: null, trend: 3 }
        ]
      },
      {
        id: 2,
        title: 'Team Challenge',
        target: 'Flest nya kunder',
        prize: 'Teamlunch',
        timeframe: '2023-07-01 till 2023-07-31',
        status: 'upcoming' as const,
        type: 'team' as const,
        daysUntilStart: 5,
        description: 'En lagtävling där teamen tävlar om att skaffa flest nya kunder under juli månad. Vinnande team får en teamlunch på valfri restaurang.',
        participants: [
          { name: 'Team Alpha', score: '0', avatar: null, trend: 0 },
          { name: 'Team Beta', score: '0', avatar: null, trend: 0 },
          { name: 'Team Gamma', score: '0', avatar: null, trend: 0 }
        ]
      },
      {
        id: 3,
        title: 'Vårens sprint',
        target: 'Högst snittförsäljning',
        prize: 'Extra semesterdag',
        timeframe: '2023-04-01 till 2023-04-30',
        status: 'completed' as const,
        type: 'individual' as const,
        daysAgo: 32,
        description: 'En intensiv tävling under april månad där den med högst snittförsäljning per dag vinner en extra semesterdag att ta ut under året.',
        participants: [
          { name: 'Erik Svensson', score: '4 200 kr/dag', avatar: null, trend: 0 },
          { name: 'Anna Lindberg', score: '3 800 kr/dag', avatar: null, trend: 0 },
          { name: 'Johan Berg', score: '3 500 kr/dag', avatar: null, trend: 0 },
          { name: 'Maria Karlsson', score: '3 200 kr/dag', avatar: null, trend: 0 },
          { name: 'Sofia Nilsson', score: '2 900 kr/dag', avatar: null, trend: 0 }
        ]
      },
      {
        id: 4,
        title: 'Produktutmaning',
        target: 'Flest sålda premium-produkter',
        prize: 'Biobiljetter',
        timeframe: '2023-05-15 till 2023-05-31',
        status: 'completed' as const,
        type: 'individual' as const,
        daysAgo: 10,
        description: 'Tävling med fokus på att sälja premium-produkter. Den som säljer flest premium-produkter under perioden vinner biobiljetter för två personer.',
        participants: [
          { name: 'Maria Karlsson', score: '28 st', avatar: null, trend: 0 },
          { name: 'Anna Lindberg', score: '24 st', avatar: null, trend: 0 },
          { name: 'Sofia Nilsson', score: '22 st', avatar: null, trend: 0 },
          { name: 'Erik Svensson', score: '19 st', avatar: null, trend: 0 },
          { name: 'Johan Berg', score: '15 st', avatar: null, trend: 0 }
        ]
      }
    ]
  };
  
  // Filter competitions based on search query and active filter
  const filteredCompetitions = mockData.competitions.filter(competition => {
    const matchesSearch = competition.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'active' && competition.status === 'active') return matchesSearch;
    if (activeFilter === 'upcoming' && competition.status === 'upcoming') return matchesSearch;
    if (activeFilter === 'completed' && competition.status === 'completed') return matchesSearch;
    
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
  
  // Handle competition press
  const handleCompetitionPress = (competition: CompetitionData) => {
    setSelectedCompetition(competition);
    setCompetitionDetailModalVisible(true);
  };
  
  // Handle new competition save
  const handleSaveCompetition = (newCompetition: NewCompetitionData) => {
    console.log('New competition:', newCompetition);
    // Here you would typically save the competition to your backend
    setNewCompetitionModalVisible(false);
  };
  
  // Handle competition edit
  const handleEditCompetition = (competition: CompetitionData) => {
    console.log('Edit competition:', competition);
    // Here you would typically open an edit modal
  };
  
  // Handle competition delete
  const handleDeleteCompetition = (competition: CompetitionData) => {
    console.log('Delete competition:', competition);
    // Here you would typically show a confirmation dialog and then delete
  };
  
  return (
    <>
      <StatusBar style="light" />
      
      <Stack.Screen
        options={{
          title: 'Tävlingar',
          headerStyle: {
            backgroundColor: '#5B21B6', // Primary color
          },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />
      
      <ImageBackground 
        source={require('@assets/images/pling_confetti_bg.png')} 
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={(event) => {
              // Hantera scroll-händelse här om det behövs
            }}
          >
            {/* Competition Stats */}
            <CompetitionStats 
              stats={mockData.stats}
              delay={100}
            />
            
            {/* Search and Filters */}
            <View style={styles.searchContainer}>
              <View style={styles.searchRow}>
                <TextInput
                  placeholder="Sök tävling..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  theme={{ colors: { text: '#FFFFFF', placeholder: 'rgba(255, 255, 255, 0.5)' } }}
                  left={<TextInput.Icon icon={() => <Search size={20} color="rgba(255, 255, 255, 0.5)" />} />}
                />
                
                <TouchableOpacity 
                  style={styles.filterToggleButton}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Filter size={20} color="#FACC15" />
                </TouchableOpacity>
              </View>
              
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
                  label="Aktiva"
                  isActive={activeFilter === 'active'}
                  onPress={() => setActiveFilter('active')}
                />
                <FilterButton 
                  label="Kommande"
                  isActive={activeFilter === 'upcoming'}
                  onPress={() => setActiveFilter('upcoming')}
                />
                <FilterButton 
                  label="Avslutade"
                  isActive={activeFilter === 'completed'}
                  onPress={() => setActiveFilter('completed')}
                />
              </Animated.View>
            </View>
            
            {/* Competitions List */}
            <View style={styles.competitionsContainer}>
              {filteredCompetitions.length > 0 ? (
                filteredCompetitions.map((competition, index) => (
                  <CompetitionCard
                    key={competition.id}
                    competition={competition}
                    delay={index * 100 + 200}
                    onPress={handleCompetitionPress}
                  />
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Search size={48} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.noResultsText}>Inga tävlingar hittades</Text>
                  <Text style={styles.noResultsSubtext}>Försök med en annan sökterm</Text>
                </View>
              )}
              
              {/* Add New Competition Button */}
              <TouchableOpacity
                style={styles.addCompetitionButton}
                onPress={() => setNewCompetitionModalVisible(true)}
              >
                <View style={styles.addCompetitionIconContainer}>
                  <Plus size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.addCompetitionText}>Skapa ny tävling</Text>
              </TouchableOpacity>
            </View>
            
            {/* Extra padding for bottom navigation */}
            <View style={styles.bottomNavPadding} />
          </ScrollView>
    </SafeAreaView>
        
        {/* New Competition Modal */}
        <NewCompetitionModal
          visible={newCompetitionModalVisible}
          onDismiss={() => setNewCompetitionModalVisible(false)}
          onSave={handleSaveCompetition}
        />
        
        {/* Competition Detail Modal */}
        <CompetitionDetailModal
          visible={competitionDetailModalVisible}
          onDismiss={() => setCompetitionDetailModalVisible(false)}
          competition={selectedCompetition}
          onEdit={handleEditCompetition}
          onDelete={handleDeleteCompetition}
        />
        
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
  statsContainer: {
    marginBottom: 24,
  },
  statsScrollContent: {
    paddingRight: 16,
  },
  statCard: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statCardGradient: {
    flex: 1,
    padding: 16,
  },
  statCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    height: 48,
    marginRight: 8,
  },
  filterToggleButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    marginBottom: 8,
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
  competitionsContainer: {
    marginBottom: 16,
  },
  competitionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(91, 33, 182, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  competitionCardContent: {
    padding: 16,
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  competitionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  competitionType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  competitionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  competitionStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  competitionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  competitionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  competitionTarget: {
    flex: 1,
    marginRight: 8,
  },
  competitionTargetLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  competitionTargetValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  competitionPrize: {
    flex: 1,
    marginLeft: 8,
  },
  competitionPrizeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  competitionPrizeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  competitionParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarGroup: {
    flexDirection: 'row',
    marginRight: 8,
  },
  avatarContainer: {
    borderWidth: 2,
    borderColor: 'rgba(91, 33, 182, 0.5)',
    borderRadius: 14,
  },
  avatar: {
    backgroundColor: 'rgba(91, 33, 182, 0.5)',
  },
  moreAvatars: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAvatarsText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  participantsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  competitionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  competitionTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  competitionTimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },
  noResultsContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(91, 33, 182, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
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
  addCompetitionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  addCompetitionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(91, 33, 182, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addCompetitionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContainer: {
    backgroundColor: 'rgba(30, 27, 75, 0.95)',
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: height * 0.8,
  },
  fullModalContainer: {
    backgroundColor: 'rgba(30, 27, 75, 0.95)',
    margin: 0,
    borderRadius: 0,
    overflow: 'hidden',
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  fullModalContent: {
    padding: 20,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    height: 48,
    color: '#FFFFFF',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1B4B',
  },
  disabledButton: {
    opacity: 0.5,
  },
  selectionModalContainer: {
    backgroundColor: 'rgba(30, 27, 75, 0.95)',
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectionModalContent: {
    padding: 20,
  },
  selectionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItem: {
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
  },
  selectionItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectedItemText: {
    fontWeight: 'bold',
    color: '#FACC15',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  competitionDetailScrollContent: {
    paddingBottom: 20,
  },
  competitionDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  competitionDetailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  competitionDetailSection: {
    marginBottom: 20,
  },
  competitionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  competitionDetailItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  competitionDetailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    marginBottom: 4,
  },
  competitionDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  competitionDetailTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  competitionDetailTimeText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  competitionDetailDescriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  competitionDetailDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tabContent: {
    marginBottom: 20,
  },
  leaderboardCard: {
    padding: 0,
    overflow: 'hidden',
  },
  leaderboardItemContainer: {
    width: '100%',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  leaderboardRankContainer: {
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
  leaderboardAvatar: {
    marginRight: 12,
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
  leaderboardScore: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  leaderboardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardTrendText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  leaderboardDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsCard: {
    padding: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statRowLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rulesCard: {
    padding: 16,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  ruleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    lineHeight: 20,
  },
  competitionDetailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  competitionDetailAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  editAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteAction: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  competitionDetailActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  deleteActionText: {
    color: '#EF4444',
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