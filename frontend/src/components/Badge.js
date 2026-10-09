import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

export const Badge = ({ label, status = 'default', size = 'md', style = null }) => {
  const getColors = () => {
    switch (status) {
      case 'Pending':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: COLORS.amber, border: 'rgba(245, 158, 11, 0.3)' };
      case 'Assigned':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: COLORS.violet, border: 'rgba(168, 85, 247, 0.3)' };
      case 'In-Progress':
        return { bg: 'rgba(0, 229, 255, 0.15)', text: COLORS.cyan, border: 'rgba(0, 229, 255, 0.3)' };
      case 'Onhold':
        return { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.3)' };
      case 'Completed':
      case 'Resolved':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: COLORS.green, border: 'rgba(16, 185, 129, 0.3)' };
      case 'SuperAdmin':
        return { bg: 'rgba(0, 229, 255, 0.2)', text: COLORS.cyan, border: COLORS.primary };
      case 'User':
        return { bg: 'rgba(255, 255, 255, 0.08)', text: COLORS.textSecondary, border: COLORS.borderLight };
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', text: COLORS.blue, border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  const scheme = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: scheme.bg, borderColor: scheme.border },
        size === 'sm' && styles.badgeSm,
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: scheme.text }]} />
      <Text
        style={[
          styles.text,
          { color: scheme.text },
          size === 'sm' && styles.textSm,
        ]}
      >
        {label || status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textSm: {
    fontSize: 10,
  },
});

export default Badge;
