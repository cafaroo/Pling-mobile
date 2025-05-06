import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { Link, ArrowRight, ArrowLeft, Unlink, Target, BarChart3, Book, Flame, Award } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Goal, GoalType, GoalRelationType } from '@/types/goal';

interface RelatedGoalCardProps {
  goal: Goal;
  relationType: GoalRelationType;
  isSource?: boolean; // Om true, detta mål är källan i relationen
  onPress?: (goal: Goal) => void;
  onRemoveRelation?: () => void;
  style?: object;
}

/**
 * RelatedGoalCard - En kompakt komponent för att visa ett relaterat mål
 */
export const RelatedGoalCard: React.FC<RelatedGoalCardProps> = ({
  goal,
  relationType,
  isSource = false,
  onPress,
  onRemoveRelation,
  style
}) => {
  const { colors } = useTheme();

  // Beräkna progress som ett procenttal
  const progressPercent = goal.target > 0
    ? Math.min(100, (goal.current / goal.target) * 100)
    : 0;

  // Få rätt relationsbeskrivning
  const getRelationTypeText = () => {
    switch (relationType) {
      case 'parent':
        return isSource ? 'Förälder till' : 'Delmål av';
      case 'child':
        return isSource ? 'Delmål av' : 'Förälder till';
      case 'related':
      default:
        return 'Relaterad till';
    }
  };

  // Få ikon för måltyp
  const getTypeIcon = () => {
    const iconSize = 16;
    const iconColor = colors.accent.yellow;

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

  // Få riktningspil baserat på relationstyp
  const getRelationIcon = () => {
    if (relationType === 'parent' && !isSource) {
      return <ArrowLeft size={16} color={colors.text.light} />;
    } else if (relationType === 'child' && !isSource) {
      return <ArrowRight size={16} color={colors.text.light} />;
    } else if (relationType === 'parent' && isSource) {
      return <ArrowRight size={16} color={colors.text.light} />;
    } else if (relationType === 'child' && isSource) {
      return <ArrowLeft size={16} color={colors.text.light} />;
    } else {
      return <Link size={16} color={colors.text.light} />;
    }
  };

  // Få bakgrundsfärg baserat på scope
  const getBackgroundColor = () => {
    return goal.scope === 'team'
      ? 'rgba(91, 33, 182, 0.2)' // Lila för team
      : 'rgba(79, 70, 229, 0.2)'; // Blå för individuella
  };

  // Få badge text baserat på scope
  const getScopeText = () => {
    return goal.scope === 'team' ? 'Team' : 'Individuell';
  };

  return (
    <Animated.View entering={FadeIn} style={[styles.container, style]}>
      <BlurView
        intensity={20}
        tint="dark"
        style={[styles.blurContainer, { backgroundColor: getBackgroundColor() }]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => onPress?.(goal)}
          activeOpacity={0.7}
        >
          <View style={styles.leftContent}>
            <View style={styles.relationHeader}>
              {getRelationIcon()}
              <Text style={[styles.relationType, { color: colors.text.light }]}>
                {getRelationTypeText()}
              </Text>
            </View>
            
            <View style={styles.titleRow}>
              {getTypeIcon()}
              <Text style={[styles.title, { color: colors.text.main }]} numberOfLines={1}>
                {goal.title}
              </Text>
            </View>
            
            <Text style={[styles.scope, { color: goal.scope === 'team' ? colors.primary.light : colors.accent.pink }]}>
              {getScopeText()}
            </Text>
          </View>
          
          <View style={styles.rightContent}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressText, { color: colors.text.main }]}>
                {Math.round(progressPercent)}%
              </Text>
              <Text style={[styles.progressDetail, { color: colors.text.light }]}>
                {goal.current}/{goal.target}
              </Text>
            </View>
            
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
          </View>
          
          {onRemoveRelation && (
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={onRemoveRelation}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Unlink size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  blurContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
  },
  relationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  relationType: {
    fontSize: 12,
    marginLeft: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
    flex: 1,
  },
  scope: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  rightContent: {
    alignItems: 'flex-end',
    width: 80,
  },
  progressInfo: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressDetail: {
    fontSize: 12,
  },
  progressBarContainer: {
    height: 6,
    width: 80,
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
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  }
}); 