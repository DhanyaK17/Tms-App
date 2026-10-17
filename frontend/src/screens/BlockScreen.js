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
import { useTheme } from '../context/ThemeContext';
import { blockService, departmentService, programmeService } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import ModalView from '../components/ModalView';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import { useResponsive } from '../utils/responsive';

export const BlockScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const { width } = useResponsive();
  const numCols = width >= 768 ? 2 : 1;
  const cardWidthPercent = numCols === 2 ? '50%' : '100%';

  const [blocks, setBlocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modal / Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', department: '', programme: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [blockRes, deptRes, progRes] = await Promise.all([
        blockService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
      ]);
      setBlocks(blockRes.data || []);
      setDepartments(deptRes.data || []);
      setProgrammes(progRes.data || []);
      setError('');
    } catch (err) {
      setError('Infrastructure data synchronization failed.');
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
      name: '',
      department: departments[0]?._id || '',
      programme: programmes[0]?._id || '',
      description: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (block) => {
    setEditingId(block._id);
    setFormData({
      name: block.name || '',
      department: block.department?._id || block.department || '',
      programme: block.programme?._id || block.programme || '',
      description: block.description || '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.department || !formData.programme) {
      setError('Block Name, Department, and Programme are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await blockService.update(editingId, formData);
      } else {
        await blockService.create(formData);
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
        await blockService.delete(id);
        await loadData();
      } catch (err) {
        setError('Deletion failed: Structural dependencies detected.');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Permanently delete block: "${name}"?`)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Confirm Deletion',
        `Permanent deletion of block: "${name}"?`,
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

  if (loading && blocks.length === 0) {
    return <LoadingScreen message="MAPPING INFRASTRUCTURE BLOCKS..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.innerContainer}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Block Infrastructure</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Facility block directory & sector allocations
            </Text>
          </View>
          <Button
            title="＋ Register Block"
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

        {blocks.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No Blocks Registered"
            description="Register facility blocks to allocate rooms and maintenance zones."
            actionTitle="Register Block"
            onAction={openCreateModal}
          />
        ) : (
          <View style={styles.list}>
            {blocks.map((block) => {
              const deptName =
                block.department?.name ||
                departments.find((d) => d._id === block.department)?.name ||
                'General';
              const progName =
                block.programme?.name ||
                programmes.find((p) => p._id === block.programme)?.name ||
                'General';

              return (
                <View key={block._id} style={[styles.gridItem, { width: cardWidthPercent }]}>
                  <Card style={styles.blockCard}>
                    <View style={styles.blockTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.blockName}>{block.name}</Text>
                        <View style={styles.badgeRow}>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>{deptName}</Text>
                          </View>
                          <View style={styles.progTag}>
                            <Text style={styles.progTagText}>{progName}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.actionBtnGroup}>
                        <Button
                          title="Edit"
                          onPress={() => openEditModal(block)}
                          variant="outline"
                          size="sm"
                          style={{ marginRight: 8 }}
                        />
                        <Button
                          title="Delete"
                          onPress={() => handleDelete(block._id, block.name)}
                          variant="danger"
                          size="sm"
                        />
                      </View>
                    </View>
                    {block.description ? (
                      <Text style={styles.blockDesc}>{block.description}</Text>
                    ) : null}
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
          title={editingId ? 'Edit Structural Block' : 'Register New Block'}
        >
          <View>
            <Input
              label="Block / Sector Identifier *"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              placeholder="e.g. Science Block A"
            />

            <Text style={styles.fieldLabel}>Mapped Department *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
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

            <Text style={styles.fieldLabel}>Mapped Programme *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
              {programmes.map((p) => (
                <Pressable
                  key={p._id}
                  style={[styles.pill, formData.programme === p._id && styles.pillActive]}
                  onPress={() => setFormData({ ...formData, programme: p._id })}
                >
                  <Text
                    style={[
                      styles.pillText,
                      formData.programme === p._id && styles.pillTextActive,
                    ]}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Input
              label="Description"
              value={formData.description}
              onChangeText={(t) => setFormData({ ...formData, description: t })}
              placeholder="Facility details..."
              multiline
              numberOfLines={3}
              style={{ marginTop: SPACING.sm }}
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
  blockCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
  },
  blockTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  blockName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  progTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  progTagText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  blockDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
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

export default BlockScreen;
