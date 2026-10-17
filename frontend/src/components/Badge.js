import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS, RADIUS } from '../constants/theme';

export const Badge = ({ label, status = 'default', size = 'md', style = null }) => {
  const { colors, isDark } = useTheme();

  const getColors = () => {
    switch (status) {
      case 'Pending':
        return isDark
          ? { bg: 'rgba(245, 158, 11, 0.15)', text: colors.amber, border: 'rgba(245, 158, 11, 0.3)' }
          : { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      case 'Assigned':
        return isDark
          ? { bg: 'rgba(168, 85, 247, 0.15)', text: colors.violet, border: 'rgba(168, 85, 247, 0.3)' }
          : { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' };
      case 'In-Progress':
        return isDark
          ? { bg: 'rgba(0, 229, 255, 0.15)', text: colors.cyan, border: 'rgba(0, 229, 255, 0.3)' }
          : { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' };
      case 'Onhold':
        return isDark
          ? { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.3)' }
          : { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' };
      case 'Completed':
      case 'Resolved':
        return isDark
          ? { bg: 'rgba(16, 185, 129, 0.15)', text: colors.green, border: 'rgba(16, 185, 129, 0.3)' }
          : { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'SuperAdmin':
        return isDark
          ? { bg: 'rgba(0, 229, 255, 0.2)', text: colors.cyan, border: colors.primary }
          : { bg: '#e0f2fe', text: '#0284c7', border: '#7dd3fc' };
      case 'User':
        return isDark
          ? { bg: 'rgba(255, 255, 255, 0.08)', text: colors.textSecondary, border: colors.borderLight }
          : { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
      default:
        return isDark
          ? { bg: 'rgba(59, 130, 246, 0.15)', text: colors.blue, border: 'rgba(59, 130, 246, 0.3)' }
          : { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
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
