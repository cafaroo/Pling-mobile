import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, CreateUserDTO, UpdateUserDTO } from '../types/User';
import { UserService } from '../services/userService';

const userService = UserService.getInstance();

export function useUser(userId: string) {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId),
  });

  const updateUser = useMutation({
    mutationFn: (data: UpdateUserDTO) => userService.updateUser(userId, data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', userId], updatedUser);
    },
  });

  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['user', userId, 'preferences'],
    queryFn: () => userService.getUserPreferences(userId),
  });

  const updatePreferences = useMutation({
    mutationFn: (data: Partial<UserPreferences>) => 
      userService.updateUserPreferences(userId, data),
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData(
        ['user', userId, 'preferences'], 
        updatedPreferences
      );
    },
  });

  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ['user', userId, 'devices'],
    queryFn: () => userService.getUserDevices(userId),
  });

  const addDevice = useMutation({
    mutationFn: (device: Omit<UserDevice, 'id' | 'created_at' | 'updated_at'>) =>
      userService.addUserDevice(device),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', userId, 'devices']);
    },
  });

  const removeDevice = useMutation({
    mutationFn: (deviceId: string) => userService.removeUserDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', userId, 'devices']);
    },
  });

  const updateDeviceLastUsed = useMutation({
    mutationFn: (deviceId: string) => userService.updateDeviceLastUsed(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', userId, 'devices']);
    },
  });

  return {
    user,
    isLoading,
    error,
    updateUser: updateUser.mutate,
    isUpdating: updateUser.isPending,
    updateError: updateUser.error,
    
    preferences,
    preferencesLoading,
    updatePreferences: updatePreferences.mutate,
    isUpdatingPreferences: updatePreferences.isPending,
    preferencesError: updatePreferences.error,
    
    devices,
    devicesLoading,
    addDevice: addDevice.mutate,
    removeDevice: removeDevice.mutate,
    updateDeviceLastUsed: updateDeviceLastUsed.mutate,
    isAddingDevice: addDevice.isPending,
    isRemovingDevice: removeDevice.isPending,
    devicesError: addDevice.error || removeDevice.error,
  };
} 