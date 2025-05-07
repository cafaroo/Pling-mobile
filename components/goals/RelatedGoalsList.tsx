import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Link, Plus, Search, X } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { RelatedGoalCard } from './RelatedGoalCard';
import { Goal, GoalRelationType } from '@/types/goal';
import { Button } from '@/components/ui/Button';
import TextInput from '@/components/ui/TextInput';
import { useRelatedGoals, useGoals, useCreateGoalRelation, useDeleteGoalRelation } from '@/hooks/useGoals';
import { GoalCard } from './GoalCard';

interface RelatedGoalsListProps {
  goalId: string;
  onGoalPress?: (goal: Goal) => void;
  canEdit?: boolean;
  style?: object;
}

/**
 * RelatedGoalsList - En komponent för att visa relaterade mål med möjlighet att hantera relationer
 */
export const RelatedGoalsList: React.FC<RelatedGoalsListProps> = ({
  goalId,
  onGoalPress,
  canEdit = true,
  style
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [searchText, setSearchText] = useState('');
  const [relationType, setRelationType] = useState<GoalRelationType>('related');
  
  // Hämta relaterade mål
  const { 
    data: relatedGoals = [], 
    isLoading, 
    isError,
    refetch
  } = useRelatedGoals(goalId);
  
  // Hämta mål för att skapa relationer
  const { 
    data: goalsData, 
    isLoading: isGoalsLoading 
  } = useGoals({
    search: searchText,
    status: ['active'],
  }, {
    enabled: isModalVisible
  });
  
  // Mutations för att skapa och ta bort relationer
  const createRelation = useCreateGoalRelation();
  const deleteRelation = useDeleteGoalRelation();
  
  // Öppna modal för att lägga till relaterat mål
  const handleAddRelation = () => {
    setSearchText('');
    setSelectedGoal(null);
    setRelationType('related');
    setIsModalVisible(true);
  };
  
  // Hantera borttagning av relation
  const handleRemoveRelation = (relatedGoal: Goal) => {
    deleteRelation.mutate({ 
      sourceGoalId: goalId, 
      targetGoalId: relatedGoal.id 
    }, {
      onSuccess: () => {
        refetch();
      }
    });
  };
  
  // Hantera val av relationstyp
  const handleRelationTypeChange = (type: GoalRelationType) => {
    setRelationType(type);
  };
  
  // Hantera bekräftelse av ny relation
  const handleConfirmRelation = () => {
    if (!selectedGoal) return;
    
    createRelation.mutate({
      sourceGoalId: goalId,
      targetGoalId: selectedGoal.id,
      type: relationType
    }, {
      onSuccess: () => {
        setIsModalVisible(false);
        refetch();
      }
    });
  };
  
  // Rendrera alla relaterade mål direkt utan FlatList
  const renderRelatedGoals = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent.yellow} />
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Laddar relaterade mål...
          </Text>
        </View>
      );
    } 
    
    if (isError) {
      return (
        <Text style={[styles.errorText, { color: colors.error }]}>
          Kunde inte hämta relaterade mål
        </Text>
      );
    } 
    
    if (relatedGoals.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Link size={24} color={colors.text.light} />
          <Text style={[styles.emptyText, { color: colors.text.light }]}>
            Inga relaterade mål
          </Text>
          
          {canEdit && (
            <TouchableOpacity 
              style={[styles.emptyAddButton, { borderColor: colors.accent.yellow }]}
              onPress={handleAddRelation}
            >
              <Text style={[styles.emptyAddText, { color: colors.accent.yellow }]}>
                Lägg till relation
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    return (
      <View style={styles.relatedGoalsContainer}>
        {relatedGoals.map(goal => (
          <RelatedGoalCard
            key={goal.id}
            goal={goal}
            relationType="related"
            onPress={() => onGoalPress?.(goal)}
            onRemoveRelation={canEdit ? () => handleRemoveRelation(goal) : undefined}
          />
        ))}
      </View>
    );
  };
  
  return (
    <Animated.View entering={FadeIn} style={[styles.container, style]}>
      <BlurView
        intensity={20}
        tint="dark"
        style={[styles.blurContainer, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.main }]}>
            Relaterade mål
          </Text>
          
          {canEdit && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddRelation}
            >
              <Plus size={20} color={colors.accent.yellow} />
            </TouchableOpacity>
          )}
        </View>
        
        {renderRelatedGoals()}
      </BlurView>
      
      {/* Modal för att lägga till relationer */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.main }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.main }]}>
                Lägg till relaterat mål
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <X size={20} color={colors.text.light} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Sök efter mål..."
                icon={<Search size={20} color={colors.text.light} />}
                style={styles.searchInput}
              />
            </View>
            
            <View style={styles.relationTypeContainer}>
              <Text style={[styles.relationTypeLabel, { color: colors.text.light }]}>
                Relationstyp:
              </Text>
              <View style={styles.relationTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.relationTypeButton,
                    relationType === 'related' && 
                    { backgroundColor: colors.primary.light }
                  ]}
                  onPress={() => handleRelationTypeChange('related')}
                >
                  <Text style={styles.relationTypeText}>Relaterad</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.relationTypeButton,
                    relationType === 'parent' && 
                    { backgroundColor: colors.primary.light }
                  ]}
                  onPress={() => handleRelationTypeChange('parent')}
                >
                  <Text style={styles.relationTypeText}>Förälder</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.relationTypeButton,
                    relationType === 'child' && 
                    { backgroundColor: colors.primary.light }
                  ]}
                  onPress={() => handleRelationTypeChange('child')}
                >
                  <Text style={styles.relationTypeText}>Barn</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={[styles.searchResultsTitle, { color: colors.text.main }]}>
              Sökresultat
            </Text>
            
            {isGoalsLoading ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color={colors.accent.yellow} />
                <Text style={[styles.searchLoadingText, { color: colors.text.light }]}>
                  Laddar mål...
                </Text>
              </View>
            ) : !goalsData || goalsData.goals.length === 0 ? (
              <Text style={[styles.noResultsText, { color: colors.text.light }]}>
                Inga mål hittades
              </Text>
            ) : (
              <ScrollView 
                style={styles.searchResults}
                contentContainerStyle={styles.searchResultsContent}
              >
                {goalsData.goals
                  .filter(goal => goal.id !== goalId)
                  .map(goal => (
                    <TouchableOpacity
                      key={goal.id}
                      style={[
                        styles.searchGoalItem, 
                        selectedGoal?.id === goal.id && styles.selectedSearchGoal
                      ]}
                      onPress={() => setSelectedGoal(goal)}
                    >
                      <GoalCard 
                        goal={goal} 
                        variant="compact" 
                      />
                    </TouchableOpacity>
                  ))
                }
              </ScrollView>
            )}
            
            <View style={styles.modalFooter}>
              <Button
                title="Avbryt"
                variant="outline"
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCancelButton}
              />
              <Button
                title="Lägg till"
                onPress={handleConfirmRelation}
                disabled={!selectedGoal}
                style={styles.modalConfirmButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  blurContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorText: {
    padding: 16,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  emptyAddButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyAddText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 8,
  },
  // Ny stil för relaterade mål container
  relatedGoalsContainer: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  relationTypeContainer: {
    padding: 16,
    paddingTop: 0,
  },
  relationTypeLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  relationTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  relationTypeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    flex: 1,
  },
  relationTypeText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  searchResults: {
    flex: 1,
  },
  searchResultsContent: {
    padding: 16,
  },
  searchGoalItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedSearchGoal: {
    borderWidth: 2,
    borderColor: '#FACC15', // Yellow
  },
  searchLoadingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  searchLoadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  noResultsText: {
    padding: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalConfirmButton: {
    flex: 1,
  },
  tagList: {
    padding: 16,
  },
  tagItem: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tagColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  tagName: {
    fontSize: 14,
  },
}); 