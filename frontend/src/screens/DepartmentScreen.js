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
import { departmentService } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import ModalView from '../components/ModalView';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import { useResponsive } from '../utils/responsive';

export const DepartmentScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { width } = useResponsive();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modal / Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', shortName: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await departmentService.getAll();
      setDepartments(res.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch department records.');
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
    setFormData({ name: '', shortName: '', description: '' });
    setModalVisible(true);
  };

  const openEditModal = (dept) => {
    setEditingId(dept._id);
    setFormData({
      name: dept.name || '',
      shortName: dept.shortName || '',
      description: dept.description || '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.shortName.trim()) {
      setError('Name and Short Code are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await departmentService.update(editingId, formData);
      } else {
        await departmentService.create(formData);
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Database write error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, name) => {
    const executeDelete = async () => {
      try {
        await departmentService.delete(id);
        await loadData();
      } catch (err) {
        setError('Deletion failed: Active structural dependencies detected.');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Permanently delete department: "${name}"?`)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Confirm Deletion',
        `Permanent deletion of department: "${name}"?`,
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

  if (loading && departments.length === 0) {
    return <LoadingScreen message="SYNCING DEPARTMENT DIRECTORY..." />;
  }

  const numCols = width >= 768 ? 2 : 1;
  const cardWidthPercent = `${100 / numCols}%`;

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
            <Text style={styles.headerTitle}>Department Hub</Text>
            <Text style={styles.headerSubtitle}>
              Department unit directory & code identifier mappings
            </Text>
          </View>
          <Button
            title="＋ New Department"
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

        {departments.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title="No Departments Registered"
            description="Create the primary organizational units for facility management."
            actionTitle="Create Department"
            onAction={openCreateModal}
          />
        ) : (
          <View style={styles.list}>
            {departments.map((dept) => (
              <View key={dept._id} style={[styles.gridItem, { width: cardWidthPercent }]}>
                <Card style={styles.deptCard}>
                  <View style={styles.deptTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deptName}>{dept.name}</Text>
                      <View style={styles.codeTag}>
                        <Text style={styles.codeText}>{dept.shortName}</Text>
                      </View>
                    </View>

                    <View style={styles.actionBtnGroup}>
                      <Button
                        title="Edit"
                        onPress={() => openEditModal(dept)}
                        variant="outline"
                        size="sm"
                        style={{ marginRight: 8 }}
                      />
                      <Button
                        title="Delete"
                        onPress={() => handleDelete(dept._id, dept.name)}
                        variant="danger"
                        size="sm"
                      />
                    </View>
                  </View>
                  {dept.description ? (
                    <Text style={styles.deptDesc}>{dept.description}</Text>
                  ) : null}
                </Card>
              </View>
            ))}
          </View>
        )}

        {/* Modal for Create/Edit */}
        <ModalView
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={editingId ? 'Edit Department Unit' : 'Register Department Unit'}
        >
          <View>
            <Input
              label="Official Department Name *"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              placeholder="e.g. Information Technology"
            />
            <Input
              label="Short Code Identifier *"
              value={formData.shortName}
              onChangeText={(t) => setFormData({ ...formData, shortName: t.toUpperCase() })}
              placeholder="e.g. IT"
            />
            <Input
              label="Operational Description"
              value={formData.description}
              onChangeText={(t) => setFormData({ ...formData, description: t })}
              placeholder="Optional overview..."
              multiline
              numberOfLines={3}
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
  deptCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
  },
  deptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  codeTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  codeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  deptDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
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

export default DepartmentScreen;
