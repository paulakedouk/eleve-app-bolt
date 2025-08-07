import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Mail,
  Users,
  Clock,
} from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { RootStackParamList } from '../../../shared/types';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import BackButton from '../../../shared/components/BackButton';

type ReviewApprovalsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ReviewApprovals'>;

interface RouteParams {
  organizationId: string;
}

// Design system colors (matching AdminHomeScreen)
const DESIGN_COLORS = {
  coach: '#FFC900',
  parent: '#91A8EB',
  partners: '#55C1C3',
  approvals: '#FF5A34',
  tricks: '#91DEF1',
  black: '#000000',
  negative: '#ff7c7c',
  positive: '#bdffc6',
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  backgroundSecondary: '#dcdcdc',
};

// Typography styles (matching AdminHomeScreen)
const TYPOGRAPHY = {
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    fontWeight: "500" as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonTitle: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 18,
    fontWeight: "900" as const,
    textTransform: 'uppercase',
  },
  header: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 24,
    fontWeight: "900" as const,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

// Logo SVG (matching AdminHomeScreen)
const logoSvg = `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="25" cy="25" r="25" fill="black"/>
<rect x="8" y="18" width="34" height="8" rx="2" fill="white"/>
<rect x="8" y="28" width="34" height="6" rx="2" fill="#E53E3E"/>
</svg>`;

interface PendingApproval {
  id: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  age: number;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  submittedAt: Date;
  profileImage?: string;
  notes?: string;
}

