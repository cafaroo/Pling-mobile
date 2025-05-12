import { supabase } from '@/lib/supabase';
import { SupabaseNotificationAdapter } from '@/infrastructure/adapters/SupabaseNotificationAdapter';
import { ResourceLimitNotificationService } from '@/domain/organization/services/ResourceLimitNotificationService';
import { ResourceType } from '@/domain/organization/strategies/ResourceLimitStrategy';
import { UniqueId } from '@/domain/core/UniqueId';

/**
 * Service för att hantera push-notifikationer till enheter.
 * Integrerar med notifications och device_tokens tabellerna.
 */
export class PushNotificationService {
  private notificationAdapter: SupabaseNotificationAdapter;
  private resourceLimitNotificationService: ResourceLimitNotificationService;

  constructor() {
    this.notificationAdapter = new SupabaseNotificationAdapter(supabase);
    this.resourceLimitNotificationService = new ResourceLimitNotificationService(this.notificationAdapter);
  }

  /**
   * Registrerar en enhetstoken för en användare för push-notifikationer.
   * 
   * @param userId - ID för användaren
   * @param token - Enhetstoken för push-notifikationer
   * @param deviceType - Typ av enhet (ios/android)
   * @param deviceName - Namn på enheten (valfritt)
   * @param appVersion - Version av appen (valfritt)
   * @returns Success status
   */
  public async registerDeviceToken(
    userId: string,
    token: string,
    deviceType: 'ios' | 'android',
    deviceName?: string,
    appVersion?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_device_token', {
        user_id: userId,
        device_token: token,
        device_type: deviceType,
        device_name: deviceName || null,
        app_version: appVersion || null
      });

      if (error) {
        console.error('Fel vid registrering av enhetstoken:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Fel vid registrering av enhetstoken:', error);
      return false;
    }
  }

  /**
   * Avregistrerar en enhetstoken för en användare.
   * 
   * @param userId - ID för användaren
   * @param token - Enhetstoken att avregistrera
   * @returns Success status
   */
  public async unregisterDeviceToken(
    userId: string,
    token: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('remove_device_token', {
        user_id: userId,
        device_token: token
      });

      if (error) {
        console.error('Fel vid avregistrering av enhetstoken:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Fel vid avregistrering av enhetstoken:', error);
      return false;
    }
  }

  /**
   * Hämtar alla notifikationer för en användare.
   * 
   * @param userId - ID för användaren
   * @param limit - Maximalt antal notifikationer att hämta
   * @param onlyUnread - Om true, hämta endast olästa notifikationer
   * @returns Lista med notifikationer
   */
  public async getUserNotifications(
    userId: string,
    limit: number = 20,
    onlyUnread: boolean = false
  ): Promise<Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    metadata: Record<string, any>;
    isRead: boolean;
    createdAt: Date;
  }>> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (onlyUnread) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Fel vid hämtning av notifikationer:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        body: item.body,
        type: item.type,
        metadata: item.metadata || {},
        isRead: item.is_read,
        createdAt: new Date(item.created_at)
      }));
    } catch (error) {
      console.error('Fel vid hämtning av notifikationer:', error);
      return [];
    }
  }

  /**
   * Markerar en notifikation som läst.
   * 
   * @param notificationId - ID för notifikationen
   * @param userId - ID för användaren (för säkerhetsvalidering)
   * @returns Success status
   */
  public async markNotificationAsRead(
    notificationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Fel vid markering av notifikation som läst:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Fel vid markering av notifikation som läst:', error);
      return false;
    }
  }

  /**
   * Markerar alla notifikationer för en användare som lästa.
   * 
   * @param userId - ID för användaren
   * @returns Success status
   */
  public async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Fel vid markering av alla notifikationer som lästa:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Fel vid markering av alla notifikationer som lästa:', error);
      return false;
    }
  }

  /**
   * Skickar en varning om resursbegränsning till specificerade användare.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceType - Typ av resurs att varna om
   * @param currentUsage - Nuvarande användning
   * @param limit - Resursbegränsning
   * @param userIds - Lista med användar-ID att notifiera
   * @returns Success status
   */
  public async sendResourceLimitWarning(
    organizationId: string,
    resourceType: ResourceType,
    currentUsage: number,
    limit: number,
    userIds: string[]
  ): Promise<boolean> {
    try {
      await this.resourceLimitNotificationService.sendLimitWarning(
        new UniqueId(organizationId),
        resourceType,
        currentUsage,
        limit,
        userIds
      );
      return true;
    } catch (error) {
      console.error('Fel vid skickande av resursbegränsningsvarning:', error);
      return false;
    }
  }

  /**
   * Skickar en notifikation om att resursbegränsningen har nåtts.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceType - Typ av resurs som nått begränsningen
   * @param limit - Resursbegränsning
   * @param userIds - Lista med användar-ID att notifiera
   * @returns Success status
   */
  public async sendResourceLimitReached(
    organizationId: string,
    resourceType: ResourceType,
    limit: number,
    userIds: string[]
  ): Promise<boolean> {
    try {
      await this.resourceLimitNotificationService.sendLimitReached(
        new UniqueId(organizationId),
        resourceType,
        limit,
        userIds
      );
      return true;
    } catch (error) {
      console.error('Fel vid skickande av notifikation om resursbegränsning nådd:', error);
      return false;
    }
  }
} 