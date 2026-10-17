import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { complaintService } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Card from '../components/Card';
import { useResponsive } from '../utils/responsive';

export const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const { isSmallMobile, width } = useResponsive();

  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statRes, compRes] = await Promise.all([
        complaintService.getStats().catch(() => ({ data: { total: 0, pending: 0, assigned: 0, closed: 0 } })),
        complaintService.getAll().catch(() => ({ data: [] })),
      ]);
      setStats(statRes.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
      setRecentTickets((compRes.data || []).slice(0, 4));
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
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

  const adminLinks = [
    { route: 'ComplaintForm', label: 'Raise Ticket', desc: 'Submit incident or facility request', icon: 'create-outline', highlight: true, tag: 'NEW' },
    { route: 'Complaints', label: 'Tickets Master', desc: 'Global ticket registry & dispatch', icon: 'folder-outline', tag: 'CORE' },
    { route: 'Departments', label: 'Departments', desc: 'Department unit directory', icon: 'business-outline', tag: 'DIR' },
    { route: 'Programmes', label: 'Programmes', desc: 'Academic programme mappings', icon: 'school-outline', tag: 'DIR' },
    { route: 'Blocks', label: 'Blocks & Sectors', desc: 'Facility block allocations', icon: 'cube-outline', tag: 'FAC' },
    { route: 'Rooms', label: 'Facility Rooms', desc: 'Room directory & status', icon: 'key-outline', tag: 'FAC' },
    { route: 'Users', label: 'User Access', desc: 'Role & account permissions', icon: 'people-outline', tag: 'SEC' },
    { route: 'Reports', label: 'Reports & Intel', desc: 'Analytics & CSV data export', icon: 'bar-chart-outline', tag: 'INTEL' },
  ];

  const userLinks = [
    { route: 'ComplaintForm', label: 'Raise Ticket', desc: 'Submit maintenance request', icon: 'create-outline', highlight: true },
    { route: 'UserComplaints', label: 'My Tickets', desc: 'Track your reported incidents', icon: 'clipboard-outline' },
    ...(user?.role !== 'User'
      ? [{ route: 'Complaints', label: 'Assigned Tickets', desc: 'Work on assigned tasks', icon: 'construct-outline' }]
      : []),
  ];

  const actionLinks = user?.role === 'SuperAdmin' ? adminLinks : userLinks;

  // Responsive column calculation
  const getNumColumns = () => {
    if (width >= 1024) return 4;
    if (width >= 640) return 4;
    if (width >= 340) return 2;
    return 1;
  };

  const getActionCols = () => {
    if (width >= 1280) return 4;
    if (width >= 960) return 3;
    if (width >= 600) return 2;
    return 1;
  };

  const numCols = getNumColumns();
  const cardWidthPercent = `${100 / numCols}%`;
  const actionCols = getActionCols();
  const actionWidthPercent = `${100 / actionCols}%`;
  const ticketsRoute = user?.role === 'User' ? 'UserComplaints' : 'Complaints';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.innerContainer}>
        {/* Tactical Hero Card */}
        <Card style={[styles.heroCard, isSmallMobile && { padding: SPACING.md }]} glow>
          <View style={styles.heroHeader}>
            <View
              style={[
                styles.heroBadge,
                {
                  backgroundColor: isDark ? 'rgba(0, 229, 255, 0.1)' : 'rgba(0, 131, 158, 0.08)',
                  borderColor: isDark ? 'rgba(0, 229, 255, 0.3)' : 'rgba(0, 131, 158, 0.25)',
                },
              ]}
            >
              <Text style={[styles.heroBadgeText, { color: colors.primary }]}>TMS TACTICAL COMMAND</Text>
            </View>
            <View
              style={[
                styles.userRoleBadge,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
              ]}
            >
              <View style={styles.dot} />
              <Text style={[styles.userRoleText, { color: colors.text }]}>
                {user?.role ? user.role.toUpperCase() : 'OPERATOR'} ACCESS
              </Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {user?.role === 'SuperAdmin'
              ? 'Super Admin Command Hub'
              : 'Facility Maintenance Hub'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Real-time incident oversight, operational telemetry, and field technician dispatch.
          </Text>

          <View
            style={[
              styles.userGreetingPod,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: colors.borderLight,
              },
            ]}
          >
            <View style={[styles.avatarLarge, { backgroundColor: colors.surfaceLight, borderColor: colors.primary }]}>
              <Text style={[styles.avatarLargeText, { color: colors.primary }]}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View>
              <Text style={[styles.greetingText, { color: colors.textMuted }]}>Welcome back, Operator</Text>
              <Text style={[styles.displayName, { color: colors.text }]}>{user?.username || 'Operator'}</Text>
            </View>
          </View>
        </Card>

        {/* Live Metrics Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>⚡ LIVE SYSTEM METRICS</Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>REAL-TIME INCIDENT TELEMETRY</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="Total Incidents"
              value={stats.total}
              color="cyan"
              icon={<Ionicons name="analytics-outline" size={16} color={colors.cyan} />}
              onPress={() => navigation.navigate(ticketsRoute)}
            />
          </View>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="Awaiting Triage"
              value={stats.pending}
              color="amber"
              icon={<Ionicons name="time-outline" size={16} color={colors.amber} />}
              onPress={() => navigation.navigate(ticketsRoute)}
            />
          </View>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="In Field View"
              value={stats.assigned}
              color="violet"
              icon={<Ionicons name="construct-outline" size={16} color={colors.violet} />}
              onPress={() => navigation.navigate(ticketsRoute)}
            />
          </View>
          <View style={[styles.gridItem, { width: cardWidthPercent }]}>
            <StatCard
              title="Resolved Units"
              value={stats.closed}
              color="green"
              icon={<Ionicons name="checkmark-done-outline" size={16} color={colors.green} />}
              onPress={() => navigation.navigate(ticketsRoute)}
            />
          </View>
        </View>

        {/* Quick Action Consoles */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🚀 QUICK ACTION CONSOLE</Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>DIRECT OPERATIONAL ACCESS</Text>
        </View>

        <View style={styles.actionsGrid}>
          {actionLinks.map((link) => (
            <View
              key={link.route}
              style={[
                styles.gridItem,
                { width: actionWidthPercent },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.actionCard,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight },
                  link.highlight && {
                    borderColor: colors.primary,
                    backgroundColor: isDark ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 131, 158, 0.06)',
                  },
                  pressed && styles.cardPressed,
                ]}
                onPress={() => navigation.navigate(link.route)}
              >
                <View style={styles.actionTop}>
                  <View
                    style={[
                      styles.actionIconBox,
                      { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 131, 158, 0.1)' },
                      link.highlight && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons
                      name={link.icon}
                      size={20}
                      color={link.highlight ? (isDark ? '#040810' : '#ffffff') : colors.primary}
                    />
                  </View>
                  {link.tag && (
                    <View
                      style={[
                        styles.tagBadge,
                        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: colors.textSecondary }]}>{link.tag}</Text>
                    </View>
                  )}
                  <Ionicons name="arrow-forward" size={16} color={colors.textMuted} style={styles.arrow} />
                </View>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{link.label}</Text>
                <Text style={[styles.actionDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {link.desc}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Recent Incidents Feed */}
        {recentTickets.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>📡 RECENT INCIDENTS</Text>
                <Text style={[styles.sectionSub, { color: colors.textMuted }]}>LATEST ACTIVITY LOG</Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate(ticketsRoute)}
                style={styles.viewAllBtn}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.recentTicketsList}>
              {recentTickets.map((ticket) => (
                <Pressable
                  key={ticket._id}
                  style={({ pressed }) => [
                    styles.ticketCard,
                    { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => navigation.navigate('ComplaintTracking', { complaintId: ticket._id, complaint: ticket })}
                >
                  <View style={styles.ticketTopRow}>
                    <View style={styles.locationContainer}>
                      <Ionicons name="business-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.ticketLocation, { color: colors.text }]}>
                        {ticket.blockName} • {ticket.roomNumber}
                      </Text>
                    </View>
                    <Badge status={ticket.status} size="sm" />
                  </View>

                  <Text style={[styles.ticketCategory, { color: colors.primary }]}>{ticket.complaintType}</Text>
                  <Text style={[styles.ticketRemarks, { color: colors.textSecondary }]} numberOfLines={2}>
                    {ticket.remarks || 'No detailed remarks submitted.'}
                  </Text>

                  <View style={[styles.ticketBottomRow, { borderTopColor: colors.borderLight }]}>
                    <Text style={[styles.ticketDate, { color: colors.textMuted }]}>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.ticketBy, { color: colors.textSecondary }]}>
                      By: {ticket.createdBy?.username || 'Anonymous'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
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
  heroCard: {
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
    gap: 8,
  },
  heroBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  heroBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  userRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    marginRight: 6,
  },
  userRoleText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.lg,
    maxWidth: 680,
  },
  userGreetingPod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarLargeText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  greetingText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  displayName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
    marginBottom: SPACING.lg,
  },
  gridItem: {
    padding: SPACING.xs,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
    marginBottom: SPACING.xl,
  },
  actionCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  actionCardHighlight: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  actionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightIconBox: {
    backgroundColor: COLORS.primary,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.sm,
    marginLeft: 8,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  arrow: {
    marginLeft: 'auto',
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  recentSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  recentTicketsList: {
    gap: SPACING.sm,
  },
  ticketCard: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketLocation: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  ticketCategory: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  ticketRemarks: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  ticketBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },
  ticketDate: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  ticketBy: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});

export default HomeScreen;
