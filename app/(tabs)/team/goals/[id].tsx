import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, ArrowLeft, CreditCard as Edit, Trash, CircleCheck as CheckCircle, Circle as XCircle, Archive } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { getGoalDetails, updateGoalStatus, deleteGoal, getGoalEntries, addGoalEntry } from '@/services/goalService';
import { Goal, GoalStatus } from '@/types';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import GoalDetailCard from '@/components/goals/GoalDetailCard';
import MilestonesList from '@/components/goals/MilestonesList';
import GoalEntriesList from '@/components/goals/GoalEntriesList';

export default function TeamGoalDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      router.replace('/team/goals');
      return;
    }
    
    loadGoalData();
  }, [id]);

  const loadGoalData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [goalData, entriesData] = await Promise.all([
        getGoalDetails(id as string),
        getGoalEntries(id as string)
      ]);
      
      if (!goalData) {
        setError('Goal not found');
        return;
      }
      
      setGoal(goalData);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading goal data:', error);
      setError('Failed to load goal data');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is team leader or owner
  const isTeamLeader = user?.team?.members?.some(
    m => m.userId === user.id && (m.role === 'leader' || m.role === 'owner')
  );

  const handleStatusUpdate = async (newStatus: GoalStatus) => {
    if (!goal || !isTeamLeader) return;
    
    try {
      setIsUpdating(true);
      const success = await updateGoalStatus(goal.id, newStatus);
      
      if (success) {
        setGoal({ ...goal, status: newStatus });
      } else {
        setError('Failed to update goal status');
      }
    } catch (error) {
      console.error('Error updating goal status:', error);
      setError('Failed to update goal status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!goal || !isTeamLeader) return;
    
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this team goal? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              const success = await deleteGoal(goal.id);
              
              if (success) {
                router.replace('/team/goals');
              } else {
                setError('Failed to delete goal');
              }
            } catch (error) {
              console.error('Error deleting goal:', error);
              setError('Failed to delete goal');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleAddEntry = async () => {
    if (!goal) return;
    
    Alert.prompt(
      'Add Manual Entry',
      `Enter the ${goal.type === 'sales_amount' ? 'amount' : 'count'} to add:`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Add',
          onPress: async (value) => {
            if (!value || isNaN(Number(value)) || Number(value) <= 0) {
              Alert.alert('Invalid Value', 'Please enter a valid positive number');
              return;
            }
            
            try {
              setIsUpdating(true);
              const success = await addGoalEntry(goal.id, Number(value));
              
              if (success) {
                await loadGoalData();
              } else {
                setError('Failed to add entry');
              }
            } catch (error) {
              console.error('Error adding entry:', error);
              setError('Failed to add entry');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  if (isLoading) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header 
          title="Team Goal" 
          icon={Target}
          leftIcon={ArrowLeft}
          onLeftIconPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Loading goal details...
          </Text>
        </View>
      </Container>
    );
  }

  if (error || !goal) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header 
          title="Team Goal" 
          icon={Target}
          leftIcon={ArrowLeft}
          onLeftIconPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || 'Goal not found'}
          </Text>
          <Button
            title="Go Back"
            variant="outline"
            size="medium"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Team Goal" 
        icon={Target}
        leftIcon={ArrowLeft}
        onLeftIconPress={() => router.back()}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <GoalDetailCard goal={goal} />
        
        {/* Action Buttons - Only for team leaders */}
        {isTeamLeader && (
          <View style={styles.actionButtons}>
            {goal.status === 'active' && (
              <>
                <Button
                  title="Complete"
                  icon={CheckCircle}
                  onPress={() => handleStatusUpdate('completed')}
                  variant="outline"
                  size="medium"
                  style={[styles.actionButton, { borderColor: colors.success }]}
                  loading={isUpdating}
                />
                
                <Button
                  title="Add Entry"
                  icon={Plus}
                  onPress={handleAddEntry}
                  variant="primary"
                  size="medium"
                  style={styles.actionButton}
                  loading={isUpdating}
                />
              </>
            )}
            
            {goal.status === 'active' && (
              <Button
                title="Archive"
                icon={Archive}
                onPress={() => handleStatusUpdate('archived')}
                variant="outline"
                size="medium"
                style={styles.actionButton}
                loading={isUpdating}
              />
            )}
            
            {goal.status === 'archived' && (
              <Button
                title="Reactivate"
                icon={CheckCircle}
                onPress={() => handleStatusUpdate('active')}
                variant="outline"
                size="medium"
                style={[styles.actionButton, { borderColor: colors.success }]}
                loading={isUpdating}
              />
            )}
            
            <Button
              title="Delete"
              icon={Trash}
              onPress={handleDeleteGoal}
              variant="outline"
              size="medium"
              style={[styles.actionButton, { borderColor: colors.error }]}
              loading={isUpdating}
            />
          </View>
        )}
        
        {/* Milestones */}
        {goal.milestones && goal.milestones.length > 0 && (
          <MilestonesList 
            milestones={goal.milestones}
            currentValue={goal.currentValue}
            targetValue={goal.targetValue}
            style={styles.section}
          />
        )}
        
        {/* Entries */}
        <GoalEntriesList 
          entries={entries}
          isAmount={goal.type === 'sales_amount'}
          style={styles.section}
        />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    minWidth: 120,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 20,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  section: {
    marginTop: 24,
  },
});