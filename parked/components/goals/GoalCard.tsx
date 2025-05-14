import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { Target, Award, Clock, BarChart3, Flame, Book } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Goal, GoalType, GoalScope } from '@/types/goal';
import { LinearGradient } from 'expo-linear-gradient';
import { TagList } from './TagList';

// Interface för props som komponenten tar emot
interface GoalCardProps {
  goal: Goal;
  onPress?: (goal: Goal) => void;
  variant?: 'default' | 'compact' | 'detailed';
  style?: object;
}

/**
 * GoalCard - En komponent för att visa ett mål i en kortvy
 */
export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onPress,
  variant = 'default',
  style
}) => {
  const { colors } = useTheme();

  // Beräkna progress som ett procenttal
  const progressPercent = goal.target > 0
    ? Math.min(100, (goal.current / goal.target) * 100)
    : 0;

  // Returnera rätt ikon baserat på måltyp
  const renderTypeIcon = () => {
    const iconSize = variant === 'compact' ? 18 : 22;
    const iconColor = goal.scope === 'team' ? colors.accent.yellow : colors.primary.light;

    switch (goal.type) {
      case 'performance':
        return <BarChart3 size={iconSize} color={iconColor} />;
      case 'learning':
        return <Book size={iconSize} color={iconColor} />;
      case 'habit':
        return <Flame size={iconSize} color={iconColor} />;
      case 'project':
        return <Target size={iconSize} color={iconColor} />;
      default:
        return <Award size={iconSize} color={iconColor} />;
    }
  };

  // Beräkna dagar kvar, om deadline är satt
  const getDaysRemaining = () => {
    if (!goal.deadline) return null;
    
    const today = new Date();
    const deadline = new Date(goal.deadline);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Formatera dagar kvar som en text
  const getDaysRemainingText = () => {
    const days = getDaysRemaining();
    if (days === null) return null;
    
    if (days < 0) return 'Försenad';
    if (days === 0) return 'Idag';
    if (days === 1) return 'Imorgon';
    return `${days} dagar kvar`;
  };

  // Hämta bakgrundsfärg baserat på status och scope
  const getBackgroundColor = () => {
    if (goal.status === 'completed') {
      return 'rgba(16, 185, 129, 0.3)'; // Grön för avklarade mål
    }
    
    if (goal.status === 'canceled') {
      return 'rgba(239, 68, 68, 0.2)'; // Röd för avbrutna mål
    }
    
    // Vanligt mål
    return goal.scope === 'team' 
      ? 'rgba(91, 33, 182, 0.2)' // Lila för team
      : 'rgba(79, 70, 229, 0.2)'; // Blå för individuella
  };

  // Renderar badge baserat på scope
  const renderScopeBadge = () => {
    if (variant === 'compact') return null;
    
    const badgeColor = goal.scope === 'team' 
      ? colors.primary.main
      : colors.accent.pink;
      
    const badgeText = goal.scope === 'team' 
      ? 'Team'
      : goal.team_id ? 'Team-relaterad' : 'Individuell';
      
    return (
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{badgeText}</Text>
      </View>
    );
  };

  // Renderar progress bar
  const renderProgressBar = () => {
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBackground} />
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${progressPercent}%`,
              backgroundColor: progressPercent >= 100 
                ? colors.success 
                : colors.accent.yellow
            }
          ]} 
        />
      </View>
    );
  };

  // Renderar deadline
  const renderDeadline = () => {
    const daysText = getDaysRemainingText();
    if (!daysText) return null;
    
    const days = getDaysRemaining();
    const textColor = days && days < 0 
      ? colors.error 
      : days && days <= 3 
        ? colors.accent.yellow 
        : colors.text.light;
    
    return (
      <View style={styles.deadlineContainer}>
        <Clock size={12} color={textColor} />
        <Text style={[styles.deadlineText, { color: textColor }]}>
          {daysText}
        </Text>
      </View>
    );
  };

  // Renderar taggar om de finns
  const renderTags = () => {
    if (!goal.tags || goal.tags.length === 0) return null;
    
    // I kompakt läge visa färre taggar
    const maxDisplay = variant === 'compact' ? 1 : variant === 'detailed' ? 5 : 3;
    
    return (
      <TagList 
        tags={goal.tags} 
        size={variant === 'compact' ? 'small' : 'medium'}
        maxDisplay={maxDisplay}
        scrollable={variant === 'detailed'}
        style={styles.tagList}
      />
    );
  };

  // Bygg slutlig komponent
  return (
    <Animated.View entering={FadeIn}>
      <Pressable
        style={[styles.container, style]}
        onPress={() => onPress && onPress(goal)}
      >
        <BlurView 
          intensity={30} 
          tint="dark" 
          style={[styles.blurContainer, { backgroundColor: getBackgroundColor() }]}
        >
          <View style={styles.cardContent}>
            <View style={styles.headerContainer}>
              {renderTypeIcon()}
              {renderScopeBadge()}
              {renderDeadline()}
            </View>
            
            <Text 
              style={[styles.title, { color: colors.text.main }]}
              numberOfLines={2}
            >
              {goal.title}
            </Text>
            
            {variant !== 'compact' && (
              <Text 
                style={[styles.description, { color: colors.text.light }]}
                numberOfLines={2}
              >
                {goal.description}
              </Text>
            )}
            
            {/* Taggar visas här, om de finns */}
            {renderTags()}
            
            <View style={styles.footerContainer}>
              <View style={styles.progressTextContainer}>
                <Text style={[styles.progressText, { color: colors.text.main }]}>
                  {`${Math.round(progressPercent)}%`}
                </Text>
                
                {goal.unit && (
                  <Text style={[styles.unitText, { color: colors.text.light }]}>
                    {`${goal.current}/${goal.target} ${goal.unit}`}
                  </Text>
                )}
              </View>
              
              {variant === 'detailed' && goal.milestones && goal.milestones.length > 0 && (
                <View style={styles.milestonesContainer}>
                  <Text style={[styles.milestonesText, { color: colors.text.light }]}>
                    {`${goal.milestones.filter(m => m.is_completed).length}/${goal.milestones.length} milstolpar`}
                  </Text>
                </View>
              )}
            </View>
            
            {renderProgressBar()}
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  tagList: {
    marginTop: 8,
    marginBottom: 12,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  deadlineText: {
    fontSize: 12,
    marginLeft: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressTextContainer: {
    flexDirection: 'column',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: 12,
  },
  milestonesContainer: {
    alignItems: 'flex-end',
  },
  milestonesText: {
    fontSize: 12,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 3,
  }
});