import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/theme';

export const LoadingScreen = ({ message = 'INITIALIZING SYSTEM TELEMETRY...' }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
        <View style={[styles.telemetryTag, { backgroundColor: `${colors.primary}15` }]}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.subtext, { color: colors.primary }]}>SYNCING REPOSITORY</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  box: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 360,
    width: '100%',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: SPACING.md,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  telemetryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  subtext: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

export default LoadingScreen;
