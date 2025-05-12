import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Service för att hantera push-notifikationer
 */
export class PushNotificationService {
  private userId: string | null = null;
  private organizationId: string | null = null;

  /**
   * Initiera notifikationstjänsten för en specifik användare
   * @param userId Användarens ID
   * @param organizationId Organisationens ID (valfritt)
   */
  constructor(userId: string | null = null, organizationId: string | null = null) {
    this.userId = userId;
    this.organizationId = organizationId;
  }

  /**
   * Konfigurera notifikationsinställningar för appen
   */
  public async configureNotifications(): Promise<void> {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Registrera enheten för push-notifikationer
   * @returns Token som erhållits eller null om registrering misslyckades
   */
  public async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Push-notifikationer fungerar endast på fysiska enheter');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Användaren har inte godkänt notifikationer');
        return null;
      }

      // Hämta enhetstoken
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      // Uppdatera platform-specifika inställningar
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      // Spara token i databasen om användar-ID finns
      if (this.userId) {
        await this.saveDeviceToken(expoPushToken.data);
      }

      return expoPushToken.data;
    } catch (error) {
      console.error('Fel vid registrering för push-notifikationer:', error);
      return null;
    }
  }

  /**
   * Spara enhetstoken i databasen
   * @param token Exponotifikationstoken
   * @returns Om tokensparingen lyckades
   */
  private async saveDeviceToken(token: string): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const { error } = await supabase.from('device_tokens').upsert({
        user_id: this.userId,
        organization_id: this.organizationId,
        device_token: token,
        platform: Platform.OS,
        last_updated: new Date().toISOString(),
      });

      if (error) {
        console.error('Fel vid sparande av enhetstoken:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Oväntat fel vid sparande av enhetstoken:', error);
      return false;
    }
  }

  /**
   * Skicka en lokal notifikation
   * @param notification Notifikationsdata
   * @returns ID för notifikationen om den schemalagts eller null om det misslyckades
   */
  public async sendLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null, // Visa omedelbart
      });

      return notificationId;
    } catch (error) {
      console.error('Fel vid sändning av lokal notifikation:', error);
      return null;
    }
  }

  /**
   * Avregistrera enheten från push-notifikationer
   * @returns Om avregistreringen lyckades
   */
  public async unregisterForPushNotifications(): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', this.userId);

      if (error) {
        console.error('Fel vid avregistrering av enhetstoken:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Oväntat fel vid avregistrering av enhetstoken:', error);
      return false;
    }
  }
} 