import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Switch, Text, useTheme } from 'react-native-paper';
import { Controller } from 'react-hook-form';
import { useSettingsForm, SettingsFormData } from '../hooks/useSettingsForm';
import { SegmentedButtons } from 'react-native-paper';

interface SettingsFormProps {
  initialValues: SettingsFormData;
  onSubmit: (data: SettingsFormData) => void;
  isLoading?: boolean;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  initialValues,
  onSubmit,
  isLoading = false
}) => {
  const theme = useTheme();
  const { form, isValid, isDirty } = useSettingsForm({ defaultValues: initialValues });
  const { control, handleSubmit } = form;

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Utseende
        </Text>
        <Controller
          name="theme"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={[
                { value: 'light', label: 'Ljust' },
                { value: 'dark', label: 'Mörkt' },
                { value: 'system', label: 'System' }
              ]}
            />
          )}
        />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Notifikationer
        </Text>
        <Controller
          name="notifications.enabled"
          control={control}
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchRow}>
              <Text>Aktivera notifikationer</Text>
              <Switch value={value} onValueChange={onChange} />
            </View>
          )}
        />

        <Controller
          name="notifications.frequency"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              enabled={form.watch('notifications.enabled')}
              buttons={[
                { value: 'daily', label: 'Dagligen' },
                { value: 'weekly', label: 'Veckovis' },
                { value: 'monthly', label: 'Månadsvis' }
              ]}
            />
          )}
        />

        <Controller
          name="notifications.emailEnabled"
          control={control}
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchRow}>
              <Text>E-postnotifikationer</Text>
              <Switch 
                value={value} 
                onValueChange={onChange}
                disabled={!form.watch('notifications.enabled')}
              />
            </View>
          )}
        />

        <Controller
          name="notifications.pushEnabled"
          control={control}
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchRow}>
              <Text>Push-notifikationer</Text>
              <Switch 
                value={value} 
                onValueChange={onChange}
                disabled={!form.watch('notifications.enabled')}
              />
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Integritet
        </Text>
        <Controller
          name="privacy.profileVisibility"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={[
                { value: 'public', label: 'Publik' },
                { value: 'contacts', label: 'Kontakter' },
                { value: 'private', label: 'Privat' }
              ]}
            />
          )}
        />

        <Controller
          name="privacy.showOnlineStatus"
          control={control}
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchRow}>
              <Text>Visa onlinestatus</Text>
              <Switch value={value} onValueChange={onChange} />
            </View>
          )}
        />

        <Controller
          name="privacy.showLastSeen"
          control={control}
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchRow}>
              <Text>Visa senast sedd</Text>
              <Switch value={value} onValueChange={onChange} />
            </View>
          )}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        disabled={!isValid || !isDirty || isLoading}
        loading={isLoading}
        style={styles.button}
        testID="settings-submit-button"
      >
        Spara inställningar
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  button: {
    marginTop: 24,
  },
}); 