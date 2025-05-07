import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string().min(2, 'Välj ett språk'),
  notifications: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    emailEnabled: z.boolean(),
    pushEnabled: z.boolean()
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'contacts']),
    showOnlineStatus: z.boolean(),
    showLastSeen: z.boolean()
  })
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

interface UseSettingsFormProps {
  defaultValues?: Partial<SettingsFormData>;
}

export const useSettingsForm = ({ defaultValues = {} }: UseSettingsFormProps = {}) => {
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      theme: 'system',
      language: 'sv',
      notifications: {
        enabled: true,
        frequency: 'daily',
        emailEnabled: true,
        pushEnabled: true
      },
      privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        showLastSeen: true
      },
      ...defaultValues
    }
  });

  return {
    form,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors
  };
}; 