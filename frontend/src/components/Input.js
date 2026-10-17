import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error = '',
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  icon = null,
  style = null,
  inputStyle = null,
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  const inputRef = useRef(null);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBg,
            borderColor: error
              ? colors.red
              : isFocused
              ? colors.primary
              : colors.borderLight,
          },
          isFocused && {
            ...Platform.select({
              web: {
                boxShadow: `0px 0px 6px ${isDark ? 'rgba(0, 229, 255, 0.25)' : 'rgba(0, 131, 158, 0.25)'}`,
              },
              default: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
              },
            }),
          },
          !editable && styles.inputDisabled,
          multiline && { minHeight: 90, alignItems: 'flex-start' },
        ]}
      >
        {icon && <View style={[styles.leftIcon, { pointerEvents: 'none' }]}>{icon}</View>}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            { color: colors.text },
            multiline && styles.multilineInput,
            inputStyle,
          ]}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </Pressable>
      {error ? <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
    minHeight: 44,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 12,
    minHeight: 80,
  },
  eyeButton: {
    padding: 6,
    marginLeft: 6,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default Input;
