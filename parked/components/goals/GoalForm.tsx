import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Switch 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { Target, Save, Plus, Trash2, AlertCircle } from 'lucide-react-native';
import TextInput from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import DateTimePicker from '@/components/ui/DateTimePicker';
import { useCreateGoal, useUpdateGoal } from '@/hooks/useGoals';
import { Goal, CreateGoalInput, GoalType, GoalDifficulty, GoalScope, GoalTag } from '@/types/goal';
import { useAuth } from '@/context/AuthContext';
import { useActiveTeam } from '@/hooks/useTeam';
import { useTags } from '@/hooks/useTags';
import { TagSelector } from './TagSelector';

// Props som komponenten tar emot
interface GoalFormProps {
  initialData?: Goal;
  onSuccess?: (goal: Goal) => void;
  onCancel?: () => void;
  teamId?: string;
  defaultScope?: GoalScope;
  mode?: 'create' | 'edit';
  isTeamGoal?: boolean;
}

/**
 * GoalForm - En komponent för att skapa eller redigera mål
 */
export const GoalForm: React.FC<GoalFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  teamId, 
  defaultScope = 'individual',
  mode = 'create',
  isTeamGoal = false
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // Använd try/catch för att hantera fallet där TeamContext inte existerar
  let activeTeamData = null;
  try {
    const { activeTeam } = useActiveTeam();
    activeTeamData = activeTeam;
  } catch (error) {
    console.log('TeamContext inte tillgänglig, fortsätter utan active team data');
  }
  
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  
  const isEditing = mode === 'edit' || !!initialData;
  
  // Tillstånd för formuläret
  const [formData, setFormData] = useState<Partial<CreateGoalInput>>({
    title: '',
    description: '',
    type: 'project',
    difficulty: 'medium',
    target: 100,
    unit: '%',
    start_date: new Date().toISOString(),
    status: 'active',
    scope: isTeamGoal ? 'team' : defaultScope,
    team_id: isTeamGoal ? (teamId || activeTeamData?.id) : undefined,
    created_by: user?.id || '',
    milestones: [],
    tags: []
  });
  
  // Validering
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Lägg till en state för att hålla koll på om deadline är aktiverad
  const [hasDeadline, setHasDeadline] = useState<boolean>(!!initialData?.deadline);
  
  // Hämta alla taggar för väljare
  const [selectedTags, setSelectedTags] = useState<GoalTag[]>([]);
  
  // Initialisera formulär om det finns initialData
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Konvertera till string om det är ett nummer
        target: initialData.target,
        current: initialData.current
      });
      setHasDeadline(!!initialData.deadline);
      
      // Sätt selected tags från initialData
      if (initialData.tags) {
        setSelectedTags(initialData.tags);
      }
    }
  }, [initialData]);
  
  // Uppdatera formulärtillstånd
  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Rensa fel när ett fält uppdateras
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Hantera uppdatering av taggar
  const handleTagsChange = (tags: GoalTag[]) => {
    setSelectedTags(tags);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };
  
  // Validera formulär
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Titel krävs';
    }
    
    if (!formData.target) {
      newErrors.target = 'Målvärde krävs';
    }
    
    if (formData.scope === 'team' && !formData.team_id) {
      newErrors.team_id = 'Team krävs för teammål';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Skicka formulär
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (isEditing && initialData) {
        const updates = {
          ...formData,
          // Filtrera bort egenskaper som inte ska uppdateras
          id: undefined,
          created_at: undefined,
          updated_at: undefined,
          created_by: undefined,
          scope: undefined, // Kan inte ändra scope efter skapande
          tags: selectedTags
        };
        
        const result = await updateGoalMutation.mutateAsync({
          goalId: initialData.id,
          updates
        });
        
        onSuccess?.(result);
      } else {
        const newGoal = {
          ...formData,
          created_by: user?.id || '',
          tags: selectedTags
        } as CreateGoalInput;
        
        const result = await createGoalMutation.mutateAsync(newGoal);
        onSuccess?.(result);
      }
    } catch (error) {
      console.error('Goal form error:', error);
    }
  };
  
  // Hantera milestones
  const [newMilestone, setNewMilestone] = useState('');
  
  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    
    const milestone = {
      id: `temp-${Date.now()}`, // temporärt ID
      goal_id: initialData?.id || '',
      title: newMilestone,
      is_completed: false,
      created_at: new Date().toISOString(),
      order: formData.milestones?.length || 0
    };
    
    setFormData(prev => ({
      ...prev,
      milestones: [...(prev.milestones || []), milestone]
    }));
    
    setNewMilestone('');
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones?.filter((_, i) => i !== index)
    }));
  };
  
  // Listor för dropdown-val
  const goalTypes: { label: string; value: GoalType }[] = [
    { label: 'Prestation', value: 'performance' },
    { label: 'Lärande', value: 'learning' },
    { label: 'Vana', value: 'habit' },
    { label: 'Projekt', value: 'project' },
    { label: 'Annat', value: 'other' }
  ];
  
  const goalDifficulties: { label: string; value: GoalDifficulty }[] = [
    { label: 'Lätt', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Svår', value: 'hard' }
  ];
  
  // Spinner när formuläret skickas
  const isLoading = createGoalMutation.isPending || updateGoalMutation.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <BlurView 
          intensity={20} 
          tint="dark" 
          style={[styles.formContainer, { backgroundColor: 'rgba(60, 60, 90, 0.3)' }]}
        >
          <Text style={[styles.formTitle, { color: colors.text.main }]}>
            {isEditing ? 'Redigera mål' : 'Skapa nytt mål'}
          </Text>
          
          {/* Grundläggande information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
              Grundläggande information
            </Text>

            <TextInput
              label="Titel"
              value={formData.title}
              onChangeText={(value) => handleChange('title', value)}
              placeholder="Ange måltitel"
              error={errors.title}
            />
            
            <TextInput
              label="Beskrivning"
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              placeholder="Beskriv målet"
              multiline
              numberOfLines={3}
            />
            
            <Dropdown
              label="Typ"
              items={goalTypes}
              value={formData.type}
              onValueChange={(value) => handleChange('type', value)}
            />
            
            <Dropdown
              label="Svårighetsgrad"
              items={goalDifficulties}
              value={formData.difficulty}
              onValueChange={(value) => handleChange('difficulty', value)}
            />
            
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={handleTagsChange}
              label="Taggar"
            />
          </View>

          {/* Målvärden */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
              Målvärden
            </Text>
            
            <View style={styles.row}>
              <View style={styles.flex2}>
                <TextInput
                  label="Målvärde"
                  value={formData.target?.toString()}
                  onChangeText={(value) => handleChange('target', parseInt(value) || 0)}
                  keyboardType="numeric"
                  error={errors.target}
                />
              </View>

              <View style={styles.flex1}>
                <TextInput
                  label="Enhet"
                  value={formData.unit}
                  onChangeText={(value) => handleChange('unit', value)}
                  placeholder="%"
                />
              </View>
            </View>

            {isEditing && (
              <TextInput
                label="Nuvarande värde"
                value={formData.current?.toString()}
                onChangeText={(value) => handleChange('current', parseInt(value) || 0)}
                keyboardType="numeric"
              />
            )}
            
            <View>
              <Text style={[styles.inputLabel, { color: colors.text.light }]}>
                Startdatum
              </Text>
              <DateTimePicker
                value={formData.start_date ? new Date(formData.start_date) : new Date()}
                onChange={(date) => handleChange('start_date', date.toISOString())}
              />
            </View>
            
            <View style={styles.deadlineContainer}>
              <View style={styles.deadlineHeader}>
                <Text style={[styles.inputLabel, { color: colors.text.light }]}>
                  Deadline
                </Text>
                <Switch
                  value={hasDeadline}
                  onValueChange={(value) => {
                    setHasDeadline(value);
                    if (!value) {
                      handleChange('deadline', undefined);
                    } else if (!formData.deadline) {
                      // Sätt ett defaultvärde för deadline (en vecka framåt)
                      const oneWeekFromNow = new Date();
                      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
                      handleChange('deadline', oneWeekFromNow.toISOString());
                    }
                  }}
                />
              </View>
              
              {hasDeadline && (
                <DateTimePicker
                  value={formData.deadline ? new Date(formData.deadline) : new Date()}
                  onChange={(date) => handleChange('deadline', date.toISOString())}
                />
              )}
            </View>
          </View>
          
          {/* Scope och Team - bara vid skapande */}
          {!isEditing && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Måltyp
              </Text>
              
              <View style={styles.scopeSelector}>
                <TouchableOpacity
                  style={[
                    styles.scopeButton,
                    formData.scope === 'individual' && styles.scopeButtonActive,
                    formData.scope === 'individual' && { 
                      backgroundColor: colors.accent.pink + '40'
                    }
                  ]}
                  onPress={() => handleChange('scope', 'individual')}
                >
                  <Text 
                    style={[
                      styles.scopeButtonText,
                      { color: formData.scope === 'individual' ? colors.accent.pink : colors.text.light }
                    ]}
                  >
                    Individuellt
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.scopeButton,
                    formData.scope === 'team' && styles.scopeButtonActive,
                    formData.scope === 'team' && { 
                      backgroundColor: colors.accent.yellow + '40'
                    }
                  ]}
                  onPress={() => handleChange('scope', 'team')}
                >
                  <Text 
                    style={[
                      styles.scopeButtonText,
                      { color: formData.scope === 'team' ? colors.accent.yellow : colors.text.light }
                    ]}
                  >
                    Team
                  </Text>
                </TouchableOpacity>
              </View>
              
              {formData.scope === 'team' && errors.team_id && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={14} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.team_id}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Milstolpar */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
              Milstolpar
            </Text>
            
            <View style={styles.milestonesContainer}>
              {formData.milestones?.map((milestone, index) => (
                <View key={`milestone-${index}`} style={styles.milestoneRow}>
                  <Text 
                    style={[styles.milestoneText, { color: colors.text.main }]}
                    numberOfLines={1}
                  >
                    {milestone.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeMilestone(index)}
                    style={styles.removeButton}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.addMilestoneContainer}>
              <TextInput
                placeholder="Lägg till milstolpe..."
                value={newMilestone}
                onChangeText={setNewMilestone}
                onSubmitEditing={addMilestone}
                style={styles.milestoneInput}
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.accent.yellow }]}
                onPress={addMilestone}
                disabled={!newMilestone.trim()}
              >
                <Plus size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Knappar */}
          <View style={styles.buttonContainer}>
            <Button
              title="Avbryt"
              onPress={onCancel}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title={isEditing ? 'Uppdatera' : 'Skapa'}
              onPress={handleSubmit}
              loading={isLoading}
              icon={Save}
              style={styles.submitButton}
            />
          </View>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Custom Dropdown-komponent för denna sida
function Dropdown({ label, items, value, onValueChange }) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedItem = items.find(item => item.value === value);
  
  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={[styles.inputLabel, { color: colors.text.light }]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[styles.dropdownButton, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={{ color: colors.text.main }}>
          {selectedItem ? selectedItem.label : 'Välj...'}
        </Text>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={[styles.dropdownMenu, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={styles.dropdownItem}
              onPress={() => {
                onValueChange(item.value);
                setIsOpen(false);
              }}
            >
              <Text style={{ 
                color: item.value === value ? colors.accent.yellow : colors.text.main
              }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  scopeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  scopeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  scopeButtonActive: {
    borderColor: 'transparent',
  },
  scopeButtonText: {
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
  },
  milestonesContainer: {
    marginBottom: 12,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  milestoneText: {
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  addMilestoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestoneInput: {
    flex: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  deadlineContainer: {
    marginTop: 12,
  },
  deadlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropdownButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    borderRadius: 8,
    padding: 8,
    backgroundColor: 'rgba(30, 30, 60, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
});