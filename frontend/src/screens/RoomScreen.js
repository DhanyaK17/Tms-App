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
import { roomService, departmentService, programmeService, blockService } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import ModalView from '../components/ModalView';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import { useResponsive } from '../utils/responsive';

export const RoomScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const { width } = useResponsive();
  const numCols = width >= 768 ? 2 : 1;
  const cardWidthPercent = numCols === 2 ? '50%' : '100%';

  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modal / Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    department: '',
    programme: '',
    block: '',
    floor: '',
    capacity: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [roomRes, deptRes, progRes, blockRes] = await Promise.all([
        roomService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
        blockService.getAll(),
      ]);
      setRooms(roomRes.data || []);
      setDepartments(deptRes.data || []);
      setProgrammes(progRes.data || []);
      setBlocks(blockRes.data || []);
      setError('');
    } catch (err) {
      setError('Facility asset synchronization failure.');
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
      roomNumber: '',
      department: departments[0]?._id || '',
      programme: programmes[0]?._id || '',
      block: blocks[0]?._id || '',
      floor: '1',
      capacity: '30',
      description: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (room) => {
    setEditingId(room._id);
    setFormData({
      roomNumber: room.roomNumber || '',
      department: room.department?._id || room.department || '',
      programme: room.programme?._id || room.programme || '',
      block: room.block?._id || room.block || '',
      floor: String(room.floor || '1'),
      capacity: String(room.capacity || '30'),
      description: room.description || '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.roomNumber.trim() || !formData.department || !formData.block) {
      setError('Room Number, Department, and Block are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await roomService.update(editingId, formData);
      } else {
        await roomService.create(formData);
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Database write error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, number) => {
    const executeDelete = async () => {
      try {
        await roomService.delete(id);
        await loadData();
      } catch (err) {
        setError('Deletion failed: Active complaints linked to this room.');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Permanent removal of facility room "${number}"?`)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Confirm Deletion',
        `Permanent removal of facility room "${number}"?`,
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

  if (loading && rooms.length === 0) {
    return <LoadingScreen message="INDEXING FACILITY ROOMS..." />;
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Facility Room Directory</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Room allocation, sector locations & departmental assignments
            </Text>
          </View>
          <Button
            title="＋ Register Room"
            onPress={openCreateModal}
            variant="primary"
            size="sm"
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger || '#ef4444'} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {rooms.length === 0 ? (
          <EmptyState
            icon="key-outline"
            title="No Rooms Registered"
            description="Add facility rooms to allow users to raise specific localized tickets."
            actionTitle="Register Room"
            onAction={openCreateModal}
          />
        ) : (
          <View style={styles.list}>
            {rooms.map((room) => {
              const blockName =
                room.block?.name ||
                blocks.find((b) => b._id === room.block)?.name ||
                'Unmapped Block';

              return (
                <View key={room._id} style={[styles.gridItem, { width: cardWidthPercent }]}>
                  <Card style={styles.roomCard}>
                    <View style={styles.roomTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.roomNumber, { color: colors.text }]}>Room {room.roomNumber}</Text>
                        <View style={styles.badgeRow}>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>{blockName}</Text>
                          </View>
                          {room.floor && (
                            <View style={[styles.floorTag, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                              <Text style={[styles.floorTagText, { color: colors.textSecondary }]}>Floor {room.floor}</Text>
                            </View>
                          )}
                          {room.capacity && (
                            <View style={[styles.floorTag, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                              <Text style={[styles.floorTagText, { color: colors.textSecondary }]}>{room.capacity} Cap</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.actionBtnGroup}>
                        <Button
                          title="Edit"
                          onPress={() => openEditModal(room)}
                          variant="outline"
                          size="sm"
                          style={{ marginRight: 8 }}
                        />
                        <Button
                          title="Delete"
                          onPress={() => handleDelete(room._id, room.roomNumber)}
                          variant="danger"
                          size="sm"
                        />
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
          title={editingId ? 'Edit Facility Room' : 'Register New Facility Room'}
        >
          <View>
            <Input
              label="Room Number / Designation *"
              value={formData.roomNumber}
              onChangeText={(t) => setFormData({ ...formData, roomNumber: t })}
              placeholder="e.g. 101 or LAB-A"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Sector / Block *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
              {blocks.map((b) => (
                <Pressable
                  key={b._id}
                  style={[
                    styles.pill,
                    { borderColor: colors.borderLight },
                    formData.block === b._id && styles.pillActive,
                  ]}
                  onPress={() => setFormData({ ...formData, block: b._id })}
                >
                  <Text style={[styles.pillText, { color: colors.textSecondary }, formData.block === b._id && styles.pillTextActive]}>
                    {b.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mapped Department *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
              {departments.map((d) => (
                <Pressable
                  key={d._id}
                  style={[
                    styles.pill,
                    { borderColor: colors.borderLight },
                    formData.department === d._id && styles.pillActive,
                  ]}
                  onPress={() => setFormData({ ...formData, department: d._id })}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: colors.textSecondary },
                      formData.department === d._id && styles.pillTextActive,
                    ]}
                  >
                    {d.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Input
              label="Floor Level"
              value={formData.floor}
              onChangeText={(t) => setFormData({ ...formData, floor: t })}
              placeholder="e.g. 1 or Ground"
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
  roomCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
  },
  roomTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomNumber: {
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
  floorTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  floorTagText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
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

export default RoomScreen;
