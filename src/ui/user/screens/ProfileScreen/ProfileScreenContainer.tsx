import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ProfileScreenPresentation, ProfileFormData } from './ProfileScreenPresentation';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';
import { useProfileForm } from '../../hooks/useProfileForm';
import { useUser } from '../../hooks/useUser';

export interface ProfileScreenContainerProps {
  // Eventuella container-props kan läggas till här
}

export const ProfileScreenContainer: React.FC<ProfileScreenContainerProps> = () => {
  const { data: user, isLoading: isLoadingUser } = useUser();
  const { mutate: updateProfile, isLoading: isUpdating } = useUpdateProfile();
  
  // Skapa formulärtillstånd från user-data
  const initialFormData: ProfileFormData = {
    name: '',
    email: '',
    displayName: '',
    bio: '',
    location: '',
    avatarUrl: '',
    contact: {
      phone: '',
      website: ''
    }
  };
  
  // Form state med react-hook-form
  const { form, transformFormDataToDto, errors } = useProfileForm({
    name: user?.name || '',
    email: user?.email || '',
    displayName: user?.settings?.name || '',
    bio: user?.settings?.bio || '',
    location: user?.settings?.location || '',
    avatarUrl: user?.avatar_url || '',
    contact: user?.settings?.contact || { phone: '', website: '' }
  });
  
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  
  // Uppdatera lokalt tillstånd när user-data laddas
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        displayName: user.settings?.name || '',
        bio: user.settings?.bio || '',
        location: user.settings?.location || '',
        avatarUrl: user.avatar_url || '',
        contact: {
          phone: user.settings?.contact?.phone || '',
          website: user.settings?.contact?.website || ''
        }
      });
    }
  }, [user]);
  
  // Hanterare för fältändringar
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
    form.setValue(field as any, value);
  };
  
  // Hanterare för nästlade fältändringar
  const handleNestedFieldChange = (parent: string, field: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [parent]: {
        ...prevData[parent as keyof ProfileFormData],
        [field]: value
      }
    }));
    form.setValue(`${parent}.${field}` as any, value);
  };
  
  // Hantera bildval
  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newAvatarUrl = result.assets[0].uri;
      handleFieldChange('avatarUrl', newAvatarUrl);
    }
  };
  
  // Hantera formulärinskickning
  const handleSubmit = () => {
    form.handleSubmit((data) => {
      const dto = transformFormDataToDto(data);
      updateProfile(dto);
    })();
  };
  
  return (
    <ProfileScreenPresentation
      formData={formData}
      isLoading={isLoadingUser}
      isUpdating={isUpdating}
      errors={form.formState.errors}
      onFieldChange={handleFieldChange}
      onNestedFieldChange={handleNestedFieldChange}
      onSubmit={handleSubmit}
      onImagePick={handleImagePick}
    />
  );
}; 