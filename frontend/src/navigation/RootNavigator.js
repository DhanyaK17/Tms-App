import React, { useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, getStateFromPath } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../components/LoadingScreen';
import { navigationRef } from './navigationRef';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../services/notificationService';

const Stack = createNativeStackNavigator();

// Web Linking configuration to preserve existing web URL routes
const linking = {
  prefixes: ['/', 'tms://'],
  config: {
    initialRouteName: 'Login',
    screens: {
      Login: '',
      Main: {
        initialRouteName: 'Home',
        screens: {
          Home: 'dashboard',
          Complaints: 'complaints',
          UserComplaints: 'my-complaints',
          ComplaintForm: 'complaints/new',
          ComplaintTracking: 'track/:complaintId',
          Departments: 'departments',
          Programmes: 'programmes',
          Blocks: 'blocks',
          Rooms: 'rooms',
          Roles: 'roles',
          Users: 'users',
          Reports: 'reports',
          Profile: 'profile',
        },
      },
    },
  },
  getStateFromPath: (path, options) => {
    let normalized = path ? path.trim() : '';
    if (
      normalized === '' ||
      normalized === '/' ||
      normalized === '/login' ||
      normalized === 'login'
    ) {
      normalized = '/';
    }
    return getStateFromPath(normalized, options);
  },
};

export const RootNavigator = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const { colors, isDark } = useTheme();

  // Register push notifications when user is authenticated (native platforms only)
  useEffect(() => {
    if (isAuthenticated && Platform.OS !== 'web') {
      registerForPushNotificationsAsync().catch((err) =>
        console.warn('Push registration error on login:', err)
      );
    }
  }, [isAuthenticated]);

  // Listen for push notification responses (taps on native platforms only)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const cleanup = setupNotificationListeners((complaintId) => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('Main', {
          screen: 'ComplaintTracking',
          params: { complaintId },
        });
      }
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  if (loading) {
    return <LoadingScreen message="AUTHENTICATING OPERATOR SESSION..." />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={Platform.OS === 'web' ? linking : undefined}
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <Stack.Navigator
        initialRouteName={!isAuthenticated ? 'Login' : 'Main'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
