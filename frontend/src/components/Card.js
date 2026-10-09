import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const Card = ({ children, style = null, glow = false }) => {
  return (
    <View
      style={[
        styles.card,
        glow && styles.glow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
  },
  glow: {
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(0, 240, 255, 0.15)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
});

export default Card;
