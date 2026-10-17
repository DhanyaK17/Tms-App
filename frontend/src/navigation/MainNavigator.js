import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigationState } from '@react-navigation/native';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ComplaintsDashboardScreen from '../screens/ComplaintsDashboardScreen';
import UserComplaintDashboardScreen from '../screens/UserComplaintDashboardScreen';
import ComplaintFormScreen from '../screens/ComplaintFormScreen';
import ComplaintTrackingScreen from '../screens/ComplaintTrackingScreen';
import DepartmentScreen from '../screens/DepartmentScreen';
import ProgrammeScreen from '../screens/ProgrammeScreen';
import BlockScreen from '../screens/BlockScreen';
import RoomScreen from '../screens/RoomScreen';
import RoleScreen from '../screens/RoleScreen';
import UserScreen from '../screens/UserScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export const MainNavigator = ({ navigation }) => {
  const { colors, isDark } = useTheme();

  const currentRouteName = useNavigationState((state) => {
    if (!state) return 'Home';
    const route = state.routes[state.index];
    return route ? route.name : 'Home';
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBg}
      />
      <Header
        currentRoute={currentRouteName}
        onNavigate={(routeName, params) => {
          navigation.navigate(routeName, params);
        }}
      />
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: Platform.OS === 'web' ? 'none' : 'default',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Complaints" component={ComplaintsDashboardScreen} />
          <Stack.Screen name="UserComplaints" component={UserComplaintDashboardScreen} />
          <Stack.Screen name="ComplaintForm" component={ComplaintFormScreen} />
          <Stack.Screen name="ComplaintTracking" component={ComplaintTrackingScreen} />
          <Stack.Screen name="Departments" component={DepartmentScreen} />
          <Stack.Screen name="Programmes" component={ProgrammeScreen} />
          <Stack.Screen name="Blocks" component={BlockScreen} />
          <Stack.Screen name="Rooms" component={RoomScreen} />
          <Stack.Screen name="Roles" component={RoleScreen} />
          <Stack.Screen name="Users" component={UserScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default MainNavigator;