const ReviewApprovalsScreen: React.FC = () => {
  const navigation = useNavigation<ReviewApprovalsScreenNavigationProp>();
  const route = useRoute();
  const { organizationId } = (route.params as RouteParams) || {};

  const [activeTab, setActiveTab] = useState('Home');
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Mock data for demonstration
  const mockApprovals: PendingApproval[] = [
    {
      id: '1',
      studentName: 'Alex Johnson',
      parentName: 'Sarah Johnson',
      parentEmail: 'sarah.johnson@email.com',
      age: 12,
      skillLevel: 'Beginner',
      submittedAt: new Date('2024-01-15T14:30:00'),
      notes: 'Alex is very excited to start skateboarding and has been practicing with friends.',
    },
    {
      id: '2',
      studentName: 'Emma Davis',
      parentName: 'Mike Davis',
      parentEmail: 'mike.davis@email.com',
      age: 15,
      skillLevel: 'Intermediate',
      submittedAt: new Date('2024-01-14T09:15:00'),
      notes: 'Emma has been skateboarding for 2 years and wants to learn more advanced tricks.',
    },
    {
      id: '3',
      studentName: 'Jordan Smith',
      parentName: 'Lisa Smith',
      parentEmail: 'lisa.smith@email.com',
      age: 10,
      skillLevel: 'Beginner',
      submittedAt: new Date('2024-01-13T16:45:00'),
      notes: 'Jordan is new to skateboarding but very enthusiastic about learning.',
    },
  ];

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // TODO: Replace with actual API call
      // const approvals = await getPendingStudentApprovals(organizationId);

      // Simulate API call
      setTimeout(() => {
        setPendingApprovals(mockApprovals);
        setLoading(false);
        setRefreshing(false);
      }, 1000);

    } catch (error) {
      console.error('Error loading pending approvals:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    setProcessingId(approvalId);
    try {
      // TODO: Implement actual approval service
      // await approveStudentRequest(approvalId);

      // Simulate API call
      setTimeout(() => {
        setPendingApprovals(prev => prev.filter(approval => approval.id !== approvalId));
        setProcessingId(null);
        Alert.alert('Success', 'Student has been approved and added to your academy!');
      }, 1500);

    } catch (error) {
      console.error('Error approving student:', error);
      setProcessingId(null);
      Alert.alert('Error', 'Failed to approve student. Please try again.');
    }
  };

  const handleDeny = async (approvalId: string) => {
    Alert.alert(
      'Deny Request',
      'Are you sure you want to deny this student request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deny',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(approvalId);
            try {
              // TODO: Implement actual denial service
              // await denyStudentRequest(approvalId);

              // Simulate API call
              setTimeout(() => {
                setPendingApprovals(prev => prev.filter(approval => approval.id !== approvalId));
                setProcessingId(null);
                Alert.alert('Request Denied', 'The student request has been denied.');
              }, 1500);

            } catch (error) {
              console.error('Error denying student:', error);
              setProcessingId(null);
              Alert.alert('Error', 'Failed to deny student request. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    console.log('Back button pressed');
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('AdminHome');
      }
    } catch (error) {
      console.error('Error navigating back:', error);
      navigation.navigate('AdminHome');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return DESIGN_COLORS.tricks;
      case 'Intermediate': return DESIGN_COLORS.coach;
      case 'Advanced': return DESIGN_COLORS.approvals;
      default: return DESIGN_COLORS.textSecondary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DESIGN_COLORS.approvals} />
          <Text style={styles.loadingText}>Loading approvals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={DESIGN_COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={handleBack}
          variant="simple"
          title=""
          iconSize={20}
          iconColor={DESIGN_COLORS.black}
          style={styles.backButton}
        />
        <View style={styles.headerContent}>
         <Text style={styles.headerTitle}>REVIEW APPROVALS</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPendingApprovals(true)}
            colors={[DESIGN_COLORS.approvals]}
            tintColor={DESIGN_COLORS.approvals}
          />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock size={24} color={DESIGN_COLORS.black} />
            </View>
            <Text style={styles.statNumber}>{pendingApprovals.length}</Text>
            <Text style={styles.statLabel}>PENDING APPROVALS</Text>
          </View>
        </View>

        {/* Approvals List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STUDENT APPROVAL REQUESTS</Text>

          {pendingApprovals.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle size={48} color={DESIGN_COLORS.textSecondary} />
              <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
              <Text style={styles.emptyStateText}>No pending student approvals at this time.</Text>
            </View>
          ) : (
            <View style={styles.approvalsList}>
              {pendingApprovals.map((approval) => (
                <View key={approval.id} style={styles.approvalCard}>
                  <View style={styles.approvalHeader}>
                    <View style={styles.studentInfo}>
                      <View style={styles.studentAvatar}>
                        {approval.profileImage ? (
                          <Image source={{ uri: approval.profileImage }} style={styles.avatarImage} />
                        ) : (
                          <User size={24} color={DESIGN_COLORS.textSecondary} />
                        )}
                      </View>
                      <View style={styles.studentDetails}>
                        <Text style={styles.studentName}>{approval.studentName}</Text>
                        <Text style={styles.studentAge}>Age: {approval.age}</Text>
                      </View>
                    </View>
                    <View style={styles.submissionInfo}>
                      <View style={[styles.skillLevelBadge, { backgroundColor: getSkillLevelColor(approval.skillLevel) }]}>
                        <Text style={styles.skillLevelText}>{approval.skillLevel}</Text>
                      </View>
                      <Text style={styles.submissionDate}>{formatDate(approval.submittedAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.parentInfo}>
                    <View style={styles.parentDetail}>
                      <Users size={16} color={DESIGN_COLORS.textSecondary} />
                      <Text style={styles.parentText}>{approval.parentName}</Text>
                    </View>
                    <View style={styles.parentDetail}>
                      <Mail size={16} color={DESIGN_COLORS.textSecondary} />
                      <Text style={styles.parentText}>{approval.parentEmail}</Text>
                    </View>
                  </View>

                  {approval.notes && (
                    <View style={styles.notesSection}>
                      <Text style={styles.notesTitle}>NOTES:</Text>
                      <Text style={styles.notesText}>{approval.notes}</Text>
                    </View>
                  )}

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.denyButton]}
                      onPress={() => handleDeny(approval.id)}
                      disabled={processingId === approval.id}
                      activeOpacity={0.7}
                    >
                      {processingId === approval.id ? (
                        <ActivityIndicator size="small" color={DESIGN_COLORS.black} />
                      ) : (
                        <XCircle size={20} color={DESIGN_COLORS.black} />
                      )}
                      <Text style={styles.actionButtonText}>DENY</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(approval.id)}
                      disabled={processingId === approval.id}
                      activeOpacity={0.7}
                    >
                      {processingId === approval.id ? (
                        <ActivityIndicator size="small" color={DESIGN_COLORS.black} />
                      ) : (
                        <CheckCircle size={20} color={DESIGN_COLORS.black} />
                      )}
                      <Text style={styles.actionButtonText}>APPROVE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} userRole="admin" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 88,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: DESIGN_COLORS.textSecondary,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: DESIGN_COLORS.background,
  },
  backButton: {
    width: 44,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.sectionTitle.fontFamily,
    fontWeight: TYPOGRAPHY.sectionTitle.fontWeight,
    color: DESIGN_COLORS.text,
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 44,
    //flex: 1,
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    shadowColor: DESIGN_COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    padding: 20,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: DESIGN_COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statNumber: {
    fontSize: 32,
    fontFamily: TYPOGRAPHY.header.fontFamily,
    fontWeight: TYPOGRAPHY.header.fontWeight,
    color: DESIGN_COLORS.text,
    marginRight: 16,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.sectionTitle.fontFamily,
    fontWeight: TYPOGRAPHY.sectionTitle.fontWeight,
    color: DESIGN_COLORS.text,
    textTransform: 'uppercase',
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.sectionTitle.fontFamily,
    fontWeight: TYPOGRAPHY.sectionTitle.fontWeight,
    color: DESIGN_COLORS.text,
    marginBottom: 16,
    letterSpacing: TYPOGRAPHY.sectionTitle.letterSpacing,
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.header.fontFamily,
    fontWeight: TYPOGRAPHY.header.fontWeight,
    color: DESIGN_COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  approvalsList: {
    gap: 16,
  },
  approvalCard: {
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    shadowColor: DESIGN_COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    overflow: 'hidden',
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: DESIGN_COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_COLORS.black,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 100,
    backgroundColor: DESIGN_COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    shadowColor: DESIGN_COLORS.black,
    shadowOffset: { width: 3, height: 3 },
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 100,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.buttonTitle.fontFamily,
    fontWeight: TYPOGRAPHY.buttonTitle.fontWeight,
    color: DESIGN_COLORS.text,
    marginBottom: 4,
  },
  studentAge: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.textSecondary,
    marginBottom: 4,
  },
  skillLevelBadge: {
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  skillLevelText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.black,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  submissionInfo: {
    alignItems: 'flex-end',
  },
  submissionDate: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.textSecondary,
  },
  parentInfo: {
    padding: 16,
    gap: 8,
  },
  parentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  parentText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.textSecondary,
  },
  notesSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: DESIGN_COLORS.background,
  },
  notesTitle: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.sectionTitle.fontFamily,
    fontWeight: TYPOGRAPHY.sectionTitle.fontWeight,
    color: DESIGN_COLORS.text,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    gap: 8,
  },
  denyButton: {
    backgroundColor: DESIGN_COLORS.negative,
  },
  approveButton: {
    backgroundColor: DESIGN_COLORS.positive,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.buttonTitle.fontFamily,
    fontWeight: TYPOGRAPHY.buttonTitle.fontWeight,
    color: DESIGN_COLORS.black,
    textTransform: 'uppercase',
  },
});

export default ReviewApprovalsScreen; 