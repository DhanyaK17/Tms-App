import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  complaintService,
  blockService,
  roomService,
  departmentService,
} from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingScreen from '../components/LoadingScreen';
import { useResponsive } from '../utils/responsive';

const COMPLAINT_TYPES = [
  'PC Hardware',
  'PC Software',
  'Application Issues',
  'Network',
  'Electronics',
  'Plumbing',
  'Other',
];

export const ComplaintFormScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const { isSmallMobile } = useResponsive();

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [blockId, setBlockId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [customRoomNumber, setCustomRoomNumber] = useState('');
  const [type, setType] = useState(COMPLAINT_TYPES[0]);
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState(null);

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');



  // Load Departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const resp = await departmentService.getAll();
        setDepartments(resp.data || []);
      } catch (err) {
        setError('Failed to initialize departmental links.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchDepartments();
  }, []);

  // Load Blocks when Department changes
  useEffect(() => {
    if (!departmentId) {
      setBlocks([]);
      setBlockId('');
      return;
    }
    const fetchBlocks = async () => {
      try {
        const resp = await blockService.getAll({ departmentId });
        setBlocks(resp.data || []);
      } catch (err) {
        setError('Structural block retrieval failed.');
      }
    };
    fetchBlocks();
    setBlockId('');
    setRoomId('');
    setRooms([]);
  }, [departmentId]);

  // Load Rooms when Block changes
  useEffect(() => {
    if (!blockId) {
      setRooms([]);
      setRoomId('');
      return;
    }
    const fetchRooms = async () => {
      try {
        const resp = await roomService.getAll({ blockId });
        setRooms(resp.data || []);
      } catch (err) {
        setError('Facility directory access error.');
      }
    };
    fetchRooms();
    setRoomId('');
  }, [blockId]);

  // Permission Check
  if (user && !['SuperAdmin', 'User'].includes(user.role)) {
    return (
      <View style={styles.deniedContainer}>
        <View style={styles.deniedBox}>
          <Ionicons name="lock-closed-outline" size={48} color={COLORS.red} />
          <Text style={styles.deniedTitle}>Security Restriction</Text>
          <Text style={styles.deniedDesc}>
            Your clearance level ({user.role}) does not permit incident ticket creation.
          </Text>
          <Button
            title="Return to Dashboard"
            onPress={() => navigation.navigate('Home')}
            variant="outline"
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </View>
    );
  }

  // File Picker
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          file: asset.file, // present on web
        });
      }
    } catch (err) {
      console.warn('Document picker error:', err);
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll access is needed to upload photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop() || 'evidence.jpg';
        setAttachment({
          uri: asset.uri,
          name: fileName,
          type: 'image/jpeg',
          file: asset.file,
        });
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!departmentId) {
      setError('Target Department is required.');
      return;
    }
    if (!blockId) {
      setError('Structural Block is required.');
      return;
    }

    const selectedDepartment = departments.find((d) => d._id === departmentId);
    const selectedBlock = blocks.find((b) => b._id === blockId);
    const selectedRoom = rooms.find((r) => r._id === roomId);

    const finalRoomNumber =
      roomId === '__manual__' ? customRoomNumber.trim() : selectedRoom?.roomNumber || '';

    if (!finalRoomNumber) {
      setError('Valid facility room identifier required.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('departmentName', selectedDepartment?.name || '');
      formData.append('programmeName', selectedBlock?.programme?.name || '');
      formData.append('blockName', selectedBlock?.name || '');
      formData.append('roomNumber', finalRoomNumber);
      formData.append('complaintType', type);
      formData.append('remarks', remarks.trim());

      if (user?.id || user?._id) {
        formData.append('userId', user.id || user._id);
      }

      if (attachment) {
        if (Platform.OS === 'web' && attachment.file) {
          formData.append('attachment', attachment.file);
        } else {
          formData.append('attachment', {
            uri: attachment.uri,
            name: attachment.name,
            type: attachment.type,
          });
        }
      }

      const res = await complaintService.create(formData);
      setSuccess('Incident reported successfully!');
      const newComplaint = res.data?.complaint;
      setTimeout(() => {
        if (newComplaint && newComplaint._id) {
          navigation.navigate('ComplaintTracking', {
            complaintId: newComplaint._id,
            complaint: newComplaint,
          });
        } else {
          navigation.navigate('Home');
        }
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Transmission failure. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData && departments.length === 0) {
    return <LoadingScreen message="INITIALIZING INCIDENT FORM..." />;
  }



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, isSmallMobile && { padding: SPACING.sm }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Report Incident</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Submit a maintenance or technical request to the facility response group
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.red} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.green} style={{ marginRight: 8 }} />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        <Card style={[styles.formCard, isSmallMobile && { padding: SPACING.md }]} glow>
          {/* Department Picker */}
          <Text style={styles.fieldLabel}>Target Department *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
            {departments.map((d) => (
              <Pressable
                key={d._id}
                style={[styles.pill, departmentId === d._id && styles.pillActive]}
                onPress={() => setDepartmentId(d._id)}
              >
                <Text style={[styles.pillText, departmentId === d._id && styles.pillTextActive]}>
                  {d.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Block Picker */}
          <Text style={styles.fieldLabel}>Sector / Block *</Text>
          {blocks.length === 0 ? (
            <Text style={styles.hintText}>
              {departmentId ? 'No blocks mapped to this department' : 'Select a department first'}
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
              {blocks.map((b) => (
                <Pressable
                  key={b._id}
                  style={[styles.pill, blockId === b._id && styles.pillActive]}
                  onPress={() => setBlockId(b._id)}
                >
                  <Text style={[styles.pillText, blockId === b._id && styles.pillTextActive]}>
                    {b.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Room Picker */}
          <Text style={styles.fieldLabel}>Facility / Room *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
            {rooms.map((r) => (
              <Pressable
                key={r._id}
                style={[styles.pill, roomId === r._id && styles.pillActive]}
                onPress={() => setRoomId(r._id)}
              >
                <Text style={[styles.pillText, roomId === r._id && styles.pillTextActive]}>
                  {r.roomNumber}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.pill, roomId === '__manual__' && styles.pillActive]}
              onPress={() => setRoomId('__manual__')}
            >
              <Text style={[styles.pillText, roomId === '__manual__' && styles.pillTextActive]}>
                + Manual Room
              </Text>
            </Pressable>
          </ScrollView>

          {roomId === '__manual__' && (
            <Input
              label="Custom Room Identifier *"
              value={customRoomNumber}
              onChangeText={setCustomRoomNumber}
              placeholder="e.g. LAB-001 or HALLWAY-B"
              style={{ marginTop: SPACING.sm }}
            />
          )}

          {/* Service Category */}
          <Text style={styles.fieldLabel}>Service Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillList}>
            {COMPLAINT_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[styles.pill, type === t && styles.pillActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.pillText, type === t && styles.pillTextActive]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Description / Remarks */}
          <Input
            label="Description of Incident"
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Describe the operational fault, symptoms, or error..."
            multiline
            numberOfLines={4}
            style={{ marginTop: SPACING.md }}
          />

          {/* Evidence Upload */}
          <Text style={styles.fieldLabel}>Evidence Documentation</Text>
          <View style={styles.uploadZone}>
            <View style={styles.uploadButtonRow}>
              <Button
                title="Attach Document / PDF"
                onPress={handlePickDocument}
                variant="secondary"
                size="sm"
                icon={<Ionicons name="document-attach-outline" size={16} color={COLORS.primary} />}
              />
              <Button
                title="Attach Photo"
                onPress={handlePickImage}
                variant="secondary"
                size="sm"
                icon={<Ionicons name="image-outline" size={16} color={COLORS.primary} />}
              />
            </View>

            {attachment && (
              <View style={styles.attachmentBadge}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.green} style={{ marginRight: 6 }} />
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment.name}
                </Text>
                <Pressable onPress={() => setAttachment(null)} hitSlop={8} style={{ marginLeft: 8 }}>
                  <Ionicons name="close-circle" size={18} color={COLORS.red} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Submit */}
          <Button
            title={submitting ? 'Transmitting Request...' : 'Initiate Request'}
            onPress={handleSubmit}
            loading={submitting}
            variant="primary"
            size="lg"
            style={{ marginTop: SPACING.xl }}
            icon={<Ionicons name="paper-plane-outline" size={18} color="#040810" />}
          />
        </Card>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 3,
  },
  innerContainer: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    marginBottom: SPACING.lg,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
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
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  successText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  formCard: {
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  pillList: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  pill: {
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 8,
    marginBottom: 6,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
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
  hintText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  uploadZone: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: 4,
  },
  uploadButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
  },
  attachmentName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 220,
  },
  deniedContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  deniedBox: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 400,
    width: '100%',
  },
  deniedTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: SPACING.md,
  },
  deniedDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});

export default ComplaintFormScreen;
