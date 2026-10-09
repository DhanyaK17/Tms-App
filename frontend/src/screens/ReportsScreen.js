import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import {
  complaintService,
  departmentService,
} from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { useResponsive } from '../utils/responsive';

export const ReportsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { isSmallMobile, width } = useResponsive();
  const numCols = width >= 768 ? 2 : 1;
  const cardWidthPercent = numCols === 2 ? '50%' : '100%';

  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    department: '',
    programme: '',
    complaintType: '',
    status: '',
    assignee: '',
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = useCallback(async (filterParams) => {
    setError('');
    setLoading(true);
    try {
      const params = { ...filterParams };
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });
      const res = await complaintService.report(params);
      setResults(res.data || []);
    } catch (err) {
      setError('Intelligence query failed. Please verify criteria.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'SuperAdmin') return;
    departmentService.getAll()
      .then((d) => {
        setDepartments(d.data || []);
      })
      .catch(() => {});

    fetchReport({});
  }, [user, fetchReport]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReport(filters);
    setRefreshing(false);
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      department: '',
      programme: '',
      complaintType: '',
      status: '',
      assignee: '',
    };
    setFilters(emptyFilters);
    fetchReport(emptyFilters);
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = [
      'Date',
      'Dept',
      'Programme',
      'Block',
      'Room',
      'Type',
      'Status',
      'CreatedBy',
      'Assignee',
    ];
    const rows = results.map((r) => [
      new Date(r.createdAt).toLocaleString(),
      r.departmentName || '-',
      r.programmeName || '-',
      r.blockName,
      r.roomNumber,
      r.complaintType,
      r.status,
      r.createdBy?.username || r.createdBy?.email || '',
      r.assignedTo?.username || r.assignedTo?.email || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${('' + cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TMS_Data_Export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Export Ready', `Generated ${results.length} rows of intelligence data.`);
    }
  };

  if (user?.role !== 'SuperAdmin') {
    return (
      <View style={styles.deniedContainer}>
        <Text style={styles.deniedTitle}>SuperAdmin Clearance Required</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, isSmallMobile && { padding: SPACING.sm }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <View style={styles.innerContainer}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Intelligence & Reports</Text>
            <Text style={styles.headerSubtitle}>
              Multi-dimensional query matrix and data cluster export
            </Text>
          </View>
          <Button
            title="Export CSV ⤓"
            onPress={exportCSV}
            variant="secondary"
            size="sm"
            disabled={results.length === 0}
            icon={<Ionicons name="download-outline" size={16} color={COLORS.primary} />}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.red} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Filter Controls Card */}
        <Card style={styles.filterCard} glow>
          <Text style={styles.filterTitle}>Matrix Filter Coordinates</Text>

          {/* Department Filter */}
          <Text style={styles.fieldLabel}>Department</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
            <Pressable
              style={[styles.pill, !filters.department && styles.pillActive]}
              onPress={() => setFilters({ ...filters, department: '' })}
            >
              <Text style={[styles.pillText, !filters.department && styles.pillTextActive]}>
                All Departments
              </Text>
            </Pressable>
            {departments.map((d) => (
              <Pressable
                key={d._id}
                style={[styles.pill, filters.department === d._id && styles.pillActive]}
                onPress={() => setFilters({ ...filters, department: d._id })}
              >
                <Text
                  style={[
                    styles.pillText,
                    filters.department === d._id && styles.pillTextActive,
                  ]}
                >
                  {d.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Status Filter */}
          <Text style={styles.fieldLabel}>Status Resolution</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
            {['', 'Pending', 'Assigned', 'In-Progress', 'Completed'].map((st) => (
              <Pressable
                key={st || 'all'}
                style={[styles.pill, filters.status === st && styles.pillActive]}
                onPress={() => setFilters({ ...filters, status: st })}
              >
                <Text style={[styles.pillText, filters.status === st && styles.pillTextActive]}>
                  {st || 'All Statuses'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Action Row */}
          <View style={styles.filterActionRow}>
            <Button
              title="Generate Intelligence"
              onPress={() => fetchReport(filters)}
              loading={loading}
              variant="primary"
              size="md"
              style={{ flex: 1, minWidth: 160 }}
              icon={<Ionicons name="search-outline" size={16} color="#040810" />}
            />
            <Button
              title="Reset Matrix"
              onPress={handleResetFilters}
              variant="outline"
              size="md"
              style={{ minWidth: 100 }}
            />
          </View>
        </Card>

        {/* Results Overview */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            IDENTIFIED INCIDENTS: {results.length} RECORD{results.length === 1 ? '' : 'S'}
          </Text>
        </View>

        {results.length === 0 ? (
          <EmptyState
            icon="analytics-outline"
            title="Zero Incidents Matched"
            description="Adjust your matrix filters above to yield system complaint records."
          />
        ) : (
          <View style={styles.resultsList}>
            {results.map((r) => (
              <View key={r._id} style={[styles.gridItem, { width: cardWidthPercent }]}>
                <Card style={styles.resultCard}>
                  <View style={styles.resultTop}>
                    <View>
                      <Text style={styles.resultLocation}>
                        {r.blockName} • Room {r.roomNumber}
                      </Text>
                      <Text style={styles.resultDept}>
                        {r.departmentName || 'General'}
                      </Text>
                    </View>
                    <Badge status={r.status} />
                  </View>

                  <Text style={styles.resultType}>{r.complaintType}</Text>
                  <Text style={styles.resultRemarks} numberOfLines={2}>
                    {r.remarks || 'No remarks provided.'}
                  </Text>

                  <View style={styles.resultBottom}>
                    <Text style={styles.resultMeta}>
                      Logged: {new Date(r.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.resultMeta}>
                      By: {r.createdBy?.username || 'Unknown'}
                    </Text>
                    <Text style={[styles.resultMeta, { color: COLORS.primary }]}>
                      Assignee: {r.assignedTo?.username || 'Unassigned'}
                    </Text>
                  </View>
                </Card>
              </View>
            ))}
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
  filterCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
  },
  filterTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: 6,
    textTransform: 'uppercase',
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
  filterActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.lg,
  },
  resultsHeader: {
    marginBottom: SPACING.md,
  },
  resultsCount: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  gridItem: {
    padding: SPACING.xs,
  },
  resultCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  resultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  resultLocation: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  resultDept: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  resultType: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultRemarks: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  resultBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  resultMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  deniedContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  deniedTitle: {
    color: COLORS.red,
    fontSize: 18,
    fontWeight: '800',
  },
});

export default ReportsScreen;
