import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
  Linking,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { complaintService, FILE_BASE_URL } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../constants/theme';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import ModalView from '../components/ModalView';
import { useResponsive } from '../utils/responsive';
import socketService from '../services/socketService';

// Status Workflow Stages
const WORKFLOW_STAGES = [
  {
    key: 'Pending',
    stepNumber: 1,
    title: 'Pending',
    subtitle: 'Complaint registered',
    desc: 'Ticket logged in central registry, awaiting triage & assignment',
    icon: 'time-outline',
  },
  {
    key: 'Assigned',
    stepNumber: 2,
    title: 'Assigned',
    subtitle: 'Staff assigned',
    desc: 'Specialized personnel dispatched to investigate issue',
    icon: 'person-add-outline',
  },
  {
    key: 'In-Progress',
    stepNumber: 3,
    title: 'In Progress',
    subtitle: 'Staff is working on the complaint',
    desc: 'Technician is actively resolving and performing maintenance',
    icon: 'construct-outline',
  },
  {
    key: 'Completed',
    stepNumber: 4,
    title: 'Resolved',
    subtitle: 'Complaint successfully completed',
    desc: 'Issue addressed, verified, and ticket formally closed',
    icon: 'checkmark-done-circle-outline',
  },
];

export const ComplaintTrackingScreen = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const { isMobile, width } = useResponsive();

  const complaintId = route.params?.complaintId || route.params?.id;

  const [complaint, setComplaint] = useState(route.params?.complaint || null);
  const [loading, setLoading] = useState(!complaint);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [livePulse, setLivePulse] = useState(false);
  const [realtimeNotification, setRealtimeNotification] = useState('');

  // Animation for live radar pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Fetch real complaint from backend
  const fetchComplaint = useCallback(async (showIndicator = false) => {
    if (!complaintId) return;
    if (showIndicator) setLoading(true);
    try {
      const res = await complaintService.getById(complaintId);
      setComplaint(res.data);
      setError('');
    } catch (err) {
      console.warn('Failed to fetch complaint tracking details:', err);
      setError(err.response?.data?.message || 'Unable to retrieve ticket tracking records.');
    } finally {
      if (showIndicator) setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchComplaint(!complaint);
  }, [fetchComplaint, complaint]);

  // Real-time Socket.IO connection & Room Joining
  useEffect(() => {
    if (!complaintId) return;

    // Join room for this specific complaint
    socketService.joinComplaintRoom(complaintId);
    const socket = socketService.getSocket();

    const handleUpdate = (updatedData) => {
      if (
        updatedData &&
        (String(updatedData._id) === String(complaintId) ||
          String(updatedData.id) === String(complaintId))
      ) {
        setComplaint(updatedData);
        setLivePulse(true);
        setRealtimeNotification(`Status updated: ${updatedData.status}`);
        setTimeout(() => setRealtimeNotification(''), 4000);
        setTimeout(() => setLivePulse(false), 3000);
      }
    };

    if (socket) {
      socket.on('complaint_updated', handleUpdate);
      socket.on('complaint_status_changed', (data) => {
        if (data && String(data.complaintId) === String(complaintId)) {
          if (data.complaint) {
            setComplaint(data.complaint);
          } else {
            fetchComplaint(false);
          }
          setLivePulse(true);
          setRealtimeNotification(`Status changed to ${data.status}`);
          setTimeout(() => setRealtimeNotification(''), 4000);
          setTimeout(() => setLivePulse(false), 3000);
        }
      });
    }

    // Polling fallback every 12 seconds in case socket drops
    const interval = setInterval(() => {
      fetchComplaint(false);
    }, 12000);

    return () => {
      clearInterval(interval);
      socketService.leaveComplaintRoom(complaintId);
      if (socket) {
        socket.off('complaint_updated', handleUpdate);
        socket.off('complaint_status_changed');
      }
    };
  }, [complaintId, fetchComplaint]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaint(false);
    setRefreshing(false);
  };

  // Determine stage progression index (1-based)
  const getCurrentStageIndex = (status) => {
    switch (status) {
      case 'Pending':
        return 1;
      case 'Assigned':
        return 2;
      case 'In-Progress':
        return 3;
      case 'Completed':
      case 'Resolved':
        return 4;
      case 'Onhold':
        return 2.5; // On hold is between assigned and resolved
      default:
        return 1;
    }
  };

  const currentStageIndex = getCurrentStageIndex(complaint?.status);

  if (loading && !complaint) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          CONNECTING TO LIVE TELEMETRY RADAR...
        </Text>
      </View>
    );
  }

  if (error && !complaint) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={54} color={colors.red} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Tracking Unavailable</Text>
        <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>{error}</Text>
        <Button
          title="Return to Tickets"
          onPress={() => navigation.goBack()}
          variant="primary"
          style={{ marginTop: SPACING.md }}
        />
      </View>
    );
  }

  const assignedStaff = complaint?.assignedTo;
  const creator = complaint?.createdBy;
  const isResolved = complaint?.status === 'Completed';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.innerContainer}>
        {/* Back and Top Navigation Row */}
        <View style={styles.topNavRow}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
            <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
          </Pressable>

          {/* Live Status indicator capsule */}
          <View
            style={[
              styles.liveIndicatorBadge,
              {
                backgroundColor: livePulse ? 'rgba(0, 229, 255, 0.2)' : colors.surfaceLight,
                borderColor: livePulse ? colors.primary : colors.borderLight,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.liveDot,
                {
                  backgroundColor: colors.green,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <Text style={[styles.liveIndicatorText, { color: colors.textSecondary }]}>
              LIVE TELEMETRY ACTIVE
            </Text>
          </View>
        </View>

        {/* Real-time Banner */}
        {realtimeNotification ? (
          <View style={[styles.realtimeBanner, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}>
            <Ionicons name="flash" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.realtimeBannerText, { color: colors.primary }]}>
              {realtimeNotification}
            </Text>
          </View>
        ) : null}

        {/* Hero Complaint Card */}
        <Card style={[styles.heroCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.idRow}>
                <Text style={[styles.ticketId, { color: colors.primary }]}>
                  #{complaint?._id?.toString().toUpperCase()}
                </Text>
                <Badge status={complaint?.status} size="sm" style={{ marginLeft: 8 }} />
              </View>
              <Text style={[styles.complaintType, { color: colors.text }]}>
                {complaint?.complaintType || 'General Service Request'}
              </Text>
            </View>

            <View style={styles.dateBlock}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {complaint?.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'Recent'}
              </Text>
            </View>
          </View>

          {/* Location Grid */}
          <View style={[styles.locationGrid, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}>
            <View style={styles.locItem}>
              <Ionicons name="cube-outline" size={15} color={colors.primary} />
              <Text style={[styles.locLabel, { color: colors.textMuted }]}>Block</Text>
              <Text style={[styles.locValue, { color: colors.text }]}>{complaint?.blockName || 'N/A'}</Text>
            </View>
            <View style={[styles.locDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.locItem}>
              <Ionicons name="key-outline" size={15} color={colors.cyan} />
              <Text style={[styles.locLabel, { color: colors.textMuted }]}>Room</Text>
              <Text style={[styles.locValue, { color: colors.text }]}>{complaint?.roomNumber || 'N/A'}</Text>
            </View>
            {complaint?.departmentName ? (
              <>
                <View style={[styles.locDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.locItem}>
                  <Ionicons name="business-outline" size={15} color={colors.violet} />
                  <Text style={[styles.locLabel, { color: colors.textMuted }]}>Dept</Text>
                  <Text style={[styles.locValue, { color: colors.text }]}>{complaint.departmentName}</Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Remarks */}
          {complaint?.remarks ? (
            <View style={styles.remarksBox}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Description & Remarks</Text>
              <Text style={[styles.remarksText, { color: colors.text }]}>{complaint.remarks}</Text>
            </View>
          ) : null}

          {/* Evidence Attachment */}
          {complaint?.attachment ? (
            <View style={styles.attachmentBox}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Attached Evidence</Text>
              <Pressable
                style={[styles.attachmentRow, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}
                onPress={() => {
                  const url = complaint.attachment.startsWith('http')
                    ? complaint.attachment
                    : `${FILE_BASE_URL}${complaint.attachment}`;
                  Linking.openURL(url);
                }}
              >
                <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
                <Text style={[styles.attachmentText, { color: colors.primary }]} numberOfLines={1}>
                  View Attached Photo / Document
                </Text>
                <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          ) : null}
        </Card>

        {/* ========================================================= */}
        {/* VISUAL WORKFLOW TIMELINE TRACKER                         */}
        {/* ========================================================= */}
        <Card style={[styles.timelineCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
          <View style={styles.timelineHeader}>
            <View style={styles.timelineHeaderLeft}>
              <Ionicons name="git-network-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.timelineTitle, { color: colors.text }]}>Resolution Workflow Timeline</Text>
            </View>
            <Badge status={complaint?.status} size="sm" />
          </View>

          <Text style={[styles.timelineDesc, { color: colors.textSecondary }]}>
            Live 4-stage tracking protocol automatically synchronized with centralized dispatch telemetry
          </Text>

          <View style={styles.timelineContainer}>
            {WORKFLOW_STAGES.map((stage, idx) => {
              const isPast = stage.stepNumber < currentStageIndex;
              const isCurrent =
                stage.stepNumber === Math.floor(currentStageIndex) ||
                (stage.key === 'Completed' && isResolved);
              const isFuture = stage.stepNumber > currentStageIndex && !isCurrent;
              const isLast = idx === WORKFLOW_STAGES.length - 1;

              let circleBg = colors.surfaceLight;
              let circleBorder = colors.borderLight;
              let iconColor = colors.textMuted;
              let barColor = colors.borderLight;

              if (isPast) {
                circleBg = colors.green;
                circleBorder = colors.green;
                iconColor = '#ffffff';
                barColor = colors.green;
              } else if (isCurrent) {
                circleBg = colors.primary;
                circleBorder = colors.primary;
                iconColor = colors.textDark;
                barColor = colors.borderLight;
              }

              return (
                <View key={stage.key} style={styles.stageRow}>
                  {/* Left Column: Number Node and Connecting Line */}
                  <View style={styles.nodeColumn}>
                    <View
                      style={[
                        styles.stageNode,
                        { backgroundColor: circleBg, borderColor: circleBorder },
                        isCurrent && styles.stageNodeActive,
                      ]}
                    >
                      {isPast ? (
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      ) : (
                        <Ionicons
                          name={stage.icon}
                          size={15}
                          color={iconColor}
                        />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.connectingLine,
                          { backgroundColor: isPast ? colors.green : colors.divider },
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Column: Stage Details */}
                  <View style={styles.stageContent}>
                    <View style={styles.stageTitleRow}>
                      <Text
                        style={[
                          styles.stageStepLabel,
                          {
                            color: isCurrent
                              ? colors.primary
                              : isPast
                              ? colors.green
                              : colors.textMuted,
                          },
                        ]}
                      >
                        STAGE {stage.stepNumber}: {stage.title.toUpperCase()}
                      </Text>
                      {isCurrent && (
                        <View style={[styles.activePill, { backgroundColor: `${colors.primary}20` }]}>
                          <Text style={[styles.activePillText, { color: colors.primary }]}>ACTIVE</Text>
                        </View>
                      )}
                      {isPast && (
                        <View style={[styles.completedPill, { backgroundColor: `${colors.green}20` }]}>
                          <Text style={[styles.completedPillText, { color: colors.green }]}>DONE</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.stageSubtitle, { color: colors.text }]}>
                      {stage.subtitle}
                    </Text>
                    <Text style={[styles.stageDesc, { color: colors.textSecondary }]}>
                      {stage.desc}
                    </Text>

                    {/* Stage-specific contextual data */}
                    {stage.key === 'Pending' && complaint?.createdAt && (
                      <Text style={[styles.stageMeta, { color: colors.textMuted }]}>
                        Registered: {new Date(complaint.createdAt).toLocaleString()}
                      </Text>
                    )}

                    {stage.key === 'Assigned' && assignedStaff && (
                      <View style={[styles.stageStaffChip, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}>
                        <Ionicons name="person-circle-outline" size={18} color={colors.violet} />
                        <View style={{ marginLeft: 8 }}>
                          <Text style={[styles.staffName, { color: colors.text }]}>
                            {assignedStaff.username || 'Assigned Technician'}
                          </Text>
                          <Text style={[styles.staffRole, { color: colors.textMuted }]}>
                            {assignedStaff.role || 'Staff'} {assignedStaff.email ? `• ${assignedStaff.email}` : ''}
                          </Text>
                        </View>
                      </View>
                    )}

                    {stage.key === 'Completed' && isResolved && complaint?.updatedAt && (
                      <Text style={[styles.stageMeta, { color: colors.green }]}>
                        Completed on: {new Date(complaint.updatedAt).toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Assigned Staff Detail Card (if available) */}
        {assignedStaff && (
          <Card style={[styles.staffCard, { backgroundColor: colors.surfaceCard, borderColor: colors.borderLight }]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <Text style={[styles.cardHeaderText, { color: colors.text }]}>Assigned Service Specialist</Text>
            </View>

            <View style={styles.staffProfileRow}>
              <View style={[styles.avatarBox, { backgroundColor: `${colors.primary}25` }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {assignedStaff.username?.charAt(0).toUpperCase() || 'S'}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.specialistName, { color: colors.text }]}>{assignedStaff.username}</Text>
                <Text style={[styles.specialistRole, { color: colors.textSecondary }]}>
                  {assignedStaff.role} {assignedStaff.department?.name ? `• ${assignedStaff.department.name}` : ''}
                </Text>
                {assignedStaff.email ? (
                  <Text style={[styles.specialistEmail, { color: colors.textMuted }]}>{assignedStaff.email}</Text>
                ) : null}
              </View>
            </View>
          </Card>
        )}

        {/* Footer Actions */}
        <View style={styles.footerRow}>
          <Button
            title="Refresh Status"
            variant="outline"
            onPress={() => fetchComplaint(true)}
            icon={<Ionicons name="refresh-outline" size={16} color={colors.primary} />}
            style={{ flex: 1, marginRight: SPACING.sm }}
          />
          <Button
            title="Back to Tickets"
            variant="primary"
            onPress={() => navigation.goBack()}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  innerContainer: {
    maxWidth: 860,
    width: '100%',
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: SPACING.md,
  },
  errorDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 340,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  liveIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  realtimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  realtimeBannerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketId: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  complaintType: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  locItem: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  locLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  locValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  locDivider: {
    width: 1,
    height: 30,
  },
  remarksBox: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 14,
    lineHeight: 20,
  },
  attachmentBox: {
    marginTop: SPACING.sm,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 4,
  },
  attachmentText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginHorizontal: 8,
  },
  timelineCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timelineDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 88,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 36,
  },
  stageNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stageNodeActive: {
    transform: [{ scale: 1.1 }],
  },
  connectingLine: {
    width: 2,
    flex: 1,
    minHeight: 50,
    marginVertical: 4,
  },
  stageContent: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: SPACING.md,
  },
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  stageStepLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  activePill: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  completedPill: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  stageSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
  },
  stageDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  stageMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  stageStaffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  staffName: {
    fontSize: 12,
    fontWeight: '700',
  },
  staffRole: {
    fontSize: 11,
  },
  staffCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.4,
  },
  staffProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  specialistName: {
    fontSize: 15,
    fontWeight: '800',
  },
  specialistRole: {
    fontSize: 12,
    marginTop: 1,
  },
  specialistEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
});

export default ComplaintTrackingScreen;
