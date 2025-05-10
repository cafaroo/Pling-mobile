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
  ViewStyle
} from 'react-native';
import { Text, Avatar, Divider, Button, Modal, Portal, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Target,
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
  AlertCircle
} from 'lucide-react-native';
import BottomNavigation from '@/components/BottomNavigation';

// Platform check
const IS_WEB = Platform.OS === 'web';
const { width, height } = Dimensions.get('window');

// Interfaces
interface GoalData {
  id: number;
  title: string;
  target: string;
  current?: string;
  progress: number;
  timeframe: string;
  status: 'completed' | 'at_risk' | 'on_track' | 'in_progress';
  type: 'personal' | 'team';
  description?: string;
}

interface HistoryGoalData {
  id: number;
  title: string;
  target: string;
  result: string;
  timeframe: string;
  status: 'completed' | 'failed';
}

interface GoalSummaryData {
  completed: number;
  inProgress: number;
  atRisk: number;
  overallProgress: number;
}

interface NewGoalData {
  title: string;
  target: string;
  timeframe: string;
  type: 'personal' | 'team';
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

// Goal Progress Component
interface GoalProgressProps {
  goal: GoalData;
  delay?: number;
  onPress: (goal: GoalData) => void;
}

const GoalProgress: React.FC<GoalProgressProps> = ({ goal, delay = 0, onPress }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
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
      ]),
      Animated.timing(progressAnim, {
        toValue: goal.progress / 100,
        duration: 1000,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic)
      })
    ]).start();
  }, []);
  
  // Determine status color
  const getStatusColor = () => {
    if (goal.status === 'completed') return '#10B981'; // Green
    if (goal.status === 'at_risk') return '#EF4444'; // Red
    if (goal.status === 'on_track') return '#FACC15'; // Yellow
    return 'rgba(255, 255, 255, 0.5)'; // Default
  };
  
  // Determine status icon
  const StatusIcon = () => {
    if (goal.status === 'completed') return <Check size={16} color="#10B981" />;
    if (goal.status === 'at_risk') return <AlertCircle size={16} color="#EF4444" />;
    if (goal.status === 'on_track') return <TrendingUp size={16} color="#FACC15" />;
    return <Clock size={16} color="rgba(255, 255, 255, 0.5)" />;
  };
  
  return (
    <Animated.View
      style={[
        styles.goalCard,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.goalCardContent}
        onPress={() => onPress(goal)}
        activeOpacity={0.8}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalTypeContainer}>
            {goal.type === 'personal' ? (
              <User size={16} color="#FFFFFF" />
            ) : (
              <Users size={16} color="#FFFFFF" />
            )}
            <Text style={styles.goalType}>
              {goal.type === 'personal' ? 'Personligt mål' : 'Teammål'}
            </Text>
          </View>
          
          <View style={[styles.goalStatus, { backgroundColor: `${getStatusColor()}20` }]}>
            <StatusIcon />
            <Text style={[styles.goalStatusText, { color: getStatusColor() }]}>
              {goal.status === 'completed' ? 'Uppnått' : 
               goal.status === 'at_risk' ? 'Risk' : 
               goal.status === 'on_track' ? 'På väg' : 'Pågående'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.goalTitle}>{goal.title}</Text>
        
        <View style={styles.goalDetails}>
          <View style={styles.goalTarget}>
            <Text style={styles.goalTargetLabel}>Mål</Text>
            <Text style={styles.goalTargetValue}>{goal.target}</Text>
          </View>
          
          <View style={styles.goalProgress}>
            <View style={styles.goalProgressHeader}>
              <Text style={styles.goalProgressLabel}>Framsteg</Text>
              <Text style={styles.goalProgressValue}>{goal.current} ({goal.progress}%)</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  { 
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    }),
                    backgroundColor: getStatusColor()
                  }
                ]}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.goalFooter}>
          <View style={styles.goalTimeContainer}>
            <Calendar size={14} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.goalTimeText}>{goal.timeframe}</Text>
          </View>
          
          <ChevronRight size={20} color="rgba(255, 255, 255, 0.5)" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Goal Summary Component
interface GoalSummaryProps {
  summary: GoalSummaryData;
  delay?: number;
}

