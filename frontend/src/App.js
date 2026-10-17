import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './components/ErrorBoundary';

function MainContent() {
  const { isDark, colors } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <MainContent />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
