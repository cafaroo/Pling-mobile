import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '@/components/auth/AuthProvider';
import { useResourceLimits } from '@/components/subscription/ResourceLimitProvider';
import { PushNotificationService } from '@/services/PushNotificationService';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Konfigurera notifikationshantering
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Komponent som lyssnar efter och hanterar notifikationer.
 * Registrerar enhetstoken för push-notifikationer och visar resursbegränsningsvarningar.
 */
export const NotificationListener: React.FC = () => {
  const { user } = useAuth();
  const { usage, organizationPlan } = useResourceLimits();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const [pushNotificationService] = useState(() => new PushNotificationService());

  // Registrera för notifikationer och erhåll token
  useEffect(() => {
    registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        
        // Om användaren är inloggad, registrera token i databasen
        if (user) {
          registerTokenWithServer(token);
        }
      }
    });

    // Konfigurera notifikationslyssnare
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Hantera när användaren trycker på notifikationen
      const { notification } = response;
      console.log('Användaren interagerade med notifikation:', notification);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // Registrera token när användaren loggar in
  useEffect(() => {
    if (user && expoPushToken) {
      registerTokenWithServer(expoPushToken);
    }
  }, [user, expoPushToken]);

  // Kontrollera resursbegränsningar när komponenten får fokus
  useFocusEffect(
    React.useCallback(() => {
      checkResourceLimits();
    }, [usage, organizationPlan])
  );

  // Funktion för att registrera notifikationer
  async function registerForPushNotifications() {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Kunde inte erhålla tillstånd för push-notifikationer!');
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
    } else {
      console.log('Måste använda fysisk enhet för push-notifikationer');
    }

    return token;
  }

  // Registrera token med servern
  async function registerTokenWithServer(token: string) {
    if (!user) return;

    const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
    const deviceName = Device.deviceName || undefined;
    const appVersion = Constants.expoConfig?.version || undefined;

    const success = await pushNotificationService.registerDeviceToken(
      user.id,
      token,
      deviceType as 'ios' | 'android',
      deviceName,
      appVersion
    );

    if (!success) {
      console.error('Fel vid registrering av enhetstoken med servern');
    }
  }

  // Kontrollera resursbegränsningar och visa varningar vid behov
  async function checkResourceLimits() {
    if (!user || !usage.length) return;

    // Hitta resurser som är nära gränsen eller har nått gränsen
    const limitWarnings = usage.filter(resource => resource.nearLimit);
    const limitReached = usage.filter(resource => resource.limitReached);

    // Visa lokala notifikationer om resurser närmar sig begränsning
    if (limitWarnings.length > 0) {
      const warningResource = limitWarnings[0]; // Visa bara för första resursen för att inte spamma
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Resursbegränsning närmar sig',
          body: `Du använder ${warningResource.usagePercentage}% av tillgängliga ${warningResource.resourceType.toLowerCase()}. Överväg att uppgradera till ${getNextPlan(organizationPlan)}.`,
        },
        trigger: null, // Visa direkt
      });
    }

    // Visa lokala notifikationer om resurser har nått begränsning
    if (limitReached.length > 0) {
      const reachedResource = limitReached[0]; // Visa bara för första resursen för att inte spamma
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Resursbegränsning uppnådd',
          body: `Du har nått gränsen för ${reachedResource.resourceType.toLowerCase()}. Uppgradera till ${getNextPlan(organizationPlan)} för att skapa fler.`,
        },
        trigger: null, // Visa direkt
      });
    }
  }

  // Hjälpfunktion för att få nästa prenumerationsnivå
  function getNextPlan(currentPlan: string): string {
    if (currentPlan === 'basic') return 'Pro';
    if (currentPlan === 'pro') return 'Enterprise';
    return 'en högre plan';
  }

  // Denna komponent renderar ingenting synligt
  return null;
};

export default NotificationListener; 