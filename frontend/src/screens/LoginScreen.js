import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import { useResponsive } from '../utils/responsive';

export const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const { isMobile, isSmallMobile, isLandscape } = useResponsive();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Please provide both email identity and security key.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation is automatically handled by AuthContext state in RootNavigator
    } catch (err) {
      if (err.response) {
        // Server responded with an explicit error code
        setError(
          err.response.data?.message || 'Authentication failed. Please verify credentials.'
        );
      } else if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        setError(`Connection timed out to ${API_BASE_URL}. Ensure PC and device share the same Wi-Fi.`);
      } else if (err.message === 'Network Error' || !err.response) {
        setError(`Cannot reach backend server at ${API_BASE_URL}. Verify backend is running.`);
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isLandscape && { paddingVertical: SPACING.md, paddingBottom: SPACING.md },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Card
          style={[
            styles.loginCard,
            isMobile && styles.loginCardMobile,
            isSmallMobile && styles.loginCardSmall,
          ]}
          glow
        >
            {/* Header Brand */}
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>T</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>TMS PLATFORM</Text>
                <Text style={styles.brandSubtitle}>COMPLAINT MANAGEMENT SYSTEM</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.subtitle}>Secure Operator Authentication</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={COLORS.red} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <Input
                label="Email Identity"
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. admin@tms.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />}
              />

              <Input
                label="Security Key"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                icon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />}
              />

              <Button
                title="Establish Session"
                onPress={handleSubmit}
                loading={loading}
                variant="primary"
                size="lg"
                style={styles.submitBtn}
                icon={<Ionicons name="shield-checkmark-outline" size={18} color="#040810" />}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerNote}>
                TMS Secure Cluster • End-to-End Encrypted Session
              </Text>
            </View>
          </Card>
        </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.xl,
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginCardMobile: {
    padding: SPACING.lg,
  },
  loginCardSmall: {
    padding: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(0, 240, 255, 0.4)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  logoBadgeText: {
    color: '#040810',
    fontSize: 24,
    fontWeight: '900',
  },
  brandTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginBottom: SPACING.md,
  },
  welcomeTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: SPACING.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  form: {
    marginTop: 4,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerNote: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});

export default LoginScreen;