const GoalSummary: React.FC<GoalSummaryProps> = ({ summary, delay = 0 }) => {
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
        styles.summaryContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(91, 33, 182, 0.8)', 'rgba(124, 58, 237, 0.8)']}
        style={styles.summaryGradient}
      >
        <View style={styles.summaryContent}>
          <View style={styles.summaryIconContainer}>
            <Target size={32} color="#FFFFFF" />
          </View>
          
          <Text style={styles.summaryTitle}>Målöversikt</Text>
          
          <View style={styles.summaryStatsContainer}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{summary.completed}</Text>
              <Text style={styles.summaryStatLabel}>Uppnådda</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{summary.inProgress}</Text>
              <Text style={styles.summaryStatLabel}>Pågående</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{summary.atRisk}</Text>
              <Text style={styles.summaryStatLabel}>I riskzon</Text>
            </View>
          </View>
          
          <View style={styles.summaryProgressContainer}>
            <View style={styles.summaryProgressHeader}>
              <Text style={styles.summaryProgressLabel}>Total framgång</Text>
              <Text style={styles.summaryProgressValue}>{summary.overallProgress}%</Text>
            </View>
            
            <View style={styles.summaryProgressBarContainer}>
              <View 
                style={[
                  styles.summaryProgressBar,
                  { width: `${summary.overallProgress}%` }
                ]}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Goal History Item Component
interface GoalHistoryItemProps {
  goal: HistoryGoalData;
  index: number;
  delay?: number;
}

const GoalHistoryItem: React.FC<GoalHistoryItemProps> = ({ goal, index, delay = 0 }) => {
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
  
  // Determine status color and icon
  const getStatusColor = () => {
    if (goal.status === 'completed') return '#10B981'; // Green
    if (goal.status === 'failed') return '#EF4444'; // Red
    return 'rgba(255, 255, 255, 0.5)'; // Default
  };
  
  const StatusIcon = () => {
    if (goal.status === 'completed') return <Check size={16} color="#10B981" />;
    if (goal.status === 'failed') return <X size={16} color="#EF4444" />;
    return null;
  };
  
  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.historyItem}>
        <View style={[styles.historyStatus, { backgroundColor: `${getStatusColor()}20` }]}>
          <StatusIcon />
        </View>
        
        <View style={styles.historyContent}>
          <Text style={styles.historyTitle}>{goal.title}</Text>
          <Text style={styles.historyTimeframe}>{goal.timeframe}</Text>
        </View>
        
        <View style={styles.historyResult}>
          <Text style={[styles.historyResultText, { color: getStatusColor() }]}>
            {goal.result}
          </Text>
          <Text style={styles.historyTargetText}>av {goal.target}</Text>
        </View>
      </View>
      
      {index < 4 && <Divider style={styles.historyDivider} />}
    </Animated.View>
  );
};

// New Goal Modal Component
interface NewGoalModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (goal: NewGoalData) => void;
}

