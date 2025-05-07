import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string()
    .min(2, 'Namnet måste vara minst 2 tecken')
    .max(100, 'Namnet får inte vara längre än 100 tecken'),
  displayName: z.string()
    .min(2, 'Visningsnamn måste vara minst 2 tecken')
    .max(50, 'Visningsnamn får inte vara längre än 50 tecken')
    .optional(),
  bio: z.string()
    .max(500, 'Biografi får inte vara längre än 500 tecken')
    .optional(),
  location: z.string()
    .max(100, 'Plats får inte vara längre än 100 tecken')
    .optional(),
  avatarUrl: z.string()
    .url('Ogiltig URL för profilbild')
    .optional(),
  email: z.string()
    .email('Ogiltig e-postadress'),
  contact: z.object({
    phone: z.string()
      .regex(/^(\+\d{1,3}[- ]?)?\d{8,12}$/, 'Ogiltigt telefonnummer')
      .optional(),
    website: z.string()
      .url('Ogiltig webbadress')
      .optional()
  }).optional()
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export interface ProfileFormProps {
  defaultValues?: Partial<ProfileFormData>;
  onSubmit: (data: ProfileFormData) => void;
}

export const useProfileForm = (defaultValues?: Partial<ProfileFormData>) => {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      displayName: '',
      bio: '',
      location: '',
      avatarUrl: '',
      email: '',
      contact: {
        phone: '',
        website: ''
      },
      ...defaultValues
    }
  });

  const transformFormDataToDto = (data: ProfileFormData) => {
    return {
      name: data.name,
      email: data.email,
      avatar_url: data.avatarUrl,
      settings: {
        name: data.displayName,
        bio: data.bio,
        location: data.location,
        contact: data.contact
      }
    };
  };

  return {
    form,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    setValue: form.setValue,
    trigger: form.trigger,
    transformFormDataToDto
  };
}; 