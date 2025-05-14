import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Calendar, Target, Gift } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { createCompetition } from '@/services/competitionService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DateTimePicker from '@/components/ui/DateTimePicker';

type CompetitionFormProps = {
  onSuccess?: (competitionId: string) => void;
};

export default function CompetitionForm({ onSuccess }: CompetitionFormProps) {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'individual',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    targetType: 'sales_amount',
    targetValue: '',
    prize: '',
  });

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate form
      if (!form.title.trim()) {
        throw new Error('Title is required');
      }

      if (!form.targetValue || isNaN(Number(form.targetValue))) {
        throw new Error('Target value must be a number');
      }

      if (form.endDate <= form.startDate) {
        throw new Error('End date must be after start date');
      }
      
      // Create competition
      const competition = await createCompetition({
        ...form,
        targetValue: Number(form.targetValue),
        teamId: user?.team?.id // Only set for team competitions
      });

      if (!competition) {
        throw new Error('Failed to create competition');
      }

      // Call success callback or navigate
      if (onSuccess) {
        onSuccess(competition.id);
      } else {
        router.replace(`/competitions/${competition.id}`);
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create competition');
    } finally {
      setIsLoading(false);
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
          placeholder="Enter competition title"
          placeholderTextColor={colors.neutral[400]}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text.main }]}>Description</Text>
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
          placeholder="Enter competition description"
          placeholderTextColor={colors.neutral[400]}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text.main }]}>Competition Type</Text>
        <View style={styles.buttonGroup}>
          <Button
            title="Individual"
            variant={form.type === 'individual' ? 'primary' : 'outline'}
            size="small"
            onPress={() => setForm({ ...form, type: 'individual' })}
            style={styles.typeButton}
          />
          <Button
            title="Team"
            variant={form.type === 'team' ? 'primary' : 'outline'}
            size="small"
            onPress={() => setForm({ ...form, type: 'team' })}
            style={styles.typeButton}
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

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text.main }]}>Target Type</Text>
        <View style={styles.buttonGroup}>
          <Button
            title="Sales Amount"
            variant={form.targetType === 'sales_amount' ? 'primary' : 'outline'}
            size="small"
            onPress={() => setForm({ ...form, targetType: 'sales_amount' })}
            style={styles.typeButton}
          />
          <Button
            title="Sales Count"
            variant={form.targetType === 'sales_count' ? 'primary' : 'outline'}
            size="small"
            onPress={() => setForm({ ...form, targetType: 'sales_count' })}
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
          onChangeText={(text) => setForm({ ...form, targetValue: text })}
          placeholder={form.targetType === 'sales_amount' ? "Enter target amount" : "Enter target count"}
          placeholderTextColor={colors.neutral[400]}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text.main }]}>Prize (Optional)</Text>
        <TextInput
          style={[
            styles.input,
            { 
              borderColor: colors.neutral[500],
              color: colors.text.main,
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }
          ]}
          value={form.prize}
          onChangeText={(text) => setForm({ ...form, prize: text })}
          placeholder="Enter prize description"
          placeholderTextColor={colors.neutral[400]}
        />
      </View>

      <Button
        title="Create Competition"
        icon={Trophy}
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
    gap: 12,
  },
  typeButton: {
    flex: 1,
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
  submitButton: {
    marginTop: 12,
  },
});