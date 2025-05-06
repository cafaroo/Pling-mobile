import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { 
  Target, 
  Calendar, 
  Award, 
  Clock, 
  User, 
  Users, 
  Edit2, 
  Trash2,
  BarChart3,
  Book,
  Flame,
  Link
} from 'lucide-react-native';
import { Goal, GoalStatus, GoalType, Milestone } from '@/types/goal';
import { format, formatDistance, isPast } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import Animated, { FadeIn } from 'react-native-reanimated';
import { RelatedGoalsList } from './RelatedGoalsList';
import { TagList } from './TagList';
import { useRemoveTagFromGoal } from '@/hooks/useTags';

interface GoalDetailCardProps {
  goal: Goal;
  onEdit?: () => void;
  onDelete?: () => void;
  onRelatedGoalPress?: (goal: Goal) => void;
  isEditable?: boolean;
  style?: object;
}

/**
 * GoalDetailCard - En komponent för att visa detaljerad information om ett mål
 */
export const GoalDetailCard: React.FC<GoalDetailCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onRelatedGoalPress,
  isEditable = true,
  style
}) => {
  const { colors } = useTheme();
  const removeTagMutation = useRemoveTagFromGoal();
  
  // Beräkna progress som ett procenttal
  const progressPercent = goal.target > 0
    ? Math.min(100, (goal.current / goal.target) * 100)
    : 0;
  
  // Hämta färg baserat på status
  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case 'active':
        return colors.primary.light;
      case 'completed':
        return colors.success;
      case 'paused':
        return colors.accent.yellow;
      case 'canceled':
        return colors.error;
      default:
        return colors.text.light;
    }
  };
  
  // Formatera tid kvar till deadline
  const getTimeRemaining = () => {
    if (!goal.deadline) return null;
    
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();
    
    if (isPast(deadlineDate)) {
      return 'Försenad';
    }
    
    return formatDistance(deadlineDate, now, { 
      locale: sv,
      addSuffix: true 
    });
  };
  
  // Få typ-ikon
  const getTypeIcon = (type: GoalType) => {
    switch (type) {
      case 'performance':
        return <BarChart3 size={20} color={colors.accent.yellow} />;
      case 'learning':
        return <Book size={20} color={colors.accent.yellow} />;
      case 'habit':
        return <Flame size={20} color={colors.accent.yellow} />;
      case 'project':
        return <Target size={20} color={colors.accent.yellow} />;
      default:
        return <Award size={20} color={colors.accent.yellow} />;
    }
  };
  
  // Få svårighetsgrad som text
  const getDifficultyText = () => {
    switch (goal.difficulty) {
      case 'easy':
        return 'Lätt';
      case 'medium':
        return 'Medium';
      case 'hard':
        return 'Svår';
      default:
        return 'Medium';
    }
  };
  
  // Få status som text
  const getStatusText = () => {
    switch (goal.status) {
      case 'active':
        return 'Aktiv';
      case 'completed':
        return 'Avklarad';
      case 'paused':
        return 'Pausad';
      case 'canceled':
        return 'Avbruten';
      default:
        return 'Aktiv';
    }
  };
  
  // Få scope som text
  const getScopeText = () => {
    return goal.scope === 'team' ? 'Team' : 'Individuell';
  };
  
  // Hantera borttagning av tagg
  const handleRemoveTag = async (tagId: string) => {
    if (!goal.id) return;
    
    try {
      await removeTagMutation.mutateAsync({ 
        goalId: goal.id, 
        tagId 
      });
    } catch (error) {
      console.error('Fel vid borttagning av tagg:', error);
    }
  };
  
  return (
    <Animated.View entering={FadeIn} style={style}>
      <BlurView 
        intensity={30} 
        tint="dark" 
        style={[styles.container, { backgroundColor: 'rgba(60, 60, 90, 0.3)' }]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text.main }]}>
              {goal.title}
            </Text>
            
            <View style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(goal.status) }
            ]}>
              <Text style={styles.statusText}>
                {getStatusText()}
              </Text>
            </View>
            
            {isEditable && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={onEdit}
              >
                <Edit2 size={16} color={colors.text.light} />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={[styles.description, { color: colors.text.light }]}>
            {goal.description || 'Ingen beskrivning'}
          </Text>
          
          {/* Visa taggar om de finns */}
          {goal.tags && goal.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <TagList 
                tags={goal.tags} 
                onRemoveTag={isEditable ? handleRemoveTag : undefined}
                scrollable
              />
            </View>
          )}
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.text.main }]}>
              Framsteg
            </Text>
            <Text style={[styles.progressValue, { color: colors.accent.yellow }]}>
              {Math.round(progressPercent)}%
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
          
          <View style={styles.valueContainer}>
            <Text style={[styles.currentValue, { color: colors.text.main }]}>
              {goal.current}
            </Text>
            <Text style={[styles.targetValue, { color: colors.text.light }]}>
              av {goal.target} {goal.unit || ''}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailsGrid}>
          <View style={[styles.detailItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
            {getTypeIcon(goal.type)}
            <Text style={[styles.detailLabel, { color: colors.text.light }]}>
              Typ
            </Text>
            <Text style={[styles.detailValue, { color: colors.text.main }]}>
              {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
            </Text>
          </View>
          
          <View style={[styles.detailItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
            <Award size={20} color={colors.accent.yellow} />
            <Text style={[styles.detailLabel, { color: colors.text.light }]}>
              Svårighetsgrad
            </Text>
            <Text style={[styles.detailValue, { color: colors.text.main }]}>
              {getDifficultyText()}
            </Text>
          </View>
          
          <View style={[styles.detailItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
            <Users size={20} color={colors.accent.yellow} />
            <Text style={[styles.detailLabel, { color: colors.text.light }]}>
              Scope
            </Text>
            <Text style={[styles.detailValue, { color: colors.text.main }]}>
              {getScopeText()}
            </Text>
          </View>
          
          {goal.deadline && (
            <View style={[styles.detailItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
              <Clock size={20} color={colors.accent.yellow} />
              <Text style={[styles.detailLabel, { color: colors.text.light }]}>
                Tid kvar
              </Text>
              <Text style={[styles.detailValue, { color: colors.text.main }]}>
                {getTimeRemaining()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.dateSection}>
          <View style={styles.dateItem}>
            <Text style={[styles.dateLabel, { color: colors.text.light }]}>
              Startdatum
            </Text>
            <Text style={[styles.dateValue, { color: colors.text.main }]}>
              {format(new Date(goal.start_date), 'd MMM yyyy', { locale: sv })}
            </Text>
          </View>
          
          {goal.deadline && (
            <View style={styles.dateItem}>
              <Text style={[styles.dateLabel, { color: colors.text.light }]}>
                Deadline
              </Text>
              <Text style={[styles.dateValue, { color: colors.text.main }]}>
                {format(new Date(goal.deadline), 'd MMM yyyy', { locale: sv })}
              </Text>
            </View>
          )}
          
          <View style={styles.dateItem}>
            <Text style={[styles.dateLabel, { color: colors.text.light }]}>
              Skapad
            </Text>
            <Text style={[styles.dateValue, { color: colors.text.main }]}>
              {format(new Date(goal.created_at), 'd MMM yyyy', { locale: sv })}
            </Text>
          </View>
        </View>
        
        {goal.milestones && goal.milestones.length > 0 && (
          <View style={styles.milestonesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
              Milstolpar
            </Text>
            
            {goal.milestones.map((milestone, index) => (
              <View 
                key={milestone.id} 
                style={[styles.milestoneItem, index === goal.milestones.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={styles.milestoneHeader}>
                  <View style={styles.milestoneIconContainer}>
                    <View 
                      style={[
                        styles.milestoneIcon, 
                        { 
                          backgroundColor: milestone.is_completed 
                            ? colors.success 
                            : 'rgba(255, 255, 255, 0.2)' 
                        }
                      ]} 
                    />
                    {index < goal.milestones.length - 1 && (
                      <View style={[styles.milestoneLine, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
                    )}
                  </View>
                  
                  <Text 
                    style={[
                      styles.milestoneTitle, 
                      { 
                        color: milestone.is_completed ? colors.text.light : colors.text.main,
                        textDecorationLine: milestone.is_completed ? 'line-through' : 'none'
                      }
                    ]}
                  >
                    {milestone.title}
                  </Text>
                </View>
                
                {milestone.description && (
                  <Text style={[styles.milestoneDescription, { color: colors.text.light }]}>
                    {milestone.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
        
        {goal.id && (
          <View style={styles.relatedGoalsSection}>
            <RelatedGoalsList 
              goalId={goal.id} 
              onGoalPress={onRelatedGoalPress}
              canEdit={isEditable}
            />
          </View>
        )}
        
        {isEditable && (
          <View style={styles.buttonContainer}>
            {onEdit && (
              <Button
                title="Redigera"
                icon={Edit2}
                onPress={onEdit}
                variant="outline"
                style={styles.editButton}
              />
            )}
            
            {onDelete && (
              <Button
                title="Ta bort"
                icon={Trash2}
                onPress={onDelete}
                variant="outline"
                style={[styles.deleteButton, { borderColor: colors.error }]}
                textStyle={{ color: colors.error }}
                iconColor={colors.error}
              />
            )}
          </View>
        )}
      </BlurView>
    </Animated.View>
  );
};

// Checkbox-komponenten för milstolpar
const Check = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size }}>
    <View style={{
      width: size - 4,
      height: size / 2 - 2,
      borderLeftWidth: 2,
      borderBottomWidth: 2,
      borderColor: color,
      transform: [{ rotate: '-45deg' }],
      marginTop: 1,
    }} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
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
    borderRadius: 5,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 5,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  targetValue: {
    fontSize: 16,
    marginLeft: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dateSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  dateItem: {
    minWidth: '33%',
    flex: 1,
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  milestonesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  milestoneLine: {
    width: 1,
    height: '100%',
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 12,
  },
  relatedGoalsSection: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  editButton: {
    minWidth: 120,
  },
  deleteButton: {
    minWidth: 120,
  },
  tagsSection: {
    marginTop: 12,
  },
});