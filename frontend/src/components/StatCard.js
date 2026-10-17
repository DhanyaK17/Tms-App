import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

export const StatCard = ({
  title,
  value,
  icon,
  color = 'cyan', // 'cyan' | 'amber' | 'violet' | 'green'
  onPress = null,
  active = false,
  style = null,
}) => {
  const { colors, isDark } = useTheme();

  const getThemeColor = () => {
    switch (color) {
      case 'amber':
        return colors.amber;
      case 'violet':
        return colors.violet;
      case 'green':
        return colors.green;
      case 'cyan':
      default:
        return colors.cyan;
    }
  };

  const accentColor = getThemeColor();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.borderLight,
          borderLeftColor: accentColor,
        },
        active && {
          borderColor: accentColor,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 131, 158, 0.06)',
        },
        pressed && onPress && styles.pressed,
        style,
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        {icon && <View style={[styles.iconBox, { backgroundColor: `${accentColor}20` }]}>{icon}</View>}
      </View>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <View style={[styles.bottomBar, { backgroundColor: accentColor }]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 6,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.7,
  },
});

export default StatCard;
