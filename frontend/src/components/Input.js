import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

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
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  const inputRef = useRef(null);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
          !editable && styles.inputDisabled,
          multiline && { minHeight: 90, alignItems: 'flex-start' },
        ]}
      >
        {icon && <View style={styles.leftIcon} pointerEvents="none">{icon}</View>}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
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
              color={COLORS.textSecondary}
            />
          </Pressable>
        )}
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
    ...Platform.select({
      web: {
        boxShadow: '0px 0px 6px rgba(0, 229, 255, 0.2)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  inputError: {
    borderColor: COLORS.red,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: COLORS.text,
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
    color: COLORS.red,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default Input;
