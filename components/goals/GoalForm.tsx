import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Target, Calendar, Award, Plus, Minus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { createGoal, getTeamMemberGoals } from '@/services/goalService';
import { GoalType, GoalPeriod, GoalAssigneeType, TeamMember } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DateTimePicker from '@/components/ui/DateTimePicker';

type GoalFormProps = {
  isTeamGoal?: boolean;
  teamId?: string;
  isTeamMemberGoal?: boolean;
  teamMembers?: TeamMember[];
  onSuccess?: (goalId: string) => void;
};

export default function GoalForm({ 
  isTeamGoal = false, 
  teamId, 
  isTeamMemberGoal = false,
  teamMembers = [],
  onSuccess 
}: GoalFormProps) {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate default dates
  const today = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(today.getMonth() + 1);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'sales_amount' as GoalType,
    targetValue: '',
    startDate: today,
    endDate: oneMonthLater,
    period: 'month' as GoalPeriod,
    assigneeId: '',
    assigneeType: 'individual' as GoalAssigneeType,
    milestones: [
      { title: '25% Milestone', targetValue: '', reward: '' },
      { title: '50% Milestone', targetValue: '', reward: '' },
      { title: '75% Milestone', targetValue: '', reward: '' }
    ]
  });

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate form
      if (!form.title.trim()) {
        throw new Error('Title is required');
      }

      if (!form.targetValue || isNaN(Number(form.targetValue)) || Number(form.targetValue) <= 0) {
        throw new Error('Target value must be a positive number');
      }

      if (form.endDate <= form.startDate) {
        throw new Error('End date must be after start date');
      }
      
      // Filter out empty milestones
      const validMilestones = form.milestones.filter(m => 
        m.title.trim() && !isNaN(Number(m.targetValue)) && Number(m.targetValue) > 0
      ).map(m => ({
        title: m.title,
        targetValue: Number(m.targetValue),
        reward: m.reward
      }));
      
      // Create goal
      const goal = await createGoal({
        title: form.title,
        description: form.description,
        type: form.type,
        targetValue: Number(form.targetValue),
        startDate: form.startDate,
        endDate: form.endDate,
        period: form.period,
        userId: isTeamGoal ? undefined : user?.id,
        teamId: isTeamGoal ? teamId : undefined,
        assigneeId: isTeamMemberGoal ? form.assigneeId : undefined,
        assigneeType: isTeamMemberGoal ? form.assigneeType : undefined,
        milestones: validMilestones
      });

      if (!goal) {
        throw new Error('Failed to create goal');
      }

      // Call success callback or navigate
      if (onSuccess) {
        onSuccess(goal.id);
      } else {
        router.replace(isTeamGoal ? `/team/goals/${goal.id}` : `/goals/${goal.id}`);
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updatedMilestones = [...form.milestones];
    updatedMilestones[index] = { 
      ...updatedMilestones[index], 
      [field]: value 
    };
    
    // If updating targetValue, ensure it's a number and within range
    if (field === 'targetValue' && value) {
      const milestoneValue = Number(value);
      const goalValue = Number(form.targetValue);
      
      if (!isNaN(milestoneValue) && !isNaN(goalValue) && milestoneValue > goalValue) {
        updatedMilestones[index].targetValue = form.targetValue;
      }
    }
    
    setForm({ ...form, milestones: updatedMilestones });
  };

  const addMilestone = () => {
    setForm({
      ...form,
      milestones: [
        ...form.milestones,
        { title: `Milestone ${form.milestones.length + 1}`, targetValue: '', reward: '' }
      ]
    });
  };

  const removeMilestone = (index: number) => {
    const updatedMilestones = [...form.milestones];
    updatedMilestones.splice(index, 1);
    setForm({ ...form, milestones: updatedMilestones });
  };

  // Auto-calculate milestone values when target changes
  const updateTargetValue = (value: string) => {
    const numValue = Number(value);
    
    if (!isNaN(numValue) && numValue > 0) {
      // Update milestone values to be 25%, 50%, and 75% of target
      const updatedMilestones = form.milestones.map((milestone, index) => {
        if (index === 0) {
          return { ...milestone, targetValue: String(Math.round(numValue * 0.25)) };
        } else if (index === 1) {
          return { ...milestone, targetValue: String(Math.round(numValue * 0.5)) };
        } else if (index === 2) {
          return { ...milestone, targetValue: String(Math.round(numValue * 0.75)) };
        }
        return milestone;
      });
      
      setForm({ ...form, targetValue: value, milestones: updatedMilestones });
    } else {
      setForm({ ...form, targetValue: value });
    }
  };

  return (
    <Card style={styles.formCard}>
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text.main }]}>Title</Text>
        <TextInput
          style={[
            styles.input,
            { 
              borderColor: colors.neutral[500],
              color: colors.text.main,
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }
          ]}
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
          placeholder="Enter goal title"
          placeholderTextColor={colors.neutral[400]}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text.main }]}>Description (Optional)</Text>
        <TextInput
          style={[
            styles.textArea,
            { 
              borderColor: colors.neutral[500],
              color: colors.text.main,
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }
          ]}
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
          placeholder="Enter goal description"
          placeholderTextColor={colors.neutral[400]}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text.main }]}>Goal Type</Text>
        <View style={styles.buttonGroup}>
          <Button
            title="Sales Amount"
            variant={form.type === 'sales_amount' ? 'primary' : 'outline'}
            size="small"
            onPress={() => setForm({ ...form, type: 'sales_amount' })}
            style={styles.typeButton}
          />
          <Button
            title="Sales Count"
            variant={form.type === 'sales_count' ? 'primary' : 'outline'}
            size="small"
            onPress={() => setForm({ ...form, type: 'sales_count' })}
            style={styles.typeButton}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text.main }]}>Target Value</Text>
        <TextInput
          style={[
            styles.input,
            { 
              borderColor: colors.neutral[500],
              color: colors.text.main,
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }
          ]}
          value={form.targetValue}
          onChangeText={updateTargetValue}
          placeholder={form.type === 'sales_amount' ? "Enter target amount" : "Enter target count"}
          placeholderTextColor={colors.neutral[400]}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text.main }]}>Period</Text>
        <View style={styles.buttonGroup}>
          <Button
            title="Week"
            variant={form.period === 'week' ? 'primary' : 'outline'}
            size="small"
            onPress={() => setForm({ ...form, period: 'week' })}
            style={styles.periodButton}
          />
          <Button
            title="Month"
            variant={form.period === 'month' ? 'primary' : 'outline'}
            size="small"
            onPress={() => setForm({ ...form, period: 'month' })}
            style={styles.periodButton}
          />
          <Button
            title="Quarter"
            variant={form.period === 'quarter' ? 'primary' : 'outline'}
            size="small"
            onPress={() => setForm({ ...form, period: 'quarter' })}
            style={styles.periodButton}
          />
          <Button
            title="Year"
            variant={form.period === 'year' ? 'primary' : 'outline'}
            size="small"
            onPress={() => setForm({ ...form, period: 'year' })}
            style={styles.periodButton}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text.main }]}>Duration</Text>
        <View style={styles.dateContainer}>
          <View style={styles.dateField}>
            <Text style={[styles.dateLabel, { color: colors.text.light }]}>Start Date</Text>
            <DateTimePicker
              value={form.startDate}
              onChange={(date) => setForm({ ...form, startDate: date })}
              minimumDate={new Date()}
            />
          </View>
          <View style={styles.dateField}>
            <Text style={[styles.dateLabel, { color: colors.text.light }]}>End Date</Text>
            <DateTimePicker
              value={form.endDate}
              onChange={(date) => setForm({ ...form, endDate: date })}
              minimumDate={form.startDate}
            />
          </View>
        </View>
      </View>

      {/* Team Member Selection (only for team member goals) */}
      {isTeamMemberGoal && teamMembers.length > 0 && (
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text.main }]}>Assign To Team Member</Text>
          <View style={styles.buttonGroup}>
            {teamMembers.map(member => (
              <Button
                key={member.userId}
                title={member.user?.name || 'Unknown User'}
                variant={form.assigneeId === member.userId ? 'primary' : 'outline'}
                size="small"
                onPress={() => setForm({ ...form, assigneeId: member.userId })}
                style={styles.memberButton}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.formGroup}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
            Milestones
          </Text>
          <Button
            title="Add"
            icon={Plus}
            onPress={addMilestone}
            variant="outline"
            size="small"
          />
        </View>
        
        <Text style={[styles.sectionDescription, { color: colors.text.light }]}>
          Add milestones to track progress and celebrate achievements along the way.
        </Text>
        
        {form.milestones.map((milestone, index) => (
          <View key={index} style={styles.milestoneContainer}>
            <View style={styles.milestoneHeader}>
              <Text style={[styles.milestoneTitle, { color: colors.text.main }]}>
                Milestone {index + 1}
              </Text>
              <Button
                title=""
                icon={Minus}
                onPress={() => removeMilestone(index)}
                variant="outline"
                size="small"
                style={styles.removeButton}
              />
            </View>
            
            <View style={styles.milestoneForm}>
              <View style={styles.milestoneField}>
                <Text style={[styles.milestoneLabel, { color: colors.text.light }]}>Title</Text>
                <TextInput
                  style={[
                    styles.milestoneInput,
                    { 
                      borderColor: colors.neutral[500],
                      color: colors.text.main,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)'
                    }
                  ]}
                  value={milestone.title}
                  onChangeText={(text) => updateMilestone(index, 'title', text)}
                  placeholder="Milestone title"
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
              
              <View style={styles.milestoneField}>
                <Text style={[styles.milestoneLabel, { color: colors.text.light }]}>Target Value</Text>
                <TextInput
                  style={[
                    styles.milestoneInput,
                    { 
                      borderColor: colors.neutral[500],
                      color: colors.text.main,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)'
                    }
                  ]}
                  value={milestone.targetValue}
                  onChangeText={(text) => updateMilestone(index, 'targetValue', text)}
                  placeholder="Target value"
                  placeholderTextColor={colors.neutral[400]}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.milestoneField}>
                <Text style={[styles.milestoneLabel, { color: colors.text.light }]}>Reward (Optional)</Text>
                <TextInput
                  style={[
                    styles.milestoneInput,
                    { 
                      borderColor: colors.neutral[500],
                      color: colors.text.main,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)'
                    }
                  ]}
                  value={milestone.reward}
                  onChangeText={(text) => updateMilestone(index, 'reward', text)}
                  placeholder="Reward description"
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      <Button
        title="Create Goal"
        icon={Target}
        onPress={handleSubmit}
        variant="primary"
        size="large"
        loading={isLoading}
        style={styles.submitButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  formCard: {
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: '48%',
  },
  memberButton: {
    marginBottom: 8,
    minWidth: '48%',
  },
  periodButton: {
    flex: 1,
    minWidth: '23%',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  sectionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  milestoneContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  removeButton: {
    width: 32,
    height: 32,
    padding: 0,
  },
  milestoneForm: {
    gap: 12,
  },
  milestoneField: {
    gap: 4,
  },
  milestoneLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  milestoneInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  submitButton: {
    marginTop: 12,
  },
});