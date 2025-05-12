import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationAdapter } from '@/domain/organization/services/ResourceLimitNotificationService';

/**
 * Implementation av NotificationAdapter som använder Supabase för att hantera notifikationer.
 */
export class SupabaseNotificationAdapter implements NotificationAdapter {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Skickar en notifikation till en eller flera användare.
   * 
   * @param notification - Notifikationsinformation att skicka
   */
  async sendNotification(notification: {
    title: string;
    body: string;
    type: string;
    metadata?: Record<string, any>;
    userIds: string[];
  }): Promise<void> {
    try {
      // Validera indata
      if (!notification.userIds || notification.userIds.length === 0) {
        console.warn('Inga användar-IDs angivna för notifikation, avbryter');
        return;
      }
      
      // Skapa notifikationer i databasen för varje användare
      const notificationsToInsert = notification.userIds.map(userId => ({
        user_id: userId,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        metadata: notification.metadata || {},
        is_read: false,
        created_at: new Date().toISOString()
      }));
      
      // Batch-insert notifikationer i databasen
      const { error } = await this.supabase
        .from('notifications')
        .insert(notificationsToInsert);
      
      if (error) {
        throw error;
      }
      
      // För push-notifikationer, hämta device tokens från användare
      await this.sendPushNotifications(notification);
      
      console.log(`Notifikation '${notification.title}' skickad till ${notification.userIds.length} användare`);
    } catch (error) {
      console.error('Fel vid skickande av notifikation:', error);
    }
  }
  
  /**
   * Skickar push-notifikationer till användare.
   * 
   * @param notification - Notifikationsinformation att skicka
   */
  private async sendPushNotifications(notification: {
    title: string;
    body: string;
    type: string;
    metadata?: Record<string, any>;
    userIds: string[];
  }): Promise<void> {
    try {
      // Hämta device tokens för användarna
      const { data: deviceTokens, error } = await this.supabase
        .from('device_tokens')
        .select('token')
        .in('user_id', notification.userIds);
      
      if (error) {
        throw error;
      }
      
      if (!deviceTokens || deviceTokens.length === 0) {
        return; // Inga device tokens att skicka till
      }
      
      // Extrahera tokens till en lista
      const tokens = deviceTokens.map(dt => dt.token);
      
      // Anropa extern push-service om relevant
      // Detta skulle typiskt vara en Firebase Cloud Messaging eller liknande tjänst
      await this.sendToPushService({
        tokens,
        title: notification.title,
        body: notification.body,
        data: {
          type: notification.type,
          ...notification.metadata
        }
      });
      
      console.log(`Push-notifikation skickad till ${tokens.length} enheter`);
    } catch (error) {
      console.error('Fel vid skickande av push-notifikation:', error);
    }
  }
  
  /**
   * Skickar notifikation till en extern push-tjänst (t.ex. Firebase Cloud Messaging).
   * 
   * @param pushData - Information att skicka till push-tjänsten
   */
  private async sendToPushService(pushData: {
    tokens: string[];
    title: string;
    body: string;
    data: Record<string, any>;
  }): Promise<void> {
    // Denna metod skulle i praktiken anropa FCM eller liknande tjänst
    // För demo-syfte loggar vi bara
    console.log('Skulle skicka push till extern tjänst:', pushData);
    
    // Exempel på implementation med FCM skulle se ut ungefär:
    /*
    const message = {
      tokens: pushData.tokens,
      notification: {
        title: pushData.title,
        body: pushData.body
      },
      data: pushData.data
    };
    
    await firebase.messaging().sendMulticast(message);
    */
  }
} 