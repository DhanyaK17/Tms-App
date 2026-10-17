import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import {
  complaintService,
  userService,
  FILE_BASE_URL,
} from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import ModalView from '../components/ModalView';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import { useResponsive } from '../utils/responsive';

export const ComplaintsDashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const { width } = useResponsive();

  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Inspection Drawer & Assign targets
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assignModal, setAssignModal] = useState({ visible: false, complaintId: null, assignee: '' });

  const loadData = useCallback(async () => {
    try {
      const [compRes, statRes] = await Promise.all([
        complaintService.getAll(),
        complaintService.getStats(),
      ]);
      setComplaints(compRes.data || []);
      setStats(statRes.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
      setError('');
    } catch (err) {
      setError('Network failure: Unable to retrieve global ticker.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      userService
        .getAll()
        .then((res) => setUsers(res.data || []))
        .catch((err) => console.warn('Failed to load users for assignment', err));
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAssignSubmit = async () => {
    if (!assignModal.assignee) return;
    try {
      await complaintService.assign(assignModal.complaintId, assignModal.assignee);
      setAssignModal({ visible: false, complaintId: null, assignee: '' });
      await loadData();
      if (selectedComplaint && selectedComplaint._id === assignModal.complaintId) {
        setSelectedComplaint(null);
      }
    } catch (err) {
      setError('Assignment rejected by server.');
    }
  };

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      await complaintService.updateStatus(complaintId, newStatus);
      await loadData();
      if (selectedComplaint && selectedComplaint._id === complaintId) {
        setSelectedComplaint((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      setError('Status update rejected by server.');
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      c.blockName?.toLowerCase().includes(term) ||
      c.roomNumber?.toLowerCase().includes(term) ||
      c.complaintType?.toLowerCase().includes(term) ||
      c.createdBy?.username?.toLowerCase().includes(term) ||
      c.remarks?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  if (loading && complaints.length === 0) {
    return <LoadingScreen message="ACCESSING GLOBAL INCIDENT REPOSITORY..." />;
  }

  const numCols = width >= 1024 ? 4 : width >= 640 ? 4 : width >= 340 ? 2 : 1;
  const cardWidthPercent = `${100 / numCols}%`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.innerContainer}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Global Oversight Console</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Centralized complaint management & field technician dispatch
            </Text>
          </View>
          <Button
            title="Manual Sync ⟳"
            onPress={onRefresh}
            variant="outline"
            size="sm"
            style={{ alignSelf: 'flex-start' }}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.red} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Live Filter Metric Cards */}
        <View style={styles.metricsGrid}>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="System Load"
              value={stats.total}
              color="cyan"
              active={filterStatus === 'All'}
              onPress={() => setFilterStatus('All')}
            />
          </View>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="Awaiting Triage"
              value={stats.pending}
              color="amber"
              active={filterStatus === 'Pending'}
              onPress={() => setFilterStatus('Pending')}
            />
          </View>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="In Field View"
              value={stats.assigned}
              color="violet"
              active={filterStatus === 'Assigned'}
              onPress={() => setFilterStatus('Assigned')}
            />
          </View>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="Resolved Units"
              value={stats.closed}
              color="green"
              active={filterStatus === 'Completed'}
              onPress={() => setFilterStatus('Completed')}
            />
          </View>
        </View>

        {/* Search & Status Pills Filter Bar */}
        <Card style={styles.filterCard}>
          <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.borderLight }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Filter by block, room, type, user or keyword..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchTerm ? (
              <Pressable onPress={() => setSearchTerm('')} hitSlop={8} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPills}>
            {['All', 'Pending', 'Assigned', 'In-Progress', 'Completed'].map((st) => (
              <Pressable
                key={st}
                style={[
                  styles.pill,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight },
                  filterStatus === st && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                ]}
                onPress={() => setFilterStatus(st)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: colors.textSecondary },
                    filterStatus === st && { color: colors.primary, fontWeight: '800' },
                  ]}
                >
                  {st === 'Completed' ? 'Resolved' : st}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Card>

        {/* Ticket List */}
        <View style={styles.ticketList}>
          {filteredComplaints.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No Incident Records Found"
              description="No tickets match the current status and search parameters."
              actionTitle="Reset Filters"
              onAction={() => {
                setFilterStatus('All');
                setSearchTerm('');
              }}
            />
          ) : (
            filteredComplaints.map((ticket) => {
              const isAssignedToMe =
                ticket.assignedTo &&
                String(ticket.assignedTo._id || ticket.assignedTo) ===
                String(user?.id || user?._id);

              return (
                <Pressable
                  key={ticket._id}
                  style={({ pressed }) => [
                    styles.ticketCard,
                    { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => setSelectedComplaint(ticket)}
                >
                  <View style={styles.ticketTop}>
                    <View>
                      <Text style={[styles.ticketLocation, { color: colors.text }]}>
                        {ticket.blockName} • {ticket.roomNumber}
                      </Text>
                      <Text style={[styles.ticketType, { color: colors.primary }]}>{ticket.complaintType}</Text>
                    </View>
                    <Badge status={ticket.status} />
                  </View>

                  <Text style={[styles.ticketRemarks, { color: colors.textSecondary }]} numberOfLines={2}>
                    {ticket.remarks || 'No remarks provided.'}
                  </Text>

                  <View style={[styles.ticketMetaRow, { borderTopColor: colors.borderLight }]}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textMuted }]}>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={13} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textMuted }]}>
                        {ticket.createdBy?.username || 'Anonymous'}
                      </Text>
                    </View>
                    {ticket.assignedTo && (
                      <View style={styles.metaItem}>
                        <Ionicons name="construct-outline" size={13} color={colors.primary} />
                        <Text style={[styles.metaText, { color: colors.primary }]}>
                          {ticket.assignedTo?.username || 'Staff'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actionRow}>
                    {user?.role === 'SuperAdmin' && !ticket.assignedTo && (
                      <Button
                        title="Assign"
                        onPress={() =>
                          setAssignModal({ visible: true, complaintId: ticket._id, assignee: '' })
                        }
                        variant="primary"
                        size="sm"
                        style={{ marginRight: 8 }}
                      />
                    )}

                    {(isAssignedToMe || user?.role === 'SuperAdmin') &&
                      ticket.status !== 'Completed' && (
                        <>
                          {ticket.status !== 'In-Progress' && (
                            <Button
                              title="Work It"
                              onPress={() => handleUpdateStatus(ticket._id, 'In-Progress')}
                              variant="secondary"
                              size="sm"
                              style={{ marginRight: 8 }}
                            />
                          )}
                          <Button
                            title="Finish"
                            onPress={() => handleUpdateStatus(ticket._id, 'Completed')}
                            variant="success"
                            size="sm"
                            style={{ marginRight: 8 }}
                          />
                        </>
                      )}

                    <Button
                      title="Track Live"
                      onPress={() => navigation.navigate('ComplaintTracking', { complaintId: ticket._id, complaint: ticket })}
                      variant="primary"
                      size="sm"
                      icon={<Ionicons name="navigate-outline" size={13} color={colors.textDark} />}
                      style={{ marginLeft: 'auto', marginRight: 6 }}
                    />
                    <Button
                      title="Inspect"
                      onPress={() => setSelectedComplaint(ticket)}
                      variant="outline"
                      size="sm"
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Ticket Inspection Modal */}
        <ModalView
          visible={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title="Ticket Inspection Dossier"
        >
          {selectedComplaint && (
            <View style={styles.inspectContent}>
              <View style={styles.inspectGrid}>
                <View style={styles.inspectItem}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Facility Location</Text>
                  <Text style={[styles.inspectValue, { color: colors.text }]}>
                    {selectedComplaint.blockName} • {selectedComplaint.roomNumber}
                  </Text>
                </View>

                <View style={styles.inspectItem}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Service Category</Text>
                  <Text style={[styles.inspectValue, { color: colors.text }]}>{selectedComplaint.complaintType}</Text>
                </View>

                <View style={styles.inspectItem}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Current Status</Text>
                  <Badge status={selectedComplaint.status} />
                </View>

                <View style={styles.inspectItem}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Submitted On</Text>
                  <Text style={[styles.inspectValue, { color: colors.text }]}>
                    {new Date(selectedComplaint.createdAt).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.inspectItem}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Originator</Text>
                  <Text style={[styles.inspectValue, { color: colors.text }]}>
                    {selectedComplaint.createdBy?.username || 'Anonymous'}
                  </Text>
                </View>

                <View style={styles.inspectItem}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Assigned Technician</Text>
                  <Text style={[styles.inspectValue, { color: colors.text }]}>
                    {selectedComplaint.assignedTo?.username || 'Unassigned'}
                  </Text>
                </View>
              </View>

              <View style={[styles.inspectFullSection, { borderTopColor: colors.borderLight }]}>
                <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Operational Remarks</Text>
                <Text style={[styles.inspectRemarks, { color: colors.text }]}>
                  {selectedComplaint.remarks || 'No remarks provided.'}
                </Text>
              </View>

              {selectedComplaint.attachment && (
                <View style={[styles.inspectFullSection, { borderTopColor: colors.borderLight }]}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Evidentiary Attachment</Text>
                  <Button
                    title="View Document / Photo ↗"
                    onPress={() => {
                      const fullUrl = `${FILE_BASE_URL}${selectedComplaint.attachment.startsWith('/') ? '' : '/'
                        }${selectedComplaint.attachment}`;
                      Linking.openURL(fullUrl);
                    }}
                    variant="outline"
                    size="sm"
                    style={{ alignSelf: 'flex-start', marginTop: 6 }}
                  />
                </View>
              )}

              {/* Status Update & Assign from Modal */}
              <View style={styles.inspectActionRow}>
                {user?.role === 'SuperAdmin' && !selectedComplaint.assignedTo && (
                  <Button
                    title="Assign Technician"
                    onPress={() => {
                      setAssignModal({
                        visible: true,
                        complaintId: selectedComplaint._id,
                        assignee: '',
                      });
                    }}
                    variant="primary"
                    size="md"
                    style={{ flex: 1, marginRight: 8 }}
                  />
                )}

                {selectedComplaint.status !== 'Completed' && (
                  <Button
                    title="Mark Completed"
                    onPress={() => handleUpdateStatus(selectedComplaint._id, 'Completed')}
                    variant="success"
                    size="md"
                    style={{ flex: 1 }}
                  />
                )}
              </View>

              {/* Direct Link to Live Tracking */}
              <Button
                title="Launch Live Tracking Radar 📍"
                onPress={() => {
                  const c = selectedComplaint;
                  setSelectedComplaint(null);
                  navigation.navigate('ComplaintTracking', { complaintId: c._id, complaint: c });
                }}
                variant="primary"
                size="md"
                style={{ marginTop: SPACING.md }}
              />
            </View>
          )}
        </ModalView>

        {/* Assign Technician Modal */}
        <ModalView
          visible={assignModal.visible}
          onClose={() => setAssignModal({ visible: false, complaintId: null, assignee: '' })}
          title="Dispatch Technician"
        >
          <View>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Select Technician / Staff *</Text>
            <ScrollView style={{ maxHeight: 240, marginBottom: SPACING.md }}>
              {users
                ?.filter((u) => u.role !== 'SuperAdmin')
                .map((u) => (
                  <Pressable
                    key={u._id}
                    style={[
                      styles.assignUserItem,
                      {
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.borderLight,
                      },
                      assignModal.assignee === u._id && {
                        borderColor: colors.primary,
                        backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 131, 158, 0.15)',
                      },
                    ]}
                    onPress={() => setAssignModal({ ...assignModal, assignee: u._id })}
                  >
                    <View>
                      <Text style={[styles.assignUserName, { color: colors.text }]}>{u.username}</Text>
                      <Text style={[styles.assignUserRole, { color: colors.primary }]}>{u.role}</Text>
                    </View>
                    {assignModal.assignee === u._id && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
            </ScrollView>

            <Button
              title="Confirm Assignment"
              onPress={handleAssignSubmit}
              disabled={!assignModal.assignee}
              variant="primary"
              size="lg"
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
    letterSpacing: 0.5,
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
    marginBottom: SPACING.md,
  },
  gridItem: {
    padding: SPACING.xs,
  },
  filterCard: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    paddingVertical: 8,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  filterPills: {
    flexDirection: 'row',
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
  ticketList: {
    gap: SPACING.md,
  },
  ticketCard: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  cardPressed: {
    opacity: 0.9,
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  ticketLocation: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  ticketType: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  ticketRemarks: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  inspectContent: {
    gap: SPACING.md,
  },
  inspectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  inspectItem: {
    width: '50%',
    padding: 8,
  },
  inspectLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inspectValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  inspectFullSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
  },
  inspectRemarks: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  inspectActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.md,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  assignUserItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 6,
  },
  assignUserItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  assignUserName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  assignUserRole: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ComplaintsDashboardScreen;
