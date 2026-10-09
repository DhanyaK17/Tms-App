import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export const LoadingScreen = ({ message = 'INITIALIZING SYSTEM TELEMETRY...' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.text}>{message}</Text>
        <View style={styles.telemetryTag}>
          <View style={styles.dot} />
          <Text style={styles.subtext}>SYNCING REPOSITORY</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  box: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 360,
    width: '100%',
  },
  text: {
    color: COLORS.text,
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
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  subtext: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

export default LoadingScreen;
