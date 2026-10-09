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
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useResponsive } from '../utils/responsive';

export const ModalView = ({
  visible,
  onClose,
  title,
  children,
  maxWidth = 600,
}) => {
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
        style={styles.overlay}
        keyboardVerticalOffset={0}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.modalContent,
            { maxWidth },
            isMobile && styles.modalContentMobile,
          ]}
        >
          <View style={[styles.header, isMobile && { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }]}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
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
    backgroundColor: COLORS.overlay,
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
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
    borderBottomColor: COLORS.borderLight,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: SPACING.lg,
  },
});

export default ModalView;
