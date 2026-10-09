import React, { useContext } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, getStateFromPath } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../components/LoadingScreen';
import { COLORS } from '../constants/theme';

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

  if (loading) {
    return <LoadingScreen message="AUTHENTICATING OPERATOR SESSION..." />;
  }

  return (
    <NavigationContainer
      linking={Platform.OS === 'web' ? linking : undefined}
      theme={{
        dark: true,
        colors: {
          primary: COLORS.primary,
          background: COLORS.background,
          card: COLORS.surface,
          text: COLORS.text,
          border: COLORS.border,
          notification: COLORS.primary,
        },
      }}
    >
      <Stack.Navigator
        initialRouteName={!isAuthenticated ? 'Login' : 'Main'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
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
