import React, { useEffect, useState, useCallback } from 'react';
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
import { complaintService, FILE_BASE_URL } from '../services/api';
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

export const UserComplaintDashboardScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { width } = useResponsive();

  const [complaints, setComplaints] = useState([]);
  const [myStats, setMyStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await complaintService.getAll();
      const allComplaints = res.data || [];
      setComplaints(allComplaints);

      const stats = {
        total: allComplaints.length,
        pending: allComplaints.filter((c) => c.status === 'Pending' || c.status === 'Onhold').length,
        assigned: allComplaints.filter(
          (c) => c.status === 'Assigned' || c.status === 'In-Progress'
        ).length,
        closed: allComplaints.filter((c) => c.status === 'Completed').length,
      };
      setMyStats(stats);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      c.blockName?.toLowerCase().includes(term) ||
      c.roomNumber?.toLowerCase().includes(term) ||
      c.complaintType?.toLowerCase().includes(term) ||
      c.remarks?.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  if (loading && complaints.length === 0) {
    return <LoadingScreen message="RETRIEVING OPERATOR TICKETS..." />;
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>My Ticket Dossier</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Tracking your submitted service requests & technician resolution activity
            </Text>
          </View>
          <Button
            title="＋ Raise Ticket"
            onPress={() => navigation.navigate('ComplaintForm')}
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

        {/* Live Filter Metric Cards */}
        <View style={styles.metricsGrid}>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="My Tickets"
              value={myStats.total}
              color="cyan"
              active={filterStatus === 'All'}
              onPress={() => setFilterStatus('All')}
            />
          </View>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="Awaiting Action"
              value={myStats.pending}
              color="amber"
              active={filterStatus === 'Pending'}
              onPress={() => setFilterStatus('Pending')}
            />
          </View>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="In Progress"
              value={myStats.assigned}
              color="violet"
              active={filterStatus === 'Assigned'}
              onPress={() => setFilterStatus('Assigned')}
            />
          </View>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="Resolved"
              value={myStats.closed}
              color="green"
              active={filterStatus === 'Completed'}
              onPress={() => setFilterStatus('Completed')}
            />
          </View>
        </View>

        {/* Filter & Search */}
        <Card style={styles.filterCard}>
          <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.borderLight }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search your reported tickets..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchTerm ? (
              <Pressable onPress={() => setSearchTerm('')} hitSlop={8} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

        {/* Tickets List */}
        <View style={styles.ticketList}>
          {filteredComplaints.length === 0 ? (
            <EmptyState
              icon="ticket-outline"
              title="No Tickets Reported"
              description="You have no service requests matching the selected filter."
              actionTitle="Raise New Ticket"
              onAction={() => navigation.navigate('ComplaintForm')}
            />
          ) : (
            filteredComplaints.map((ticket) => (
              <Pressable
                key={ticket._id}
                style={({ pressed }) => [
                  styles.ticketCard,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight },
                  pressed && styles.cardPressed,
                ]}
                onPress={() => navigation.navigate('ComplaintTracking', { complaintId: ticket._id, complaint: ticket })}
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
                  {ticket.remarks || 'No detailed remarks submitted.'}
                </Text>

                <View style={[styles.ticketBottom, { borderTopColor: colors.borderLight }]}>
                  <Text style={[styles.ticketDate, { color: colors.textMuted }]}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </Text>
                  {ticket.assignedTo && (
                    <Text style={[styles.ticketAssignee, { color: colors.primary }]}>
                      Tech: {ticket.assignedTo?.username || 'Staff'}
                    </Text>
                  )}
                  <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 6 }}>
                    <Button
                      title="Track Live"
                      onPress={() => navigation.navigate('ComplaintTracking', { complaintId: ticket._id, complaint: ticket })}
                      variant="primary"
                      size="sm"
                      icon={<Ionicons name="navigate-outline" size={13} color={colors.textDark} />}
                    />
                    <Button
                      title="Details"
                      onPress={() => setSelectedComplaint(ticket)}
                      variant="outline"
                      size="sm"
                    />
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Ticket Inspection Modal */}
        <ModalView
          visible={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title="Incident Details"
        >
          {selectedComplaint && (
            <View style={styles.inspectContent}>
              <View style={styles.inspectGrid}>
                <View style={styles.inspectItem}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Facility Room</Text>
                  <Text style={[styles.inspectValue, { color: colors.text }]}>
                    {selectedComplaint.blockName} • {selectedComplaint.roomNumber}
                  </Text>
                </View>
                <View style={styles.inspectItem}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Category</Text>
                  <Text style={[styles.inspectValue, { color: colors.text }]}>{selectedComplaint.complaintType}</Text>
                </View>
                <View style={styles.inspectItem}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Status</Text>
                  <Badge status={selectedComplaint.status} />
                </View>
                <View style={styles.inspectItem}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Reported Date</Text>
                  <Text style={[styles.inspectValue, { color: colors.text }]}>
                    {new Date(selectedComplaint.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.inspectItem}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Assigned Technician</Text>
                  <Text style={[styles.inspectValue, { color: colors.text }]}>
                    {selectedComplaint.assignedTo?.username || 'Awaiting assignment'}
                  </Text>
                </View>
              </View>

              <View style={[styles.inspectFullSection, { borderTopColor: colors.borderLight }]}>
                <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Remarks / Fault Details</Text>
                <Text style={[styles.inspectRemarks, { color: colors.text }]}>
                  {selectedComplaint.remarks || 'No remarks provided.'}
                </Text>
              </View>

              {selectedComplaint.attachment && (
                <View style={[styles.inspectFullSection, { borderTopColor: colors.borderLight }]}>
                  <Text style={[styles.inspectLabel, { color: colors.textSecondary }]}>Evidentiary Attachment</Text>
                  <Button
                    title="View Attached Evidence ↗"
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

              {/* Quick Launch into Live Tracking */}
              <Button
                title="Open Live Tracking Radar 📍"
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
  ticketBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  ticketDate: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  ticketAssignee: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 12,
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
});

export default UserComplaintDashboardScreen;