const NewGoalModal: React.FC<NewGoalModalProps> = ({ visible, onDismiss, onSave }) => {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [timeframe, setTimeframe] = useState('Denna vecka');
  const [type, setType] = useState<'personal' | 'team'>('personal');
  const [timeframeModalVisible, setTimeframeModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  
  const handleSave = () => {
    if (!title || !target) return;
    
    onSave({
      title,
      target,
      timeframe,
      type
    });
    
    // Reset form
    setTitle('');
    setTarget('');
    setTimeframe('Denna vecka');
    setType('personal');
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
            <Text style={styles.modalTitle}>Nytt mål</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.modalCloseButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Titel</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.textInput}
              placeholder="T.ex. Öka försäljningen"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              theme={{ colors: { text: '#FFFFFF', placeholder: 'rgba(255, 255, 255, 0.4)' } }}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Målvärde (kr)</Text>
            <TextInput
              value={target}
              onChangeText={setTarget}
              style={styles.textInput}
              placeholder="T.ex. 50000"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              keyboardType="numeric"
              theme={{ colors: { text: '#FFFFFF', placeholder: 'rgba(255, 255, 255, 0.4)' } }}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Tidsram</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setTimeframeModalVisible(true)}
            >
              <Text style={styles.dropdownButtonText}>{timeframe}</Text>
              <ChevronDown size={20} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Måltyp</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setTypeModalVisible(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {type === 'personal' ? 'Personligt mål' : 'Teammål'}
              </Text>
              <ChevronDown size={20} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={!title || !target}
          >
            <LinearGradient
              colors={['#FACC15', '#F59E0B']}
              style={[
                styles.saveButtonGradient,
                (!title || !target) && styles.disabledButton
              ]}
            >
              <Text style={styles.saveButtonText}>Spara mål</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Timeframe Selection Modal */}
        <Modal
          visible={timeframeModalVisible}
          onDismiss={() => setTimeframeModalVisible(false)}
          contentContainerStyle={styles.selectionModalContainer}
        >
          <View style={styles.selectionModalContent}>
            <Text style={styles.selectionModalTitle}>Välj tidsram</Text>
            
            {['Idag', 'Denna vecka', 'Denna månad', 'Detta kvartal', 'Detta år'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.selectionItem,
                  timeframe === item && styles.selectedItem
                ]}
                onPress={() => {
                  setTimeframe(item);
                  setTimeframeModalVisible(false);
                }}
              >
                <Text 
                  style={[
                    styles.selectionItemText,
                    timeframe === item && styles.selectedItemText
                  ]}
                >
                  {item}
                </Text>
                {timeframe === item && (
                  <Check size={20} color="#FACC15" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setTimeframeModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        
        {/* Type Selection Modal */}
        <Modal
          visible={typeModalVisible}
          onDismiss={() => setTypeModalVisible(false)}
          contentContainerStyle={styles.selectionModalContainer}
        >
          <View style={styles.selectionModalContent}>
            <Text style={styles.selectionModalTitle}>Välj måltyp</Text>
            
            {[
              { id: 'personal', label: 'Personligt mål' },
              { id: 'team', label: 'Teammål' }
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.selectionItem,
                  type === item.id && styles.selectedItem
                ]}
                onPress={() => {
                  setType(item.id as 'personal' | 'team');
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

// Goal Detail Modal Component
interface GoalDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  goal: GoalData | null;
  onEdit: (goal: GoalData) => void;
  onDelete: (goal: GoalData) => void;
}

const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ visible, onDismiss, goal, onEdit, onDelete }) => {
  if (!goal) return null;
  
  // Determine status color
  const getStatusColor = () => {
    if (goal.status === 'completed') return '#10B981'; // Green
    if (goal.status === 'at_risk') return '#EF4444'; // Red
    if (goal.status === 'on_track') return '#FACC15'; // Yellow
    return 'rgba(255, 255, 255, 0.5)'; // Default
  };
  
  // Determine status text
  const getStatusText = () => {
    if (goal.status === 'completed') return 'Uppnått';
    if (goal.status === 'at_risk') return 'Risk';
    if (goal.status === 'on_track') return 'På väg';
    return 'Pågående';
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
            <Text style={styles.modalTitle}>Måldetaljer</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.modalCloseButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.goalDetailHeader}>
            <View style={styles.goalTypeContainer}>
              {goal.type === 'personal' ? (
                <User size={16} color="#FFFFFF" />
              ) : (
                <Users size={16} color="#FFFFFF" />
              )}
              <Text style={styles.goalType}>
                {goal.type === 'personal' ? 'Personligt mål' : 'Teammål'}
              </Text>
            </View>
            
            <View style={[styles.goalStatus, { backgroundColor: `${getStatusColor()}20` }]}>
              <Text style={[styles.goalStatusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.goalDetailTitle}>{goal.title}</Text>
          
          <View style={styles.goalDetailSection}>
            <Text style={styles.goalDetailSectionTitle}>Framsteg</Text>
            
            <View style={styles.goalDetailProgress}>
              <View style={styles.goalDetailProgressHeader}>
                <Text style={styles.goalDetailProgressLabel}>
                  {goal.current} av {goal.target}
                </Text>
                <Text style={styles.goalDetailProgressValue}>{goal.progress}%</Text>
              </View>
              
              <View style={styles.goalDetailProgressBarContainer}>
                <View 
                  style={[
                    styles.goalDetailProgressBar,
                    { width: `${goal.progress}%`, backgroundColor: getStatusColor() }
                  ]}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.goalDetailSection}>
            <Text style={styles.goalDetailSectionTitle}>Tidsram</Text>
            <View style={styles.goalDetailTimeContainer}>
              <Calendar size={16} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.goalDetailTimeText}>{goal.timeframe}</Text>
            </View>
          </View>
          
          {goal.description && (
            <View style={styles.goalDetailSection}>
              <Text style={styles.goalDetailSectionTitle}>Beskrivning</Text>
              <Text style={styles.goalDetailDescription}>{goal.description}</Text>
            </View>
          )}
          
          <View style={styles.goalDetailActions}>
            <TouchableOpacity 
              style={[styles.goalDetailAction, styles.editAction]}
              onPress={() => {
                onDismiss();
                onEdit(goal);
              }}
            >
              <Edit size={20} color="#FFFFFF" />
              <Text style={styles.goalDetailActionText}>Redigera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.goalDetailAction, styles.deleteAction]}
              onPress={() => {
                onDismiss();
                onDelete(goal);
              }}
            >
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.goalDetailActionText, styles.deleteActionText]}>Ta bort</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

