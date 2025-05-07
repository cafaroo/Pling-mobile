import { supabase } from '@/lib/supabase';
import type { 
  User, 
  CreateUserDTO, 
  UpdateUserDTO, 
  UserPreferences, 
  UserDevice 
} from '../types/User';

export class UserService {
  private static instance: UserService;
  private readonly TABLE_NAME = 'users';
  private readonly PREFERENCES_TABLE = 'user_preferences';
  private readonly DEVICES_TABLE = 'user_devices';

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const { data: user, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return user;
  }

  async getUser(id: string): Promise<User> {
    const { data: user, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return user;
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    const { data: user, error } = await supabase
      .from(this.TABLE_NAME)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return user;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const { data: preferences, error } = await supabase
      .from(this.PREFERENCES_TABLE)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return preferences;
  }

  async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const { data: updatedPreferences, error } = await supabase
      .from(this.PREFERENCES_TABLE)
      .update({ 
        ...preferences, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return updatedPreferences;
  }

  async getUserDevices(userId: string): Promise<UserDevice[]> {
    const { data: devices, error } = await supabase
      .from(this.DEVICES_TABLE)
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return devices;
  }

  async addUserDevice(device: Omit<UserDevice, 'id' | 'created_at' | 'updated_at'>): Promise<UserDevice> {
    const { data: newDevice, error } = await supabase
      .from(this.DEVICES_TABLE)
      .insert(device)
      .select()
      .single();

    if (error) throw error;
    return newDevice;
  }

  async removeUserDevice(deviceId: string): Promise<void> {
    const { error } = await supabase
      .from(this.DEVICES_TABLE)
      .delete()
      .eq('id', deviceId);

    if (error) throw error;
  }

  async updateDeviceLastUsed(deviceId: string): Promise<void> {
    const { error } = await supabase
      .from(this.DEVICES_TABLE)
      .update({ 
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceId);

    if (error) throw error;
  }
} 