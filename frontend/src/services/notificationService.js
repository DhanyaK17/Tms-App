import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';
import { navigate } from '../navigation/navigationRef';

// Safely resolve expo-notifications on native platforms only
let Notifications = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
  } catch (e) {
    // Native module unavailable (e.g. running unsupported native environment)
    Notifications = null;
  }
}

let pushToken = null;

/**
 * Register for Expo Push Notifications and sync token with backend
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web' || !Notifications) {
    return null;
  }

  // Detect Expo Go client vs custom Development Build
  const isExpoGo =
    Constants?.appOwnership === 'expo' ||
    Constants?.executionEnvironment === 'storeClient';

  if (Platform.OS === 'android' && isExpoGo) {
    console.log(
      '[Push] Remote push notifications are unavailable in Expo Go on Android (SDK 53+). Ready for Development Build.'
    );
    return null;
  }

  // Set up Android high-priority notification channel
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('complaint-updates', {
        name: 'Complaint Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00e5ff',
        sound: 'default',
        enableVibrate: true,
      });
    } catch (e) {
      console.warn('[Push] Error configuring Android channel:', e.message);
    }
  }

  if (!Device.isDevice) {
    console.log('[Push] Must use physical device for remote push notifications');
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
      console.log('[Push] Notification permission not granted');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    pushToken = tokenData.data;
    console.log('[Push] Device Push Token obtained:', pushToken);

    // Register token with backend
    await api.post('/users/push-token', { token: pushToken });
    console.log('[Push] Token successfully registered with backend');

    return pushToken;
  } catch (error) {
    console.warn('[Push] Error registering push notification token:', error.message);
    return null;
  }
}

/**
 * Unregister push token from backend on logout
 */
export async function unregisterPushTokenAsync() {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    if (pushToken) {
      await api.delete('/users/push-token', { data: { token: pushToken } });
      pushToken = null;
    }
  } catch (error) {
    console.warn('[Push] Failed to unregister push token:', error.message);
  }
}

/**
 * Configure response listener so tapping a notification navigates to the complaint
 */
export function setupNotificationListeners(onNotificationTapped) {
  if (Platform.OS === 'web' || !Notifications || typeof Notifications.addNotificationReceivedListener !== 'function') {
    return () => {};
  }

  // Listener when user receives notification in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[Push] Notification received in foreground:', notification.request.content.title);
  });

  // Listener when user taps a notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    try {
      const data = response.notification.request.content.data;
      console.log('[Push] Notification tapped with data:', data);

      if (data && data.complaintId) {
        if (onNotificationTapped) {
          onNotificationTapped(data.complaintId);
        } else {
          navigate('Main', {
            screen: 'ComplaintTracking',
            params: { complaintId: data.complaintId },
          });
        }
      }
    } catch (e) {
      console.warn('[Push] Error handling notification tap:', e.message);
    }
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

export default {
  registerForPushNotificationsAsync,
  unregisterPushTokenAsync,
  setupNotificationListeners,
};
