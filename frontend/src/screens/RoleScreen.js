import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { roleService } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import ModalView from '../components/ModalView';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import { useResponsive } from '../utils/responsive';

export const RoleScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { width } = useResponsive();
  const numCols = width >= 768 ? 2 : 1;
  const cardWidthPercent = numCols === 2 ? '50%' : '100%';

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modal / Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', permissions: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await roleService.getAll();
      setRoles(res.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch authorization levels.');
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
    setFormData({ name: '', permissions: 'read, write', description: '' });
    setModalVisible(true);
  };

  const openEditModal = (role) => {
    setEditingId(role._id);
    setFormData({
      name: role.name || '',
      permissions: role.permissions?.join(', ') || '',
      description: role.description || '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Role Designation is required.');
      return;
    }
    const permissions = formData.permissions
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p);

    const submitData = { ...formData, permissions };

    setSubmitting(true);
    try {
      if (editingId) {
        await roleService.update(editingId, submitData);
      } else {
        await roleService.create(submitData);
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Authorization commitment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    const executeDelete = async () => {
      try {
        await roleService.delete(id);
        await loadData();
      } catch (err) {
        setError('Revocation denied: Active user associations detected.');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Permanent revocation of role: "${name}"?`)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Confirm Revocation',
        `Permanent revocation of role: "${name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: executeDelete },
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

  if (loading && roles.length === 0) {
    return <LoadingScreen message="PARSING PERMISSION MATRIX..." />;
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
            <Text style={styles.headerTitle}>Permission Matrix</Text>
            <Text style={styles.headerSubtitle}>
              User role clearance levels & access vector definitions
            </Text>
          </View>
          <Button
            title="＋ Register Role"
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

        {roles.length === 0 ? (
          <EmptyState
            icon="shield-checkmark-outline"
            title="No Roles Defined"
            description="Create system clearance levels for user identities."
            actionTitle="Register Role"
            onAction={openCreateModal}
          />
        ) : (
          <View style={styles.list}>
            {roles.map((role) => (
              <View key={role._id} style={[styles.gridItem, { width: cardWidthPercent }]}>
                <Card style={styles.roleCard}>
                  <View style={styles.roleTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleName}>{role.name}</Text>
                      {role.permissions && role.permissions.length > 0 && (
                        <View style={styles.permissionsRow}>
                          {role.permissions.map((p, i) => (
                            <View key={i} style={styles.permTag}>
                              <Text style={styles.permText}>{p}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.actionBtnGroup}>
                      <Button
                        title="Edit"
                        onPress={() => openEditModal(role)}
                        variant="outline"
                        size="sm"
                        style={{ marginRight: 8 }}
                      />
                      <Button
                        title="Delete"
                        onPress={() => handleDelete(role._id, role.name)}
                        variant="danger"
                        size="sm"
                      />
                    </View>
                  </View>
                </Card>
              </View>
            ))}
          </View>
        )}

        {/* Modal for Create/Edit */}
        <ModalView
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={editingId ? 'Edit Clearance Role' : 'Register New Role'}
        >
          <View>
            <Input
              label="Role Designation *"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              placeholder="e.g. Security Specialist"
            />
            <Input
              label="Permissions (comma separated)"
              value={formData.permissions}
              onChangeText={(t) => setFormData({ ...formData, permissions: t })}
              placeholder="e.g. read, write, dispatch, report"
            />

            <Button
              title={submitting ? 'Committing...' : editingId ? 'Update Record' : 'Create Record'}
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
  roleCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
  },
  roleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  permissionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  permTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  permText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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

export default RoleScreen;
