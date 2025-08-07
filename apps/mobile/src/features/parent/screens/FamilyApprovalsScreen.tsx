import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  StatusBar,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Users,
  Mail,
  Calendar,
  MessageSquare,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { supabase } from '../../../shared/lib/supabase';

type FamilyApprovalsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FamilyApprovals'>;

interface FamilyApproval {
  id: string;
  parent_id: string;
  organization_id: string;
  submitted_by: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  children_data: any[];
  parent_notes?: string;
  admin_notes?: string;
  approved_by?: string;
  approved_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  parent: {
    id: string;
    full_name: string;
    email: string;
  };
  submitted_by_profile: {
    id: string;
    full_name: string;
  };
}

const FamilyApprovalsScreen: React.FC = () => {
  const navigation = useNavigation<FamilyApprovalsNavigationProp>();
  const [approvals, setApprovals] = useState<FamilyApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<FamilyApproval | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!['business', 'admin'].includes(profile.role)) {
        throw new Error('Access denied');
      }

      const { data: approvalsData, error: approvalsError } = await supabase
        .from('family_approvals')
        .select(`
          *,
          parent:profiles!family_approvals_parent_id_fkey(
            id,
            full_name,
            email
          ),
          submitted_by_profile:profiles!family_approvals_submitted_by_fkey(
            id,
            full_name
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (approvalsError) throw approvalsError;

      setApprovals(approvalsData || []);
    } catch (error: any) {
      console.error('Error loading approvals:', error);
      Alert.alert('Error', 'Failed to load family approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approval: FamilyApproval) => {
    Alert.alert(
      'Approve Family',
      `Are you sure you want to approve the application from ${approval.parent.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => processApproval(approval, 'approved'),
          style: 'default',
        },
      ]
    );
  };

  const handleReject = async (approval: FamilyApproval) => {
    Alert.alert(
      'Reject Family',
      `Are you sure you want to reject the application from ${approval.parent.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: () => processApproval(approval, 'rejected'),
          style: 'destructive',
        },
      ]
    );
  };

  const processApproval = async (approval: FamilyApproval, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(approval.id);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const updateData: any = {
        status,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        admin_notes: adminNotes.trim() || null,
      };

      const { error: updateError } = await supabase
        .from('family_approvals')
        .update(updateData)
        .eq('id', approval.id);

      if (updateError) throw updateError;

      if (status === 'approved') {
        // Create student accounts using the onboarding service
        const { createStudentAccounts } = await import('../../../shared/services/onboardingService');
        const { sendFamilyApprovalNotification, sendStudentAccountCredentials } = await import('../../../shared/services/emailService');
        
        const studentsResult = await createStudentAccounts(approval.id, approval.children_data);
        
        if (!studentsResult.success) {
          throw new Error(studentsResult.message);
        }

        // Send approval notification email to parent
        const { data: parentProfile, error: parentError } = await supabase
          .from('parents')
          .select(`
            *,
            user:auth.users!inner(email, raw_user_meta_data),
            organization:organizations!inner(name, slug)
          `)
          .eq('id', approval.parent_id)
          .single();

        if (parentError) throw parentError;

        const organizationName = (parentProfile.organization as any)?.name || 'Academy';
        const organizationSlug = (parentProfile.organization as any)?.slug || 'academy';

        // Send approval notification
        await sendFamilyApprovalNotification(
          (parentProfile.user as any).email,
          (parentProfile.user as any).raw_user_meta_data.full_name,
          organizationName,
          'approved',
          adminNotes.trim()
        );

        // Send student credentials email
        if (studentsResult.students && studentsResult.students.length > 0) {
          await sendStudentAccountCredentials(
            (parentProfile.user as any).email,
            (parentProfile.user as any).raw_user_meta_data.full_name,
            organizationName,
            organizationSlug,
            studentsResult.students.map(student => ({
              name: student.name,
              username: student.username,
              passcode: student.passcode,
            }))
          );
        }
      } else if (status === 'rejected') {
        // Send rejection notification email to parent
        const { sendFamilyApprovalNotification } = await import('../../../shared/services/emailService');
        
        const { data: parentProfile, error: parentError } = await supabase
          .from('parents')
          .select(`
            *,
            user:auth.users!inner(email, raw_user_meta_data),
            organization:organizations!inner(name)
          `)
          .eq('id', approval.parent_id)
          .single();

        if (parentError) throw parentError;

        const organizationName = (parentProfile.organization as any)?.name || 'Academy';

        await sendFamilyApprovalNotification(
          (parentProfile.user as any).email,
          (parentProfile.user as any).raw_user_meta_data.full_name,
          organizationName,
          'rejected',
          adminNotes.trim()
        );
      }

      setSelectedApproval(null);
      setAdminNotes('');
      await loadApprovals();

      Alert.alert(
        'Success',
        `Family application ${status === 'approved' ? 'approved' : 'rejected'} successfully.`
      );
    } catch (error: any) {
      console.error('Error processing approval:', error);
      Alert.alert('Error', 'Failed to process approval');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'approved': return COLORS.success;
      case 'rejected': return COLORS.error;
      case 'expired': return COLORS.textTertiary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'expired': return AlertCircle;
      default: return Clock;
    }
  };

  const filteredApprovals = approvals.filter(approval => {
    if (filterStatus === 'all') return true;
    return approval.status === filterStatus;
  });

  const renderApprovalCard = ({ item }: { item: FamilyApproval }) => {
    const StatusIcon = getStatusIcon(item.status);
    const isExpired = new Date(item.expires_at) < new Date();
    
    return (
      <TouchableOpacity
        style={styles.approvalCard}
        onPress={() => setSelectedApproval(item)}
      >
        <View style={styles.approvalHeader}>
          <View style={styles.approvalInfo}>
            <Text style={styles.parentName}>{item.parent.full_name}</Text>
            <Text style={styles.parentEmail}>{item.parent.email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <StatusIcon size={SIZES.icon.small} color={COLORS.textInverse} />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.approvalMeta}>
          <Text style={styles.childrenCount}>
            {item.children_data.length} {item.children_data.length === 1 ? 'child' : 'children'}
          </Text>
          <Text style={styles.submittedDate}>
            Submitted {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        {isExpired && item.status === 'pending' && (
          <Text style={styles.expiredText}>Expired</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderApprovalDetail = () => {
    if (!selectedApproval) return null;

    return (
      <View style={styles.overlay}>
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Family Application</Text>
            <TouchableOpacity onPress={() => setSelectedApproval(null)}>
              <XCircle size={SIZES.icon.medium} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailContent}>
            {/* Parent Information */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Parent Information</Text>
              <View style={styles.detailRow}>
                <User size={SIZES.icon.medium} color={COLORS.textSecondary} />
                <View style={styles.detailRowContent}>
                  <Text style={styles.detailRowLabel}>Name</Text>
                  <Text style={styles.detailRowValue}>{selectedApproval.parent.full_name}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Mail size={SIZES.icon.medium} color={COLORS.textSecondary} />
                <View style={styles.detailRowContent}>
                  <Text style={styles.detailRowLabel}>Email</Text>
                  <Text style={styles.detailRowValue}>{selectedApproval.parent.email}</Text>
                </View>
              </View>
            </View>

            {/* Children Information */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Children</Text>
              {selectedApproval.children_data.map((child: any, index: number) => (
                <View key={index} style={styles.childDetailCard}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childDetails}>
                    Age: {child.age} • Level: {child.level}
                  </Text>
                  {child.notes && (
                    <Text style={styles.childNotes}>{child.notes}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Notes */}
            {selectedApproval.parent_notes && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Parent Notes</Text>
                <Text style={styles.notesText}>{selectedApproval.parent_notes}</Text>
              </View>
            )}

            {/* Admin Notes */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Admin Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes for this family..."
                value={adminNotes}
                onChangeText={setAdminNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          {selectedApproval.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(selectedApproval)}
                disabled={processingId === selectedApproval.id}
              >
                <ThumbsDown size={SIZES.icon.medium} color={COLORS.textInverse} />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(selectedApproval)}
                disabled={processingId === selectedApproval.id}
              >
                <ThumbsUp size={SIZES.icon.medium} color={COLORS.textInverse} />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <LinearGradient
        colors={[COLORS.primary, '#4A90E2']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={SIZES.icon.medium} color={COLORS.textInverse} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Family Approvals</Text>
          <Text style={styles.headerSubtitle}>
            Review and approve family applications
          </Text>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              filterStatus === filter && styles.filterTabActive
            ]}
            onPress={() => setFilterStatus(filter)}
          >
            <Text style={[
              styles.filterTabText,
              filterStatus === filter && styles.filterTabTextActive
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
              {filter === 'pending' && (
                <Text style={styles.filterCount}>
                  {' '}({approvals.filter(a => a.status === 'pending').length})
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Approvals List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading approvals...</Text>
          </View>
        ) : filteredApprovals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={SIZES.icon.xlarge} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No family applications</Text>
            <Text style={styles.emptySubtitle}>
              {filterStatus === 'all' 
                ? 'No family applications have been submitted yet'
                : `No ${filterStatus} applications found`
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredApprovals}
            renderItem={renderApprovalCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.approvalsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Approval Detail Modal */}
      {renderApprovalDetail()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.screenPadding,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.screenPadding,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textInverse,
    opacity: 0.9,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  filterTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  filterTabTextActive: {
    color: COLORS.primary,
  },
  filterCount: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textTertiary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  approvalsList: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
  },
  approvalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  approvalInfo: {
    flex: 1,
  },
  parentName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  parentEmail: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  approvalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childrenCount: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
  },
  submittedDate: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textTertiary,
  },
  expiredText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: SPACING.xs,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  detailContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    width: '90%',
    maxHeight: '80%',
    maxWidth: 500,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  detailContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  detailSection: {
    marginBottom: SPACING.xl,
  },
  detailSectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  detailRowContent: {
    marginLeft: SPACING.md,
  },
  detailRowLabel: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  detailRowValue: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  childDetailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  childName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  childDetails: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
  },
  childNotes: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
  },
});

export default FamilyApprovalsScreen; 