export default function GoalsScreen() {
  // State
  const [activeTab, setActiveTab] = useState('current');
  const [newGoalModalVisible, setNewGoalModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalData | null>(null);
  const [goalDetailModalVisible, setGoalDetailModalVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Mock data
  const mockData = {
    summary: {
      completed: 8,
      inProgress: 3,
      atRisk: 1,
      overallProgress: 72
    },
    currentGoals: [
      {
        id: 1,
        title: 'Öka försäljningen',
        target: '50 000 kr',
        current: '32 500 kr',
        progress: 65,
        timeframe: 'Denna vecka',
        status: 'on_track',
        type: 'personal',
        description: 'Öka den personliga försäljningen genom att fokusera på premium-produkter och merförsäljning.'
      },
      {
        id: 2,
        title: 'Nya kunder',
        target: '10 st',
        current: '4 st',
        progress: 40,
        timeframe: 'Denna månad',
        status: 'at_risk',
        type: 'personal'
      },
      {
        id: 3,
        title: 'Teamförsäljning',
        target: '200 000 kr',
        current: '185 000 kr',
        progress: 92,
        timeframe: 'Detta kvartal',
        status: 'on_track',
        type: 'team',
        description: 'Gemensamt mål för hela teamet att nå 200 000 kr i försäljning under kvartalet.'
      },
      {
        id: 4,
        title: 'Kundnöjdhet',
        target: '95%',
        current: '95%',
        progress: 100,
        timeframe: 'Denna månad',
        status: 'completed',
        type: 'team'
      }
    ],
    historyGoals: [
      {
        id: 101,
        title: 'Veckoförsäljning',
        target: '30 000 kr',
        result: '32 500 kr',
        timeframe: 'Förra veckan',
        status: 'completed'
      },
      {
        id: 102,
        title: 'Nya kunder',
        target: '5 st',
        result: '3 st',
        timeframe: 'Förra veckan',
        status: 'failed'
      },
      {
        id: 103,
        title: 'Produktdemo',
        target: '10 st',
        result: '12 st',
        timeframe: 'Förra månaden',
        status: 'completed'
      },
      {
        id: 104,
        title: 'Uppföljningssamtal',
        target: '20 st',
        result: '22 st',
        timeframe: 'Förra månaden',
        status: 'completed'
      },
      {
        id: 105,
        title: 'Teamförsäljning',
        target: '150 000 kr',
        result: '162 000 kr',
        timeframe: 'Förra kvartalet',
        status: 'completed'
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
  
  // Handle goal press
  const handleGoalPress = (goal: GoalData) => {
    setSelectedGoal(goal);
    setGoalDetailModalVisible(true);
  };
  
  // Handle new goal save
  const handleSaveGoal = (newGoal: NewGoalData) => {
    console.log('New goal:', newGoal);
    // Here you would typically save the goal to your backend
    setNewGoalModalVisible(false);
  };
  
  // Handle goal edit
  const handleEditGoal = (goal: GoalData) => {
    console.log('Edit goal:', goal);
    // Here you would typically open an edit modal
  };
  
  // Handle goal delete
  const handleDeleteGoal = (goal: GoalData) => {
    console.log('Delete goal:', goal);
    // Here you would typically show a confirmation dialog and then delete
  };
  
  return (
    <>
      <StatusBar style="light" />
      
      <Stack.Screen
        options={{
          title: 'Mål',
          headerStyle: {
            backgroundColor: '#5B21B6', // Primary color
          },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />
      
      <ImageBackground
        style={styles.emptyStateContainer}
        source={require('@assets/images/pling_confetti_bg.png')}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Goal Summary */}
            <GoalSummary 
              summary={mockData.summary}
              delay={100}
            />
            
            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'current' && styles.activeTab
                ]}
                onPress={() => setActiveTab('current')}
              >
                <Text 
                  style={[
                    styles.tabText,
                    activeTab === 'current' && styles.activeTabText
                  ]}
                >
                  Aktuella mål
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'history' && styles.activeTab
                ]}
                onPress={() => setActiveTab('history')}
              >
                <Text 
                  style={[
                    styles.tabText,
                    activeTab === 'history' && styles.activeTabText
                  ]}
                >
                  Historik
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Current Goals */}
            {activeTab === 'current' && (
              <View style={styles.goalsContainer}>
                {mockData.currentGoals.map((goal, index) => (
                  <GoalProgress
                    key={goal.id}
                    goal={goal}
                    delay={index * 100 + 200}
                    onPress={handleGoalPress}
                  />
                ))}
                
                {/* Add New Goal Button */}
                <TouchableOpacity
                  style={styles.addGoalButton}
                  onPress={() => setNewGoalModalVisible(true)}
                >
                  <View style={styles.addGoalIconContainer}>
                    <Plus size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.addGoalText}>Lägg till nytt mål</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Goal History */}
            {activeTab === 'history' && (
              <View style={styles.historyContainer}>
                <GlassCard style={styles.historyCard}>
                  {mockData.historyGoals.map((goal, index) => (
                    <GoalHistoryItem
                      key={goal.id}
                      goal={goal}
                      index={index}
                      delay={index * 100 + 200}
                    />
                  ))}
                </GlassCard>
              </View>
            )}
            
            {/* Extra padding for bottom navigation */}
            <View style={styles.bottomNavPadding} />
          </ScrollView>
        </SafeAreaView>
        
        {/* New Goal Modal */}
        <NewGoalModal
          visible={newGoalModalVisible}
          onDismiss={() => setNewGoalModalVisible(false)}
          onSave={handleSaveGoal}
        />
        
        {/* Goal Detail Modal */}
        <GoalDetailModal
          visible={goalDetailModalVisible}
          onDismiss={() => setGoalDetailModalVisible(false)}
          goal={selectedGoal}
          onEdit={handleEditGoal}
          onDelete={handleDeleteGoal}
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
  summaryContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryGradient: {
    borderRadius: 16,
  },
  summaryContent: {
    padding: 20,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  summaryProgressContainer: {
    width: '100%',
  },
  summaryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryProgressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryProgressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FACC15',
  },
  summaryProgressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryProgressBar: {
    height: '100%',
    backgroundColor: '#FACC15',
    borderRadius: 4,
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
  goalsContainer: {
    marginBottom: 16,
  },
  goalCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(91, 33, 182, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  goalCardContent: {
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  goalType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  goalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  goalStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  goalDetails: {
    marginBottom: 12,
  },
  goalTarget: {
    marginBottom: 8,
  },
  goalTargetLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  goalTargetValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  goalProgress: {
    marginBottom: 4,
  },
  goalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalProgressLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  goalProgressValue: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalTimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },
  addGoalButton: {
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
  addGoalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(91, 33, 182, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addGoalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  historyContainer: {
    marginBottom: 16,
  },
  historyCard: {
    padding: 0,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  historyStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  historyTimeframe: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  historyResult: {
    alignItems: 'flex-end',
  },
  historyResultText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  historyTargetText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  historyDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalContainer: {
    backgroundColor: 'rgba(30, 27, 75, 0.95)',
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalContent: {
    padding: 20,
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
  goalDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  goalDetailSection: {
    marginBottom: 20,
  },
  goalDetailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  goalDetailProgress: {
    marginBottom: 4,
  },
  goalDetailProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalDetailProgressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  goalDetailProgressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FACC15',
  },
  goalDetailProgressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalDetailProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  goalDetailTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalDetailTimeText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  goalDetailDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  goalDetailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  goalDetailAction: {
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
  goalDetailActionText: {
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
  emptyStateContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
}); 