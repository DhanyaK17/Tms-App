import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { complaintService } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useResponsive } from '../utils/responsive';

export const ProfileScreen = ({ navigation }) => {
  const { user, updateProfile, changePassword, logout } = useContext(AuthContext);
  const { colors, isDark, toggleTheme } = useTheme();
  const { isSmallMobile } = useResponsive();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security' | 'preferences'
  const [stats, setStats] = useState(null);

  // General tab state
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password tab state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifs: user?.preferences?.emailNotifs ?? true,
    smsNotifs: user?.preferences?.smsNotifs ?? false,
    darkMode: user?.preferences?.darkMode ?? true,
  });

  const [notifications, setNotifications] = useState({
    ticketUpdates: user?.notifications?.ticketUpdates ?? true,
    mentions: user?.notifications?.mentions ?? true,
    weeklyReports: user?.notifications?.weeklyReports ?? false,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setPreferences({
        emailNotifs: user?.preferences?.emailNotifs ?? true,
        smsNotifs: user?.preferences?.smsNotifs ?? false,
        darkMode: user?.preferences?.darkMode ?? true,
      });
      setNotifications({
        ticketUpdates: user?.notifications?.ticketUpdates ?? true,
        mentions: user?.notifications?.mentions ?? true,
        weeklyReports: user?.notifications?.weeklyReports ?? false,
      });
      complaintService
        .getStats()
        .then((res) => setStats(res.data))
        .catch((err) => console.warn('Failed to fetch user stats', err));
    }
  }, [user]);

  const handleGeneralSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await updateProfile(formData);
      setSuccess('Operator dossier successfully updated!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    setError('');
    setSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError('Current and new security keys are required.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New keys do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Key length must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwordData);
      setSuccess('Security key altered successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update security key.');
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = async (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await updateProfile({ preferences: updated });
    } catch (err) {
      console.warn('Failed to save preference', err);
    }
  };

  const toggleNotification = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      await updateProfile({ notifications: updated });
    } catch (err) {
      console.warn('Failed to save notification', err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, isSmallMobile && { padding: SPACING.sm }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
        {/* Operator Hero Card */}
        <Card style={[styles.profileHero, { backgroundColor: colors.surfaceCard, borderColor: colors.border }, isSmallMobile && { padding: SPACING.md }]} glow>
          <View style={styles.heroRow}>
            <View style={[styles.avatarHuge, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }, isSmallMobile && { width: 50, height: 50, borderRadius: 25, marginRight: SPACING.sm }]}>
              <Text style={[styles.avatarHugeText, { color: colors.primary }, isSmallMobile && { fontSize: 20 }]}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.username, { color: colors.text }]}>{user?.username}</Text>
                <Badge status={user?.role} style={{ marginLeft: 8 }} />
              </View>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
              <Text style={[styles.userPhone, { color: colors.textMuted }]}>{user?.phone || 'No phone registered'}</Text>
            </View>
          </View>

          {/* Quick Metrics */}
          {stats && (
            <View style={[styles.statsStrip, { borderTopColor: colors.borderLight }]}>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.text }]}>{stats.total}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>INCIDENTS</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.amber }]}>{stats.pending}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>PENDING</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.green }]}>{stats.closed}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>RESOLVED</Text>
              </View>
            </View>
          )}
        </Card>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.red} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.green} style={{ marginRight: 8 }} />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {/* Tab Navigation */}
        <View style={[styles.tabRow, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }, isSmallMobile && { padding: 2 }]}>
          <Pressable
            style={[
              styles.tab,
              activeTab === 'general' && [styles.tabActive, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 163, 255, 0.1)', borderColor: isDark ? 'rgba(0, 229, 255, 0.3)' : 'rgba(0, 163, 255, 0.3)' }],
              isSmallMobile && { paddingVertical: 8, gap: 4 },
            ]}
            onPress={() => setActiveTab('general')}
          >
            <Ionicons
              name="person-outline"
              size={isSmallMobile ? 14 : 16}
              color={activeTab === 'general' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'general' ? colors.primary : colors.textSecondary }, isSmallMobile && { fontSize: 11 }]}>
              {isSmallMobile ? 'General' : 'General Details'}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === 'security' && [styles.tabActive, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 163, 255, 0.1)', borderColor: isDark ? 'rgba(0, 229, 255, 0.3)' : 'rgba(0, 163, 255, 0.3)' }],
              isSmallMobile && { paddingVertical: 8, gap: 4 },
            ]}
            onPress={() => setActiveTab('security')}
          >
            <Ionicons
              name="shield-outline"
              size={isSmallMobile ? 14 : 16}
              color={activeTab === 'security' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'security' ? colors.primary : colors.textSecondary }, isSmallMobile && { fontSize: 11 }]}>
              {isSmallMobile ? 'Security' : 'Security Key'}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === 'preferences' && [styles.tabActive, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 163, 255, 0.1)', borderColor: isDark ? 'rgba(0, 229, 255, 0.3)' : 'rgba(0, 163, 255, 0.3)' }],
              isSmallMobile && { paddingVertical: 8, gap: 4 },
            ]}
            onPress={() => setActiveTab('preferences')}
          >
            <Ionicons
              name="settings-outline"
              size={isSmallMobile ? 14 : 16}
              color={activeTab === 'preferences' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'preferences' ? colors.primary : colors.textSecondary }, isSmallMobile && { fontSize: 11 }]}>
              {isSmallMobile ? 'Preferences' : 'Preferences'}
            </Text>
          </Pressable>
        </View>

        {/* Tab 1: General Details */}
        {activeTab === 'general' && (
          <Card style={[styles.tabCard, isSmallMobile && { padding: SPACING.md }]}>
            <Input
              label="Operator Handle / Username"
              value={formData.username}
              onChangeText={(t) => setFormData({ ...formData, username: t })}
              placeholder="e.g. John Doe"
            />
            <Input
              label="Primary Email Vector"
              value={formData.email}
              onChangeText={(t) => setFormData({ ...formData, email: t })}
              keyboardType="email-address"
              placeholder="operator@tms.com"
            />
            <Input
              label="Secure Comms Phone"
              value={formData.phone}
              onChangeText={(t) => setFormData({ ...formData, phone: t })}
              keyboardType="phone-pad"
              placeholder="+1234567890"
            />

            <Button
              title="Save Operator Details"
              onPress={handleGeneralSave}
              loading={loading}
              variant="primary"
              size="md"
              style={{ marginTop: SPACING.md }}
              icon={<Ionicons name="save-outline" size={16} color="#040810" />}
            />
          </Card>
        )}

        {/* Tab 2: Security Key */}
        {activeTab === 'security' && (
          <Card style={[styles.tabCard, isSmallMobile && { padding: SPACING.md }]}>
            <Input
              label="Current Security Key"
              value={passwordData.currentPassword}
              onChangeText={(t) => setPasswordData({ ...passwordData, currentPassword: t })}
              placeholder="••••••••"
              secureTextEntry
            />
            <Input
              label="New Security Key"
              value={passwordData.newPassword}
              onChangeText={(t) => setPasswordData({ ...passwordData, newPassword: t })}
              placeholder="At least 6 characters"
              secureTextEntry
            />
            <Input
              label="Confirm New Key"
              value={passwordData.confirmPassword}
              onChangeText={(t) => setPasswordData({ ...passwordData, confirmPassword: t })}
              placeholder="Re-enter new key"
              secureTextEntry
            />

            <Button
              title="Update Security Key"
              onPress={handlePasswordSave}
              loading={loading}
              variant="primary"
              size="md"
              style={{ marginTop: SPACING.md }}
              icon={<Ionicons name="key-outline" size={16} color="#040810" />}
            />
          </Card>
        )}

        {/* Tab 3: Preferences & Notifications */}
        {activeTab === 'preferences' && (
          <Card style={[styles.tabCard, isSmallMobile && { padding: SPACING.md }]}>
            <Text style={[styles.prefSectionHeader, { color: colors.primary }]}>SYSTEM PREFERENCES</Text>
            <View style={[styles.prefItem, { borderBottomColor: colors.borderLight }]}>
              <View>
                <Text style={[styles.prefLabel, { color: colors.text }]}>Email Dispatches</Text>
                <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>Receive ticket alert transmissions via email</Text>
              </View>
              <Switch
                value={preferences.emailNotifs}
                onValueChange={() => togglePreference('emailNotifs')}
                trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              />
            </View>

            <View style={[styles.prefItem, { borderBottomColor: colors.borderLight }]}>
              <View>
                <Text style={[styles.prefLabel, { color: colors.text }]}>SMS Telemetry</Text>
                <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>Critical incident emergency notifications</Text>
              </View>
              <Switch
                value={preferences.smsNotifs}
                onValueChange={() => togglePreference('smsNotifs')}
                trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              />
            </View>

            <View style={[styles.prefItem, { borderBottomColor: colors.borderLight }]}>
              <View>
                <Text style={[styles.prefLabel, { color: colors.text }]}>Dark / Light Mode</Text>
                <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>
                  {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => toggleTheme()}
                trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              />
            </View>

            <Text style={[styles.prefSectionHeader, { color: colors.primary, marginTop: SPACING.lg }]}>
              NOTIFICATION CHANNELS
            </Text>

            <View style={[styles.prefItem, { borderBottomColor: colors.borderLight }]}>
              <View>
                <Text style={[styles.prefLabel, { color: colors.text }]}>Ticket Status Updates</Text>
                <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>Real-time alerts when ticket transitions state</Text>
              </View>
              <Switch
                value={notifications.ticketUpdates}
                onValueChange={() => toggleNotification('ticketUpdates')}
                trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              />
            </View>

            <View style={[styles.prefItem, { borderBottomColor: colors.borderLight }]}>
              <View>
                <Text style={[styles.prefLabel, { color: colors.text }]}>Operator Mentions</Text>
                <Text style={[styles.prefDesc, { color: colors.textSecondary }]}>When you are assigned to a facility ticket</Text>
              </View>
              <Switch
                value={notifications.mentions}
                onValueChange={() => toggleNotification('mentions')}
                trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              />
            </View>
          </Card>
        )}

        {/* Global Logout Session Button */}
        <Button
          title="Logout Current Session"
          onPress={logout}
          variant="danger"
          size="md"
          style={{ marginTop: SPACING.xl, marginBottom: SPACING.xl }}
          icon={<Ionicons name="log-out-outline" size={16} color="#ffffff" />}
        />
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 3,
  },
  innerContainer: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  profileHero: {
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarHuge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarHugeText: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  username: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  userEmail: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  userPhone: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  errorBox: {
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
    fontWeight: '600',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  successText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  prefSectionHeader: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  prefItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  prefLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  prefDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    maxWidth: 240,
  },
});

export default ProfileScreen;
