import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

export const Card = ({ children, style = null, glow = false }) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        style,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.borderLight,
        },
        glow && {
          borderColor: isDark ? colors.border : colors.borderLight,
          ...Platform.select({
            web: {
              boxShadow: isDark
                ? '0px 4px 12px rgba(0, 240, 255, 0.15)'
                : '0px 4px 12px rgba(15, 23, 42, 0.08)',
            },
            default: {
              shadowColor: isDark ? colors.primary : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.2 : 0.06,
              shadowRadius: 10,
              elevation: 3,
            },
          }),
        },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
});

export default Card;
