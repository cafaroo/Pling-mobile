import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useActiveTeam } from '@/hooks/useTeam';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { GoalDetailCard } from '@/components/goals/GoalDetailCard';
import { useGoal, useUpdateGoalProgress, useDeleteGoal } from '@/hooks/useGoals';
import { Goal } from '@/types/goal';
import { GoalForm } from '@/components/goals/GoalForm';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * TeamGoalDetailScreen - Skärm för att visa detaljer för ett team-mål
 */
export default function TeamGoalDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { activeTeam } = useActiveTeam();
  
  const [isEditing, setIsEditing] = useState(false);
  
  // Hämta målinformation
  const { 
    data: goal, 
    isLoading, 
    isError, 
    refetch 
  } = useGoal(id);
  
  // Mutations
  const updateProgress = useUpdateGoalProgress();
  const deleteGoal = useDeleteGoal();
  
  // Navigera till relaterat mål
  const handleRelatedGoalPress = (relatedGoal: Goal) => {
    // Om relaterat mål är individuellt, navigera till individuell mål-skärmen
    if (relatedGoal.scope === 'individual') {
      router.push(`/goals/${relatedGoal.id}`);
    } else {
      // Annars navigera till team-mål
      router.push(`/team/goals/${relatedGoal.id}`);
    }
  };
  
  // Hantera borttagning av mål
  const handleDeleteGoal = () => {
    Alert.alert(
      'Ta bort mål',
      'Är du säker på att du vill ta bort det här målet? Detta kan inte ångras.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Ta bort', 
          style: 'destructive',
          onPress: () => {
            deleteGoal.mutate(id, {
              onSuccess: () => {
                router.back();
              }
            });
          }
        }
      ]
    );
  };
  
  // Hantera öppna redigering
  const handleEditGoal = () => {
    setIsEditing(true);
  };
  
  // Hantera avsluta redigering
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  // Hantera spara redigerat mål
  const handleSaveEdit = () => {
    setIsEditing(false);
    refetch();
  };
  
  // Kontrollera om användaren är team-admin
  const isTeamAdmin = (): boolean => {
    if (!user || !activeTeam) return false;
    
    const userTeamRole = activeTeam.members.find(m => m.user_id === user.id)?.role;
    return userTeamRole === 'admin' || userTeamRole === 'owner';
  };
  
  if (isLoading) {
    return (
      <Container>
        <Header title="Team-måldetaljer" leftIcon={<ArrowLeft color={colors.text.main} />} onBackPress={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.yellow} />
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Laddar team-målinformation...
          </Text>
        </View>
      </Container>
    );
  }
  
  if (isError || !goal) {
    return (
      <Container>
        <Header title="Team-måldetaljer" leftIcon={<ArrowLeft color={colors.text.main} />} onBackPress={() => router.back()} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Kunde inte hämta team-målinformation
          </Text>
          <Button
            title="Försök igen"
            onPress={() => refetch()}
            style={{ marginTop: 16 }}
          />
        </View>
      </Container>
    );
  }
  
  // Kontrollera om användaren har rättigheter att redigera målet
  const canEdit = goal.created_by === user?.id || isTeamAdmin();
  
  return (
    <Container>
      <Header 
        title={isEditing ? "Redigera team-mål" : "Team-måldetaljer"} 
        leftIcon={<ArrowLeft color={colors.text.main} />} 
        onBackPress={() => isEditing ? setIsEditing(false) : router.back()} 
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {isEditing ? (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <GoalForm
              initialValues={goal}
              onCancel={handleCancelEdit}
              onSuccess={handleSaveEdit}
              mode="edit"
              teamId={activeTeam?.id}
              isTeamGoal={true}
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn}>
            <GoalDetailCard 
              goal={goal} 
              onEdit={canEdit ? handleEditGoal : undefined}
              onDelete={canEdit ? handleDeleteGoal : undefined}
              onRelatedGoalPress={handleRelatedGoalPress}
              isEditable={canEdit}
            />
            
            {goal.status === 'active' && canEdit && (
              <Button
                title="Uppdatera teamets framsteg"
                icon={Plus}
                onPress={() => {
                  // Här kan vi implementera en modal för att uppdatera framsteg
                  // eller navigera till en dedikerad skärm
                  Alert.alert(
                    "Funktionen kommer snart",
                    "Framstegsuppdatering via UI kommer att implementeras i nästa iteration."
                  );
                }}
                style={styles.updateButton}
              />
            )}
          </Animated.View>
        )}
        
        {/* Bottom spacer för att undvika överlappning med bottom navigation */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  updateButton: {
    marginTop: 16,
  },
});