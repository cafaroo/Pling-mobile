import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, TextInput, HelperText } from 'react-native-paper';
import { useCreateUser } from '@/application/user/hooks/useCreateUser';
import { CreateUserInput } from '@/application/user/useCases/createUser';

// Valideringsschema
const createUserSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  phone: z.string().optional(),
  profile: z.object({
    firstName: z.string().min(2, 'För kort förnamn'),
    lastName: z.string().min(2, 'För kort efternamn'),
    displayName: z.string().optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    contact: z.object({
      email: z.string().email('Ogiltig kontakt-e-postadress'),
      phone: z.string().optional(),
      alternativeEmail: z.string().email('Ogiltig alternativ e-postadress').optional(),
    }),
  }),
  settings: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    language: z.enum(['sv', 'en', 'no', 'dk']).default('sv'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false),
      frequency: z.enum(['immediately', 'daily', 'weekly']).default('immediately'),
    }),
    privacy: z.object({
      profileVisibility: z.enum(['public', 'team', 'private']).default('team'),
      showEmail: z.boolean().default(false),
      showPhone: z.boolean().default(false),
    }),
  }),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserFormProps {
  onSuccess?: () => void;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSuccess }) => {
  const { mutate: createUser, isLoading } = useCreateUser();
  
  const { control, handleSubmit, formState: { errors } } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      settings: {
        theme: 'system',
        language: 'sv',
        notifications: {
          email: true,
          push: true,
          sms: false,
          frequency: 'immediately',
        },
        privacy: {
          profileVisibility: 'team',
          showEmail: false,
          showPhone: false,
        },
      },
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    const input: CreateUserInput = {
      ...data,
      teamIds: [], // Nya användare börjar utan team
      roleIds: [], // Nya användare börjar utan roller
    };

    createUser(input, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="E-postadress"
              value={value}
              onChangeText={onChange}
              error={!!errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {errors.email && (
              <HelperText type="error">{errors.email.message}</HelperText>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="profile.firstName"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="Förnamn"
              value={value}
              onChangeText={onChange}
              error={!!errors.profile?.firstName}
            />
            {errors.profile?.firstName && (
              <HelperText type="error">{errors.profile.firstName.message}</HelperText>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="profile.lastName"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="Efternamn"
              value={value}
              onChangeText={onChange}
              error={!!errors.profile?.lastName}
            />
            {errors.profile?.lastName && (
              <HelperText type="error">{errors.profile.lastName.message}</HelperText>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Telefonnummer (valfritt)"
            value={value}
            onChangeText={onChange}
            keyboardType="phone-pad"
          />
        )}
      />

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
      >
        Skapa användare
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 16,
  },
  button: {
    marginTop: 24,
  },
}); 