import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper';
import { ProfileAvatar } from '../../components/ProfileAvatar';

export interface ProfileFormData {
  name: string;
  email: string;
  displayName: string;
  bio: string;
  location: string;
  avatarUrl: string;
  contact: {
    phone: string;
    website: string;
  };
}

export interface ProfileScreenPresentationProps {
  // Data
  formData: ProfileFormData;
  
  // Tillstånd
  isLoading: boolean;
  isUpdating: boolean;
  errors?: Record<string, { message: string }>;
  
  // Callbacks
  onFieldChange: (field: string, value: string) => void;
  onNestedFieldChange: (parent: string, field: string, value: string) => void;
  onSubmit: () => void;
  onImagePick: () => void;
}

export const ProfileScreenPresentation: React.FC<ProfileScreenPresentationProps> = ({
  formData,
  isLoading,
  isUpdating,
  errors,
  onFieldChange,
  onNestedFieldChange,
  onSubmit,
  onImagePick
}) => {
  const theme = useTheme();
  
  // Visa laddningstillstånd
  if (isLoading) {
    return null; // Eller visa en laddningsindikator
  }

  return (
    <ScrollView style={styles.container}>
      <ProfileAvatar
        uri={formData.avatarUrl}
        size={120}
        onPress={onImagePick}
        style={styles.avatar}
      />

      <TextInput
        label="Namn"
        value={formData.name}
        onChangeText={(text) => onFieldChange('name', text)}
        style={styles.input}
        error={!!errors?.name}
        helperText={errors?.name?.message}
      />

      <TextInput
        label="Visningsnamn"
        value={formData.displayName}
        onChangeText={(text) => onFieldChange('displayName', text)}
        style={styles.input}
        error={!!errors?.displayName}
        helperText={errors?.displayName?.message}
      />

      <TextInput
        label="E-post"
        value={formData.email}
        onChangeText={(text) => onFieldChange('email', text)}
        keyboardType="email-address"
        style={styles.input}
        error={!!errors?.email}
        helperText={errors?.email?.message}
      />

      <TextInput
        label="Bio"
        value={formData.bio}
        onChangeText={(text) => onFieldChange('bio', text)}
        multiline
        numberOfLines={4}
        style={styles.input}
        error={!!errors?.bio}
        helperText={errors?.bio?.message}
      />

      <TextInput
        label="Plats"
        value={formData.location}
        onChangeText={(text) => onFieldChange('location', text)}
        style={styles.input}
      />

      <TextInput
        label="Telefon"
        value={formData.contact.phone}
        onChangeText={(text) => onNestedFieldChange('contact', 'phone', text)}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        label="Webbplats"
        value={formData.contact.website}
        onChangeText={(text) => onNestedFieldChange('contact', 'website', text)}
        keyboardType="url"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={isUpdating}
        disabled={isUpdating}
        style={styles.button}
      >
        Spara ändringar
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  avatar: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 24,
  },
}); 