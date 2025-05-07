import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from './useUser';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

const settingsSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    teamUpdates: z.boolean(),
  }),
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['sv', 'en']),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export const useSettingsForm = () => {
  const { user, updateUserSettings } = useUser();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      notifications: {
        email: user?.settings?.notifications?.email ?? true,
        push: user?.settings?.notifications?.push ?? true,
        teamUpdates: user?.settings?.notifications?.teamUpdates ?? true,
      },
      theme: user?.settings?.theme ?? 'system',
      language: user?.settings?.language ?? 'sv',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await updateUserSettings(data);
      showSuccessToast('Inställningarna har sparats');
    } catch (error) {
      showErrorToast('Kunde inte spara inställningarna');
      console.error('Settings update error:', error);
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading: form.formState.isSubmitting,
    isDirty: form.formState.isDirty,
  };
}; 