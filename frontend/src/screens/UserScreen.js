import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { userService, departmentService, roleService, programmeService } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ModalView from '../components/ModalView';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import { useResponsive } from '../utils/responsive';

export const UserScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { width } = useResponsive();
  const numCols = width >= 768 ? 2 : 1;
  const cardWidthPercent = numCols === 2 ? '50%' : '100%';

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState(['SuperAdmin', 'User']);
  const [programmes, setProgrammes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modal / Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'User',
    department: '',
    programme: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [userRes, deptRes, roleRes, progRes] = await Promise.all([
        userService.getAll(),
        departmentService.getAll(),
        roleService.getAll(),
        programmeService.getAll().catch(() => ({ data: [] })),
      ]);
      setUsers(userRes.data || []);
      setDepartments(deptRes.data || []);
      const fetchedRoles = (roleRes.data || []).map((r) => r.name);
      setRoles([
        'SuperAdmin',
        'User',
        ...fetchedRoles.filter((n) => n !== 'SuperAdmin' && n !== 'User'),
      ]);
      setProgrammes(progRes.data || []);
      setError('');
    } catch (err) {
      setError('User directory synchronization failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      loadData();
    }
  }, [user, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      username: '',
      email: '',
      phone: '',
      password: '',
      role: 'User',
      department: departments[0]?._id || '',
      programme: programmes[0]?._id || '',
    });
    setModalVisible(true);
  };

  const openEditModal = (u) => {
    setEditingId(u._id);
    setFormData({
      username: u.username || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      role: u.role || 'User',
      department: u.department?._id || u.department || '',
      programme: u.programme?._id || u.programme || '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Username, email, and phone are required.');
      return;
    }
    if (!editingId && !formData.password) {
      setError('Password required for new account creation.');
      return;
    }

    const submitData = { ...formData };
    if (editingId && !submitData.password) delete submitData.password;
    if (!submitData.department) delete submitData.department;
    if (!submitData.programme) delete submitData.programme;

    setSubmitting(true);
    try {
      if (editingId) {
        await userService.update(editingId, submitData);
      } else {
        await userService.create(submitData);
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to commit user changes.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    const executeDelete = async () => {
      try {
        await userService.delete(id);
        await loadData();
      } catch (err) {
        setError('Revocation failed: Active administrative session.');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Permanent revocation of user: "${name}"?`)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Confirm Revocation',
        `Permanent revocation of user: "${name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Revoke', style: 'destructive', onPress: executeDelete },
        ]
      );
    }
  };

  if (user?.role !== 'SuperAdmin') {
    return (
      <View style={styles.deniedContainer}>
        <Text style={styles.deniedTitle}>SuperAdmin Clearance Required</Text>
      </View>
    );
  }

  if (loading && users.length === 0) {
    return <LoadingScreen message="PROFILING OPERATOR IDENTITIES..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <View style={styles.innerContainer}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>User Access Directory</Text>
            <Text style={styles.headerSubtitle}>
              Manage personnel accounts, credentials & assigned roles
            </Text>
          </View>
          <Button
            title="＋ New User"
            onPress={openCreateModal}
            variant="primary"
            size="sm"
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.red} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {users.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Users Registered"
            description="Register personnel identities for ticket dispatch and tracking."
            actionTitle="Register User"
            onAction={openCreateModal}
          />
        ) : (
          <View style={styles.list}>
            {users.map((u) => {
              const deptName =
                u.department?.name ||
                departments.find((d) => d._id === u.department)?.name ||
                'Unmapped Dept';

              return (
                <View key={u._id} style={[styles.gridItem, { width: cardWidthPercent }]}>
                  <Card style={styles.userCard}>
                    <View style={styles.userTop}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {u.username?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userName}>{u.username}</Text>
                          <Badge status={u.role} size="sm" style={{ marginLeft: 6 }} />
                        </View>
                        <Text style={styles.userEmail}>{u.email}</Text>
                        <Text style={styles.userDept}>
                          Dept: {deptName} • {u.phone}
                        </Text>
                      </View>

                      <View style={styles.actionBtnGroup}>
                        <Button
                          title="Edit"
                          onPress={() => openEditModal(u)}
                          variant="outline"
                          size="sm"
                          style={{ marginRight: 8 }}
                        />
                        {u._id !== user?.id && u._id !== user?._id && (
                          <Button
                            title="Revoke"
                            onPress={() => handleDelete(u._id, u.username)}
                            variant="danger"
                            size="sm"
                          />
                        )}
                      </View>
                    </View>
                  </Card>
                </View>
              );
            })}
          </View>
        )}

        {/* Modal for Create/Edit */}
        <ModalView
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={editingId ? 'Edit Operator Account' : 'Register Operator Identity'}
        >
          <View>
            <Input
              label="Username *"
              value={formData.username}
              onChangeText={(t) => setFormData({ ...formData, username: t })}
              placeholder="e.g. operator_alpha"
            />
            <Input
              label="Email Address *"
              value={formData.email}
              onChangeText={(t) => setFormData({ ...formData, email: t })}
              keyboardType="email-address"
              placeholder="name@tms.com"
            />
            <Input
              label="Phone Vector *"
              value={formData.phone}
              onChangeText={(t) => setFormData({ ...formData, phone: t })}
              keyboardType="phone-pad"
              placeholder="+1234567890"
            />
            <Input
              label={editingId ? 'Security Key (Leave blank to keep existing)' : 'Security Key *'}
              value={formData.password}
              onChangeText={(t) => setFormData({ ...formData, password: t })}
              placeholder="••••••••"
              secureTextEntry
            />

            <Text style={styles.fieldLabel}>Authorization Role *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
              {roles.map((r) => (
                <Pressable
                  key={r}
                  style={[styles.pill, formData.role === r && styles.pillActive]}
                  onPress={() => setFormData({ ...formData, role: r })}
                >
                  <Text style={[styles.pillText, formData.role === r && styles.pillTextActive]}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Mapped Department</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
              <Pressable
                style={[styles.pill, !formData.department && styles.pillActive]}
                onPress={() => setFormData({ ...formData, department: '' })}
              >
                <Text style={[styles.pillText, !formData.department && styles.pillTextActive]}>
                  None
                </Text>
              </Pressable>
              {departments.map((d) => (
                <Pressable
                  key={d._id}
                  style={[styles.pill, formData.department === d._id && styles.pillActive]}
                  onPress={() => setFormData({ ...formData, department: d._id })}
                >
                  <Text
                    style={[
                      styles.pillText,
                      formData.department === d._id && styles.pillTextActive,
                    ]}
                  >
                    {d.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Button
              title={submitting ? 'Committing...' : editingId ? 'Update Identity' : 'Register Identity'}
              onPress={handleSubmit}
              loading={submitting}
              variant="primary"
              size="lg"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </ModalView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  innerContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
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
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  gridItem: {
    padding: SPACING.xs,
  },
  userCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  userAvatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  userEmail: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  userDept: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: 6,
  },
  pillList: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: COLORS.primary,
  },
  pillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  deniedContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deniedTitle: {
    color: COLORS.red,
    fontSize: 18,
    fontWeight: '800',
  },
});

export default UserScreen;
