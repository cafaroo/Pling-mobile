import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useProfileForm } from '../hooks/useProfileForm';
import { useUser } from '../hooks/useUser';

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { data: user, isLoading: isLoadingUser } = useUser();
  const { mutate: updateProfile, isLoading: isUpdating } = useUpdateProfile();
  
  const { form, transformFormDataToDto } = useProfileForm({
    name: user?.name || '',
    email: user?.email || '',
    displayName: user?.settings?.name || '',
    bio: user?.settings?.bio || '',
    location: user?.settings?.location || '',
    avatarUrl: user?.avatar_url || '',
    contact: user?.settings?.contact || { phone: '', website: '' }
  });

  const { register, handleSubmit, setValue, watch } = form;
  const avatarUrl = watch('avatarUrl');

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setValue('avatarUrl', result.assets[0].uri);
    }
  };

  const onSubmit = handleSubmit((data) => {
    const dto = transformFormDataToDto(data);
    updateProfile(dto);
  });

  if (isLoadingUser) {
    return null; // Eller visa en laddningsindikator
  }

  return (
    <ScrollView style={styles.container}>
      <ProfileAvatar
        uri={avatarUrl}
        size={120}
        onPress={handleImagePick}
        style={styles.avatar}
      />

      <TextInput
        label="Namn"
        {...register('name')}
        onChangeText={(text) => setValue('name', text)}
        style={styles.input}
      />

      <TextInput
        label="Visningsnamn"
        {...register('displayName')}
        onChangeText={(text) => setValue('displayName', text)}
        style={styles.input}
      />

      <TextInput
        label="E-post"
        {...register('email')}
        onChangeText={(text) => setValue('email', text)}
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        label="Bio"
        {...register('bio')}
        onChangeText={(text) => setValue('bio', text)}
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      <TextInput
        label="Plats"
        {...register('location')}
        onChangeText={(text) => setValue('location', text)}
        style={styles.input}
      />

      <TextInput
        label="Telefon"
        {...register('contact.phone')}
        onChangeText={(text) => setValue('contact.phone', text)}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        label="Webbplats"
        {...register('contact.website')}
        onChangeText={(text) => setValue('contact.website', text)}
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