import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS, RADIUS } from '../constants/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon = null,
  style = null,
  textStyle = null,
}) => {
  const { colors, isDark } = useTheme();
  const isInteractive = !loading && !disabled;

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          btn: { backgroundColor: colors.primary },
          text: { color: isDark ? '#040810' : '#ffffff' },
        };
      case 'secondary':
        return {
          btn: { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight, borderWidth: 1 },
          text: { color: colors.text },
        };
      case 'outline':
        return {
          btn: { backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 1 },
          text: { color: colors.primary },
        };
      case 'ghost':
        return {
          btn: { backgroundColor: 'transparent' },
          text: { color: colors.primary },
        };
      case 'success':
        return {
          btn: { backgroundColor: colors.green },
          text: { color: '#ffffff' },
        };
      case 'danger':
        return {
          btn: { backgroundColor: colors.red },
          text: { color: '#ffffff' },
        };
      default:
        return {
          btn: {},
          text: {},
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        vStyles.btn,
        disabled && styles.disabled,
        pressed && isInteractive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : (isDark ? '#040810' : '#ffffff')}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          {title ? (
            <Text
              style={[
                styles.textBase,
                styles[`text_${variant}`],
                styles[`textSize_${size}`],
                vStyles.text,
                disabled && styles.textDisabled,
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.15s ease',
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primary: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(0, 240, 255, 0.3)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  secondary: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  success: {
    backgroundColor: COLORS.green,
  },
  danger: {
    backgroundColor: COLORS.red,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  size_sm: {
    minHeight: 38,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  size_md: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  size_lg: {
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },

  // Text base
  textBase: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  text_primary: {
    color: '#040810',
  },
  text_secondary: {
    color: COLORS.text,
  },
  text_success: {
    color: '#040810',
  },
  text_danger: {
    color: '#ffffff',
  },
  text_outline: {
    color: COLORS.primary,
  },
  text_ghost: {
    color: COLORS.primary,
  },

  textSize_sm: {
    fontSize: 12,
  },
  textSize_md: {
    fontSize: 14,
  },
  textSize_lg: {
    fontSize: 16,
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
});

export default Button;
