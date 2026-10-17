import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';
import { useResponsive } from '../utils/responsive';

export const ModalView = ({
  visible,
  onClose,
  title,
  children,
  maxWidth = 600,
}) => {
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && onClose) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        keyboardVerticalOffset={0}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.modalContent,
            {
              maxWidth,
              backgroundColor: colors.surfaceCard,
              borderColor: colors.border,
            },
            isMobile && styles.modalContentMobile,
          ]}
        >
          <View
            style={[
              styles.header,
              { borderBottomColor: colors.borderLight },
              isMobile && { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
            ]}
          >
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={[styles.bodyContent, isMobile && { padding: SPACING.md }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.35)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
    overflow: 'hidden',
  },
  modalContentMobile: {
    maxHeight: '95%',
    paddingBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 4,
    borderRadius: RADIUS.sm,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: SPACING.lg,
  },
});

export default ModalView;
