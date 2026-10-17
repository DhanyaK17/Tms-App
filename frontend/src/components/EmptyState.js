import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/theme';
import Button from './Button';

export const EmptyState = ({
  icon = 'file-tray-outline',
  title = 'No Records Detected',
  description = 'No incidents or assets match the selected criteria.',
  actionTitle = null,
  onAction = null,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: `${colors.primary}15`,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: SPACING.md,
  },
});

export default EmptyState;
