import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Switch,
  HelperText,
  SegmentedButtons,
  List,
  TextInput,
  Text,
} from 'react-native-paper';
import { useUpdateSettings } from '@/application/user/hooks/useUpdateSettings';
import { UpdateSettingsInput } from '@/application/user/useCases/updateSettings';
import { useTheme } from '@/context/ThemeContext';

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['sv', 'en', 'no', 'dk']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
    frequency: z.enum(['immediately', 'daily', 'weekly']),
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'team', 'private']),
    showEmail: z.boolean(),
    showPhone: z.boolean(),
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface UserSettingsFormProps {
  userId: string;
  initialSettings: SettingsFormData;
  onSuccess?: () => void;
}

export const UserSettingsForm: React.FC<UserSettingsFormProps> = ({
  userId,
  initialSettings,
  onSuccess,
}) => {
  const { mutate: updateSettings, isLoading } = useUpdateSettings();
  const { colors } = useTheme();

  const { control, handleSubmit, formState: { errors } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings,
  });

  const onSubmit = (data: SettingsFormData) => {
    const input: UpdateSettingsInput = {
      userId,
      settings: data,
    };

    updateSettings(input, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text.main }]}>
        Inställningar
      </Text>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
          Tema och språk
        </Text>
        
        <Controller
          control={control}
          name="theme"
          render={({ field: { value, onChange } }) => (
            <View style={styles.setting}>
              <List.Item
                title="Tema"
                description="Välj utseende för appen"
              />
              <SegmentedButtons
                value={value}
                onValueChange={onChange}
                buttons={[
                  { value: 'light', label: 'Ljust' },
                  { value: 'dark', label: 'Mörkt' },
                  { value: 'system', label: 'System' },
                ]}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="language"
          render={({ field: { value, onChange } }) => (
            <View style={styles.setting}>
              <List.Item
                title="Språk"
                description="Välj språk för appen"
              />
              <SegmentedButtons
                value={value}
                onValueChange={onChange}
                buttons={[
                  { value: 'sv', label: 'Svenska' },
                  { value: 'en', label: 'English' },
                  { value: 'no', label: 'Norsk' },
                  { value: 'dk', label: 'Dansk' },
                ]}
              />
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
          Notifikationer
        </Text>
        
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text.light }]}>
            E-post
          </Text>
          <Switch
            value={initialSettings.notifications.email}
            onValueChange={(value) => {}}
          />
        </View>
        
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text.light }]}>
            Push-notifikationer
          </Text>
          <Switch
            value={initialSettings.notifications.push}
            onValueChange={(value) => {}}
          />
        </View>
        
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text.light }]}>
            SMS-notifikationer
          </Text>
          <Switch
            value={initialSettings.notifications.sms}
            onValueChange={(value) => {}}
          />
        </View>

        <Controller
          control={control}
          name="notifications.frequency"
          render={({ field: { value, onChange } }) => (
            <View style={styles.setting}>
              <List.Item
                title="Frekvens"
                description="Hur ofta vill du få notifikationer?"
              />
              <SegmentedButtons
                value={value}
                onValueChange={onChange}
                buttons={[
                  { value: 'immediately', label: 'Direkt' },
                  { value: 'daily', label: 'Dagligen' },
                  { value: 'weekly', label: 'Veckovis' },
                ]}
              />
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
          Integritet
        </Text>

        <Controller
          control={control}
          name="privacy.profileVisibility"
          render={({ field: { value, onChange } }) => (
            <View style={styles.setting}>
              <List.Item
                title="Profilsynlighet"
                description="Vem kan se din profil?"
              />
              <SegmentedButtons
                value={value}
                onValueChange={onChange}
                buttons={[
                  { value: 'public', label: 'Alla' },
                  { value: 'team', label: 'Team' },
                  { value: 'private', label: 'Privat' },
                ]}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="privacy.showEmail"
          render={({ field: { value, onChange } }) => (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text.light }]}>
                Visa e-postadress
              </Text>
              <Switch value={value} onValueChange={onChange} />
            </View>
          )}
        />

        <Controller
          control={control}
          name="privacy.showPhone"
          render={({ field: { value, onChange } }) => (
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text.light }]}>
                Visa telefonnummer
              </Text>
              <Switch value={value} onValueChange={onChange} />
            </View>
          )}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
      >
        Spara ändringar
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
  },
  setting: {
    gap: 8,
    paddingHorizontal: 16,
  },
  button: {
    marginTop: 16,
  },
}); 